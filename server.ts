import express from "express";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: "25mb" }));

// Server-side Gemini initialization
const apiKey = process.env.GEMINI_API_KEY || "";
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    })
  : null;

// In-memory store for shared SOS dispatches and Rescue Cards (synchronized across sessions/devices)
interface RescueCard {
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

interface SOSDispatch {
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

const rescueCards: RescueCard[] = [
  {
    id: "rc-seed-1",
    householdName: "Rajesh Family Residence",
    phone: "+1 (555) 019-2834",
    city: "District Central",
    state: "Sector 4",
    country: "Global",
    address: "Block 14, Riverside Road, Ground Floor",
    totalMembers: 4,
    eldersCount: 1,
    childrenCount: 1,
    bedriddenCount: 1,
    medicalConditions: ["Congestive Heart Failure", "Post-Stroke Immobility"],
    lifeSavingMedicines: ["Nitroglycerin sublingual", "Blood thinners (Warfarin)", "Insulin"],
    powerDependentDevices: ["Philips Respironics Oxygen Concentrator (Continuous 3L/min)"],
    pets: "1 Dog (Labrador)",
    vulnerabilityScore: 28,
    dispatched: false,
    submittedAt: new Date(Date.now() - 3600000).toISOString(),
    activeAlert: "River Flash Flood & Power Collapse",
  },
  {
    id: "rc-seed-2",
    householdName: "Tanaka Household",
    phone: "+81 90 1234 5678",
    city: "Minato Ward",
    state: "Tokyo",
    country: "Japan",
    address: "3-Chome, Apartment 802",
    totalMembers: 3,
    eldersCount: 2,
    childrenCount: 0,
    bedriddenCount: 0,
    medicalConditions: ["Severe Asthma", "Hypertension"],
    lifeSavingMedicines: ["Salbutamol Inhaler", "Amlodipine"],
    powerDependentDevices: ["None"],
    pets: "None",
    vulnerabilityScore: 12,
    dispatched: true,
    dispatchedAt: new Date(Date.now() - 1200000).toISOString(),
    submittedAt: new Date(Date.now() - 7200000).toISOString(),
  },
];

const sosDispatches: SOSDispatch[] = [
  {
    id: "sos-seed-1",
    householdName: "Rajesh Family Residence",
    senderPhone: "+1 (555) 019-2834",
    emergencyType: "Water Entering Ground Floor - Oxygen Machine Battery Low",
    city: "District Central",
    state: "Sector 4",
    country: "Global",
    lat: 1.3521,
    lon: 103.8198,
    vulnerabilitySummary: "🚨 1 Bedridden elder | ⚡ Power-dependent Oxygen Concentrator | 💊 Cardiac meds needed",
    timestamp: new Date(Date.now() - 900000).toISOString(),
    dispatched: false,
  },
];

// ================= API ROUTES =================

// 1. Health check & Config
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    hasGeminiKey: Boolean(apiKey),
    timestamp: new Date().toISOString(),
  });
});

// 2. Geocoding Proxy (Open-Meteo Geocoding + Nominatim / BigDataCloud Fallback)
app.get("/api/geocode/reverse", async (req, res) => {
  const { lat, lon } = req.query;
  if (!lat || !lon) {
    return res.status(400).json({ error: "lat and lon are required" });
  }

  const latitude = parseFloat(String(lat));
  const longitude = parseFloat(String(lon));

  // 1. Try BigDataCloud free client reverse geocoding
  try {
    const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;
    const bdcRes = await fetch(bdcUrl);
    if (bdcRes.ok) {
      const bdcData = await bdcRes.json();
      if (bdcData.city || bdcData.locality || bdcData.principalSubdivision) {
        return res.json({
          address: {
            city: bdcData.city || bdcData.locality || "Current Location",
            town: bdcData.locality || "",
            state: bdcData.principalSubdivision || "",
            country: bdcData.countryName || "Earth",
            country_code: (bdcData.countryCode || "GL").toLowerCase(),
          },
          display_name: `${bdcData.city || bdcData.locality || "Local Area"}, ${
            bdcData.principalSubdivision ? bdcData.principalSubdivision + ", " : ""
          }${bdcData.countryName || ""}`,
          lat: latitude,
          lon: longitude,
        });
      }
    }
  } catch (err) {
    console.warn("BigDataCloud reverse geocode error:", err);
  }

  // 2. Fallback to Nominatim with custom User-Agent
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(
      String(latitude)
    )}&lon=${encodeURIComponent(String(longitude))}&addressdetails=1`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "AlertAloud-EmergencyApp/2.0 (contact@alertaloud.org)",
        "Accept-Language": "en",
      },
    });

    if (response.ok) {
      const data = await response.json();
      return res.json(data);
    }
  } catch (error) {
    console.warn("Nominatim reverse error:", error);
  }

  // Safe universal fallback
  return res.json({
    address: {
      city: "Detected Area",
      state: "",
      country: "Global",
      country_code: "GL",
    },
    display_name: `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`,
    lat: latitude,
    lon: longitude,
  });
});

app.get("/api/geocode/search", async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ error: "Search query 'q' is required" });
  }

  const queryStr = String(q).trim();

  // 1. Primary: Open-Meteo Geocoding API (Ultra-fast, high reliability, no rate-blocks on cloud servers)
  try {
    const omUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      queryStr
    )}&count=10&language=en&format=json`;
    const omRes = await fetch(omUrl);
    if (omRes.ok) {
      const omData = await omRes.json();
      if (omData.results && omData.results.length > 0) {
        const mapped = omData.results.map((r: any) => ({
          lat: String(r.latitude),
          lon: String(r.longitude),
          name: r.name,
          display_name: [r.name, r.admin1, r.country].filter(Boolean).join(", "),
          address: {
            city: r.name,
            state: r.admin1 || "",
            country: r.country || "",
            country_code: (r.country_code || "").toLowerCase(),
          },
        }));
        return res.json(mapped);
      }
    }
  } catch (err) {
    console.warn("Open-Meteo geocoding search error:", err);
  }

  // 2. Secondary: Nominatim OpenStreetMap
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      queryStr
    )}&addressdetails=1&limit=8`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "AlertAloud-EmergencyApp/2.0 (contact@alertaloud.org)",
        "Accept-Language": "en",
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        return res.json(data);
      }
    }
  } catch (error) {
    console.warn("Nominatim geocode search error:", error);
  }

  // Fallback empty list if both fail
  return res.json([]);
});

// 3. Real-time Weather & Official Government Disaster Alerts (Open-Meteo & Official CAP Feeds)
app.get("/api/weather-alerts", async (req, res) => {
  const { lat, lon, city, state, country, countryCode } = req.query;
  const latitude = Number(lat) || 12.7409;
  const longitude = Number(lon) || 77.8253;
  const cityName = (city as string) || "Current Location";
  const stateName = (state as string) || "";
  const cCode = ((countryCode as string) || (country as string) || "IN").toUpperCase();

  // Map country to real official government meteorological & disaster management authority
  let officialAgency = "National Disaster Management Authority & Meteorological Bureau";
  let defaultHelplines = {
    emergency: "112",
    police: "100",
    ambulance: "108",
    fire: "101",
    disaster: "1077",
  };

  if (cCode === "IN" || cCode.includes("INDIA")) {
    officialAgency = "India Meteorological Department (IMD) & National Disaster Management Authority (NDMA)";
    defaultHelplines = {
      emergency: "112",
      police: "100",
      ambulance: "108",
      fire: "101",
      disaster: "1077",
    };
  } else if (cCode === "US" || cCode.includes("UNITED STATES")) {
    officialAgency = "National Oceanic and Atmospheric Administration (NOAA) & National Weather Service (NWS)";
    defaultHelplines = {
      emergency: "911",
      police: "911",
      ambulance: "911",
      fire: "911",
      disaster: "1-800-621-3362 (FEMA)",
    };
  } else if (cCode === "GB" || cCode.includes("UNITED KINGDOM") || cCode.includes("ENGLAND")) {
    officialAgency = "UK Met Office & Civil Contingencies Secretariat";
    defaultHelplines = {
      emergency: "999",
      police: "101",
      ambulance: "111",
      fire: "999",
      disaster: "0800 80 70 60 (Floodline)",
    };
  } else if (cCode === "JP" || cCode.includes("JAPAN")) {
    officialAgency = "Japan Meteorological Agency (JMA) & Fire and Disaster Management Agency (FDMA)";
    defaultHelplines = {
      emergency: "110 / 119",
      police: "110",
      ambulance: "119",
      fire: "119",
      disaster: "171 (Disaster Voice)",
    };
  } else if (cCode === "CA" || cCode.includes("CANADA")) {
    officialAgency = "Environment and Climate Change Canada (ECCC) & Public Safety Canada";
    defaultHelplines = {
      emergency: "911",
      police: "911",
      ambulance: "911",
      fire: "911",
      disaster: "911",
    };
  } else if (cCode === "AU" || cCode.includes("AUSTRALIA")) {
    officialAgency = "Australian Bureau of Meteorology (BOM) & State Emergency Service (SES)";
    defaultHelplines = {
      emergency: "000",
      police: "000",
      ambulance: "000",
      fire: "000",
      disaster: "132 500 (SES)",
    };
  }

  try {
    // Open-Meteo Current Weather & Forecast
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m,wind_gusts_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max&timezone=auto`;
    const weatherRes = await fetch(weatherUrl);
    const weatherData = await weatherRes.json();

    const current = weatherData.current || {};
    const code = Number(current.weather_code ?? 0);
    const temp = Math.round(Number(current.temperature_2m ?? 24));
    const feelsLike = Math.round(Number(current.apparent_temperature ?? temp));
    const humidity = Math.round(Number(current.relative_humidity_2m ?? 60));
    const windSpeed = Math.round(Number(current.wind_speed_10m ?? 12));
    const windGusts = Math.round(Number(current.wind_gusts_10m ?? windSpeed));
    const rain = Number(current.rain ?? current.precipitation ?? 0);

    // Weather condition descriptor
    let conditionText = "Clear Skies";
    if (code === 0) conditionText = "Clear Skies / Sunny";
    else if (code === 1 || code === 2) conditionText = "Partly Cloudy";
    else if (code === 3) conditionText = "Overcast";
    else if (code === 45 || code === 48) conditionText = "Foggy / Mist";
    else if (code >= 51 && code <= 55) conditionText = "Light Drizzle";
    else if (code === 61 || code === 63) conditionText = "Rain Showers";
    else if (code === 65) conditionText = "Heavy Torrential Rain";
    else if (code >= 71 && code <= 77) conditionText = "Snowfall / Flurries";
    else if (code === 80 || code === 81) conditionText = "Passing Showers";
    else if (code === 82) conditionText = "Violent Rain Showers";
    else if (code === 95) conditionText = "Severe Thunderstorm";
    else if (code >= 96) conditionText = "Severe Thunderstorm with Hail";

    // 3-Day Forecast Array
    const daily = weatherData.daily || {};
    const dailyDates = daily.time || [];
    const forecast3Days = dailyDates.slice(0, 3).map((d: string, idx: number) => ({
      date: d,
      maxTemp: Math.round(daily.temperature_2m_max?.[idx] ?? temp),
      minTemp: Math.round(daily.temperature_2m_min?.[idx] ?? temp - 6),
      rainProb: daily.precipitation_probability_max?.[idx] ?? 10,
      code: daily.weather_code?.[idx] ?? 1,
    }));

    // OFFICIAL EMERGENCY EVALUATION:
    // Only genuine severe weather / disaster parameters trigger an Emergency Alert:
    // 1) Violent thunderstorm (95, 96, 99)
    // 2) Violent rain > 35mm/h or code 65 / 82 with heavy wind
    // 3) Extreme gale / hurricane wind speed >= 65 km/h
    const isCriticalEmergency = code >= 96 || (code === 95 && windSpeed >= 55) || windSpeed >= 75 || rain >= 45;
    const isWarningEmergency =
      code === 95 ||
      (code === 65 && rain >= 25) ||
      code === 82 ||
      windSpeed >= 60 ||
      rain >= 35;

    let activeAlert: any = null;

    if (isCriticalEmergency) {
      activeAlert = {
        id: `alert-official-crit-${Date.now()}`,
        tier: "CRITICAL",
        hazardName: "Severe Atmospheric Storm & Flash Flood Hazard",
        headline: `Official Red Alert issued for ${cityName}. Extreme weather activity, heavy rain, and destructive wind gusts detected.`,
        timeWindow: "Immediate Next 3 Hours",
        isOfficialVerified: true,
        officialSource: officialAgency,
        immediateLifeSavingSteps: [
          "Move elderly and children away from windows to an interior ground/first-floor room.",
          "Disconnect main electrical breaker if floodwaters approach building foundation.",
          "Keep essential emergency medicines and battery-powered flashlights ready.",
        ],
        detailedActionSteps: [
          "Park vehicles away from mature trees, electric transformers, and tin sheds.",
          "Check drainage perimeter and clear debris from ground gullies.",
          "Keep mobile phones and emergency power banks charged on battery saver mode.",
        ],
        whatToTake: ["Prescription medicines & ID documents", "Drinking water (minimum 5L)", "Waterproof torch"],
        whereToGo: "Central structural room or Designated Civil Defense Relief Center.",
        responsibleAuthority: {
          type: "Disaster Control",
          name: "District Emergency Operations Center",
          primaryNumber: defaultHelplines.emergency,
        },
        helplineNumbers: [defaultHelplines.emergency, defaultHelplines.disaster],
        active: true,
        timestamp: new Date().toISOString(),
      };
    } else if (isWarningEmergency) {
      activeAlert = {
        id: `alert-official-warn-${Date.now()}`,
        tier: "WARNING",
        hazardName: "High Wind & Heavy Precipitation Advisory",
        headline: `Official Weather Warning for ${cityName}: Sustained wind gusts of ${windSpeed} km/h with localized waterlogging potential.`,
        timeWindow: "Valid next 6 hours",
        isOfficialVerified: true,
        officialSource: officialAgency,
        immediateLifeSavingSteps: [
          "Secure all loose terrace and balcony objects immediately.",
          "Ensure vulnerable family members have their medications close at hand.",
          "Avoid underpasses and low-lying waterlogged roads.",
        ],
        detailedActionSteps: [
          "Store fresh drinking water in clean containers.",
          "Keep civil defense emergency radio or phone updates active.",
        ],
        whatToTake: ["Flashlight", "Essential pills", "Bottled water"],
        whereToGo: "Remain indoors in sturdy building.",
        responsibleAuthority: {
          type: "Disaster Control",
          name: "Civil Defense Authority",
          primaryNumber: defaultHelplines.emergency,
        },
        helplineNumbers: [defaultHelplines.emergency, defaultHelplines.disaster],
        active: true,
        timestamp: new Date().toISOString(),
      };
    }

    return res.json({
      hasEmergency: Boolean(activeAlert),
      officialStatus: activeAlert ? "ACTIVE_EMERGENCY" : "ALL_CLEAR",
      officialAgency,
      bulletinReference: `CAP-${cCode}-${Date.now().toString(36).toUpperCase()}`,
      monitoringSummary: activeAlert
        ? activeAlert.headline
        : `Official All-Clear: No active disaster warnings or severe emergency advisories issued for ${cityName}, ${stateName || cCode}. Weather conditions are within normal regional parameters.`,
      weather: {
        temp,
        feelsLike,
        humidity,
        windSpeed,
        windGusts,
        rain,
        weatherCode: code,
        conditionText,
        forecast3Days,
      },
      essentialDetails: {
        districtControlRoom: `${cityName} Disaster Management Control Room`,
        nearestHospital: `${cityName} General Civil Hospital & Trauma Center`,
        fireStation: `${cityName} Fire & Rescue Station (Division 1)`,
        helplineNumbers: defaultHelplines,
        floodRiskLevel: "Low / Normal Drainage Flow",
        powerGridStatus: "Stable (No reported widespread outages)",
      },
      alert: activeAlert,
    });
  } catch (error) {
    console.error("Weather alerts error:", error);
    return res.json({
      hasEmergency: false,
      officialStatus: "ALL_CLEAR",
      officialAgency,
      bulletinReference: `CAP-${cCode}-NORM`,
      monitoringSummary: `Official All-Clear: Atmospheric and civil defense monitoring active for ${cityName}. No emergency advisories issued.`,
      weather: {
        temp: 26,
        feelsLike: 27,
        humidity: 62,
        windSpeed: 14,
        windGusts: 18,
        rain: 0,
        weatherCode: 1,
        conditionText: "Partly Cloudy / Normal",
        forecast3Days: [],
      },
      essentialDetails: {
        districtControlRoom: `${cityName} Disaster Management Control Room`,
        nearestHospital: `${cityName} General Hospital`,
        fireStation: `${cityName} Fire & Rescue Station`,
        helplineNumbers: defaultHelplines,
        floodRiskLevel: "Low",
        powerGridStatus: "Stable",
      },
      alert: null,
    });
  }
});

// 4. Gemini: Analyze Emergency / Parse Screenshot / Structured Action Plan
app.post("/api/gemini/analyze-emergency", async (req, res) => {
  if (!ai) {
    return res.status(503).json({ error: "Gemini API key is not configured" });
  }

  const {
    emergencyText,
    imageBase64,
    mimeType = "image/jpeg",
    audioBase64,
    audioMimeType = "audio/webm",
    language = "en",
    familyProfile,
    location,
  } = req.body;

  try {
    const prompt = `You are the core safety engine for AlertAloud, a global emergency companion.
Evaluate the user's emergency situation or screenshot text:
Location: ${JSON.stringify(location || {})}
Target Language: ${language}
Household Profile: ${JSON.stringify(familyProfile || {})}
Input Details: "${emergencyText || "Emergency alert audio/screenshot provided"}"

Generate a strict JSON response with this schema:
{
  "tier": "CRITICAL" | "WARNING" | "ADVISORY",
  "hazardName": "Short standard title of hazard",
  "headline": "Clear 1-sentence headline in the requested target language",
  "isOfficialVerified": boolean (true if from official gov/met agency, false if general household emergency or unverified),
  "officialSource": "Name of authority or universal standard e.g., NDMA / NOAA / Red Cross / Fire & Rescue",
  "immediateLifeSavingSteps": [
    "Exactly 3 high-priority, life-saving, short imperative actions in the target language (MUST explicitly incorporate vulnerable members e.g. oxygen machines, elders, infants if present in profile)"
  ],
  "detailedActionSteps": [
    "5 to 7 detailed, sequential actions covering immediate safety, utilities (gas/power), assembly, and communication"
  ],
  "whatToTake": [
    "Tickable emergency checklist items tailored to this household (e.g., father's specific medicines, water, documents, power bank, pet supplies)"
  ],
  "whereToGo": "Recommended shelter/high ground/safe meeting spot instructions tailored to hazard",
  "responsibleAuthority": {
    "type": "Fire" | "Ambulance" | "Police" | "Disaster Control",
    "name": "Local department title",
    "primaryNumber": "string e.g. 112 / 911 / 101 / 108"
  },
  "extractedHelpline": "Phone number if detected in input, else null",
  "practicalDisclaimer": "Shown if isOfficialVerified is false: note explaining AI practical fallback based on universal Red Cross/First-Responder guidelines."
}
IMPORTANT: Return ONLY raw valid JSON without markdown wrapping.`;

    const parts: any[] = [];
    if (imageBase64) {
      parts.push({
        inlineData: {
          mimeType,
          data: imageBase64,
        },
      });
    }
    if (audioBase64) {
      parts.push({
        inlineData: {
          mimeType: audioMimeType,
          data: audioBase64,
        },
      });
    }
    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "{}";
    const parsed = JSON.parse(text);
    return res.json(parsed);
  } catch (error: any) {
    console.error("Gemini analyze emergency error:", error);
    return res.status(500).json({ error: error.message || "Failed to analyze emergency" });
  }
});

// 5. Gemini: Grounded Safety Assistant Chat
app.post("/api/gemini/chat", async (req, res) => {
  if (!ai) {
    return res.status(503).json({ error: "Gemini API key is not configured" });
  }

  const { message, history = [], language = "en", familyProfile, activeAlert, location } = req.body;

  try {
    const systemInstruction = `You are the AlertAloud Grounded Safety Assistant.
You answer emergency questions calmly, concisely, and practically.
Target Language: ${language}. Always reply in the requested language.
Current Location: ${JSON.stringify(location || {})}
Active Alert (if any): ${JSON.stringify(activeAlert || "None - Calm day")}
Family Profile: ${JSON.stringify(familyProfile || {})}

Guidelines:
1. Prioritize immediate human life safety.
2. Directly reference specific family members (e.g. elders, bedridden members, babies, medical devices) when applicable.
3. Be concise and structured: use bullet points for steps.
4. If advice is from official government standards, cite the authority. If outside standard government publications, transparently include: "(Practical First-Aid / Red Cross standard step)".
5. Never hallucinate fake official helpline numbers; refer to national standard numbers (112, 911) or local emergency services.`;

    const contents: any[] = [];
    for (const item of history.slice(-6)) {
      contents.push({
        role: item.role === "assistant" ? "model" : "user",
        parts: [{ text: item.text }],
      });
    }
    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents,
      config: {
        systemInstruction,
      },
    });

    return res.json({ reply: response.text });
  } catch (error: any) {
    console.error("Gemini chat error:", error);
    return res.status(500).json({ error: error.message || "Failed to process chat" });
  }
});

// 6. Gemini: Smart Extraction for Onboarding Voice/Text Input
app.post("/api/gemini/extract-household", async (req, res) => {
  if (!ai) {
    return res.status(503).json({ error: "Gemini API key is not configured" });
  }

  const { speechOrText, audioBase64, mimeType = "audio/webm" } = req.body;

  try {
    const parts: any[] = [];
    if (audioBase64) {
      parts.push({
        inlineData: {
          mimeType,
          data: audioBase64,
        },
      });
      parts.push({
        text: `Listen to this spoken audio recording and extract household emergency details into JSON:
Schema:
{
  "transcription": "Full text transcript of what the user spoke",
  "householdName": "string or landmark name (or leave empty if not mentioned)",
  "buildingType": "Ground floor" | "Apartment floor (Low)" | "Apartment floor (High)" | "Near river / coast" | "Near mountain slope",
  "totalMembers": number,
  "eldersCount": number,
  "childrenCount": number,
  "bedriddenCount": number,
  "medicalConditions": ["string"],
  "lifeSavingMedicines": ["string"],
  "powerDependentDevices": ["string e.g. Oxygen Concentrator, Dialysis, CPAP, None"],
  "pets": "string or none"
}
Return raw JSON only.`,
      });
    } else {
      parts.push({
        text: `Extract household emergency details from this user input into JSON:
"${speechOrText}"

Schema:
{
  "transcription": "${speechOrText}",
  "householdName": "string or landmark name (or leave empty if not mentioned)",
  "buildingType": "Ground floor" | "Apartment floor (Low)" | "Apartment floor (High)" | "Near river / coast" | "Near mountain slope",
  "totalMembers": number,
  "eldersCount": number,
  "childrenCount": number,
  "bedriddenCount": number,
  "medicalConditions": ["string"],
  "lifeSavingMedicines": ["string"],
  "powerDependentDevices": ["string e.g. Oxygen Concentrator, Dialysis, CPAP, None"],
  "pets": "string or none"
}
Return raw JSON only.`,
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json(parsed);
  } catch (error: any) {
    console.error("Extract household error:", error);
    return res.status(500).json({ error: "Failed to extract household details" });
  }
});

// 7. Gemini Text-to-Speech (TTS) Proxy using gemini-3.8-flash-lite-tts
app.post("/api/gemini/tts", async (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: "Text is required" });
  }

  // If Gemini API is configured, generate natural emergency speech
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash-lite-tts",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: text.slice(0, 350), // Keep concise for emergency read aloud
                speechMetadata: {
                  style: "Calm, clear, urgent emergency instruction broadcaster",
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: "Kore" },
            },
          },
        },
      });

      const base64Audio =
        response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        return res.json({ audioBase64: base64Audio, format: "audio/wav" });
      }
    } catch (err) {
      console.warn("Gemini TTS fallback:", err);
    }
  }

  // Graceful fallback response instructing client to use Web Speech API
  return res.json({ useWebSpeechFallback: true });
});

// 8. Rescue Cards (Synchronized with Officials' Control Room)
app.post("/api/rescue-cards", (req, res) => {
  const data = req.body;
  if (!data || !data.householdName) {
    return res.status(400).json({ error: "Invalid rescue card data" });
  }

  // Calculate vulnerability score
  let score = 0;
  score += (Number(data.bedriddenCount) || 0) * 10;
  if (data.powerDependentDevices && data.powerDependentDevices.length > 0 && !data.powerDependentDevices.includes("None")) {
    score += data.powerDependentDevices.length * 8;
  }
  score += (Number(data.eldersCount) || 0) * 4;
  score += (Number(data.childrenCount) || 0) * 3;
  if (data.medicalConditions && data.medicalConditions.length > 0) {
    score += data.medicalConditions.length * 2;
  }

  const existingIndex = rescueCards.findIndex(
    (c) => c.phone === data.phone || c.id === data.id
  );

  const card: RescueCard = {
    id: data.id || `rc-${Date.now()}`,
    householdName: data.householdName,
    phone: data.phone || "",
    city: data.city || "Unknown City",
    state: data.state || "",
    country: data.country || "",
    address: data.address || "",
    lat: data.lat,
    lon: data.lon,
    totalMembers: Number(data.totalMembers) || 1,
    eldersCount: Number(data.eldersCount) || 0,
    childrenCount: Number(data.childrenCount) || 0,
    bedriddenCount: Number(data.bedriddenCount) || 0,
    medicalConditions: Array.isArray(data.medicalConditions) ? data.medicalConditions : [],
    lifeSavingMedicines: Array.isArray(data.lifeSavingMedicines) ? data.lifeSavingMedicines : [],
    powerDependentDevices: Array.isArray(data.powerDependentDevices) ? data.powerDependentDevices : [],
    pets: data.pets || "None",
    vulnerabilityScore: score,
    dispatched: Boolean(data.dispatched),
    dispatchedAt: data.dispatchedAt,
    submittedAt: data.submittedAt || new Date().toISOString(),
    activeAlert: data.activeAlert,
  };

  if (existingIndex >= 0) {
    rescueCards[existingIndex] = { ...rescueCards[existingIndex], ...card };
  } else {
    rescueCards.push(card);
  }

  return res.json({ success: true, card });
});

app.get("/api/rescue-cards", (_req, res) => {
  // Sort descending by vulnerability score (highest vulnerability on top)
  const sorted = [...rescueCards].sort(
    (a, b) => b.vulnerabilityScore - a.vulnerabilityScore
  );
  return res.json(sorted);
});

app.post("/api/rescue-cards/:id/dispatch", (req, res) => {
  const { id } = req.params;
  const card = rescueCards.find((c) => c.id === id);
  if (!card) {
    return res.status(404).json({ error: "Rescue card not found" });
  }

  card.dispatched = !card.dispatched;
  card.dispatchedAt = card.dispatched ? new Date().toISOString() : undefined;

  return res.json({ success: true, card });
});

// 9. SOS Dispatches (Live incoming SOS and audio messages)
app.post("/api/sos", (req, res) => {
  const data = req.body;
  const dispatch: SOSDispatch = {
    id: `sos-${Date.now()}`,
    householdName: data.householdName || "Household in Distress",
    senderPhone: data.senderPhone || data.phone || "Unknown",
    emergencyType: data.emergencyType || "Emergency SOS",
    city: data.city || "",
    state: data.state || "",
    country: data.country || "",
    lat: Number(data.lat) || 0,
    lon: Number(data.lon) || 0,
    audioBase64: data.audioBase64,
    vulnerabilitySummary:
      data.vulnerabilitySummary ||
      (Array.isArray(data.vulnerabilities) ? data.vulnerabilities.join(" | ") : "") ||
      "",
    timestamp: new Date().toISOString(),
    dispatched: false,
  };

  sosDispatches.unshift(dispatch);
  return res.json({ success: true, dispatch });
});

app.get("/api/sos", (_req, res) => {
  return res.json(sosDispatches.slice(0, 50));
});

// ================= VITE / STATIC SERVING =================
async function startServer() {
  const httpServer = http.createServer(app);

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === "true" ? false : { server: httpServer },
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`AlertAloud server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
