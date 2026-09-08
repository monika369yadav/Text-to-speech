import { Mp3Encoder } from "@breezystack/lamejs";
import { GoogleGenAI, Modality } from "@google/genai";
import dotenv from "dotenv";
import express from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Helper function to convert raw 16-bit PCM buffer to MP3
export function convertPcmToMp3(
  pcmBuffer: Buffer,
  sampleRate = 24000,
  numChannels = 1,
  kbps = 128,
): Buffer {
  try {
    const encoder = new Mp3Encoder(numChannels, sampleRate, kbps);
    const sampleCount = Math.floor(pcmBuffer.length / 2);
    const samples = new Int16Array(sampleCount);
    for (let i = 0; i < sampleCount; i++) {
      samples[i] = pcmBuffer.readInt16LE(i * 2);
    }

    const mp3Chunks: Buffer[] = [];
    const sampleBlockSize = 1152;
    for (let i = 0; i < samples.length; i += sampleBlockSize) {
      const chunk = samples.subarray(i, i + sampleBlockSize);
      const mp3buf = encoder.encodeBuffer(chunk);
      if (mp3buf.length > 0) {
        mp3Chunks.push(Buffer.from(mp3buf));
      }
    }
    const flushBuf = encoder.flush();
    if (flushBuf.length > 0) {
      mp3Chunks.push(Buffer.from(flushBuf));
    }
    return Buffer.concat(mp3Chunks);
  } catch (err) {
    console.error("MP3 conversion failed:", err);
    return Buffer.alloc(0);
  }
}

// Helper function to wrap raw PCM audio into standard WAV container
export function convertPcmToWav(
  pcmBuffer: Buffer,
  sampleRate = 24000,
  numChannels = 1,
  bitsPerSample = 16,
): Buffer {
  // If already WAV formatted (starts with RIFF), return intact
  if (pcmBuffer.length >= 4 && pcmBuffer.toString("utf8", 0, 4) === "RIFF") {
    return pcmBuffer;
  }

  const header = Buffer.alloc(44);
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcmBuffer.length;
  const chunkSize = 36 + dataSize;

  header.write("RIFF", 0);
  header.writeUInt32LE(chunkSize, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16); // Subchunk1Size for PCM (16 bytes)
  header.writeUInt16LE(1, 20); // AudioFormat 1 = PCM (uncompressed)
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmBuffer]);
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    model: "gemini-3.1-flash-tts-preview",
    apiKeyConfigured: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Download full project ZIP endpoint
app.get("/api/download-zip", (_req, res) => {
  const zipPath = path.join(process.cwd(), "public", "project.zip");
  if (fs.existsSync(zipPath)) {
    res.download(zipPath, "tts-gemini-studio-project.zip");
  } else {
    res.status(404).json({ error: "Project zip not found" });
  }
});

// Text-to-Speech generation endpoint
app.post("/api/tts", async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error:
          "GEMINI_API_KEY environment variable is not configured. Please set your API key in Settings > Secrets.",
      });
    }

    const {
      text,
      voice = "Kore",
      stylePrompt,
      mode = "single",
      speakers,
    } = req.body;

    if (!text || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({
        success: false,
        error: "Text content is required.",
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    let promptText = text.trim();
    let speechConfig: Record<string, any>;

    if (
      mode === "dialogue" &&
      Array.isArray(speakers) &&
      speakers.length >= 2
    ) {
      const spk1 = speakers[0];
      const spk2 = speakers[1];
      const s1Name = spk1.speaker?.trim() || "Speaker 1";
      const s2Name = spk2.speaker?.trim() || "Speaker 2";
      const s1Voice = spk1.voice || "Kore";
      const s2Voice = spk2.voice || "Puck";

      promptText = `TTS the following conversation between ${s1Name} and ${s2Name}:\n${promptText}`;

      speechConfig = {
        multiSpeakerVoiceConfig: {
          speakerVoiceConfigs: [
            {
              speaker: s1Name,
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: s1Voice },
              },
            },
            {
              speaker: s2Name,
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: s2Voice },
              },
            },
          ],
        },
      };
    } else {
      // Single speaker
      if (stylePrompt && stylePrompt.trim()) {
        promptText = `Say with a ${stylePrompt.trim()} tone: ${promptText}`;
      }

      speechConfig = {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: voice || "Kore" },
        },
      };
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: promptText }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig,
      },
    });

    const candidate = response.candidates?.[0];
    const part = candidate?.content?.parts?.find((p) => p.inlineData?.data);

    if (!part?.inlineData?.data) {
      const finishReason = candidate?.finishReason || "UNKNOWN";
      return res.status(500).json({
        success: false,
        error: `Model completed without returning audio data (Finish reason: ${finishReason}). Try adjusting your input text.`,
      });
    }

    const rawBase64 = part.inlineData.data;
    const rawBuffer = Buffer.from(rawBase64, "base64");
    const wavBuffer = convertPcmToWav(rawBuffer, 24000, 1, 16);
    const wavBase64 = wavBuffer.toString("base64");

    const mp3Buffer = convertPcmToMp3(rawBuffer, 24000, 1, 128);
    const mp3Base64 =
      mp3Buffer.length > 0 ? mp3Buffer.toString("base64") : undefined;

    // Estimate duration: 24,000 samples/sec * 2 bytes/sample = 48,000 bytes/sec
    const durationSeconds = +(rawBuffer.length / 48000).toFixed(2);

    return res.json({
      success: true,
      audioBase64: wavBase64,
      mp3Base64,
      mimeType: "audio/wav",
      sampleRate: 24000,
      durationEstimate: durationSeconds,
    });
  } catch (error: any) {
    console.error("TTS generation error:", error);
    const message =
      error?.message || "Failed to generate speech with Gemini TTS.";
    return res.status(500).json({
      success: false,
      error: message,
    });
  }
});

async function startServer() {
  // Vite middleware for dev or static serving in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`TTS Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
