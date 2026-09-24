import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import ProviderProfile from '../models/ProviderProfile.js';
import ServiceCategory from '../models/ServiceCategory.js';
import ServiceRequest from '../models/ServiceRequest.js';
import Quote from '../models/Quote.js';
import Booking from '../models/Booking.js';
import JobEvidence from '../models/JobEvidence.js';
import Invoice from '../models/Invoice.js';
import Dispute from '../models/Dispute.js';
import Notification from '../models/Notification.js';
import Review from '../models/Review.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    await connectDB();

    console.log('[Seed Engine] Clearing existing database collections...');
    await User.deleteMany();
    await ProviderProfile.deleteMany();
    await ServiceCategory.deleteMany();
    await ServiceRequest.deleteMany();
    await Quote.deleteMany();
    await Booking.deleteMany();
    await JobEvidence.deleteMany();
    await Invoice.deleteMany();
    await Dispute.deleteMany();
    await Notification.deleteMany();
    await Review.deleteMany();

    console.log('[Seed Engine] Seeding Service Categories...');
    const categoriesData = [
      { name: 'Plumbing', slug: 'plumbing', description: 'Pipe repair, leak detection, drain cleaning & fixture setup.', icon: 'Droplets', basePrice: 65, requiredSkillTags: ['pipe-repair', 'leak-detection', 'drain-cleaning'] },
      { name: 'Electrical', slug: 'electrical', description: 'Wiring, circuit breaker repair, light installation & safety audits.', icon: 'Zap', basePrice: 75, requiredSkillTags: ['wiring', 'circuit-breaker', 'fixture-installation'] },
      { name: 'Cleaning', slug: 'cleaning', description: 'Home deep cleaning, kitchen sanitization & carpet washing.', icon: 'Sparkles', basePrice: 50, requiredSkillTags: ['deep-cleaning', 'sanitization', 'carpet-wash'] },
      { name: 'Appliance Repair', slug: 'appliance-repair', description: 'Washing machines, refrigerators, microwave & oven diagnostics.', icon: 'Tv', basePrice: 60, requiredSkillTags: ['appliance-diagnostics', 'motor-replacement', 'gasket-repair'] },
      { name: 'AC/HVAC', slug: 'ac-hvac', description: 'AC servicing, gas refill, filter cleaning & compressor repairs.', icon: 'Wind', basePrice: 85, requiredSkillTags: ['ac-servicing', 'refrigerant-refill', 'compressor-repair'] },
      { name: 'Carpentry', slug: 'carpentry', description: 'Furniture repair, door alignment, custom shelving & woodwork.', icon: 'Hammer', basePrice: 55, requiredSkillTags: ['woodwork', 'furniture-assembly', 'door-repair'] },
      { name: 'Painting', slug: 'painting', description: 'Interior/exterior wall painting, primer coating & touch-ups.', icon: 'Paintbrush', basePrice: 110, requiredSkillTags: ['wall-painting', 'primer-coating', 'surface-prep'] },
      { name: 'Home Maintenance', slug: 'home-maintenance', description: 'General odd jobs, mounting TVs, door lock repairs & handyman services.', icon: 'Wrench', basePrice: 45, requiredSkillTags: ['general-repair', 'handyman', 'mounting'] },
      { name: 'Pest Control', slug: 'pest-control', description: 'Termite treatment, cockroach control, bedbug & rodent removal.', icon: 'Bug', basePrice: 80, requiredSkillTags: ['fumigation', 'termite-treatment', 'pest-repellent'] }
    ];

    const createdCategories = await ServiceCategory.insertMany(categoriesData);
    const categoryMap = {};
    createdCategories.forEach(c => { categoryMap[c.slug] = c; });

    const customer = {
      _id: new mongoose.Types.ObjectId(),
      name: 'Sample Customer',
      email: 'customer@example.com',
      role: 'CUSTOMER',
      phone: '+1 (555) 234-5678',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      address: { street: '742 Evergreen Terrace', city: 'Metro City', zipCode: '10001' }
    };

    const providerUser1 = {
      _id: new mongoose.Types.ObjectId(),
      name: 'Sample Provider',
      email: 'provider@example.com',
      role: 'SERVICE_PROVIDER',
      phone: '+1 (555) 876-5432',
      avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150',
      address: { street: '123 Craftsman Way', city: 'Metro City', zipCode: '10002' }
    };

    const providerUser2 = {
      _id: new mongoose.Types.ObjectId(),
      name: 'Sample Provider 2',
      email: 'provider2@example.com',
      role: 'SERVICE_PROVIDER',
      phone: '+1 (555) 999-1122',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      address: { street: '456 Innovation Drive', city: 'Metro City', zipCode: '10003' }
    };

    const opsManager = {
      _id: new mongoose.Types.ObjectId(),
      name: 'Operations Manager',
      email: 'ops@example.com',
      role: 'OPERATIONS_MANAGER',
      phone: '+1 (555) 333-4444',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'
    };

    const supportAgent = {
      _id: new mongoose.Types.ObjectId(),
      name: 'Support Agent',
      email: 'support@example.com',
      role: 'SUPPORT_AGENT',
      phone: '+1 (555) 555-6666',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
    };

    const adminUser = {
      _id: new mongoose.Types.ObjectId(),
      name: 'Platform Admin',
      email: 'admin@example.com',
      role: 'PLATFORM_ADMIN',
      phone: '+1 (555) 000-1111',
      avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150'
    };

    console.log('[Seed Engine] Seeding Provider Profiles...');
    await ProviderProfile.create({
      userId: providerUser1._id,
      businessName: 'Miller Plumbing & Pipe Diagnostics',
      skills: [categoryMap['plumbing']._id, categoryMap['home-maintenance']._id],
      skillTags: ['pipe-repair', 'leak-detection', 'drain-cleaning', 'general-repair'],
      experienceYears: 8,
      hourlyRate: 65,
      verificationStatus: 'VERIFIED',
      ratingAverage: 4.9,
      ratingCount: 34,
      completedJobsCount: 42,
      bio: 'Certified Master Plumber with over 8 years experience in residential emergency leaks and fixture upgrades.'
    });

    await ProviderProfile.create({
      userId: providerUser2._id,
      businessName: 'Ruiz Air & Power Solutions',
      skills: [categoryMap['ac-hvac']._id, categoryMap['electrical']._id, categoryMap['appliance-repair']._id],
      skillTags: ['ac-servicing', 'refrigerant-refill', 'wiring', 'circuit-breaker', 'Washing Machine Repair', 'appliance-diagnostics', 'motor-replacement'],
      experienceYears: 6,
      hourlyRate: 75,
      verificationStatus: 'VERIFIED',
      ratingAverage: 4.8,
      ratingCount: 22,
      completedJobsCount: 29,
      bio: 'Licensed electrician and HVAC technician specializing in split AC units and home panel upgrades.'
    });

    console.log('[Seed Engine] Seeding Sample Requests, Quotes, Bookings & Disputes...');

    // Request 1: Quoting State
    const req1 = await ServiceRequest.create({
      customerId: customer._id,
      categoryId: categoryMap['plumbing']._id,
      title: 'Kitchen Sink Water Pipe Leaking Rapidly',
      description: 'The pipe under the main kitchen sink has developed a severe leak near the trap connector. Need urgent pipe repair.',
      urgency: 'HIGH',
      preferredDate: new Date(Date.now() + 86400000),
      timeSlot: '09:00 AM - 12:00 PM',
      address: customer.address,
      aiAnalysis: {
        classifiedCategoryName: 'Plumbing',
        identifiedSkills: ['pipe-repair', 'leak-detection'],
        urgencyScore: 8,
        estimatedCostRange: { min: 75, max: 180 },
        reasoning: 'Keyword match for pipe leak in kitchen.'
      },
      eligibleProviders: [
        { providerId: providerUser1._id, matchScore: 95, matchReasoning: 'Master plumber, 4.9 stars rating, located 2.1 miles away.' }
      ],
      status: 'QUOTING'
    });

    await Quote.create({
      requestId: req1._id,
      providerId: providerUser1._id,
      amount: 120,
      breakdown: { labor: 85, materials: 25, calloutFee: 10 },
      estimatedDurationHours: 2,
      proposedDateSlot: 'Tomorrow at 9:30 AM',
      notes: 'Includes diagnostic, replacement brass trap seal, and 1-year guarantee.',
      status: 'SUBMITTED'
    });

    // Request 2: Completed Job with Invoice & Review
    const req2 = await ServiceRequest.create({
      customerId: customer._id,
      categoryId: categoryMap['ac-hvac']._id,
      title: 'Living Room Split AC Cooling Servicing',
      description: 'AC unit is blowing lukewarm air. Needs refrigerant pressure check and coil deep cleaning.',
      urgency: 'MEDIUM',
      preferredDate: new Date(Date.now() - 172800000),
      timeSlot: '02:00 PM - 05:00 PM',
      address: customer.address,
      aiAnalysis: {
        classifiedCategoryName: 'AC/HVAC',
        identifiedSkills: ['ac-servicing', 'refrigerant-refill'],
        urgencyScore: 6,
        estimatedCostRange: { min: 90, max: 220 },
        reasoning: 'Matched AC cooling keywords.'
      },
      status: 'COMPLETED'
    });

    const quote2 = await Quote.create({
      requestId: req2._id,
      providerId: providerUser2._id,
      amount: 150,
      breakdown: { labor: 90, materials: 45, calloutFee: 15 },
      estimatedDurationHours: 3,
      proposedDateSlot: 'Completed Yesterday',
      status: 'ACCEPTED'
    });

    const booking2 = await Booking.create({
      requestId: req2._id,
      quoteId: quote2._id,
      customerId: customer._id,
      providerId: providerUser2._id,
      scheduledStart: new Date(Date.now() - 172800000),
      scheduledEnd: new Date(Date.now() - 162000000),
      totalAmount: 150,
      status: 'CUSTOMER_CONFIRMED',
      completedAt: new Date(Date.now() - 162000000)
    });

    await JobEvidence.create({
      bookingId: booking2._id,
      uploadedBy: providerUser2._id,
      evidenceType: 'AFTER_PHOTO',
      fileUrls: ['https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600'],
      notes: 'Refrigerant pressure restored to 65 PSI. Filter washed.'
    });

    await Invoice.create({
      bookingId: booking2._id,
      invoiceNumber: 'INV-88421-901',
      customerId: customer._id,
      providerId: providerUser2._id,
      lineItems: [
        { description: 'HVAC Diagnostics & Deep Cleaning', amount: 90 },
        { description: 'R-410A Refrigerant Refill', amount: 45 },
        { description: 'Dispatch Fee', amount: 15 }
      ],
      subtotal: 150,
      platformFee: 15,
      tax: 7.5,
      totalAmount: 157.5,
      paymentStatus: 'PAID',
      paidAt: new Date()
    });

    await Review.create({
      bookingId: booking2._id,
      customerId: customer._id,
      providerId: providerUser2._id,
      rating: 5,
      comment: 'Carlos arrived on time and fixed the AC in under two hours! Extremely professional.'
    });

    // Request 3: Active Dispute
    const req3 = await ServiceRequest.create({
      customerId: customer._id,
      categoryId: categoryMap['electrical']._id,
      title: 'Main Hallway Light Fixture Short Circuit',
      description: 'Breaker keeps tripping whenever hallway switch is flipped.',
      urgency: 'HIGH',
      preferredDate: new Date(Date.now() - 86400000),
      address: customer.address,
      status: 'DISPUTED'
    });

    const quote3 = await Quote.create({
      requestId: req3._id,
      providerId: providerUser2._id,
      amount: 110,
      status: 'ACCEPTED'
    });

    const booking3 = await Booking.create({
      requestId: req3._id,
      quoteId: quote3._id,
      customerId: customer._id,
      providerId: providerUser2._id,
      scheduledStart: new Date(Date.now() - 86400000),
      scheduledEnd: new Date(Date.now() - 79200000),
      totalAmount: 110,
      status: 'DISPUTED'
    });

    await Dispute.create({
      bookingId: booking3._id,
      openedBy: customer._id,
      assignedAgentId: supportAgent._id,
      reason: 'Workmanship Defect',
      description: 'Provider claimed the short circuit was fixed, but the breaker tripped again 10 minutes after he left.',
      evidenceUrls: ['https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=500'],
      status: 'UNDER_REVIEW',
      history: [
        { senderId: customer._id, message: 'Dispute opened regarding recurring breaker trips.' },
        { senderId: supportAgent._id, message: 'Investigating issue with provider Carlos Ruiz.' }
      ]
    });

    console.log('----------------------------------------------------');
    console.log('✅ CareConnect Seed Complete!');
    console.log('Seed data generated without demo user credentials.');
    console.log('----------------------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error(`[Seed Error] ${error.message}`);
    process.exit(1);
  }
};

seedDatabase();
