export type VoiceName = 'Kore' | 'Puck' | 'Fenrir' | 'Zephyr' | 'Charon';

export interface VoiceOption {
  id: VoiceName;
  name: string;
  gender: 'Female' | 'Male';
  persona: string;
  tag: string;
  description: string;
}

export type TtsMode = 'single' | 'dialogue';

export interface DialogueSpeakerConfig {
  speaker: string;
  voice: VoiceName;
}

export interface TtsRequestPayload {
  text: string;
  voice?: VoiceName;
  stylePrompt?: string;
  mode?: TtsMode;
  speakers?: DialogueSpeakerConfig[];
}

export type ThemeMode = 'sunrise' | 'afternoon' | 'night';

export interface TtsResponsePayload {
  success: boolean;
  audioBase64?: string;
  mp3Base64?: string;
  mimeType?: string;
  durationEstimate?: number;
  sampleRate?: number;
  error?: string;
}

export interface GeneratedClip {
  id: string;
  createdAt: number;
  mode: TtsMode;
  text: string;
  voice: VoiceName | string;
  stylePrompt?: string;
  audioUrl: string;
  audioBase64: string;
  mp3Url?: string;
  mp3Base64?: string;
  duration?: number;
}
