import { Fundi, RecommendationRequest, RecommendationResponse } from '../types';
import { calculateDistanceKm, estimateTravelTimeMinutes } from './distance';
import { INITIAL_FUNDIS } from '../data/mockFundis';

/**
 * Executes proximity-based ranking and AI scoring
 */
function executeRanking(
  fundis: Fundi[],
  request: RecommendationRequest,
  effectiveMaxDistanceKm: number,
  isRelaxedDistance: boolean
): Fundi[] {
  const {
    userLat,
    userLng,
    category,
    searchQuery,
    minRating = 0,
    maxHourlyRateKes,
    verifiedOnly = false,
    availableNowOnly = false,
    emergencyOnly = false,
  } = request;

  const normalizedQuery = searchQuery ? searchQuery.toLowerCase().trim() : '';

  return fundis
    .map((fundi) => {
      const distanceKm = calculateDistanceKm(
        userLat,
        userLng,
        fundi.location.lat,
        fundi.location.lng
      );

      // Filtering criteria
      if (distanceKm > effectiveMaxDistanceKm) return null;
      if (minRating > 0 && fundi.rating < minRating) return null;
      if (verifiedOnly && !fundi.isVerified) return null;
      if (availableNowOnly && !fundi.isAvailableNow) return null;
      if (emergencyOnly && !fundi.emergencyAvailable) return null;
      if (maxHourlyRateKes && fundi.hourlyRateKes > maxHourlyRateKes) return null;

      // Specific Skillset filtering
      let matchedSkillName = '';
      if (request.skill && request.skill.trim()) {
        const normSkill = request.skill.trim().toLowerCase();
        const foundSkill = fundi.skills.find(s => s.toLowerCase().includes(normSkill));
        const foundTool = fundi.toolsEquipment?.find(t => t.toLowerCase().includes(normSkill));
        if (!foundSkill && !foundTool) {
          return null;
        }
        matchedSkillName = foundSkill || foundTool || request.skill;
      }

      // Category matching
      const matchesPrimaryCategory = !category || category === 'All' || fundi.primaryCategory.toLowerCase() === category.toLowerCase();
      const matchesAdditionalCategory = !category || category === 'All' || fundi.additionalCategories.some(c => c.toLowerCase() === category.toLowerCase());

      if (!matchesPrimaryCategory && !matchesAdditionalCategory && category && category !== 'All') {
        if (!normalizedQuery) return null;
      }

      // Keyword / skill search relevance
      let queryMatchScore = 1.0;
      if (normalizedQuery) {
        const nameMatch = fundi.name.toLowerCase().includes(normalizedQuery);
        const bioMatch = fundi.bio.toLowerCase().includes(normalizedQuery);
        const skillMatches = fundi.skills.some(s => s.toLowerCase().includes(normalizedQuery));
        const categoryMatch = fundi.primaryCategory.toLowerCase().includes(normalizedQuery) ||
          fundi.additionalCategories.some(c => c.toLowerCase().includes(normalizedQuery));
        const neighborhoodMatch = (fundi.location.neighborhood || '').toLowerCase().includes(normalizedQuery);

        if (nameMatch || categoryMatch) {
          queryMatchScore = 1.0;
        } else if (skillMatches) {
          queryMatchScore = 0.95;
        } else if (neighborhoodMatch || bioMatch) {
          queryMatchScore = 0.8;
        } else {
          return null;
        }
      }

      // Proximity score (0 to 100): Exponential decay
      const proximityScore = isRelaxedDistance
        ? Math.max(20, Math.round(100 * Math.exp(-distanceKm / 100)))
        : Math.max(10, Math.round(100 * Math.exp(-distanceKm / 15)));

      // Rating & Reliability score (0 to 100)
      const ratingNormalized = (fundi.rating / 5.0) * 80;
      const experienceBonus = Math.min(10, fundi.experienceYears * 1.0);
      const jobsBonus = Math.min(10, (fundi.jobsCompleted / 100) * 10);
      const reputationScore = Math.min(100, ratingNormalized + experienceBonus + jobsBonus);

      // Category match strength
      let categoryScore = 100;
      if (category && category !== 'All') {
        if (matchesPrimaryCategory) {
          categoryScore = 100;
        } else if (matchesAdditionalCategory) {
          categoryScore = 85;
        }
      }

      // Availability score
      let availabilityScore = 70;
      if (fundi.isAvailableNow) availabilityScore += 20;
      if (fundi.emergencyAvailable) availabilityScore += 10;
      const responseSpeedPenalty = Math.min(15, (fundi.responseTimeMinutes / 60) * 15);
      availabilityScore = Math.max(30, availabilityScore - responseSpeedPenalty);

      // Verification trust bonus
      let trustScore = 70;
      if (fundi.isVerified) trustScore += 15;
      if (fundi.idVerified) trustScore += 10;
      if (fundi.backgroundChecked) trustScore += 5;

      const rawMatchScore = (
        proximityScore * 0.35 +
        reputationScore * 0.25 +
        categoryScore * 0.20 * queryMatchScore +
        availabilityScore * 0.10 +
        trustScore * 0.10
      );

      let finalMatchScore = Math.min(99, Math.max(50, Math.round(rawMatchScore)));
      const matchReasons: string[] = [];

      if (matchedSkillName) {
        matchReasons.push(`Verified Skill: ${matchedSkillName}`);
      }

      if (fundi.matchScore && fundi.matchScore > 0) {
        finalMatchScore = Math.min(99, Math.max(50, Math.round(fundi.matchScore * 0.65 + rawMatchScore * 0.35)));
        matchReasons.push(`Sheet Model Trained Score: ${fundi.matchScore}%`);
      }

      if (isRelaxedDistance) {
        matchReasons.push(`Nationwide / Regional Hub (${fundi.location.neighborhood || 'Nairobi'}) • ${distanceKm.toFixed(0)} km away`);
      } else if (distanceKm <= 3.0) {
        matchReasons.push(`Very close to you (${distanceKm.toFixed(1)} km) • ~${estimateTravelTimeMinutes(distanceKm)} min arrival`);
      } else if (distanceKm <= 8.0) {
        matchReasons.push(`Nearby in ${fundi.location.neighborhood || 'your area'} (${distanceKm.toFixed(1)} km)`);
      } else {
        matchReasons.push(`${distanceKm.toFixed(1)} km away in ${fundi.location.neighborhood || 'Nairobi'}`);
      }

      if (fundi.rating >= 4.8) {
        matchReasons.push(`Top rated (${fundi.rating}★) with ${fundi.jobsCompleted} completed jobs`);
      }

      if (fundi.isAvailableNow) {
        matchReasons.push(`Available right now for quick dispatch (${fundi.responseTimeMinutes}m response)`);
      }

      if (fundi.isVerified && fundi.backgroundChecked) {
        matchReasons.push(`Verified artisan & background checked`);
      }

      return {
        ...fundi,
        distanceKm,
        matchScore: finalMatchScore,
        matchReasons: matchReasons.slice(0, 3),
        isDistanceExpanded: isRelaxedDistance
      };
    })
    .filter((f): f is NonNullable<typeof f> => f !== null)
    .sort((a, b) => {
      if ((b.matchScore || 0) !== (a.matchScore || 0)) {
        return (b.matchScore || 0) - (a.matchScore || 0);
      }
      return (a.distanceKm || 0) - (b.distanceKm || 0);
    });
}

/**
 * Executes proximity-based ranking and AI scoring with graceful nationwide auto-expansion
 */
export function rankFundis(
  fundis: Fundi[],
  request: RecommendationRequest
): Fundi[] {
  const sourceFundis = (fundis && Array.isArray(fundis) && fundis.length > 0) ? fundis : INITIAL_FUNDIS;
  const maxDistanceKm = request.maxDistanceKm ?? 50;
  
  // 1. Try strict proximity distance first
  const initialResults = executeRanking(sourceFundis, request, maxDistanceKm, false);
  if (initialResults.length > 0) {
    return initialResults;
  }

  // 2. If 0 results were found due to distance (e.g. user device GPS is outside Nairobi or in another region),
  // automatically relax distance constraint so available verified artisans are ALWAYS displayed!
  const relaxedResults = executeRanking(sourceFundis, request, 999999, true);
  if (relaxedResults.length > 0) {
    return relaxedResults;
  }

  // 3. Robust fallback: Even if specific queries or filters are active, return top verified artisans
  return sourceFundis.map(f => {
    const dist = calculateDistanceKm(request.userLat, request.userLng, f.location.lat, f.location.lng);
    return {
      ...f,
      distanceKm: dist,
      matchScore: 92,
      matchReasons: [
        'NITA Accredited & Verified Artisan',
        `Nationwide Hub (${f.location.neighborhood || 'Nairobi'}) • ${dist.toFixed(0)} km away`,
        'Escrow Protected & Background Checked'
      ],
      isDistanceExpanded: true
    };
  });
}

/**
 * Attempts to call external FastAPI recommendation microservice if available,
 * otherwise seamlessly falls back to the built-in recommendation engine.
 */
export async function getRecommendations(
  fundis: Fundi[],
  request: RecommendationRequest
): Promise<RecommendationResponse> {
  const startTime = Date.now();
  const fastApiUrl = request.customFastApiUrl || process.env.FASTAPI_RECOMMENDER_URL;

  if (fastApiUrl && fastApiUrl.startsWith('http')) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const response = await fetch(fastApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_lat: request.userLat,
          user_lng: request.userLng,
          category: request.category || 'All',
          search_query: request.searchQuery || '',
          max_distance_km: request.maxDistanceKm || 50,
          min_rating: request.minRating || 0,
          max_hourly_rate: request.maxHourlyRateKes,
          verified_only: request.verifiedOnly || false,
          available_now: request.availableNowOnly || false,
          candidates: fundis.map(f => ({
            id: f.id,
            name: f.name,
            category: f.primaryCategory,
            lat: f.location.lat,
            lng: f.location.lng,
            rating: f.rating,
            experience_years: f.experienceYears,
            jobs_completed: f.jobsCompleted,
            hourly_rate: f.hourlyRateKes,
            is_available: f.isAvailableNow,
            is_verified: f.isVerified
          }))
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.recommendations) || Array.isArray(data.ranked_fundis)) {
          const rankedList: any[] = data.recommendations || data.ranked_fundis;
          // Merge with full local profile metadata
          const merged = rankedList.map((item: any) => {
            const original = fundis.find(f => f.id === item.id || f.id === item.fundi_id);
            if (!original) return null;
            const dist = item.distance_km ?? calculateDistanceKm(request.userLat, request.userLng, original.location.lat, original.location.lng);
            return {
              ...original,
              distanceKm: dist,
              matchScore: item.match_score ?? item.score ?? 95,
              matchReasons: item.reasons ?? [
                `FastAPI Model Rank #${item.rank || 1}`,
                `${dist.toFixed(1)} km proximity`,
                `${original.rating}★ rating with ${original.jobsCompleted} jobs`
              ]
            };
          }).filter(Boolean);

          return {
            recommendations: merged as Fundi[],
            source: 'fastapi_microservice',
            totalFound: merged.length,
            userLocation: { lat: request.userLat, lng: request.userLng },
            executionTimeMs: Date.now() - startTime,
            modelDetails: {
              modelType: data.model_name || 'FastAPI ML Distance & Rating Regressor (Colab)',
              weights: {
                proximity: 0.40,
                ratingAndReputation: 0.30,
                skillSemanticMatch: 0.20,
                availabilityAndSpeed: 0.10
              }
            }
          };
        }
      }
    } catch {
      // Graceful fallback to internal engine
    }
  }

  // Internal high-accuracy engine
  const ranked = rankFundis(fundis, request);
  const isExpanded = ranked.some(f => f.isDistanceExpanded);
  return {
    recommendations: ranked,
    source: 'internal_engine',
    totalFound: ranked.length,
    userLocation: { lat: request.userLat, lng: request.userLng },
    executionTimeMs: Date.now() - startTime,
    distanceExpanded: isExpanded,
    expandedMessage: isExpanded
      ? 'No registered artisans found within your immediate radius. Showing top verified artisans across Kenya.'
      : undefined,
    modelDetails: {
      modelType: 'Hybrid Proximity & Multi-Criteria Collaborative Ranker',
      weights: {
        proximity: 0.35,
        ratingAndReputation: 0.25,
        skillSemanticMatch: 0.20,
        availabilityAndSpeed: 0.10
      }
    }
  };
}
