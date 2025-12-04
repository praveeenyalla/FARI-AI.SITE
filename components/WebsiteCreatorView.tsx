// Fix: Correctly import React and its hooks to resolve "Cannot find name" errors.
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Chat, FileNode, ProjectFiles } from '../types';
import { 
    CodeXmlIcon, EyeIcon, DownloadIcon, FolderIcon, FileTextIcon, SendIcon,
    ReactIcon, ViteIcon, TailwindIcon, GithubIcon, SupabaseIcon, StripeIcon,
    // Fix: Import `GridIcon` to resolve "Cannot find name 'GridIcon'" error.
    DatabaseIcon, ChevronDownIcon, CloudIcon, GridIcon, CubeIcon, XIcon, SparklesIcon
} from './Icons';
import { generateCodeCompletion, analyzeProjectFiles } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark as atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import { useAuth } from '../contexts/AuthContext';

interface WebsiteCreatorViewProps {
  activeChat: Chat | undefined;
  onSendMessage: (message: string) => void;
  isSending: boolean;
  setChats: React.Dispatch<React.SetStateAction<Chat[]>>;
}

// --- HELPER FUNCTIONS ---

// Add a declaration for JSZip, which is loaded from a script tag in index.html
declare var JSZip: any;

const downloadProjectAsZip = async (files: ProjectFiles, projectName: string) => {
  if (typeof JSZip === 'undefined') {
    console.error('JSZip library is not loaded. Cannot download project.');
    alert('An error occurred while preparing the download. Please try again later.');
    return;
  }
  
  const zip = new JSZip();
  files.forEach(file => {
    // JSZip can create folders in the path
    zip.file(file.path, file.content);
  });
  
  try {
    const content = await zip.generateAsync({ type: "blob" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(content);
    // Sanitize project name for filename
    const safeProjectName = (projectName || 'website-project').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.download = `${safeProjectName}.zip`;
    
    // Append link to body, click it, and then remove it
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the object URL
    URL.revokeObjectURL(link.href);
  } catch (err) {
    console.error("Failed to generate zip file:", err);
    alert("An error occurred while creating the project zip file.");
  }
};


const getFileIcon = (path: string) => {
    if (path.endsWith('.tsx') || path.endsWith('.jsx')) return <ReactIcon className="w-4 h-4" />;
    if (path.endsWith('package.json')) return <FileTextIcon className="w-4 h-4 text-orange-400" />;
    if (path.endsWith('.css')) return <TailwindIcon className="w-4 h-4" />;
    if (path.endsWith('vite.config.ts') || path.endsWith('vite.config.js')) return <ViteIcon className="w-4 h-4" />;
    if (path.endsWith('.gltf') || path.endsWith('.glb')) return <CubeIcon className="w-4 h-4 text-yellow-400" />;
    return <FileTextIcon className="w-4 h-4 text-slate-400" />;
};

// --- SUB-COMPONENTS ---

// Re-using the CodeBlock component logic from Message.tsx for the analysis modal
const AnalysisCodeBlock: React.FC<{ language: string | undefined; value: string }> = ({ language, value }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-2 rounded-lg bg-[#1e1e1e] font-sans">
      <div className="flex items-center justify-between px-4 py-1.5 bg-slate-800/70 rounded-t-lg">
        <span className="text-xs text-slate-400">{language || 'code'}</span>
        <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white">
          {copied ? 'Copied!' : 'Copy code'}
        </button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={atomOneDark}
        wrapLines={true}
        customStyle={{ margin: 0, padding: '1rem', background: 'transparent', borderRadius: '0 0 0.5rem 0.5rem' }}
        codeTagProps={{ style: { fontFamily: 'inherit', whiteSpace: 'pre-wrap', wordBreak: 'break-word' } }}
      >
        {String(value).replace(/\n$/, '')}
      </SyntaxHighlighter>
    </div>
  );
};


// Analysis Modal Component
const AnalysisModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  analysisResult: string;
  isAnalyzing: boolean;
}> = ({ isOpen, onClose, analysisResult, isAnalyzing }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose} role="dialog" aria-modal="true">
      <div className="relative w-full max-w-3xl h-[80vh] bg-[#1C1F26] rounded-xl border border-white/10 shadow-2xl flex flex-col animate-fadeInUp" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-purple-400"/> AVA Pro Project Analysis
          </h2>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-white/10 hover:text-white transition-transform hover:scale-110" aria-label="Close modal">
            <XIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 p-6 overflow-y-auto">
          {isAnalyzing && !analysisResult && (
            <div className="flex items-center justify-center h-full text-slate-400">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin"></div>
                Analyzing project files...
              </div>
            </div>
          )}
          <div className="prose prose-invert prose-sm max-w-none prose-p:my-2 prose-pre:my-2">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  return match ? (
                    <AnalysisCodeBlock language={match[1]} value={String(children).replace(/\n$/, '')} />
                  ) : (
                    <code className={className} {...props}>{children}</code>
                  );
                }
              }}
            >
              {analysisResult}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
};

const FileExplorer: React.FC<{ files: ProjectFiles; onFileSelect: (path: string) => void; activeFile: string | null }> = ({ files, onFileSelect, activeFile }) => {
    const fileTree = useMemo(() => {
        const tree: any = {};
        files.forEach(file => {
            let currentLevel = tree;
            const pathParts = file.path.split('/');
            pathParts.forEach((part, index) => {
                if (!currentLevel[part]) currentLevel[part] = { _files: {}, _isLeaf: false };
                if (index === pathParts.length - 1) {
                    currentLevel[part]._isLeaf = true;
                    currentLevel[part]._path = file.path;
                }
                currentLevel = currentLevel[part];
            });
        });
        return tree;
    }, [files]);

    const renderTree = (node: any) => {
        return Object.entries(node).sort(([a], [b]) => a.localeCompare(b)).map(([name, value]: [string, any]) => {
            if (name.startsWith('_')) return null;
            if (value._isLeaf) {
                return (
                    <li key={value._path}>
                        <button onClick={() => onFileSelect(value._path)} className={`w-full flex items-center gap-2 px-2 py-1 text-left text-sm rounded ${activeFile === value._path ? 'bg-blue-600/30 text-white' : 'hover:bg-slate-700/50 text-slate-300'}`}>
                           {getFileIcon(value._path)} <span className="truncate">{name}</span>
                        </button>
                    </li>
                );
            } else {
                return (
                    <li key={name}>
                        <details open className="text-sm text-slate-400">
                            <summary className="flex items-center gap-2 cursor-pointer py-1 list-none font-semibold">
                                <FolderIcon className="w-4 h-4 text-sky-400"/> {name}
                            </summary>
                            <ul className="pl-4 border-l border-slate-700 ml-2">{renderTree(value)}</ul>
                        </details>
                    </li>
                );
            }
        });
    };
    return <ul className="space-y-1">{renderTree(fileTree)}</ul>;
};

const CodeEditor: React.FC<{ 
  file: FileNode | undefined; 
  onCodeChange: (newContent: string) => void; 
}> = ({ file, onCodeChange }) => {
    const [editorValue, setEditorValue] = useState(file?.content || '');
    const [suggestion, setSuggestion] = useState('');
    const [isSuggesting, setIsSuggesting] = useState(false);

    const debounceRef = useRef<number | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const backdropRef = useRef<HTMLDivElement>(null);

    // Sync editor when the selected file changes
    useEffect(() => {
        setEditorValue(file?.content || '');
        setSuggestion(''); // Clear suggestion for new file
    }, [file]);

    // Debounced effect for fetching suggestions
    useEffect(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }
        if (!editorValue || isSuggesting) {
            setSuggestion('');
            return;
        }

        debounceRef.current = window.setTimeout(async () => {
            setIsSuggesting(true);
            try {
                const completion = await generateCodeCompletion(editorValue);
                // Only show suggestion if user hasn't typed more
                if (textareaRef.current?.value === editorValue) {
                    setSuggestion(completion);
                }
            } catch (error) {
                console.error("Code completion failed:", error);
                setSuggestion('');
            } finally {
                setIsSuggesting(false);
            }
        }, 1500); // 1.5-second debounce

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [editorValue, isSuggesting]);
    
    // Sync scroll between textarea and backdrop
    const handleScroll = () => {
        if (backdropRef.current && textareaRef.current) {
            backdropRef.current.scrollTop = textareaRef.current.scrollTop;
            backdropRef.current.scrollLeft = textareaRef.current.scrollLeft;
        }
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setSuggestion(''); // Clear old suggestion on new input
        setEditorValue(e.target.value);
        onCodeChange(e.target.value); // Propagate change up
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // Accept suggestion with Tab
        if (e.key === 'Tab' && suggestion) {
            e.preventDefault();
            const newValue = editorValue + suggestion;
            setEditorValue(newValue);
            onCodeChange(newValue);
            setSuggestion('');
        }
    };

    if (!file) {
        return <div className="flex items-center justify-center h-full text-slate-500 bg-[#1e1e1e]">Select a file to view</div>;
    }
    
    // Common styles for both textarea and backdrop to ensure perfect overlap
    const editorStyles: React.CSSProperties = {
        fontFamily: 'monospace',
        fontSize: '14px',
        lineHeight: '1.5',
        padding: '16px',
        margin: 0,
        border: 'none',
        outline: 'none',
        resize: 'none',
        whiteSpace: 'pre-wrap',
        overflowWrap: 'break-word',
        overflow: 'auto',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
    };

    return (
        <div className="relative w-full h-full bg-[#1e1e1e]">
            <div 
                ref={backdropRef}
                className="absolute inset-0 text-slate-200 pointer-events-none"
                style={editorStyles}
                aria-hidden="true"
            >
                {editorValue}
                <span className="text-slate-500 opacity-70">{suggestion}</span>
            </div>
            <textarea
                ref={textareaRef}
                key={file.path}
                value={editorValue}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onScroll={handleScroll}
                className="absolute inset-0 w-full h-full bg-transparent text-transparent caret-white"
                style={editorStyles}
                spellCheck="false"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
            />
        </div>
    );
};

const Toolbar: React.FC<{ onDownload: () => void; is3DProject: boolean; onAnalyze: () => void; showAnalyzeButton: boolean; }> = ({ onDownload, is3DProject, onAnalyze, showAnalyzeButton }) => {
    return (
        <div className="flex-shrink-0 bg-black/50 border-b border-slate-700/50 p-2 flex items-center justify-end gap-2 flex-wrap">
            {showAnalyzeButton && (
                <button 
                    onClick={onAnalyze} 
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 transform hover:scale-105 button-gradient-animated text-white"
                    title="Use AVA Pro to analyze your project"
                >
                    <SparklesIcon className="w-4 h-4"/> Analyze Project
                </button>
            )}
            {is3DProject ? (
                 <button onClick={onDownload} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 transform hover:scale-105 bg-green-600/80 hover:bg-green-700/80 text-white">
                    <CubeIcon className="w-4 h-4"/> Export Project & 3D Model (.zip)
                </button>
            ) : (
                <>
                    <ToolbarDropdown icon={<DatabaseIcon className="w-4 h-4"/>} label="Database">
                        <a href="#" className="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-700">SQLite</a>
                        <a href="#" className="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-700">Firebase</a>
                        <a href="#" className="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-700">MongoDB</a>
                    </ToolbarDropdown>
                    <ToolbarDropdown icon={<CloudIcon className="w-4 h-4"/>} label="Deploy">
                         <a href="#" className="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-700">Netlify</a>
                         <a href="#" className="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-700">Vercel</a>
                         <a href="#" className="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-700">AWS</a>
                    </ToolbarDropdown>
                    <button onClick={onDownload} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 transform hover:scale-105 bg-slate-700 hover:bg-slate-600 text-slate-200">
                        <DownloadIcon className="w-4 h-4"/> Self-host (.zip)
                    </button>
                </>
            )}
        </div>
    );
};

const ToolbarDropdown: React.FC<{icon: React.ReactNode, label: string, children: React.ReactNode}> = ({ icon, label, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [ref]);

    return (
        <div className="relative" ref={ref}>
            <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 transform hover:scale-105 bg-slate-700 hover:bg-slate-600 text-slate-200">
                {icon} {label} <ChevronDownIcon className="w-3 h-3"/>
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-md shadow-lg z-20 overflow-hidden">
                    {children}
                </div>
            )}
        </div>
    );
};


const TemplateCard: React.FC<{ title: string; description: string; icon: React.ReactNode; onClick: () => void }> = ({ title, description, icon, onClick }) => (
    <button onClick={onClick} className="bg-slate-800/50 p-6 rounded-lg text-left hover:bg-slate-700/70 border border-slate-700 hover:border-blue-500 transition-all transform hover:scale-105">
        <div className="flex items-center gap-4 mb-3">
            <div className="bg-slate-700 p-2 rounded-full">{icon}</div>
            <h3 className="text-xl font-bold text-white">{title}</h3>
        </div>
        <p className="text-slate-400">{description}</p>
    </button>
);

const InitialScreen: React.FC<{ onSendMessage: (prompt: string) => void }> = ({ onSendMessage }) => {
    const templates = [
        { title: 'Portfolio', description: 'A modern, responsive portfolio for a photographer.', icon: <ReactIcon className="w-6 h-6 text-cyan-400"/>, prompt: 'Create a modern portfolio website for a photographer named Alex Doe. It should have a gallery, about, and contact page.' },
        { title: '3D Solar System', description: 'An animated model of the solar system.', icon: <CubeIcon className="w-6 h-6 text-yellow-400"/>, prompt: 'Create an animated 3D model of the solar system with the Sun, Earth, and Moon. The Earth should orbit the Sun, and the Moon should orbit the Earth. Use Three.js.' },
        { title: 'Dashboard', description: 'An admin dashboard layout with sidebar and charts.', icon: <GridIcon className="w-6 h-6 text-purple-400"/>, prompt: 'Generate a React admin dashboard with a sidebar, a main content area, and placeholder charts. Use Tailwind CSS for styling.' },
        { title: 'Landing Page', description: 'A stylish landing page for a new SaaS product.', icon: <EyeIcon className="w-6 h-6 text-pink-400"/>, prompt: 'Create a landing page for a new SaaS product called "SynthWave". It should have a hero section with a call-to-action, a features section, and a footer.' },
    ];

    return (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4 md:p-8 bg-black/50 h-full">
            <CodeXmlIcon className="w-16 h-16 text-green-400 mb-4"/>
            <h1 className="text-3xl font-bold text-white mb-2">Website Creator</h1>
            <p className="text-slate-300 max-w-lg mb-8">Start by describing the website you want to build, or choose a template below.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl w-full">
                {templates.map(t => <TemplateCard key={t.title} {...t} onClick={() => onSendMessage(t.prompt)} />)}
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---

const WebsiteCreatorView: React.FC<WebsiteCreatorViewProps> = ({ activeChat, onSendMessage, isSending, setChats }) => {
    const { user } = useAuth();
    const projectFiles = activeChat?.projectFiles;
    const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');
    const [activeFilePath, setActiveFilePath] = useState<string | null>(null);
    const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
    const [analysisResult, setAnalysisResult] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isFileExplorerOpen, setIsFileExplorerOpen] = useState(false);

    const is3DProject = useMemo(() => {
        if (!projectFiles) return false;
        const htmlFile = projectFiles.find(f => f.path === 'index.html');
        return htmlFile?.content.includes('three.module.js') || projectFiles.some(f => f.path.endsWith('.gltf'));
    }, [projectFiles]);
    
    const handleFileContentChange = (filePath: string, newContent: string) => {
        if (!activeChat) return;

        setChats(prevChats => 
            prevChats.map(chat => {
                if (chat.id === activeChat.id && chat.projectFiles) {
                    const newProjectFiles = chat.projectFiles.map(file => 
                        file.path === filePath ? { ...file, content: newContent } : file
                    );
                    return { ...chat, projectFiles: newProjectFiles };
                }
                return chat;
            })
        );
    };

    const handleAnalyzeProject = async () => {
        if (!activeChat?.projectFiles || activeChat.projectFiles.length === 0) {
            alert("There are no project files to analyze.");
            return;
        }

        setIsAnalysisModalOpen(true);
        setIsAnalyzing(true);
        setAnalysisResult('');

        try {
            const stream = await analyzeProjectFiles(activeChat.projectFiles);
            let fullResponse = '';
            for await (const chunk of stream) {
                fullResponse += chunk.text;
                setAnalysisResult(fullResponse);
            }
        } catch (error) {
            console.error("Project analysis failed:", error);
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
            setAnalysisResult(`**Error:** Failed to analyze the project. ${errorMessage}`);
        } finally {
            setIsAnalyzing(false);
        }
    };

    useEffect(() => {
        if (projectFiles && !activeFilePath) {
            const defaultFile = projectFiles.find(f => f.path.endsWith('App.tsx') || f.path.endsWith('App.jsx') || f.path.endsWith('index.html'));
            setActiveFilePath(defaultFile?.path || projectFiles[0]?.path || null);
        } else if (!projectFiles) {
            setActiveFilePath(null); // Reset on new chat
        }
    }, [projectFiles, activeFilePath]);

    const previewSrcDoc = useMemo(() => {
        if (!projectFiles) {
            return '';
        }

        const htmlFile = projectFiles.find(f => f.path === 'index.html');
        if (!htmlFile) {
            return '<!DOCTYPE html><html><body style="font-family: sans-serif; color: #ccc; background-color: #1e293b; text-align: center; padding-top: 50px;"><h1>Preview Unavailable</h1><p>No index.html file was found in the project.</p></body></html>';
        }

        // For 3D projects, the HTML is used as-is, allowing its script to run.
        if (is3DProject) {
            return htmlFile.content;
        }
        
        // --- Static Preview Enhancement for React Projects ---
        let htmlContent = htmlFile.content;
        
        // Inject Tailwind CDN for static styling.
        const tailwindScript = '<script src="https://cdn.tailwindcss.com"></script>';
        if (!htmlContent.includes('cdn.tailwindcss.com')) {
             if (htmlContent.includes('</head>')) {
                 htmlContent = htmlContent.replace('</head>', `${tailwindScript}</head>`);
             } else {
                 htmlContent = tailwindScript + htmlContent;
             }
        }
        
        // Disable the main React script to prevent a blank page.
        htmlContent = htmlContent.replace(/<script type="module" src="[^"]+"><\/script>/gs, '<!-- React/Vite script disabled for static preview -->');
        
        // --- Generate intelligent placeholder by extracting content ---
        let extractedHeading = '';
        let extractedParagraph = '';

        const appFile = projectFiles.find(f => f.path.includes('App.jsx') || f.path.includes('App.tsx'));
        if (appFile) {
            const headingMatch = appFile.content.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
            if (headingMatch && headingMatch[1]) {
                 // Clean up potential template literals or JSX expressions for a clean preview
                extractedHeading = headingMatch[1].replace(/{[^}]+}/g, '').replace(/`/g, '').trim();
            }

            const paragraphMatch = appFile.content.match(/<p[^>]*>([\s\S]*?)<\/p>/);
            if (paragraphMatch && paragraphMatch[1]) {
                extractedParagraph = paragraphMatch[1].replace(/{[^}]+}/g, '').replace(/`/g, '').trim();
            }
        }
        
        const titleMatch = htmlFile.content.match(/<title>([\s\S]*?)<\/title>/);
        if (!extractedHeading && titleMatch && titleMatch[1]) {
            extractedHeading = titleMatch[1];
        }

        const placeholder = `
            <div id="root">
                <div style="font-family: Inter, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; background-color: #0F1015; color: #D1D5DB; padding: 2rem; box-sizing: border-box;">
                    <div style="text-align: center; max-width: 600px; width: 100%; border: 1px dashed #374151; padding: 2.5rem; border-radius: 0.75rem;">
                        <h2 style="font-size: 1rem; color: #6B7280; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 0.5rem 0;">Static Preview</h2>
                        <p style="color: #4B5563; margin: 0 0 2rem 0; font-size: 0.9rem;">Interactive components are not rendered in this view.</p>
                        
                        <div style="border-top: 1px solid #374151; padding-top: 2rem;">
                            <h1 style="font-size: 2.25rem; font-weight: bold; color: #F9FAFB; margin: 0; line-height: 1.2;">${extractedHeading || 'Website Content'}</h1>
                            ${extractedParagraph ? `<p style="font-size: 1rem; color: #9CA3AF; margin: 1rem 0 0 0; line-height: 1.6;">${extractedParagraph}</p>` : ''}
                        </div>
                    </div>
                </div>
            </div>`;
        
        // Replace the body content to ensure our placeholder takes over.
        return htmlContent.replace(/<body[^>]*>[\s\S]*<\/body>/, `<body>${placeholder}</body>`);
    }, [projectFiles, is3DProject]);


    if (!projectFiles) {
        return <InitialScreen onSendMessage={onSendMessage} />;
    }
    
    const activeFileContent = projectFiles.find(f => f.path === activeFilePath);

    const fileExplorerPanel = (
        <aside className="w-[280px] flex-shrink-0 flex flex-col bg-black/60 h-full border-r border-slate-700/50">
            <div className="p-3 border-b border-slate-700/50 flex items-center justify-between">
                <h2 className="text-base font-semibold text-white">File Explorer</h2>
                <button onClick={() => setIsFileExplorerOpen(false)} className="p-1 md:hidden text-slate-400 hover:text-white">
                    <XIcon className="w-5 h-5" />
                </button>
            </div>
            <div className="flex-1 p-2 space-y-4 overflow-y-auto">
                <FileExplorer 
                    files={projectFiles} 
                    onFileSelect={(path) => {
                        setActiveFilePath(path);
                        setIsFileExplorerOpen(false); // Close on file select on mobile
                    }} 
                    activeFile={activeFilePath} 
                />
            </div>
        </aside>
    );

    return (
        <div className="flex h-full w-full bg-[#1a1a1a] text-white flex-col">
           <Toolbar 
                onDownload={() => downloadProjectAsZip(projectFiles, activeChat?.title || 'avamind-project')} 
                is3DProject={is3DProject}
                onAnalyze={handleAnalyzeProject}
                // Fix: The 'versionId' property does not exist on type 'Chat'. Replaced with a check on the user's plan.
                showAnalyzeButton={user?.plan === 'Pro Plan'}
            />
           <div className="flex-1 flex overflow-hidden relative">
                {/* Mobile File Explorer (Drawer) */}
                <div className={`fixed inset-0 z-40 md:hidden transition-opacity duration-300 ${isFileExplorerOpen ? 'bg-black/50' : 'bg-transparent pointer-events-none'}`} onClick={() => setIsFileExplorerOpen(false)} aria-hidden="true"></div>
                <div className={`fixed inset-y-0 left-0 z-50 md:hidden h-full transition-transform duration-300 ${isFileExplorerOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    {fileExplorerPanel}
                </div>
                
                {/* Desktop File Explorer */}
                <div className="hidden md:flex">
                    {fileExplorerPanel}
                </div>

                <main className="flex-1 flex flex-col h-full">
                    <div className="flex items-center p-1 border-b border-slate-700/50 bg-black/60">
                         <button onClick={() => setIsFileExplorerOpen(true)} className="p-2 mr-2 rounded-md text-slate-300 hover:bg-slate-700/50 hover:text-white md:hidden" aria-label="Open file explorer">
                            <FolderIcon className="w-5 h-5"/>
                        </button>
                        <button onClick={() => setActiveTab('code')} className={`px-3 py-1 text-sm rounded flex items-center gap-2 transition-all duration-200 transform hover:scale-105 ${activeTab === 'code' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-700/50'}`}>
                            <CodeXmlIcon className="w-4 h-4"/> Code
                        </button>
                        <button onClick={() => setActiveTab('preview')} className={`px-3 py-1 text-sm rounded flex items-center gap-2 transition-all duration-200 transform hover:scale-105 ${activeTab === 'preview' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-700/50'}`}>
                            <EyeIcon className="w-4 h-4"/> Preview
                        </button>
                    </div>
                    <div className="flex-1 bg-slate-900 overflow-auto">
                        {activeTab === 'code' ? (
                           <CodeEditor 
                                file={activeFileContent} 
                                onCodeChange={(newContent) => {
                                    if (activeFilePath) {
                                        handleFileContentChange(activeFilePath, newContent);
                                    }
                                }}
                            />
                        ) : (
                            <iframe srcDoc={previewSrcDoc} title="Website Preview" className="w-full h-full border-0" sandbox="allow-scripts allow-same-origin" />
                        )}
                    </div>
                </main>
           </div>
           <AnalysisModal
                isOpen={isAnalysisModalOpen}
                onClose={() => setIsAnalysisModalOpen(false)}
                analysisResult={analysisResult}
                isAnalyzing={isAnalyzing}
            />
        </div>
    );
};

export default WebsiteCreatorView;