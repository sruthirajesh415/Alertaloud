import React, { useState } from "react";
import { UserLocation, Household, ActiveUserSession } from "../types";
import {
  SAMPLE_CITIZEN_PROFILES,
  sampleProfileToHousehold,
  findHouseholdByPhone,
  setActiveUserSession,
  saveHousehold,
} from "../utils/storage";
import { AlertAloudLogo } from "./Logo";
import {
  ShieldAlert,
  Users,
  Lock,
  ArrowRight,
  Phone,
  Sparkles,
  MapPin,
  Globe,
  Radio,
  CheckCircle2,
  Volume2,
  HeartPulse,
  Flame,
  Wind,
  ShieldCheck,
  Zap,
  ChevronRight,
  Eye,
} from "lucide-react";

interface LandingPageProps {
  location: UserLocation;
  selectedLang: string;
  onOpenLocationModal: () => void;
  onSelectLang: (lang: string) => void;
  onLoginExisting: (household: Household, session: ActiveUserSession) => void;
  onStartOnboarding: (phone: string) => void;
  onOfficerLogin: () => void;
  onExploreGuest: () => void;
  onOpenDemoSuite: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  location,
  selectedLang,
  onOpenLocationModal,
  onSelectLang,
  onLoginExisting,
  onStartOnboarding,
  onOfficerLogin,
  onExploreGuest,
  onOpenDemoSuite,
}) => {
  const [authMode, setAuthMode] = useState<"citizen" | "officer">("citizen");
  const [phoneInput, setPhoneInput] = useState("");
  const [sampleIndex, setSampleIndex] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Officer fields
  const [officerBadge, setOfficerBadge] = useState("DISPATCH-01");
  const [officerPin, setOfficerPin] = useState("");
  const [officerError, setOfficerError] = useState(false);

  const currentSample = SAMPLE_CITIZEN_PROFILES[sampleIndex];

  // Cycling sample citizen click handler
  const handleCycleSampleCitizen = () => {
    const nextIdx = (sampleIndex + 1) % SAMPLE_CITIZEN_PROFILES.length;
    setSampleIndex(nextIdx);
    const nextSample = SAMPLE_CITIZEN_PROFILES[nextIdx];
    setPhoneInput(nextSample.phone);
    setFeedback(`Selected sample profile: ${nextSample.memberName} (${nextSample.city}). Click "Continue" or "1-Tap Login" to enter.`);
  };

  // Direct 1-Tap Login with current sample profile
  const handleFastLoginSample = (sample: typeof currentSample) => {
    setIsLoading(true);
    const hh = sampleProfileToHousehold(sample);
    saveHousehold(hh);

    const session: ActiveUserSession = {
      phone: sample.phone,
      householdId: hh.id,
      memberName: sample.memberName,
      loggedInAt: new Date().toISOString(),
    };
    setActiveUserSession(session);

    setFeedback(`Logged in as ${sample.memberName}! Directing to household dashboard...`);
    setTimeout(() => {
      onLoginExisting(hh, session);
    }, 450);
  };

  // Handle Form Submission for Citizen
  const handleCitizenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phoneInput.trim();
    if (!cleanPhone || cleanPhone.length < 5) return;

    setIsLoading(true);
    setFeedback(null);

    // Look up in database (handles primary numbers, family numbers, and samples)
    setTimeout(() => {
      const match = findHouseholdByPhone(cleanPhone);

      if (match) {
        // EXISTING USER OR REGISTERED FAMILY MEMBER: Direct to home page skipping questions!
        const session: ActiveUserSession = {
          phone: cleanPhone,
          householdId: match.household.id,
          memberName: match.matchedMemberName,
          loggedInAt: new Date().toISOString(),
        };
        setActiveUserSession(session);
        setFeedback(`Welcome back, ${match.matchedMemberName}! Loading ${match.household.householdName}...`);

        setTimeout(() => {
          onLoginExisting(match.household, session);
        }, 500);
      } else {
        // FIRST TIME USER: Launch onboarding wizard to complete family details
        setIsLoading(false);
        onStartOnboarding(cleanPhone);
      }
    }, 300);
  };

  // Handle Officer Form Submission
  const handleOfficerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (officerPin.trim() === "1234") {
      setOfficerError(false);
      onOfficerLogin();
    } else {
      setOfficerError(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-red-500 selection:text-white">
      {/* 1. Universal Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <AlertAloudLogo
            iconSize="w-8 h-8 sm:w-9 sm:h-9"
            textSize="base"
            showSubtitle={true}
            showLivePulse={true}
          />

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#how-it-works" className="hover:text-white transition">Family Triage</a>
            <a href="#official-feeds" className="hover:text-white transition">CAP Feeds</a>
            <button
              onClick={onOpenLocationModal}
              className="flex items-center gap-1.5 text-slate-300 hover:text-white transition"
            >
              <MapPin className="w-3.5 h-3.5 text-red-500" />
              <span>{location.city} (Change)</span>
            </button>
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenLocationModal}
              className="flex md:hidden items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300"
            >
              <MapPin className="w-3.5 h-3.5 text-red-400" />
              <span className="truncate max-w-[80px]">{location.city}</span>
            </button>

            {/* Prominent Demo Showcase Button for Judges at the Top */}
            <button
              onClick={onOpenDemoSuite}
              className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black transition flex items-center gap-1.5 shadow-lg shadow-indigo-950/60 border border-blue-400/40"
              title="Explore Pre-Filled Emergency Situations for Judges"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span className="hidden sm:inline">🏆 Explore Demo (Judges Showcase)</span>
              <span className="sm:hidden">🏆 Judges Demo</span>
            </button>

            <button
              onClick={() => {
                setAuthMode("officer");
                const el = document.getElementById("login-card");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              className="px-3 py-1.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-xs font-bold transition flex items-center gap-1"
            >
              <Lock className="w-3 h-3 text-amber-400" />
              <span className="hidden sm:inline">Officer Login</span>
              <span className="sm:hidden">Officer</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section with Integrated Login Card */}
      <section className="relative overflow-hidden pt-6 pb-12 sm:pt-12 sm:pb-20 border-b border-slate-800/80 bg-gradient-to-b from-slate-900/60 via-slate-950 to-slate-950">
        {/* Ambient glow backgrounds */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-red-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 -left-20 w-[400px] h-[300px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Hero Narrative */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/50 border border-red-500/30 text-xs font-bold text-red-300">
                <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                <span>Next-Gen Civil Defense & Disaster Companion</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1] text-balance">
                One alert. Everything you need. <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-rose-500 to-amber-400">Read aloud.</span>
              </h1>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
                Real-time official disaster feeds, multilingual emergency broadcasts, and instant household coordination. Prioritizes bedridden elders and life-saving medical equipment directly on first-responders’ dispatch screens.
              </p>

              {/* Verified Sector Banner */}
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md flex items-center justify-between gap-3 max-w-xl">
                <div className="flex items-center gap-2.5 min-w-0">
                  <MapPin className="w-5 h-5 text-red-500 shrink-0" />
                  <div className="truncate">
                    <span className="text-[11px] text-slate-400 block font-semibold uppercase">
                      Current Detected Sector:
                    </span>
                    <strong className="text-sm text-white truncate block">
                      {location.displayName || `${location.city}, ${location.country}`}
                    </strong>
                  </div>
                </div>
                <button
                  onClick={onOpenLocationModal}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-semibold text-xs border border-slate-700 hover:border-red-500/50 transition shrink-0"
                >
                  Change Location
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs">
                <div className="p-3 rounded-2xl bg-slate-900/50 border border-slate-800/80">
                  <div className="text-white font-bold flex items-center gap-1.5">
                    <Radio className="w-4 h-4 text-emerald-400" />
                    <span>Real-Time CAP</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Live meteorological feeds</div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-900/50 border border-slate-800/80">
                  <div className="text-white font-bold flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4 text-rose-400" />
                    <span>Multilingual Voice</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Spoken emergency action steps</div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-900/50 border border-slate-800/80 col-span-2 sm:col-span-1">
                  <div className="text-white font-bold flex items-center gap-1.5">
                    <HeartPulse className="w-4 h-4 text-amber-400" />
                    <span>Medical Priority</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Oxygen & bedridden triage</div>
                </div>
              </div>
            </div>

            {/* Right: Modern High-Interactivity Login Card */}
            <div id="login-card" className="lg:col-span-5">
              <div className="bg-slate-900 border border-slate-750 rounded-3xl shadow-2xl p-5 sm:p-7 relative overflow-hidden text-left">
                {/* Header Switcher: Citizen vs Officer */}
                <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800 mb-5 gap-1">
                  <button
                    onClick={() => {
                      setAuthMode("citizen");
                      setOfficerError(false);
                    }}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      authMode === "citizen"
                        ? "bg-slate-800 text-white shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Users className="w-4 h-4 text-blue-400" />
                    <span>Citizen / Family</span>
                  </button>
                  <button
                    onClick={() => {
                      setAuthMode("officer");
                      setFeedback(null);
                    }}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      authMode === "officer"
                        ? "bg-amber-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-amber-300"
                    }`}
                  >
                    <Lock className="w-4 h-4 text-amber-300" />
                    <span>Officer Access</span>
                  </button>
                </div>

                {/* VIEW 1: Citizen Login Form */}
                {authMode === "citizen" && (
                  <div className="space-y-4">
                    <form onSubmit={handleCitizenSubmit} className="space-y-3.5">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-semibold text-slate-200">
                            Mobile Phone Number
                          </label>
                          <span className="text-[10px] text-slate-400">
                            Coordinates family profile
                          </span>
                        </div>
                        <div className="relative">
                          <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="tel"
                            value={phoneInput}
                            onChange={(e) => setPhoneInput(e.target.value)}
                            placeholder="+1 234 567 8900"
                            className="w-full bg-slate-950 border border-slate-700 focus:border-red-500 rounded-xl pl-10 pr-3 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none transition font-medium"
                            required
                          />
                        </div>
                      </div>

                      {feedback && (
                        <div className="p-2.5 bg-emerald-950/60 border border-emerald-600/50 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                          <span>{feedback}</span>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isLoading || !phoneInput.trim()}
                        className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 active:scale-[0.99] text-white py-3 rounded-2xl font-bold text-xs sm:text-sm shadow-lg shadow-red-950/60 flex items-center justify-center gap-2 transition disabled:opacity-50"
                      >
                        {isLoading ? (
                          <span>Authenticating Profile...</span>
                        ) : (
                          <>
                            <span>Continue to Emergency Shield</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </form>

                    <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 space-y-1.5">
                      <p className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span><strong>First-time citizen?</strong> Fill your household details once. They are securely saved.</span>
                      </p>
                      <p className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span><strong>Returning resident?</strong> Entering your phone skips straight to the home dashboard.</span>
                      </p>
                      <p className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span><strong>Family members:</strong> Any phone number registered under your household logs in directly without repeating questions.</span>
                      </p>
                    </div>
                  </div>
                )}

                {/* VIEW 2: Officer Login Form */}
                {authMode === "officer" && (
                  <form onSubmit={handleOfficerSubmit} className="space-y-4">
                    <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-600/50 text-xs text-amber-200">
                      <div className="flex items-center gap-1.5 font-bold text-amber-300 mb-0.5">
                        <ShieldAlert className="w-4 h-4" />
                        <span>Civil Defense Dispatch Command</span>
                      </div>
                      <p className="text-[11px] text-amber-200/80">
                        Incident Commander & Rescue Coordination Console. Default PIN: <strong>1234</strong>
                      </p>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Officer Call-Sign / Badge
                      </label>
                      <input
                        type="text"
                        value={officerBadge}
                        onChange={(e) => setOfficerBadge(e.target.value)}
                        placeholder="DISPATCH-01"
                        className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-3 py-2 text-xs sm:text-sm text-white font-mono uppercase"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1 flex items-center justify-between">
                        <span>4-Digit Security PIN</span>
                        <button
                          type="button"
                          onClick={() => {
                            setOfficerPin("1234");
                            setOfficerError(false);
                          }}
                          className="text-[10px] text-amber-400 underline"
                        >
                          Fill 1234
                        </button>
                      </label>
                      <input
                        type="password"
                        maxLength={4}
                        value={officerPin}
                        onChange={(e) => {
                          setOfficerPin(e.target.value);
                          setOfficerError(false);
                        }}
                        placeholder="1234"
                        className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-3 py-2 text-xs sm:text-sm text-white font-mono tracking-widest text-center"
                        required
                      />
                      {officerError && (
                        <p className="text-xs text-red-400 mt-1">Invalid PIN. Please enter 1234.</p>
                      )}
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white py-3 rounded-2xl font-bold text-xs sm:text-sm shadow-lg shadow-amber-950/60 transition"
                    >
                      Unlock Control Room Dashboard
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Bento Grid: 4 Core Emergency Capabilities with Generated Visuals */}
      <section id="features" className="py-12 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Engineered for High-Pressure Survival
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            One platform integrating official meteorology, multilingual voice broadcaster, and medical triage.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
          {/* Card 1: Flood Rescue */}
          <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-lg flex flex-col justify-between group">
            <div className="relative h-44 overflow-hidden bg-slate-950">
              <img
                src="/src/assets/images/monsoon_flood_rescue_1792341591272.jpg"
                alt="Flood Rescue Alert"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
              <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black uppercase">
                Flash Inundation
              </span>
            </div>
            <div className="p-4 space-y-1.5 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-white text-sm">Official Warning Radar</h3>
                <p className="text-[11px] text-slate-400 mt-1">
                  Connects to Open-Meteo & CAP sensor networks with automatic siren triggering for immediate evacuation.
                </p>
              </div>
              <div className="text-[10px] text-emerald-400 font-mono pt-2">
                • 880Hz-440Hz Web Audio siren
              </div>
            </div>
          </div>

          {/* Card 2: Fire Safety */}
          <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-lg flex flex-col justify-between group">
            <div className="relative h-44 overflow-hidden bg-slate-950">
              <img
                src="/src/assets/images/fire_safety_rescue_1792341590584.jpg"
                alt="Fire Safety Alert"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
              <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black uppercase">
                Fire & Gas Leaks
              </span>
            </div>
            <div className="p-4 space-y-1.5 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-white text-sm">AI Emergency Analysis</h3>
                <p className="text-[11px] text-slate-400 mt-1">
                  Upload screenshot notices or record voice descriptions for instant Red Cross-standard action plans.
                </p>
              </div>
              <div className="text-[10px] text-purple-400 font-mono pt-2">
                • Gemini Multimodal OCR verification
              </div>
            </div>
          </div>

          {/* Card 3: Severe Storm */}
          <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-lg flex flex-col justify-between group">
            <div className="relative h-44 overflow-hidden bg-slate-950">
              <img
                src="/src/assets/images/severe_storm_weather_1792341591752.jpg"
                alt="Severe Storm Weather"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
              <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-black uppercase">
                Atmospheric Storms
              </span>
            </div>
            <div className="p-4 space-y-1.5 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-white text-sm">Multilingual Voice Broadcaster</h3>
                <p className="text-[11px] text-slate-400 mt-1">
                  Broadcasts calm, imperative instructions in 100+ native regional dialects so elders understand instantly.
                </p>
              </div>
              <div className="text-[10px] text-blue-400 font-mono pt-2">
                • 100+ native world languages
              </div>
            </div>
          </div>

          {/* Card 4: Preparedness Go-Bag */}
          <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-lg flex flex-col justify-between group">
            <div className="relative h-44 overflow-hidden bg-slate-950">
              <img
                src="/src/assets/images/family_safety_preparedness_1792341599634.jpg"
                alt="Family Preparedness Kit"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
              <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black uppercase">
                Survival Go-Bag
              </span>
            </div>
            <div className="p-4 space-y-1.5 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-white text-sm">Family Rescue Triage</h3>
                <p className="text-[11px] text-slate-400 mt-1">
                  Flags oxygen-dependent machines, vital medicines, and bedridden family members for prioritized rescue boats.
                </p>
              </div>
              <div className="text-[10px] text-emerald-400 font-mono pt-2">
                • Synchronized with Control Room
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950 py-8 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <AlertAloudLogo iconSize="w-6 h-6" textSize="sm" showSubtitle={false} showLivePulse={false} />
            <span>— Global Emergency Companion</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span>National Emergency: <strong className="text-white">112 / 911</strong></span>
            <span>·</span>
            <button onClick={onExploreGuest} className="hover:text-white transition">
              Live Demo
            </button>
            <span>·</span>
            <button
              onClick={() => {
                setAuthMode("officer");
                const el = document.getElementById("login-card");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              className="text-amber-400 hover:text-amber-300"
            >
              Control Room (PIN: 1234)
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
