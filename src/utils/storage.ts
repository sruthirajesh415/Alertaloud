import { Household, ActiveUserSession, AlertData } from "../types";

const STORAGE_ACTIVE_USER = "alertaloud_active_user";
const STORAGE_HOUSEHOLDS = "alertaloud_households";
const STORAGE_ACTIVE_ALERT = "alertaloud_active_alert";
const STORAGE_SELECTED_LANG = "alertaloud_selected_lang";

// 1. User Session Management
export function getActiveUserSession(): ActiveUserSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_ACTIVE_USER);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setActiveUserSession(session: ActiveUserSession | null) {
  if (!session) {
    localStorage.removeItem(STORAGE_ACTIVE_USER);
  } else {
    localStorage.setItem(STORAGE_ACTIVE_USER, JSON.stringify(session));
  }
}

// 2. Household Management & Family Shared Lookup
export function getAllHouseholds(): Household[] {
  try {
    const raw = localStorage.getItem(STORAGE_HOUSEHOLDS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveHousehold(household: Household): Household {
  const households = getAllHouseholds();
  const index = households.findIndex((h) => h.id === household.id);

  const updated: Household = {
    ...household,
    updatedAt: new Date().toISOString(),
  };

  if (index >= 0) {
    households[index] = updated;
  } else {
    households.push(updated);
  }

  localStorage.setItem(STORAGE_HOUSEHOLDS, JSON.stringify(households));

  // Sync with backend rescue card registry
  syncRescueCardWithServer(updated);

  return updated;
}

export interface SampleCitizenProfile {
  id: string;
  phone: string;
  memberName: string;
  householdName: string;
  city: string;
  state: string;
  country: string;
  countryCode: string;
  lat: number;
  lon: number;
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
  familyMembers: { id: string; name: string; relationship: string; phone: string }[];
  highlight: string;
}

export const SAMPLE_CITIZEN_PROFILES: SampleCitizenProfile[] = [
  {
    id: "sample-hh-1",
    phone: "+91 98401 23456",
    memberName: "Rajesh Sharma",
    householdName: "Sharma Family Residence",
    city: "Hosur",
    state: "Tamil Nadu",
    country: "India",
    countryCode: "IN",
    lat: 12.7409,
    lon: 77.8253,
    address: "Block 14, Riverside Road, Ground Floor",
    buildingType: "Ground floor",
    totalMembers: 4,
    eldersCount: 1,
    childrenCount: 1,
    bedriddenCount: 1,
    medicalConditions: ["Congestive Heart Failure", "Post-Stroke Immobility"],
    lifeSavingMedicines: ["Nitroglycerin sublingual", "Warfarin", "Insulin"],
    powerDependentDevices: ["Philips Respironics Oxygen Concentrator (Continuous 3L/min)"],
    pets: "1 Dog (Labrador)",
    familyMembers: [
      { id: "fm-s1-1", name: "Priya Sharma", relationship: "Wife", phone: "+91 98401 23457" },
      { id: "fm-s1-2", name: "Aarav Sharma", relationship: "Son", phone: "+91 98401 23458" },
      { id: "fm-s1-3", name: "Ramnath Sharma", relationship: "Father (Elder)", phone: "+91 98401 23459" },
    ],
    highlight: "🚨 1 Bedridden elder with continuous oxygen concentrator machine",
  },
  {
    id: "sample-hh-2",
    phone: "+1 415 892 3411",
    memberName: "Sarah Jenkins",
    householdName: "Jenkins Family Apartment",
    city: "San Francisco",
    state: "California",
    country: "United States",
    countryCode: "US",
    lat: 37.7749,
    lon: -122.4194,
    address: "742 Montgomery St, Apt 3B",
    buildingType: "Apartment floor (Low)",
    totalMembers: 3,
    eldersCount: 0,
    childrenCount: 1,
    bedriddenCount: 0,
    medicalConditions: ["Pediatric Severe Asthma", "Peanut Anaphylaxis"],
    lifeSavingMedicines: ["Albuterol Inhaler", "EpiPen Jr. (2x)"],
    powerDependentDevices: ["Ultrasonic Nebulizer"],
    pets: "None",
    familyMembers: [
      { id: "fm-s2-1", name: "Mark Jenkins", relationship: "Spouse", phone: "+1 415 892 3412" },
      { id: "fm-s2-2", name: "Lily Jenkins", relationship: "Daughter (Age 3)", phone: "+1 415 892 3413" },
    ],
    highlight: "👶 Toddler with pediatric asthma, nebulizer & emergency EpiPen",
  },
  {
    id: "sample-hh-3",
    phone: "+81 90 4521 8890",
    memberName: "Kenji Takahashi",
    householdName: "Takahashi Residence",
    city: "Tokyo",
    state: "Tokyo",
    country: "Japan",
    countryCode: "JP",
    lat: 35.6762,
    lon: 139.6503,
    address: "Minato-ku, Roppongi 5-Chome, Bldg 802",
    buildingType: "Apartment floor (High)",
    totalMembers: 2,
    eldersCount: 1,
    childrenCount: 0,
    bedriddenCount: 0,
    medicalConditions: ["Cardiac Pacemaker", "Mobility Impairment"],
    lifeSavingMedicines: ["Beta blockers", "Amlodipine"],
    powerDependentDevices: ["None"],
    pets: "1 Cat",
    familyMembers: [
      { id: "fm-s3-1", name: "Chiyo Takahashi", relationship: "Grandmother (Age 84)", phone: "+81 90 4521 8891" },
    ],
    highlight: "👵 84-year-old grandmother with pacemaker on 8th floor",
  },
  {
    id: "sample-hh-4",
    phone: "+44 7700 900142",
    memberName: "David Miller",
    householdName: "Miller Family Riverside Flat",
    city: "London",
    state: "England",
    country: "United Kingdom",
    countryCode: "GB",
    lat: 51.5074,
    lon: -0.1278,
    address: "24 Thames Bank Walk, Ground Floor",
    buildingType: "Ground floor",
    totalMembers: 3,
    eldersCount: 1,
    childrenCount: 0,
    bedriddenCount: 1,
    medicalConditions: ["End-Stage Renal Disease (ESRD)", "Wheelchair Bound"],
    lifeSavingMedicines: ["Phosphate binders", "Erythropoietin"],
    powerDependentDevices: ["Peritoneal Home Dialysis Cycler"],
    pets: "None",
    familyMembers: [
      { id: "fm-s4-1", name: "Emma Miller", relationship: "Sister", phone: "+44 7700 900143" },
      { id: "fm-s4-2", name: "Arthur Miller", relationship: "Uncle (Wheelchair)", phone: "+44 7700 900144" },
    ],
    highlight: "⚡ Home dialysis machine & flood risk near river level",
  },
  {
    id: "sample-hh-5",
    phone: "+971 50 123 4567",
    memberName: "Amina Al-Mansoor",
    householdName: "Al-Mansoor Villa",
    city: "Dubai",
    state: "Dubai",
    country: "United Arab Emirates",
    countryCode: "AE",
    lat: 25.2048,
    lon: 55.2708,
    address: "Villa 42, Jumeirah Sector 2",
    buildingType: "Ground floor",
    totalMembers: 5,
    eldersCount: 1,
    childrenCount: 2,
    bedriddenCount: 0,
    medicalConditions: ["Severe Chronic Bronchitis", "Type 1 Diabetes"],
    lifeSavingMedicines: ["Rapid-acting Insulin vials", "Prednisone", "Bronchodilators"],
    powerDependentDevices: ["Continuous CPAP Respirator"],
    pets: "None",
    familyMembers: [
      { id: "fm-s5-1", name: "Tariq Al-Mansoor", relationship: "Spouse", phone: "+971 50 123 4568" },
      { id: "fm-s5-2", name: "Fatima Al-Mansoor", relationship: "Mother (Elder)", phone: "+971 50 123 4569" },
    ],
    highlight: "🌬️ CPAP respirator equipment & refrigerated insulin vials",
  },
  {
    id: "sample-hh-6",
    phone: "+1 305 764 9901",
    memberName: "Carlos Rodriguez",
    householdName: "Rodriguez Coastal Residence",
    city: "Miami",
    state: "Florida",
    country: "United States",
    countryCode: "US",
    lat: 25.7617,
    lon: -80.1918,
    address: "114 Ocean Drive, Key Sector",
    buildingType: "Near river / coast",
    totalMembers: 4,
    eldersCount: 0,
    childrenCount: 2,
    bedriddenCount: 0,
    medicalConditions: ["Severe Dust/Smoke Allergy", "Hypertension"],
    lifeSavingMedicines: ["Antihistamines", "Lisinopril"],
    powerDependentDevices: ["None"],
    pets: "2 Dogs (Evacuation crates ready)",
    familyMembers: [
      { id: "fm-s6-1", name: "Maria Rodriguez", relationship: "Wife", phone: "+1 305 764 9902" },
      { id: "fm-s6-2", name: "Mateo Rodriguez", relationship: "Son", phone: "+1 305 764 9903" },
    ],
    highlight: "🌊 Coastal flood zone with hurricane evacuation crates",
  },
];

// Helper to convert sample citizen profile to Household
export function sampleProfileToHousehold(sp: SampleCitizenProfile): Household {
  return {
    id: sp.id,
    primaryPhone: sp.phone,
    householdName: sp.householdName,
    address: sp.address,
    buildingType: sp.buildingType,
    totalMembers: sp.totalMembers,
    eldersCount: sp.eldersCount,
    childrenCount: sp.childrenCount,
    bedriddenCount: sp.bedriddenCount,
    medicalConditions: sp.medicalConditions,
    lifeSavingMedicines: sp.lifeSavingMedicines,
    powerDependentDevices: sp.powerDependentDevices,
    pets: sp.pets,
    familyMembers: sp.familyMembers,
    neighbours: [
      { id: `nb-${sp.id}`, name: "Next Door Neighbour", phone: "+1 555 019 9999", houseDetails: "Apt 2B" }
    ],
    location: {
      city: sp.city,
      state: sp.state,
      country: sp.country,
      countryCode: sp.countryCode,
      lat: sp.lat,
      lon: sp.lon,
      displayName: `${sp.city}, ${sp.state ? sp.state + ", " : ""}${sp.country}`,
      detectedNativeLanguage: "en",
    },
    nearbyServices: [
      { type: "hospital", name: `${sp.city} Emergency Hospital`, phone: "112", address: "Main Medical Ave" },
      { type: "police", name: `${sp.city} Central Station`, phone: "112", address: "Civic Center" },
      { type: "fire", name: `${sp.city} Fire & Rescue`, phone: "112", address: "Emergency Ring Rd" },
    ],
    rescueCardShared: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function normalizePhoneDigits(phone: string): string {
  return (phone || "").replace(/[^0-9]/g, "");
}

export function isPhoneMatch(p1: string, p2: string): boolean {
  const d1 = normalizePhoneDigits(p1);
  const d2 = normalizePhoneDigits(p2);
  if (!d1 || !d2) return false;
  if (d1 === d2) return true;
  // If one ends with the other (minimum 7 digits to prevent false positives)
  if (d1.length >= 7 && d2.length >= 7) {
    if (d1.endsWith(d2) || d2.endsWith(d1)) return true;
    const last10_1 = d1.slice(-10);
    const last10_2 = d2.slice(-10);
    if (last10_1 === last10_2) return true;
  }
  return false;
}

export function findHouseholdByPhone(phone: string): { household: Household; matchedMemberName: string } | null {
  const digits = normalizePhoneDigits(phone);
  if (!digits || digits.length < 5) return null;

  // 1. Check in stored households
  const households = getAllHouseholds();

  for (const h of households) {
    // Check primary phone
    if (isPhoneMatch(h.primaryPhone, phone)) {
      return { household: h, matchedMemberName: h.householdName || "Head of Household" };
    }

    // Check registered family members' phones
    for (const member of h.familyMembers || []) {
      if (member.phone && isPhoneMatch(member.phone, phone)) {
        return { household: h, matchedMemberName: member.name || "Family Member" };
      }
    }
  }

  // 2. Also check predefined sample citizens
  for (const sample of SAMPLE_CITIZEN_PROFILES) {
    if (isPhoneMatch(sample.phone, phone)) {
      const hh = sampleProfileToHousehold(sample);
      saveHousehold(hh);
      return { household: hh, matchedMemberName: sample.memberName };
    }

    for (const member of sample.familyMembers) {
      if (member.phone && isPhoneMatch(member.phone, phone)) {
        const hh = sampleProfileToHousehold(sample);
        saveHousehold(hh);
        return { household: hh, matchedMemberName: member.name };
      }
    }
  }

  return null;
}

export function getHouseholdById(id: string): Household | null {
  const households = getAllHouseholds();
  return households.find((h) => h.id === id) || null;
}

// 3. Active Alert State (Live or Simulated)
export function getStoredActiveAlert(): AlertData | null {
  try {
    const raw = localStorage.getItem(STORAGE_ACTIVE_ALERT);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredActiveAlert(alert: AlertData | null) {
  if (!alert) {
    localStorage.removeItem(STORAGE_ACTIVE_ALERT);
  } else {
    localStorage.setItem(STORAGE_ACTIVE_ALERT, JSON.stringify(alert));
  }
}

// 4. Stored Language Preference
export function getStoredLanguage(): string | null {
  return localStorage.getItem(STORAGE_SELECTED_LANG);
}

export function setStoredLanguage(langCode: string) {
  localStorage.setItem(STORAGE_SELECTED_LANG, langCode);
}

// 5. Backend sync for Rescue Cards
async function syncRescueCardWithServer(household: Household) {
  try {
    await fetch("/api/rescue-cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: household.id,
        householdName: household.householdName,
        phone: household.primaryPhone,
        city: household.location.city,
        state: household.location.state,
        country: household.location.country,
        address: household.address,
        lat: household.location.lat,
        lon: household.location.lon,
        totalMembers: household.totalMembers,
        eldersCount: household.eldersCount,
        childrenCount: household.childrenCount,
        bedriddenCount: household.bedriddenCount,
        medicalConditions: household.medicalConditions,
        lifeSavingMedicines: household.lifeSavingMedicines,
        powerDependentDevices: household.powerDependentDevices,
        pets: household.pets,
        dispatched: Boolean(household.rescueDispatched),
        dispatchedAt: household.rescueDispatchedAt,
      }),
    });
  } catch (err) {
    console.warn("Failed to sync rescue card with server:", err);
  }
}
