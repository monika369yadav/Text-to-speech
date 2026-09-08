import React from 'react';
import { Play, Download, Trash2, Clock, Music, FileAudio } from 'lucide-react';
import { GeneratedClip, ThemeMode } from '../types';

interface AudioHistoryProps {
  history: GeneratedClip[];
  activeClipId?: string;
  themeMode?: ThemeMode;
  onSelectClip: (clip: GeneratedClip) => void;
  onDeleteClip: (id: string) => void;
  onClearAll: () => void;
}

export const AudioHistory: React.FC<AudioHistoryProps> = ({
  history,
  activeClipId,
  themeMode = 'afternoon',
  onSelectClip,
  onDeleteClip,
  onClearAll,
}) => {
  if (history.length === 0) {
    return null;
  }

  const isNight = themeMode === 'night';
  const isSunrise = themeMode === 'sunrise';

  const formatTimestamp = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const downloadClip = (clip: GeneratedClip, format: 'mp3' | 'wav') => {
    const safeText = clip.text.slice(0, 20).replace(/[^a-zA-Z0-9]/g, '_') || 'speech';
    const a = document.createElement('a');

    if (format === 'mp3' && clip.mp3Base64) {
      a.href = `data:audio/mp3;base64,${clip.mp3Base64}`;
      a.download = `tts-${clip.voice.toLowerCase()}-${safeText}.mp3`;
    } else {
      a.href = clip.audioUrl;
      a.download = `tts-${clip.voice.toLowerCase()}-${safeText}.wav`;
    }

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div id="audio-history-section" className="space-y-3">
      <div className="flex items-center justify-between">
        <h3
          className={`text-sm font-semibold flex items-center gap-2 ${
            isNight ? 'text-slate-200' : isSunrise ? 'text-stone-900' : 'text-slate-900'
          }`}
        >
          <Clock
            className={`w-4 h-4 ${
              isNight
                ? 'text-indigo-400'
                : isSunrise
                ? 'text-amber-600'
                : 'text-emerald-600'
            }`}
          />
          Recent Generated Speech ({history.length})
        </h3>
        <button
          type="button"
          onClick={onClearAll}
          className="text-xs text-slate-400 hover:text-red-500 transition-colors font-medium cursor-pointer"
        >
          Clear History
        </button>
      </div>

      <div className="space-y-2">
        {history.map((clip) => {
          const isActive = clip.id === activeClipId;

          const itemBorder = isActive
            ? isNight
              ? 'border-indigo-500 bg-indigo-950/40 ring-1 ring-indigo-500/30'
              : isSunrise
              ? 'border-amber-500 bg-amber-50/70 ring-1 ring-amber-500/20'
              : 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500/20'
            : isNight
            ? 'border-slate-800 bg-[#151e32] hover:border-slate-700'
            : isSunrise
            ? 'border-orange-200/70 bg-white hover:border-orange-300'
            : 'border-slate-200 bg-white hover:border-slate-300';

          const playBtnBg = isActive
            ? isNight
              ? 'bg-indigo-600 text-white'
              : isSunrise
              ? 'bg-amber-600 text-white'
              : 'bg-emerald-600 text-white'
            : isNight
            ? 'bg-slate-800 text-slate-300 hover:bg-indigo-900 hover:text-white'
            : isSunrise
            ? 'bg-stone-100 text-stone-700 hover:bg-amber-100 hover:text-amber-800'
            : 'bg-slate-100 text-slate-700 hover:bg-emerald-100 hover:text-emerald-700';

          return (
            <div
              key={clip.id}
              id={`history-clip-${clip.id}`}
              className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${itemBorder}`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => onSelectClip(clip)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 cursor-pointer ${playBtnBg}`}
                  title="Load and play this speech clip"
                >
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span
                      className={`text-xs font-bold ${
                        isNight ? 'text-slate-100' : 'text-slate-900'
                      }`}
                    >
                      {clip.voice}
                    </span>

                    {clip.mode === 'dialogue' && (
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                          isNight
                            ? 'bg-blue-950 text-blue-300'
                            : 'bg-blue-50 text-blue-700'
                        }`}
                      >
                        Dialogue
                      </span>
                    )}

                    {clip.stylePrompt && (
                      <span
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                          isNight
                            ? 'bg-amber-950/80 text-amber-300'
                            : 'bg-amber-50 text-amber-800'
                        }`}
                      >
                        {clip.stylePrompt}
                      </span>
                    )}

                    <span className="text-[11px] text-slate-400 font-mono">
                      {formatTimestamp(clip.createdAt)}
                    </span>
                  </div>

                  <p
                    className={`text-xs truncate font-normal ${
                      isNight ? 'text-slate-400' : 'text-slate-600'
                    }`}
                  >
                    {clip.text}
                  </p>
                </div>
              </div>

              {/* Action buttons: MP3, WAV, Delete */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => downloadClip(clip, 'mp3')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    isNight
                      ? 'text-slate-400 hover:text-indigo-400 hover:bg-slate-800'
                      : isSunrise
                      ? 'text-stone-400 hover:text-amber-700 hover:bg-amber-50'
                      : 'text-slate-400 hover:text-emerald-700 hover:bg-emerald-50'
                  }`}
                  title="Download MP3"
                >
                  <Music className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => downloadClip(clip, 'wav')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    isNight
                      ? 'text-slate-400 hover:text-indigo-400 hover:bg-slate-800'
                      : isSunrise
                      ? 'text-stone-400 hover:text-amber-700 hover:bg-amber-50'
                      : 'text-slate-400 hover:text-emerald-700 hover:bg-emerald-50'
                  }`}
                  title="Download WAV"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => onDeleteClip(clip.id)}
                  className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
