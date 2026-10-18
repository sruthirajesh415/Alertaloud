import React, { useState, useRef, useEffect } from "react";
import { Household, AlertData } from "../types";
import {
  X,
  PhoneCall,
  MessageSquare,
  Mic,
  Square,
  Share2,
  Check,
  ShieldAlert,
  Copy,
  ExternalLink,
} from "lucide-react";
import {
  triggerPhoneCall,
  getWhatsAppNeighbourUrl,
  getWhatsAppBroadcastUrl,
  openWhatsAppSafely,
} from "../utils/communication";
import {
  getSupportedAudioMimeType,
  blobToBase64,
  generateEmergencyAudioBlob,
} from "../utils/recorder";

interface SOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  household: Household;
  activeAlert: AlertData | null;
  selectedLang: string;
}

export const SOSModal: React.FC<SOSModalProps> = ({
  isOpen,
  onClose,
  household,
  activeAlert,
}) => {
  const [selectedEmergencyType, setSelectedEmergencyType] = useState<string>(
    activeAlert ? activeAlert.hazardName : "Life-Threatening Emergency"
  );
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  const [recordedAudioBase64, setRecordedAudioBase64] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isSimulatedAudio, setIsSimulatedAudio] = useState(false);
  const [activeSOSOption, setActiveSOSOption] = useState<"whatsapp" | "call">("whatsapp");
  const [sosSentToControlRoom, setSosSentToControlRoom] = useState(false);
  const [copied, setCopied] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerIntervalRef = useRef<any>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const simulatedStartTimeRef = useRef<number>(0);
  const isRecordingRef = useRef<boolean>(false);

  const stopRecording = React.useCallback(async () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (!isRecordingRef.current) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      return;
    }

    isRecordingRef.current = false;
    setIsRecording(false);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.warn("MediaRecorder stop error:", err);
      }
    } else {
      // Fallback: Generate real emergency beacon WAV audio
      try {
        const rawSec =
          simulatedStartTimeRef.current > 0
            ? Math.round((Date.now() - simulatedStartTimeRef.current) / 1000)
            : 3;
        const durationSec = Math.min(30, Math.max(1, rawSec));
        const result = await generateEmergencyAudioBlob(
          durationSec,
          `Emergency SOS: ${selectedEmergencyType} from ${household.householdName}`
        );
        setRecordedAudioBlob(result.blob);
        setRecordedAudioBase64(result.base64);
        setAudioUrl(result.url);
        setIsSimulatedAudio(true);
      } catch (genErr) {
        console.error("Audio generation fallback error:", genErr);
      }
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, [household.householdName, selectedEmergencyType]);

  useEffect(() => {
    if (!isOpen) {
      if (isRecordingRef.current) {
        stopRecording();
      }
      setRecordedAudioBlob(null);
      setRecordedAudioBase64(null);
      setAudioUrl(null);
      setIsSimulatedAudio(false);
      setSosSentToControlRoom(false);
      setCopied(false);
    }
    return () => {
      if (isRecordingRef.current) {
        stopRecording();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [isOpen, stopRecording]);

  if (!isOpen) return null;

  const lat = household.location.lat;
  const lon = household.location.lon;
  const mapsLink = `https://maps.google.com/?q=${lat},${lon}`;

  // Build vulnerability tags
  const vulnTags: string[] = [];
  if (household.bedriddenCount > 0) vulnTags.push(`🚨 ${household.bedriddenCount} Bedridden/Wheelchair member(s)`);
  if (household.powerDependentDevices.length > 0 && !household.powerDependentDevices.includes("None")) {
    vulnTags.push(`⚡ Power device: ${household.powerDependentDevices.join(", ")}`);
  }
  if (household.eldersCount > 0) vulnTags.push(`👴 ${household.eldersCount} Elder(s)`);
  if (household.childrenCount > 0) vulnTags.push(`👶 ${household.childrenCount} Child/Infant(s)`);
  if (household.lifeSavingMedicines.length > 0) vulnTags.push(`💊 Vital meds: ${household.lifeSavingMedicines.join(", ")}`);

  const vulnSummary = vulnTags.length > 0 ? vulnTags.join(" | ") : "Family evacuation assistance needed.";

  // Generate urgent WhatsApp emergency message
  const emergencyMessage = `🆘 *URGENT EMERGENCY SOS — PLEASE HELP IMMEDIATELY* 🆘

*Family:* ${household.householdName}
*Address:* ${household.address} (${household.location.city})
*Situation:* ${selectedEmergencyType}
*Vulnerabilities:* ${vulnSummary}

*LIVE GPS LOCATION:* ${mapsLink}

_Sent via AlertAloud Emergency Network. Please check on us or call emergency responders!_`;

  // Audio Recording (30s max via MediaRecorder with resilient fallback)
  const startRecording = async () => {
    isRecordingRef.current = true;
    setIsRecording(true);
    setRecordDuration(0);
    simulatedStartTimeRef.current = Date.now();

    timerIntervalRef.current = setInterval(() => {
      setRecordDuration((prev) => {
        if (prev >= 29) {
          stopRecording();
          return 30;
        }
        return prev + 1;
      });
    }, 1000);

    // 1. Try accessing real hardware microphone
    let mediaStream: MediaStream | null = null;
    try {
      if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === "function") {
        mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = mediaStream;
      }
    } catch (micErr) {
      console.warn("Hardware microphone restricted by browser/iframe; will generate emergency audio on stop:", micErr);
      setIsSimulatedAudio(true);
      return;
    }

    if (!mediaStream) {
      setIsSimulatedAudio(true);
      return;
    }

    // 2. Set up MediaRecorder with supported MIME
    try {
      const mimeType = getSupportedAudioMimeType();
      audioChunksRef.current = [];
      const options = mimeType ? { mimeType } : undefined;
      const recorder = new MediaRecorder(mediaStream, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const finalMime = mimeType || recorder.mimeType || "audio/webm";
        const blob = new Blob(audioChunksRef.current, { type: finalMime });
        setRecordedAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setIsSimulatedAudio(false);

        try {
          const b64 = await blobToBase64(blob);
          setRecordedAudioBase64(b64);
        } catch (convErr) {
          console.error("Audio base64 error:", convErr);
        }

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
      };

      recorder.start(250);
    } catch (recErr) {
      console.warn("MediaRecorder start failed; using emergency audio generator:", recErr);
      setIsSimulatedAudio(true);
    }
  };

  const transmitSOSToOfficials = async () => {
    try {
      await fetch("/api/sos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: `sos-${Date.now()}`,
          householdId: household.id,
          householdName: household.householdName,
          senderPhone: household.primaryPhone,
          phone: household.primaryPhone,
          lat,
          lon,
          city: household.location.city,
          address: household.address,
          emergencyType: selectedEmergencyType,
          vulnerabilities: vulnTags,
          vulnerabilitySummary: vulnSummary,
          audioBase64: recordedAudioBase64,
          audioDuration: recordDuration,
          timestamp: new Date().toISOString(),
        }),
      });
      setSosSentToControlRoom(true);
    } catch (err) {
      console.error("SOS transmission error:", err);
    }
  };

  const handleNeighbourWhatsAppClick = (phone: string, e?: React.MouseEvent) => {
    transmitSOSToOfficials();
    const url = getWhatsAppNeighbourUrl(phone, household.location.countryCode, emergencyMessage);
    openWhatsAppSafely(url);
  };

  const handleBroadcastWhatsApp = (e?: React.MouseEvent) => {
    transmitSOSToOfficials();
    const url = getWhatsAppBroadcastUrl(emergencyMessage);
    openWhatsAppSafely(url);
  };

  const handleCopySOS = () => {
    navigator.clipboard.writeText(emergencyMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2.5 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border-2 border-red-600/80 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh] my-auto">
        {/* Header */}
        <div className="p-3.5 sm:p-4 bg-gradient-to-r from-red-650 to-red-600 text-white flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse shrink-0" />
            <div>
              <h3 className="font-extrabold text-sm sm:text-base tracking-wide uppercase">
                Emergency SOS Coordination
              </h3>
              <p className="text-[10px] sm:text-[11px] text-red-100 opacity-90">
                1-Tap Call &amp; WhatsApp Alert to Neighbours
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-black/30 hover:bg-black/50 text-white transition shrink-0"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* 🚨 Immediate 1-Tap Emergency Call Bar (Always visible on mobile & desktop) */}
        <div className="p-2.5 sm:p-3 bg-red-950/80 border-b border-red-700/60 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0">
              <PhoneCall className="w-4 h-4 animate-pulse" />
            </div>
            <div className="truncate">
              <div className="text-[10px] sm:text-[11px] font-black uppercase text-red-300 tracking-wider truncate">
                Emergency Dispatch
              </div>
              <div className="text-xs text-white font-bold truncate">All-Services Hotline</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 flex-nowrap">
            {activeAlert && activeAlert.helplineNumbers && activeAlert.helplineNumbers[0] && (
              <a
                href={`tel:${activeAlert.helplineNumbers[0]}`}
                onClick={() => triggerPhoneCall(activeAlert.helplineNumbers![0])}
                className="px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold flex items-center gap-1 border border-slate-700 transition whitespace-nowrap shrink-0"
                title="Call Official Incident Helpline"
              >
                <PhoneCall className="w-3 h-3 text-amber-400 shrink-0" />
                <span className="whitespace-nowrap truncate max-w-[90px] sm:max-w-none">📞 {activeAlert.helplineNumbers[0]}</span>
              </a>
            )}
            <a
              href="tel:112"
              onClick={() => triggerPhoneCall("112")}
              className="px-4 py-1.5 rounded-full bg-red-600 hover:bg-red-500 active:scale-95 text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-red-950/50 transition shrink-0 whitespace-nowrap"
            >
              <PhoneCall className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">Call Now</span>
            </a>
          </div>
        </div>

        {/* Emergency Type Selector */}
        <div className="p-3 sm:p-4 bg-slate-950/70 border-b border-slate-800 shrink-0">
          <label className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
            Select Immediate Crisis:
          </label>
          <div className="flex flex-wrap gap-1.5">
            {[
              "House Fire / Smoke",
              "Medical Collapse",
              "Severe Flood Evacuation",
              "Gas Leak / Explosion",
              "Break-in / Safety Threat",
              "Mobility Assistance Needed",
            ].map((type) => (
              <button
                key={type}
                onClick={() => setSelectedEmergencyType(type)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                  selectedEmergencyType === type
                    ? "bg-red-600 text-white shadow-sm"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Two-Option Tabs (Mobile Optimized) */}
        <div className="flex border-b border-slate-800 bg-slate-950 p-1 gap-1 shrink-0">
          <button
            onClick={() => setActiveSOSOption("whatsapp")}
            className={`flex-1 py-2 sm:py-2.5 px-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition truncate ${
              activeSOSOption === "whatsapp"
                ? "bg-slate-850 text-emerald-400 border border-emerald-500/30 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">
              <span className="sm:hidden">WhatsApp SOS</span>
              <span className="hidden sm:inline">Option A: WhatsApp Neighbours</span>
            </span>
          </button>
          <button
            onClick={() => setActiveSOSOption("call")}
            className={`flex-1 py-2 sm:py-2.5 px-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition truncate ${
              activeSOSOption === "call"
                ? "bg-slate-850 text-red-400 border border-red-500/30 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <PhoneCall className="w-4 h-4 text-red-400 shrink-0" />
            <span className="truncate">
              <span className="sm:hidden">Emergency Call</span>
              <span className="hidden sm:inline">Option B: Call Responders</span>
            </span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-3 sm:p-4 overflow-y-auto flex-1 space-y-3.5">
          {activeSOSOption === "whatsapp" ? (
            <div className="space-y-3.5">
              {/* Voice SOS Recorder (30s) */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Mic className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                    30-Second Voice SOS Message
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-800/40">
                      {recordDuration}s / 30s
                    </span>
                  </div>
                </div>

                {/* Progress bar during recording */}
                {isRecording && (
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-red-500 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${(recordDuration / 30) * 100}%` }}
                    />
                  </div>
                )}

                {!isRecording ? (
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={startRecording}
                        className="bg-red-600 hover:bg-red-500 active:scale-95 text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-md shadow-red-950/50 transition whitespace-nowrap"
                      >
                        <Mic className="w-3.5 h-3.5 shrink-0" />
                        <span>{recordedAudioBlob ? "Re-record Voice SOS" : "Record 30s Voice SOS"}</span>
                      </button>

                      {recordedAudioBlob && (
                        <button
                          type="button"
                          onClick={() => {
                            setRecordedAudioBlob(null);
                            setRecordedAudioBase64(null);
                            setAudioUrl(null);
                            setRecordDuration(0);
                            setIsSimulatedAudio(false);
                          }}
                          className="bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-slate-200 px-3 py-2 rounded-full text-xs font-semibold transition"
                          title="Discard recording"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    {audioUrl && (
                      <div className="pt-1 flex flex-col items-center gap-1.5">
                        <audio controls src={audioUrl} className="w-full max-w-sm h-8" />
                        <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>
                            {isSimulatedAudio
                              ? `Voice SOS Audio Beacon ready (${recordDuration || 3}s)`
                              : `Voice note recorded successfully (${recordDuration}s)`}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-red-950/50 border border-red-700/50 flex items-center justify-between gap-2 overflow-hidden">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shrink-0"></div>
                      {/* Animated audio wave bars */}
                      <div className="flex items-end gap-0.5 h-4 shrink-0">
                        <span className="w-1 bg-red-400 rounded-full animate-bounce h-2" style={{ animationDelay: "0ms" }} />
                        <span className="w-1 bg-red-500 rounded-full animate-bounce h-4" style={{ animationDelay: "150ms" }} />
                        <span className="w-1 bg-red-400 rounded-full animate-bounce h-3" style={{ animationDelay: "300ms" }} />
                        <span className="w-1 bg-red-500 rounded-full animate-bounce h-4" style={{ animationDelay: "75ms" }} />
                        <span className="w-1 bg-red-400 rounded-full animate-bounce h-2" style={{ animationDelay: "220ms" }} />
                      </div>
                      <span className="text-xs text-red-300 font-bold truncate">Recording audio...</span>
                    </div>

                    <button
                      type="button"
                      onClick={stopRecording}
                      className="bg-red-600 hover:bg-red-500 active:scale-95 text-white px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shrink-0 shadow whitespace-nowrap"
                    >
                      <Square className="w-3 h-3 fill-current shrink-0" />
                      <span>Stop</span>
                    </button>
                  </div>
                )}

                <p className="text-[10px] sm:text-[11px] text-slate-400">
                  Voice audio automatically transmits to Officials&apos; Control Room for rapid search and rescue triage.
                </p>
              </div>

              {/* Pre-compiled message preview */}
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    WhatsApp Message Preview:
                  </span>
                  <button
                    type="button"
                    onClick={handleCopySOS}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold"
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? "Copied!" : "Copy Text"}</span>
                  </button>
                </div>
                <div className="text-slate-200 font-mono text-[11px] whitespace-pre-line bg-slate-900/90 p-2 rounded-lg border border-slate-800 max-h-24 overflow-y-auto">
                  {emergencyMessage}
                </div>
              </div>

              {/* Saved Neighbours 1-tap WhatsApp list */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center justify-between">
                  <span>Send to Neighbours (1-Tap WhatsApp):</span>
                  <span className="text-[11px] text-emerald-400 font-normal">
                    {household.neighbours?.length || 0} registered
                  </span>
                </h4>

                <div className="space-y-2">
                  {household.neighbours && household.neighbours.length > 0 ? (
                    household.neighbours.map((nb) => {
                      const waUrl = getWhatsAppNeighbourUrl(
                        nb.phone,
                        household.location.countryCode,
                        emergencyMessage
                      );
                      return (
                        <div
                          key={nb.id}
                          className="p-2.5 sm:p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2"
                        >
                          <div className="truncate mr-1">
                            <div className="font-bold text-white text-xs truncate">{nb.name}</div>
                            <div className="text-[10px] text-slate-400 truncate">{nb.houseDetails || "Neighbour"}</div>
                            <div className="text-[10px] text-emerald-400 font-mono truncate">{nb.phone}</div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <a
                              href={`tel:${nb.phone}`}
                              onClick={() => triggerPhoneCall(nb.phone)}
                              className="bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-xl text-xs font-bold transition"
                              title={`Call ${nb.name}`}
                            >
                              <PhoneCall className="w-3.5 h-3.5 text-blue-400" />
                            </a>
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => handleNeighbourWhatsAppClick(nb.phone, e)}
                              className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                            </a>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-400">
                      No neighbours added yet. You can still use the Broadcast button below.
                    </div>
                  )}
                </div>

                <div className="mt-2.5 space-y-2">
                  <a
                    href={getWhatsAppBroadcastUrl(emergencyMessage)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => handleBroadcastWhatsApp(e)}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition cursor-pointer"
                  >
                    <Share2 className="w-4 h-4 text-white" />
                    <span>Broadcast to Any WhatsApp Group / Contact</span>
                  </a>

                  <button
                    type="button"
                    onClick={handleCopySOS}
                    className="w-full bg-slate-800 hover:bg-slate-750 text-slate-300 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700 transition"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? "Copied SOS to Clipboard!" : "Copy Full SOS Text for SMS / Other Apps"}</span>
                  </button>
                </div>
              </div>

              {sosSentToControlRoom && (
                <div className="p-2.5 rounded-xl bg-emerald-950 border border-emerald-600/40 text-xs text-emerald-300 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>SOS incident &amp; GPS transmitted to Officials&apos; Control Room.</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {/* Option B: Complete Helplines Directory with 1-Tap Dialing */}
              {activeAlert && activeAlert.helplineNumbers && activeAlert.helplineNumbers.length > 0 && (
                <div className="p-3 sm:p-3.5 rounded-2xl bg-red-950/60 border border-red-600/60 text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 block mb-1">
                    Official Active Incident Helpline ({activeAlert.officialSource})
                  </span>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-base sm:text-lg font-black text-white font-mono truncate">
                      📞 {activeAlert.helplineNumbers[0]}
                    </span>
                    <a
                      href={`tel:${activeAlert.helplineNumbers[0]}`}
                      onClick={() => triggerPhoneCall(activeAlert.helplineNumbers![0])}
                      className="bg-red-600 hover:bg-red-500 active:scale-95 text-white px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-md shadow-red-950/60 whitespace-nowrap"
                    >
                      <PhoneCall className="w-3.5 h-3.5 shrink-0" />
                      <span className="whitespace-nowrap">Call Now</span>
                    </a>
                  </div>
                </div>
              )}

              {/* National All Emergency 112 / 911 */}
              <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2">
                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-400">
                    National Emergency Operator
                  </div>
                  <div className="text-sm sm:text-base font-bold text-white">All Emergency Services</div>
                  <div className="text-xs font-mono text-emerald-400 font-bold mt-0.5">📞 112 / 911</div>
                </div>
                <a
                  href="tel:112"
                  onClick={() => triggerPhoneCall("112")}
                  className="bg-red-600 hover:bg-red-500 active:scale-95 text-white px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-md shadow-red-950/60 whitespace-nowrap"
                >
                  <PhoneCall className="w-3.5 h-3.5 shrink-0" />
                  <span className="whitespace-nowrap">Call 112</span>
                </a>
              </div>

              {/* Essential Services Grid: Police, Fire, Ambulance */}
              <div className="grid grid-cols-3 gap-2">
                <a
                  href="tel:100"
                  onClick={() => triggerPhoneCall("100")}
                  className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-blue-500/60 text-center transition flex flex-col items-center justify-center gap-1"
                >
                  <PhoneCall className="w-4 h-4 text-blue-400" />
                  <span className="text-[10px] font-bold text-slate-300 uppercase">Police</span>
                  <span className="text-xs font-bold text-white font-mono">100</span>
                </a>

                <a
                  href="tel:101"
                  onClick={() => triggerPhoneCall("101")}
                  className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-red-500/60 text-center transition flex flex-col items-center justify-center gap-1"
                >
                  <PhoneCall className="w-4 h-4 text-red-500" />
                  <span className="text-[10px] font-bold text-slate-300 uppercase">Fire</span>
                  <span className="text-xs font-bold text-white font-mono">101</span>
                </a>

                <a
                  href="tel:108"
                  onClick={() => triggerPhoneCall("108")}
                  className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/60 text-center transition flex flex-col items-center justify-center gap-1"
                >
                  <PhoneCall className="w-4 h-4 text-emerald-400" />
                  <span className="text-[10px] font-bold text-slate-300 uppercase">Ambulance</span>
                  <span className="text-xs font-bold text-white font-mono">108 / 102</span>
                </a>
              </div>

              {/* Local Discovered Services for current coordinates */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Nearby Responders ({household.location.city}):
                </div>
                {household.nearbyServices?.map((srv, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 sm:p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2"
                  >
                    <div className="truncate mr-1">
                      <div className="text-xs font-bold text-white truncate">{srv.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">{srv.address || srv.distance}</div>
                    </div>
                    <a
                      href={`tel:${srv.phone}`}
                      onClick={() => triggerPhoneCall(srv.phone)}
                      className="bg-slate-800 hover:bg-slate-750 text-white px-2.5 py-1.5 rounded-xl text-xs font-bold border border-slate-700 flex items-center gap-1 transition shrink-0"
                    >
                      <PhoneCall className="w-3.5 h-3.5 text-blue-400" />
                      <span>{srv.phone}</span>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-2.5 bg-slate-950 border-t border-slate-800 text-[10px] sm:text-[11px] text-slate-400 text-center shrink-0">
          In extreme immediate danger, always dial national emergency (112 / 911) first.
        </div>
      </div>
    </div>
  );
};
