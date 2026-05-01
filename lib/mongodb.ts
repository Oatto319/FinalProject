import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI is not defined in .env.local');
}

async function resolveSRVUri(uri: string): Promise<string> {
  if (!uri.startsWith('mongodb+srv://')) return uri;

  const match = uri.match(/^mongodb\+srv:\/\/([^:]+):([^@]+)@([^/?]+)(\/[^?]*)?(\?.*)?$/);
  if (!match) return uri;

  const [, user, pass, host, path = '', query = ''] = match;
  const dbname = path.replace('/', '');

  const [srvData, txtData] = await Promise.all([
    fetch(`https://dns.google/resolve?name=_mongodb._tcp.${host}&type=SRV`).then(r => r.json()),
    fetch(`https://dns.google/resolve?name=${host}&type=TXT`).then(r => r.json()),
  ]);

  const hosts = (srvData.Answer ?? [])
    .map((r: { data: string }) => {
      const parts = r.data.trim().split(/\s+/);
      return `${parts[3].replace(/\.$/, '')}:${parts[2]}`;
    })
    .join(',');

  if (!hosts) throw new Error('No SRV records found via DoH');

  const txtOptions = (txtData.Answer ?? [])
    .map((r: { data: string }) => r.data.replace(/"/g, '').trim())
    .join('&');

  const extraQuery = query.replace(/^\?/, '');
  const fullQuery = [txtOptions, extraQuery].filter(Boolean).join('&');

  return `mongodb://${user}:${pass}@${hosts}/${dbname}?ssl=true&${fullQuery}`;
}

let cached = (global as any).mongoose as { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    const uri = await resolveSRVUri(MONGODB_URI);
    cached.promise = mongoose.connect(uri).then((m) => m);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
