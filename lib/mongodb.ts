import mongoose from 'mongoose';
import { Resolver } from 'dns/promises';

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI is not defined in .env.local');
}

async function resolveMongoSRV(uri: string): Promise<string> {
  if (!uri.startsWith('mongodb+srv://')) return uri;

  const url = new URL(uri);
  const hostname = url.hostname;
  const username = encodeURIComponent(decodeURIComponent(url.username));
  const password = encodeURIComponent(decodeURIComponent(url.password));
  const dbname = url.pathname.slice(1) || 'test';

  const resolver = new Resolver();
  resolver.setServers(['8.8.8.8', '8.8.4.4']);

  const [srvRecords, txtRecords] = await Promise.all([
    resolver.resolveSrv(`_mongodb._tcp.${hostname}`),
    resolver.resolveTxt(hostname).catch(() => [] as string[][]),
  ]);

  const hosts = srvRecords.map(r => `${r.name}:${r.port}`).join(',');
  const txtOptions = txtRecords.length > 0 ? txtRecords[0].join('') : 'authSource=admin&replicaSet=atlas-avg9cz-shard-0';

  return `mongodb://${username}:${password}@${hosts}/${dbname}?ssl=true&${txtOptions}&retryWrites=true&w=majority`;
}

let cached = (global as any).mongoose as { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn && mongoose.connection.readyState === 1) return cached.conn;

  cached.conn = null;
  cached.promise = null;

  const uri = await resolveMongoSRV(MONGODB_URI);

  cached.promise = mongoose.connect(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 0,
    connectTimeoutMS: 10000,
  }).then((m) => m);

  cached.conn = await cached.promise;
  return cached.conn;
}
