/** Resolves a custom uploaded photo if present, otherwise falls back to the numbered preset avatar. */
export function resolveAvatar(entity: { avatarImage?: string | null; avatarSeed?: number | null }): string {
  return entity.avatarImage || `/img/p${entity.avatarSeed || 1}.PNG`;
}
