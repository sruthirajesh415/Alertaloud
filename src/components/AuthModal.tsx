import React, { useState } from "react";
import { UserLocation, Household, ActiveUserSession } from "../types";
import { findHouseholdByPhone, setActiveUserSession } from "../utils/storage";
import {
  ShieldCheck,
  Phone,
  Users,
  ArrowRight,
  HeartPulse,
  Sparkles,
  X,
  Lock,
  ShieldAlert,
  CheckCircle2,
  Shield,
} from "lucide-react";
import { AlertAloudIcon } from "./Logo";

interface AuthModalProps {
  location: UserLocation;
  selectedLang: string;
  isOpen?: boolean;
  onClose?: () => void;
  onSuccessExisting: (household: Household, session: ActiveUserSession) => void;
  onNewUser: (phone: string) => void;
  onOfficerLogin?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  location,
  onClose,
  onSuccessExisting,
  onNewUser,
  onOfficerLogin,
}) => {
  const [authMode, setAuthMode] = useState<"citizen" | "officer">("citizen");

  // Citizen state
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lookupFeedback, setLookupFeedback] = useState<string | null>(null);

  // Officer state
  const [officerBadge, setOfficerBadge] = useState("DISPATCH-01");
  const [officerPin, setOfficerPin] = useState("");
  const [officerPinError, setOfficerPinError] = useState(false);
  const [officerLoading, setOfficerLoading] = useState(false);
  const [officerFeedback, setOfficerFeedback] = useState<string | null>(null);

  // Citizen submit handler
  const handleCitizenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.trim();
    if (!cleanPhone || cleanPhone.length < 5) return;

    setIsLoading(true);
    setLookupFeedback(null);

    // Look up in household database
    setTimeout(() => {
      const match = findHouseholdByPhone(cleanPhone);
      if (match) {
        setLookupFeedback(
          `Family Linked! Found household: "${match.household.householdName}". Loaded shared profile for ${match.matchedMemberName}.`
        );
        setTimeout(() => {
          const session: ActiveUserSession = {
            phone: cleanPhone,
            householdId: match.household.id,
            memberName: match.matchedMemberName,
            loggedInAt: new Date().toISOString(),
          };
          setActiveUserSession(session);
          onSuccessExisting(match.household, session);
        }, 800);
      } else {
        // New user -> start onboarding wizard
        setIsLoading(false);
        onNewUser(cleanPhone);
      }
    }, 350);
  };

  // Officer submit handler
  const handleOfficerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (officerPin.trim() === "1234") {
      setOfficerPinError(false);
      setOfficerLoading(true);
      setOfficerFeedback("Officer Credentials Verified. Opening Control Room...");

      setTimeout(() => {
        setOfficerLoading(false);
        if (onOfficerLogin) {
          onOfficerLogin();
        }
      }, 700);
    } else {
      setOfficerPinError(true);
    }
  };

  const handleSimulateDemoFamily = () => {
    setPhone("+1 (555) 019-2834");
  };

  const handleSimulateDemoOfficer = () => {
    setOfficerBadge("RESCUE-LEAD-07");
    setOfficerPin("1234");
    setOfficerPinError(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-750 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden p-5 sm:p-7 relative my-auto max-h-[92vh] flex flex-col justify-between">
        {/* Decorative ambient gradient */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Top bar with close button */}
        {onClose && (
          <div className="flex justify-end -mt-1 -mr-1">
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Close and explore as guest"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className="overflow-y-auto pr-0.5">
          {/* Brand header */}
          <div className="text-center mb-4">
            <div className="mx-auto flex justify-center mb-2">
              <AlertAloudIcon className="w-13 h-13 sm:w-14 sm:h-14 shadow-2xl shadow-rose-950/60" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight select-none">
              <span className="text-white">Alert</span>
              <span className="text-rose-500">Aloud</span>
            </h2>
            <p className="text-[11px] sm:text-xs text-rose-400 font-semibold mt-0.5">
              One alert. Everything you need. Read aloud.
            </p>
            <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[11px] text-slate-300">
              <span>📍 Detected:</span>
              <strong className="text-white truncate max-w-[170px] sm:max-w-[220px]">
                {location.city}, {location.country}
              </strong>
            </div>
          </div>

          {/* 🔘 Separate Login Selector: Citizen vs Officer */}
          <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 mb-4 gap-1">
            <button
              type="button"
              onClick={() => {
                setAuthMode("citizen");
                setOfficerPinError(false);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                authMode === "citizen"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <span>Citizen / Family</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode("officer");
                setLookupFeedback(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                authMode === "officer"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-amber-400"
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-amber-300" />
              <span>Officer Login</span>
            </button>
          </div>

          {/* VIEW 1: Citizen Sign In Form */}
          {authMode === "citizen" && (
            <form onSubmit={handleCitizenSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1 flex items-center justify-between">
                  <span>Enter Mobile Number</span>
                  <span className="text-[10px] text-slate-400 font-normal">Shared family ID</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 234 567 8900"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-red-500 rounded-xl pl-10 pr-3 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none transition font-medium"
                    required
                  />
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Entering your number automatically links existing family emergency profiles.
                </p>
              </div>

              {lookupFeedback && (
                <div className="p-2.5 bg-emerald-950/60 border border-emerald-600/50 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                  <Users className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{lookupFeedback}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !phone.trim()}
                className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 active:scale-[0.99] text-white py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm shadow-lg shadow-red-950/60 flex items-center justify-center gap-2 transition disabled:opacity-50 min-h-[44px]"
              >
                {isLoading ? (
                  <span>Checking Household Network...</span>
                ) : (
                  <>
                    <span>Continue to Emergency Shield</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* VIEW 2: Officer Sign In Form */}
          {authMode === "officer" && (
            <form onSubmit={handleOfficerSubmit} className="space-y-3.5">
              <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-600/50 text-xs text-amber-200">
                <div className="flex items-center gap-1.5 font-bold text-amber-300 mb-0.5">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Restricted Official Command Portal</span>
                </div>
                <p className="text-[11px] text-amber-200/80 leading-relaxed">
                  For Civil Defense Officers, Emergency First-Responders, and Rescue Dispatchers.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Officer Badge / Call-Sign ID
                </label>
                <div className="relative">
                  <Shield className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={officerBadge}
                    onChange={(e) => setOfficerBadge(e.target.value)}
                    placeholder="DISPATCH-01"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl pl-10 pr-3 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none transition font-mono uppercase"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1 flex items-center justify-between">
                  <span>Enter 4-Digit Security PIN</span>
                  <span className="text-[10px] text-amber-400 font-mono">Default: 1234</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    maxLength={4}
                    value={officerPin}
                    onChange={(e) => {
                      setOfficerPin(e.target.value);
                      setOfficerPinError(false);
                    }}
                    placeholder="1234"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl pl-10 pr-3 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none transition font-mono tracking-widest text-center"
                    required
                    autoFocus
                  />
                </div>
                {officerPinError && (
                  <p className="text-xs text-red-400 mt-1">Invalid PIN. Please enter default: 1234.</p>
                )}
              </div>

              {officerFeedback && (
                <div className="p-2.5 bg-emerald-950/60 border border-emerald-600/50 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{officerFeedback}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={officerLoading || !officerPin.trim()}
                className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 active:scale-[0.99] text-white py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm shadow-lg shadow-amber-950/60 flex items-center justify-center gap-2 transition disabled:opacity-50 min-h-[44px]"
              >
                {officerLoading ? (
                  <span>Verifying Credentials...</span>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Unlock Officer Control Room</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Quick guest action & sample autofill */}
          <div className="mt-3.5 pt-3 border-t border-slate-800 flex flex-col gap-2 text-center">
            {authMode === "citizen" ? (
              <>
                <button
                  type="button"
                  onClick={handleSimulateDemoFamily}
                  className="text-[11px] text-slate-400 hover:text-slate-300 underline underline-offset-2 flex items-center justify-center gap-1 mx-auto py-0.5"
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Quick sample citizen phone number
                </button>

                <button
                  type="button"
                  onClick={() => setAuthMode("officer")}
                  className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold flex items-center justify-center gap-1 mx-auto py-0.5"
                >
                  <Lock className="w-3 h-3" />
                  Emergency First-Responder or Officer? Click here →
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleSimulateDemoOfficer}
                className="text-[11px] text-slate-400 hover:text-slate-300 underline underline-offset-2 flex items-center justify-center gap-1 mx-auto py-0.5"
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                Fill Demo Officer Credentials (PIN: 1234)
              </button>
            )}

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition mt-1"
              >
                Skip for now — Explore as Guest
              </button>
            )}
          </div>

          {/* Feature highlights */}
          <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] text-slate-400">
            <div className="p-2 rounded-xl bg-slate-800/40 border border-slate-750">
              <div className="font-semibold text-slate-200 flex items-center gap-1 mb-0.5">
                <Users className="w-3 h-3 text-blue-400" />
                Family Coordination
              </div>
              One number coordinates the whole household.
            </div>
            <div className="p-2 rounded-xl bg-slate-800/40 border border-slate-750">
              <div className="font-semibold text-slate-200 flex items-center gap-1 mb-0.5">
                <HeartPulse className="w-3 h-3 text-rose-400" />
                Medical Priority
              </div>
              Bedridden and vital medicines prioritize rescue.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
