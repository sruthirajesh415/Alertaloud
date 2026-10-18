/**
 * Robust Voice SOS Recorder Engine
 * Supports real microphone capture across browsers (Chrome, Firefox, Safari/iOS)
 * and seamless fallback simulation when microphone is restricted by browser sandbox/iframe permissions policy.
 */

export interface RecordingResult {
  blob: Blob;
  base64: string;
  url: string;
  mimeType: string;
  isSimulated?: boolean;
}

// Check which audio MIME types are supported by the browser MediaRecorder
export function getSupportedAudioMimeType(): string {
  if (typeof window === "undefined" || typeof MediaRecorder === "undefined") {
    return "";
  }
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
    "audio/wav",
  ];
  for (const candidate of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(candidate)) {
        return candidate;
      }
    } catch {
      // Continue
    }
  }
  return "";
}

/**
 * Converts any Blob to raw base64 string (without the data: prefix)
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      if (result) {
        const base64Clean = result.includes(",") ? result.split(",")[1] : result;
        resolve(base64Clean);
      } else {
        resolve("");
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(blob);
  });
}

/**
 * Creates a valid PCM 16-bit Mono WAV Blob from raw audio samples
 */
export function createWavBlobFromSamples(samples: Float32Array, sampleRate: number = 22050): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  // Helper to write ASCII strings to DataView
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  // RIFF Chunk
  writeString(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, "WAVE");

  // "fmt " Sub-Chunk
  writeString(12, "fmt ");
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
  view.setUint16(22, 1, true); // NumChannels (1 = Mono)
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * 2, true); // ByteRate (SampleRate * NumChannels * BitsPerSample/8)
  view.setUint16(32, 2, true); // BlockAlign (NumChannels * BitsPerSample/8)
  view.setUint16(34, 16, true); // BitsPerSample (16 bits)

  // "data" Sub-Chunk
  writeString(36, "data");
  view.setUint32(40, samples.length * 2, true);

  // Write PCM audio samples (clamped between -1.0 and 1.0)
  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Blob([buffer], { type: "audio/wav" });
}

/**
 * Generates an audible emergency beacon WAV audio file when real microphone is unavailable.
 * This ensures the user is never blocked and an audible dispatch exists.
 */
export async function generateEmergencyAudioBlob(
  durationSec: number = 3,
  message: string = "Emergency SOS Beacon"
): Promise<RecordingResult> {
  const safeDuration = Math.min(
    30,
    Math.max(1, typeof durationSec === "number" && isFinite(durationSec) && durationSec > 0 ? Math.round(durationSec) : 3)
  );
  const sampleRate = 22050;
  const totalSamples = Math.floor(sampleRate * safeDuration);
  const samples = new Float32Array(totalSamples);

  // Generate an audible two-tone emergency beacon audio wave
  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    // Tone 1: 880 Hz alternating with 660 Hz every 0.3s
    const freq = Math.floor(t / 0.3) % 2 === 0 ? 880 : 660;
    const wave = Math.sin(2 * Math.PI * freq * t);
    // Envelope to prevent clipping
    const envelope = Math.min(1, Math.sin(Math.PI * (t / safeDuration)));
    samples[i] = wave * 0.4 * envelope;
  }

  const blob = createWavBlobFromSamples(samples, sampleRate);
  const base64 = await blobToBase64(blob);
  const url = URL.createObjectURL(blob);

  return {
    blob,
    base64,
    url,
    mimeType: "audio/wav",
    isSimulated: true,
  };
}
