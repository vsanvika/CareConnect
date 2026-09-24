import Booking from '../models/Booking.js';
import ProviderProfile from '../models/ProviderProfile.js';
import User from '../models/User.js';
import { AvailabilityService } from './availabilityService.js';

const fail = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const distanceKm = (first, second) => {
  const [firstLng, firstLat] = first;
  const [secondLng, secondLat] = second;
  const earthRadius = 6371;
  const latitudeDelta = (secondLat - firstLat) * Math.PI / 180;
  const longitudeDelta = (secondLng - firstLng) * Math.PI / 180;
  const a = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(firstLat * Math.PI / 180) * Math.cos(secondLat * Math.PI / 180) * Math.sin(longitudeDelta / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const validateProviderAssignment = async (booking, providerId) => {
  const request = booking.requestId;
  const category = request?.categoryId;
  const [providerUser, profile] = await Promise.all([
    User.findById(providerId).select('name email isActive isVerified address'),
    ProviderProfile.findOne({ userId: providerId }),
  ]);

  if (!providerUser || providerUser.role !== 'SERVICE_PROVIDER') throw fail('Selected user is not a service provider', 400);
  if (!providerUser.isActive || !providerUser.isVerified) throw fail('Provider account is not active and verified', 400);
  if (!profile || profile.verificationStatus !== 'VERIFIED') throw fail('Provider is not verified', 400);
  if (!profile.isAvailableNow) throw fail('Provider is currently unavailable', 400);

  const requestSkills = request?.aiAnalysis?.identifiedSkills || category?.requiredSkillTags || [];
  const providerSkills = [...(profile.skillTags || [])].map((skill) => skill.toLowerCase());
  if (requestSkills.length > 0 && !requestSkills.some((skill) => providerSkills.some((providerSkill) => providerSkill.includes(String(skill).toLowerCase()) || String(skill).toLowerCase().includes(providerSkill)))) {
    throw fail('Provider does not match the request skills', 400);
  }

  const requestCoordinates = request?.address?.coordinates;
  const providerCoordinates = profile.location?.coordinates;
  if (requestCoordinates?.length === 2 && providerCoordinates?.length === 2) {
    const distance = distanceKm(requestCoordinates, providerCoordinates);
    if (distance > profile.serviceAreaRadiusKm) throw fail('Provider is outside the request service area', 400);
  } else if (request?.address?.city && providerUser.address?.city && request.address.city.toLowerCase() !== providerUser.address.city.toLowerCase()) {
    throw fail('Provider does not serve the request city', 400);
  }

  await AvailabilityService.assertProviderCanBeBooked(
    providerId,
    booking.scheduledStart,
    booking.scheduledEnd,
    booking._id
  );
  return { providerUser, profile };
};

export const assignProviderToBooking = async (booking, providerId, actorId) => {
  return AvailabilityService.withProviderBookingLock(providerId, async () => {
    const result = await validateProviderAssignment(booking, providerId);
    const previousProviderId = booking.providerId;
    booking.providerId = providerId;
    if (booking.status === 'PENDING') booking.status = 'CONFIRMED';
    booking.statusHistory = booking.statusHistory || [];
    booking.statusHistory.push({
      status: booking.status,
      changedBy: actorId,
      note: previousProviderId?.toString() === providerId.toString() ? 'Provider assignment confirmed.' : 'Provider assigned or reassigned by operations.'
    });
    await booking.save();
    return { ...result, previousProviderId };
  });
};
