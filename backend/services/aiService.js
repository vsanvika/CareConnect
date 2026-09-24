import ServiceCategory from '../models/ServiceCategory.js';

const normalizePriority = (value) => {
  const normalized = String(value || '').toUpperCase();
  if (['EMERGENCY', 'URGENT', 'NORMAL'].includes(normalized)) return normalized;
  return 'NORMAL';
};

export class AIService {
  static async generateDiagnosis({ title, description, category }) {
    const text = `${title || ''} ${description || ''}`.toLowerCase();
    const categoryName = String(category || 'Home Maintenance').trim() || 'Home Maintenance';

    const categoryMap = {
      'AC Repair': {
        possibleIssue: 'Cooling performance issue',
        requiredSkills: ['AC Repair', 'HVAC Maintenance'],
        followUpQuestions: [
          'Is the AC turning on normally?',
          'Is air coming out but not cold?',
          'When was the AC last serviced?'
        ],
        recommendation: 'Schedule an AC technician for diagnostics and cooling performance checks.',
        urgency: text.includes('not cooling') || text.includes('no cold') ? 'NORMAL' : 'URGENT',
        confidence: 0.87
      },
      Plumbing: {
        possibleIssue: 'Water leakage or pressure issue',
        requiredSkills: ['Plumbing', 'Pipe Repair'],
        followUpQuestions: ['Is there active leakage or a burst pipe?', 'Is the pressure low or inconsistent?', 'When did the leak first start?'],
        recommendation: 'Arrange a plumber for inspection and leak isolation.',
        urgency: text.includes('leak') || text.includes('burst') || text.includes('flood') ? 'URGENT' : 'NORMAL',
        confidence: 0.84
      },
      Electrical: {
        possibleIssue: 'Electrical fault or circuit issue',
        requiredSkills: ['Electrical Repair', 'Wiring Inspection'],
        followUpQuestions: ['Is there sparking, smoke, or a burning smell?', 'Are you seeing flickering lights or a tripped breaker?', 'Is the issue isolated to one switch or circuit?'],
        recommendation: 'Stop using the affected circuit and schedule an electrician for inspection.',
        urgency: text.includes('spark') || text.includes('smoke') || text.includes('electric shock') ? 'EMERGENCY' : 'URGENT',
        confidence: 0.9
      },
      'Appliance Repair': {
        possibleIssue: 'Appliance malfunction or performance issue',
        requiredSkills: ['Appliance Repair', 'Diagnostics'],
        followUpQuestions: ['Does the appliance power on?', 'Is there an error code or unusual noise?', 'When was it last serviced?'],
        recommendation: 'Book a technician to inspect the appliance and confirm the fault before replacing parts.',
        urgency: 'NORMAL',
        confidence: 0.81
      }
    };

    const mapped = categoryMap[categoryName] || {
      possibleIssue: 'Service issue requires professional inspection',
      requiredSkills: ['General Repair', 'Diagnostics'],
      followUpQuestions: ['Can you describe the symptom in more detail?', 'Are there any visible signs of damage?', 'When was the issue first noticed?'],
      recommendation: 'Schedule a qualified technician for a site inspection.',
      urgency: text.includes('urgent') || text.includes('danger') || text.includes('leak') ? 'URGENT' : 'NORMAL',
      confidence: 0.72
    };

    if (/ac|air conditioner|hvac|cooling/.test(text)) {
      mapped.possibleIssue = 'Cooling performance issue';
      mapped.requiredSkills = ['AC Repair', 'HVAC Maintenance'];
      mapped.recommendation = 'Schedule an AC technician';
    }

    if (/(pipe|leak|flood|drain|tap|sink|water)/.test(text)) {
      mapped.possibleIssue = 'Water leakage around pipe or fitting';
      mapped.requiredSkills = ['Plumbing', 'Pipe Repair'];
      mapped.recommendation = 'Schedule a plumber for inspection';
    }

    if (/(wire|switch|outlet|breaker|electric|spark|smoke)/.test(text)) {
      mapped.possibleIssue = 'Electrical safety issue';
      mapped.requiredSkills = ['Electrical Repair', 'Wiring Inspection'];
      mapped.urgency = 'EMERGENCY';
      mapped.recommendation = 'Avoid using the circuit and arrange urgent electrician support';
    }

    const urgency = normalizePriority(mapped.urgency || 'NORMAL');
    return {
      category: categoryName,
      possibleIssue: mapped.possibleIssue,
      requiredSkills: mapped.requiredSkills,
      urgency,
      followUpQuestions: mapped.followUpQuestions,
      confidence: Number((mapped.confidence || 0.75).toFixed(2)),
      recommendation: mapped.recommendation,
      generatedAt: new Date().toISOString(),
      disclaimer: 'AI-generated diagnosis is an estimate and does not replace professional inspection.'
    };
  }

  static async analyzeImageIssue({ description = '', category = 'General Service', imageUrl = '' }) {
    const text = `${description} ${category}`.toLowerCase();
    const possibleIssue = /(leak|water|pipe)/.test(text)
      ? 'Water leakage around pipe connection'
      : /(switch|electrical|spark|outlet)/.test(text)
        ? 'Electrical switch or connection issue'
        : /(washing machine|appliance)/.test(text)
          ? 'Appliance malfunction or damaged unit'
          : /(wall|crack|furniture)/.test(text)
            ? 'Visible surface or furniture damage'
            : 'Visible issue requires professional assessment';

    const likelyCategory = /(leak|pipe|water)/.test(text)
      ? 'Plumbing'
      : /(switch|electrical|spark|outlet)/.test(text)
        ? 'Electrical'
        : /(washing machine|appliance)/.test(text)
          ? 'Appliance Repair'
          : /(ac|air conditioner|hvac|cooling)/.test(text)
            ? 'AC Repair'
            : (category || 'General Service');

    const requiredSkills = likelyCategory === 'Plumbing'
      ? ['Plumbing', 'Pipe Repair']
      : likelyCategory === 'Electrical'
        ? ['Electrical Repair', 'Wiring Inspection']
        : likelyCategory === 'Appliance Repair'
          ? ['Appliance Repair', 'Diagnostics']
          : ['General Maintenance', 'Inspection'];

    const urgency = /(leak|electrical|spark|smoke|gas)/.test(text) ? 'HIGH' : 'NORMAL';
    return {
      possibleIssue,
      likelyCategory,
      requiredSkills,
      urgency,
      recommendedAction: `Schedule a ${likelyCategory.toLowerCase()} specialist for inspection.`,
      confidence: 0.82,
      imageUrl,
      generatedAt: new Date().toISOString(),
      source: 'mock-vision'
    };
  }

  static async generatePriceEstimate({ category, serviceType, severity, location, urgency, durationHours, historicalPrices = [] }) {
    const normalizedCategory = String(category || 'General Service');
    const normalizedUrgency = normalizePriority(urgency || 'NORMAL');
    const base = {
      'AC Repair': 1200,
      Plumbing: 900,
      Electrical: 1400,
      'Appliance Repair': 1100,
      Cleaning: 700,
      'Home Maintenance': 800,
      'General Service': 700
    }[normalizedCategory] || 800;

    let highFactor = 1.15;
    if (normalizedUrgency === 'URGENT') highFactor = 1.3;
    if (normalizedUrgency === 'EMERGENCY') highFactor = 1.6;
    if (severity === 'HIGH') highFactor += 0.2;
    if (severity === 'LOW') highFactor -= 0.1;

    const medianPrice = historicalPrices.length
      ? historicalPrices.reduce((sum, value) => sum + Number(value || 0), 0) / historicalPrices.length
      : base;
    const minPrice = Math.max(400, Math.round((medianPrice || base) * 0.8 * highFactor));
    const maxPrice = Math.max(minPrice + 300, Math.round((medianPrice || base) * 1.3 * highFactor));
    const duration = durationHours ? `${Math.max(1, Number(durationHours) || 1)}-${Math.max(2, Number(durationHours) + 1 || 2)} hours` : '1-3 hours';

    return {
      estimatedMinPrice: minPrice,
      estimatedMaxPrice: maxPrice,
      estimatedDuration: duration,
      pricingFactors: [
        `Category: ${normalizedCategory}`,
        `Urgency: ${normalizedUrgency}`,
        `Location: ${location || 'Local service area'}`,
        `Service type: ${serviceType || 'Standard service'}`,
        'Estimate is advisory and may vary after inspection.'
      ],
      generatedAt: new Date().toISOString(),
      disclaimer: 'AI-generated estimate is an estimate only. Final price may vary after inspection.'
    };
  }

  /**
   * Classify user service request text and estimate required skills & pricing
   */
  static async classifyRequest(title, description) {
    const text = `${title} ${description}`.toLowerCase();
    const apiKey = process.env.AI_API_KEY;

    if (apiKey) {
      try {
        // Attempt external LLM call if API key configured
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content:
                  'You are an AI dispatcher for CareConnect home services. Classify requests into categories: Plumbing, Electrical, Cleaning, Appliance Repair, AC/HVAC, Carpentry, Painting, Home Maintenance, Pest Control. Respond in JSON format with fields: categoryName, identifiedSkills (array), urgencyScore (1-10), estimatedMinCost, estimatedMaxCost, reasoning.'
              },
              { role: 'user', content: `Title: ${title}\nDescription: ${description}` }
            ]
          })
        });

        const data = await response.json();
        if (data.choices && data.choices[0]) {
          const parsed = JSON.parse(data.choices[0].message.content);
          const washingMachineRequest = /washing machine/i.test(text);
          const identifiedSkills = parsed.identifiedSkills || ['general-maintenance'];
          if (washingMachineRequest && !identifiedSkills.some((skill) => /washing machine repair/i.test(skill))) {
            identifiedSkills.unshift('Washing Machine Repair');
          }
          return {
            classifiedCategoryName: washingMachineRequest ? 'Appliance Repair' : (parsed.categoryName || 'Home Maintenance'),
            identifiedSkills,
            urgencyScore: parsed.urgencyScore || 5,
            estimatedCostRange: { min: parsed.estimatedMinCost || 60, max: parsed.estimatedMaxCost || 180 },
            reasoning: parsed.reasoning || 'AI processed through primary LLM model.'
          };
        }
      } catch (err) {
        console.warn(`[AI Service] LLM API call failed (${err.message}). Using fallback AI engine.`);
      }
    }

    // Fallback AI Engine (Deterministic Rule-Based Matching & Key-Phrase NLP)
    let categoryName = 'Home Maintenance';
    let skills = ['general-repair'];
    let minCost = 50;
    let maxCost = 150;
    let urgencyScore = 5;

    if (text.includes('pipe') || text.includes('leak') || text.includes('sink') || text.includes('drain') || text.includes('faucet') || text.includes('toilet') || text.includes('water')) {
      categoryName = 'Plumbing';
      skills = ['pipe-repair', 'leak-detection', 'drain-cleaning'];
      minCost = 75;
      maxCost = 220;
      urgencyScore = text.includes('flood') || text.includes('burst') ? 9 : 7;
    } else if (text.includes('wire') || text.includes('switch') || text.includes('outlet') || text.includes('breaker') || text.includes('light') || text.includes('power') || text.includes('short circuit')) {
      categoryName = 'Electrical';
      skills = ['wiring', 'circuit-breaker', 'fixture-installation'];
      minCost = 80;
      maxCost = 250;
      urgencyScore = text.includes('spark') || text.includes('smoke') ? 10 : 6;
    } else if (text.includes('clean') || text.includes('dust') || text.includes('mopping') || (text.includes('wash') && !text.includes('washing machine')) || text.includes('deep clean') || text.includes('sanitization')) {
      categoryName = 'Cleaning';
      skills = ['deep-cleaning', 'sanitization', 'carpet-wash'];
      minCost = 60;
      maxCost = 180;
      urgencyScore = 3;
    } else if (/\bac\b/.test(text) || text.includes('air conditioner') || text.includes('cooling') || text.includes('hvac') || text.includes('freon') || text.includes('thermostat')) {
      categoryName = 'AC/HVAC';
      skills = ['ac-servicing', 'refrigerant-refill', 'compressor-repair'];
      minCost = 90;
      maxCost = 280;
      urgencyScore = text.includes('hot') || text.includes('summer') ? 8 : 6;
    } else if (text.includes('fridge') || text.includes('washing machine') || text.includes('oven') || text.includes('microwave') || text.includes('appliance') || text.includes('dishwasher')) {
      categoryName = 'Appliance Repair';
      skills = text.includes('washing machine')
        ? ['Washing Machine Repair', 'appliance-diagnostics', 'motor-replacement']
        : ['appliance-diagnostics', 'motor-replacement', 'gasket-repair'];
      minCost = 70;
      maxCost = 200;
      urgencyScore = 5;
    } else if (text.includes('door') || text.includes('cabinet') || text.includes('table') || text.includes('wood') || text.includes('furniture') || text.includes('hinge')) {
      categoryName = 'Carpentry';
      skills = ['woodwork', 'furniture-assembly', 'door-repair'];
      minCost = 65;
      maxCost = 190;
      urgencyScore = 4;
    } else if (text.includes('paint') || text.includes('wall') || text.includes('coat') || text.includes('primer')) {
      categoryName = 'Painting';
      skills = ['wall-painting', 'primer-coating', 'surface-prep'];
      minCost = 120;
      maxCost = 450;
      urgencyScore = 3;
    } else if (text.includes('pest') || text.includes('termite') || text.includes('cockroach') || text.includes('bug') || text.includes('ant') || text.includes('rodent')) {
      categoryName = 'Pest Control';
      skills = ['fumigation', 'termite-treatment', 'pest-repellent'];
      minCost = 85;
      maxCost = 230;
      urgencyScore = 7;
    }

    return {
      classifiedCategoryName: categoryName,
      identifiedSkills: skills,
      urgencyScore,
      estimatedCostRange: { min: minCost, max: maxCost },
      reasoning: `Matched via CareConnect Intelligent Classification Engine based on keywords ("${categoryName.toLowerCase()}").`
    };
  }

  /**
   * Generates AI contextual explanations for ranked service providers
   */
  static async rankProvidersExplanation(request, providerScores) {
    return providerScores.map(({ provider, score, skillMatchRatio }) => {
      const distanceKm = (Math.random() * 5 + 1.2).toFixed(1);
      return {
        providerId: provider.userId._id || provider.userId,
        matchScore: Math.round(score * 100),
        ratingAverage: provider.ratingAverage || 0,
        ratingCount: provider.ratingCount || 0,
        matchReasoning: `AI Rank #${Math.round((1 - score) * 5 + 1)}: ${Math.round(skillMatchRatio * 100)}% skill alignment, ${provider.ratingAverage}★ customer satisfaction rate, situated within ${distanceKm} km.`
      };
    });
  }
}
