import React, { useState } from "react";
import { UserLocation, Household, AlertData } from "../../types";
import { speakEmergencyText, stopSpeaking } from "../../utils/audio";
import { t } from "../../utils/languages";
import { triggerPhoneCall } from "../../utils/communication";
import { getCalamityImage, getOneLineDescription, getDefaultRainfallAlert } from "../../utils/calamity";
import {
  Volume2,
  VolumeX,
  ShieldCheck,
  AlertTriangle,
  CheckSquare,
  Square,
  MapPin,
  ExternalLink,
  PhoneCall,
  Send,
  CheckCircle2,
  ShieldAlert,
  Info,
} from "lucide-react";

interface AlertsTabProps {
  location: UserLocation;
  household: Household;
  activeAlert: AlertData | null;
  selectedLang: string;
  onOpenLocationModal?: () => void;
}

export const AlertsTab: React.FC<AlertsTabProps> = ({
  location,
  household,
  activeAlert,
  selectedLang,
  onOpenLocationModal,
}) => {
  const [subTab, setSubTab] = useState<"overview" | "what-to-do" | "what-to-take" | "where-to-go" | "whom-to-call">("overview");
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [tickedItems, setTickedItems] = useState<Record<string, boolean>>({});
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  // Alert is null when conditions are calm and clear
  const alert = activeAlert;

  const toggleCheck = (item: string) => {
    setTickedItems((prev) => ({ ...prev, [item]: !prev[item] }));
  };

  // Read aloud current tab content
  const handleReadAloud = () => {
    if (!alert) return;
    if (isPlayingAudio) {
      stopSpeaking();
      setIsPlayingAudio(false);
      return;
    }

    let speechText = "";
    if (subTab === "overview") {
      speechText = `${alert.hazardName}. Alert level: ${alert.tier}. ${alert.headline}. Time window: ${alert.timeWindow}. Source: ${alert.officialSource}.`;
    } else if (subTab === "what-to-do") {
      speechText = `Immediate actions for ${household.householdName}: ${alert.immediateLifeSavingSteps.join(". ")}. Detailed steps: ${alert.detailedActionSteps.join(". ")}`;
    } else if (subTab === "what-to-take") {
      speechText = `Emergency checklist to pack: ${alert.whatToTake.join(", ")}`;
    } else if (subTab === "where-to-go") {
      speechText = `Recommended safe shelter location: ${alert.whereToGo}`;
    } else if (subTab === "whom-to-call") {
      speechText = `Responsible authority: ${alert.responsibleAuthority.name}. Emergency number: ${alert.responsibleAuthority.primaryNumber}`;
    }

    setIsPlayingAudio(true);
    speakEmergencyText(speechText, selectedLang, () => {
      setIsPlayingAudio(false);
    });
  };

  // Transmit Rescue Card to Authorities
  const handleShareRescueCard = async () => {
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
          activeAlert: alert ? alert.hazardName : "Household Safety Profile (All Clear)",
        }),
      });
      setShareSuccess(true);
      setTimeout(() => setShowShareModal(false), 1500);
    } catch (err) {
      console.error("Rescue card share error:", err);
    }
  };

  return (
    <div className="space-y-4 pb-20 animate-in fade-in duration-200">
      {/* 0. Location Notice & Switcher */}
      {onOpenLocationModal && (
        <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-2 truncate">
            <MapPin className="w-4 h-4 text-red-500 shrink-0" />
            <span className="truncate">
              Alerts for: <strong className="text-white">{location.displayName || location.city}</strong>
            </span>
          </div>
          <button
            onClick={onOpenLocationModal}
            className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-semibold text-xs border border-slate-700 hover:border-red-500/50 transition shrink-0 ml-2"
          >
            Change Location
          </button>
        </div>
      )}

      {/* 1. If NO active alert exists: Official All-Clear State */}
      {!alert ? (
        <div className="rounded-3xl border border-emerald-500/40 bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 p-6 sm:p-8 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
            <ShieldCheck className="w-9 h-9 text-emerald-400" />
          </div>
          <div className="space-y-1">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-black uppercase tracking-wider">
              Official Status: All Clear
            </span>
            <h2 className="text-xl font-black text-white mt-2">
              No Active Disaster Action Plans for {location.city}
            </h2>
            <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
              State and regional disaster management authorities currently have no active emergency directives, flood evacuation routes, or severe weather alarms issued for {location.displayName || location.city}.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            {onOpenLocationModal && (
              <button
                onClick={onOpenLocationModal}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 border border-slate-700"
              >
                <MapPin className="w-3.5 h-3.5 text-red-400" />
                <span>Search Another Location</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* 1. Header Banner with Realistic Calamity Visual & One-Line Short Description */}
          <div className="rounded-3xl border border-slate-800 shadow-xl overflow-hidden bg-slate-900">
            <div className="relative h-36 sm:h-44 w-full overflow-hidden bg-slate-950">
              <img
                src={getCalamityImage(alert.hazardName, alert.tier)}
                alt={alert.hazardName}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center filter brightness-90 contrast-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

          {/* Floating Badges */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow ${
                alert.tier === "CRITICAL"
                  ? "bg-red-600 text-white animate-pulse"
                  : alert.tier === "WARNING"
                  ? "bg-amber-500 text-slate-950 font-bold"
                  : "bg-emerald-950 text-emerald-400 border border-emerald-800"
              }`}
            >
              {alert.tier}
            </span>
            <span className="text-[11px] text-slate-200 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full font-semibold border border-white/10">
              {alert.timeWindow}
            </span>
          </div>

          {/* Calamity Name and One-line Short Description */}
          <div className="absolute bottom-3 left-3 right-3 space-y-0.5">
            <h2 className="text-lg sm:text-xl font-black text-white drop-shadow-md">{alert.hazardName}</h2>
            <p className="text-xs sm:text-sm text-slate-200 font-medium line-clamp-1 drop-shadow">
              {getOneLineDescription(alert.headline, alert.hazardName)}
            </p>
          </div>
        </div>

        {/* Action Buttons: Read Aloud + Share Rescue Card */}
        <div className="p-3 sm:p-4 flex items-center justify-between gap-2 border-t border-slate-800">
          <div className="text-[11px] text-slate-400 font-semibold truncate">
            Source: {alert.officialSource}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleReadAloud}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
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

            <button
              onClick={() => setShowShareModal(true)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow transition"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Share Rescue Card</span>
              <span className="sm:hidden">Share Card</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Five Horizontal Sub-Tabs (Strictly 1 at a time) */}
      <div className="flex border-b border-slate-800 bg-slate-900/60 p-1 rounded-2xl overflow-x-auto no-scrollbar">
        {[
          { id: "overview", label: t("subOverview", selectedLang) },
          { id: "what-to-do", label: t("subWhatToDo", selectedLang) },
          { id: "what-to-take", label: t("subWhatToTake", selectedLang) },
          { id: "where-to-go", label: t("subWhereToGo", selectedLang) },
          { id: "whom-to-call", label: t("subWhomToCall", selectedLang) },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setSubTab(tab.id as any);
              stopSpeaking();
              setIsPlayingAudio(false);
            }}
            className={`flex-1 min-w-[90px] py-2.5 text-xs font-bold rounded-xl transition text-center shrink-0 ${
              subTab === tab.id
                ? "bg-slate-800 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3. Sub-Tab 1: Overview */}
      {subTab === "overview" && (
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Plain-Language Incident Summary:
            </div>
            <p className="text-sm text-slate-100 font-medium leading-relaxed bg-slate-950 p-4 rounded-2xl border border-slate-850">
              {alert.headline}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Issuing Authority:</span>
              <div className="font-bold text-white text-sm mt-0.5">{alert.officialSource}</div>
              <div className="text-emerald-400 text-[11px] mt-1 flex items-center gap-1 font-mono">
                {alert.isOfficialVerified ? "✓ Verified Civil Defense Feed" : "ℹ️ Universal Standard (Red Cross)"}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Emergency Horizon:</span>
              <div className="font-bold text-amber-400 text-sm mt-0.5">{alert.timeWindow}</div>
              <div className="text-slate-400 text-[11px] mt-1">Status: Active Incident Pipeline</div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Sub-Tab 2: What To Do (with Official vs AI Fallback Banner) */}
      {subTab === "what-to-do" && (
        <div className="space-y-4">
          {/* Verification Badge OR Disclaimer Banner */}
          {alert.isOfficialVerified ? (
            <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-600/50 flex items-center gap-2.5 text-xs text-emerald-300">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <strong className="block text-emerald-200">
                  🏛️ {t("verifiedOfficial", selectedLang)}
                </strong>
                <span>Source: {alert.officialSource}</span>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-amber-950/60 border border-amber-600/60 flex items-start gap-2.5 text-xs text-amber-300">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-amber-200">
                  ⚠️ Transparent AI Practical Guidance Note
                </strong>
                <span className="text-[11px] leading-relaxed block mt-0.5 text-amber-300/90">
                  {alert.practicalDisclaimer ||
                    "Official government guidelines for this specific situation are not listed. Showing AI-generated practical steps based on universal Red Cross and First-Responder standards. Always obey on-scene emergency operators first."}
                </span>
              </div>
            </div>
          )}

          {/* Household Context Notice */}
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
            Personalized for <strong>{household.householdName}</strong> ({household.totalMembers} members
            {household.eldersCount > 0 ? `, ${household.eldersCount} elder(s)` : ""}
            {household.bedriddenCount > 0 ? `, ${household.bedriddenCount} bedridden member` : ""}).
          </div>

          {/* Immediate Steps */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-red-400">
              High Priority Life-Saving Sequence:
            </h4>
            {alert.immediateLifeSavingSteps.map((step, idx) => (
              <div
                key={idx}
                className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-start gap-3 text-xs"
              >
                <div className="w-6 h-6 rounded-full bg-red-600 text-white font-bold flex items-center justify-center shrink-0 text-[11px] mt-0.5">
                  {idx + 1}
                </div>
                <div className="text-slate-100 font-medium leading-relaxed">{step}</div>
              </div>
            ))}
          </div>

          {/* Detailed Sequential Steps */}
          {alert.detailedActionSteps && alert.detailedActionSteps.length > 0 && (
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Secondary Protective Measures:
              </h4>
              {alert.detailedActionSteps.map((step, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-850 flex items-start gap-2.5 text-xs text-slate-300"
                >
                  <span className="text-slate-500 font-mono text-[11px] mt-0.5">•</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. Sub-Tab 3: What To Take (Interactive Tickable Checklist) */}
      {subTab === "what-to-take" && (
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-sm">Emergency Evacuation Go-Bag</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Tick each item as you pack it into your grab-and-go bag.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400">
              {Object.values(tickedItems).filter(Boolean).length} / {alert.whatToTake.length} Packed
            </span>
          </div>

          <div className="space-y-2 pt-1">
            {alert.whatToTake.map((item, idx) => {
              const isChecked = Boolean(tickedItems[item]);
              return (
                <button
                  key={idx}
                  onClick={() => toggleCheck(item)}
                  className={`w-full p-3 rounded-2xl border text-left flex items-center gap-3 transition ${
                    isChecked
                      ? "bg-emerald-950/40 border-emerald-700/60 text-emerald-200"
                      : "bg-slate-950 border-slate-800 text-slate-200 hover:border-slate-700"
                  }`}
                >
                  {isChecked ? (
                    <CheckSquare className="w-5 h-5 text-emerald-400 shrink-0" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-500 shrink-0" />
                  )}
                  <span className={`text-xs font-medium ${isChecked ? "line-through opacity-80" : ""}`}>
                    {item}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. Sub-Tab 4: Where To Go (Safe Shelter with Google Maps) */}
      {subTab === "where-to-go" && (
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Designated Safety Shelter & Assembly Point:
            </div>
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-850 flex items-start gap-3">
              <MapPin className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-bold text-white leading-relaxed">{alert.whereToGo}</div>
                <div className="text-xs text-slate-400 mt-1">
                  Engineered concrete structure with emergency generator and first-aid center.
                </div>
              </div>
            </div>
          </div>

          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(alert.whereToGo)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition"
          >
            <span>Open Navigation Route in Google Maps</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      )}

      {/* 7. Sub-Tab 5: Whom To Call (Smartly Routed Helplines) */}
      {subTab === "whom-to-call" && (
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Smartly Routed Emergency Dispatch:
          </div>

          {/* Primary routed authority */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-red-600/60 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold text-red-400 uppercase">
                Responsible First-Responder
              </div>
              <div className="font-bold text-white text-base">
                {alert.responsibleAuthority.name}
              </div>
              <div className="text-xs text-emerald-400 font-mono font-bold mt-0.5">
                📞 {alert.responsibleAuthority.primaryNumber}
              </div>
            </div>
            <a
              href={`tel:${alert.responsibleAuthority.primaryNumber}`}
              onClick={() => triggerPhoneCall(alert.responsibleAuthority.primaryNumber)}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-full flex items-center gap-1.5 transition whitespace-nowrap shrink-0 shadow-md shadow-red-950/50"
            >
              <PhoneCall className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">Call Now</span>
            </a>
          </div>

          {/* National all-emergency */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-850 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">National All-Crisis</div>
              <div className="font-semibold text-white text-xs">Standard Emergency Operator</div>
              <div className="text-xs text-slate-300 font-mono">📞 112 / 911</div>
            </div>
            <a
              href="tel:112"
              onClick={() => triggerPhoneCall("112")}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-white text-xs font-bold rounded-full flex items-center gap-1.5 transition whitespace-nowrap shrink-0"
            >
              <PhoneCall className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">Call 112</span>
            </a>
          </div>
        </div>
      )}
        </>
      )}

      {/* Share Family Rescue Card Confirmation Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-750 w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-600/20 text-red-400 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-white">Share Family Rescue Card?</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                This securely transmits {household.householdName}'s vulnerability profile (including bedridden count, power-dependent devices, and life-saving medicines) directly to the Officials' Control Room to prioritize rescue operations.
              </p>
            </div>

            {shareSuccess ? (
              <div className="p-3 rounded-xl bg-emerald-950 border border-emerald-600 text-xs text-emerald-300 flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Transmitted successfully to Local Control Room!</span>
              </div>
            ) : (
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowShareModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleShareRescueCard}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Transmit Rescue Card</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
