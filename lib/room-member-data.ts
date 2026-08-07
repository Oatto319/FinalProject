import { User, PeerEvaluation } from '@/lib/models';
import { CRITERIA_KEYS, type CriteriaKey, trimOutliers } from '@/lib/peer-evaluation';

export interface RoomMemberRef {
  name: string;
  gmail?: string;
}

const LABEL_TO_ID: Record<string, string> = {
  'programming': 'programming',
  'service': 'service',
  'customer / service': 'service',
  'presentation': 'presentation',
  'design': 'design',
  'design / creative': 'design',
};

export function resolveTemplateKey(template: string): string {
  const rawTemplate = (template ?? '').toLowerCase();
  return LABEL_TO_ID[rawTemplate] ?? rawTemplate;
}

export interface MemberTypeData {
  code: string;
  title: string;
  icon: string;
  description: string;
  jobs: string[];
  typeScores: { title: string; icon: string; score: number }[];
}

/** Batch-resolves each member's User.types[templateKey], matching by gmail first then by name (legacy members). */
export async function fetchMemberTypes(
  template: string,
  members: RoomMemberRef[]
): Promise<Record<string, MemberTypeData>> {
  const templateKey = resolveTemplateKey(template);
  const types: Record<string, MemberTypeData> = {};

  const gmails = members.filter((m) => m.gmail).map((m) => m.gmail!.toLowerCase());
  const names = members.filter((m) => !m.gmail).map((m) => m.name);

  const [usersByGmail, usersByName] = await Promise.all([
    gmails.length ? User.find({ gmail: { $in: gmails } }) : Promise.resolve([]),
    names.length ? User.find({ name: { $in: names } }) : Promise.resolve([]),
  ]);

  const gmailMap = new Map(usersByGmail.map((u: { gmail: string; toObject: () => Record<string, unknown> }) => [u.gmail, u.toObject()]));
  const nameMap = new Map(usersByName.map((u: { name: string; toObject: () => Record<string, unknown> }) => [u.name, u.toObject()]));

  for (const member of members) {
    const userData = member.gmail ? gmailMap.get(member.gmail.toLowerCase()) : nameMap.get(member.name);
    if (!userData) continue;

    const userTypes = (userData.types as Record<string, unknown>) ?? {};
    const typeResult = userTypes[templateKey];

    if (typeResult && (typeResult as { icon?: string }).icon) {
      const t = typeResult as { code: string; title: string; icon: string; description?: string; jobs?: string[]; typeScores?: { title: string; icon: string; score: number }[] };
      types[member.name] = {
        code: t.code,
        title: t.title,
        icon: t.icon,
        description: t.description ?? '',
        jobs: t.jobs ?? [],
        typeScores: t.typeScores ?? [],
      };
    }
  }

  return types;
}

export interface EvalScoreData {
  overall: number;
  leadership: number;
  count: number;
}

/** Batch-resolves each member's cross-room peer-eval aggregate (trimmed-outlier average), by toGmail. */
export async function fetchMemberEvalScores(
  members: RoomMemberRef[]
): Promise<Record<string, EvalScoreData>> {
  const namesWithoutGmail = members.filter((m) => !m.gmail).map((m) => m.name);
  const usersByName: { name: string; gmail: string }[] = namesWithoutGmail.length
    ? await User.find(
        { name: { $in: namesWithoutGmail } },
        { name: 1, gmail: 1, _id: 0 }
      ).lean()
    : [];
  const gmailByName = new Map(usersByName.map((u) => [u.name, u.gmail.toLowerCase()]));

  const resolvedGmailByMemberName = new Map<string, string>();
  for (const member of members) {
    const resolved = member.gmail?.toLowerCase() ?? gmailByName.get(member.name);
    if (resolved) resolvedGmailByMemberName.set(member.name, resolved);
  }

  const gmails = [...new Set(resolvedGmailByMemberName.values())];
  const evals: { toGmail: string; scores: Record<CriteriaKey, number> }[] = gmails.length
    ? await PeerEvaluation.find(
        { toGmail: { $in: gmails } },
        { toGmail: 1, scores: 1, _id: 0 }
      ).lean()
    : [];

  const byGmail = new Map<string, Record<CriteriaKey, number>[]>();
  for (const e of evals) {
    const list = byGmail.get(e.toGmail) ?? [];
    list.push(e.scores);
    byGmail.set(e.toGmail, list);
  }

  const scores: Record<string, EvalScoreData> = {};
  for (const member of members) {
    const resolvedGmail = resolvedGmailByMemberName.get(member.name);
    if (!resolvedGmail) continue;
    const rawList = byGmail.get(resolvedGmail);
    if (!rawList || rawList.length === 0) continue;
    const list = trimOutliers(rawList);

    const avg = (key: CriteriaKey) => list.reduce((sum, s) => sum + s[key], 0) / list.length;
    const overallAvg = CRITERIA_KEYS.reduce((sum, k) => sum + avg(k), 0) / CRITERIA_KEYS.length;
    const leadershipAvg = (avg('initiative') + avg('problemSolving') + avg('responsibility')) / 3;

    scores[member.name] = {
      overall: Math.round(overallAvg * 20),
      leadership: Math.round(leadershipAvg * 20),
      count: rawList.length,
    };
  }

  return scores;
}
