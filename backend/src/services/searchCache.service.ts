/**
 * Redis cache for search results.
 *
 * Keys embed a global "search generation" counter. Every write (upload, new version, soft
 * delete) increments the counter, so all previously cached searches become unreachable at once
 * without scanning or deleting keys; they simply expire after the TTL.
 *
 * Key: search:g<generation>:<userId>:<role>:<departmentId>:<sha1(normalized params)>
 * Role and department are part of the key so a changed role/department never sees results
 * cached for the old one.
 *
 * Every Redis failure is swallowed (logged once by the client) and treated as a cache miss.
 */
import { createHash } from 'node:crypto';
import { isRedisAvailable, redis } from '../config/redis';
import type { AuthUser } from '../types/auth';

const TTL_SECONDS = 60;
export const SEARCH_GENERATION_KEY = 'search:generation';

// Writes that happened while Redis was down could not bump the generation, so start a fresh
// one whenever the connection (re)opens; entries cached before the outage are never served.
redis.on('ready', () => {
  redis.incr(SEARCH_GENERATION_KEY).catch(() => {});
});

async function currentGeneration(): Promise<string> {
  return (await redis.get(SEARCH_GENERATION_KEY)) ?? '0';
}

async function buildKey(user: AuthUser, params: object): Promise<string> {
  const hash = createHash('sha1').update(stableStringify(params)).digest('hex');
  const generation = await currentGeneration();
  return `search:g${generation}:${user.id}:${user.role}:${user.departmentId ?? '-'}:${hash}`;
}

/** JSON with sorted keys, so equivalent params always produce the same key. */
function stableStringify(value: object): string {
  return JSON.stringify(value, (_key, v: unknown) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b)))
      : v,
  );
}

export type CacheStatus = 'HIT' | 'MISS';

/**
 * Returns the cached value for this user + params, or computes it with `load`, caches it for
 * TTL_SECONDS and returns it. Falls back to `load` alone whenever Redis is unavailable.
 */
export async function cachedSearch<T>(
  user: AuthUser,
  params: object,
  load: () => Promise<T>,
): Promise<{ data: T; cache: CacheStatus }> {
  if (!isRedisAvailable()) return { data: await load(), cache: 'MISS' };

  let key: string | undefined;
  try {
    key = await buildKey(user, params);
    const hit = await redis.get(key);
    if (hit) return { data: JSON.parse(hit) as T, cache: 'HIT' };
  } catch {
    // Treat any Redis error as a miss.
  }

  const data = await load();
  if (key) {
    redis.set(key, JSON.stringify(data), 'EX', TTL_SECONDS).catch(() => {});
  }
  return { data, cache: 'MISS' };
}

/** Invalidates every cached search (call after any document write). Never throws. */
export async function invalidateSearchCache(): Promise<void> {
  if (!isRedisAvailable()) return;
  await redis.incr(SEARCH_GENERATION_KEY).catch(() => {});
}
