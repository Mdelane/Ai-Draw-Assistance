export const STATES = ['CO', 'WY', 'MT', 'UT', 'ID', 'AZ', 'NV'] as const
export const STATE_NAMES: Record<string, string> = {
  CO: 'Colorado', WY: 'Wyoming', MT: 'Montana',
  UT: 'Utah', ID: 'Idaho', AZ: 'Arizona', NV: 'Nevada',
}

export const SPECIES = [
  'elk', 'mule deer', 'whitetail', 'pronghorn',
  'bear', 'bighorn sheep', 'mountain goat',
] as const

export const WEAPON_TYPES = ['rifle', 'archery', 'muzzleloader', 'crossbow'] as const

export const HUNT_STYLES = ['spot-and-stalk', 'stand hunting', 'calling', 'dog hunting'] as const

export const ACCESS_TYPES = ['public', 'private', 'high_fence', 'mixed'] as const

export const LODGING_TYPES = [
  'spike camp', 'tent camp', 'wall tent', 'lodge', 'ranch house', 'cabin',
] as const

export const TERRAIN_LABELS = ['', 'Easy', 'Moderate', 'Strenuous', 'Pack-in', 'Extreme'] as const

export const COMMISSION_STANDARD = 0.10
export const COMMISSION_FOUNDING = 0.07

export const SCOUT_MONTHLY_PRICE = 9.99
export const SCOUT_ANNUAL_PRICE = 59.99
