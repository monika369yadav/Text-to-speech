import { describe, expect, it } from "vitest";
import { convertPcmToMp3, convertPcmToWav } from "../server";

describe("convertPcmToWav", () => {
  it("should add a valid WAV header to raw PCM data", () => {
    // Chhota sa fake PCM data banate hain testing ke liye (16 bytes)
    const fakePcmData = Buffer.alloc(16);

    const wavBuffer = convertPcmToWav(fakePcmData, 24000, 1, 16);

    // WAV file hamesha "RIFF" se shuru hoti hai
    const header = wavBuffer.toString("utf8", 0, 4);
    expect(header).toBe("RIFF");
  });

  it("should not modify data that is already in WAV format", () => {
    // Ek buffer banate hain jo already "RIFF" se start hota hai
    const alreadyWavBuffer = Buffer.from("RIFF....WAVEfmt ");

    const result = convertPcmToWav(alreadyWavBuffer, 24000, 1, 16);

    // Result exactly same hona chahiye, kyunki already WAV hai
    expect(result).toEqual(alreadyWavBuffer);
  });
});

describe("convertPcmToMp3", () => {
  it("should return a non-empty buffer for valid PCM input", () => {
    // 1000 bytes ka fake audio data
    const fakePcmData = Buffer.alloc(1000);

    const mp3Buffer = convertPcmToMp3(fakePcmData, 24000, 1, 128);

    // MP3 output khaali nahi hona chahiye
    expect(mp3Buffer.length).toBeGreaterThan(0);
  });
});
