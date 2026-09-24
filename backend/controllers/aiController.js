import { AIService } from '../services/aiService.js';
import ServiceRequest from '../models/ServiceRequest.js';
import { recordAudit } from '../utils/recordAudit.js';

export const createDiagnosis = async (req, res, next) => {
  try {
    const { title, description, category, requestId } = req.body;
    if (!title && !description) {
      return res.status(400).json({ success: false, message: 'Title or description is required' });
    }

    const diagnosis = await AIService.generateDiagnosis({ title, description, category });

    if (requestId) {
      const request = await ServiceRequest.findById(requestId);
      if (request && request.customerId.toString() === req.user._id.toString()) {
        request.aiAnalysis = {
          ...(request.aiAnalysis || {}),
          diagnosis,
          classifiedCategoryName: diagnosis.category,
          identifiedSkills: diagnosis.requiredSkills,
          urgencyScore: diagnosis.urgency === 'EMERGENCY' ? 10 : diagnosis.urgency === 'URGENT' ? 8 : 6,
          estimatedCostRange: { min: 500, max: 1500 },
          reasoning: diagnosis.recommendation
        };
        request.urgency = diagnosis.urgency;
        await request.save();
      }
    }

    await recordAudit({ req, action: 'AI_DIAGNOSIS_CREATED', entityType: 'ServiceRequest', entityId: requestId || req.user._id, newState: { diagnosis }, metadata: { category: diagnosis.category } });

    res.json({ success: true, data: diagnosis });
  } catch (error) {
    next(error);
  }
};

export const analyzeImage = async (req, res, next) => {
  try {
    const { description, category, imageUrl } = req.body;
    if (!description && !category) {
      return res.status(400).json({ success: false, message: 'Description or category is required for the image analysis' });
    }

    const analysis = await AIService.analyzeImageIssue({ description, category, imageUrl });
    res.json({ success: true, data: analysis });
  } catch (error) {
    next(error);
  }
};

export const estimatePricing = async (req, res, next) => {
  try {
    const { category, serviceType, severity, location, urgency, durationHours, historicalPrices } = req.body;
    const estimate = await AIService.generatePriceEstimate({
      category,
      serviceType,
      severity,
      location,
      urgency,
      durationHours,
      historicalPrices
    });

    res.json({ success: true, data: estimate });
  } catch (error) {
    next(error);
  }
};
