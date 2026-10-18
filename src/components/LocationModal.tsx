import React, { useState, useEffect } from "react";
import { UserLocation } from "../types";
import {
  searchLocationsWorldwide,
  detectRealLocation,
  POPULAR_LOCATIONS,
} from "../utils/location";
import { detectNativeLanguage } from "../utils/languages";
import {
  Search,
  MapPin,
  X,
  Loader2,
  Navigation,
  Check,
  Compass,
  Sparkles,
  Globe,
  Radio,
} from "lucide-react";

interface LocationModalProps {
  currentLocation: UserLocation;
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation: (loc: UserLocation) => void;
}

export const LocationModal: React.FC<LocationModalProps> = ({
  currentLocation,
  isOpen,
  onClose,
  onSelectLocation,
}) => {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<UserLocation[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Auto-detect state
  const [isAutoDetecting, setIsAutoDetecting] = useState(false);
  const [detectedLoc, setDetectedLoc] = useState<UserLocation | null>(null);
  const [autoDetectError, setAutoDetectError] = useState<string | null>(null);

  // Manual input state
  const [manualCity, setManualCity] = useState(currentLocation.city || "");
  const [manualState, setManualState] = useState(currentLocation.state || "");
  const [manualCountry, setManualCountry] = useState(currentLocation.country || "");
  const [activeTab, setActiveTab] = useState<"search" | "manual">("search");

  useEffect(() => {
    if (isOpen) {
      setManualCity(currentLocation.city || "");
      setManualState(currentLocation.state || "");
      setManualCountry(currentLocation.country || "");
      setAutoDetectError(null);
      // Pre-seed search results with popular locations for instant choice
      if (!query.trim()) {
        setResults(POPULAR_LOCATIONS.slice(0, 6));
      }
    }
  }, [isOpen, currentLocation]);

  // Live search debounce
  useEffect(() => {
    if (!query.trim()) {
      setResults(POPULAR_LOCATIONS.slice(0, 6));
      setHasSearched(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      setHasSearched(true);
      try {
        const found = await searchLocationsWorldwide(query.trim());
        setResults(found);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const handleManualApply = () => {
    if (!manualCity.trim()) return;
    const lang = detectNativeLanguage(manualCountry, manualState);
    const updated: UserLocation = {
      city: manualCity.trim(),
      state: manualState.trim(),
      country: manualCountry.trim() || "Earth",
      countryCode: "GL",
      lat: currentLocation.lat || 12.7409,
      lon: currentLocation.lon || 77.8253,
      displayName: `${manualCity.trim()}${manualState.trim() ? ", " + manualState.trim() : ""}, ${manualCountry.trim() || "Earth"}`,
      detectedNativeLanguage: lang.code,
    };
    onSelectLocation(updated);
    onClose();
  };

  const handleRunAutoDetect = async () => {
    setIsAutoDetecting(true);
    setAutoDetectError(null);
    setDetectedLoc(null);

    try {
      const detected = await detectRealLocation();
      setDetectedLoc(detected);
      // Automatically apply detected location
      onSelectLocation(detected);
    } catch (err: any) {
      console.warn("Auto-detect failed:", err);
      setAutoDetectError("GPS access unavailable. Detected approximate regional IP location.");
    } finally {
      setIsAutoDetecting(false);
    }
  };

  const handleSelectLocationItem = (loc: UserLocation) => {
    onSelectLocation(loc);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-750 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-850/90 border-b border-slate-750 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-600/20 text-red-500 border border-red-500/30 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-white leading-tight">
                Emergency Location & Feeds
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Auto-detect or search any city worldwide
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-750 transition shrink-0 active:scale-95"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1-Tap Auto-Detect Hero Banner */}
        <div className="p-3.5 sm:p-4 bg-gradient-to-r from-red-950/30 via-slate-900 to-blue-950/30 border-b border-slate-800">
          <button
            onClick={handleRunAutoDetect}
            disabled={isAutoDetecting}
            className="w-full p-3 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 active:scale-[0.99] text-white font-bold text-xs sm:text-sm flex items-center justify-between gap-2 shadow-lg shadow-red-950/50 transition disabled:opacity-75"
          >
            <div className="flex items-center gap-2.5 text-left">
              {isAutoDetecting ? (
                <Loader2 className="w-5 h-5 animate-spin shrink-0 text-white" />
              ) : (
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <Navigation className="w-4 h-4 text-white" />
                </div>
              )}
              <div>
                <div className="text-white font-black text-xs sm:text-sm flex items-center gap-1.5">
                  <span>Auto-Detect My Current Location</span>
                  <span className="text-[10px] bg-white/25 px-1.5 py-0.2 rounded font-mono uppercase">
                    GPS + IP
                  </span>
                </div>
                <div className="text-[11px] text-white/80 font-normal mt-0.5">
                  {isAutoDetecting
                    ? "Acquiring satellite GPS & network position..."
                    : "Instantly fetch nearest weather alerts and emergency responders"}
                </div>
              </div>
            </div>
            <Sparkles className="w-4 h-4 text-white/80 shrink-0 hidden sm:block" />
          </button>

          {detectedLoc && (
            <div className="mt-2.5 p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-600/50 flex items-center justify-between text-xs text-emerald-300">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Detected: <strong>{detectedLoc.displayName}</strong>
                </span>
              </div>
              <button
                onClick={onClose}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[11px] transition"
              >
                Done
              </button>
            </div>
          )}

          {autoDetectError && (
            <p className="mt-2 text-[11px] text-amber-400">
              ⚠️ {autoDetectError}
            </p>
          )}
        </div>

        {/* Tab switch: Search vs Manual */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 p-1.5 gap-1.5">
          <button
            onClick={() => setActiveTab("search")}
            className={`flex-1 py-2 px-3 text-xs sm:text-sm font-bold rounded-xl transition text-center truncate flex items-center justify-center gap-1.5 ${
              activeTab === "search"
                ? "bg-slate-800 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search Worldwide</span>
          </button>
          <button
            onClick={() => setActiveTab("manual")}
            className={`flex-1 py-2 px-3 text-xs sm:text-sm font-bold rounded-xl transition text-center truncate flex items-center justify-center gap-1.5 ${
              activeTab === "manual"
                ? "bg-slate-800 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Manual Coordinates / City</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {/* Current Active Location Pill */}
          <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60 flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-2 truncate">
              <MapPin className="w-4 h-4 text-red-500 shrink-0" />
              <div className="truncate">
                <span className="text-slate-400">Currently Selected: </span>
                <strong className="text-white">{currentLocation.displayName}</strong>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 font-mono text-[10px] border border-emerald-800 shrink-0 ml-2">
              Active Zone
            </span>
          </div>

          {activeTab === "search" ? (
            <div className="space-y-3.5">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Type city or region (e.g. Hosur, Tokyo, Chennai, Austin)..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-2xl pl-10 pr-9 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500 transition"
                  autoFocus
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Quick-tap popular hubs */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Quick Select Hubs:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {["Hosur", "Bengaluru", "Chennai", "Mumbai", "Tokyo", "London", "New York", "Singapore", "Dubai"].map(
                    (cityName) => (
                      <button
                        key={cityName}
                        onClick={() => {
                          const match = POPULAR_LOCATIONS.find((l) => l.city === cityName);
                          if (match) {
                            handleSelectLocationItem(match);
                          } else {
                            setQuery(cityName);
                          }
                        }}
                        className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition border ${
                          currentLocation.city.toLowerCase() === cityName.toLowerCase()
                            ? "bg-red-600 text-white border-red-500 shadow-sm"
                            : "bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-700/80"
                        }`}
                      >
                        {cityName}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Search Results list */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {isSearching && (
                  <div className="p-4 flex items-center justify-center gap-2 text-xs text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                    <span>Searching worldwide database...</span>
                  </div>
                )}

                {!isSearching &&
                  results.map((loc, idx) => {
                    const isSelected =
                      loc.city.toLowerCase() === currentLocation.city.toLowerCase() &&
                      loc.country.toLowerCase() === currentLocation.country.toLowerCase();

                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectLocationItem(loc)}
                        className={`w-full text-left p-3 rounded-2xl border transition flex items-center justify-between group ${
                          isSelected
                            ? "bg-red-950/40 border-red-500/80 text-white shadow"
                            : "bg-slate-800/50 hover:bg-slate-800 border-slate-750 hover:border-slate-650"
                        }`}
                      >
                        <div className="truncate pr-2">
                          <div className="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5">
                            <span className="truncate">{loc.city}</span>
                            {loc.state && (
                              <span className="text-slate-400 font-normal text-xs truncate">
                                · {loc.state}
                              </span>
                            )}
                            {loc.country && (
                              <span className="text-slate-400 font-normal text-xs truncate">
                                ({loc.country})
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                            {loc.displayName}
                          </div>
                          <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1 font-mono">
                            <Globe className="w-3 h-3" />
                            <span>Native Speech: {loc.detectedNativeLanguage.toUpperCase()}</span>
                            {loc.lat !== undefined && loc.lon !== undefined && (
                              <span className="text-slate-500 ml-1">
                                · {loc.lat.toFixed(2)}°, {loc.lon.toFixed(2)}°
                              </span>
                            )}
                          </div>
                        </div>

                        {isSelected ? (
                          <span className="px-2 py-1 rounded-lg bg-red-600 text-white text-[10px] font-bold shrink-0">
                            Selected
                          </span>
                        ) : (
                          <div className="w-7 h-7 rounded-xl bg-slate-900 group-hover:bg-red-600 group-hover:text-white text-slate-400 flex items-center justify-center transition shrink-0">
                            <Check className="w-4 h-4" />
                          </div>
                        )}
                      </button>
                    );
                  })}

                {results.length === 0 && !isSearching && hasSearched && (
                  <div className="p-4 text-center rounded-2xl bg-slate-950 border border-slate-800">
                    <p className="text-xs text-slate-300 font-semibold">
                      No matching city found for "{query}"
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Check spelling or use the Manual tab to type any custom place.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Manual Tab */
            <div className="space-y-3.5">
              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">
                  City or Town Name
                </label>
                <input
                  type="text"
                  value={manualCity}
                  onChange={(e) => setManualCity(e.target.value)}
                  placeholder="e.g. Hosur, Chennai, Austin, Minato"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">
                  State / Province / District
                </label>
                <input
                  type="text"
                  value={manualState}
                  onChange={(e) => setManualState(e.target.value)}
                  placeholder="e.g. Tamil Nadu, California, Bavaria"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">
                  Country
                </label>
                <input
                  type="text"
                  value={manualCountry}
                  onChange={(e) => setManualCountry(e.target.value)}
                  placeholder="e.g. India, United States, Japan"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-red-500"
                />
              </div>
              <button
                type="button"
                onClick={handleManualApply}
                disabled={!manualCity.trim()}
                className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 active:scale-[0.99] text-white py-3 rounded-2xl font-bold text-xs sm:text-sm shadow-lg shadow-red-950/50 transition disabled:opacity-50"
              >
                Set Location Now
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 text-center flex items-center justify-center gap-1.5">
          <Radio className="w-3 h-3 text-red-500" />
          <span>Real-time CAP alert feeds & local emergency units update instantaneously.</span>
        </div>
      </div>
    </div>
  );
};
