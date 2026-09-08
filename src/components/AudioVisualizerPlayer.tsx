import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Download,
  Volume2,
  VolumeX,
  FileAudio,
  FileText,
  ChevronDown,
  Sparkles,
  Music,
} from 'lucide-react';
import { ThemeMode } from '../types';

interface AudioVisualizerPlayerProps {
  audioUrl: string;
  audioBase64: string;
  mp3Base64?: string;
  voiceName: string;
  textSnippet: string;
  durationEstimate?: number;
  themeMode?: ThemeMode;
}

export const AudioVisualizerPlayer: React.FC<AudioVisualizerPlayerProps> = ({
  audioUrl,
  audioBase64,
  mp3Base64,
  voiceName,
  textSnippet,
  durationEstimate = 0,
  themeMode = 'afternoon',
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const downloadMenuRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(durationEstimate);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState<boolean>(false);

  // Audio Context & Analyser for visualizer
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(e.target as Node)) {
        setIsDownloadOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initialize audio element event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.playbackRate = playbackRate;
    audio.volume = isMuted ? 0 : volume;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);

    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
    };
  }, [playbackRate, volume, isMuted, audioUrl]);

  // Setup Web Audio API Analyser
  const setupAnalyser = () => {
    if (analyserRef.current || !audioRef.current) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      const source = ctx.createMediaElementSource(audioRef.current);
      sourceNodeRef.current = source;
      source.connect(analyser);
      analyser.connect(ctx.destination);
    } catch (e) {
      console.warn('AudioContext setup fallback:', e);
    }
  };

  const togglePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      await audioCtxRef.current.resume();
    }
    setupAnalyser();

    if (isPlaying) {
      audio.pause();
    } else {
      try {
        await audio.play();
      } catch (err) {
        console.error('Play error:', err);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleReplay = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSpeedChange = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
      setIsMuted(val === 0);
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = volume || 0.8;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const safeFilenameBase = `tts-${voiceName.toLowerCase()}-${textSnippet
    .slice(0, 24)
    .replace(/[^a-zA-Z0-9]/g, '_') || 'speech'}`;

  // Download Handlers
  const downloadWav = () => {
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `${safeFilenameBase}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setIsDownloadOpen(false);
  };

  const downloadMp3 = () => {
    if (mp3Base64) {
      const mp3Url = `data:audio/mp3;base64,${mp3Base64}`;
      const a = document.createElement('a');
      a.href = mp3Url;
      a.download = `${safeFilenameBase}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      // Fallback: download WAV if mp3 not available
      downloadWav();
    }
    setIsDownloadOpen(false);
  };

  const downloadTranscript = () => {
    const transcriptContent = [
      `GEMINI 3.1 FLASH TTS TRANSCRIPT`,
      `Generated: ${new Date().toLocaleString()}`,
      `Voice Persona: ${voiceName}`,
      `Duration: ${duration ? duration.toFixed(1) + 's' : 'Estimated'}`,
      `Sample Rate: 24,000 Hz Linear PCM`,
      `----------------------------------------`,
      `TEXT:`,
      textSnippet,
    ].join('\n');

    const blob = new Blob([transcriptContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeFilenameBase}-transcript.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setIsDownloadOpen(false);
  };

  // Canvas visualizer loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let bars = 32;
    const bufferLength = analyserRef.current ? analyserRef.current.frequencyBinCount : bars;
    const dataArray = new Uint8Array(bufferLength);

    // Color theme for wave bars
    const activeBarColor =
      themeMode === 'sunrise'
        ? '#d97706' // amber 600
        : themeMode === 'night'
        ? '#818cf8' // indigo 400
        : '#059669'; // emerald 600

    const idleBarColor =
      themeMode === 'night'
        ? '#334155' // slate 700
        : themeMode === 'sunrise'
        ? '#fed7aa' // orange 200
        : '#cbd5e1'; // slate 300

    const render = () => {
      animationFrameRef.current = requestAnimationFrame(render);
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      if (analyserRef.current && isPlaying) {
        analyserRef.current.getByteFrequencyData(dataArray);
      } else if (isPlaying) {
        for (let i = 0; i < bars; i++) {
          dataArray[i] = Math.floor(Math.random() * 120 + 30);
        }
      } else {
        for (let i = 0; i < bars; i++) {
          dataArray[i] = 12;
        }
      }

      const barWidth = width / bars - 2;
      for (let i = 0; i < bars; i++) {
        const val = dataArray[i] || 10;
        const barHeight = Math.max(4, (val / 255) * height);
        const x = i * (barWidth + 2);
        const y = (height - barHeight) / 2;

        ctx.fillStyle = isPlaying ? activeBarColor : idleBarColor;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 2);
        ctx.fill();
      }
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, themeMode]);

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds) || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Theme-specific styles
  const isNight = themeMode === 'night';
  const isSunrise = themeMode === 'sunrise';

  const cardBg = isNight
    ? 'bg-[#151e32] border-slate-800 text-slate-100'
    : isSunrise
    ? 'bg-white border-orange-200/80 text-stone-900'
    : 'bg-white border-slate-200/90 text-slate-900';

  const visualizerContainerBg = isNight
    ? 'bg-[#0f172a] border-slate-700/60'
    : isSunrise
    ? 'bg-orange-50/50 border-orange-200/50'
    : 'bg-slate-50 border-slate-200/60';

  const primaryBtnClass = isNight
    ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
    : isSunrise
    ? 'bg-amber-600 hover:bg-amber-700 text-white'
    : 'bg-emerald-600 hover:bg-emerald-700 text-white';

  const accentSliderClass = isNight
    ? 'accent-indigo-500'
    : isSunrise
    ? 'accent-amber-600'
    : 'accent-emerald-600';

  const badgeClass = isNight
    ? 'bg-indigo-950/80 text-indigo-300 border-indigo-800/80'
    : isSunrise
    ? 'bg-amber-50 text-amber-800 border-amber-200'
    : 'bg-emerald-50 text-emerald-700 border-emerald-200';

  const secondaryBtnClass = isNight
    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
    : isSunrise
    ? 'bg-stone-100 hover:bg-stone-200 text-stone-700'
    : 'bg-slate-100 hover:bg-slate-200 text-slate-700';

  return (
    <div
      id="audio-player-card"
      className={`p-5 rounded-2xl border shadow-sm space-y-4 transition-colors ${cardBg}`}
    >
      <audio ref={audioRef} src={audioUrl} preload="auto" />

      {/* Header Info */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <span className="flex h-3 w-3 relative">
            {isPlaying && (
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isNight
                    ? 'bg-indigo-400'
                    : isSunrise
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
                }`}
              ></span>
            )}
            <span
              className={`relative inline-flex rounded-full h-3 w-3 ${
                isPlaying
                  ? isNight
                    ? 'bg-indigo-500'
                    : isSunrise
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                  : isNight
                  ? 'bg-slate-600'
                  : 'bg-slate-300'
              }`}
            ></span>
          </span>
          <div>
            <h3 className="text-sm font-bold flex items-center gap-1.5">
              <span>Speech Ready</span>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${badgeClass}`}
              >
                Voice: {voiceName}
              </span>
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              gemini-3.1-flash-tts-preview &bull; 24,000 Hz Linear PCM
            </p>
          </div>
        </div>

        {/* Enhanced Multi-Format Download Dropdown */}
        <div className="relative" ref={downloadMenuRef}>
          <div className="flex items-center rounded-lg shadow-xs overflow-hidden">
            {/* Direct Quick MP3 Download */}
            <button
              type="button"
              onClick={downloadMp3}
              id="btn-quick-download-mp3"
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 transition-colors cursor-pointer ${secondaryBtnClass}`}
              title="Download compressed MP3"
            >
              <Music className="w-3.5 h-3.5" />
              <span>Download MP3</span>
            </button>

            {/* Dropdown toggle button */}
            <button
              type="button"
              onClick={() => setIsDownloadOpen(!isDownloadOpen)}
              id="btn-download-options-toggle"
              className={`border-l px-2 py-1.5 text-xs transition-colors cursor-pointer ${secondaryBtnClass} ${
                isNight ? 'border-slate-700' : 'border-slate-200'
              }`}
              title="More download formats"
            >
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${
                  isDownloadOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
          </div>

          {/* Download Dropdown Menu */}
          {isDownloadOpen && (
            <div
              className={`absolute right-0 mt-1.5 w-60 rounded-xl shadow-lg border p-1.5 z-40 space-y-1 ${
                isNight
                  ? 'bg-[#1e293b] border-slate-700 text-slate-200'
                  : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Choose Download Format
              </div>

              {/* Option 1: MP3 */}
              <button
                type="button"
                onClick={downloadMp3}
                className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                  isNight ? 'hover:bg-slate-700/80' : 'hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-md flex items-center justify-center ${
                      isNight ? 'bg-indigo-950 text-indigo-400' : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    <Music className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-xs">MP3 Audio (.mp3)</div>
                    <div className="text-[10px] text-slate-400">
                      Standard universal format &bull; 128 kbps
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                  ~{duration ? Math.round(duration * 16) : 64}KB
                </span>
              </button>

              {/* Option 2: WAV */}
              <button
                type="button"
                onClick={downloadWav}
                className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                  isNight ? 'hover:bg-slate-700/80' : 'hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-md flex items-center justify-center ${
                      isNight ? 'bg-purple-950 text-purple-400' : 'bg-blue-50 text-blue-700'
                    }`}
                  >
                    <FileAudio className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-xs">WAV Studio Master (.wav)</div>
                    <div className="text-[10px] text-slate-400">
                      Uncompressed &bull; 24kHz Linear PCM
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                  Master
                </span>
              </button>

              {/* Option 3: Transcript */}
              <button
                type="button"
                onClick={downloadTranscript}
                className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                  isNight ? 'hover:bg-slate-700/80' : 'hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-md flex items-center justify-center ${
                      isNight ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-xs">Text Transcript (.txt)</div>
                    <div className="text-[10px] text-slate-400">
                      Script, timestamp & voice info
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                  TXT
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Visualizer Canvas */}
      <div
        className={`rounded-xl px-4 py-3 flex items-center justify-center border ${visualizerContainerBg}`}
      >
        <canvas
          ref={canvasRef}
          width={480}
          height={48}
          className="w-full h-12 max-w-xl"
        />
      </div>

      {/* Scrub bar & Time stamps */}
      <div className="space-y-1.5">
        <input
          type="range"
          min={0}
          max={duration || 1}
          step={0.05}
          value={currentTime}
          onChange={handleSeek}
          id="audio-seek-slider"
          className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer ${
            isNight ? 'bg-slate-700' : 'bg-slate-200'
          } ${accentSliderClass}`}
        />
        <div className="flex justify-between text-xs font-mono text-slate-400">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Playback Controls & Speed */}
      <div
        className={`flex items-center justify-between flex-wrap gap-3 pt-1 border-t ${
          isNight ? 'border-slate-800' : 'border-slate-100'
        }`}
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={togglePlayPause}
            id="btn-play-pause"
            className={`w-11 h-11 rounded-full flex items-center justify-center shadow-sm transition-transform active:scale-95 cursor-pointer ${primaryBtnClass}`}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={handleReplay}
            id="btn-replay"
            className={`p-2.5 rounded-lg transition-colors cursor-pointer ${
              isNight
                ? 'text-slate-300 hover:bg-slate-800'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
            title="Replay from start"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Volume */}
          <div className="flex items-center gap-1.5 ml-2">
            <button
              type="button"
              onClick={toggleMute}
              className={`p-2 transition-colors cursor-pointer ${
                isNight
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-red-500" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className={`w-16 h-1.5 rounded-lg appearance-none cursor-pointer ${
                isNight ? 'bg-slate-700' : 'bg-slate-200'
              } ${accentSliderClass}`}
            />
          </div>
        </div>

        {/* Speed presets */}
        <div
          className={`flex items-center gap-1 p-1 rounded-lg ${
            isNight ? 'bg-slate-800/80' : 'bg-slate-100'
          }`}
        >
          {[0.75, 1, 1.25, 1.5, 2].map((rate) => (
            <button
              key={rate}
              type="button"
              onClick={() => handleSpeedChange(rate)}
              className={`px-2 py-1 text-xs font-semibold rounded-md transition-colors ${
                playbackRate === rate
                  ? isNight
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : isSunrise
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white text-emerald-700 shadow-xs'
                  : isNight
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {rate}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
