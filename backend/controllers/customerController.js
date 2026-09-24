import HomeProfile from '../models/HomeProfile.js';
import MaintenanceRecord from '../models/MaintenanceRecord.js';

export const getHomeProfile = async (req, res, next) => {
  try {
    let profile = await HomeProfile.findOne({ customerId: req.user._id });
    if (!profile) {
      profile = await HomeProfile.create({ customerId: req.user._id, homeType: 'Apartment', location: '' });
    }
    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};

export const saveHomeProfile = async (req, res, next) => {
  try {
    const { homeType, approximateSize, numberOfRooms, location, appliances, maintenanceNotes } = req.body;
    const profile = await HomeProfile.findOneAndUpdate(
      { customerId: req.user._id },
      {
        $set: {
          homeType: homeType || 'Apartment',
          approximateSize: approximateSize || '',
          numberOfRooms: Number(numberOfRooms || 0),
          location: location || '',
          maintenanceNotes: maintenanceNotes || '',
          lastUpdatedAt: new Date()
        },
        $addToSet: { appliances: appliances || [] }
      },
      { new: true, upsert: true, runValidators: true }
    );
    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};

export const getMaintenanceHistory = async (req, res, next) => {
  try {
    const records = await MaintenanceRecord.find({ customerId: req.user._id }).sort({ serviceDate: -1 });
    res.json({ success: true, data: records });
  } catch (error) {
    next(error);
  }
};

export const createMaintenanceRecord = async (req, res, next) => {
  try {
    const payload = {
      customerId: req.user._id,
      ...req.body,
      serviceDate: req.body.serviceDate || new Date(),
      cost: Number(req.body.cost || 0)
    };
    const record = await MaintenanceRecord.create(payload);
    res.status(201).json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
};

export const getMaintenanceRecommendations = async (req, res, next) => {
  try {
    const records = await MaintenanceRecord.find({ customerId: req.user._id }).sort({ serviceDate: -1 }).limit(10);
    const recommendations = records.map((record) => ({
      _id: record._id,
      applianceName: record.applianceName || record.category,
      category: record.category,
      message: `Recommended maintenance interval for ${record.applianceName || record.category} based on previous service history.`,
      suggestedDate: record.nextRecommendedServiceDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }));
    res.json({ success: true, data: recommendations });
  } catch (error) {
    next(error);
  }
};
