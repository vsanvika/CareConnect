import test from 'node:test';
import assert from 'node:assert/strict';

import { AIService } from '../services/aiService.js';

test('AI diagnosis produces structured diagnosis for AC cooling issue', async () => {
  const diagnosis = await AIService.generateDiagnosis({
    title: 'AC is not cooling',
    description: 'Air is coming out but it is not cold and it was last serviced 8 months ago.',
    category: 'AC Repair'
  });

  assert.equal(diagnosis.category, 'AC Repair');
  assert.ok(diagnosis.possibleIssue);
  assert.ok(Array.isArray(diagnosis.requiredSkills));
  assert.ok(['NORMAL', 'URGENT', 'EMERGENCY'].includes(diagnosis.urgency));
  assert.ok(diagnosis.confidence > 0 && diagnosis.confidence <= 1);
  assert.ok(diagnosis.recommendation);
});

test('AI price estimate returns a realistic estimate range', async () => {
  const estimate = await AIService.generatePriceEstimate({
    category: 'AC Repair',
    serviceType: 'Maintenance',
    severity: 'NORMAL',
    location: 'Hyderabad',
    urgency: 'NORMAL',
    durationHours: 2,
    historicalPrices: [900, 1200, 1500]
  });

  assert.ok(estimate.estimatedMinPrice > 0);
  assert.ok(estimate.estimatedMaxPrice >= estimate.estimatedMinPrice);
  assert.ok(Array.isArray(estimate.pricingFactors));
  assert.ok(estimate.generatedAt);
});
