import React, { useState, useEffect } from "react";
import { RescueCard, SOSDispatch } from "../types";
import {
  ShieldAlert,
  Users,
  HeartPulse,
  Radio,
  MapPin,
  ExternalLink,
  CheckCircle,
  Truck,
  Volume2,
  RefreshCw,
  Search,
  Filter,
} from "lucide-react";
import { triggerPhoneCall } from "../utils/communication";
import { AlertAloudIcon } from "./Logo";

interface ControlRoomProps {
  onBackToCitizen: () => void;
}

export const ControlRoom: React.FC<ControlRoomProps> = ({ onBackToCitizen }) => {
  const [activeTab, setActiveTab] = useState<"rescue-cards" | "live-sos">("rescue-cards");
  const [rescueCards, setRescueCards] = useState<RescueCard[]>([]);
  const [sosDispatches, setSosDispatches] = useState<SOSDispatch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dispatchFilter, setDispatchFilter] = useState<"all" | "pending" | "dispatched">("all");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [resCards, resSos] = await Promise.all([
        fetch("/api/rescue-cards"),
        fetch("/api/sos"),
      ]);
      if (resCards.ok) {
        const cardsData = await resCards.json();
        setRescueCards(cardsData);
      }
      if (resSos.ok) {
        const sosData = await resSos.json();
        setSosDispatches(sosData);
      }
    } catch (err) {
      console.error("Control room data fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleDispatch = async (cardId: string) => {
    try {
      const res = await fetch(`/api/rescue-cards/${cardId}/dispatch`, {
        method: "POST",
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error("Dispatch toggle failed:", err);
    }
  };

  // Filter cards
  const filteredCards = rescueCards.filter((c) => {
    const matchesSearch =
      c.householdName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery);

    if (dispatchFilter === "pending") return matchesSearch && !c.dispatched;
    if (dispatchFilter === "dispatched") return matchesSearch && c.dispatched;
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 pb-24">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Control Banner */}
        <div className="p-4 sm:p-6 rounded-3xl bg-slate-900 border border-amber-600/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertAloudIcon className="w-11 h-11 sm:w-12 sm:h-12 shadow-lg shadow-rose-950/50" />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-2xl font-black tracking-tight">
                  <span className="text-white">Alert</span>
                  <span className="text-rose-500">Aloud</span>
                  <span className="text-white font-medium ml-2 text-sm sm:text-base">Control Room</span>
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                  SECURE PORTAL
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Multi-Hazard Response Dashboard · Triage Prioritization by Bedridden & Medical Device Dependency
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              disabled={isLoading}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white transition"
              title="Refresh Live Feeds"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={onBackToCitizen}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-xs font-bold text-slate-200 transition"
            >
              ← Back to Citizen App
            </button>
          </div>
        </div>

        {/* Dashboard Tabs & Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="text-[11px] text-slate-400 font-semibold">Total Registered Households</div>
            <div className="text-2xl font-black text-white mt-1">{rescueCards.length}</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-red-900/40">
            <div className="text-[11px] text-red-400 font-semibold">High Vulnerability (Score ≥ 15)</div>
            <div className="text-2xl font-black text-red-400 mt-1">
              {rescueCards.filter((c) => c.vulnerabilityScore >= 15).length}
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-amber-900/40">
            <div className="text-[11px] text-amber-400 font-semibold">Rescue Teams Dispatched</div>
            <div className="text-2xl font-black text-amber-400 mt-1">
              {rescueCards.filter((c) => c.dispatched).length}
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-emerald-900/40">
            <div className="text-[11px] text-emerald-400 font-semibold">Incoming Audio SOS Alerts</div>
            <div className="text-2xl font-black text-emerald-400 mt-1">{sosDispatches.length}</div>
          </div>
        </div>

        {/* Horizontal Navigation Sub-Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 p-1 rounded-2xl gap-1">
          <button
            onClick={() => setActiveTab("rescue-cards")}
            className={`flex-1 py-2.5 sm:py-3 px-2 text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-1.5 sm:gap-2 transition truncate ${
              activeTab === "rescue-cards"
                ? "bg-slate-800 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Users className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="truncate">
              <span className="sm:hidden">Rescue Cards ({filteredCards.length})</span>
              <span className="hidden sm:inline">Prioritized Rescue Cards ({filteredCards.length})</span>
            </span>
          </button>
          <button
            onClick={() => setActiveTab("live-sos")}
            className={`flex-1 py-2.5 sm:py-3 px-2 text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-1.5 sm:gap-2 transition truncate ${
              activeTab === "live-sos"
                ? "bg-slate-800 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse shrink-0" />
            <span className="truncate">
              <span className="sm:hidden">Live SOS ({sosDispatches.length})</span>
              <span className="hidden sm:inline">Live SOS &amp; Audio ({sosDispatches.length})</span>
            </span>
          </button>
        </div>

        {/* Tab 1: Prioritized Family Rescue Cards */}
        {activeTab === "rescue-cards" && (
          <div className="space-y-4">
            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by household name, city, or phone..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="flex gap-1.5 bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
                {(["all", "pending", "dispatched"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setDispatchFilter(mode)}
                    className={`px-3 py-1 rounded-lg capitalize font-medium transition ${
                      dispatchFilter === mode
                        ? "bg-slate-800 text-white font-bold"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Cards List */}
            <div className="space-y-3">
              {filteredCards.map((card) => (
                <div
                  key={card.id}
                  className={`p-4 rounded-2xl border transition ${
                    card.dispatched
                      ? "bg-slate-900/60 border-emerald-700/50"
                      : card.vulnerabilityScore >= 15
                      ? "bg-slate-900 border-red-700/60 shadow-lg shadow-red-950/20"
                      : "bg-slate-900 border-slate-800"
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base font-bold text-white">{card.householdName}</span>
                        <span className="px-2 py-0.5 rounded-full bg-red-950 text-red-400 text-[10px] font-mono font-bold border border-red-800">
                          Vulnerability Score: {card.vulnerabilityScore}
                        </span>
                        {card.dispatched && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 text-[10px] font-bold border border-emerald-800 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Rescue Dispatched {card.dispatchedAt ? `(${new Date(card.dispatchedAt).toLocaleTimeString()})` : ""}
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-300 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                        <span>{card.address}</span>
                        {card.lat && card.lon && (
                          <a
                            href={`https://maps.google.com/?q=${card.lat},${card.lon}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:underline flex items-center gap-0.5 ml-1"
                          >
                            <span>Maps</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>

                      {/* Members Breakdown */}
                      <div className="flex flex-wrap gap-2 text-[11px] pt-1">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                          Total Members: {card.totalMembers}
                        </span>
                        {card.bedriddenCount > 0 && (
                          <span className="px-2 py-0.5 rounded bg-red-950 text-red-300 font-bold border border-red-800">
                            🚨 {card.bedriddenCount} Bedridden / Immobile
                          </span>
                        )}
                        {card.eldersCount > 0 && (
                          <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 font-medium border border-amber-800">
                            👴 {card.eldersCount} Elders (60+)
                          </span>
                        )}
                        {card.childrenCount > 0 && (
                          <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 font-medium border border-blue-800">
                            👶 {card.childrenCount} Children/Infants
                          </span>
                        )}
                      </div>

                      {/* Power Dependent & Medical Conditions */}
                      {card.powerDependentDevices && card.powerDependentDevices.length > 0 && !card.powerDependentDevices.includes("None") && (
                        <div className="text-xs text-amber-300 bg-amber-950/40 p-2 rounded-lg border border-amber-800/40 font-medium">
                          ⚡ <strong>Power-Dependent Medical Equipment:</strong> {card.powerDependentDevices.join(", ")}
                        </div>
                      )}

                      {card.lifeSavingMedicines && card.lifeSavingMedicines.length > 0 && (
                        <div className="text-[11px] text-slate-300">
                          💊 <strong>Life-Saving Medicines:</strong> {card.lifeSavingMedicines.join(", ")}
                        </div>
                      )}
                    </div>

                    {/* Dispatch Action */}
                    <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0 self-start md:self-center">
                      <button
                        onClick={() => handleToggleDispatch(card.id)}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                          card.dispatched
                            ? "bg-slate-800 hover:bg-slate-700 text-slate-300"
                            : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/60"
                        }`}
                      >
                        <Truck className="w-4 h-4" />
                        <span>{card.dispatched ? "Recall / Dispatched" : "🛟 Dispatch Rescue Team"}</span>
                      </button>
                      <a
                        href={`tel:${card.phone}`}
                        onClick={() => triggerPhoneCall(card.phone)}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-750 text-slate-300 text-center border border-slate-700"
                      >
                        Call: {card.phone}
                      </a>
                    </div>
                  </div>
                </div>
              ))}

              {filteredCards.length === 0 && (
                <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-3xl text-slate-400 text-xs">
                  No rescue cards found matching the criteria.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Live Incoming SOS & Audio Feed */}
        {activeTab === "live-sos" && (
          <div className="space-y-3">
            {sosDispatches.map((sos) => (
              <div
                key={sos.id}
                className="p-4 rounded-2xl bg-slate-900 border border-red-700/60 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-base">{sos.householdName}</span>
                      <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold">
                        {sos.emergencyType}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      📍 {sos.city}, {sos.state} · Received {new Date(sos.timestamp).toLocaleTimeString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`https://maps.google.com/?q=${sos.lat},${sos.lon}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1 transition"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Open Live GPS Pin</span>
                    </a>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
                  <strong>Vulnerability & Situation:</strong> {sos.vulnerabilitySummary}
                </div>

                {/* Embedded HTML5 Audio Player */}
                {sos.audioBase64 ? (
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-600/20 text-red-400 flex items-center justify-center shrink-0">
                      <Volume2 className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="text-[11px] font-semibold text-slate-300 mb-1">
                        Citizen Recorded Voice SOS (30s max)
                      </div>
                      <audio
                        controls
                        src={
                          sos.audioBase64.startsWith("data:")
                            ? sos.audioBase64
                            : sos.audioBase64.startsWith("UklGR")
                            ? `data:audio/wav;base64,${sos.audioBase64}`
                            : `data:audio/webm;base64,${sos.audioBase64}`
                        }
                        className="w-full h-8"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-500 italic">
                    Text-only SOS broadcast transmitted (No voice recorded).
                  </div>
                )}
              </div>
            ))}

            {sosDispatches.length === 0 && (
              <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-3xl text-slate-400 text-xs">
                No active SOS broadcasts currently received. The channel is calm.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
