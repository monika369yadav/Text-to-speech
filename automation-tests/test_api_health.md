# Test Documentation — test_api_health.py

**Testing Level:** Integration Testing (API Testing)
**Tool:** Python `requests` library + pytest
**Endpoint Under Test:** `GET /api/health`
**Application Under Test:** https://text-to-speech-wcii.onrender.com

---

| Test Case ID | Test Scenario                                                                   | Test Steps                                                                                                    | Test Data                            | Expected Result                                            | Actual Result                                  | Status  |
| ------------ | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------ | ---------------------------------------------------------- | ---------------------------------------------- | ------- |
| TC-API-001   | Verify the health check endpoint returns a 200 OK status                        | 1. Send a GET request to `/api/health`<br>2. Check the response status code                                   | No request body needed (GET request) | Status code should be 200                                  | Status code was 200                            | ✅ Pass |
| TC-API-002   | Verify the health check endpoint returns the correct response structure         | 1. Send a GET request to `/api/health`<br>2. Parse the JSON response<br>3. Check the `status` field           | No request body needed               | Response should contain a `status` field with value `"ok"` | `status` field was present and equal to `"ok"` | ✅ Pass |
| TC-API-003   | Verify the health check confirms the Gemini API key is configured on the server | 1. Send a GET request to `/api/health`<br>2. Parse the JSON response<br>3. Check the `apiKeyConfigured` field | No request body needed               | `apiKeyConfigured` should be `true`                        | `apiKeyConfigured` was `true`                  | ✅ Pass |

## Summary

| Total Test Cases | Passed | Failed |
| ---------------- | ------ | ------ |
| 3                | 3      | 0      |

## How to Run

```powershell
cd automation-tests
venv\Scripts\activate
pytest test_api_health.py -v
```