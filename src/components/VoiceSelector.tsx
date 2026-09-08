import React from 'react';
import { Check, Mic, User } from 'lucide-react';
import { VoiceName, VoiceOption, ThemeMode } from '../types';

export const AVAILABLE_VOICES: VoiceOption[] = [
  {
    id: 'Kore',
    name: 'Kore',
    gender: 'Female',
    persona: 'Warm & Natural',
    tag: 'Balanced',
    description: 'Crisp, natural, and expressive tone suitable for narrations, assistants, and general text.',
  },
  {
    id: 'Puck',
    name: 'Puck',
    gender: 'Male',
    persona: 'Energetic & Upbeat',
    tag: 'Dynamic',
    description: 'Engaging, friendly, and lively delivery ideal for commercials, podcasts, and casual dialog.',
  },
  {
    id: 'Fenrir',
    name: 'Fenrir',
    gender: 'Male',
    persona: 'Deep & Resonant',
    tag: 'Authoritative',
    description: 'Rich low-register voice with steady cadence, great for dramatic storytelling and audiobooks.',
  },
  {
    id: 'Zephyr',
    name: 'Zephyr',
    gender: 'Female',
    persona: 'Calm & Gentle',
    tag: 'Soothing',
    description: 'Soft-spoken, peaceful, and empathetic voice suited for meditation guides, bedtime stories, and relaxation.',
  },
  {
    id: 'Charon',
    name: 'Charon',
    gender: 'Male',
    persona: 'Confident & Direct',
    tag: 'Professional',
    description: 'Clear, articulate, and trustworthy voice designed for announcements, news, and tutorials.',
  },
];

interface VoiceSelectorProps {
  selectedVoice: VoiceName;
  onSelectVoice: (voice: VoiceName) => void;
  disabled?: boolean;
  themeMode?: ThemeMode;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  selectedVoice,
  onSelectVoice,
  disabled = false,
  themeMode = 'afternoon',
}) => {
  const isNight = themeMode === 'night';
  const isSunrise = themeMode === 'sunrise';

  return (
    <div className="space-y-3" id="voice-selector-container">
      <div className="flex items-center justify-between">
        <label
          className={`text-sm font-semibold flex items-center gap-2 ${
            isNight ? 'text-slate-200' : isSunrise ? 'text-stone-900' : 'text-slate-900'
          }`}
        >
          <Mic
            className={`w-4 h-4 ${
              isNight
                ? 'text-indigo-400'
                : isSunrise
                ? 'text-amber-600'
                : 'text-emerald-600'
            }`}
          />
          Select Voice Persona
        </label>
        <span className="text-xs text-slate-400 font-medium">
          5 Gemini Prebuilt Voices
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
        {AVAILABLE_VOICES.map((v) => {
          const isSelected = selectedVoice === v.id;

          const cardStyles = isSelected
            ? isNight
              ? 'border-indigo-500 bg-indigo-950/60 ring-2 ring-indigo-500/30 shadow-xs'
              : isSunrise
              ? 'border-amber-600 bg-amber-50/70 ring-2 ring-amber-600/25 shadow-xs'
              : 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-600/20 shadow-xs'
            : isNight
            ? 'border-slate-800 bg-[#151e32] hover:border-slate-700 hover:bg-[#1a253e]'
            : isSunrise
            ? 'border-orange-200/70 bg-white hover:border-orange-300 hover:bg-orange-50/40'
            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60';

          const iconBg = isSelected
            ? isNight
              ? 'bg-indigo-600 text-white'
              : isSunrise
              ? 'bg-amber-600 text-white'
              : 'bg-emerald-600 text-white'
            : isNight
            ? 'bg-slate-800 text-slate-400'
            : 'bg-slate-100 text-slate-700';

          const checkBg = isNight
            ? 'bg-indigo-500 text-white'
            : isSunrise
            ? 'bg-amber-600 text-white'
            : 'bg-emerald-600 text-white';

          const personaColor = isNight
            ? isSelected
              ? 'text-indigo-300'
              : 'text-slate-400'
            : isSunrise
            ? 'text-amber-700'
            : 'text-emerald-700';

          return (
            <button
              key={v.id}
              id={`voice-btn-${v.id.toLowerCase()}`}
              type="button"
              disabled={disabled}
              onClick={() => onSelectVoice(v.id)}
              className={`relative text-left p-3 rounded-xl border transition-all duration-150 flex flex-col justify-between ${cardStyles} ${
                disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${iconBg}`}
                    >
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <span
                      className={`font-bold text-sm ${
                        isNight ? 'text-slate-100' : 'text-slate-900'
                      }`}
                    >
                      {v.name}
                    </span>
                  </div>
                  {isSelected ? (
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center ${checkBg}`}
                    >
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  ) : (
                    <span
                      className={`text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded ${
                        isNight
                          ? 'bg-slate-800 text-slate-400'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {v.gender}
                    </span>
                  )}
                </div>
                <div className={`text-xs font-medium mb-1 ${personaColor}`}>
                  {v.persona}
                </div>
                <p
                  className={`text-[11px] leading-snug line-clamp-2 ${
                    isNight ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  {v.description}
                </p>
              </div>

              <div
                className={`mt-2 pt-2 border-t flex items-center justify-between text-[10px] ${
                  isNight
                    ? 'border-slate-800 text-slate-500'
                    : 'border-slate-100 text-slate-400'
                }`}
              >
                <span>{v.tag}</span>
                <span className="font-mono">24kHz</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
