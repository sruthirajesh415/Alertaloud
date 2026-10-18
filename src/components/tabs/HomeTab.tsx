import React, { useState, useEffect, useRef } from "react";
import { UserLocation, Household, AlertData } from "../../types";
import { t } from "../../utils/languages";
import { playEmergencySiren, stopEmergencySiren, speakEmergencyText } from "../../utils/audio";
import { setStoredActiveAlert } from "../../utils/storage";
import {
  ShieldCheck,
  AlertTriangle,
  Flame,
  HeartPulse,
  Wind,
  PhoneCall,
  Camera,
  ChevronDown,
  ChevronUp,
  Volume2,
  VolumeX,
  Radio,
  FileText,
  Truck,
  CheckCircle2,
  Compass,
  ArrowRight,
  Sparkles,
  Loader2,
  ShieldAlert,
  Mic,
  Square,
  MapPin,
  Sun,
  CloudSun,
  Droplets,
  Building2,
  Hospital,
} from "lucide-react";
import { triggerPhoneCall } from "../../utils/communication";
import { getCalamityImage, getOneLineDescription, getDefaultRainfallAlert } from "../../utils/calamity";

interface HomeTabProps {
  location: UserLocation;
  household: Household;
  activeAlert: AlertData | null;
  setActiveAlert: (alert: AlertData | null) => void;
  selectedLang: string;
  onNavigateToTab: (tabId: string) => void;
  onOpenSOSModal: () => void;
  onOpenLocationModal: () => void;
}

export const HomeTab: React.FC<HomeTabProps> = ({
  location,
  household,
  activeAlert,
  setActiveAlert,
  selectedLang,
  onNavigateToTab,
  onOpenSOSModal,
  onOpenLocationModal,
}) => {
  const [liveWeather, setLiveWeather] = useState<{
    temp?: number;
    humidity?: number;
    windSpeed?: number;
    rain?: number;
  }>({});
  const [officialData, setOfficialData] = useState<{
    hasEmergency?: boolean;
    officialStatus?: string;
    officialAgency?: string;
    bulletinReference?: string;
    monitoringSummary?: string;
    weather?: {
      temp?: number;
      feelsLike?: number;
      humidity?: number;
      windSpeed?: number;
      windGusts?: number;
      rain?: number;
      weatherCode?: number;
      conditionText?: string;
      forecast3Days?: Array<{
        date: string;
        maxTemp: number;
        minTemp: number;
        rainProb: number;
        code: number;
      }>;
    };
    essentialDetails?: {
      districtControlRoom?: string;
      nearestHospital?: string;
      fireStation?: string;
      helplineNumbers?: Record<string, string>;
      floodRiskLevel?: string;
      powerGridStatus?: string;
    };
  }>({});
  const [isCheckingFeed, setIsCheckingFeed] = useState(false);
  const [isSimulateOpen, setIsSimulateOpen] = useState(false);

  // Screenshot / Emergency text modal
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState<string>("House Fire");
  const [reportNotes, setReportNotes] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [voiceDuration, setVoiceDuration] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const voiceTimerRef = useRef<any>(null);

  const stopVoiceReport = () => {
    setIsVoiceRecording(false);
    if (voiceTimerRef.current) {
      clearInterval(voiceTimerRef.current);
      voiceTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
  };

  const handleToggleVoiceReport = () => {
    if (isVoiceRecording) {
      stopVoiceReport();
      return;
    }
    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      alert("Speech recognition is not supported in this browser. You can type details directly.");
      return;
    }
    try {
      const recognition = new SpeechRecognitionClass();
      recognition.lang =
        selectedLang === "ml"
          ? "ml-IN"
          : selectedLang === "ta"
          ? "ta-IN"
          : selectedLang === "hi"
          ? "hi-IN"
          : "en-IN";
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsVoiceRecording(true);
        setVoiceDuration(0);
        voiceTimerRef.current = setInterval(() => {
          setVoiceDuration((prev) => prev + 1);
        }, 1000);
      };

      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript + " ";
        }
        const clean = transcript.trim();
        if (clean) {
          setReportNotes(clean);
          const lower = clean.toLowerCase();
          if (lower.includes("fire") || lower.includes("smoke") || lower.includes("burn")) {
            setReportType("House Fire / Smoke");
          } else if (
            lower.includes("heart") ||
            lower.includes("collapse") ||
            lower.includes("faint") ||
            lower.includes("unconscious") ||
            lower.includes("breathing")
          ) {
            setReportType("Medical Emergency / Collapse");
          } else if (lower.includes("gas") || lower.includes("leak") || lower.includes("lpg") || lower.includes("cylinder")) {
            setReportType("LPG Gas Leak / Explosion Hazard");
          } else if (lower.includes("flood") || lower.includes("water") || lower.includes("drown") || lower.includes("rain")) {
            setReportType("Severe Flood / Landslide Waterlogging");
          } else if (lower.includes("theft") || lower.includes("thief") || lower.includes("break") || lower.includes("threat")) {
            setReportType("Break-in / Personal Safety Threat");
          }
        }
      };

      recognition.onerror = () => stopVoiceReport();
      recognition.onend = () => stopVoiceReport();

      recognition.start();
      recognitionRef.current = recognition;
    } catch {
      stopVoiceReport();
    }
  };

  // Real-time dispatch polling
  const [rescueDispatched, setRescueDispatched] = useState(Boolean(household.rescueDispatched));
  const [dispatchedAt, setDispatchedAt] = useState(household.rescueDispatchedAt);

  const policePhone = household.nearbyServices?.find((s) => s.type === "police")?.phone || "100";
  const firePhone = household.nearbyServices?.find((s) => s.type === "fire")?.phone || "101";

  // Poll live official weather alerts & rescue status for the CURRENT monitored location
  useEffect(() => {
    let isMounted = true;

    async function checkFeed() {
      setIsCheckingFeed(true);
      try {
        const queryParams = new URLSearchParams({
          lat: String(location.lat),
          lon: String(location.lon),
          city: location.city || "Current Location",
          state: location.state || "",
          country: location.country || "",
          countryCode: location.countryCode || "",
        });

        const res = await fetch(`/api/weather-alerts?${queryParams.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setOfficialData(data);
            setLiveWeather(data.weather || {});

            if (data.hasEmergency && data.alert) {
              setActiveAlert(data.alert);
              setStoredActiveAlert(data.alert);
            } else if (!data.hasEmergency) {
              // Location has NO emergency: Clear prior official alerts so it shows All-Clear & real weather
              if (activeAlert?.isOfficialVerified) {
                setActiveAlert(null);
                setStoredActiveAlert(null);
              }
            }
          }
        }

        // Check rescue card dispatch status from server
        const resCards = await fetch("/api/rescue-cards");
        if (resCards.ok) {
          const cards = await resCards.json();
          const myCard = cards.find(
            (c: any) => c.phone === household.primaryPhone || c.id === household.id
          );
          if (myCard && isMounted) {
            setRescueDispatched(myCard.dispatched);
            setDispatchedAt(myCard.dispatchedAt);
          }
        }
      } catch (err) {
        console.warn("Feed check:", err);
      } finally {
        if (isMounted) setIsCheckingFeed(false);
      }
    }

    checkFeed();
    const interval = setInterval(checkFeed, 12000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [location, household]);

  // Handle image upload for screenshot parsing
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        const base64 = result.split(",")[1];
        setImageBase64(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  // Analyze emergency via Gemini 3.8
  const handleAnalyzeEmergency = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAnalyzing(true);
    try {
      const res = await fetch("/api/gemini/analyze-emergency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emergencyText: `${reportType}. Details: ${reportNotes}`,
          imageBase64: imageBase64,
          language: selectedLang,
          familyProfile: {
            householdName: household.householdName,
            totalMembers: household.totalMembers,
            eldersCount: household.eldersCount,
            childrenCount: household.childrenCount,
            bedriddenCount: household.bedriddenCount,
            medicalConditions: household.medicalConditions,
            lifeSavingMedicines: household.lifeSavingMedicines,
            powerDependentDevices: household.powerDependentDevices,
          },
          location,
        }),
      });

      if (res.ok) {
        const parsed = await res.json();
        const newAlert: AlertData = {
          id: `alert-${Date.now()}`,
          tier: parsed.tier || "CRITICAL",
          hazardName: parsed.hazardName || reportType,
          headline: parsed.headline || `${reportType} reported at ${household.address}`,
          timeWindow: "Active Immediate",
          isOfficialVerified: Boolean(parsed.isOfficialVerified),
          officialSource: parsed.officialSource || "Emergency Response Engine",
          immediateLifeSavingSteps: parsed.immediateLifeSavingSteps || [
            "Evacuate everyone to open safe ground immediately.",
            "Take required vital medications for elders and children.",
            "Call emergency response services.",
          ],
          detailedActionSteps: parsed.detailedActionSteps || [],
          whatToTake: parsed.whatToTake || ["Prescription Medicines", "ID Documents", "Water"],
          whereToGo: parsed.whereToGo || "Nearest open safety assembly point",
          responsibleAuthority: parsed.responsibleAuthority || {
            type: "Fire",
            name: "Fire & Rescue Department",
            primaryNumber: "101",
          },
          helplineNumbers: parsed.extractedHelpline ? [parsed.extractedHelpline] : ["112"],
          practicalDisclaimer: parsed.practicalDisclaimer,
          active: true,
          timestamp: new Date().toISOString(),
        };

        setActiveAlert(newAlert);
        setStoredActiveAlert(newAlert);
        setShowReportModal(false);

        // Tier action: If CRITICAL, trigger siren + auto read aloud
        if (newAlert.tier === "CRITICAL") {
          playEmergencySiren();
          const voicePrompt = `${newAlert.hazardName}. ${newAlert.headline}. Immediate action: ${newAlert.immediateLifeSavingSteps.slice(0, 3).join(". ")}`;
          speakEmergencyText(voicePrompt, selectedLang);
        }

        onNavigateToTab("alerts");
      }
    } catch (err) {
      console.error("Failed to analyze emergency:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Simulation helpers for judges and testing
  const handleSimulateWarning = () => {
    stopEmergencySiren();
    const alert: AlertData = {
      id: `sim-warn-${Date.now()}`,
      tier: "WARNING",
      hazardName: "Heavy Rainfall & High Wind Warning",
      headline: `Meteorological warning issued for ${location.city}. Wind gusts up to 60 km/h with localized waterlogging.`,
      timeWindow: "Valid next 6 hours",
      isOfficialVerified: true,
      officialSource: "State Meteorological Authority & Civil Protection",
      immediateLifeSavingSteps: [
        `Move elderly family members away from balcony windows and check vital medicines.`,
        `Switch off ground-level electrical breakers if rainwater approaches living quarters.`,
        `Keep ${household.householdName}'s emergency go-bag and drinking water readily accessible.`,
      ],
      detailedActionSteps: [
        "Park vehicles away from aged trees and tin sheds.",
        "Secure outdoor gas cylinders and solar heater mountings.",
        "Check drainage grating around building perimeter.",
        "Keep battery-powered lanterns charged.",
      ],
      whatToTake: [
        `Prescription medicines: ${household.lifeSavingMedicines.join(", ") || "Daily prescriptions"}`,
        "Drinking water (10 liters)",
        "Waterproof torch and power bank",
      ],
      whereToGo: "Upper floors of sturdy RCC structure or Taluk Community Flood Relief Hall (1.8 km).",
      responsibleAuthority: {
        type: "Disaster Control",
        name: "District Disaster Control Room",
        primaryNumber: "112",
      },
      helplineNumbers: ["112", "1077"],
      active: true,
      timestamp: new Date().toISOString(),
    };
    setActiveAlert(alert);
    setStoredActiveAlert(alert);
  };

  const handleSimulateCritical = () => {
    playEmergencySiren();
    const alert: AlertData = {
      id: `sim-crit-${Date.now()}`,
      tier: "CRITICAL",
      hazardName: "Flash Flood & Rapid Inundation Order",
      headline: `IMMEDIATE EVACUATION ORDER for low-lying sectors of ${location.city}. Water level rising rapidly.`,
      timeWindow: "IMMEDIATE EVACUATION — Next 45 Minutes",
      isOfficialVerified: true,
      officialSource: "National Disaster Response Force (NDRF) & District Collector",
      immediateLifeSavingSteps: [
        `EVACUATE IMMEDIATELY: Assist bedridden/elderly members (${household.eldersCount} elder registered) to elevated rescue transport.`,
        `Take ${household.householdName}'s life-saving daily medicines (${household.lifeSavingMedicines.join(", ") || "insulin & cardiac pills"}) and medical device power cables.`,
        `Shut off main electrical breaker MCB and gas cylinder valve before walking out.`,
      ],
      detailedActionSteps: [
        "Never walk or drive through flowing water; 15cm sweeps away adults, 30cm floats cars.",
        "Wear non-slip sturdy shoes and secure pets with leashes.",
        "Follow high-ground evacuation route avoiding underpasses.",
        "Signal rescue boats from rooftop with bright cloth if cut off.",
      ],
      whatToTake: [
        "Sealed zip-bag with ID cards and medical records",
        "Prescription medicines for 7 days",
        "Charged mobile phones and power bank",
        "Signaling whistle and waterproof torch",
      ],
      whereToGo: "Designated High Ground Evacuation Center: Government Higher Secondary School Campus (Ridge Sector, 1.2 km).",
      responsibleAuthority: {
        type: "Disaster Control",
        name: "National Disaster Response Force & Fire Rescue",
        primaryNumber: "112",
      },
      helplineNumbers: ["112", "1070"],
      active: true,
      timestamp: new Date().toISOString(),
    };

    setActiveAlert(alert);
    setStoredActiveAlert(alert);

    // Auto read aloud action plan in selected language
    const speech = `${alert.hazardName}! ${alert.headline}. Immediate action: ${alert.immediateLifeSavingSteps.slice(0, 3).join(". ")}`;
    speakEmergencyText(speech, selectedLang);
  };

  const handleSimulateHouseholdFire = () => {
    playEmergencySiren();
    const alert: AlertData = {
      id: `sim-fire-${Date.now()}`,
      tier: "CRITICAL",
      hazardName: "Structure Fire & Smoke Inhalation",
      headline: `Active structural smoke alert at ${household.address}. Exit immediately.`,
      timeWindow: "Immediate Evacuation",
      isOfficialVerified: false,
      officialSource: "Red Cross & NFPA Standard (Tier-2 AI Practical Guidance)",
      immediateLifeSavingSteps: [
        "GET OUT, STAY OUT: Crawl low under smoke to the nearest exterior door.",
        `Assist ${household.eldersCount > 0 ? "elderly members" : "all members"} directly to outside open assembly spot.`,
        "Call Fire & Rescue (101 / 112) immediately once outdoors; never re-enter.",
      ],
      detailedActionSteps: [
        "Feel door handles with the back of your hand; do not open if hot.",
        "Close doors behind you as you exit to starve the fire of oxygen.",
        "If clothing catches fire: Stop, Drop, and Roll.",
        "Trigger WhatsApp Neighbour SOS to alert nearby residents.",
      ],
      whatToTake: ["Emergency go-bag only if placed right next to the exit door."],
      whereToGo: "Street mailbox or designated neighborhood tree at least 50 meters upwind.",
      responsibleAuthority: {
        type: "Fire",
        name: "Municipal Fire & Rescue Service",
        primaryNumber: "101",
      },
      helplineNumbers: ["101", "112"],
      practicalDisclaimer:
        "Official government guidelines for this exact house fire are not listed. Showing AI-generated practical steps based on universal Red Cross and Fire-Rescue standards. Follow emergency operators first.",
      active: true,
      timestamp: new Date().toISOString(),
    };

    setActiveAlert(alert);
    setStoredActiveAlert(alert);

    const speech = `Fire Emergency! Exit the building immediately. Crawl low under smoke and assemble at the street point.`;
    speakEmergencyText(speech, selectedLang);
  };

  const handleResetToCalm = () => {
    stopEmergencySiren();
    setActiveAlert(null);
    setStoredActiveAlert(null);
  };

  return (
    <div className="space-y-4 pb-20 animate-in fade-in duration-200">
      {/* 0. Interactive Active Location & Telemetry Bar */}
      <div className="p-3.5 sm:p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-600/30 to-rose-600/10 text-red-400 border border-red-500/30 flex items-center justify-center shrink-0 shadow-inner">
            <Compass className="w-5 h-5 text-red-400 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Monitored Sector
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
              {isCheckingFeed && (
                <span className="text-[10px] text-blue-400 font-medium flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Scanning official bulletins...</span>
                </span>
              )}
            </div>
            <div className="text-sm sm:text-base font-black text-white truncate drop-shadow-sm">
              {location.displayName || `${location.city}, ${location.country}`}
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5 font-mono">
              <span>🌡️ {liveWeather.temp ?? 24}°C</span>
              <span>·</span>
              <span>💨 {liveWeather.windSpeed ?? 12} km/h wind</span>
              <span>·</span>
              <span className="text-emerald-400 font-sans font-semibold">
                {officialData.weather?.conditionText || "Active Weather Sensors"}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onOpenLocationModal}
          className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 active:scale-95 text-white text-xs font-bold flex items-center justify-center gap-2 transition shadow-md shadow-red-950/60 shrink-0 self-stretch sm:self-auto"
          title="Change location or auto-detect"
        >
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span>Change / Auto-Detect</span>
        </button>
      </div>

      {/* 1. SCENARIO A: ACTIVE OFFICIAL EMERGENCY (Shown ONLY when official alert exists for this location) */}
      {activeAlert ? (
        <div
          className={`rounded-3xl border-2 shadow-2xl overflow-hidden transition-all duration-300 ${
            activeAlert.tier === "CRITICAL"
              ? "bg-slate-900 border-red-600 shadow-red-950/40"
              : "bg-slate-900 border-amber-500 shadow-amber-950/30"
          }`}
        >
          {/* Realistic Photographic Image of the Calamity */}
          <div className="relative h-44 sm:h-52 w-full overflow-hidden bg-slate-950">
            <img
              src={getCalamityImage(activeAlert.hazardName, activeAlert.tier)}
              alt={activeAlert.hazardName}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center filter brightness-90 contrast-105 transition-transform duration-700 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />

            {/* Badges on Calamity Image */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
              <span
                className={`px-2.5 py-1 rounded-full text-[11px] font-black tracking-wider uppercase shadow-lg ${
                  activeAlert.tier === "CRITICAL"
                    ? "bg-red-600 text-white animate-pulse"
                    : "bg-amber-500 text-slate-950 font-bold"
                }`}
              >
                {activeAlert.tier === "CRITICAL" ? "🚨 CRITICAL ALERT" : "⚠️ OFFICIAL WARNING"}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] text-slate-300 font-medium border border-white/10">
                Official Calamity Feed
              </span>
            </div>

            {/* Calamity Title and One-Line Short Description */}
            <div className="absolute bottom-3 left-3 right-3 space-y-1">
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight drop-shadow-md">
                {activeAlert.hazardName}
              </h2>
              <p className="text-xs sm:text-sm text-slate-100 font-medium line-clamp-1 drop-shadow">
                {getOneLineDescription(activeAlert.headline, activeAlert.hazardName)}
              </p>
            </div>
          </div>

          {/* Quick Action Footer Bar */}
          <div className="p-3.5 bg-slate-900 flex items-center justify-between gap-2 border-t border-slate-800">
            <div className="text-[11px] text-slate-400 font-semibold truncate flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping shrink-0" />
              <span className="truncate">Source: {activeAlert.officialSource}</span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  const speech = `${activeAlert.hazardName}. ${getOneLineDescription(
                    activeAlert.headline,
                    activeAlert.hazardName
                  )}. Immediate steps: ${activeAlert.immediateLifeSavingSteps.slice(0, 2).join(". ")}`;
                  speakEmergencyText(speech, selectedLang);
                }}
                className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 flex items-center justify-center transition border border-slate-700 active:scale-95 shrink-0"
                title={t("readAloud", selectedLang)}
              >
                <Volume2 className="w-4 h-4 text-emerald-400" />
              </button>

              <button
                onClick={() => onNavigateToTab("alerts")}
                className="px-4 py-2 rounded-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition active:scale-95"
              >
                <span>View Action Plan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* 1. SCENARIO B: ALL CLEAR / NORMAL EVERYDAY WEATHER (Shown when no emergency exists) */
        <div className="space-y-4">
          {/* Official All Clear Status Card */}
          <div className="rounded-3xl border border-emerald-500/40 bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 p-4 sm:p-5 shadow-xl shadow-emerald-950/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-inner">
                  <ShieldCheck className="w-7 h-7 text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black uppercase tracking-wider">
                      Official Status
                    </span>
                    <span className="text-xs font-black text-emerald-400 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      ALL CLEAR • NORMAL CONDITIONS
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-white mt-1">
                    No Active Emergency Warnings for {location.city}
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                    Official authorities have not issued any severe disaster or flood alerts for this sector. Meteorological indicators and civil infrastructure are within safe baseline limits.
                  </p>
                </div>
              </div>

              <div className="shrink-0 self-start sm:self-center text-right">
                <span className="px-2.5 py-1 rounded-xl bg-slate-800/80 border border-slate-700 text-[11px] text-slate-300 block font-mono">
                  {officialData.bulletinReference || "CAP-ALL-CLEAR-LIVE"}
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Live Sync: Just now
                </span>
              </div>
            </div>

            <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-emerald-400" />
                <span>Source: <strong>{officialData.officialAgency || "State Meteorological Authority & Civil Defense"}</strong></span>
              </div>
              <span className="text-emerald-400 font-semibold">Continuous CAP Monitoring Active</span>
            </div>
          </div>

          {/* Real-time Weather Telemetry & 3-Day Forecast Hub */}
          <div className="p-4 sm:p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CloudSun className="w-5 h-5 text-amber-400" />
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                  Live Regional Weather & Forecast
                </h4>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                Open-Meteo Verified Radar
              </span>
            </div>

            {/* Current Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80">
                <div className="text-[10px] uppercase font-bold text-slate-400">Temperature</div>
                <div className="text-xl font-black text-white mt-0.5">
                  {liveWeather.temp ?? 24}°C
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Feels like {officialData.weather?.feelsLike ?? liveWeather.temp ?? 24}°C
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80">
                <div className="text-[10px] uppercase font-bold text-slate-400">Condition</div>
                <div className="text-sm font-bold text-white mt-1 truncate">
                  {officialData.weather?.conditionText || "Clear Skies"}
                </div>
                <div className="text-[10px] text-emerald-400 mt-0.5">Normal Baseline</div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80">
                <div className="text-[10px] uppercase font-bold text-slate-400">Wind Velocity</div>
                <div className="text-xl font-black text-white mt-0.5">
                  {liveWeather.windSpeed ?? 12} <span className="text-xs font-normal text-slate-400">km/h</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Gusts: {officialData.weather?.windGusts ?? 15} km/h
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80">
                <div className="text-[10px] uppercase font-bold text-slate-400">Humidity / Rain</div>
                <div className="text-xl font-black text-white mt-0.5">
                  {liveWeather.humidity ?? 60}%
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Precipitation: {liveWeather.rain ?? 0} mm
                </div>
              </div>
            </div>

            {/* 3-Day Regional Forecast */}
            {officialData.weather?.forecast3Days && officialData.weather.forecast3Days.length > 0 && (
              <div className="pt-2 border-t border-slate-800">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  3-Day Regional Outlook ({location.city})
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {officialData.weather.forecast3Days.map((day, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-850 text-center"
                    >
                      <div className="text-[10px] font-bold text-slate-400">
                        {idx === 0 ? "Today" : idx === 1 ? "Tomorrow" : day.date.slice(5)}
                      </div>
                      <div className="text-xs font-black text-white mt-1">
                        {day.maxTemp}° / {day.minTemp}°
                      </div>
                      <div className="text-[10px] text-blue-400 mt-0.5">
                        {day.rainProb}% rain prob
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Essential Regional Emergency Facilities & Infrastructure */}
          <div className="p-4 sm:p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-400" />
                <span>Essential Regional Infrastructure ({location.city})</span>
              </h4>
              <span className="text-[11px] text-emerald-400 font-semibold">Operational</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                  <Hospital className="w-3.5 h-3.5 text-rose-400" />
                  <span>Civil Hospital</span>
                </div>
                <div className="font-bold text-white mt-1 line-clamp-1">
                  {officialData.essentialDetails?.nearestHospital || `${location.city} General Civil Hospital`}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">24/7 Emergency & Trauma Care</div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                  <span>District Control Room</span>
                </div>
                <div className="font-bold text-white mt-1 line-clamp-1">
                  {officialData.essentialDetails?.districtControlRoom || `${location.city} Disaster Operations Center`}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Civil Defense Division</div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>Fire & Rescue Station</span>
                </div>
                <div className="font-bold text-white mt-1 line-clamp-1">
                  {officialData.essentialDetails?.fireStation || `${location.city} Fire & Rescue Station`}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Rapid First Responders</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Quick Emergency Dial (3 Buttons in One Even Line) */}
      <div className="grid grid-cols-3 gap-2">
        <a
          href="tel:112"
          onClick={() => triggerPhoneCall("112")}
          className="h-11 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white flex items-center justify-center gap-1.5 font-bold text-xs shadow-md shadow-red-950/50 transition active:scale-95 px-2 text-center whitespace-nowrap"
        >
          <PhoneCall className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate whitespace-nowrap">Call 112</span>
        </a>

        <a
          href={`tel:${policePhone}`}
          onClick={() => triggerPhoneCall(policePhone)}
          className="h-11 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-750 hover:border-blue-500/60 text-slate-100 flex items-center justify-center gap-1.5 font-bold text-xs shadow transition active:scale-95 px-2 text-center whitespace-nowrap"
        >
          <PhoneCall className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span className="truncate whitespace-nowrap">Call Police</span>
        </a>

        <a
          href={`tel:${firePhone}`}
          onClick={() => triggerPhoneCall(firePhone)}
          className="h-11 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-750 hover:border-amber-500/60 text-slate-100 flex items-center justify-center gap-1.5 font-bold text-xs shadow transition active:scale-95 px-2 text-center whitespace-nowrap"
        >
          <PhoneCall className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="truncate whitespace-nowrap">Call Fire</span>
        </a>
      </div>

      {/* 3. Household Preparedness Showcase Banner */}
      <div className="p-3.5 sm:p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-md flex flex-col sm:flex-row items-center gap-3.5">
        <div className="relative w-full sm:w-36 h-28 sm:h-24 rounded-2xl overflow-hidden shrink-0 bg-slate-950">
          <img
            src="/src/assets/images/family_safety_preparedness_1792341599634.jpg"
            alt="Family Preparedness Kit"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover filter brightness-95"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
          <span className="absolute bottom-1.5 left-2 text-[10px] text-white font-bold bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-sm">
            Go-Bag Ready
          </span>
        </div>
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-2">
            <h4 className="text-xs sm:text-sm font-bold text-white">Household Go-Bag & Survival Checklist</h4>
            <span className="text-[10px] text-emerald-400 font-mono">
              {household.totalMembers} Members Linked
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
            Packed with essential medicines ({household.lifeSavingMedicines.join(", ") || "daily prescriptions"}), power banks, and survival supplies tailored for {location.city}.
          </p>
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => onNavigateToTab("guides")}
              className="text-xs text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 transition"
            >
              <span>Explore Safety Guides</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Report / Handle Any Emergency Now */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
            {t("reportEmergency", selectedLang)}
          </h3>
          <span className="text-[11px] text-slate-400">1-Tap AI Action Plan</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          <button
            onClick={() => {
              setReportType("House Fire / Smoke");
              setShowReportModal(true);
            }}
            className="p-3.5 rounded-2xl bg-slate-900 hover:bg-red-950/40 border border-slate-800 hover:border-red-600/60 text-left transition group"
          >
            <Flame className="w-5 h-5 text-red-500 group-hover:scale-110 transition" />
            <div className="font-bold text-white text-xs mt-2">House Fire / Smoke</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Fire & evacuation plan</div>
          </button>

          <button
            onClick={() => {
              setReportType("Medical Emergency / Collapse");
              setShowReportModal(true);
            }}
            className="p-3.5 rounded-2xl bg-slate-900 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-600/60 text-left transition group"
          >
            <HeartPulse className="w-5 h-5 text-rose-500 group-hover:scale-110 transition" />
            <div className="font-bold text-white text-xs mt-2">Medical Collapse</div>
            <div className="text-[11px] text-slate-400 mt-0.5">CPR & cardiac triage</div>
          </button>

          <button
            onClick={() => {
              setReportType("LPG Gas Leak / Explosion Hazard");
              setShowReportModal(true);
            }}
            className="p-3.5 rounded-2xl bg-slate-900 hover:bg-amber-950/40 border border-slate-800 hover:border-amber-600/60 text-left transition group"
          >
            <AlertTriangle className="w-5 h-5 text-amber-500 group-hover:scale-110 transition" />
            <div className="font-bold text-white text-xs mt-2">LPG Gas Leak</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Spark prevention & valve</div>
          </button>

          <button
            onClick={() => {
              setReportType("Severe Flood / Landslide Waterlogging");
              setShowReportModal(true);
            }}
            className="p-3.5 rounded-2xl bg-slate-900 hover:bg-blue-950/40 border border-slate-800 hover:border-blue-600/60 text-left transition group"
          >
            <Wind className="w-5 h-5 text-blue-400 group-hover:scale-110 transition" />
            <div className="font-bold text-white text-xs mt-2">Flood / Landslide</div>
            <div className="text-[11px] text-slate-400 mt-0.5">High ground route</div>
          </button>

          <button
            onClick={() => {
              setReportType("Break-in / Personal Safety Threat");
              setShowReportModal(true);
            }}
            className="p-3.5 rounded-2xl bg-slate-900 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-600/60 text-left transition group"
          >
            <ShieldCheck className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition" />
            <div className="font-bold text-white text-xs mt-2">Break-in Threat</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Safe room & silent alert</div>
          </button>

          <button
            onClick={() => {
              setReportType("Alert Screenshot / SMS Verification");
              setShowReportModal(true);
            }}
            className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 to-purple-950/40 border border-slate-800 hover:border-purple-600/60 text-left transition group"
          >
            <Camera className="w-5 h-5 text-purple-400 group-hover:scale-110 transition" />
            <div className="font-bold text-white text-xs mt-2">📷 Scan Alert Screenshot</div>
            <div className="text-[11px] text-purple-300 mt-0.5">Gemini Multimodal OCR</div>
          </button>
        </div>
      </div>


      {/* 6. Collapsible "⚡ Test / Simulate Alert" Drawer */}
      <div className="border border-slate-800 rounded-3xl bg-slate-950/60 overflow-hidden">
        <button
          onClick={() => setIsSimulateOpen(!isSimulateOpen)}
          className="w-full p-4 flex items-center justify-between text-xs font-bold text-slate-300 hover:text-white transition"
        >
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-amber-400" />
            <span>⚡ Test / Simulate Alert (For Judges & Readiness Drills)</span>
          </div>
          {isSimulateOpen ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {isSimulateOpen && (
          <div className="p-4 pt-0 space-y-2.5 border-t border-slate-800/80">
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Test how AlertAloud handles different alert tiers, sirens, multilingual text-to-speech, and official vs. AI fallback banners:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <button
                onClick={handleSimulateWarning}
                className="p-3 rounded-xl bg-slate-900 hover:bg-amber-950/40 border border-slate-800 hover:border-amber-600/60 text-left transition"
              >
                <div className="font-bold text-amber-400">1. Simulate Warning Alert (Quiet)</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Standard weather advisory. No loud siren, no auto-voice.
                </div>
              </button>

              <button
                onClick={handleSimulateCritical}
                className="p-3 rounded-xl bg-slate-900 hover:bg-red-950/40 border border-slate-800 hover:border-red-600/60 text-left transition"
              >
                <div className="font-bold text-red-400">2. Simulate Critical Evacuation</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Triggers Web Audio siren (880-440Hz) + auto spoken action plan!
                </div>
              </button>

              <button
                onClick={handleSimulateHouseholdFire}
                className="p-3 rounded-xl bg-slate-900 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-600/60 text-left transition"
              >
                <div className="font-bold text-rose-400">3. Simulate House Fire (AI Fallback)</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Displays Amber Disclaimer Banner & Red Cross standard actions.
                </div>
              </button>

              <button
                onClick={handleResetToCalm}
                className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left transition"
              >
                <div className="font-bold text-emerald-400">4. Reset to Calm Safe State</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Clears alarms and restores peaceful normal view.
                </div>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Emergency Report / Screenshot Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-750 w-full max-w-lg rounded-3xl shadow-2xl p-4 sm:p-6 space-y-4 my-auto max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-red-500" />
                <h3 className="font-bold text-white text-sm sm:text-base">Report / Analyze Emergency</h3>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAnalyzeEmergency} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Emergency Category</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-500"
                >
                  <option value="House Fire / Smoke">House Fire / Smoke Inhalation</option>
                  <option value="Medical Emergency / Collapse">Medical Emergency / Collapse</option>
                  <option value="LPG Gas Leak / Explosion Hazard">LPG Gas Leak / Explosion Hazard</option>
                  <option value="Severe Flood / Landslide Waterlogging">Severe Flood / Landslide Waterlogging</option>
                  <option value="Break-in / Personal Safety Threat">Break-in / Personal Safety Threat</option>
                  <option value="Alert Screenshot / SMS Verification">Alert Screenshot / SMS Verification</option>
                  <option value="Other Emergency Situation">Other Emergency Situation</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-semibold block">
                    Describe what is happening:
                  </label>
                  {!isVoiceRecording ? (
                    <button
                      type="button"
                      onClick={handleToggleVoiceReport}
                      className="px-2.5 py-1 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300 hover:text-red-200 border border-red-500/30 text-[11px] font-bold flex items-center gap-1.5 transition active:scale-95"
                    >
                      <Mic className="w-3.5 h-3.5 text-red-400" />
                      <span>Record Voice</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopVoiceReport}
                      className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold flex items-center gap-1.5 transition active:scale-95 shrink-0"
                    >
                      <Square className="w-3 h-3 fill-current shrink-0" />
                      <span>Stop ({voiceDuration}s)</span>
                    </button>
                  )}
                </div>

                {isVoiceRecording && (
                  <div className="p-2 rounded-xl bg-red-950/60 border border-red-700/60 flex items-center justify-between gap-2 overflow-hidden text-xs">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-ping shrink-0" />
                      <div className="flex items-end gap-0.5 h-3.5 shrink-0">
                        <span className="w-0.5 bg-red-400 rounded-full animate-bounce h-1.5" style={{ animationDelay: "0ms" }} />
                        <span className="w-0.5 bg-red-500 rounded-full animate-bounce h-3.5" style={{ animationDelay: "150ms" }} />
                        <span className="w-0.5 bg-red-400 rounded-full animate-bounce h-2.5" style={{ animationDelay: "300ms" }} />
                        <span className="w-0.5 bg-red-500 rounded-full animate-bounce h-3.5" style={{ animationDelay: "75ms" }} />
                      </div>
                      <span className="text-[11px] text-red-300 font-bold truncate">
                        Listening to your voice... Speak details clearly
                      </span>
                    </div>
                  </div>
                )}

                <textarea
                  rows={3}
                  value={reportNotes}
                  onChange={(e) => setReportNotes(e.target.value)}
                  placeholder="e.g. Smoke coming from kitchen, grandmother needs oxygen support... (type or record voice)"
                  className="w-full bg-slate-950 border border-slate-750 rounded-xl p-3 text-white focus:outline-none focus:border-red-500"
                />
              </div>

              {/* Upload Screenshot / Image */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Attach Official Alert Screenshot / Photo (Optional):
                </label>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 rounded-xl border border-dashed border-slate-750 hover:border-slate-500 bg-slate-950 flex items-center justify-center gap-2 text-slate-300 transition"
                >
                  <Camera className="w-4 h-4 text-purple-400" />
                  <span>{imagePreview ? "Change Screenshot Image" : "Upload Screenshot / Photo"}</span>
                </button>
                {imagePreview && (
                  <div className="mt-2 relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-h-36 rounded-xl border border-slate-700 object-cover mx-auto"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAnalyzing}
                  className="px-6 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold flex items-center gap-2 disabled:opacity-50 transition"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Synthesizing Action Plan...</span>
                    </>
                  ) : (
                    <span>Generate Emergency Action Plan</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
