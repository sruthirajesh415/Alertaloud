export interface UserLocation {
  city: string;
  district?: string;
  state: string;
  country: string;
  countryCode: string;
  lat: number;
  lon: number;
  displayName: string;
  detectedNativeLanguage: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  phone: string;
}

export interface Neighbour {
  id: string;
  name: string;
  phone: string; // WhatsApp number with country code
  houseDetails: string;
}

export interface NearbyService {
  type: "hospital" | "police" | "fire";
  name: string;
  phone: string;
  address?: string;
  distance?: string;
  lat?: number;
  lon?: number;
}

export interface Household {
  id: string;
  primaryPhone: string;
  householdName: string;
  address: string;
  buildingType: string;
  totalMembers: number;
  eldersCount: number;
  childrenCount: number;
  bedriddenCount: number;
  medicalConditions: string[];
  lifeSavingMedicines: string[];
  powerDependentDevices: string[];
  pets: string;
  familyMembers: FamilyMember[];
  neighbours: Neighbour[];
  location: UserLocation;
  nearbyServices: NearbyService[];
  rescueCardShared: boolean;
  rescueDispatched?: boolean;
  rescueDispatchedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type AlertTier = "CRITICAL" | "WARNING" | "ADVISORY";

export interface AlertData {
  id: string;
  tier: AlertTier;
  hazardName: string;
  headline: string;
  timeWindow: string;
  isOfficialVerified: boolean;
  officialSource: string;
  immediateLifeSavingSteps: string[];
  detailedActionSteps: string[];
  whatToTake: string[];
  whereToGo: string;
  responsibleAuthority: {
    type: "Fire" | "Ambulance" | "Police" | "Disaster Control";
    name: string;
    primaryNumber: string;
  };
  helplineNumbers: string[];
  practicalDisclaimer?: string;
  active: boolean;
  timestamp: string;
}

export interface EmergencyGuide {
  id: string;
  title: string;
  category: "natural" | "household";
  icon: string;
  image?: string;
  authority: string;
  isOfficial: boolean;
  summary: string;
  shortDescription?: string;
  before: string[];
  during: string[];
  after: string[];
  checklist: string[];
  whereToGo: string;
  emergencyNumber: string;
  responsibleDept: string;
}

export interface RescueCard {
  id: string;
  householdName: string;
  phone: string;
  city: string;
  state: string;
  country: string;
  address: string;
  lat?: number;
  lon?: number;
  totalMembers: number;
  eldersCount: number;
  childrenCount: number;
  bedriddenCount: number;
  medicalConditions: string[];
  lifeSavingMedicines: string[];
  powerDependentDevices: string[];
  pets: string;
  vulnerabilityScore: number;
  dispatched: boolean;
  dispatchedAt?: string;
  submittedAt: string;
  activeAlert?: string;
}

export interface SOSDispatch {
  id: string;
  householdName: string;
  senderPhone: string;
  emergencyType: string;
  city: string;
  state: string;
  country: string;
  lat: number;
  lon: number;
  audioBase64?: string;
  vulnerabilitySummary: string;
  timestamp: string;
  dispatched: boolean;
}

export interface ActiveUserSession {
  phone: string;
  householdId: string;
  memberName: string;
  loggedInAt: string;
}
