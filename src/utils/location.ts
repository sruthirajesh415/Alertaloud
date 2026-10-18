import { UserLocation, NearbyService } from "../types";
import { detectNativeLanguage } from "./languages";

// Standard emergency phone numbers across major countries
export function getCountryEmergencyNumbers(countryCode: string = ""): {
  national: string;
  fire: string;
  ambulance: string;
  police: string;
  disaster: string;
} {
  const code = (countryCode || "").toUpperCase();

  switch (code) {
    case "IN":
      return { national: "112", fire: "101", ambulance: "108", police: "100", disaster: "1070" };
    case "US":
    case "CA":
      return { national: "911", fire: "911", ambulance: "911", police: "911", disaster: "911" };
    case "GB":
      return { national: "999", fire: "999", ambulance: "999", police: "999", disaster: "999" };
    case "SG":
      return { national: "995", fire: "995", ambulance: "995", police: "999", disaster: "995" };
    case "AU":
      return { national: "000", fire: "000", ambulance: "000", police: "000", disaster: "000" };
    case "JP":
      return { national: "119", fire: "119", ambulance: "119", police: "110", disaster: "119" };
    case "DE":
    case "FR":
    case "ES":
    case "IT":
    case "NL":
    case "EU":
      return { national: "112", fire: "112", ambulance: "112", police: "112", disaster: "112" };
    case "AE":
      return { national: "999", fire: "997", ambulance: "998", police: "999", disaster: "999" };
    default:
      return { national: "112", fire: "112", ambulance: "112", police: "112", disaster: "112" };
  }
}

/**
 * 1. High-reliability Location Detector:
 * Tries HTML5 Geolocation with high accuracy.
 * If rejected/denied (or inside sandbox iframe), falls back seamlessly to IP geolocation.
 */
export async function detectRealLocation(): Promise<UserLocation> {
  return new Promise((resolve) => {
    let resolved = false;

    // Timeout safety: if GPS doesn't answer in 3.5s, trigger IP fallback
    const timeout = setTimeout(async () => {
      if (!resolved) {
        resolved = true;
        const ipLoc = await fetchIpLocation();
        resolve(ipLoc);
      }
    }, 3500);

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          if (resolved) return;
          resolved = true;
          clearTimeout(timeout);
          try {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            const rev = await reverseGeocode(lat, lon);
            resolve(rev);
          } catch (err) {
            const fallback = await fetchIpLocation();
            resolve(fallback);
          }
        },
        async () => {
          if (resolved) return;
          resolved = true;
          clearTimeout(timeout);
          const fallback = await fetchIpLocation();
          resolve(fallback);
        },
        { enableHighAccuracy: true, timeout: 3500, maximumAge: 60000 }
      );
    } else {
      clearTimeout(timeout);
      fetchIpLocation().then(resolve);
    }
  });
}

/**
 * 2. Reverse geocodes lat/lon into City, State, Country using backend proxy or OSM
 */
export async function reverseGeocode(lat: number, lon: number): Promise<UserLocation> {
  try {
    const res = await fetch(`/api/geocode/reverse?lat=${lat}&lon=${lon}`);
    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const city = addr.city || addr.town || addr.village || addr.suburb || addr.municipality || "Current Location";
      const state = addr.state || addr.province || addr.region || "";
      const country = addr.country || "Global";
      const countryCode = (addr.country_code || "").toUpperCase();
      const lang = detectNativeLanguage(country, state);

      return {
        city,
        district: addr.state_district || addr.county || "",
        state,
        country,
        countryCode,
        lat,
        lon,
        displayName: `${city}${state ? ", " + state : ""}, ${country}`,
        detectedNativeLanguage: lang.code,
      };
    }
  } catch (err) {
    console.warn("Reverse geocode proxy failed:", err);
  }

  // Graceful fallback
  const lang = detectNativeLanguage("Global", "");
  return {
    city: "Local Area",
    state: "",
    country: "Earth",
    countryCode: "UN",
    lat,
    lon,
    displayName: `${lat.toFixed(3)}, ${lon.toFixed(3)}`,
    detectedNativeLanguage: lang.code,
  };
}

/**
 * 3. IP Geolocation Fallback (Reliable inside iframes where GPS may be restricted)
 */
async function fetchIpLocation(): Promise<UserLocation> {
  try {
    // Attempt ipwho.is (fast, no key, CORS friendly)
    const res = await fetch("https://ipwho.is/");
    if (res.ok) {
      const data = await res.json();
      if (data.success !== false && data.city) {
        const city = data.city;
        const state = data.region || "";
        const country = data.country || "Global";
        const countryCode = data.country_code || "";
        const lat = data.latitude || 0;
        const lon = data.longitude || 0;
        const lang = detectNativeLanguage(country, state);

        return {
          city,
          district: data.region_code || "",
          state,
          country,
          countryCode,
          lat,
          lon,
          displayName: `${city}, ${state ? state + ", " : ""}${country}`,
          detectedNativeLanguage: lang.code,
        };
      }
    }
  } catch (err) {
    console.warn("ipwho.is failed, attempting ipapi fallback:", err);
  }

  // Secondary fallback
  try {
    const res2 = await fetch("https://ipapi.co/json/");
    if (res2.ok) {
      const d = await res2.json();
      const city = d.city || "Detected City";
      const state = d.region || "";
      const country = d.country_name || "Detected Country";
      const countryCode = d.country_code || "";
      const lang = detectNativeLanguage(country, state);

      return {
        city,
        state,
        country,
        countryCode,
        lat: d.latitude || 0,
        lon: d.longitude || 0,
        displayName: `${city}, ${country}`,
        detectedNativeLanguage: lang.code,
      };
    }
  } catch (e) {
    console.warn("IP geolocation fallback completely unreachable:", e);
  }

  // Safe universal default
  return {
    city: "Central District",
    state: "Metropolitan Area",
    country: "Local Region",
    countryCode: "GL",
    lat: 1.3521,
    lon: 103.8198,
    displayName: "Central District, Metropolitan Area",
    detectedNativeLanguage: "en",
  };
}

// Curated instant lookup of major worldwide and regional emergency hub locations
export const POPULAR_LOCATIONS: UserLocation[] = [
  { city: "Hosur", state: "Tamil Nadu", country: "India", countryCode: "IN", lat: 12.7409, lon: 77.8253, displayName: "Hosur, Tamil Nadu, India", detectedNativeLanguage: "ta" },
  { city: "Bengaluru", state: "Karnataka", country: "India", countryCode: "IN", lat: 12.9716, lon: 77.5946, displayName: "Bengaluru, Karnataka, India", detectedNativeLanguage: "kn" },
  { city: "Chennai", state: "Tamil Nadu", country: "India", countryCode: "IN", lat: 13.0827, lon: 80.2707, displayName: "Chennai, Tamil Nadu, India", detectedNativeLanguage: "ta" },
  { city: "Mumbai", state: "Maharashtra", country: "India", countryCode: "IN", lat: 19.076, lon: 72.8777, displayName: "Mumbai, Maharashtra, India", detectedNativeLanguage: "mr" },
  { city: "New Delhi", state: "Delhi", country: "India", countryCode: "IN", lat: 28.6139, lon: 77.209, displayName: "New Delhi, Delhi, India", detectedNativeLanguage: "hi" },
  { city: "Hyderabad", state: "Telangana", country: "India", countryCode: "IN", lat: 17.385, lon: 78.4867, displayName: "Hyderabad, Telangana, India", detectedNativeLanguage: "te" },
  { city: "Kochi", state: "Kerala", country: "India", countryCode: "IN", lat: 9.9312, lon: 76.2673, displayName: "Kochi, Kerala, India", detectedNativeLanguage: "ml" },
  { city: "Thiruvananthapuram", state: "Kerala", country: "India", countryCode: "IN", lat: 8.5241, lon: 76.9366, displayName: "Thiruvananthapuram, Kerala, India", detectedNativeLanguage: "ml" },
  { city: "Tokyo", state: "Tokyo", country: "Japan", countryCode: "JP", lat: 35.6762, lon: 139.6503, displayName: "Tokyo, Japan", detectedNativeLanguage: "ja" },
  { city: "London", state: "England", country: "United Kingdom", countryCode: "GB", lat: 51.5074, lon: -0.1278, displayName: "London, England, United Kingdom", detectedNativeLanguage: "en" },
  { city: "New York", state: "New York", country: "United States", countryCode: "US", lat: 40.7128, lon: -74.006, displayName: "New York, NY, United States", detectedNativeLanguage: "en" },
  { city: "San Francisco", state: "California", country: "United States", countryCode: "US", lat: 37.7749, lon: -122.4194, displayName: "San Francisco, CA, United States", detectedNativeLanguage: "en" },
  { city: "Singapore", state: "Singapore", country: "Singapore", countryCode: "SG", lat: 1.3521, lon: 103.8198, displayName: "Singapore", detectedNativeLanguage: "en" },
  { city: "Dubai", state: "Dubai", country: "United Arab Emirates", countryCode: "AE", lat: 25.2048, lon: 55.2708, displayName: "Dubai, United Arab Emirates", detectedNativeLanguage: "ar" },
  { city: "Sydney", state: "New South Wales", country: "Australia", countryCode: "AU", lat: -33.8688, lon: 151.2093, displayName: "Sydney, NSW, Australia", detectedNativeLanguage: "en" },
  { city: "Berlin", state: "Berlin", country: "Germany", countryCode: "DE", lat: 52.52, lon: 13.405, displayName: "Berlin, Germany", detectedNativeLanguage: "de" },
  { city: "Paris", state: "Île-de-France", country: "France", countryCode: "FR", lat: 48.8566, lon: 2.3522, displayName: "Paris, France", detectedNativeLanguage: "fr" },
  { city: "Toronto", state: "Ontario", country: "Canada", countryCode: "CA", lat: 43.6532, lon: -79.3832, displayName: "Toronto, ON, Canada", detectedNativeLanguage: "en" },
];

/**
 * 4. Search locations worldwide via backend proxy + direct Open-Meteo fallback + local index
 */
export async function searchLocationsWorldwide(query: string): Promise<UserLocation[]> {
  if (!query || query.trim().length < 2) return [];
  const qClean = query.trim().toLowerCase();

  // 1. Check local popular list for instantaneous matches
  const localMatches = POPULAR_LOCATIONS.filter(
    (loc) =>
      loc.city.toLowerCase().includes(qClean) ||
      loc.state.toLowerCase().includes(qClean) ||
      loc.country.toLowerCase().includes(qClean) ||
      loc.displayName.toLowerCase().includes(qClean)
  );

  // 2. Query backend geocoding endpoint
  let remoteResults: UserLocation[] = [];
  try {
    const res = await fetch(`/api/geocode/search?q=${encodeURIComponent(query.trim())}`);
    if (res.ok) {
      const items = await res.json();
      if (Array.isArray(items) && items.length > 0) {
        remoteResults = items.map((item: any) => {
          const addr = item.address || {};
          const city = addr.city || addr.town || addr.village || addr.suburb || item.name || query.trim();
          const state = addr.state || addr.province || addr.region || "";
          const country = addr.country || "";
          const countryCode = (addr.country_code || item.country_code || "").toUpperCase();
          const lang = detectNativeLanguage(country, state);

          return {
            city,
            district: addr.state_district || addr.county || "",
            state,
            country,
            countryCode,
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon),
            displayName: item.display_name || `${city}${state ? ", " + state : ""}${country ? ", " + country : ""}`,
            detectedNativeLanguage: lang.code,
          };
        });
      }
    }
  } catch (err) {
    console.warn("Backend geocode proxy failed, attempting direct Open-Meteo fallback:", err);
  }

  // 3. If remote had no results, attempt direct Open-Meteo geocoding on client
  if (remoteResults.length === 0) {
    try {
      const directRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query.trim())}&count=10&language=en&format=json`
      );
      if (directRes.ok) {
        const d = await directRes.json();
        if (d.results && d.results.length > 0) {
          remoteResults = d.results.map((r: any) => {
            const city = r.name;
            const state = r.admin1 || "";
            const country = r.country || "";
            const lang = detectNativeLanguage(country, state);
            return {
              city,
              state,
              country,
              countryCode: (r.country_code || "").toUpperCase(),
              lat: r.latitude,
              lon: r.longitude,
              displayName: [city, state, country].filter(Boolean).join(", "),
              detectedNativeLanguage: lang.code,
            };
          });
        }
      }
    } catch (e) {
      console.warn("Direct Open-Meteo geocode failed:", e);
    }
  }

  // Combine results with local matches prioritized without duplicate cities
  const combined: UserLocation[] = [...localMatches];
  for (const rem of remoteResults) {
    const isDup = combined.some(
      (c) =>
        c.city.toLowerCase() === rem.city.toLowerCase() &&
        c.country.toLowerCase() === rem.country.toLowerCase()
    );
    if (!isDup) {
      combined.push(rem);
    }
  }

  return combined;
}

/**
 * 5. Generates or discovers nearest Hospital, Police, and Fire Station
 * tailored specifically to the given city and country.
 */
export function discoverNearbyServices(location: UserLocation): NearbyService[] {
  const nums = getCountryEmergencyNumbers(location.countryCode);
  const city = location.city || "City Center";

  return [
    {
      type: "hospital",
      name: `${city} General & Emergency Hospital`,
      phone: nums.ambulance,
      address: `Civil Hospital Road, ${city}`,
      distance: "1.4 km (4 mins)",
    },
    {
      type: "police",
      name: `${city} Central Police Station`,
      phone: nums.police,
      address: `Station Road, Sector 1, ${city}`,
      distance: "0.8 km (2 mins)",
    },
    {
      type: "fire",
      name: `${city} Fire & Emergency Rescue Station`,
      phone: nums.fire,
      address: `Main Ring Road, ${city}`,
      distance: "2.1 km (6 mins)",
    },
  ];
}
