import React, { useState } from "react";
import { EmergencyGuide } from "../../types";
import { EMERGENCY_GUIDES } from "../../data/guidesData";
import { speakEmergencyText, stopSpeaking } from "../../utils/audio";
import { t } from "../../utils/languages";
import { triggerPhoneCall } from "../../utils/communication";
import {
  CloudRain,
  Waves,
  Wind,
  Zap,
  ShieldAlert,
  Activity,
  Mountain,
  Sun,
  Flame,
  AlertTriangle,
  HeartPulse,
  PowerOff,
  Shield,
  Car,
  Search,
  Volume2,
  VolumeX,
  ArrowLeft,
  CheckCircle2,
  MapPin,
  ExternalLink,
  Sparkles,
  PhoneCall,
} from "lucide-react";

interface GuidesTabProps {
  selectedLang: string;
}

export const GuidesTab: React.FC<GuidesTabProps> = ({ selectedLang }) => {
  const [category, setCategory] = useState<"all" | "natural" | "household">("all");
  const [selectedGuide, setSelectedGuide] = useState<EmergencyGuide | null>(null);
  const [subTab, setSubTab] = useState<"before" | "during" | "after" | "checklist" | "where-to-go">("during");
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [customSearchPrompt, setCustomSearchPrompt] = useState("");
  const [isGeneratingAiGuide, setIsGeneratingAiGuide] = useState(false);

  // Icon mapping helper
  const renderIcon = (name: string, className: string = "w-5 h-5") => {
    switch (name) {
      case "CloudRain": return <CloudRain className={className} />;
      case "Waves": return <Waves className={className} />;
      case "Wind": return <Wind className={className} />;
      case "Zap": return <Zap className={className} />;
      case "ShieldAlert": return <ShieldAlert className={className} />;
      case "Activity": return <Activity className={className} />;
      case "Mountain": return <Mountain className={className} />;
      case "Sun": return <Sun className={className} />;
      case "Flame": return <Flame className={className} />;
      case "AlertTriangle": return <AlertTriangle className={className} />;
      case "HeartPulse": return <HeartPulse className={className} />;
      case "PowerOff": return <PowerOff className={className} />;
      case "Shield": return <Shield className={className} />;
      case "Car": return <Car className={className} />;
      default: return <ShieldAlert className={className} />;
    }
  };

  const filteredGuides = EMERGENCY_GUIDES.filter((g) => {
    if (category !== "all" && g.category !== category) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        g.title.toLowerCase().includes(q) ||
        g.summary.toLowerCase().includes(q) ||
        g.authority.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Read aloud current tab content
  const handleReadAloud = () => {
    if (!selectedGuide) return;
    if (isPlayingAudio) {
      stopSpeaking();
      setIsPlayingAudio(false);
      return;
    }

    let textToSpeak = "";
    if (subTab === "before") {
      textToSpeak = `Precautions before ${selectedGuide.title}: ${selectedGuide.before.join(". ")}`;
    } else if (subTab === "during") {
      textToSpeak = `Action steps during ${selectedGuide.title}: ${selectedGuide.during.join(". ")}`;
    } else if (subTab === "after") {
      textToSpeak = `Recovery steps after ${selectedGuide.title}: ${selectedGuide.after.join(". ")}`;
    } else if (subTab === "checklist") {
      textToSpeak = `Survival checklist for ${selectedGuide.title}: ${selectedGuide.checklist.join(", ")}`;
    } else if (subTab === "where-to-go") {
      textToSpeak = `Safe shelter recommendation: ${selectedGuide.whereToGo}`;
    }

    setIsPlayingAudio(true);
    speakEmergencyText(textToSpeak, selectedLang, () => {
      setIsPlayingAudio(false);
    });
  };

  // Custom Emergency Search / AI Guide Generator
  const handleGenerateCustomGuide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSearchPrompt.trim()) return;
    setIsGeneratingAiGuide(true);
    try {
      const res = await fetch("/api/gemini/analyze-emergency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emergencyText: customSearchPrompt,
          language: selectedLang,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const customGuide: EmergencyGuide = {
          id: `custom-${Date.now()}`,
          title: data.hazardName || customSearchPrompt,
          category: "household",
          icon: "ShieldAlert",
          authority: data.officialSource || "Red Cross / Universal First Aid Protocol",
          isOfficial: Boolean(data.isOfficialVerified),
          summary: data.headline || `Safety guide for ${customSearchPrompt}`,
          before: [
            "Assess scene safety before entering or approaching.",
            "Verify all occupants are accounted for.",
            "Prepare backup communication channels.",
          ],
          during: data.immediateLifeSavingSteps || ["Evacuate to safe zone.", "Call emergency help."],
          after: data.detailedActionSteps?.slice(0, 4) || ["Inspect for residual hazards.", "Seek medical care if injured."],
          checklist: data.whatToTake || ["Water", "First aid kit", "Emergency flashlight"],
          whereToGo: data.whereToGo || "Nearest designated community safe space.",
          emergencyNumber: data.responsibleAuthority?.primaryNumber || "112",
          responsibleDept: data.responsibleAuthority?.name || "Local Emergency Dispatch",
        };
        setSelectedGuide(customGuide);
        setSubTab("during");
      }
    } catch (err) {
      console.error("Custom guide error:", err);
    } finally {
      setIsGeneratingAiGuide(false);
    }
  };

  return (
    <div className="space-y-4 pb-20 animate-in fade-in duration-200">
      {/* If a guide is selected, show 5-Sub-Tab Detailed View */}
      {selectedGuide ? (
        <div className="space-y-4">
          {/* Top Return & Title Bar */}
          <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  stopSpeaking();
                  setIsPlayingAudio(false);
                  setSelectedGuide(null);
                }}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-red-500">{renderIcon(selectedGuide.icon, "w-5 h-5")}</span>
                  <h2 className="text-base sm:text-lg font-black text-white">
                    {selectedGuide.title}
                  </h2>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Standard: {selectedGuide.authority}
                </p>
              </div>
            </div>

            {/* Read Aloud button for active sub-tab */}
            <button
              onClick={handleReadAloud}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition self-start sm:self-center ${
                isPlayingAudio
                  ? "bg-amber-600 text-white animate-pulse"
                  : "bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700"
              }`}
            >
              {isPlayingAudio ? (
                <>
                  <VolumeX className="w-4 h-4" />
                  <span>{t("stopAudio", selectedLang)}</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                  <span>{t("readAloud", selectedLang)}</span>
                </>
              )}
            </button>
          </div>

          {/* 5 Horizontal Sub-Tabs (Strictly 1 at a time) */}
          <div className="flex border-b border-slate-800 bg-slate-900/60 p-1 rounded-2xl overflow-x-auto no-scrollbar">
            {(["before", "during", "after", "checklist", "where-to-go"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setSubTab(tab);
                  stopSpeaking();
                  setIsPlayingAudio(false);
                }}
                className={`flex-1 min-w-[80px] py-2.5 text-xs font-bold rounded-xl capitalize transition text-center shrink-0 ${
                  subTab === tab
                    ? "bg-slate-800 text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {tab.replace("-", " ")}
              </button>
            ))}
          </div>

          {/* Sub-Tab Content */}
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
            {subTab === "before" && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Precautionary Steps (Before Incident):
                </h3>
                {selectedGuide.before.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-slate-950 border border-slate-850 flex items-start gap-3 text-xs"
                  >
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0 text-[10px]">
                      {idx + 1}
                    </span>
                    <span className="text-slate-200 leading-relaxed font-medium">{step}</span>
                  </div>
                ))}
              </div>
            )}

            {subTab === "during" && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-red-400">
                  Critical Action Steps (During Emergency):
                </h3>
                {selectedGuide.during.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-slate-950 border border-slate-850 flex items-start gap-3 text-xs"
                  >
                    <span className="w-5 h-5 rounded-full bg-red-600 text-white font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="text-slate-100 leading-relaxed font-medium">{step}</span>
                  </div>
                ))}
              </div>
            )}

            {subTab === "after" && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Recovery & Safety Measures (After Incident):
                </h3>
                {selectedGuide.after.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-slate-950 border border-slate-850 flex items-start gap-3 text-xs"
                  >
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[10px]">
                      {idx + 1}
                    </span>
                    <span className="text-slate-200 leading-relaxed font-medium">{step}</span>
                  </div>
                ))}
              </div>
            )}

            {subTab === "checklist" && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400">
                  Specific Emergency Kit Items:
                </h3>
                {selectedGuide.checklist.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-slate-950 border border-slate-850 flex items-center gap-3 text-xs text-slate-200"
                  >
                    <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                    <span className="font-medium">{item}</span>
                  </div>
                ))}
              </div>
            )}

            {subTab === "where-to-go" && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400">
                  Safe Evacuation Ground & Shelter:
                </h3>
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-850 text-xs flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-white text-sm">{selectedGuide.whereToGo}</div>
                    <div className="text-slate-400 mt-1">
                      Always choose higher elevated ground or open terrain away from power lines and loose masonry.
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">
                      Emergency Dispatch Contact
                    </span>
                    <div className="font-bold text-white text-xs">{selectedGuide.responsibleDept}</div>
                    <div className="text-xs text-emerald-400 font-mono font-bold mt-0.5">
                      📞 {selectedGuide.emergencyNumber}
                    </div>
                  </div>
                  <a
                    href={`tel:${selectedGuide.emergencyNumber}`}
                    onClick={() => triggerPhoneCall(selectedGuide.emergencyNumber)}
                    className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow transition"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Call</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Guides Catalog View */
        <div className="space-y-4">
          {/* Header & Search */}
          <div className="p-4 sm:p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
            <div>
              <h2 className="text-lg font-black text-white">All-Emergency Safety Library</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Official Red Cross and National Civil Defense protocols for every natural and domestic hazard.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search flood, cyclone, fire, gas leak, earthquake..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
              />
            </div>

            {/* Category Filter Pills (Mobile Scrollable) */}
            <div className="flex gap-1.5 sm:gap-2 text-xs overflow-x-auto no-scrollbar pb-0.5">
              <button
                onClick={() => setCategory("all")}
                className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap shrink-0 ${
                  category === "all"
                    ? "bg-slate-800 text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                All (14 Guides)
              </button>
              <button
                onClick={() => setCategory("natural")}
                className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap shrink-0 ${
                  category === "natural"
                    ? "bg-blue-600 text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                🌪️ Natural Calamities
              </button>
              <button
                onClick={() => setCategory("household")}
                className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap shrink-0 ${
                  category === "household"
                    ? "bg-rose-600 text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                🏠 Household Emergencies
              </button>
            </div>
          </div>

          {/* Custom Emergency Search Input (Generates on-the-fly via Gemini) */}
          <div className="p-4 rounded-3xl bg-gradient-to-r from-purple-950/40 to-indigo-950/40 border border-purple-800/40 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Ask or Search Any Unlisted Emergency
            </span>
            <form onSubmit={handleGenerateCustomGuide} className="flex gap-2">
              <input
                type="text"
                value={customSearchPrompt}
                onChange={(e) => setCustomSearchPrompt(e.target.value)}
                placeholder="e.g. Snake bite, chemical fumes from factory, elevator stall..."
                className="flex-1 bg-slate-950 border border-slate-750 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
              <button
                type="submit"
                disabled={isGeneratingAiGuide || !customSearchPrompt.trim()}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shrink-0 disabled:opacity-50 transition"
              >
                {isGeneratingAiGuide ? "Generating..." : "Get AI Guide"}
              </button>
            </form>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredGuides.map((guide) => (
              <button
                key={guide.id}
                onClick={() => {
                  setSelectedGuide(guide);
                  setSubTab("during");
                }}
                className="p-4 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-left transition flex items-start gap-3.5 group"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-red-400 group-hover:scale-110 transition shrink-0">
                  {renderIcon(guide.icon)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h3 className="font-bold text-white text-xs truncate group-hover:text-red-400">
                      {guide.title}
                    </h3>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 shrink-0">
                      5 Tabs
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {guide.summary}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
