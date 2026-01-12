
import { GoogleGenAI, Type } from "@google/genai";
import { VideoResult, AspectRatio, VideoMode, ChatMessage, StoryPlan, StorylineResult, FilmMakerResult, CloningResult, AnimationStoryResult, CloningComplexity, StoryTellingResult } from "../types";

const API_KEY_STORAGE_KEY = "plow_gemini_api_key";
const GROQ_API_KEY_STORAGE_KEY = "plow_groq_api_key";
const ACTIVE_PROVIDER_KEY = "plow_active_provider"; // 'gemini' | 'groq'

// --- PROVIDER MANAGEMENT ---
export const getActiveProvider = (): 'gemini' | 'groq' => {
  return (localStorage.getItem(ACTIVE_PROVIDER_KEY) as 'gemini' | 'groq') || 'gemini';
};

export const setActiveProvider = (provider: 'gemini' | 'groq') => {
  localStorage.setItem(ACTIVE_PROVIDER_KEY, provider);
};

// --- GEMINI KEY MANAGEMENT ---
export const getStoredApiKey = (): string => {
  return localStorage.getItem(API_KEY_STORAGE_KEY) || process.env.API_KEY || "";
};

export const setStoredApiKey = (key: string) => {
  if (key) {
    localStorage.setItem(API_KEY_STORAGE_KEY, key);
  } else {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
  }
};

export const ensureApiKey = async (): Promise<boolean> => {
  const key = getStoredApiKey();
  return !!(key && key.length > 0);
};

// --- GROQ KEY MANAGEMENT ---
export const getStoredGroqKey = (): string => {
  return localStorage.getItem(GROQ_API_KEY_STORAGE_KEY) || "";
};

export const setStoredGroqKey = (key: string) => {
  if (key) {
    localStorage.setItem(GROQ_API_KEY_STORAGE_KEY, key);
  } else {
    localStorage.removeItem(GROQ_API_KEY_STORAGE_KEY);
  }
};

const toBase64 = (file: File): Promise<string> => 
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });

export const generateAdvancedVideo = async (params: {
  mode: VideoMode;
  prompt: string;
  duration: string;
  style: string;
  ratio: AspectRatio;
  files: File[];
  startFrame?: File | null;
  endFrame?: File | null;
}): Promise<VideoResult> => {
  if (!await ensureApiKey()) throw new Error("Gemini API Key not configured. Please set it in Settings.");
  const apiKey = getStoredApiKey();
  const ai = new GoogleGenAI({ apiKey });

  // 1. BRAIN PHASE: Generate mandatory technical prompts
  const brainPrompt = `
    Mode: ${params.mode}
    User Prompt: ${params.prompt}
    Style: ${params.style}
    Duration: ${params.duration}
    
    Return JSON with:
    - prompt: Ultra realistic cinematic prompt based on mode rules.
    - camera: Camera movement details.
    - lighting: Professional lighting description.
    - consistency: Character/environment consistency notes.
  `;

  const brainResponse = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: brainPrompt,
    config: {
      responseMimeType: 'application/json',
      systemInstruction: "You are a professional AI Video Director. For mode TEXT_TO_VIDEO, use 'Ultra realistic cinematic video...' template. For START_END_FRAME, focus on 'smooth interpolation'. For BAHAN_TO_VIDEO, blend materials into a storyline.",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          prompt: { type: Type.STRING },
          camera: { type: Type.STRING },
          lighting: { type: Type.STRING },
          consistency: { type: Type.STRING }
        },
        required: ['prompt', 'camera', 'lighting', 'consistency']
      }
    }
  });

  const techPlan = JSON.parse(brainResponse.text || "{}");

  // 2. PREPARE ASSETS
  // Determine input image (Start Frame or Main File for Image-to-Video)
  let inputImageBase64: string | undefined = undefined;
  
  if (params.startFrame) {
    inputImageBase64 = await toBase64(params.startFrame);
  } else if (params.mode === VideoMode.BAHAN_TO_VIDEO && params.files && params.files.length > 0) {
    // For Image-to-Video, use the first uploaded file as the input image
    inputImageBase64 = await toBase64(params.files[0]);
  }

  const endFrameBase64 = params.endFrame ? await toBase64(params.endFrame) : undefined;
  
  // 3. VEO GENERATION
  const renderAi = new GoogleGenAI({ apiKey });
  let operation = await renderAi.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: techPlan.prompt,
    image: inputImageBase64 ? { imageBytes: inputImageBase64, mimeType: 'image/png' } : undefined,
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: params.ratio === AspectRatio.LANDSCAPE ? '16:9' : (params.ratio === AspectRatio.PORTRAIT ? '9:16' : '1:1'),
      lastFrame: endFrameBase64 ? { imageBytes: endFrameBase64, mimeType: 'image/png' } : undefined,
    }
  });

  // Polling
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 10000));
    operation = await renderAi.operations.getVideosOperation({ operation: operation });
  }

  if (operation.error) throw new Error(operation.error.message);

  const downloadUri = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!downloadUri) throw new Error("Video URI not found.");

  // CRITICAL FIX: Fetch video using the dynamic API KEY
  const videoResponse = await fetch(`${downloadUri}&key=${apiKey}`);
  if (!videoResponse.ok) throw new Error("Failed to fetch video data from URI.");
  const videoBlob = await videoResponse.blob();
  const videoUrl = URL.createObjectURL(videoBlob);

  return {
    url: videoUrl,
    mimeType: 'video/mp4',
    technicalDetails: techPlan
  };
};

export const generateImages = async (prompt: string, refImage?: File, aspectRatio: string = '1:1'): Promise<any> => {
  if (!await ensureApiKey()) throw new Error("Gemini API Key not configured. Please set it in Settings.");
  const ai = new GoogleGenAI({ apiKey: getStoredApiKey() });

  // MODE 1: IMAGE-TO-IMAGE (PRECISION EDITING)
  // If a reference image is provided, we use gemini-2.5-flash-image which supports image inputs.
  // This allows for high-fidelity modifications while keeping the source structure.
  if (refImage) {
    const base64Data = await toBase64(refImage);
    const mimeType = refImage.type;

    // Strict prompt to ensure precision
    const editPrompt = `
      Instructions: ${prompt}
      
      STRICT RULES FOR 100% PRECISION:
      1. You are modifying the source image.
      2. PRESERVE THE SUBJECT: The person/object in the image must remain exactly the same (identity, facial features, body structure).
      3. PRESERVE COMPOSITION: Keep the original angle and framing.
      4. HIGH FIDELITY: The result must look like a professional photo edit, not a re-creation.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', 
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType, 
            },
          },
          {
            text: editPrompt,
          },
        ],
      },
    });

    // Extract the image part from the response
    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64EncodeString: string = part.inlineData.data;
          return { url: `data:image/png;base64,${base64EncodeString}` };
        }
      }
    }
    throw new Error("Failed to generate precision image from reference.");
  }

  // MODE 2: TEXT-TO-IMAGE (IMAGEN)
  // If no reference image, use the standard Imagen model for creation.
  const response = await ai.models.generateImages({
    model: 'imagen-4.0-generate-001',
    prompt: prompt,
    config: { numberOfImages: 1, aspectRatio: aspectRatio },
  });
  return { url: `data:image/png;base64,${response.generatedImages[0].image.imageBytes}` };
};

export const generateSpeech = async (text: string, voiceId: string, voiceB?: string, isPodcast?: boolean): Promise<string> => {
  if (!await ensureApiKey()) throw new Error("Gemini API Key not configured. Please set it in Settings.");
  const ai = new GoogleGenAI({ apiKey: getStoredApiKey() });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: ['AUDIO'],
      speechConfig: isPodcast ? {
        multiSpeakerVoiceConfig: {
          speakerVoiceConfigs: [
            { speaker: 'A', voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceId } } },
            { speaker: 'B', voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceB || 'Puck' } } }
          ]
        }
      } : {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceId } }
      }
    }
  });
  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  return `data:audio/wav;base64,${base64Audio}`;
};

export const sendChatMessage = async (history: ChatMessage[], message: string): Promise<string> => {
  if (!await ensureApiKey()) throw new Error("Gemini API Key not configured. Please set it in Settings.");
  const ai = new GoogleGenAI({ apiKey: getStoredApiKey() });
  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    history: history.map(h => ({ role: h.role, parts: [{ text: h.text }] }))
  });
  const result = await chat.sendMessage({ message });
  return result.text || "";
};

export const generateStoryPlan = async (topic: string, style: string, sceneCount: number): Promise<StoryPlan> => {
  if (!await ensureApiKey()) throw new Error("Gemini API Key not configured. Please set it in Settings.");
  const ai = new GoogleGenAI({ apiKey: getStoredApiKey() });

  const prompt = `Create a story plan for: ${topic}. Style: ${style}. Scenes: ${sceneCount}.`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      systemInstruction: 'You are a story architect. Generate a character, a script, and scenes with prompts.',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          character: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              age: { type: Type.STRING },
              personality: { type: Type.STRING },
              physicalTraits: { type: Type.STRING },
              outfit: { type: Type.STRING },
              visualPrompt: { type: Type.STRING },
            },
            required: ['name', 'age', 'personality', 'physicalTraits', 'outfit', 'visualPrompt'],
          },
          script: { type: Type.STRING },
          scenes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                number: { type: Type.NUMBER },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                unifiedPrompt: { type: Type.STRING },
              },
              required: ['number', 'title', 'description', 'unifiedPrompt'],
            },
          },
        },
        required: ['title', 'character', 'script', 'scenes'],
      },
    },
  });

  return JSON.parse(response.text || '{}') as StoryPlan;
};

export const generateStoryline = async (topic: string, sceneCount: number): Promise<StorylineResult> => {
  if (!await ensureApiKey()) throw new Error("Gemini API Key not configured. Please set it in Settings.");
  const ai = new GoogleGenAI({ apiKey: getStoredApiKey() });
  
  const prompt = `Generate a storyline for: ${topic} with ${sceneCount} scenes.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      systemInstruction: 'You are a scriptwriter. Output valid JSON with scene-by-scene audio script and visual prompts.',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          topic: { type: Type.STRING },
          totalScenes: { type: Type.NUMBER },
          scenes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                sceneNumber: { type: Type.NUMBER },
                audioScript: { type: Type.STRING },
                visualPrompt: { type: Type.STRING },
              },
              required: ['sceneNumber', 'audioScript', 'visualPrompt'],
            },
          },
        },
        required: ['topic', 'totalScenes', 'scenes'],
      },
    },
  });

  return JSON.parse(response.text || '{}') as StorylineResult;
};

export const generateFilmMakerPlan = async (topic: string, sceneCount: number): Promise<FilmMakerResult> => {
  if (!await ensureApiKey()) throw new Error("Gemini API Key not configured. Please set it in Settings.");
  const ai = new GoogleGenAI({ apiKey: getStoredApiKey() });
  
  const prompt = `Create a film production plan for: ${topic}. Number of scenes: ${sceneCount}.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      systemInstruction: 'You are a film director. Create a detailed plan including start/end frame prompts for video interpolation, and dialogue if applicable.',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          logline: { type: Type.STRING },
          scenes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                sceneNumber: { type: Type.NUMBER },
                outline: { type: Type.STRING },
                imageStartPrompt: { type: Type.STRING },
                imageEndPrompt: { type: Type.STRING },
                videoPrompt: { type: Type.STRING },
                dialogues: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      characterName: { type: Type.STRING },
                      line: { type: Type.STRING },
                    },
                    required: ['characterName', 'line'],
                  },
                },
              },
              required: ['sceneNumber', 'outline', 'imageStartPrompt', 'imageEndPrompt', 'videoPrompt'],
            },
          },
        },
        required: ['title', 'logline', 'scenes'],
      },
    },
  });

  return JSON.parse(response.text || '{}') as FilmMakerResult;
};

export const analyzeContentForCloning = async (file: File, complexity: CloningComplexity = 'standard'): Promise<CloningResult> => {
  if (!await ensureApiKey()) throw new Error("Gemini API Key not configured. Please set it in Settings.");
  const ai = new GoogleGenAI({ apiKey: getStoredApiKey() });

  const base64Data = await toBase64(file);
  const mimeType = file.type;

  let complexityInstruction = "";
  switch(complexity) {
      case 'basic':
          complexityInstruction = "Provide a concise, high-level analysis focusing on the main subject identity and primary visual style. Keep descriptions short and direct.";
          break;
      case 'standard':
          complexityInstruction = "Provide a balanced analysis covering all key visual elements including lighting, texture, and composition. Suitable for standard generative tasks.";
          break;
      case 'advanced':
          complexityInstruction = "Provide an EXTREMELY DETAILED, hyper-precise analysis. Include technical camera estimates (focal length, aperture), specific lighting terminology (rim light, key light temperature), micro-textures of skin/fabric, and exact color hex codes if possible.";
          break;
  }

  const systemInstruction = `You are an AI Visual Cloning Extractor.

Your task is to analyze the user’s uploaded photo or video and generate a complete CLONING PROMPT in **JSON format only**.  
The cloning prompt must describe exactly what appears in the reference image or video with high accuracy, without inventing details.

COMPLEXITY LEVEL: ${complexity.toUpperCase()}
INSTRUCTION: ${complexityInstruction}

RULES — MUST FOLLOW:
1. The output MUST ALWAYS be in valid JSON.  
2. All text must be in **English**.  
3. NEVER add human names, identities, or private info.  
4. Describe ONLY what is visible in the reference.  
5. Be extremely precise about: character features, clothing textures, environment details, lighting physics, camera angles, and mood.
6. The “full_prompt” field must be a cohesive, high-quality prompt constructed from the analysis, ready for immediate use in Text-to-Image models.`;

  const prompt = "Analyze this content and generate the precise cloning prompt JSON.";

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview', // Upgraded to Pro for better visual analysis
    contents: [
      {
        inlineData: {
          mimeType: mimeType,
          data: base64Data
        }
      },
      { text: prompt }
    ],
    config: {
      responseMimeType: 'application/json',
      systemInstruction: systemInstruction,
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          character: {
            type: Type.OBJECT,
            properties: {
              gender: { type: Type.STRING },
              age_range: { type: Type.STRING },
              ethnicity: { type: Type.STRING },
              body_type: { type: Type.STRING },
              face_features: { type: Type.STRING },
              hair: { type: Type.STRING },
              eyes: { type: Type.STRING },
              skin_tone: { type: Type.STRING },
              expression: { type: Type.STRING },
              pose: { type: Type.STRING }
            },
            required: ['gender', 'age_range', 'ethnicity', 'body_type', 'face_features', 'hair', 'eyes', 'skin_tone', 'expression', 'pose']
          },
          clothing: {
            type: Type.OBJECT,
            properties: {
              top: { type: Type.STRING },
              bottom: { type: Type.STRING },
              footwear: { type: Type.STRING },
              accessories: { type: Type.STRING }
            },
            required: ['top', 'bottom', 'footwear', 'accessories']
          },
          environment: {
            type: Type.OBJECT,
            properties: {
              background_description: { type: Type.STRING },
              location_type: { type: Type.STRING },
              objects_visible: { type: Type.STRING },
              atmosphere_mood: { type: Type.STRING }
            },
            required: ['background_description', 'location_type', 'objects_visible', 'atmosphere_mood']
          },
          camera: {
            type: Type.OBJECT,
            properties: {
              angle: { type: Type.STRING },
              shot_type: { type: Type.STRING },
              lens_focal_length: { type: Type.STRING },
              depth_of_field: { type: Type.STRING },
              framing: { type: Type.STRING },
              movement: { type: Type.STRING }
            },
            required: ['angle', 'shot_type', 'lens_focal_length', 'depth_of_field', 'framing', 'movement']
          },
          style: {
            type: Type.OBJECT,
            properties: {
              visual_style: { type: Type.STRING },
              lighting_style: { type: Type.STRING },
              color_palette: { type: Type.STRING },
              render_quality: { type: Type.STRING }
            },
            required: ['visual_style', 'lighting_style', 'color_palette', 'render_quality']
          },
          full_prompt: { 
            type: Type.STRING,
            description: "A comprehensive, high-quality prompt constructed from the analysis, ensuring maximum precision and detail."
          }
        },
        required: ['character', 'clothing', 'environment', 'camera', 'style', 'full_prompt']
      }
    }
  });

  return JSON.parse(response.text || '{}') as CloningResult;
};

// --- NEW FUNCTION: ANIMATION STORY BUILDER ---
export const generateAnimationScenes = async (
  topic: string, 
  style: string, 
  ratio: string, 
  sceneCount: number, 
  refImage?: File,
  language: 'id' | 'en' = 'en'
): Promise<AnimationStoryResult> => {
  if (!await ensureApiKey()) throw new Error("Gemini API Key not configured. Please set it in Settings.");
  const ai = new GoogleGenAI({ apiKey: getStoredApiKey() });

  const langName = language === 'id' ? 'Indonesian (Bahasa Indonesia)' : 'English';

  let prompt = `
    Create a ${sceneCount} scene storyline about "${topic}" in "${style}" style. Aspect Ratio: ${ratio}.
    OUTPUT LANGUAGE: All text (prompts, dialog, consistency notes) must be in ${langName}.
  `;
  
  const contentParts: any[] = [];

  // Step 1 logic varies based on whether a reference image is provided
  if (refImage) {
    const base64Image = await toBase64(refImage);
    const mimeType = refImage.type;
    contentParts.push({ inlineData: { mimeType, data: base64Image } });
    
    prompt += `
    STEP 1: DEEP VISUAL ANALYSIS
    First, analyze the attached character reference image in extreme detail. Identify:
    - Gender, approximate age.
    - Hair style, hair color, hair texture.
    - Eye color, facial structure, skin tone.
    - Exact outfit details (shirt color, pant type, accessories, shoes).
    - Distinguishing features.
    `;
  } else {
    prompt += `
    STEP 1: CHARACTER DESIGN
    First, CREATE a unique main character that fits the topic and style perfectly. 
    Define:
    - Gender, approximate age.
    - Hair style, hair color.
    - Outfit details.
    - Distinguishing features.
    Make the character visually distinct and memorable.
    `;
  }

  prompt += `
    STEP 2: SCENE GENERATION
    Generate ${sceneCount} scenes.
    
    CRITICAL INSTRUCTION FOR CONSISTENCY:
    For EVERY 'visual_prompt', you MUST begin by describing the character exactly as analyzed/designed in Step 1.
    Example Format: "[Style: ${style}] [Character: {INSERT_DETAILS_HERE}] doing action..."
    
    Ensure the 'visual_prompt' is optimized for high-end text-to-image models.
    Ensure the 'image_to_video_prompt' describes motion suitable for Veo/Runway AND INCLUDES the Dialogue context explicitly.
    
    LANGUAGE REQUIREMENT:
    - If language is Indonesian, the prompts MUST be in Indonesian.
    - If language is English, the prompts MUST be in English.
  `;
  
  contentParts.push({ text: prompt });

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview', // Using Pro for complex consistency logic
    contents: contentParts,
    config: {
      responseMimeType: 'application/json',
      systemInstruction: `You are an Animation Director. Your #1 priority is character consistency. Always explicitly describe the characters physical traits. In the image_to_video_prompt, ALWAYS include the character action followed by their exact dialogue quoted. The output language must be strictly ${langName}.`,
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          logline: { type: Type.STRING },
          character_consistency_notes: { type: Type.STRING },
          scenes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                scene_number: { type: Type.INTEGER },
                duration: { type: Type.STRING },
                style: { type: Type.STRING },
                camera: { type: Type.STRING },
                mood: { type: Type.STRING },
                aspect_ratio: { type: Type.STRING },
                dialog: { type: Type.STRING },
                visual_prompt: { type: Type.STRING },
                image_to_video_prompt: { type: Type.STRING },
                scene_description: { type: Type.STRING },
              },
              required: ['scene_number', 'duration', 'style', 'camera', 'mood', 'aspect_ratio', 'dialog', 'visual_prompt', 'image_to_video_prompt', 'scene_description'],
            }
          }
        },
        required: ['title', 'logline', 'character_consistency_notes', 'scenes']
      }
    }
  });

  return JSON.parse(response.text || '{}') as AnimationStoryResult;
};

// --- NEW FUNCTION: STORY TELLING ---
export const generateStoryTelling = async (topic: string, sceneCount: number, style: string = 'Cinematic', language: 'id' | 'en' = 'en'): Promise<StoryTellingResult> => {
  if (!await ensureApiKey()) throw new Error("Gemini API Key not configured.");
  const ai = new GoogleGenAI({ apiKey: getStoredApiKey() });

  const langName = language === 'id' ? 'Bahasa Indonesia' : 'English';

  const prompt = `Topic: ${topic}\nTotal Scenes: ${sceneCount}\nStyle: ${style}\nTarget Language: ${langName}`;

  const systemInstruction = `You are an AI system that will generate a complete storytelling package based on the user’s chosen topic.

GOAL:
Buat satu topik cerita lengkap dengan:
1. Narasi audio (script narasi panjang).
2. ${sceneCount} scene prompt image dalam gaya visual: "${style}".

INSTRUKSI UTAMA:
1. Kembangkan topik menjadi cerita lengkap dalam bentuk:
   - Narasi audio utama (Audiobook style, bukan dialog)
   - Scene detail dan konsisten (Prompt Image). Pastikan setiap prompt image MENGGAMBARKAN gaya "${style}".
2. Jumlah scene harus tepat ${sceneCount}.
3. **PENTING: BAHASA OUTPUT**
   - Jika Target Language adalah Bahasa Indonesia: Semua output (Narasi DAN Prompt Image) harus dalam Bahasa Indonesia.
   - Jika Target Language adalah English: Semua output harus dalam Bahasa Inggris.

FORMAT OUTPUT WAJIB (JSON):
{
  "topic": "Judul Cerita",
  "total_scenes": ${sceneCount},
  "audio_narration_script": "Teks narasi lengkap...",
  "scenes": [
      {
        "scene_number": 1,
        "image_prompt": "Deskripsi visual scene 1..."
      }
  ],
  "combined_txt_file": "..." // Field ini tidak akan digunakan oleh frontend, frontend akan generate sendiri. Isi string kosong saja.
}
`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview', // Using Pro for better long context handling (up to 75 scenes)
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      systemInstruction: systemInstruction,
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          topic: { type: Type.STRING },
          total_scenes: { type: Type.STRING }, 
          audio_narration_script: { type: Type.STRING },
          scenes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                scene_number: { type: Type.STRING }, 
                image_prompt: { type: Type.STRING },
              },
              required: ['scene_number', 'image_prompt'],
            },
          },
          combined_txt_file: { type: Type.STRING },
        },
        required: ['topic', 'total_scenes', 'audio_narration_script', 'scenes', 'combined_txt_file'],
      },
    },
  });

  return JSON.parse(response.text || '{}') as StoryTellingResult;
};
