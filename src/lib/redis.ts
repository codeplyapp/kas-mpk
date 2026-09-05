import { Redis } from '@upstash/redis';

// =====================================================================
// Redis Client — Koneksi ke Upstash Redis (Singapore)
// Resilient Singleton: Menggunakan credentials dari environment variable
// =====================================================================
let redisClient: Redis | null = null;

export function getRedisClient(): Redis | null {
  if (redisClient) return redisClient;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  try {
    redisClient = new Redis({
      url,
      token,
    });
    return redisClient;
  } catch (err) {
    console.warn('[Redis] Warning: Failed to initialize Redis client:', err);
    return null;
  }
}

export const redis = {
  get client() {
    return getRedisClient();
  },
};

// =====================================================================
// TTL (Time to Live) — berapa detik data disimpan di cache
// 30 detik = performa maksimal tanpa mengorbankan kesegaran data
// =====================================================================
export const CACHE_TTL = 30;

// =====================================================================
// Format Key Cache Konsisten
// =====================================================================
export const cacheKeys = {
  pembayaran: (bulan: number, tahun: number, userId?: string | null) =>
    userId ? `mpk:pembayaran:${bulan}:${tahun}:${userId}` : `mpk:pembayaran:${bulan}:${tahun}:all`,

  arusKas: (bulan?: number | null, tahun?: number | null, jenis?: string | null, kategori?: string | null, limit?: number | null) =>
    `mpk:arus-kas:${bulan || 'all'}:${tahun || 'all'}:${jenis || 'all'}:${kategori || 'all'}:${limit || 'all'}`,

  tunggakan: (bulan: number, tahun: number, komisi?: string | null) =>
    `mpk:tunggakan:${bulan}:${tahun}:${komisi || 'ALL'}`,

  anggota: () => `mpk:anggota:all`,
};

// =====================================================================
// Helper getCache & setCache dengan Error Safety
// =====================================================================
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const client = getRedisClient();
    if (!client) return null;
    const data = await client.get<T>(key);
    return data;
  } catch (err) {
    console.warn(`[Redis] getCache miss/error for key ${key}:`, err);
    return null;
  }
}

export async function setCache(key: string, value: any, ttlSeconds: number = CACHE_TTL): Promise<void> {
  try {
    const client = getRedisClient();
    if (!client) return;
    await client.set(key, value, { ex: ttlSeconds });
  } catch (err) {
    console.warn(`[Redis] setCache error for key ${key}:`, err);
  }
}

// =====================================================================
// Invalidate Cache saat Bendahara menginput atau mengubah data
// =====================================================================
export async function invalidateCache(bulan?: number, tahun?: number) {
  try {
    const client = getRedisClient();
    if (!client) return;

    // Kunci spesifik dan wildcard
    const keysToDelete: string[] = [];
    
    if (bulan && tahun) {
      keysToDelete.push(
        cacheKeys.pembayaran(bulan, tahun),
        cacheKeys.tunggakan(bulan, tahun),
        cacheKeys.tunggakan(bulan, tahun, 'ALL'),
      );
    }

    // Hapus semua cache arus-kas dan iuran terkait
    const keys = await client.keys('mpk:*');
    if (keys && keys.length > 0) {
      await client.del(...keys);
      console.log(`[Redis] Cache invalidated successfully (${keys.length} keys purged)`);
    } else if (keysToDelete.length > 0) {
      await client.del(...keysToDelete);
    }
  } catch (err) {
    console.error('[Redis] invalidateCache error:', err);
  }
}
