import React, { useState } from "react";
import { UserLocation, Household, FamilyMember, Neighbour, ActiveUserSession } from "../../types";
import { saveHousehold } from "../../utils/storage";
import {
  Users,
  HeartPulse,
  PhoneCall,
  MapPin,
  LogOut,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  Building,
  Shield,
  Zap,
  LogIn,
  Lock,
} from "lucide-react";
import { triggerPhoneCall } from "../../utils/communication";

interface ProfileTabProps {
  location: UserLocation;
  household: Household;
  setHousehold: (h: Household) => void;
  activeSession: ActiveUserSession | null;
  onOpenLocationModal: () => void;
  onOpenAuthModal?: () => void;
  onSignOut: () => void;
  onOpenOfficialsRoom?: () => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
  location,
  household,
  setHousehold,
  activeSession,
  onOpenLocationModal,
  onOpenAuthModal,
  onSignOut,
  onOpenOfficialsRoom,
}) => {
  const [subTab, setSubTab] = useState<"family" | "neighbours" | "services">("family");
  const [isSavedNotice, setIsSavedNotice] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);

  // Editable fields
  const [householdName, setHouseholdName] = useState(household.householdName);
  const [address, setAddress] = useState(household.address);
  const [buildingType, setBuildingType] = useState(household.buildingType);
  const [totalMembers, setTotalMembers] = useState(household.totalMembers);
  const [eldersCount, setEldersCount] = useState(household.eldersCount);
  const [childrenCount, setChildrenCount] = useState(household.childrenCount);
  const [bedriddenCount, setBedriddenCount] = useState(household.bedriddenCount);
  const [medicalConditions, setMedicalConditions] = useState(household.medicalConditions.join(", "));
  const [medicines, setMedicines] = useState(household.lifeSavingMedicines.join(", "));
  const [powerDevices, setPowerDevices] = useState(household.powerDependentDevices.join(", "));
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>(household.familyMembers || []);
  const [neighbours, setNeighbours] = useState<Neighbour[]>(household.neighbours || []);

  const handleSaveAll = () => {
    const updated: Household = {
      ...household,
      householdName,
      address,
      buildingType,
      totalMembers: Number(totalMembers) || 1,
      eldersCount: Number(eldersCount) || 0,
      childrenCount: Number(childrenCount) || 0,
      bedriddenCount: Number(bedriddenCount) || 0,
      medicalConditions: medicalConditions.split(",").map((s) => s.trim()).filter(Boolean),
      lifeSavingMedicines: medicines.split(",").map((s) => s.trim()).filter(Boolean),
      powerDependentDevices: powerDevices.split(",").map((s) => s.trim()).filter(Boolean),
      familyMembers,
      neighbours,
      updatedAt: new Date().toISOString(),
    };

    saveHousehold(updated);
    setHousehold(updated);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 2500);
  };

  // Family Members
  const addFamilyMember = () => {
    setFamilyMembers([
      ...familyMembers,
      { id: `fm-${Date.now()}`, name: "", relationship: "Family", phone: "" },
    ]);
  };
  const removeFamilyMember = (id: string) => {
    setFamilyMembers(familyMembers.filter((m) => m.id !== id));
  };
  const updateFamilyMember = (id: string, field: keyof FamilyMember, val: string) => {
    setFamilyMembers(
      familyMembers.map((m) => (m.id === id ? { ...m, [field]: val } : m))
    );
  };

  // Neighbours
  const addNeighbour = () => {
    setNeighbours([
      ...neighbours,
      { id: `nb-${Date.now()}`, name: "", phone: "", houseDetails: "" },
    ]);
  };
  const removeNeighbour = (id: string) => {
    setNeighbours(neighbours.filter((n) => n.id !== id));
  };
  const updateNeighbour = (id: string, field: keyof Neighbour, val: string) => {
    setNeighbours(
      neighbours.map((n) => (n.id === id ? { ...n, [field]: val } : n))
    );
  };

  return (
    <div className="space-y-4 pb-20 animate-in fade-in duration-200">
      {/* Top Profile Summary Bar */}
      <div className="p-4 sm:p-5 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base sm:text-lg font-black text-white">{household.householdName}</h2>
            <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-400 font-mono text-[10px] border border-blue-800">
              {activeSession ? "Linked Account" : "Guest Profile"}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-slate-400">
            <span>Phone: <strong className="text-slate-200">{household.primaryPhone}</strong></span>
            <span>·</span>
            <button
              onClick={onOpenLocationModal}
              className="inline-flex items-center gap-1 text-red-400 hover:text-red-300 font-semibold bg-red-950/40 hover:bg-red-950/60 px-2 py-0.5 rounded-lg border border-red-500/30 transition active:scale-95"
              title="Click to change location or auto-detect"
            >
              <MapPin className="w-3 h-3 text-red-400 shrink-0" />
              <span>{household.location.city || location.city} (Edit)</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          {isSavedNotice && (
            <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              Saved!
            </span>
          )}
          <button
            onClick={handleSaveAll}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow"
          >
            <Save className="w-4 h-4" />
            <span>Save Profile</span>
          </button>
        </div>
      </div>

      {/* 3 Horizontal Sub-Tabs (Clean on Mobile) */}
      <div className="flex border-b border-slate-800 bg-slate-900/60 p-1 rounded-2xl gap-1">
        <button
          onClick={() => setSubTab("family")}
          className={`flex-1 py-2 sm:py-2.5 px-1 text-xs font-bold rounded-xl transition text-center truncate ${
            subTab === "family" ? "bg-slate-800 text-white shadow" : "text-slate-400 hover:text-white"
          }`}
        >
          <span>👨‍👩‍👧 Family</span>
          <span className="hidden sm:inline"> & Medical</span>
        </button>
        <button
          onClick={() => setSubTab("neighbours")}
          className={`flex-1 py-2 sm:py-2.5 px-1 text-xs font-bold rounded-xl transition text-center truncate ${
            subTab === "neighbours" ? "bg-slate-800 text-white shadow" : "text-slate-400 hover:text-white"
          }`}
        >
          <span>💬 Neighbours</span>
          <span className="hidden sm:inline"> SOS</span>
        </button>
        <button
          onClick={() => setSubTab("services")}
          className={`flex-1 py-2 sm:py-2.5 px-1 text-xs font-bold rounded-xl transition text-center truncate ${
            subTab === "services" ? "bg-slate-800 text-white shadow" : "text-slate-400 hover:text-white"
          }`}
        >
          <span>🏥 Services</span>
          <span className="hidden sm:inline"> & Account</span>
        </button>
      </div>

      {/* Sub-Tab 1: My Family & Phones */}
      {subTab === "family" && (
        <div className="p-4 sm:p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Household Title</label>
              <input
                type="text"
                value={householdName}
                onChange={(e) => setHouseholdName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Building Type / Floor</label>
              <input
                type="text"
                value={buildingType}
                onChange={(e) => setBuildingType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">Physical Address / Landmark</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-500"
            />
          </div>

          {/* Counts */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl">
              <label className="text-[10px] text-slate-400 block mb-0.5">Total Members</label>
              <input
                type="number"
                min={1}
                value={totalMembers}
                onChange={(e) => setTotalMembers(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-white"
              />
            </div>
            <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl">
              <label className="text-[10px] text-slate-400 block mb-0.5">Elders (60+)</label>
              <input
                type="number"
                min={0}
                value={eldersCount}
                onChange={(e) => setEldersCount(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-amber-400"
              />
            </div>
            <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl">
              <label className="text-[10px] text-slate-400 block mb-0.5">Children (0-12)</label>
              <input
                type="number"
                min={0}
                value={childrenCount}
                onChange={(e) => setChildrenCount(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-blue-400"
              />
            </div>
            <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl">
              <label className="text-[10px] text-slate-400 block mb-0.5">Bedridden</label>
              <input
                type="number"
                min={0}
                value={bedriddenCount}
                onChange={(e) => setBedriddenCount(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-rose-400"
              />
            </div>
          </div>

          {/* Medical details */}
          <div className="space-y-3 pt-2">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                Medical Conditions (e.g. Asthma, Hypertension, Dialysis)
              </label>
              <input
                type="text"
                value={medicalConditions}
                onChange={(e) => setMedicalConditions(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                Life-Saving Medicines (packed during evacuation)
              </label>
              <input
                type="text"
                value={medicines}
                onChange={(e) => setMedicines(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                Power-Dependent Equipment (e.g. Oxygen Concentrator, CPAP)
              </label>
              <input
                type="text"
                value={powerDevices}
                onChange={(e) => setPowerDevices(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          {/* Family members list */}
          <div className="pt-3 border-t border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-white uppercase text-[11px]">
                Registered Family Members:
              </span>
              <button
                type="button"
                onClick={addFamilyMember}
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Member</span>
              </button>
            </div>

            <div className="space-y-2">
              {familyMembers.map((fm) => (
                <div
                  key={fm.id}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
                >
                  <input
                    type="text"
                    value={fm.name}
                    onChange={(e) => updateFamilyMember(fm.id, "name", e.target.value)}
                    placeholder="Name"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={fm.relationship}
                      onChange={(e) => updateFamilyMember(fm.id, "relationship", e.target.value)}
                      placeholder="Relation"
                      className="w-28 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                    />
                    <input
                      type="tel"
                      value={fm.phone}
                      onChange={(e) => updateFamilyMember(fm.id, "phone", e.target.value)}
                      placeholder="Phone"
                      className="flex-1 sm:w-32 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => removeFamilyMember(fm.id)}
                      className="text-slate-500 hover:text-red-400 p-1.5 shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 2: Neighbours (WhatsApp SOS) */}
      {subTab === "neighbours" && (
        <div className="p-4 sm:p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 text-xs">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-white text-sm">Neighbours for Instant WhatsApp SOS</h3>
              <p className="text-slate-400 text-[11px] mt-0.5">
                These contacts receive your live GPS pin, voice audio, and medical tags during an SOS.
              </p>
            </div>
            <button
              type="button"
              onClick={addNeighbour}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-1 transition shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {neighbours.map((nb) => (
              <div
                key={nb.id}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs"
              >
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={nb.name}
                    onChange={(e) => updateNeighbour(nb.id, "name", e.target.value)}
                    placeholder="Neighbour Name"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="tel"
                      value={nb.phone}
                      onChange={(e) => updateNeighbour(nb.id, "phone", e.target.value)}
                      placeholder="WhatsApp Phone"
                      className="flex-1 sm:w-44 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => removeNeighbour(nb.id)}
                      className="text-slate-500 hover:text-red-400 p-1.5 shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  value={nb.houseDetails}
                  onChange={(e) => updateNeighbour(nb.id, "houseDetails", e.target.value)}
                  placeholder="House number / description (e.g. Opposite blue gate)"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white text-[11px]"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub-Tab 3: Nearby Services & Account */}
      {subTab === "services" && (
        <div className="p-4 sm:p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 text-xs">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-white uppercase text-[11px]">
                Nearest Emergency Responders ({location.city}):
              </span>
              <button
                type="button"
                onClick={onOpenLocationModal}
                className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-semibold text-xs border border-slate-700 hover:border-red-500/50 flex items-center gap-1.5 transition active:scale-95"
              >
                <MapPin className="w-3.5 h-3.5 text-red-400" />
                <span>Change / Auto-Detect</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {household.nearbyServices?.map((srv, idx) => (
                <div key={idx} className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    {srv.type === "hospital" && "🏥 Hospital"}
                    {srv.type === "police" && "🚓 Police"}
                    {srv.type === "fire" && "🚒 Fire & Rescue"}
                  </span>
                  <div className="font-bold text-white text-xs mt-1 truncate">{srv.name}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{srv.address || srv.distance}</div>
                  <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-900">
                    <span className="text-emerald-400 font-mono font-bold text-[11px]">📞 {srv.phone}</span>
                    <a
                      href={`tel:${srv.phone}`}
                      onClick={() => triggerPhoneCall(srv.phone)}
                      className="px-2.5 py-1 bg-red-650 hover:bg-red-600 active:scale-95 text-white rounded-lg font-bold text-[10px] flex items-center gap-1 transition"
                    >
                      <PhoneCall className="w-3 h-3" />
                      <span>Call</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Account Actions */}
          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-slate-300 font-semibold">
                {activeSession ? "Signed-In Session" : "Guest Mode Active"}
              </div>
              <div className="text-slate-500 text-[11px]">
                {activeSession
                  ? `Logged in as ${activeSession.memberName || household.householdName} (${activeSession.phone})`
                  : "Using local profile. Sign in to sync across family phones."}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!activeSession && onOpenAuthModal && (
                <button
                  type="button"
                  onClick={onOpenAuthModal}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1.5 transition"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In / Link Family</span>
                </button>
              )}
              {activeSession && (
                <button
                  type="button"
                  onClick={onSignOut}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-red-950/40 text-red-400 hover:text-red-300 border border-slate-700 hover:border-red-600/40 font-bold flex items-center gap-1.5 transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              )}
            </div>
          </div>

          {onOpenOfficialsRoom && (
            <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500">
              <span>Emergency First-Responders & Civil Defense Dispatch:</span>
              <button
                type="button"
                onClick={() => setShowPinModal(true)}
                className="text-amber-500 hover:text-amber-400 font-semibold flex items-center gap-1 self-start sm:self-auto"
              >
                <Lock className="w-3 h-3" />
                <span>Official Control Room (PIN: 1234)</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Officials PIN Unlock Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-750 w-full max-w-sm rounded-3xl shadow-2xl p-5 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center mb-3">
              <Lock className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white mb-1">Officials' Control Room</h4>
            <p className="text-xs text-slate-400 mb-4">
              Restricted dashboard for Civil Defense, Rescue Dispatchers, and Incident Commanders.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (pinInput.trim() === "1234") {
                  setPinError(false);
                  setShowPinModal(false);
                  setPinInput("");
                  if (onOpenOfficialsRoom) onOpenOfficialsRoom();
                } else {
                  setPinError(true);
                }
              }}
              className="space-y-3"
            >
              <div className="text-left">
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Enter 4-Digit Security PIN (Default: 1234)
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    setPinError(false);
                  }}
                  placeholder="1234"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-center text-lg tracking-widest text-white font-mono focus:outline-none focus:border-amber-500"
                  autoFocus
                />
                {pinError && (
                  <p className="text-xs text-red-400 mt-1">Invalid PIN. Please enter 1234.</p>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-xl transition"
                >
                  Unlock Access
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
