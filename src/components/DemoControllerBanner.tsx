import React from "react";
import { DemoScenario } from "../data/demoScenarios";
import { Sparkles, ShieldAlert, Home, CloudLightning, Sun, X, RefreshCw } from "lucide-react";

interface DemoControllerBannerProps {
  currentScenario: DemoScenario;
  onOpenScenarioModal: () => void;
  onExitDemo: () => void;
  onQuickSwitch: (scenarioId: "critical" | "household" | "severe" | "normal") => void;
}

export const DemoControllerBanner: React.FC<DemoControllerBannerProps> = ({
  currentScenario,
  onOpenScenarioModal,
  onExitDemo,
  onQuickSwitch,
}) => {
  return (
    <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border-b border-blue-500/30 px-3 sm:px-4 py-2 text-xs shadow-lg sticky top-0 z-50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        {/* Scenario Info */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold border border-blue-500/40 text-[10px] flex items-center gap-1 shrink-0">
            <Sparkles className="w-3 h-3 text-blue-400" />
            <span>JUDGES DEMO</span>
          </span>

          <span className="text-slate-300 truncate text-[11px] sm:text-xs">
            Active: <strong className="text-white font-semibold">{currentScenario.title}</strong> ({currentScenario.location.city})
          </span>
        </div>

        {/* Quick Scenario Switcher Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="hidden md:flex items-center gap-1 bg-slate-950/60 p-0.5 rounded-xl border border-slate-800">
            <button
              onClick={() => onQuickSwitch("critical")}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                currentScenario.id === "critical"
                  ? "bg-red-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <ShieldAlert className="w-3 h-3" />
              <span>Critical</span>
            </button>

            <button
              onClick={() => onQuickSwitch("household")}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                currentScenario.id === "household"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Home className="w-3 h-3" />
              <span>Household</span>
            </button>

            <button
              onClick={() => onQuickSwitch("severe")}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                currentScenario.id === "severe"
                  ? "bg-yellow-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <CloudLightning className="w-3 h-3" />
              <span>Severe</span>
            </button>

            <button
              onClick={() => onQuickSwitch("normal")}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                currentScenario.id === "normal"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Sun className="w-3 h-3" />
              <span>All Clear</span>
            </button>
          </div>

          <button
            onClick={onOpenScenarioModal}
            className="px-2.5 py-1 rounded-lg bg-blue-600/30 hover:bg-blue-600/40 text-blue-200 border border-blue-500/40 text-[11px] font-bold transition flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Switch Use Case</span>
          </button>

          <button
            onClick={onExitDemo}
            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-[11px] font-medium transition flex items-center gap-1"
            title="Exit Demo Mode"
          >
            <X className="w-3 h-3" />
            <span className="hidden sm:inline">Exit Demo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
