import React, { useState, useEffect, useMemo } from "react";
import { UserLocation, ActiveUserSession } from "../types";
import { PRIORITY_LANGUAGES, getAllWorldLanguages } from "../utils/languages";
import { isSirenActive, stopEmergencySiren } from "../utils/audio";
import {
  ShieldAlert,
  MapPin,
  Globe,
  Radio,
  VolumeX,
  Lock,
  ChevronDown,
  X,
  Search,
  LogOut,
} from "lucide-react";
import { AlertAloudLogo } from "./Logo";

interface HeaderProps {
  location: UserLocation;
  selectedLang: string;
  onSelectLang: (langCode: string) => void;
  currentRole?: "citizen" | "officials";
  onChangeRole?: (role: "citizen" | "officials") => void;
  onOpenSOSModal: () => void;
  onOpenLocationModal: () => void;
  activeSession: ActiveUserSession | null;
  onSignOut: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  location,
  selectedLang,
  onSelectLang,
  currentRole,
  onChangeRole,
  onOpenSOSModal,
  onOpenLocationModal,
  activeSession,
  onSignOut,
}) => {
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [langSearch, setLangSearch] = useState("");
  const [sirenPlaying, setSirenPlaying] = useState(false);

  // Poll siren state
  useEffect(() => {
    const interval = setInterval(() => {
      setSirenPlaying(isSirenActive());
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const allLanguages = useMemo(() => getAllWorldLanguages(), []);

  // Filter languages: Priority first, then search results
  const filteredLanguages = useMemo(() => {
    if (!langSearch.trim()) return allLanguages.slice(0, 35);
    const q = langSearch.toLowerCase();
    return allLanguages.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.nativeName.toLowerCase().includes(q) ||
        l.code.includes(q)
    );
  }, [allLanguages, langSearch]);

  const currentLangObj = useMemo(() => {
    return allLanguages.find((l) => l.code === selectedLang) || PRIORITY_LANGUAGES[0];
  }, [allLanguages, selectedLang]);

  const detectedRegionalLangObj = useMemo(() => {
    return allLanguages.find((l) => l.code === location.detectedNativeLanguage) || null;
  }, [allLanguages, location.detectedNativeLanguage]);

  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800">
      {/* 1. Critical Alarm Bar (Only when siren is triggered) */}
      {sirenPlaying && (
        <div className="bg-red-600 text-white px-3 sm:px-4 py-2 flex items-center justify-between gap-2 animate-pulse">
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold tracking-wide truncate">
            <Radio className="w-3.5 h-3.5 shrink-0 animate-spin" />
            <span className="truncate">CRITICAL SIREN ACTIVE (880Hz-440Hz)</span>
          </div>
          <button
            onClick={() => {
              stopEmergencySiren();
              setSirenPlaying(false);
            }}
            className="bg-black/40 hover:bg-black/60 text-white px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 shrink-0 transition"
          >
            <VolumeX className="w-3 h-3" />
            <span>Mute</span>
          </button>
        </div>
      )}

      {/* 2. Main Navigation Bar */}
      <div className="max-w-6xl mx-auto px-2.5 sm:px-4 py-2 flex items-center justify-between gap-1.5 sm:gap-3">
        {/* Brand with official logo */}
        <AlertAloudLogo
          iconSize="w-7 h-7 sm:w-8 sm:h-8"
          textSize="base"
          showSubtitle={true}
          showLivePulse={true}
        />

        {/* Interactive Location Button */}
        <button
          onClick={onOpenLocationModal}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-750 hover:border-red-500/60 text-xs text-slate-100 transition shadow-sm active:scale-95 group shrink truncate"
          title={`Active Location: ${location.displayName} (tap to edit or auto-detect)`}
        >
          <MapPin className="w-3.5 h-3.5 text-red-500 group-hover:scale-110 shrink-0 transition-transform" />
          <div className="flex items-center gap-1 truncate text-left">
            <span className="font-bold truncate text-[11px] sm:text-xs text-white">
              {location.city || "Location"}
            </span>
            <span className="text-[10px] text-red-400 font-semibold hidden sm:inline bg-red-950/40 px-1 py-0.2 rounded border border-red-800/40">
              Edit
            </span>
          </div>
        </button>

        {/* Right Actions: Language Selector + Call 112 + SOS Button */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Language Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-1 px-2 py-1 sm:py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-[11px] sm:text-xs font-medium text-slate-200 transition"
              title="Select language"
            >
              <Globe className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-400 shrink-0" />
              <span className="font-semibold">{currentLangObj.code.toUpperCase()}</span>
              <ChevronDown className="w-2.5 h-2.5 text-slate-400 shrink-0" />
            </button>

            {showLangMenu && (
              <>
                <div
                  className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] sm:hidden"
                  onClick={() => setShowLangMenu(false)}
                />
                <div className="fixed inset-x-3 top-13 z-50 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 w-auto sm:w-72 bg-slate-900 border border-slate-750 rounded-2xl shadow-2xl p-2.5 max-h-[75vh] flex flex-col">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-blue-400" />
                      Choose Language
                    </span>
                    <button
                      onClick={() => setShowLangMenu(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="relative mb-2">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={langSearch}
                      onChange={(e) => setLangSearch(e.target.value)}
                      placeholder="Search 100+ languages..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      autoFocus
                    />
                  </div>

                  {/* Priority Row: English & Detected Regional */}
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Recommended For Your Location
                  </div>
                  <div className="py-1 space-y-0.5">
                    <button
                      onClick={() => {
                        onSelectLang("en");
                        setShowLangMenu(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between ${
                        selectedLang === "en"
                          ? "bg-blue-600 text-white font-bold"
                          : "text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      <span>English</span>
                      <span className="text-[10px] opacity-75">Global Default</span>
                    </button>

                    {detectedRegionalLangObj && detectedRegionalLangObj.code !== "en" && (
                      <button
                        onClick={() => {
                          onSelectLang(detectedRegionalLangObj.code);
                          setShowLangMenu(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between ${
                          selectedLang === detectedRegionalLangObj.code
                            ? "bg-blue-600 text-white font-bold"
                            : "text-emerald-400 bg-emerald-950/30 hover:bg-emerald-900/40"
                        }`}
                      >
                        <span className="font-semibold">{detectedRegionalLangObj.nativeName}</span>
                        <span className="text-[10px] text-emerald-300">
                          📍 Native ({detectedRegionalLangObj.name})
                        </span>
                      </button>
                    )}
                  </div>

                  {/* All World Languages */}
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-t border-slate-800 mt-1">
                    All World Languages
                  </div>
                  <div className="overflow-y-auto max-h-48 py-1 space-y-0.5">
                    {filteredLanguages.map((l) => (
                      <button
                        key={l.code}
                        onClick={() => {
                          onSelectLang(l.code);
                          setShowLangMenu(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between ${
                          selectedLang === l.code
                            ? "bg-blue-600 text-white font-bold"
                            : "text-slate-300 hover:bg-slate-800"
                        }`}
                      >
                        <div>
                          <div className="font-medium text-white">{l.nativeName}</div>
                          <div className="text-[10px] text-slate-400">{l.name}</div>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {l.code.toUpperCase()}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Portal / Sign Out Button */}
          <button
            onClick={onSignOut}
            className="flex items-center gap-1 px-2 py-1 sm:py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-[11px] sm:text-xs font-semibold text-slate-300 hover:text-white transition shrink-0"
            title={activeSession ? "Sign Out & Return to Landing Page" : "Return to Landing Page"}
          >
            <LogOut className="w-3 h-3 text-slate-400" />
            <span className="hidden sm:inline">{activeSession ? "Sign Out" : "Portal"}</span>
          </button>

          {/* Red Persistent SOS Button */}
          <button
            onClick={onOpenSOSModal}
            className="flex items-center gap-1 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 active:scale-95 text-white font-bold px-2.5 py-1.5 rounded-full text-xs shadow-md shadow-red-950/60 transition shrink-0"
            title="Emergency SOS Coordination"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span className="font-black">SOS</span>
          </button>
        </div>
      </div>
    </header>
  );
};
