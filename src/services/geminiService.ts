
import { GoogleGenAI, GenerateContentResponse, Chat, Modality, Type } from "@google/genai";
import { ChatMode, Attachment, Message, ProjectFiles, FariModelId, ThinkConfig, CanvasAIResponseNode } from './types';

// Safely access process.env to prevent browser crashes if process is undefined
const getApiKey = () => {
  try {
    // Check if process is defined and has env property
    if (typeof process !== 'undefined' && process.env) {
      return process.env.API_KEY;
    }
  } catch (e) {
    // Ignore ReferenceError if process is not defined
  }
  return undefined;
};

const API_KEY = getApiKey();

if (!API_KEY) {
  console.warn("FARI AI is not configured. API_KEY is missing. Chat features will not work.");
}

const ai = API_KEY ? new GoogleGenAI({apiKey: API_KEY}) : null;

const checkAi = () => {
    if (!ai) {
        throw new Error("AI service is not configured. Please ensure the API key is set correctly.");
    }
    return ai;
}

function fileToGenerativePart(dataUrl: string, mimeType: string) {
  return {
    inlineData: {
      data: dataUrl.split(',')[1],
      mimeType
    },
  };
}

export const generateTextResponse = async (
    prompt: string,
    history: Message[],
    mode: ChatMode,
    attachment?: Attachment,
    fariModelId: FariModelId = 'fari_3_5'
): Promise<AsyncIterable<GenerateContentResponse>> => {
    const ai = checkAi();
    
    // Use gemini-2.5-flash for all text tasks for best performance/cost balance in this demo
    const geminiModelId = 'gemini-2.5-flash';
    
    const contents = history.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
    }));

    const userParts: any[] = [{ text: prompt }];
    if (attachment) {
        userParts.unshift(fileToGenerativePart(attachment.dataUrl, attachment.type));
    }
    
    contents.push({ role: 'user', parts: userParts });
    
    const config = {
        systemInstruction: mode.systemInstruction
    };

    return ai.models.generateContentStream({
        model: geminiModelId,
        contents,
        config,
    });
};

export const generateImageResponse = async (prompt: string): Promise<string> => {
    const ai = checkAi();
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
            },
        });
        
        if (!response.generatedImages || response.generatedImages.length === 0 || !response.generatedImages[0].image) {
             throw new Error("I couldn't generate an image for that prompt, likely due to my safety guidelines. Could you try rephrasing it?");
        }

        const base64ImageBytes = response.generatedImages[0].image.imageBytes;
        return `data:image/jpeg;base64,${base64ImageBytes}`;
    } catch (error) {
        console.error("Image generation error:", error);
        throw new Error("I couldn't generate an image for that prompt, likely due to my safety guidelines. This sometimes happens with prompts mentioning specific people or intense action scenes. Could you try rephrasing it more generally?");
    }
};

export const startChat = (systemInstruction: string): Chat => {
    const ai = checkAi();
    return ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: systemInstruction,
        },
    });
};


export const generateDeepResearchResponse = async (prompt: string, history: Message[], config: ThinkConfig, fariModelId: FariModelId = 'fari_3_5'): Promise<AsyncIterable<GenerateContentResponse>> => {
    const ai = checkAi();
    const geminiModelId = 'gemini-2.5-flash';
    const contents = history.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
    }));
    contents.push({ role: 'user', parts: [{ text: prompt }] });
    
    return ai.models.generateContentStream({
        model: geminiModelId,
        contents,
        config: {
            tools: config.useWeb ? [{ googleSearch: {} }] : undefined,
        }
    });
};

export const interpretSketch = async (sketchAttachment: Attachment): Promise<string> => {
    const ai = checkAi();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                fileToGenerativePart(sketchAttachment.dataUrl, sketchAttachment.type),
                { text: 'Describe this sketch in a short, descriptive phrase that can be used as a prompt for an image generator. Focus on the main subjects and style.' }
            ]
        },
    });
    return response.text || "A creative sketch";
};

export const generatePromptSuggestions = async (failedPrompt: string): Promise<string[]> => {
    const ai = checkAi();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `The image generation prompt "${failedPrompt}" failed. Provide 3 alternative, safer, and more general prompts that capture a similar creative idea but are less likely to violate safety policies. Respond ONLY with a valid JSON array of strings. Example: ["a cat in a space suit", "a feline astronaut floating", "a kitten exploring the galaxy"]`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
            }
        }
    });

    try {
        const jsonMatch = response.text?.match(/\[.*?\]/s);
        if (jsonMatch) {
            const suggestions = JSON.parse(jsonMatch[0]);
            if (Array.isArray(suggestions) && suggestions.every(s => typeof s === 'string')) {
                return suggestions.slice(0, 3);
            }
        }
    } catch (e) {
        console.error("Failed to parse prompt suggestions:", response.text, e);
    }
    return [];
};

export const editImage = async (prompt: string, attachment: Attachment): Promise<{ imageUrl: string; text: string }> => {
    const ai = checkAi();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                fileToGenerativePart(attachment.dataUrl, attachment.type),
                { text: prompt },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });

    let imageUrl = '';
    let text = '';
    
    if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.text) {
                text += part.text;
            } else if (part.inlineData) {
                imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
    }
    
    if (!imageUrl) {
        throw new Error("The model did not return an edited image.");
    }

    return { imageUrl, text };
};

export const generateVideo = async (prompt: string, onUpdate: (statusText: string) => void): Promise<{ videoUrl: string; audioDescription: string }> => {
    const ai = checkAi();
    onUpdate('Initializing video generation...');
    
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      config: { numberOfVideos: 1 }
    });
    
    onUpdate('Generating video... This may take a few minutes.');
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      onUpdate('Checking video status...');
      operation = await ai.operations.getVideosOperation({operation: operation});
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error("Video generation failed to produce a download link.");
    }

    onUpdate('Fetching video file...');
    const response = await fetch(`${downloadLink}&key=${API_KEY}`);
    const videoBlob = await response.blob();
    const videoUrl = URL.createObjectURL(videoBlob);
    
    onUpdate('Generating audio description...');
    const audioResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Describe a suitable, dramatic, and cinematic soundtrack for a video based on this prompt: "${prompt}". Include music style and potential sound effects.`
    });

    return { videoUrl, audioDescription: audioResponse.text || '' };
};

export const generateCanvasResponse = async (prompt: string): Promise<CanvasAIResponseNode> => {
     const ai = checkAi();
     const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `The user wants to expand on the idea "${prompt}". Generate a JSON object representing a tree of related ideas. The root should NOT be included. The response should ONLY be a valid JSON object with a "title" for the main idea and an optional "children" array of nodes. Keep titles concise (2-4 words). Example: { "title": "${prompt}", "children": [{ "title": "Sub-idea 1" }, { "title": "Sub-idea 2", "children": [{"title": "Detail A"}] }] }`,
        config: {
            responseMimeType: "application/json",
        }
    });
    
    try {
        const jsonMatch = response.text?.match(/{[\s\S]*}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        throw new Error("No JSON object found");
    } catch (e) {
        console.error("Failed to parse canvas response:", response.text, e);
        return { title: "Error: Could not generate ideas", children: [] };
    }
};

export const generateCodeCompletion = async (code: string): Promise<string> => {
    const ai = checkAi();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are a code completion assistant. Given the code below, provide a single, short, logical completion. Do not repeat the provided code. Only return the completion text, without any markdown or explanation.\n\nCODE:\n\`\`\`\n${code}\n\`\`\``
    });
    return response.text || '';
};

export const analyzeProjectFiles = async (projectFiles: ProjectFiles): Promise<AsyncIterable<GenerateContentResponse>> => {
    const ai = checkAi();
    return ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: `Analyze the following project files and provide a summary of the project, potential improvements, and any detected bugs. Format the response in clear markdown. Files:\n\n${projectFiles.map(f => `--- FILE: ${f.path} ---\n${f.content}`).join('\n\n')}`,
        config: {
            systemInstruction: "You are an expert software developer and coding assistant."
        }
    });
};

export const detectActionableTask = async (prompt: string): Promise<{ title: string } | null> => {
    const ai = checkAi();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Does the following text contain an actionable task or to-do item? If yes, respond with a JSON object like {"task": "The extracted task description"}. If no, respond with {"task": null}. Text: "${prompt}"`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    task: {
                        type: Type.STRING,
                        nullable: true
                    }
                }
            }
        }
    });

    try {
        const jsonMatch = response.text?.match(/{[\s\S]*}/);
        if (jsonMatch) {
            const result = JSON.parse(jsonMatch[0]);
            if (result && result.task) {
                return { title: result.task };
            }
        }
    } catch (e) {
        // Ignore parsing errors, means no task was found
    }
    return null;
};
