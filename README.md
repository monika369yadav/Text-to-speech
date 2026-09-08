# Gemini 3.1 Flash Text-to-Speech Studio

Studio-grade AI Text-to-Speech application built with Gemini 3.1 Flash TTS, React, Express, Vite, and Tailwind CSS. Supports 24kHz studio audio synthesis, MP3/WAV export, multi-speaker dialogue, and 3 atmospheric themes (Sunrise, Afternoon, Night).

---

## 🚀 How to Run in VS Code (VS Code mein kaise chalayein)

### 1. Extract the ZIP file
Extract the downloaded ZIP file into any folder on your computer.

### 2. Open in VS Code
1. Open **Visual Studio Code**.
2. Click **File** > **Open Folder...** (or press `Ctrl + K, Ctrl + O`).
3. Select the extracted project folder.
4. Open the integrated terminal (`Ctrl + ~` or **Terminal** > **New Terminal**).

### 3. Install Dependencies
In the terminal, run:
```bash
npm install
```

### 4. Set Up Environment Variables (.env)
Create a `.env` file in the root directory (or copy from `.env.example`):
```bash
cp .env.example .env
```
Open `.env` and paste your Google Gemini API key:
```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
```
> You can get a free Gemini API key from [Google AI Studio](https://aistudio.google.com/).

### 5. Start the Development Server
Run the following command:
```bash
npm run dev
```

### 6. Open in Browser
Open your web browser and go to:
```
http://localhost:3000
```

---

## 📁 Project Structure

- `server.ts` - Express backend proxying requests to Google Gemini 3.1 Flash TTS and converting PCM to MP3/WAV.
- `src/App.tsx` - Main interactive React dashboard with single/dialogue speaker controls, style selection, theme toggling.
- `src/components/` - Visualizer, waveform player, voice personas selector, and local generation history.
- `package.json` - Scripts and dependencies.
