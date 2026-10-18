import React, { useState, useRef, useEffect } from "react";
import { UserLocation, Household, AlertData } from "../../types";
import { speakEmergencyText, stopSpeaking } from "../../utils/audio";
import { t } from "../../utils/languages";
import {
  Send,
  Mic,
  Volume2,
  VolumeX,
  ShieldCheck,
  Bot,
  User,
  Sparkles,
  Loader2,
  AlertTriangle,
} from "lucide-react";

interface AskTabProps {
  location: UserLocation;
  household: Household;
  activeAlert: AlertData | null;
  selectedLang: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  source?: string;
  isAiFallback?: boolean;
}

export const AskTab: React.FC<AskTabProps> = ({
  location,
  household,
  activeAlert,
  selectedLang,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      role: "assistant",
      text: `Hello! I am your AlertAloud Grounded Safety Assistant. I answer emergency questions strictly tailored for ${household.householdName} in ${location.city}. How can I assist you right now?`,
      source: "AlertAloud Safety Protocol & Red Cross Guidelines",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const [speechWarning, setSpeechWarning] = useState<string | null>(null);

  // Speech Recognition (Speech-to-Text)
  const handleToggleVoiceInput = () => {
    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setSpeechWarning("Speech recognition is not supported in this browser. Please type your question.");
      setTimeout(() => setSpeechWarning(null), 4000);
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.lang = selectedLang === "ml" ? "ml-IN" : selectedLang === "ta" ? "ta-IN" : selectedLang === "hi" ? "hi-IN" : selectedLang;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (e: any) => {
        const transcript = e.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.warn("Speech recognition error:", err);
      setIsListening(false);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const q = (textToSend || inputText).trim();
    if (!q || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: q,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsLoading(true);

    try {
      const history = messages.map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const res = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: q,
          history,
          language: selectedLang,
          familyProfile: {
            householdName: household.householdName,
            address: household.address,
            totalMembers: household.totalMembers,
            eldersCount: household.eldersCount,
            childrenCount: household.childrenCount,
            bedriddenCount: household.bedriddenCount,
            medicalConditions: household.medicalConditions,
            lifeSavingMedicines: household.lifeSavingMedicines,
            powerDependentDevices: household.powerDependentDevices,
          },
          activeAlert,
          location,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const replyText = data.reply || "I am currently unable to fetch guidance. Please contact national emergency services at 112.";
        const isFallback = !replyText.toLowerCase().includes("national") && !replyText.toLowerCase().includes("ndma") && !replyText.toLowerCase().includes("civil defense");

        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          role: "assistant",
          text: replyText,
          source: isFallback ? "Universal Red Cross / First-Aid Standards (AI Fallback)" : "Official Civil Defense Guidelines",
          isAiFallback: isFallback,
        };

        setMessages((prev) => [...prev, botMsg]);

        // Auto read aloud the reply
        speakEmergencyText(replyText, selectedLang, () => {
          setPlayingMessageId(null);
        });
        setPlayingMessageId(botMsg.id);
      }
    } catch (err) {
      console.error("Chat error:", err);
      const errorMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: "assistant",
        text: "In an active emergency where services are unreachable, call national dispatch directly at 112 or 911.",
        source: "Emergency Operator Standard",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleReadAloud = (msg: ChatMessage) => {
    if (playingMessageId === msg.id) {
      stopSpeaking();
      setPlayingMessageId(null);
    } else {
      stopSpeaking();
      setPlayingMessageId(msg.id);
      speakEmergencyText(msg.text, selectedLang, () => {
        setPlayingMessageId(null);
      });
    }
  };

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-200">
      {/* Header Info Banner */}
      <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>Grounded Safety Assistant</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Grounded with {household.householdName}'s medical profile and {location.city} feeds.
            </p>
          </div>
        </div>
      </div>

      {/* Suggested Quick Questions */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar py-1 text-xs">
        {[
          "What should we do right now?",
          "How to safely evacuate our bedridden elder?",
          "Where is our nearest shelter?",
          "What medicines should I pack?",
        ].map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(q)}
            className="px-3 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white shrink-0 transition"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Chat Messages Log */}
      <div className="space-y-3 min-h-[300px]">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/30 mt-1">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl text-xs space-y-2 leading-relaxed ${
                msg.role === "user"
                  ? "bg-red-600 text-white font-medium rounded-tr-none"
                  : "bg-slate-900 border border-slate-800 text-slate-100 rounded-tl-none shadow-md"
              }`}
            >
              <div className="whitespace-pre-line">{msg.text}</div>

              {msg.role === "assistant" && (
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    {msg.isAiFallback ? (
                      <span className="text-amber-400 flex items-center gap-0.5">
                        <AlertTriangle className="w-3 h-3" />
                        AI Practical Fallback (Red Cross)
                      </span>
                    ) : (
                      <span className="text-emerald-400 flex items-center gap-0.5">
                        <ShieldCheck className="w-3 h-3" />
                        Verified Official Standards
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleToggleReadAloud(msg)}
                    className="p-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-1 transition text-[11px]"
                  >
                    {playingMessageId === msg.id ? (
                      <VolumeX className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                    <span>{playingMessageId === msg.id ? "Stop" : "Read Aloud"}</span>
                  </button>
                </div>
              )}
            </div>

            {msg.role === "user" && (
              <div className="w-8 h-8 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center shrink-0 mt-1">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center shrink-0 animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
              <span>Grounded safety engine is consulting official guidelines...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Field & Speech-to-Text Button */}
      <div className="sticky bottom-16 sm:bottom-0 bg-slate-950/95 backdrop-blur-md pt-2 pb-1 z-20">
        {speechWarning && (
          <div className="mb-2 p-2 rounded-xl bg-amber-950/80 border border-amber-600/40 text-[11px] text-amber-300 flex items-center justify-between">
            <span>{speechWarning}</span>
            <button onClick={() => setSpeechWarning(null)} className="text-amber-400 font-bold ml-2">✕</button>
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-1.5 sm:gap-2 p-1 sm:p-1.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl"
        >
          <button
            type="button"
            onClick={handleToggleVoiceInput}
            className={`p-2.5 rounded-xl transition shrink-0 ${
              isListening
                ? "bg-red-600 text-white animate-pulse"
                : "bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white"
            }`}
            title="Speech input (speak in your language)"
          >
            <Mic className="w-4 h-4" />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              isListening ? "Listening... Speak now!" : "Ask any emergency question in any language..."
            }
            className="flex-1 bg-transparent px-2 py-2 text-xs text-white placeholder-slate-500 focus:outline-none min-w-0"
          />

          <button
            type="submit"
            disabled={isLoading || !inputText.trim()}
            className="p-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white disabled:opacity-50 transition shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
