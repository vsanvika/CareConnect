import ProviderProfile from '../models/ProviderProfile.js';
import { AIService } from './aiService.js';
import { matchingWeights } from '../config/matchingWeights.js';

export class MatchingService {
  /**
   * Evaluates all verified service providers against a service request using composite scoring algorithm:
   * Score = (W_skill * SkillRatio) + (W_rating * RatingRatio) + (W_experience * ExpRatio) + (W_load * LoadRatio)
   */
  static async findAndRankEligibleProviders(serviceRequest) {
    // 1. Fetch verified providers
    const providers = await ProviderProfile.find({
      verificationStatus: 'VERIFIED',
      isAvailableNow: true
    }).populate('userId', 'name email phone avatarUrl address');

    if (!providers || providers.length === 0) {
      return [];
    }

    const reqSkills = serviceRequest.aiAnalysis?.identifiedSkills || [];

    // 2. Score each provider
    const scoredProviders = providers.map((provider) => {
      const providerSkills = provider.skillTags || [];
      
      // Skill match ratio
      let matchedSkillCount = 0;
      if (reqSkills.length > 0) {
        reqSkills.forEach(skill => {
          if (providerSkills.some(ps => ps.toLowerCase().includes(skill.toLowerCase()) || skill.toLowerCase().includes(ps.toLowerCase()))) {
            matchedSkillCount += 1;
          }
        });
      }
      const skillMatchRatio = reqSkills.length > 0 ? (matchedSkillCount / reqSkills.length) : 0.7;

      // Rating ratio (scaled 0 to 1)
      const ratingRatio = (provider.ratingAverage || 4.5) / 5.0;

      // Experience factor (capped at 10 years)
      const expRatio = Math.min((provider.experienceYears || 2) / 10.0, 1.0);

      // Composite weights: Skill (0.45), Rating (0.35), Experience (0.20)
      const score = (skillMatchRatio * matchingWeights.skillMatchWeight)
        + (ratingRatio * matchingWeights.ratingWeight)
        + (expRatio * matchingWeights.experienceWeight)
        + matchingWeights.locationMatchWeight
        + matchingWeights.availabilityWeight;

      return {
        provider,
        score,
        skillMatchRatio
      };
    });

    // 3. Sort by composite score descending
    scoredProviders.sort((a, b) => b.score - a.score);

    // 4. Generate AI explanations
    const rankedResults = await AIService.rankProvidersExplanation(serviceRequest, scoredProviders);

    return rankedResults;
  }
}
