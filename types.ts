
export enum VideoMode {
  TEXT_TO_VIDEO = 'TEXT_TO_VIDEO',
  FRAMES_TO_VIDEO = 'FRAMES_TO_VIDEO',
  REFERENCES_TO_VIDEO = 'REFERENCES_TO_VIDEO',
  AVATAR = 'AVATAR'
}

export type Resolution = '720p' | '1080p';
export type AspectRatio = '16:9' | '9:16';

export interface GenerateVideoParams {
  mode: VideoMode;
  prompt: string;
  script?: string;
  aspectRatio: AspectRatio;
  resolution: Resolution;
  duration: 7; // 固定为7秒
  startFrame?: string; // base64
  endFrame?: string; // base64
  referenceImages?: string[]; // base64 array
  looping?: boolean;
}

export interface GenerationStatus {
  step: 'IDLE' | 'KEY_CHECK' | 'INITIALIZING' | 'GENERATING' | 'SUCCESS' | 'ERROR';
  message: string;
}

export interface VideoResult {
  url: string;
  params: GenerateVideoParams;
  timestamp: number;
}
