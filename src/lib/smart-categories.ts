/**
 * Smart product categorization engine
 * Analyzes manufacturer, reference, and specs to assign intelligent categories
 */

export type ProductCategory =
  | 'electrical'
  | 'automation'
  | 'hydraulics'
  | 'pneumatics'
  | 'mechanical'
  | 'hvac'
  | 'safety'
  | 'monitoring'
  | 'power-management'
  | 'sensors'
  | 'switches'
  | 'relays'
  | 'motors'
  | 'transformers'
  | 'cables'
  | 'connectors'
  | 'enclosures'
  | 'other';

interface CategoryKeyword {
  pattern: RegExp;
  category: ProductCategory;
  confidence: number;
}

const categoryKeywords: CategoryKeyword[] = [
  // Electrical
  { pattern: /breaker|circuit breaker|contactor|mcb|rcbo/i, category: 'electrical', confidence: 0.95 },
  { pattern: /contactor|magnetic starter/i, category: 'electrical', confidence: 0.9 },
  { pattern: /fuse|fusible/i, category: 'electrical', confidence: 0.85 },

  // Automation & Controls
  { pattern: /plc|programmable logic|siemens s7|ab compactlogix|mitsubishi fx/i, category: 'automation', confidence: 0.95 },
  { pattern: /inverter|frequency converter|vfd|acs|altivar/i, category: 'automation', confidence: 0.9 },
  { pattern: /hmi|touch panel|human machine interface/i, category: 'automation', confidence: 0.9 },

  // Hydraulics
  { pattern: /hydraulic|pump|cylinder|valve.*hydraulic|pressure control/i, category: 'hydraulics', confidence: 0.9 },
  { pattern: /rexroth|eaton.*hydraulic|bosch.*hydraulic/i, category: 'hydraulics', confidence: 0.85 },

  // Pneumatics
  { pattern: /pneumatic|air.*valve|solenoid.*valve|festo|schunk|smcelectronics/i, category: 'pneumatics', confidence: 0.9 },
  { pattern: /pneumatic cylinder|air compressor regulator/i, category: 'pneumatics', confidence: 0.85 },

  // Mechanical
  { pattern: /bearing|bush|coupling|gearbox|seal/i, category: 'mechanical', confidence: 0.85 },
  { pattern: /skf|timken|ina|fag|nsk|koyo/i, category: 'mechanical', confidence: 0.8 },

  // HVAC
  { pattern: /thermostat|hvac|heating|cooling|compressor.*refriger|chiller/i, category: 'hvac', confidence: 0.9 },
  { pattern: /danfoss|copeland|daikin|carrier/i, category: 'hvac', confidence: 0.85 },

  // Safety
  { pattern: /safety|emergency|e-stop|emergency stop|safety relay|safety plc/i, category: 'safety', confidence: 0.95 },
  { pattern: /siemens.*safety|phoenix.*safety|leuze/i, category: 'safety', confidence: 0.9 },

  // Monitoring & Supervision
  { pattern: /monitoring|supervision|logger|data acquisition|scada|telemetry/i, category: 'monitoring', confidence: 0.85 },
  { pattern: /temperature.*sensor.*wireless|vibration.*monitoring/i, category: 'monitoring', confidence: 0.8 },

  // Power Management
  { pattern: /power.*supply|ups|uninterruptible|power distribution|switchgear/i, category: 'power-management', confidence: 0.9 },
  { pattern: /stabilizer|voltage.*regulator|transformer/i, category: 'power-management', confidence: 0.8 },

  // Sensors
  { pattern: /sensor|proximity|inductive|capacitive|photoelectric|temperature.*sensor|pressure.*sensor/i, category: 'sensors', confidence: 0.9 },
  { pattern: /balluff|sick|leuze|baumer|banner/i, category: 'sensors', confidence: 0.85 },

  // Switches & Relays
  { pattern: /switch|relay|push button|selector switch|industrial switch/i, category: 'switches', confidence: 0.85 },
  { pattern: /schmersal|eaton.*switch|schneider.*switch|siemens.*switch/i, category: 'switches', confidence: 0.8 },

  // Motors
  { pattern: /motor|electric.*motor|ac motor|dc motor|servo motor|stepper/i, category: 'motors', confidence: 0.9 },
  { pattern: /siemens.*motor|abb.*motor|weg|baldor/i, category: 'motors', confidence: 0.85 },

  // Transformers
  { pattern: /transformer|step.*down|step.*up|isolation transformer|control transformer/i, category: 'transformers', confidence: 0.9 },

  // Cables & Connectors
  { pattern: /cable|wire|connector|connector.*industrial|circular connector/i, category: 'cables', confidence: 0.85 },
  { pattern: /m12|m8 connector|harting|phoenix.*contact.*connector/i, category: 'connectors', confidence: 0.9 },

  // Enclosures
  { pattern: /enclosure|cabinet|control panel|ip65|ip66|stainless.*enclosure/i, category: 'enclosures', confidence: 0.85 },
  { pattern: /rittal|hoffman|phoenix.*enclosure/i, category: 'enclosures', confidence: 0.8 },
];

/**
 * Auto-detect product category based on reference, manufacturer, and specs
 */
export function autoDetectCategory(
  reference: string,
  manufacturer: string | null,
  specs?: Record<string, string | null>
): { category: ProductCategory; confidence: number } {
  const searchText = [reference, manufacturer, Object.values(specs || {}).join(' ')].filter(Boolean).join(' ');

  let bestMatch: { category: ProductCategory; confidence: number } = {
    category: 'other',
    confidence: 0,
  };

  for (const keyword of categoryKeywords) {
    if (keyword.pattern.test(searchText)) {
      if (keyword.confidence > bestMatch.confidence) {
        bestMatch = { category: keyword.category, confidence: keyword.confidence };
      }
    }
  }

  return bestMatch;
}

/**
 * Get all available categories
 */
export function getAllCategories(): { value: ProductCategory; label: string }[] {
  return [
    { value: 'electrical', label: 'Electrical' },
    { value: 'automation', label: 'Automation & Controls' },
    { value: 'hydraulics', label: 'Hydraulics' },
    { value: 'pneumatics', label: 'Pneumatics' },
    { value: 'mechanical', label: 'Mechanical' },
    { value: 'hvac', label: 'HVAC' },
    { value: 'safety', label: 'Safety' },
    { value: 'monitoring', label: 'Monitoring' },
    { value: 'power-management', label: 'Power Management' },
    { value: 'sensors', label: 'Sensors' },
    { value: 'switches', label: 'Switches & Relays' },
    { value: 'motors', label: 'Motors' },
    { value: 'transformers', label: 'Transformers' },
    { value: 'cables', label: 'Cables & Connectors' },
    { value: 'connectors', label: 'Connectors' },
    { value: 'enclosures', label: 'Enclosures' },
    { value: 'other', label: 'Other' },
  ];
}

/**
 * Get label for category
 */
export function getCategoryLabel(category: ProductCategory): string {
  const cat = getAllCategories().find((c) => c.value === category);
  return cat?.label || 'Other';
}
