import React, { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
// Fix: Module '"../types"' has no exported member 'AvoVersionId'. Replaced with FariModelId.
import { Chat, CanvasState, CanvasNode, CanvasEdge, FariModelId, CanvasAIResponseNode } from '../types';
import { generateCanvasResponse } from '../services/geminiService';
import { PlusIcon, LinkIcon, TrashIcon, SparklesIcon, PencilIcon, PenToolIcon, ZoomInIcon, ZoomOutIcon, CrosshairIcon } from './Icons';

interface CanvasViewProps {
  activeChat: Chat;
  setChats: React.Dispatch<React.SetStateAction<Chat[]>>;
  // Fix: Renamed prop for consistency.
  currentModelId: FariModelId;
}

const NODE_DEFAULTS = { width: 160, height: 80 };

const CanvasView: React.FC<CanvasViewProps> = ({ activeChat, setChats, currentModelId }) => {
  const [canvasState, setCanvasState] = useState<CanvasState>(
    activeChat.canvasState || {
      nodes: [],
      edges: [],
      transform: { x: 0, y: 0, scale: 1 },
    }
  );
  
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, nodeId: string } | null>(null);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [tempEdge, setTempEdge] = useState<{ from: string, x: number, y: number } | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState<string | null>(null);
  const [newlyAddedNodeIds, setNewlyAddedNodeIds] = useState<string[]>([]);

  const canvasRef = useRef<HTMLDivElement>(null);
  const isDraggingCanvas = useRef(false);
  const isDraggingNode = useRef<string | null>(null);
  const dragStart = useRef({ x: 0, y: 0 });
  const nodeStartPos = useRef({ x: 0, y: 0 });
  
  const updateChatState = (newState: Partial<CanvasState>) => {
    const updatedState = { ...canvasState, ...newState };
    setCanvasState(updatedState);
    setChats(prev => prev.map(c => c.id === activeChat.id ? { ...c, canvasState: updatedState } : c));
  };
  
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isEditing || e.button !== 0) return;
    dragStart.current = { x: e.clientX, y: e.clientY };
    if (e.target === canvasRef.current || (e.target as HTMLElement).id === 'canvas-background') {
        isDraggingCanvas.current = true;
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDraggingCanvas.current) {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      dragStart.current = { x: e.clientX, y: e.clientY };
      updateChatState({ transform: { ...canvasState.transform, x: canvasState.transform.x + dx, y: canvasState.transform.y + dy }});
    } else if (isDraggingNode.current) {
      const dx = (e.clientX - dragStart.current.x) / canvasState.transform.scale;
      const dy = (e.clientY - dragStart.current.y) / canvasState.transform.scale;
      const newNodes = canvasState.nodes.map(n => 
        n.id === isDraggingNode.current ? { ...n, x: nodeStartPos.current.x + dx, y: nodeStartPos.current.y + dy } : n
      );
      updateChatState({ nodes: newNodes });
    } else if (tempEdge) {
        const rect = canvasRef.current!.getBoundingClientRect();
        setTempEdge({
            ...tempEdge,
            x: (e.clientX - rect.left - canvasState.transform.x) / canvasState.transform.scale,
            y: (e.clientY - rect.top - canvasState.transform.y) / canvasState.transform.scale
        });
    }
  };

  const handleMouseUp = () => {
    isDraggingCanvas.current = false;
    isDraggingNode.current = null;
    setTempEdge(null);
  };
  
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
      const scaleAmount = -e.deltaY * 0.001;
      const newScale = Math.min(Math.max(0.1, canvasState.transform.scale + scaleAmount), 2);
      const rect = canvasRef.current!.getBoundingClientRect();
      const cursorX = e.clientX - rect.left;
      const cursorY = e.clientY - rect.top;
      const newX = canvasState.transform.x - (cursorX - canvasState.transform.x) * (newScale / canvasState.transform.scale - 1);
      const newY = canvasState.transform.y - (cursorY - canvasState.transform.y) * (newScale / canvasState.transform.scale - 1);
      updateChatState({ transform: { x: newX, y: newY, scale: newScale }});
  };
  
  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target !== canvasRef.current && (e.target as HTMLElement).id !== 'canvas-background') return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = (e.clientX - rect.left - canvasState.transform.x) / canvasState.transform.scale - (NODE_DEFAULTS.width / 2);
    const y = (e.clientY - rect.top - canvasState.transform.y) / canvasState.transform.scale - (NODE_DEFAULTS.height / 2);
    const newNode: CanvasNode = {
      id: uuidv4(),
      x,
      y,
      text: 'New Idea',
      width: NODE_DEFAULTS.width,
      height: NODE_DEFAULTS.height,
    };
    updateChatState({ nodes: [...canvasState.nodes, newNode] });
    setIsEditing(newNode.id);
  };
  
  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    if (e.button !== 0) return; // Ignore right-click and middle-click
    const node = canvasState.nodes.find(n => n.id === nodeId)!;
    isDraggingNode.current = nodeId;
    dragStart.current = { x: e.clientX, y: e.clientY };
    nodeStartPos.current = { x: node.x, y: node.y };
  };
  
  const handleNodeMouseUp = (e: React.MouseEvent, nodeId: string) => {
    if (tempEdge) {
        if (tempEdge.from !== nodeId) {
            const newEdge: CanvasEdge = { id: uuidv4(), from: tempEdge.from, to: nodeId };
            updateChatState({ edges: [...canvasState.edges, newEdge] });
        }
    }
    setTempEdge(null);
  };

  const handleNodeTextChange = (nodeId: string, text: string) => {
      const newNodes = canvasState.nodes.map(n => n.id === nodeId ? {...n, text} : n);
      updateChatState({ nodes: newNodes });
  };
  
  const handleNodeContextMenu = (e: React.MouseEvent, nodeId: string) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({ x: e.clientX, y: e.clientY, nodeId });
  };
  
  const handleDeleteNode = (nodeId: string) => {
      const newNodes = canvasState.nodes.filter(n => n.id !== nodeId);
      const newEdges = canvasState.edges.filter(e => e.from !== nodeId && e.to !== nodeId);
      updateChatState({ nodes: newNodes, edges: newEdges });
      setContextMenu(null);
  };
  
  const handleStartConnection = (nodeId: string) => {
      setTempEdge({ from: nodeId, x: 0, y: 0 }); // x/y will be updated on mouse move
      setContextMenu(null);
  };
  
  const handleAskAI = async (nodeId: string) => {
      setContextMenu(null);
      setIsLoadingAI(nodeId);
      const parentNode = canvasState.nodes.find(n => n.id === nodeId);
      if (!parentNode) return;
      
      try {
        const aiResponse = await generateCanvasResponse(parentNode.text);

        const newNodes: CanvasNode[] = [];
        const newEdges: CanvasEdge[] = [];

        // Recursive function to create nodes from the AI response tree
        const createNodesAndEdges = (parent: { id: string, x: number, y: number, width: number, height: number }, children: CanvasAIResponseNode[], level: number) => {
            const numChildren = children.length;
            if (numChildren === 0) return;

            const radius = Math.max(180, numChildren * 25) * (level + 1); // Increase radius for sub-levels
            const angleStep = (2 * Math.PI) / numChildren;

            children.forEach((child, index) => {
                const angle = index * angleStep;
                const offsetX = Math.cos(angle) * radius;
                const offsetY = Math.sin(angle) * radius;

                const newNode: CanvasNode = {
                    id: uuidv4(),
                    text: child.title,
                    x: parent.x + (parent.width / 2) + offsetX - (NODE_DEFAULTS.width / 2),
                    y: parent.y + (parent.height / 2) + offsetY - (NODE_DEFAULTS.height / 2),
                    width: NODE_DEFAULTS.width,
                    height: NODE_DEFAULTS.height,
                };
                newNodes.push(newNode);
                newEdges.push({ id: uuidv4(), from: parent.id, to: newNode.id });
                
                // Recurse for nested children
                if (child.children && child.children.length > 0) {
                    createNodesAndEdges(newNode, child.children, level + 1);
                }
            });
        };

        if (aiResponse.children) {
            createNodesAndEdges(parentNode, aiResponse.children, 0);
        }

        if (newNodes.length > 0) {
            updateChatState({ nodes: [...canvasState.nodes, ...newNodes], edges: [...canvasState.edges, ...newEdges] });
            setNewlyAddedNodeIds(newNodes.map(n => n.id));
            setTimeout(() => setNewlyAddedNodeIds([]), 1000); // Animation duration
        }

      } catch (error) {
          console.error("AI expansion failed:", error);
           // Optionally, add an error node to the canvas
            const errorNode: CanvasNode = {
                id: uuidv4(),
                text: `Error: ${error instanceof Error ? error.message : 'Failed to get response.'}`,
                x: parentNode.x + parentNode.width + 30,
                y: parentNode.y,
                width: 180,
                height: 80,
            };
            const errorEdge: CanvasEdge = { id: uuidv4(), from: parentNode.id, to: errorNode.id };
            updateChatState({ nodes: [...canvasState.nodes, errorNode], edges: [...canvasState.edges, errorEdge] });
      } finally {
          setIsLoadingAI(null);
      }
  };

  const handleZoom = useCallback((direction: 'in' | 'out' | 'reset') => {
    let newScale;
    switch(direction) {
        case 'in': newScale = Math.min(2, canvasState.transform.scale * 1.2); break;
        case 'out': newScale = Math.max(0.1, canvasState.transform.scale / 1.2); break;
        case 'reset': newScale = 1; break;
    }
    const rect = canvasRef.current!.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const newX = canvasState.transform.x - (centerX - canvasState.transform.x) * (newScale / canvasState.transform.scale - 1);
    const newY = canvasState.transform.y - (centerY - canvasState.transform.y) * (newScale / canvasState.transform.scale - 1);
    updateChatState({ transform: { x: newX, y: newY, scale: newScale } });
  }, [canvasState.transform]);

  const handleFitToScreen = useCallback(() => {
      if (canvasState.nodes.length === 0) return;
      
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      canvasState.nodes.forEach(node => {
          minX = Math.min(minX, node.x);
          minY = Math.min(minY, node.y);
          maxX = Math.max(maxX, node.x + node.width);
          maxY = Math.max(maxY, node.y + node.height);
      });

      const bboxWidth = maxX - minX;
      const bboxHeight = maxY - minY;
      const rect = canvasRef.current!.getBoundingClientRect();

      const scaleX = rect.width / bboxWidth;
      const scaleY = rect.height / bboxHeight;
      const newScale = Math.min(scaleX, scaleY, 1.5) * 0.9;

      const newX = (rect.width / 2) - ((minX + bboxWidth / 2) * newScale);
      const newY = (rect.height / 2) - ((minY + bboxHeight / 2) * newScale);
      
      updateChatState({ transform: { x: newX, y: newY, scale: newScale } });
  }, [canvasState.nodes]);

  const handleAddNodeToCenter = useCallback(() => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = (rect.width / 2 - canvasState.transform.x) / canvasState.transform.scale - (NODE_DEFAULTS.width / 2);
    const y = (rect.height / 2 - canvasState.transform.y) / canvasState.transform.scale - (NODE_DEFAULTS.height / 2);
    const newNode: CanvasNode = {
      id: uuidv4(),
      x,
      y,
      text: 'New Idea',
      width: NODE_DEFAULTS.width,
      height: NODE_DEFAULTS.height,
    };
    updateChatState({ nodes: [...canvasState.nodes, newNode] });
    setIsEditing(newNode.id);
  }, [canvasState]);
  
  useEffect(() => {
    const closeMenu = () => setContextMenu(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  return (
    <div 
        ref={canvasRef}
        className="w-full h-full bg-[#111111] overflow-hidden relative cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        onWheel={handleWheel}
        onContextMenu={(e) => e.preventDefault()}
    >
      {canvasState.nodes.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-slate-500 pointer-events-none z-10 animate-fadeInUp">
              <PenToolIcon className="w-12 h-12 mb-4 text-slate-600" />
              <h2 className="text-xl font-bold text-slate-300">Canvas Mode</h2>
              <p className="mt-2">Double-click anywhere to create your first idea node.</p>
              <p>Right-click a node for options like connecting or asking FARI-AI to expand on it.</p>
          </div>
      )}
      <div
        className="absolute top-0 left-0"
        style={{ transform: `translate(${canvasState.transform.x}px, ${canvasState.transform.y}px) scale(${canvasState.transform.scale})`, transformOrigin: '0 0' }}
      >
        <div id="canvas-background" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ width: 10000, height: 10000, backgroundImage: 'radial-gradient(circle, #2d3748 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ width: 10000, height: 10000, top: -5000, left: -5000 }}>
          <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
              </marker>
          </defs>
          {canvasState.edges.map(edge => {
            const fromNode = canvasState.nodes.find(n => n.id === edge.from);
            const toNode = canvasState.nodes.find(n => n.id === edge.to);
            if (!fromNode || !toNode) return null;
            return <line key={edge.id} x1={fromNode.x + fromNode.width / 2} y1={fromNode.y + fromNode.height / 2} x2={toNode.x + toNode.width / 2} y2={toNode.y + toNode.height / 2} stroke="#64748b" strokeWidth="2" markerEnd="url(#arrow)" />
          })}
           {tempEdge && (() => {
                const fromNode = canvasState.nodes.find(n => n.id === tempEdge.from);
                if (!fromNode) return null;
                return <line x1={fromNode.x + fromNode.width / 2} y1={fromNode.y + fromNode.height / 2} x2={tempEdge.x} y2={tempEdge.y} stroke="#a0aec0" strokeWidth="2" strokeDasharray="5,5" />
            })()}
        </svg>

        {canvasState.nodes.map(node => (
            <div 
                key={node.id}
                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                onMouseUp={(e) => handleNodeMouseUp(e, node.id)}
                onContextMenu={(e) => handleNodeContextMenu(e, node.id)}
                className={`absolute p-3 rounded-lg cursor-pointer flex items-center justify-center transition-all duration-200 bg-gradient-to-br from-slate-800 to-slate-900 border-t-4 border-t-pink-500 shadow-lg shadow-black/30 text-center
                    ${isEditing === node.id ? 'ring-2 ring-pink-500' : ''}
                    ${newlyAddedNodeIds.includes(node.id) ? 'animate-scaleIn' : ''}
                `}
                style={{
                    left: node.x, top: node.y, width: node.width, height: node.height
                }}
            >
                {isLoadingAI === node.id && (
                    <div className="absolute inset-0 rounded-lg border-2 border-pink-500 animate-pulse" />
                )}
                {isEditing === node.id ? (
                    <textarea 
                        value={node.text}
                        onChange={(e) => handleNodeTextChange(node.id, e.target.value)}
                        onBlur={() => setIsEditing(null)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) {e.preventDefault(); setIsEditing(null);} }}
                        className="w-full h-full bg-transparent text-white resize-none outline-none text-center"
                        autoFocus
                    />
                ) : (
                    <p className="text-white text-sm break-words">{node.text}</p>
                )}
            </div>
        ))}
      </div>
        {contextMenu && (
            <div
                className="fixed bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-lg shadow-2xl z-50 p-1 text-sm text-slate-200"
                style={{ top: contextMenu.y, left: contextMenu.x }}
            >
                <button onClick={() => { setIsEditing(contextMenu.nodeId); setContextMenu(null); }} className="w-full text-left flex items-center gap-2 px-3 py-1.5 rounded hover:bg-slate-700/50"><PencilIcon className="w-4 h-4" /> Edit</button>
                <button onClick={() => handleStartConnection(contextMenu.nodeId)} className="w-full text-left flex items-center gap-2 px-3 py-1.5 rounded hover:bg-slate-700/50"><LinkIcon className="w-4 h-4" /> Connect</button>
                <button onClick={() => handleAskAI(contextMenu.nodeId)} className="w-full text-left flex items-center gap-2 px-3 py-1.5 rounded hover:bg-slate-700/50"><SparklesIcon className="w-4 h-4 text-purple-400" /> Ask FARI-AI</button>
                <div className="border-t border-slate-700 my-1"></div>
                <button onClick={() => handleDeleteNode(contextMenu.nodeId)} className="w-full text-left flex items-center gap-2 px-3 py-1.5 rounded hover:bg-red-500/20 text-red-400"><TrashIcon className="w-4 h-4" /> Delete</button>
            </div>
        )}

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 p-1 bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-full shadow-lg">
            <button onClick={handleAddNodeToCenter} className="p-2 text-slate-300 hover:bg-slate-700/50 rounded-full transition-colors" title="Add Node"><PlusIcon className="w-5 h-5"/></button>
            <div className="w-px h-5 bg-slate-700 mx-1" />
            <button onClick={() => handleZoom('in')} className="p-2 text-slate-300 hover:bg-slate-700/50 rounded-full transition-colors" title="Zoom In"><ZoomInIcon className="w-5 h-5"/></button>
            <button onClick={() => handleZoom('out')} className="p-2 text-slate-300 hover:bg-slate-700/50 rounded-full transition-colors" title="Zoom Out"><ZoomOutIcon className="w-5 h-5"/></button>
            <button onClick={handleFitToScreen} className="p-2 text-slate-300 hover:bg-slate-700/50 rounded-full transition-colors" title="Center View"><CrosshairIcon className="w-5 h-5"/></button>
        </div>
    </div>
  );
};

export default CanvasView;