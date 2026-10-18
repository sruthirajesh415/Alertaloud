import React from "react";
import { DEMO_SCENARIOS, DemoScenario } from "../data/demoScenarios";
import {
  Sparkles,
  X,
  ShieldAlert,
  Home,
  CloudLightning,
  Sun,
  CheckCircle2,
  ArrowRight,
  MapPin,
  HeartPulse,
  Radio,
  Volume2,
} from "lucide-react";

interface JudgesDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectScenario: (scenario: DemoScenario) => void;
}

export const JudgesDemoModal: React.FC<JudgesDemoModalProps> = ({
  isOpen,
  onClose,
  onSelectScenario,
}) => {
  if (!isOpen) return null;

  const getScenarioIcon = (id: string) => {
    switch (id) {
      case "critical":
        return <ShieldAlert className="w-5 h-5 text-red-400" />;
      case "household":
        return <Home className="w-5 h-5 text-amber-400" />;
      case "severe":
        return <CloudLightning className="w-5 h-5 text-yellow-400" />;
      case "normal":
        return <Sun className="w-5 h-5 text-emerald-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-blue-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-750 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-600 to-rose-600 flex items-center justify-center shadow-lg shadow-red-950/50">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">
                  Judges & Evaluator Interactive Demo Suite
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold">
                  Demo Mode
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Explore pre-filled situations to evaluate AlertAloud’s real-time capabilities without manual setup.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scenarios Grid */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Select an Emergency Use Case to Test:
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DEMO_SCENARIOS.map((scenario) => {
              const isCrit = scenario.id === "critical";
              const isHh = scenario.id === "household";
              const isNorm = scenario.id === "normal";

              return (
                <div
                  key={scenario.id}
                  className={`rounded-2xl border p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 hover:border-slate-500 bg-slate-950/60 ${
                    isCrit
                      ? "border-red-500/40 hover:bg-red-950/10"
                      : isHh
                      ? "border-amber-500/40 hover:bg-amber-950/10"
                      : isNorm
                      ? "border-emerald-500/40 hover:bg-emerald-950/10"
                      : "border-slate-800 hover:bg-slate-900/50"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                          {getScenarioIcon(scenario.id)}
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-white leading-tight">
                            {scenario.title}
                          </h3>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                            <MapPin className="w-3 h-3 text-red-400 shrink-0" />
                            <span>{scenario.location.city}, {scenario.location.state}</span>
                          </div>
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${scenario.badgeColor}`}
                      >
                        {scenario.badge}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {scenario.description}
                    </p>

                    <div className="space-y-1.5 pt-2 border-t border-slate-850">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Key Features Evaluated:
                      </div>
                      {scenario.keyFeatures.slice(0, 3).map((feat, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-1.5 text-[11px] text-slate-300"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectScenario(scenario)}
                    className={`mt-4 w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 shadow-md ${
                      isCrit
                        ? "bg-red-600 hover:bg-red-500 text-white shadow-red-950/50"
                        : isHh
                        ? "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-950/50"
                        : isNorm
                        ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/50"
                        : "bg-slate-800 hover:bg-slate-750 text-white"
                    }`}
                  >
                    <span>Launch {scenario.title}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer info for judges */}
        <div className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Switch scenarios anytime inside using the top Demo Banner.</span>
          </span>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition font-medium underline underline-offset-2"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
