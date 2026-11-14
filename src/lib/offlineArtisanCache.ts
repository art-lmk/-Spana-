import { Fundi, RecommendationRequest, RecommendationResponse } from '../types';
import { rankFundis } from '../utils/recommender';
import { INITIAL_FUNDIS } from '../data/mockFundis';

const ARTISANS_CACHE_KEY = 'spana_cached_artisans_v3';
const CATEGORIES_CACHE_KEY = 'fundi_connect_cached_categories_v2';
const SKILLS_CACHE_KEY = 'fundi_connect_cached_skills_v2';
const LAST_SYNC_KEY = 'fundi_connect_cache_last_sync';

export interface CacheMetadata {
  artisanCount: number;
  categoryCount: number;
  lastSyncedAt: string;
}

/**
 * Persists artisans to browser storage
 */
export function saveCachedArtisans(fundis: Fundi[]): void {
  if (!fundis || !Array.isArray(fundis) || fundis.length === 0) return;
  try {
    localStorage.setItem(ARTISANS_CACHE_KEY, JSON.stringify(fundis));
    localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
  } catch (err) {
    console.warn('Could not cache artisans in localStorage:', err);
  }
}

/**
 * Retrieves cached artisans, with INITIAL_FUNDIS fallback if cache is empty
 */
export function getCachedArtisans(): Fundi[] {
  try {
    const raw = localStorage.getItem(ARTISANS_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Could not read cached artisans:', err);
  }
  return INITIAL_FUNDIS;
}

/**
 * Persists categories to browser storage
 */
export function saveCachedCategories(categories: any[]): void {
  if (!categories || !Array.isArray(categories) || categories.length === 0) return;
  try {
    localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(categories));
  } catch (err) {
    console.warn('Could not cache categories:', err);
  }
}

const CATEGORY_STORAGE_KEY = CATEGORIES_CACHE_KEY;

/**
 * Retrieves cached categories
 */
export function getCachedCategories(): any[] {
  try {
    const raw = localStorage.getItem(CATEGORY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn('Could not read cached categories:', err);
  }
  return [];
}

/**
 * Persists skills to browser storage
 */
export function saveCachedSkills(skills: any[]): void {
  if (!skills || !Array.isArray(skills)) return;
  try {
    localStorage.setItem(SKILLS_CACHE_KEY, JSON.stringify(skills));
  } catch (err) {
    console.warn('Could not cache skills:', err);
  }
}

/**
 * Retrieves cached skills
 */
export function getCachedSkills(): any[] {
  try {
    const raw = localStorage.getItem(SKILLS_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn('Could not read cached skills:', err);
  }
  return [];
}

/**
 * Returns cache sync metadata
 */
export function getCacheMetadata(): CacheMetadata {
  const artisans = getCachedArtisans();
  const categories = getCachedCategories();
  const lastSync = localStorage.getItem(LAST_SYNC_KEY) || new Date().toISOString();
  return {
    artisanCount: artisans.length,
    categoryCount: categories.length,
    lastSyncedAt: lastSync
  };
}

/**
 * Offline recommendation resolver:
 * Runs proximity matching and category/text filters locally on cached artisan profiles.
 */
export function resolveOfflineRecommendations(request: RecommendationRequest): RecommendationResponse {
  const cachedArtisans = getCachedArtisans();
  const ranked = rankFundis(cachedArtisans, request);

  const isExpanded = ranked.some(f => f.isDistanceExpanded);

  return {
    recommendations: ranked,
    source: 'internal_engine',
    totalFound: ranked.length,
    distanceExpanded: isExpanded,
    expandedMessage: isExpanded ? 'Displaying top verified artisans across Kenya (offline mode)' : undefined,
    userLocation: {
      lat: request.userLat,
      lng: request.userLng,
      neighborhood: 'Offline Location',
      address: 'Local Device GPS',
      city: 'Nairobi'
    },
    executionTimeMs: 12,
    modelDetails: {
      modelType: 'ServiceWorker Offline Cached Artisans & Recommender',
      weights: {
        proximity: 0.45,
        ratingAndReputation: 0.25,
        skillSemanticMatch: 0.20,
        availabilityAndSpeed: 0.10
      }
    }
  };
}

/**
 * Proactively primes the cache by requesting /api/fundis, /api/categories, and /api/skills
 * so the service worker cache and localStorage are populated.
 */
export async function primeOfflineCache(): Promise<void> {
  if (typeof window === 'undefined' || !navigator.onLine) return;

  try {
    // 1. Fetch categories
    fetch('/api/categories')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && Array.isArray(data)) saveCachedCategories(data);
      })
      .catch(() => {});

    // 2. Fetch skills
    fetch('/api/skills')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && Array.isArray(data)) saveCachedSkills(data);
      })
      .catch(() => {});

    // 3. Fetch full fundis list
    fetch('/api/fundis')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && Array.isArray(data) && data.length > 0) {
          saveCachedArtisans(data);
        }
      })
      .catch(() => {});
  } catch (err) {
    console.warn('Cache priming failed:', err);
  }
}
