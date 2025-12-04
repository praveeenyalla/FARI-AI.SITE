import React from 'react';

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: string;
  attachment?: Attachment;
  sources?: { uri: string; title: string }[];
  imageUrl?: string;
  imagePrompt?: string;
  videoUrl?: string;
  audioDescription?: string;
  status?: 'generating' | 'completed' | 'failed';
  originalPrompt?: string;
  isThinkingLonger?: boolean;
  thinkLongerConfig?: ThinkConfig;
  actionableTask?: {
    title: string;
    detected: boolean; // Flag to prevent re-checking
  };
}

export type ChatModeId = 'companion' | 'unhinged_comedian' | 'loyal_friend' | 'homework_helper' | 'therapist' | 'deep_researcher' | 'image_creator' | 'video_creator' | 'coding_expert' | 'website_creator' | 'neutral' | 'travel_planner' | 'creative_writer' | 'guided_learning' | 'job_search_assistant' | 'strategic_thinker' | 'canvas' | 'document_qa' | 'n8n_workflow_expert' | 'fari_doc' | 'latest_news';

export interface ChatMode {
  id: ChatModeId;
  name: string;
  icon: (props: React.SVGProps<SVGSVGElement>) => React.ReactElement;
  placeholder: string;
  systemInstruction: string;
  color: string;
}

export interface Attachment {
  name: string;
  type: string;
  dataUrl: string;
}

export interface FileNode {
  path: string;
  content: string;
}

export type ProjectFiles = FileNode[];

// Add new types for AVO versions
export type FariModelId = 'fari_3_5' | 'fari_4' | 'fari_vision';

export interface FariModel {
  id: FariModelId;
  name: string;
  description: string;
  icon: (props: React.SVGProps<SVGSVGElement>) => React.ReactElement;
}

export interface Asset {
  id: string; // Corresponds to the message ID
  type: 'image' | 'video';
  url: string; // dataUrl for image, objectUrl for video
  prompt: string;
  timestamp: string;
}

export interface CanvasNode {
    id: string;
    x: number;
    y: number;
    text: string;
    width: number;
    height: number;
}

export interface CanvasEdge {
    id: string;
    from: string;
    to: string;
}

export interface CanvasState {
    nodes: CanvasNode[];
    edges: CanvasEdge[];
    transform: {
        x: number;
        y: number;
        scale: number;
    };
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  mode: ChatMode;
  projectFiles?: ProjectFiles;
  assets?: Asset[];
  fariModelId: FariModelId;
  canvasState?: CanvasState;
  documentContent?: string;
  attachedFile?: {
    name: string;
    type: string;
    content: string; // For text files
    dataUrl: string; // For images
  };
  isPinned?: boolean;
}

export interface ThinkConfig {
    timeBudget: number; // in seconds
    verbosity: 'short' | 'detailed';
    useWeb: boolean;
    showSteps: boolean;
}

export interface CanvasAIResponseNode {
  title: string;
  children?: CanvasAIResponseNode[];
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string; // ISO string
  createdAt: string; // ISO string
}

export type MainView = 'chat' | 'tasks' | 'history' | 'tools' | 'my-media';