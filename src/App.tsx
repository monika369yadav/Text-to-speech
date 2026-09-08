import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Volume2,
  Sparkles,
  Users,
  User,
  RotateCcw,
  AlertCircle,
  Copy,
  Check,
  Radio,
  Settings2,
  Sunrise,
  Sun,
  Moon,
  Music,
  Download,
} from 'lucide-react';
import {
  VoiceName,
  TtsMode,
  DialogueSpeakerConfig,
  GeneratedClip,
  TtsResponsePayload,
  ThemeMode,
} from './types';
import { VoiceSelector, AVAILABLE_VOICES } from './components/VoiceSelector';
import { AudioVisualizerPlayer } from './components/AudioVisualizerPlayer';
import { AudioHistory } from './components/AudioHistory';

const PRESET_SAMPLES = [
  {
    label: 'Cheerful Greeting',
    tone: 'cheerful',
    text: 'Good morning and welcome! Today is going to be a wonderful day filled with fresh opportunities and creative breakthroughs.',
  },
  {
    label: 'Story Narration',
    tone: 'dramatic and cinematic',
    text: 'Beyond the mist of the ancient valley, a lone watchtower stood silently beneath the starlit sky, waiting for the traveler to arrive.',
  },
  {
    label: 'Tech Announcement',
    tone: 'confident and professional',
    text: 'Introducing the next generation of conversational speech. Powered by Gemini 3.1 Flash TTS, delivering studio-grade 24kHz clarity and natural nuance.',
  },
  {
    label: 'Guided Relaxation',
    tone: 'calm, soft, and soothing',
    text: 'Close your eyes, take a slow deep breath in through your nose, and let go of all tension as you gently exhale.',
  },
];

const DIALOGUE_SAMPLE = `Alex: Hey Jordan, have you listened to the new speech synthesis model?
Jordan: Yes, the 24kHz clarity and emotional inflection sound remarkably authentic!
Alex: Exactly, it captures natural rhythm and subtle pauses effortlessly.`;

const TONE_OPTIONS = [
  { label: 'Natural', value: '' },
  { label: 'Cheerful', value: 'cheerful and bright' },
  { label: 'Calm & Soothing', value: 'calm and gentle' },
  { label: 'Professional', value: 'clear and authoritative' },
  { label: 'Dramatic Story', value: 'dramatic and expressive' },
  { label: 'Whispered', value: 'whispered and intimate' },
];

export default function App() {
  // Theme state: 'sunrise' | 'afternoon' | 'night'
  const [themeMode, setThemeMode] = useState<ThemeMode>('afternoon');

  const [mode, setMode] = useState<TtsMode>('single');
  const [text, setText] = useState<string>(PRESET_SAMPLES[0].text);
  const [selectedVoice, setSelectedVoice] = useState<VoiceName>('Kore');
  const [selectedTone, setSelectedTone] = useState<string>('cheerful and bright');
  const [customTone, setCustomTone] = useState<string>('');
  const [isCustomToneActive, setIsCustomToneActive] = useState<boolean>(false);

  // Dialogue speakers
  const [speakers, setSpeakers] = useState<DialogueSpeakerConfig[]>([
    { speaker: 'Alex', voice: 'Kore' },
    { speaker: 'Jordan', voice: 'Puck' },
  ]);

  // Generation status
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active audio clip & History
  const [currentClip, setCurrentClip] = useState<GeneratedClip | null>(null);
  const [history, setHistory] = useState<GeneratedClip[]>([]);
  const [copiedText, setCopiedText] = useState<boolean>(false);

  // Load theme and history from localStorage
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('tts_theme_mode') as ThemeMode | null;
      if (savedTheme && ['sunrise', 'afternoon', 'night'].includes(savedTheme)) {
        setThemeMode(savedTheme);
      }
    } catch (e) {
      console.warn('Could not load theme:', e);
    }

    try {
      const saved = localStorage.getItem('tts_history_clips');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setHistory(parsed);
          if (parsed.length > 0) {
            setCurrentClip(parsed[0]);
          }
        }
      }
    } catch (e) {
      console.warn('Could not load history:', e);
    }
  }, []);

  const changeTheme = (newMode: ThemeMode) => {
    setThemeMode(newMode);
    try {
      localStorage.setItem('tts_theme_mode', newMode);
    } catch (e) {
      console.warn('Could not save theme:', e);
    }
  };

  const saveToHistory = (clip: GeneratedClip) => {
    setHistory((prev) => {
      const updated = [clip, ...prev.filter((c) => c.id !== clip.id)].slice(0, 15);
      try {
        localStorage.setItem('tts_history_clips', JSON.stringify(updated));
      } catch (e) {
        console.warn('Could not save history:', e);
      }
      return updated;
    });
  };

  const handleGenerate = async () => {
    if (!text.trim()) {
      setErrorMessage('Please provide some text to convert to speech.');
      return;
    }

    setErrorMessage(null);
    setIsGenerating(true);

    try {
      const effectiveTone = isCustomToneActive ? customTone : selectedTone;

      const payload = {
        text: text.trim(),
        voice: selectedVoice,
        stylePrompt: effectiveTone,
        mode,
        speakers: mode === 'dialogue' ? speakers : undefined,
      };

      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data: TtsResponsePayload = await res.json();

      if (!res.ok || !data.success || !data.audioBase64) {
        throw new Error(data.error || 'Failed to synthesize speech.');
      }

      const audioUrl = `data:audio/wav;base64,${data.audioBase64}`;
      const mp3Url = data.mp3Base64 ? `data:audio/mp3;base64,${data.mp3Base64}` : undefined;

      const newClip: GeneratedClip = {
        id: Date.now().toString(),
        createdAt: Date.now(),
        mode,
        text: text.trim(),
        voice: mode === 'dialogue' ? `${speakers[0].voice} & ${speakers[1].voice}` : selectedVoice,
        stylePrompt: effectiveTone || undefined,
        audioUrl,
        audioBase64: data.audioBase64,
        mp3Url,
        mp3Base64: data.mp3Base64,
        duration: data.durationEstimate,
      };

      setCurrentClip(newClip);
      saveToHistory(newClip);
    } catch (err: any) {
      console.error('Speech generation error:', err);
      setErrorMessage(
        err.message || 'An unexpected error occurred while contacting the Gemini TTS model.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectPreset = (sample: (typeof PRESET_SAMPLES)[0]) => {
    setText(sample.text);
    setSelectedTone(sample.tone);
    setIsCustomToneActive(false);
    setErrorMessage(null);
  };

  const handleSwitchToDialogue = () => {
    setMode('dialogue');
    setText(DIALOGUE_SAMPLE);
    setErrorMessage(null);
  };

  const handleSwitchToSingle = () => {
    setMode('single');
    setText(PRESET_SAMPLES[0].text);
    setErrorMessage(null);
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleDeleteHistoryClip = (id: string) => {
    setHistory((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      try {
        localStorage.setItem('tts_history_clips', JSON.stringify(updated));
      } catch (e) {
        console.warn('Save error:', e);
      }
      return updated;
    });
    if (currentClip?.id === id) {
      setCurrentClip(null);
    }
  };

  const handleClearAllHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem('tts_history_clips');
    } catch (e) {
      console.warn('Clear error:', e);
    }
  };

  // Theme-specific CSS styles
  const isNight = themeMode === 'night';
  const isSunrise = themeMode === 'sunrise';

  const containerBg = isNight
    ? 'bg-[#0b101f] text-slate-100'
    : isSunrise
    ? 'bg-[#fdf9f4] text-stone-900'
    : 'bg-slate-50 text-slate-900';

  const headerBg = isNight
    ? 'border-slate-800/90 bg-[#111827]/90'
    : isSunrise
    ? 'border-orange-200/70 bg-[#fffaf5]/95'
    : 'border-slate-200/80 bg-white/95';

  const cardBg = isNight
    ? 'bg-[#151e32] border-slate-800 shadow-xs'
    : isSunrise
    ? 'bg-white border-orange-200/80 shadow-xs'
    : 'bg-white border-slate-200 shadow-xs';

  const primaryBtn = isNight
    ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
    : isSunrise
    ? 'bg-amber-600 hover:bg-amber-700 text-white'
    : 'bg-emerald-600 hover:bg-emerald-700 text-white';

  const brandIconBg = isNight
    ? 'bg-indigo-600 text-white'
    : isSunrise
    ? 'bg-amber-600 text-white'
    : 'bg-emerald-600 text-white';

  const textareaBg = isNight
    ? 'bg-[#0f172a] text-slate-100 border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/20'
    : isSunrise
    ? 'bg-orange-50/40 text-stone-900 border-orange-200 focus:border-amber-600 focus:ring-amber-500/20'
    : 'bg-slate-50/70 text-slate-800 border-slate-200 focus:border-emerald-600 focus:ring-emerald-500/20';

  const presetBtnClass = isNight
    ? 'bg-slate-800 text-slate-300 hover:bg-indigo-950 hover:text-indigo-300'
    : isSunrise
    ? 'bg-stone-100 text-stone-700 hover:bg-amber-100 hover:text-amber-800'
    : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700';

  return (
    <div className={`min-h-screen transition-colors duration-200 font-['Plus_Jakarta_Sans',sans-serif] ${containerBg}`}>
      {/* Top Navigation Bar */}
      <header className={`border-b sticky top-0 z-30 backdrop-blur-xs transition-colors ${headerBg}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-xs transition-colors ${brandIconBg}`}>
              <Volume2 className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight">
                  Text to Speech
                </h1>
                <span
                  className={`hidden sm:inline-flex text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                    isNight
                      ? 'bg-indigo-950 text-indigo-300 border-indigo-800'
                      : isSunrise
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  }`}
                >
                  gemini-3.1-flash-tts-preview
                </span>
              </div>
              <p className="text-xs text-slate-400">
                High-fidelity 24kHz speech synthesis with multi-format audio downloads
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Sunrise / Afternoon / Night Theme Selector */}
            <div
              id="theme-mode-selector"
              className={`flex items-center p-1 rounded-xl border transition-colors ${
                isNight
                  ? 'bg-slate-900/90 border-slate-700'
                  : isSunrise
                  ? 'bg-orange-100/60 border-orange-200'
                  : 'bg-slate-100 border-slate-200'
              }`}
            >
              {/* Sunrise Mode */}
              <button
                type="button"
                id="theme-btn-sunrise"
                onClick={() => changeTheme('sunrise')}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  themeMode === 'sunrise'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : isNight
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="Sunrise Mode (Warm golden atmosphere)"
              >
                <Sunrise className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sunrise</span>
              </button>

              {/* Afternoon Mode */}
              <button
                type="button"
                id="theme-btn-afternoon"
                onClick={() => changeTheme('afternoon')}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  themeMode === 'afternoon'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : isNight
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Afternoon Mode (Bright crisp daylight)"
              >
                <Sun className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Afternoon</span>
              </button>

              {/* Night Mode */}
              <button
                type="button"
                id="theme-btn-night"
                onClick={() => changeTheme('night')}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  themeMode === 'night'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Night Mode (Deep twilight dark canvas)"
              >
                <Moon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Night</span>
              </button>
            </div>

            <span
              className={`hidden md:inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md ${
                isNight
                  ? 'bg-slate-800 text-slate-300'
                  : isSunrise
                  ? 'bg-stone-100 text-stone-700'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              <Radio
                className={`w-3.5 h-3.5 animate-pulse ${
                  isNight
                    ? 'text-indigo-400'
                    : isSunrise
                    ? 'text-amber-600'
                    : 'text-emerald-600'
                }`}
              />
              24 kHz PCM
            </span>

            {/* Download Project ZIP button */}
            <a
              href="/api/download-zip"
              download="tts-gemini-studio-project.zip"
              id="btn-download-project-zip"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer border ${
                isNight
                  ? 'bg-slate-800/90 hover:bg-slate-750 text-indigo-300 border-indigo-900/60 hover:border-indigo-700'
                  : isSunrise
                  ? 'bg-amber-100/90 hover:bg-amber-200 text-amber-900 border-amber-300'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
              }`}
              title="Download full project code as ZIP file for VS Code"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download ZIP</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Error Alert */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-800 dark:text-red-300 flex items-start gap-3 text-sm shadow-xs"
              role="alert"
            >
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">Synthesis Error</p>
                <p className="text-xs text-red-700 dark:text-red-300 mt-0.5">{errorMessage}</p>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-xs font-semibold text-red-600 hover:text-red-800 underline cursor-pointer"
              >
                Dismiss
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Text & Voice Configuration */}
          <div className="lg:col-span-7 space-y-5">
            {/* Mode Selector Tabs */}
            <div
              className={`flex items-center justify-between p-1.5 rounded-xl border transition-colors ${cardBg}`}
            >
              <div className="flex gap-1">
                <button
                  type="button"
                  id="tab-single-speaker"
                  onClick={handleSwitchToSingle}
                  className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    mode === 'single'
                      ? `${primaryBtn} shadow-xs`
                      : isNight
                      ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  Single Speaker
                </button>
                <button
                  type="button"
                  id="tab-dialogue"
                  onClick={handleSwitchToDialogue}
                  className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    mode === 'dialogue'
                      ? `${primaryBtn} shadow-xs`
                      : isNight
                      ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  Dialogue (2 Speakers)
                </button>
              </div>

              {/* Sample Presets Dropdown/Pills for fast input */}
              {mode === 'single' && (
                <div className="hidden sm:flex items-center gap-1 text-xs text-slate-400">
                  <span className="text-[11px] font-medium mr-1">Presets:</span>
                  {PRESET_SAMPLES.slice(0, 3).map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectPreset(s)}
                      className={`px-2 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${presetBtnClass}`}
                    >
                      {s.label.split(' ')[0]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Input Card */}
            <div className={`rounded-2xl border p-5 space-y-4 transition-colors ${cardBg}`}>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="tts-text-input"
                  className={`text-sm font-semibold flex items-center gap-2 ${
                    isNight ? 'text-slate-200' : 'text-slate-900'
                  }`}
                >
                  <span>Script & Content</span>
                  {mode === 'dialogue' && (
                    <span className="text-xs font-normal text-slate-400">
                      (Format: SpeakerName: dialogue text)
                    </span>
                  )}
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyText}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                    title="Copy text"
                  >
                    {copiedText ? (
                      <Check
                        className={`w-4 h-4 ${
                          isNight
                            ? 'text-indigo-400'
                            : isSunrise
                            ? 'text-amber-600'
                            : 'text-emerald-600'
                        }`}
                      />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  <span className="text-xs text-slate-400 font-mono">
                    {text.length} chars &bull; {text.trim() ? text.trim().split(/\s+/).length : 0} words
                  </span>
                </div>
              </div>

              <textarea
                id="tts-text-input"
                rows={mode === 'dialogue' ? 6 : 5}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={
                  mode === 'dialogue'
                    ? 'Alex: Hello! How can I help you today?\nJordan: I would like to hear a preview of Gemini TTS.'
                    : 'Type or paste the text you want to convert into speech...'
                }
                className={`w-full p-3.5 text-sm leading-relaxed rounded-xl focus:outline-none focus:ring-2 transition-all font-sans resize-y ${textareaBg}`}
              />

              {/* Single Speaker: Tone & Emotion Inflection */}
              {mode === 'single' && (
                <div
                  className={`space-y-2.5 pt-2 border-t ${
                    isNight ? 'border-slate-800' : 'border-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <label
                      className={`text-xs font-semibold flex items-center gap-1.5 ${
                        isNight ? 'text-slate-300' : 'text-slate-700'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Delivery Style & Emotion
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCustomToneActive(!isCustomToneActive)}
                      className={`text-[11px] font-medium transition-colors cursor-pointer ${
                        isNight
                          ? 'text-indigo-400 hover:text-indigo-300'
                          : isSunrise
                          ? 'text-amber-700 hover:text-amber-900'
                          : 'text-emerald-600 hover:text-emerald-800'
                      }`}
                    >
                      {isCustomToneActive ? 'Choose preset tone' : 'Custom tone prompt'}
                    </button>
                  </div>

                  {!isCustomToneActive ? (
                    <div className="flex flex-wrap gap-1.5">
                      {TONE_OPTIONS.map((tone) => {
                        const isToneActive = selectedTone === tone.value;
                        const toneActiveStyles = isNight
                          ? 'border-indigo-500 bg-indigo-950/80 text-indigo-300 font-semibold'
                          : isSunrise
                          ? 'border-amber-600 bg-amber-50 text-amber-900 font-semibold'
                          : 'border-emerald-600 bg-emerald-50 text-emerald-800 font-semibold';

                        const toneIdleStyles = isNight
                          ? 'border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50';

                        return (
                          <button
                            key={tone.label}
                            type="button"
                            onClick={() => setSelectedTone(tone.value)}
                            className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                              isToneActive ? toneActiveStyles : toneIdleStyles
                            }`}
                          >
                            {tone.label}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={customTone}
                        onChange={(e) => setCustomTone(e.target.value)}
                        placeholder="e.g. enthusiastic sports commentator, quiet bedtime whisper..."
                        className={`flex-1 p-2 text-xs rounded-lg focus:outline-none ${textareaBg}`}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Dialogue Mode: Speaker Mapping */}
              {mode === 'dialogue' && (
                <div
                  className={`p-3.5 rounded-xl border space-y-3 ${
                    isNight
                      ? 'bg-slate-900/60 border-slate-800'
                      : isSunrise
                      ? 'bg-orange-50/50 border-orange-200'
                      : 'bg-slate-50/80 border-slate-200'
                  }`}
                >
                  <div
                    className={`text-xs font-semibold flex items-center gap-1.5 ${
                      isNight ? 'text-slate-300' : 'text-slate-700'
                    }`}
                  >
                    <Settings2
                      className={`w-3.5 h-3.5 ${
                        isNight
                          ? 'text-indigo-400'
                          : isSunrise
                          ? 'text-amber-600'
                          : 'text-blue-600'
                      }`}
                    />
                    Configure Dialogue Speakers
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {speakers.map((spk, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border space-y-2 ${
                          isNight
                            ? 'bg-[#151e32] border-slate-700'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs font-bold ${
                              isNight ? 'text-slate-200' : 'text-slate-800'
                            }`}
                          >
                            Speaker {idx + 1}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Prefix in text
                          </span>
                        </div>
                        <input
                          type="text"
                          value={spk.speaker}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSpeakers((prev) =>
                              prev.map((s, i) =>
                                i === idx ? { ...s, speaker: val } : s
                              )
                            );
                          }}
                          className={`w-full p-1.5 text-xs border rounded-md font-medium ${
                            isNight
                              ? 'bg-slate-800 border-slate-700 text-slate-100'
                              : 'bg-white border-slate-200 text-slate-900'
                          }`}
                          placeholder={`Speaker ${idx + 1} Name`}
                        />
                        <div className="flex items-center gap-1.5">
                          <label className="text-[11px] text-slate-400">Voice:</label>
                          <select
                            value={spk.voice}
                            onChange={(e) => {
                              const val = e.target.value as VoiceName;
                              setSpeakers((prev) =>
                                prev.map((s, i) =>
                                  i === idx ? { ...s, voice: val } : s
                                )
                              );
                            }}
                            className={`flex-1 p-1 text-xs border rounded-md font-semibold cursor-pointer ${
                              isNight
                                ? 'bg-slate-800 border-slate-700 text-slate-100'
                                : 'bg-white border-slate-200 text-slate-800'
                            }`}
                          >
                            {AVAILABLE_VOICES.map((v) => (
                              <option key={v.id} value={v.id}>
                                {v.name} ({v.gender}, {v.persona})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Voice Persona Selector (Single Speaker) */}
            {mode === 'single' && (
              <VoiceSelector
                selectedVoice={selectedVoice}
                onSelectVoice={setSelectedVoice}
                disabled={isGenerating}
                themeMode={themeMode}
              />
            )}

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => {
                  if (mode === 'single') {
                    handleSelectPreset(PRESET_SAMPLES[0]);
                  } else {
                    setText(DIALOGUE_SAMPLE);
                  }
                }}
                disabled={isGenerating}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                  isNight
                    ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Sample
              </button>

              <button
                type="button"
                id="btn-generate-speech"
                onClick={handleGenerate}
                disabled={isGenerating || !text.trim()}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all duration-150 cursor-pointer ${
                  isGenerating || !text.trim()
                    ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
                    : `${primaryBtn} active:scale-98 hover:shadow-md`
                }`}
              >
                {isGenerating ? (
                  <>
                    <div className="flex gap-1 items-center">
                      <span className="w-1.5 h-3 bg-white animate-bounce rounded-full [animation-delay:-0.3s]"></span>
                      <span className="w-1.5 h-4 bg-white animate-bounce rounded-full [animation-delay:-0.15s]"></span>
                      <span className="w-1.5 h-3 bg-white animate-bounce rounded-full"></span>
                    </div>
                    <span>Generating Audio...</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4 fill-current" />
                    <span>Convert to Speech</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Audio Output Player & History */}
          <div className="lg:col-span-5 space-y-5">
            {/* Active Output Section */}
            {currentClip ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <AudioVisualizerPlayer
                  key={currentClip.id}
                  audioUrl={currentClip.audioUrl}
                  audioBase64={currentClip.audioBase64}
                  mp3Base64={currentClip.mp3Base64}
                  voiceName={currentClip.voice}
                  textSnippet={currentClip.text}
                  durationEstimate={currentClip.duration}
                  themeMode={themeMode}
                />
              </motion.div>
            ) : (
              /* Idle Placeholder State */
              <div
                className={`p-8 rounded-2xl border border-dashed flex flex-col items-center justify-center text-center space-y-3 ${
                  isNight
                    ? 'bg-[#151e32] border-slate-800 text-slate-300'
                    : isSunrise
                    ? 'bg-white border-orange-200/90 text-stone-700'
                    : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    isNight
                      ? 'bg-slate-800 text-slate-400'
                      : isSunrise
                      ? 'bg-orange-50 text-amber-600'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  <Music className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">
                    No Audio Generated Yet
                  </h3>
                  <p className="text-xs text-slate-400 max-w-xs mt-1">
                    Enter text on the left, pick a voice persona, and click "Convert to Speech" to produce real-time audio with MP3 & WAV downloads.
                  </p>
                </div>
              </div>
            )}

            {/* Model Architecture Note */}
            <div className={`p-4 rounded-xl border space-y-2 transition-colors ${cardBg}`}>
              <div
                className={`flex items-center justify-between text-xs font-semibold ${
                  isNight ? 'text-slate-200' : 'text-slate-700'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Sparkles
                    className={`w-3.5 h-3.5 ${
                      isNight
                        ? 'text-indigo-400'
                        : isSunrise
                        ? 'text-amber-600'
                        : 'text-emerald-600'
                    }`}
                  />
                  Gemini TTS Capabilities
                </span>
                <span className="font-mono text-[10px] text-slate-400">v3.1-flash</span>
              </div>
              <ul
                className={`text-xs space-y-1.5 list-disc list-inside ${
                  isNight ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                <li>
                  <strong className={isNight ? 'text-slate-200' : 'text-slate-800'}>
                    5 Distinct Personas:
                  </strong>{' '}
                  Kore, Puck, Fenrir, Zephyr, and Charon.
                </li>
                <li>
                  <strong className={isNight ? 'text-slate-200' : 'text-slate-800'}>
                    Promptable Expression:
                  </strong>{' '}
                  Direct tone, cadence, and emotion with style cues.
                </li>
                <li>
                  <strong className={isNight ? 'text-slate-200' : 'text-slate-800'}>
                    Multi-Speaker Dialogue:
                  </strong>{' '}
                  Generate continuous conversations between two characters.
                </li>
                <li>
                  <strong className={isNight ? 'text-slate-200' : 'text-slate-800'}>
                    Multi-Format Export:
                  </strong>{' '}
                  Download in MP3 (universal), WAV (studio master), or text transcript.
                </li>
              </ul>
            </div>

            {/* Audio History */}
            <AudioHistory
              history={history}
              activeClipId={currentClip?.id}
              themeMode={themeMode}
              onSelectClip={(clip) => setCurrentClip(clip)}
              onDeleteClip={handleDeleteHistoryClip}
              onClearAll={handleClearAllHistory}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
