export interface Prospect {
  rank: number;
  name: string;
  score: number;
  tier: 'HOT' | 'WARM' | 'COLD';
  type: string;
  phone: string;
  website: string;
  signals: string[];
  reason: string;
}

export interface PipelineEntry {
  id: string;
  prospect: Prospect;
  previewUrl: string;
  status: 'not_contacted' | 'contacted' | 'interested' | 'call_booked' | 'won' | 'lost';
  method: string;
  dateContacted: string;
  followUpDate: string;
  notes: string;
  generatedPrompt: string;
}

export interface Settings {
  senderName: string;
  senderPhone: string;
  workerUrl: string;
  defaultServiceType: string;
}

export interface BuilderState {
  owner: string;
  phone: string;
  location: string;
  stars: string;
  years: string;
  services: string;
  tone: string;
  primaryColor: string;
  accentColor: string;
  font: string;
  aesthetic: string;
  reviews: string;
  story: string;
  offer: string;
  callTracking: string;
  headlineA: string;
  headlineB: string;
}

export interface LayerConfig {
  businessId: boolean;
  location: boolean;
  bizType: boolean;
  goal: boolean;
  visitorStates: boolean;
  objectionMap: boolean;
  competitorRef: boolean;
  hexCodes: boolean;
  fontRefs: boolean;
  aestheticRef: boolean;
  photoDir: boolean;
  animSpec: boolean;
  toneVoice: boolean;
  heroSection: boolean;
  trustStrip: boolean;
  problemSolution: boolean;
  services: boolean;
  socialProof: boolean;
  whyUs: boolean;
  teamBlock: boolean;
  leadCapture: boolean;
  finalCta: boolean;
  footer: boolean;
  originStory: boolean;
  copyRules: boolean;
  techStack: boolean;
  vapiVoice: boolean;
  aiChat: boolean;
  emergencyEscalation: boolean;
  demoModal: boolean;
  animations: boolean;
  scrollReveal: boolean;
  mobileFirst: boolean;
  stickyPhone: boolean;
  cssVars: boolean;
  seoMeta: boolean;
  deployNotes: boolean;
  callTracking: boolean;
  formTracking: boolean;
  convTarget: boolean;
  abTest: boolean;
  ctaEvents: boolean;
  qualityBar: boolean;
}

export const MANDATORY_FEATURES: (keyof LayerConfig)[] = [
  'businessId', 'location', 'bizType', 'goal', 'visitorStates',
  'hexCodes', 'toneVoice',
  'heroSection', 'trustStrip', 'services', 'socialProof', 'leadCapture', 'finalCta', 'footer', 'copyRules',
  'mobileFirst', 'stickyPhone',
  'callTracking', 'convTarget', 'ctaEvents', 'qualityBar',
];

export const DEFAULT_LAYERS: LayerConfig = {
  businessId: true, location: true, bizType: true, goal: true,
  visitorStates: true, objectionMap: true, competitorRef: false,
  hexCodes: true, fontRefs: true, aestheticRef: true, photoDir: true,
  animSpec: true, toneVoice: true,
  heroSection: true, trustStrip: true, problemSolution: true, services: true,
  socialProof: true, whyUs: true, teamBlock: true, leadCapture: true,
  finalCta: true, footer: true, originStory: true, copyRules: true,
  techStack: true, vapiVoice: false, aiChat: false, emergencyEscalation: false,
  demoModal: false, animations: true, scrollReveal: true, mobileFirst: true,
  stickyPhone: true, cssVars: true, seoMeta: false, deployNotes: true,
  callTracking: true, formTracking: true, convTarget: true, abTest: true,
  ctaEvents: true, qualityBar: true,
};
