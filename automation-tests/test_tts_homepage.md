# Test Documentation — test_tts_homepage.py

**Testing Level:** System Testing (Smoke Tests)
**Tool:** Playwright (Python)
**Application Under Test:** https://text-to-speech-wcii.onrender.com

---

| Test Case ID | Test Scenario | Test Steps | Test Data | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|
| TC-SMOKE-001 | Verify the homepage loads with the correct page title | 1. Navigate to the live application URL<br>2. Check the browser tab title | Live URL: text-to-speech-wcii.onrender.com | Page title should be "Text to Speech - Gemini 3.1 Flash TTS" | Title matched exactly | ✅ Pass |
| TC-SMOKE-002 | Verify the "Select Voice Persona" section is visible on page load | 1. Navigate to the live application URL<br>2. Search for the text "Select Voice Persona" on the page | Live URL | The voice persona selection section should be visible to the user | Element was visible | ✅ Pass |
| TC-SMOKE-003 | Verify the "Convert to Speech" button is present and visible | 1. Navigate to the live application URL<br>2. Search for a button with the accessible name "Convert to Speech" | Live URL | The Convert to Speech button should be visible on the page | Button was visible | ✅ Pass |

## Summary

| Total Test Cases | Passed | Failed |
|---|---|---|
| 3 | 3 | 0 |

## Known Issue Observed During Manual Testing

| Issue ID | Description | Steps to Reproduce | Severity |
|---|---|---|---|
| BUG-TTS-001 | "Synthesis Error" (503 - Model UNAVAILABLE) occurs intermittently when the Gemini TTS model is experiencing high demand, especially with very large text inputs (1000+ words) | 1. Go to the live app<br>2. Enter a large script (1300+ words)<br>3. Click "Convert to Speech" | Medium (intermittent, server-side, not caused by application code) |

**Planned Fix:** Implement text chunking on the backend to split large inputs into smaller pieces before sending to the Gemini API, reducing the likelihood of overload errors.

## How to Run

```powershell
cd automation-tests
venv\Scripts\activate
pytest test_tts_homepage.py --headed
```
