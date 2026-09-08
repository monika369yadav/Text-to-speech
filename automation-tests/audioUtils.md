# Test Documentation — audioUtils.test.ts

**Testing Level:** Unit Testing
**Tool:** Vitest
**Functions Under Test:** `convertPcmToWav()`, `convertPcmToMp3()` (from `server.ts`)

---

| Test Case ID | Test Scenario | Test Steps | Test Data | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|
| TC-UNIT-001 | Verify WAV header is correctly added to raw PCM audio data | 1. Create a fake empty PCM buffer (16 bytes)<br>2. Call `convertPcmToWav()` with sampleRate=24000, channels=1, bitsPerSample=16<br>3. Read the first 4 bytes of the returned buffer | Empty 16-byte buffer | Output buffer should start with the ASCII text "RIFF" (a valid WAV file signature) | Output started with "RIFF" | ✅ Pass |
| TC-UNIT-002 | Verify function does not double-wrap data that is already in WAV format | 1. Create a buffer that already starts with "RIFF...."<br>2. Call `convertPcmToWav()` on this buffer | Buffer starting with "RIFF" text | The function should return the buffer unchanged (no second header added) | Returned buffer was identical to input | ✅ Pass |
| TC-UNIT-003 | Verify MP3 conversion produces non-empty output for valid PCM input | 1. Create a fake PCM buffer of 1000 bytes<br>2. Call `convertPcmToMp3()` with sampleRate=24000, channels=1, kbps=128 | 1000-byte buffer of silence | Returned MP3 buffer length should be greater than 0 | MP3 buffer length > 0 | ✅ Pass |

## Summary

| Total Test Cases | Passed | Failed |
|---|---|---|
| 3 | 3 | 0 |

## How to Run

```powershell
cd text-to-speech
npx vitest run
```
