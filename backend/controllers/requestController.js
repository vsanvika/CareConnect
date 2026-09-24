import ServiceRequest from '../models/ServiceRequest.js';
import ServiceCategory from '../models/ServiceCategory.js';
import { AIService } from '../services/aiService.js';
import { MatchingService } from '../services/matchingService.js';
import { NotificationService } from '../services/notificationService.js';
import Quote from '../models/Quote.js';
import { recordAudit } from '../utils/recordAudit.js';
import { storeUploadedFiles, validateUploadedFiles } from '../services/fileStorageService.js';

export const createServiceRequest = async (req, res, next) => {
  try {
    const { title, description, urgency, preferredDate, timeSlot, categoryId, emergencyReason } = req.body;
    const confirmedEmergency = req.body.confirmedEmergency === true || req.body.confirmedEmergency === 'true';
    let { address, aiDiagnosis, imageAnalysis, priceEstimate } = req.body;
    try {
      address = typeof address === 'string' ? JSON.parse(address) : address;
      aiDiagnosis = typeof aiDiagnosis === 'string' ? JSON.parse(aiDiagnosis) : aiDiagnosis;
      imageAnalysis = typeof imageAnalysis === 'string' ? JSON.parse(imageAnalysis) : imageAnalysis;
      priceEstimate = typeof priceEstimate === 'string' ? JSON.parse(priceEstimate) : priceEstimate;
    } catch {
      return res.status(400).json({ success: false, message: 'Invalid request data.' });
    }
    if (!String(title || '').trim() || String(title).length > 160) return res.status(400).json({ success: false, message: 'A request title is required and must be 160 characters or fewer' });
    if (!String(description || '').trim() || String(description).length > 5000) return res.status(400).json({ success: false, message: 'A request description is required and must be 5000 characters or fewer' });
    if (urgency && !['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY'].includes(urgency)) return res.status(400).json({ success: false, message: 'Invalid urgency value' });
    if (preferredDate && Number.isNaN(new Date(preferredDate).getTime())) return res.status(400).json({ success: false, message: 'Invalid preferred date' });
    if (urgency === 'EMERGENCY' && !confirmedEmergency) {
      return res.status(400).json({ success: false, message: 'Use Emergency only when immediate assistance is required. Please confirm the emergency request.' });
    }
    if (urgency === 'EMERGENCY' && !emergencyReason) {
      return res.status(400).json({ success: false, message: 'Emergency requests require an emergency reason.' });
    }
    if (req.files?.length) {
      await validateUploadedFiles(req.files);
    }
    const imageUrls = await storeUploadedFiles(req.files || [], 'service-requests');

    // 1. Run AI Classification
    const aiAnalysis = await AIService.classifyRequest(title, description);
    const diagnosis = aiDiagnosis || await AIService.generateDiagnosis({ title, description, category: aiAnalysis.classifiedCategoryName });
    const priceEstimateData = priceEstimate || await AIService.generatePriceEstimate({
      category: aiAnalysis.classifiedCategoryName,
      serviceType: 'Standard service',
      severity: urgency === 'EMERGENCY' ? 'HIGH' : 'NORMAL',
      location: address?.city || 'Local service area',
      urgency,
      durationHours: 2,
      historicalPrices: [800, 1200, 1500]
    });

    // If categoryId wasn't passed directly, find matching category from DB by name
    let finalCategoryId = categoryId;
    if (!finalCategoryId && aiAnalysis.classifiedCategoryName) {
      const category = await ServiceCategory.findOne({
        name: new RegExp(aiAnalysis.classifiedCategoryName, 'i')
      });
      if (category) finalCategoryId = category._id;
    }

    // 2. Create Service Request record
    const normalizedUrgency = urgency || 'MEDIUM';
    const emergencyCreatedAt = normalizedUrgency === 'EMERGENCY' ? new Date() : null;
    const responseDeadline = normalizedUrgency === 'EMERGENCY' ? new Date(Date.now() + 60 * 60 * 1000) : null;

    const serviceRequest = await ServiceRequest.create({
      customerId: req.user._id,
      categoryId: finalCategoryId,
      title,
      description,
      urgency: normalizedUrgency,
      priority: normalizedUrgency === 'EMERGENCY' ? 'EMERGENCY' : (normalizedUrgency === 'HIGH' ? 'URGENT' : 'NORMAL'),
      emergencyReason: normalizedUrgency === 'EMERGENCY' ? emergencyReason : '',
      emergencyCreatedAt,
      responseDeadline,
      preferredDate: preferredDate || new Date(Date.now() + 86400000),
      timeSlot: timeSlot || '09:00 AM - 12:00 PM',
      address: address || req.user.address,
      images: imageUrls,
      aiAnalysis: {
        ...aiAnalysis,
        diagnosis,
        imageAnalysis: imageAnalysis || null,
        priceEstimate: priceEstimateData || null,
        estimatedCostRange: { min: priceEstimateData?.estimatedMinPrice || aiAnalysis.estimatedCostRange?.min || 50, max: priceEstimateData?.estimatedMaxPrice || aiAnalysis.estimatedCostRange?.max || 150 }
      },
      status: 'AI_ANALYZED'
    });

    // 3. AI Matches & Ranks Providers
    const rankedProviders = await MatchingService.findAndRankEligibleProviders(serviceRequest);

    serviceRequest.eligibleProviders = rankedProviders;
    serviceRequest.status = 'QUOTING';
    await serviceRequest.save();

    await NotificationService.sendNotification({
      recipientId: req.user._id,
      title: 'Service request created',
      message: `Your request "${serviceRequest.title}" was created successfully.`,
      type: 'REQUEST_CREATED',
      linkUrl: `/customer/request/${serviceRequest._id}`
    });
    await NotificationService.sendNotification({
      recipientId: req.user._id,
      title: 'AI classification completed',
      message: `Your request was classified as ${aiAnalysis.classifiedCategoryName || 'General Service'}.`,
      type: 'AI_CLASSIFICATION_COMPLETED',
      linkUrl: `/customer/request/${serviceRequest._id}`
    });
    if (normalizedUrgency === 'EMERGENCY') {
      await NotificationService.notifyRoles({
        roles: ['OPERATIONS_MANAGER', 'PLATFORM_ADMIN'],
        title: 'Emergency request created',
        message: `Emergency request received for "${serviceRequest.title}". Immediate dispatch review required.`,
        type: 'EMERGENCY_REQUEST',
        linkUrl: `/ops/dashboard`
      });
    }

    // 4. Send Notifications to matched top providers
    for (const match of rankedProviders.slice(0, 3)) {
      await NotificationService.sendNotification({
        recipientId: match.providerId,
        title: 'New Service Request Match!',
        message: `You were AI-matched for "${serviceRequest.title}". Submit a quote now!`,
        type: 'NEW_MATCHING_REQUEST',
        linkUrl: `/provider/dashboard`
      });
    }

    const populatedRequest = await ServiceRequest.findById(serviceRequest._id)
      .populate('customerId', 'name email phone avatarUrl')
      .populate('categoryId')
      .populate('eligibleProviders.providerId', 'name email phone avatarUrl');

    await recordAudit({ req, action: 'REQUEST_CREATED', entityType: 'ServiceRequest', entityId: serviceRequest._id, newState: { status: serviceRequest.status, title: serviceRequest.title, urgency: serviceRequest.urgency }, metadata: { matchedProviders: rankedProviders.length } });

    res.status(201).json({
      success: true,
      message: 'Service Request created and AI-processed successfully',
      data: populatedRequest
    });
  } catch (err) {
    next(err);
  }
};

export const getServiceRequests = async (req, res, next) => {
  try {
    let filter = {};
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 12));

    if (req.user.role === 'CUSTOMER') {
      filter.customerId = req.user._id;
    } else if (req.user.role === 'SERVICE_PROVIDER') {
      filter.status = { $in: ['QUOTING', 'AI_ANALYZED'] };
      filter['eligibleProviders.providerId'] = req.user._id;
    }
    if (req.query.category) filter.categoryId = req.query.category;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.urgency) filter.urgency = req.query.urgency;
    if (req.query.date) {
      const date = new Date(req.query.date);
      filter.preferredDate = { $gte: new Date(date.setHours(0, 0, 0, 0)), $lt: new Date(date.setHours(23, 59, 59, 999)) };
    }
    if (req.query.from || req.query.to) {
      filter.preferredDate = {};
      if (req.query.from) filter.preferredDate.$gte = new Date(req.query.from);
      if (req.query.to) filter.preferredDate.$lte = new Date(req.query.to);
    }

    const [requests, total] = await Promise.all([ServiceRequest.find(filter)
      .populate('customerId', 'name email phone avatarUrl')
      .populate('categoryId')
      .populate('eligibleProviders.providerId', 'name email phone avatarUrl')
      .sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit), ServiceRequest.countDocuments(filter)]);

    res.json({ success: true, count: requests.length, total, page, limit, pages: Math.ceil(total / limit), data: requests });
  } catch (err) {
    next(err);
  }
};

export const getServiceRequestById = async (req, res, next) => {
  try {
    const request = await ServiceRequest.findById(req.params.id)
      .populate('customerId', 'name email phone avatarUrl address')
      .populate('categoryId')
      .populate('eligibleProviders.providerId', 'name email phone avatarUrl');

    if (!request) {
      return res.status(404).json({ success: false, message: 'Service request not found' });
    }

    if (req.user.role === 'CUSTOMER' && request.customerId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this request' });
    }

    if (req.user.role === 'SERVICE_PROVIDER') {
      const isEligible = request.eligibleProviders.some((match) => match.providerId?._id?.toString() === req.user._id.toString() || match.providerId?.toString() === req.user._id.toString());
      const hasQuote = await Quote.exists({ requestId: request._id, providerId: req.user._id });
      if (!isEligible && !hasQuote) return res.status(403).json({ success: false, message: 'Not authorized to view this request' });
    }

    res.json({ success: true, data: request });
  } catch (err) {
    next(err);
  }
};

export const cancelServiceRequest = async (req, res, next) => {
  try {
    const request = await ServiceRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    if (request.customerId.toString() !== req.user._id.toString() && req.user.role !== 'PLATFORM_ADMIN') {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this request' });
    }

    request.status = 'CANCELLED';
    await request.save();

    res.json({ success: true, message: 'Service Request cancelled', data: request });
  } catch (err) {
    next(err);
  }
};
