import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Attachment } from '../types';
import { TrashIcon, ImageIcon, VideoIcon, FileTextIcon, BrushIcon, EraserIcon, RotateCcwIcon, RotateCwIcon, XIcon, LineIcon, SquareIcon, ArrowLeftIcon } from './Icons';

interface DrawViewProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (type: 'image' | 'video' | 'prompt', attachment: Attachment) => void;
  isSending: boolean;
}

type DrawTool = 'brush' | 'eraser' | 'line' | 'rectangle';

const DrawView: React.FC<DrawViewProps> = ({ isOpen, onClose, onGenerate, isSending }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<DrawTool>('brush');
  const [color, setColor] = useState('#FFFFFF');
  const [lineWidth, setLineWidth] = useState(5);
  const [isLineWidthPickerOpen, setIsLineWidthPickerOpen] = useState(false);
  const [showGenerateOptions, setShowGenerateOptions] = useState(false);

  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const snapshotRef = useRef<ImageData | null>(null);
  const startPosRef = useRef<{ x: number, y: number } | null>(null);

  const prepareCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { width, height } = canvas.getBoundingClientRect();
    if (width === 0 || height === 0) return;
    
    const scale = window.devicePixelRatio;
    canvas.width = width * scale;
    canvas.height = height * scale;
    
    const context = canvas.getContext('2d');
    if (context) {
        context.scale(scale, scale);
        contextRef.current = context;
        // Set initial state after context is ready
        context.lineCap = 'round';
        context.strokeStyle = color;
        context.lineWidth = lineWidth;
        context.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
    }
  }, [color, lineWidth, tool]);

  const saveToHistory = useCallback(() => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;
    
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(context.getImageData(0, 0, canvas.width, canvas.height));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);
  
  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (canvas && context) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        const blankImageData = context.getImageData(0, 0, canvas.width, canvas.height);
        setHistory([blankImageData]);
        setHistoryIndex(0);
        setShowGenerateOptions(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
        // Use a timeout to ensure the canvas has rendered and has dimensions
        setTimeout(() => {
            prepareCanvas();
            clearCanvas();
        }, 50);
    }
  }, [isOpen, prepareCanvas, clearCanvas]);

  useEffect(() => {
      const context = contextRef.current;
      if (context) {
          context.strokeStyle = color;
          context.lineWidth = lineWidth;
          context.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
      }
  }, [color, lineWidth, tool]);

  const getMousePos = (nativeEvent: MouseEvent): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: nativeEvent.clientX - rect.left,
      y: nativeEvent.clientY - rect.top,
    };
  };

  const startDrawing = ({ nativeEvent }: React.MouseEvent) => {
    const context = contextRef.current;
    if (!context) return;
    const { x, y } = getMousePos(nativeEvent);
    
    startPosRef.current = { x, y };
    setIsDrawing(true);

    if (tool === 'line' || tool === 'rectangle') {
      snapshotRef.current = context.getImageData(0, 0, context.canvas.width, context.canvas.height);
    }
    context.beginPath();
    context.moveTo(x, y);
  };

  const finishDrawing = () => {
    if (isDrawing) {
        contextRef.current?.closePath();
        saveToHistory();
    }
    setIsDrawing(false);
    startPosRef.current = null;
    snapshotRef.current = null;
  };

  const draw = ({ nativeEvent }: React.MouseEvent) => {
    if (!isDrawing) return;
    const context = contextRef.current;
    const startPos = startPosRef.current;
    if (!context || !startPos) return;

    const { x, y } = getMousePos(nativeEvent);

    if (snapshotRef.current && (tool === 'line' || tool === 'rectangle')) {
        context.putImageData(snapshotRef.current, 0, 0);
    }
    
    switch (tool) {
        case 'brush':
        case 'eraser':
            context.lineTo(x, y);
            context.stroke();
            break;
        case 'line':
            context.beginPath();
            context.moveTo(startPos.x, startPos.y);
            context.lineTo(x, y);
            context.stroke();
            break;
        case 'rectangle':
            context.beginPath();
            context.strokeRect(startPos.x, startPos.y, x - startPos.x, y - startPos.y);
            break;
    }
  };
  
  const undo = () => {
    if (historyIndex <= 0) return;
    const newIndex = historyIndex - 1;
    contextRef.current?.putImageData(history[newIndex], 0, 0);
    setHistoryIndex(newIndex);
  };

  const redo = () => {
    if (historyIndex >= history.length - 1) return;
    const newIndex = historyIndex + 1;
    contextRef.current?.putImageData(history[newIndex], 0, 0);
    setHistoryIndex(newIndex);
  };

  const handleGenerate = (type: 'image' | 'prompt' | 'video') => {
    if (isSending || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL('image/png');
    const attachment: Attachment = {
        name: 'sketch.png',
        type: 'image/png',
        dataUrl: dataUrl,
    };
    onGenerate(type, attachment);
  };

  const colors = ['#FFFFFF', '#EF4444', '#EAB308', '#22C55E', '#3B82F6', '#000000'];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#111] flex flex-col animate-fadeInUp">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-black/30 hover:bg-black/60 text-white z-20">
            <XIcon className="w-6 h-6" />
        </button>
      <div className="flex-1 relative">
          <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseUp={finishDrawing}
              onMouseMove={draw}
              onMouseLeave={finishDrawing}
              className="w-full h-full cursor-crosshair"
          />
      </div>
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center justify-center gap-2 p-2 bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-xl shadow-lg">
        {showGenerateOptions ? (
             <>
                <button onClick={() => setShowGenerateOptions(false)} className="p-2 text-slate-300 hover:text-white"><ArrowLeftIcon className="w-5 h-5" /></button>
                <div className="w-px h-6 bg-slate-700 mx-1"></div>
                <button onClick={() => handleGenerate('image')} disabled={isSending} className="flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg transition-all bg-orange-500/80 hover:bg-orange-600/80 text-white disabled:opacity-50">
                    <ImageIcon className="w-4 h-4" /> Image
                </button>
                <button onClick={() => handleGenerate('video')} disabled={isSending} className="flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg transition-all bg-pink-500/80 hover:bg-pink-600/80 text-white disabled:opacity-50">
                    <VideoIcon className="w-4 h-4" /> Video
                </button>
                <button onClick={() => handleGenerate('prompt')} disabled={isSending} className="flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg transition-all bg-purple-500/80 hover:bg-purple-600/80 text-white disabled:opacity-50">
                    <FileTextIcon className="w-4 h-4" /> Prompt
                </button>
            </>
        ) : (
            <>
                {colors.map(c => (
                    <button key={c} onClick={() => setColor(c)} className={`w-7 h-7 rounded-full transition-transform hover:scale-110 border-2 ${color === c ? 'border-white scale-110' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                ))}
                <div className="relative">
                    <button onClick={() => setIsLineWidthPickerOpen(p => !p)} className="p-2 text-slate-300 hover:text-white"><LineIcon className="w-5 h-5"/></button>
                    {isLineWidthPickerOpen && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-3 bg-slate-800/90 rounded-lg shadow-lg">
                            <input type="range" min="1" max="50" value={lineWidth} onChange={e => setLineWidth(parseInt(e.target.value, 10))} className="w-32" />
                        </div>
                    )}
                </div>
                <div className="w-px h-6 bg-slate-700 mx-1"></div>
                <button onClick={undo} disabled={historyIndex <= 0} className="p-2 text-slate-300 hover:text-white disabled:opacity-50" title="Undo"><RotateCcwIcon className="w-5 h-5" /></button>
                <button onClick={redo} disabled={historyIndex >= history.length - 1} className="p-2 text-slate-300 hover:text-white disabled:opacity-50" title="Redo"><RotateCwIcon className="w-5 h-5" /></button>
                <button onClick={clearCanvas} className="p-2 text-slate-300 hover:text-white" aria-label="Clear canvas"><TrashIcon className="w-5 h-5" /></button>
                <div className="w-px h-6 bg-slate-700 mx-1"></div>
                 <button onClick={() => setShowGenerateOptions(true)} disabled={historyIndex <= 0} className="px-4 py-2 text-sm font-semibold rounded-lg transition-all bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50">
                    Done
                 </button>
            </>
        )}
      </div>
    </div>
  );
};

export default DrawView;
