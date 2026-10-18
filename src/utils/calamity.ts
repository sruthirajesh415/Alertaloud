import { AlertData } from "../types";

/**
 * Calamity visual and concise description utilities
 */

export function getCalamityImage(hazardName: string, tier?: string): string {
  const lower = (hazardName || "").toLowerCase();
  if (
    lower.includes("flood") ||
    lower.includes("water") ||
    lower.includes("inundation") ||
    lower.includes("rain") ||
    lower.includes("dam") ||
    lower.includes("drown")
  ) {
    return "/src/assets/images/monsoon_flood_rescue_1792341591272.jpg";
  }
  if (
    lower.includes("fire") ||
    lower.includes("smoke") ||
    lower.includes("flame") ||
    lower.includes("burn") ||
    lower.includes("gas") ||
    lower.includes("lpg") ||
    lower.includes("explosion")
  ) {
    return "/src/assets/images/fire_safety_rescue_1792341590584.jpg";
  }
  if (
    lower.includes("storm") ||
    lower.includes("cyclone") ||
    lower.includes("wind") ||
    lower.includes("hurricane") ||
    lower.includes("typhoon") ||
    lower.includes("tornado") ||
    lower.includes("gale") ||
    lower.includes("blizzard")
  ) {
    return "/src/assets/images/severe_storm_weather_1792341591752.jpg";
  }
  // Default realistic disaster visual
  return tier === "CRITICAL"
    ? "/src/assets/images/monsoon_flood_rescue_1792341591272.jpg"
    : "/src/assets/images/severe_storm_weather_1792341591752.jpg";
}

/**
 * Rephrases or extracts a punchy one-line short description for instant comprehension in emergencies.
 */
export function getOneLineDescription(headline: string, hazardName: string): string {
  if (!headline) return `${hazardName} reported in your sector.`;
  
  const sentences = headline.split(/(?<=[.!?])\s+/).filter(Boolean);
  const primary = sentences[0]?.trim() || headline.trim();

  if (primary.length > 95) {
    return primary.slice(0, 92).trim() + "...";
  }
  return primary;
}

/**
 * Standard Heavy Rainfall & High Wind Warning template dynamically localized to viewer's city.
 */
export function getDefaultRainfallAlert(cityName: string = "Hosur"): AlertData {
  const city =
    cityName && cityName !== "Detecting..." && cityName !== "Locating your position..." && cityName !== "Local Area"
      ? cityName
      : "Hosur";

  return {
    id: `alert-rainfall-${city.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
    tier: "WARNING",
    hazardName: "Heavy Rainfall & High Wind Warning",
    headline: `Meteorological warning issued for ${city}. Wind gusts up to 60 km/h with localized waterlogging.`,
    timeWindow: "Valid next 6 hours",
    isOfficialVerified: true,
    officialSource: "State Meteorological Authority & Civil Protection",
    immediateLifeSavingSteps: [
      `Move elderly family members away from balcony windows and check vital medicines.`,
      `Switch off ground-level electrical breakers if rainwater approaches living quarters.`,
      `Keep emergency go-bag and drinking water readily accessible.`,
    ],
    detailedActionSteps: [
      "Park vehicles away from aged trees and tin sheds.",
      "Secure outdoor gas cylinders and solar heater mountings.",
      "Check drainage grating around building perimeter.",
      "Keep battery-powered lanterns charged.",
    ],
    whatToTake: [
      "Prescription medicines & vital medical devices",
      "Drinking water (10 liters)",
      "Waterproof torch and power bank",
    ],
    whereToGo: "Upper floors of sturdy RCC structure or Taluk Community Flood Relief Hall.",
    responsibleAuthority: {
      type: "Disaster Control",
      name: "District Disaster Control Room",
      primaryNumber: "112",
    },
    helplineNumbers: ["112", "1077"],
    active: true,
    timestamp: new Date().toISOString(),
  };
}
