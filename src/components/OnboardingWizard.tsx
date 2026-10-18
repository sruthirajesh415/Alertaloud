import React, { useState, useRef, useEffect } from "react";
import { UserLocation, Household, FamilyMember, Neighbour, ActiveUserSession } from "../types";
import { discoverNearbyServices } from "../utils/location";
import { saveHousehold, setActiveUserSession } from "../utils/storage";
import { blobToBase64, getSupportedAudioMimeType } from "../utils/recorder";
import {
  MapPin,
  Users,
  HeartPulse,
  PhoneCall,
  UserPlus,
  Trash2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Mic,
  Square,
  AlertCircle,
  Loader2,
  X,
} from "lucide-react";

interface OnboardingWizardProps {
  initialPhone: string;
  detectedLocation: UserLocation;
  selectedLang: string;
  onOpenLocationModal: () => void;
  onComplete: (household: Household, session: ActiveUserSession) => void;
  onCancel?: () => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  initialPhone,
  detectedLocation,
  onOpenLocationModal,
  onComplete,
  onCancel,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 2 Form States
  const [householdName, setHouseholdName] = useState("My Family Residence");
  const [address, setAddress] = useState(detectedLocation.displayName);
  const [buildingType, setBuildingType] = useState("Ground floor");
  const [totalMembers, setTotalMembers] = useState(3);
  const [eldersCount, setEldersCount] = useState(1);
  const [childrenCount, setChildrenCount] = useState(0);
  const [bedriddenCount, setBedriddenCount] = useState(0);
  const [medicalConditionsInput, setMedicalConditionsInput] = useState("Hypertension, Mild Asthma");
  const [medicinesInput, setMedicinesInput] = useState("Blood pressure tablets, Inhaler");
  const [powerDevicesInput, setPowerDevicesInput] = useState("None");
  const [pets, setPets] = useState("None");

  // Step 3: Family Members
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([
    { id: "fm-1", name: "Elder Parent", relationship: "Father", phone: "" },
  ]);

  // Step 4: Neighbours
  const [neighbours, setNeighbours] = useState<Neighbour[]>([
    { id: "nb-1", name: "Next Door Neighbour", phone: "+1234567890", houseDetails: "House #12, Opposite side" },
  ]);

  const nearbyServices = React.useMemo(() => {
    return discoverNearbyServices(detectedLocation);
  }, [detectedLocation]);

  // Gemini Smart Voice / Text Extractor
  const [extractText, setExtractText] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [showAiExtractModal, setShowAiExtractModal] = useState(false);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [voiceDuration, setVoiceDuration] = useState(0);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const voiceTimerRef = useRef<any>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const isRecordingRef = useRef<boolean>(false);

  // Stop recording on unmount or modal close
  useEffect(() => {
    return () => {
      if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, []);

  // Handle Gemini smart extraction from voice/text automatically
  const handleSmartExtract = async (textToExtract?: string, audioBlob?: Blob | null) => {
    const textQuery = (textToExtract !== undefined ? textToExtract : extractText).trim();
    if (!textQuery && !audioBlob) {
      setVoiceNotice("Please record your voice or type your details first.");
      return;
    }

    setIsExtracting(true);
    setVoiceNotice("Analyzing recording with Gemini AI...");
    try {
      let audioBase64: string | undefined = undefined;
      let audioMimeType: string | undefined = undefined;

      if (audioBlob) {
        audioBase64 = await blobToBase64(audioBlob);
        audioMimeType = audioBlob.type || "audio/webm";
      }

      const res = await fetch("/api/gemini/extract-household", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          speechOrText: textQuery,
          audioBase64,
          mimeType: audioMimeType,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.transcription && !textQuery) {
          setExtractText(data.transcription);
        }
        if (data.householdName) setHouseholdName(data.householdName);
        if (data.buildingType) setBuildingType(data.buildingType);
        if (typeof data.totalMembers === "number" && data.totalMembers > 0) setTotalMembers(data.totalMembers);
        if (typeof data.eldersCount === "number") setEldersCount(data.eldersCount);
        if (typeof data.childrenCount === "number") setChildrenCount(data.childrenCount);
        if (typeof data.bedriddenCount === "number") setBedriddenCount(data.bedriddenCount);
        if (Array.isArray(data.medicalConditions) && data.medicalConditions.length > 0) {
          setMedicalConditionsInput(data.medicalConditions.join(", "));
        }
        if (Array.isArray(data.lifeSavingMedicines) && data.lifeSavingMedicines.length > 0) {
          setMedicinesInput(data.lifeSavingMedicines.join(", "));
        }
        if (Array.isArray(data.powerDependentDevices) && data.powerDependentDevices.length > 0) {
          setPowerDevicesInput(data.powerDependentDevices.join(", "));
        }
        if (data.pets) setPets(data.pets);
        setVoiceNotice("✨ Details extracted automatically!");
        setTimeout(() => {
          setShowAiExtractModal(false);
          setVoiceNotice(null);
        }, 1200);
      } else {
        setVoiceNotice("Failed to extract details automatically. You can edit the form directly.");
      }
    } catch (err) {
      console.error("Smart extract error:", err);
      setVoiceNotice("Could not process audio details. Please check connection.");
    } finally {
      setIsExtracting(false);
    }
  };

  // Start voice recording with live Speech Recognition & MediaRecorder
  const startVoiceRecording = async () => {
    setVoiceNotice(null);
    setIsVoiceRecording(true);
    isRecordingRef.current = true;
    setVoiceDuration(0);

    if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);
    voiceTimerRef.current = setInterval(() => {
      setVoiceDuration((prev) => {
        if (prev >= 29) {
          stopVoiceRecording();
          return 30;
        }
        return prev + 1;
      });
    }, 1000);

    // 1. Try SpeechRecognition for live transcription
    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognitionClass) {
      try {
        const recognition = new SpeechRecognitionClass();
        recognition.lang = "en-IN";
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
          let liveTranscript = "";
          for (let i = 0; i < event.results.length; i++) {
            liveTranscript += event.results[i][0].transcript + " ";
          }
          if (liveTranscript.trim()) {
            setExtractText(liveTranscript.trim());
          }
        };

        recognition.onerror = (e: any) => {
          console.warn("Speech recognition warning:", e);
        };

        recognition.start();
        recognitionRef.current = recognition;
      } catch (recErr) {
        console.warn("Speech recognition init:", recErr);
      }
    }

    // 2. Also capture real audio blob via MediaRecorder
    try {
      if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === "function") {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        audioChunksRef.current = [];
        const mimeType = getSupportedAudioMimeType();
        const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        recorder.onstop = () => {
          const blob = new Blob(audioChunksRef.current, {
            type: mimeType || recorder.mimeType || "audio/webm",
          });
          // Auto extract details directly from the completed recording
          handleSmartExtract(extractText, blob);
        };

        recorder.start(250);
      }
    } catch (micErr) {
      console.warn("Media stream access fallback:", micErr);
    }
  };

  // Stop voice recording and auto-trigger extraction
  const stopVoiceRecording = () => {
    if (voiceTimerRef.current) {
      clearInterval(voiceTimerRef.current);
      voiceTimerRef.current = null;
    }

    setIsVoiceRecording(false);
    isRecordingRef.current = false;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.warn("Recorder stop error:", err);
      }
    } else {
      // Trigger extraction with whatever text was captured or typed
      handleSmartExtract(extractText);
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  // Add/Remove family member
  const addFamilyMember = () => {
    setFamilyMembers([
      ...familyMembers,
      { id: `fm-${Date.now()}`, name: "", relationship: "Spouse", phone: "" },
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

  // Add/Remove neighbour
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

  // Final submission
  const handleFinalSubmit = () => {
    const medList = medicalConditionsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const drugList = medicinesInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const devList = powerDevicesInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const newHousehold: Household = {
      id: `hh-${Date.now()}`,
      primaryPhone: initialPhone,
      householdName: householdName.trim() || "My Household",
      address: address.trim() || detectedLocation.displayName,
      buildingType,
      totalMembers: Number(totalMembers) || 1,
      eldersCount: Number(eldersCount) || 0,
      childrenCount: Number(childrenCount) || 0,
      bedriddenCount: Number(bedriddenCount) || 0,
      medicalConditions: medList,
      lifeSavingMedicines: drugList,
      powerDependentDevices: devList,
      pets: pets.trim() || "None",
      familyMembers: familyMembers.filter((m) => m.name.trim()),
      neighbours: neighbours.filter((n) => n.name.trim()),
      location: detectedLocation,
      nearbyServices,
      rescueCardShared: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveHousehold(newHousehold);

    const session: ActiveUserSession = {
      phone: initialPhone,
      householdId: newHousehold.id,
      memberName: newHousehold.householdName,
      loggedInAt: new Date().toISOString(),
    };
    setActiveUserSession(session);
    onComplete(newHousehold, session);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-3 sm:p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-4 sm:p-7 relative">
        {/* Cancel button */}
        {onCancel && (
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Cancel setup"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Step Indicator Header */}
        <div className="mb-5 pr-8">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold mb-1.5">
            <span>STEP {step} OF 4</span>
            <span className="text-red-400 font-bold truncate max-w-[200px] sm:max-w-none text-right">
              {step === 1 && "Location & Stations"}
              {step === 2 && "Household Profile"}
              {step === 3 && "Family Members"}
              {step === 4 && "Neighbours SOS"}
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-600 to-rose-500 transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* ================= STEP 1: Location & Emergency Stations ================= */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-red-500" />
                Confirm Your Real Location
              </h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                AlertAloud verifies your live civil-defense feeds and pinpoints nearest responders for this region.
              </p>
            </div>

            {/* Current Detected Box with Edit Button */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">
                  Verified Local Area
                </span>
                <div className="text-sm sm:text-base font-bold text-white mt-0.5">
                  {detectedLocation.city}, {detectedLocation.state}
                </div>
                <div className="text-xs text-slate-400 truncate max-w-sm">{detectedLocation.displayName}</div>
                <div className="text-xs text-emerald-400 font-mono mt-1">
                  🌐 Native Language: {detectedLocation.detectedNativeLanguage.toUpperCase()}
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenLocationModal}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-xs font-semibold text-white border border-slate-700 flex items-center gap-1.5 shrink-0 self-start sm:self-center transition"
              >
                ✏️ Edit Location
              </button>
            </div>

            {/* Auto-Discovered Local Emergency Services */}
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Nearest Emergency Responders
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {nearbyServices.map((srv, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-850/60 border border-slate-800 text-xs"
                  >
                    <div className="text-[10px] uppercase font-bold text-slate-400">
                      {srv.type === "hospital" && "🏥 Hospital"}
                      {srv.type === "police" && "🚓 Police"}
                      {srv.type === "fire" && "🚒 Fire Station"}
                    </div>
                    <div className="font-semibold text-white mt-0.5 truncate">{srv.name}</div>
                    <div className="text-slate-400 text-[11px] mt-0.5">{srv.distance}</div>
                    <div className="text-emerald-400 font-mono font-bold mt-1">📞 {srv.phone}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full sm:w-auto bg-red-600 hover:bg-red-500 text-white font-bold px-6 py-2.5 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition"
              >
                <span>Continue to Step 2</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 2: Family & Medical Questions ================= */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-1.5">
                  <HeartPulse className="w-5 h-5 text-rose-500" />
                  Household Triage
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Helps rescue teams prioritize homes with bedridden members and power-dependent equipment.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAiExtractModal(true)}
                className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center gap-1 shadow transition shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Fill</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Household / Landmark Name</label>
                <input
                  type="text"
                  value={householdName}
                  onChange={(e) => setHouseholdName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-red-500"
                  placeholder="e.g. Villa Rose, Flat 4B"
                />
              </div>
              <div>
                <label className="text-slate-300 font-medium block mb-1">Building & Topography</label>
                <select
                  value={buildingType}
                  onChange={(e) => setBuildingType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-red-500"
                >
                  <option value="Ground floor">Ground floor (High flood risk)</option>
                  <option value="Apartment floor (Low)">Apartment floor 1 - 3</option>
                  <option value="Apartment floor (High)">Apartment floor 4+ (High fire risk)</option>
                  <option value="Near river / coast">Near river / coastal shoreline</option>
                  <option value="Near mountain slope">Near steep hill / slope</option>
                </select>
              </div>
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
                <label className="text-[10px] text-slate-400 block mb-0.5">Bedridden / Mobility</label>
                <input
                  type="number"
                  min={0}
                  value={bedriddenCount}
                  onChange={(e) => setBedriddenCount(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-rose-400"
                />
              </div>
            </div>

            {/* Medical Inputs */}
            <div className="space-y-2.5 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  Chronic Illnesses / Vulnerabilities
                </label>
                <input
                  type="text"
                  value={medicalConditionsInput}
                  onChange={(e) => setMedicalConditionsInput(e.target.value)}
                  placeholder="Cardiac, Dialysis, Asthma, Diabetes, None"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  Life-Saving Daily Medicines
                </label>
                <input
                  type="text"
                  value={medicinesInput}
                  onChange={(e) => setMedicinesInput(e.target.value)}
                  placeholder="Insulin, Inhaler, Nitroglycerin, None"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-500"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">
                    Power-Dependent Devices
                  </label>
                  <input
                    type="text"
                    value={powerDevicesInput}
                    onChange={(e) => setPowerDevicesInput(e.target.value)}
                    placeholder="Oxygen, CPAP, None"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Pets / Animals</label>
                  <input
                    type="text"
                    value={pets}
                    onChange={(e) => setPets(e.target.value)}
                    placeholder="1 Dog, 2 Cats, None"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-slate-400 hover:text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="bg-red-600 hover:bg-red-500 text-white font-bold px-6 py-2.5 rounded-xl text-xs sm:text-sm flex items-center gap-2 transition"
              >
                <span>Continue to Step 3</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 3: Family Members' Phones ================= */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                Shared Family Account Linking
              </h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Add family phone numbers. When they log in on their phones, they will automatically inherit this household profile.
              </p>
            </div>

            <div className="p-2.5 bg-blue-950/40 border border-blue-700/40 rounded-xl text-xs text-blue-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
              <span>
                Primary Registrant: <strong>{initialPhone}</strong> (You)
              </span>
            </div>

            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {familyMembers.map((fm) => (
                <div
                  key={fm.id}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 text-xs"
                >
                  <input
                    type="text"
                    value={fm.name}
                    onChange={(e) => updateFamilyMember(fm.id, "name", e.target.value)}
                    placeholder="Member Name (e.g. Maya)"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-blue-500"
                  />
                  <div className="flex items-center gap-2">
                    <select
                      value={fm.relationship}
                      onChange={(e) => updateFamilyMember(fm.id, "relationship", e.target.value)}
                      className="w-32 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-white focus:outline-none"
                    >
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Spouse">Spouse</option>
                      <option value="Son">Son</option>
                      <option value="Daughter">Daughter</option>
                      <option value="Sibling">Sibling</option>
                      <option value="Grandparent">Grandparent</option>
                      <option value="Other">Other</option>
                    </select>
                    <input
                      type="tel"
                      value={fm.phone}
                      onChange={(e) => updateFamilyMember(fm.id, "phone", e.target.value)}
                      placeholder="Phone"
                      className="flex-1 sm:w-36 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-blue-500 font-mono"
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

            <button
              type="button"
              onClick={addFamilyMember}
              className="w-full py-2.5 border border-dashed border-slate-700 hover:border-slate-500 rounded-xl text-xs font-semibold text-slate-300 hover:text-white flex items-center justify-center gap-1.5 transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Another Family Member</span>
            </button>

            <div className="pt-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-slate-400 hover:text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="bg-red-600 hover:bg-red-500 text-white font-bold px-6 py-2.5 rounded-xl text-xs sm:text-sm flex items-center gap-2 transition"
              >
                <span>Continue to Step 4</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 4: Neighbours' WhatsApp Details ================= */}
        {step === 4 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <PhoneCall className="w-5 h-5 text-emerald-400" />
                Neighbours' Network for WhatsApp SOS
              </h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                During an emergency, 1 tap sends a WhatsApp alert with live GPS, medical tags, and 30s voice SOS to these neighbours.
              </p>
            </div>

            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
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
                      placeholder="Neighbour Name (e.g. Mr. Sharma)"
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-emerald-500"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="tel"
                        value={nb.phone}
                        onChange={(e) => updateNeighbour(nb.id, "phone", e.target.value)}
                        placeholder="WhatsApp Phone"
                        className="flex-1 sm:w-44 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-emerald-500 font-mono"
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
                    placeholder="House / Flat details (e.g. Apt 3A, right next door)"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-emerald-500 text-[11px]"
                  />
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addNeighbour}
              className="w-full py-2.5 border border-dashed border-slate-700 hover:border-slate-500 rounded-xl text-xs font-semibold text-slate-300 hover:text-white flex items-center justify-center gap-1.5 transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Another Neighbour</span>
            </button>

            <div className="pt-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="text-slate-400 hover:text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-2.5 rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-950/60 transition"
              >
                <span>Complete Registration</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* AI Smart Extraction Modal with Voice Recording & Typing */}
      {showAiExtractModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-750 w-full max-w-md rounded-3xl p-5 space-y-3.5 shadow-2xl my-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-white text-sm">Smart Voice &amp; Text Autofill</h3>
              </div>
              <button
                onClick={() => {
                  if (isVoiceRecording) stopVoiceRecording();
                  setShowAiExtractModal(false);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Describe your house in plain English or local language (e.g. &quot;We are 4 members including my 70-year-old mother with hypertension who needs BP tablets, on ground floor&quot;).
            </p>

            {/* Voice Record Option */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Option 1: Voice Recording
              </div>
              {!isVoiceRecording ? (
                <button
                  type="button"
                  onClick={startVoiceRecording}
                  disabled={isExtracting}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-red-950/50 transition disabled:opacity-50"
                >
                  <Mic className="w-4 h-4 animate-pulse" />
                  <span>Record Voice (Speak Family Details)</span>
                </button>
              ) : (
                <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-700/60 flex items-center justify-between gap-2 overflow-hidden">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shrink-0" />
                    <div className="flex items-end gap-0.5 h-4 shrink-0">
                      <span className="w-1 bg-red-400 rounded-full animate-bounce h-2" style={{ animationDelay: "0ms" }} />
                      <span className="w-1 bg-red-500 rounded-full animate-bounce h-4" style={{ animationDelay: "150ms" }} />
                      <span className="w-1 bg-red-400 rounded-full animate-bounce h-3" style={{ animationDelay: "300ms" }} />
                      <span className="w-1 bg-red-500 rounded-full animate-bounce h-4" style={{ animationDelay: "75ms" }} />
                    </div>
                    <span className="text-xs text-red-300 font-bold truncate">
                      Listening... ({voiceDuration}s)
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={stopVoiceRecording}
                    className="bg-red-600 hover:bg-red-500 active:scale-95 text-white px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shrink-0 shadow whitespace-nowrap"
                  >
                    <Square className="w-3 h-3 fill-current shrink-0" />
                    <span>Stop</span>
                  </button>
                </div>
              )}
            </div>

            {/* Typing Option */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Option 2: Type or Edit Details</span>
                {extractText && (
                  <button
                    type="button"
                    onClick={() => setExtractText("")}
                    className="text-[10px] text-slate-400 hover:text-white"
                  >
                    Clear
                  </button>
                )}
              </div>
              <textarea
                rows={3}
                value={extractText}
                onChange={(e) => setExtractText(e.target.value)}
                placeholder="Type or paste your family details here..."
                className="w-full bg-slate-950 border border-slate-750 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            {voiceNotice && (
              <div className="p-2 rounded-xl bg-purple-950/40 border border-purple-800/40 text-[11px] text-purple-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span className="truncate">{voiceNotice}</span>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  if (isVoiceRecording) stopVoiceRecording();
                  setShowAiExtractModal(false);
                }}
                className="flex-1 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSmartExtract()}
                disabled={isExtracting || (!extractText.trim() && !isVoiceRecording)}
                className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white flex items-center justify-center gap-1.5 disabled:opacity-50 transition shadow"
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Extracting Details...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Extract Details</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
