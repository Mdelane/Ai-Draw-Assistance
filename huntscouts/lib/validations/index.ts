import { z } from 'zod'

export const signUpSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(72),
  role: z.enum(['hunter', 'outfitter']),
  founding: z.boolean().optional(),
})

export const passwordResetSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export const outfitterProfileSchema = z.object({
  businessName: z.string().min(2).max(100),
  state: z.enum(['CO', 'WY', 'MT', 'UT', 'ID', 'AZ', 'NV']),
  licenseNumber: z.string().max(50).optional(),
  yearsInOperation: z.number().int().min(0).max(100).optional(),
  bio: z.string().max(1000).optional(),
  successRate: z.number().min(0).max(100).optional(),
  guideRatio: z.string().max(20).optional(),
  responseTimeHours: z.number().int().min(1).max(168).optional(),
  instantBookingEnabled: z.boolean().default(false),
})

export const listingSchema = z.object({
  title: z.string().min(5).max(150),
  species: z.array(z.string()).min(1, 'Select at least one species'),
  states: z.array(z.enum(['CO', 'WY', 'MT', 'UT', 'ID', 'AZ', 'NV'])).min(1),
  weaponTypes: z.array(z.string()).optional(),
  huntStyle: z.string().max(50).optional(),
  accessType: z.enum(['public', 'private', 'high_fence', 'mixed']).optional(),
  terrainDifficulty: z.number().int().min(1).max(5).optional(),
  durationDays: z.number().int().min(1).max(30).optional(),
  groupSizeMin: z.number().int().min(1).default(1),
  groupSizeMax: z.number().int().min(1).max(20).optional(),
  lodgingType: z.string().max(50).optional(),
  basePrice: z.number().min(1, 'Price is required'),
  depositAmount: z.number().min(0).optional(),
  description: z.string().max(3000).optional(),
  successRateOverride: z.number().min(0).max(100).optional(),
  isCombinationHunt: z.boolean().default(false),
  adaAccessible: z.boolean().default(false),
  pointsRequired: z.boolean().default(false),
  bookingType: z.enum(['instant', 'request']).default('request'),
  unit: z.string().max(20).optional(),
})

export const bookingSchema = z.object({
  listingId: z.string().uuid(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  partySize: z.number().int().min(1).max(20),
  messageToOutfitter: z.string().max(1000).optional(),
})

export const reviewSchema = z.object({
  bookingId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  body: z.string().max(2000).optional(),
})

export const scoutQuerySchema = z.object({
  state: z.enum(['CO', 'WY', 'MT', 'UT', 'ID', 'AZ', 'NV']),
  species: z.string().min(1),
  weaponType: z.string().min(1),
  points: z.number().int().min(0).max(30),
  year: z.number().int().min(2015).max(2030),
})

export const scoutWeightsSchema = z.object({
  drawOdds: z.number().min(1).max(5),
  trophyQuality: z.number().min(1).max(5),
  publicLandAccess: z.number().min(1).max(5),
  pointsBurnWillingness: z.number().min(1).max(5),
})

export type SignUpInput = z.infer<typeof signUpSchema>
export type OutfitterProfileInput = z.infer<typeof outfitterProfileSchema>
export type ListingInput = z.infer<typeof listingSchema>
export type BookingInput = z.infer<typeof bookingSchema>
export type ReviewInput = z.infer<typeof reviewSchema>
export type ScoutQueryInput = z.infer<typeof scoutQuerySchema>
export type ScoutWeightsInput = z.infer<typeof scoutWeightsSchema>
