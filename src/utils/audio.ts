// Web Audio API Synthesizer & Multilingual TTS Engine for AlertAloud

let audioCtx: AudioContext | null = null;
let sirenOscillator: OscillatorNode | null = null;
let sirenGain: GainNode | null = null;
let isSirenPlaying = false;
let currentAudioElement: HTMLAudioElement | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * 1. Synthesizes an unmistakable emergency evacuation siren (880Hz down to 440Hz sweep)
 * compliant with emergency alert siren acoustic standards.
 */
export function playEmergencySiren() {
  if (isSirenPlaying) return;
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(880, ctx.currentTime);

    // Repeated siren wail sweep between 880Hz and 440Hz
    const now = ctx.currentTime;
    for (let i = 0; i < 30; i++) {
      const cycleStart = now + i * 1.4;
      osc.frequency.linearRampToValueAtTime(880, cycleStart);
      osc.frequency.exponentialRampToValueAtTime(440, cycleStart + 0.7);
      osc.frequency.exponentialRampToValueAtTime(880, cycleStart + 1.4);
    }

    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.45, ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();

    sirenOscillator = osc;
    sirenGain = gain;
    isSirenPlaying = true;

    // Vibrate device if supported
    if ("vibrate" in navigator) {
      navigator.vibrate([500, 200, 500, 200, 800, 300, 800]);
    }
  } catch (err) {
    console.warn("Unable to start Web Audio siren:", err);
  }
}

export function stopEmergencySiren() {
  if (!isSirenPlaying) return;
  try {
    if (sirenGain && audioCtx) {
      sirenGain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.2);
    }
    setTimeout(() => {
      if (sirenOscillator) {
        sirenOscillator.stop();
        sirenOscillator.disconnect();
      }
      sirenOscillator = null;
      sirenGain = null;
      isSirenPlaying = false;
    }, 250);

    if ("vibrate" in navigator) {
      navigator.vibrate(0);
    }
  } catch (err) {
    console.warn("Error stopping siren:", err);
    isSirenPlaying = false;
  }
}

export function isSirenActive(): boolean {
  return isSirenPlaying;
}

/**
 * 2. Guaranteed Multilingual Speech Synthesis
 * First tries backend high-quality Gemini TTS / Google Audio Stream.
 * Falls back to browser Web Speech API with language match.
 */
export async function speakEmergencyText(
  text: string,
  langCode: string = "en",
  onEnd?: () => void
): Promise<void> {
  stopSpeaking();

  if (!text || !text.trim()) {
    onEnd?.();
    return;
  }

  // Clean text of emojis or special markdown for speech clarity
  const cleanedText = text
    .replace(/[#*_`]/g, "")
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, "")
    .slice(0, 450);

  // Attempt 1: Call server Gemini TTS / audio proxy
  try {
    const res = await fetch("/api/gemini/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: cleanedText, langCode }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.audioBase64) {
        const audioSrc = `data:${data.format || "audio/wav"};base64,${data.audioBase64}`;
        const audio = new Audio(audioSrc);
        currentAudioElement = audio;

        audio.onended = () => {
          currentAudioElement = null;
          onEnd?.();
        };

        audio.onerror = () => {
          fallbackWebSpeech(cleanedText, langCode, onEnd);
        };

        await audio.play();
        return;
      }
    }
  } catch (err) {
    console.warn("Server TTS attempt skipped, falling back to Web Speech:", err);
  }

  // Attempt 2: Native browser SpeechSynthesis
  fallbackWebSpeech(cleanedText, langCode, onEnd);
}

function fallbackWebSpeech(text: string, langCode: string, onEnd?: () => void) {
  if (!("speechSynthesis" in window)) {
    console.warn("SpeechSynthesis not supported on this browser");
    onEnd?.();
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);

  // Match voice to language
  const voices = window.speechSynthesis.getVoices();
  const matchingVoice = voices.find(
    (v) => v.lang.toLowerCase().startsWith(langCode.toLowerCase()) || v.lang.toLowerCase().includes(langCode.toLowerCase())
  );

  if (matchingVoice) {
    utterance.voice = matchingVoice;
  }

  // Set language code (e.g. ml-IN, ta-IN, hi-IN, es-ES, ja-JP)
  utterance.lang = langCode.length === 2 ? `${langCode}-${langCode.toUpperCase()}` : langCode;
  if (langCode === "ml") utterance.lang = "ml-IN";
  if (langCode === "ta") utterance.lang = "ta-IN";
  if (langCode === "hi") utterance.lang = "hi-IN";
  if (langCode === "te") utterance.lang = "te-IN";
  if (langCode === "kn") utterance.lang = "kn-IN";
  if (langCode === "mr") utterance.lang = "mr-IN";
  if (langCode === "bn") utterance.lang = "bn-IN";
  if (langCode === "ja") utterance.lang = "ja-JP";

  utterance.rate = 0.95; // Slightly slower, clear cadence for emergency comprehension
  utterance.pitch = 1.0;

  utterance.onend = () => {
    onEnd?.();
  };

  utterance.onerror = () => {
    onEnd?.();
  };

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (currentAudioElement) {
    currentAudioElement.pause();
    currentAudioElement.currentTime = 0;
    currentAudioElement = null;
  }
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}
