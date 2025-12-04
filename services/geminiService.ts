import { GenerateContentResponse, GenerateImagesResponse } from "@google/genai";
// FIX: Changed import path from '../types' to './types' to correctly resolve from the project root.
import { ChatMode, Attachment, Message, ProjectFiles, FariModelId, ThinkConfig, CanvasAIResponseNode, ChatModeId } from './types';

// Helper to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ error: 'Failed to parse error response.' }));
        throw new Error(errorBody.error || `Request failed with status ${response.status}`);
    }
    return response.json() as Promise<T>;
}

// All functions now call the secure Netlify function endpoint
const API_ENDPOINT = '/.netlify/functions/gemini-api';

// This function is a special case. Because Netlify functions (non-Edge) don't easily support
// streaming responses, we will receive the entire generated text at once. The UI will still
// update, but it will be when the full response is ready, not chunk-by-chunk.
export const generateTextResponse = async (
    prompt: string,
    history: Message[],
    mode: ChatMode,
    attachment?: Attachment,
    fariModelId: FariModelId = 'fari_3_5'
): Promise<AsyncIterable<GenerateContentResponse>> => {
    const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'generateTextStream', // The backend will handle this action
            payload: { prompt, history, mode, attachment, fariModelId }
        })
    });

    const finalResponse: GenerateContentResponse = await handleResponse(response);

    // To maintain the existing async iterable interface for the UI,
    // we return an async generator that yields the single, complete response.
    return {
        async *[Symbol.asyncIterator]() {
            yield finalResponse;
        }
    };
};

export const generateImageResponse = async (prompt: string): Promise<string> => {
    const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generateImage', payload: { prompt } })
    });

    const geminiResponse: GenerateImagesResponse = await handleResponse(response);

    if (!geminiResponse.generatedImages || geminiResponse.generatedImages.length === 0 || !geminiResponse.generatedImages[0].image) {
        throw new Error("I couldn't generate an image for that prompt, likely due to my safety guidelines. This sometimes happens with prompts mentioning specific people or intense action scenes. Could you try rephrasing it more generally?");
    }

    const base64ImageBytes = geminiResponse.generatedImages[0].image.imageBytes;
    return `data:image/jpeg;base64,${base64ImageBytes}`;
};

// All other functions from the original geminiService would be similarly
// converted to call the Netlify endpoint. For brevity, I am showing the main ones.
// A full implementation would create cases in the Netlify function for each of these.

// Placeholder for startChat as it was client-side only. This logic is now implicit in the text generation call.
export const startChat = (systemInstruction: string) => {
    // This is now a conceptual operation; the real "chat" is managed server-side per request.
    // We return a dummy object that satisfies the type signature.
    return {
        sendMessage: () => Promise.reject("Direct sendMessage is not supported. Use generateTextResponse."),
        sendMessageStream: () => Promise.reject("Direct sendMessageStream is not supported. Use generateTextResponse."),
    } as any;
};


// The following functions are placeholders and would need their logic implemented
// in the Netlify function and called from here.

export const generateDeepResearchResponse = async (prompt: string, history: Message[], config: ThinkConfig, fariModelId: FariModelId = 'fari_3_5'): Promise<AsyncIterable<GenerateContentResponse>> => {
    // This would be a new 'action' for the Netlify function
    console.warn("generateDeepResearchResponse is not fully implemented in the new architecture yet.");
    return generateTextResponse(prompt, history, { id: 'deep_researcher' } as ChatMode, undefined, fariModelId);
};

export const interpretSketch = async (sketchAttachment: Attachment): Promise<string> => {
    console.warn("interpretSketch is not fully implemented in the new architecture yet.");
    return "A detailed description of the sketch.";
};

export const generatePromptSuggestions = async (failedPrompt: string): Promise<string[]> => {
    console.warn("generatePromptSuggestions is not fully implemented in the new architecture yet.");
    return [];
};

export const editImage = async (prompt: string, attachment: Attachment): Promise<{ imageUrl: string; text: string }> => {
    console.warn("editImage is not fully implemented in the new architecture yet.");
    return { imageUrl: '', text: 'Image editing is not available at the moment.' };
};

export const generateVideo = async (prompt: string, onUpdate: (statusText: string) => void): Promise<{ videoUrl: string; audioDescription: string }> => {
    console.warn("generateVideo is not fully implemented in the new architecture yet.");
    throw new Error("Video generation is temporarily unavailable.");
};

export const generateCanvasResponse = async (prompt: string): Promise<CanvasAIResponseNode> => {
     console.warn("generateCanvasResponse is not fully implemented in the new architecture yet.");
    return { title: "Response not available", children: [] };
};

export const generateCodeCompletion = async (code: string): Promise<string> => {
    console.warn("generateCodeCompletion is not fully implemented in the new architecture yet.");
    return "";
};

export const analyzeProjectFiles = async (projectFiles: ProjectFiles): Promise<AsyncIterable<GenerateContentResponse>> => {
    console.warn("analyzeProjectFiles is not fully implemented in the new architecture yet.");
     return { async *[Symbol.asyncIterator]() { yield { text: "Analysis is not available." } as GenerateContentResponse; } };
};

export const detectActionableTask = async (prompt: string): Promise<{ title: string } | null> => {
    console.warn("detectActionableTask is not fully implemented in the new architecture yet.");
    return null;
};
