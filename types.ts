
export enum AspectRatio {
  SQUARE = '1:1',
  LANDSCAPE = '16:9',
  PORTRAIT = '9:16',
}

export enum GenerationState {
  IDLE = 'IDLE',
  GENERATING = 'GENERATING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
}

export enum TaskStatus {
  QUEUED = 'QUEUED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum VideoMode {
  TEXT_TO_VIDEO = 'TEXT_TO_VIDEO',
  START_END_FRAME = 'START_END_FRAME',
  BAHAN_TO_VIDEO = 'BAHAN_TO_VIDEO',
}

export interface VideoResult {
  url: string;
  mimeType: string;
  technicalDetails?: {
    prompt: string;
    camera: string;
    lighting: string;
    consistency: string;
  };
}

export interface VideoTask {
  id: string;
  createdAt: number;
  status: TaskStatus;
  mode: VideoMode;
  prompt: string;
  result?: VideoResult;
  error?: string;
}

export interface ImageResult {
  url: string;
  mimeType?: string;
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  IMAGE = 'IMAGE',
  VOICE = 'VOICE',
  CLONING = 'CLONING',
  ANIMATION_STORY = 'ANIMATION_STORY',
  STORY_TELLING = 'STORY_TELLING',
  SETTINGS = 'SETTINGS',
}

export interface UserProfile {
  username: string;
  email: string;
  avatarUrl?: string;
  theme: 'dark' | 'light';
  language: string; 
  interests: string[];
  isAdult: boolean;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

// --- New Interfaces for Story & Film Generators ---

export interface StoryPlan {
  title: string;
  character: {
    name: string;
    age: string;
    personality: string;
    physicalTraits: string;
    outfit: string;
    visualPrompt: string;
  };
  script: string;
  scenes: {
    number: number;
    title: string;
    description: string;
    unifiedPrompt: string;
  }[];
}

export interface StorylineResult {
  topic: string;
  totalScenes: number;
  scenes: {
    sceneNumber: number;
    audioScript: string;
    visualPrompt: string;
  }[];
}

export interface FilmMakerResult {
  title: string;
  logline: string;
  scenes: {
    sceneNumber: number;
    outline: string;
    imageStartPrompt: string;
    imageEndPrompt: string;
    videoPrompt: string;
    dialogues?: {
      characterName: string;
      line: string;
    }[];
  }[];
}

// --- Interface for Cloning Extractor ---
export type CloningComplexity = 'basic' | 'standard' | 'advanced';

export interface CloningResult {
  character: {
    gender: string;
    age_range: string;
    ethnicity: string;
    body_type: string;
    face_features: string;
    hair: string;
    eyes: string;
    skin_tone: string;
    expression: string;
    pose: string;
  };
  clothing: {
    top: string;
    bottom: string;
    footwear: string;
    accessories: string;
  };
  environment: {
    background_description: string;
    location_type: string;
    objects_visible: string;
    atmosphere_mood: string;
  };
  camera: {
    angle: string;
    shot_type: string;
    lens_focal_length: string;
    depth_of_field: string;
    framing: string;
    movement: string;
  };
  style: {
    visual_style: string;
    lighting_style: string;
    color_palette: string;
    render_quality: string;
  };
  full_prompt: string;
}

// --- Interface for Animation Story Builder ---
export interface AnimationScene {
  scene_number: number;
  duration: string;
  style: string;
  camera: string;
  mood: string;
  aspect_ratio: '9:16' | '16:9';
  dialog: string;
  visual_prompt: string;
  image_to_video_prompt: string;
  scene_description: string;
}

export interface AnimationStoryResult {
  title: string;
  logline: string;
  character_consistency_notes: string;
  scenes: AnimationScene[];
}

// --- Interface for Story Telling ---
export interface StoryTellingResult {
  topic: string;
  total_scenes: string | number;
  audio_narration_script: string;
  scenes: {
    scene_number: string | number;
    image_prompt: string;
  }[];
  combined_txt_file: string;
}

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  var SpeechRecognition: any;
  var webkitSpeechRecognition: any;
}
