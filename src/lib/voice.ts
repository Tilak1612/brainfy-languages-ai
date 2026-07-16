// Client-side voice helpers: microphone capture → 16 kHz mono PCM for the STT
// endpoint, and TTS playback. All NVIDIA calls happen server-side (/api/stt,
// /api/tts); this module only handles audio in the browser.

/** True if the server has NVIDIA voice (STT/TTS) configured. */
export async function checkVoice(): Promise<boolean> {
  try {
    const r = await fetch("/api/health");
    if (!r.ok) return false;
    const j = await r.json();
    return !!j.voice;
  } catch {
    return false;
  }
}

/** Records the mic and returns 16 kHz mono 16-bit PCM bytes. */
export class Recorder {
  private media?: MediaStream;
  private rec?: MediaRecorder;
  private chunks: BlobPart[] = [];

  async start() {
    this.media = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.chunks = [];
    this.rec = new MediaRecorder(this.media);
    this.rec.ondataavailable = (e) => e.data.size && this.chunks.push(e.data);
    this.rec.start();
  }

  stop(): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const rec = this.rec;
      if (!rec) return reject(new Error("not recording"));
      rec.onstop = async () => {
        try {
          const blob = new Blob(this.chunks, { type: rec.mimeType || "audio/webm" });
          const buf = await blob.arrayBuffer();
          const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          const ctx = new AC();
          const audio = await ctx.decodeAudioData(buf);
          const pcm = toPcm16Mono16k(audio);
          void ctx.close();
          this.media?.getTracks().forEach((t) => t.stop());
          resolve(pcm);
        } catch (e) {
          reject(e);
        }
      };
      rec.stop();
    });
  }
}

function toPcm16Mono16k(audio: AudioBuffer): ArrayBuffer {
  const src = audio.getChannelData(0);
  const ratio = audio.sampleRate / 16000;
  const len = Math.floor(src.length / ratio);
  const out = new Int16Array(len);
  for (let i = 0; i < len; i++) {
    const s = Math.max(-1, Math.min(1, src[Math.floor(i * ratio)] || 0));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out.buffer;
}

/** Send PCM to the ASR endpoint, get a transcript. */
export async function transcribe(pcm: ArrayBuffer): Promise<string> {
  const r = await fetch("/api/stt", {
    method: "POST",
    headers: { "content-type": "application/octet-stream" },
    body: pcm,
  });
  if (!r.ok) throw new Error("stt " + r.status);
  const j = await r.json();
  return (j.text as string) || "";
}

/** Synthesize `text` via the TTS endpoint and play it. */
export async function speak(text: string): Promise<void> {
  try {
    const r = await fetch("/api/tts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!r.ok) return;
    const url = URL.createObjectURL(await r.blob());
    const audio = new Audio(url);
    audio.onended = () => URL.revokeObjectURL(url);
    await audio.play().catch(() => {});
  } catch {
    /* ignore playback errors */
  }
}
