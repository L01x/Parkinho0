import React, { useEffect, useRef, useState, useLayoutEffect, useCallback } from 'react';
import { Shape, Tool, Point, Idea } from '../types';
import { Maximize, Minimize, Share, Eraser, Pen, Type, Square, Circle as CircleIcon, Trash2, Hand, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { COLORS, THICKNESS_OPTIONS } from '../constants';

interface CanvasBoardProps {
  onSave: (shapes: Shape[], thumbnail: string) => void;
  onSendToParkinho: (shapes: Shape[], thumbnail: string) => void;
  backlogIdeas: Idea[];
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  clearTrigger?: number;
}

const CanvasBoard: React.FC<CanvasBoardProps> = ({ 
  onSave, 
  onSendToParkinho, 
  backlogIdeas,
  isFullscreen,
  onToggleFullscreen,
  clearTrigger = 0
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // -- State --
  const [currentTool, setCurrentTool] = useState<Tool>('pen');
  const [currentColor, setCurrentColor] = useState<string>(COLORS[0]);
  const [currentThickness, setCurrentThickness] = useState<number>(4);
  const [shapes, setShapes] = useState<Shape[]>([]);
  
  // Zoom & Pan State
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  // Text Input State (x,y in world/device pixels; screenX/screenY in CSS px for DOM positioning)
  const [textInput, setTextInput] = useState<{ x: number; y: number; text: string; screenX?: number; screenY?: number } | null>(null);

  // -- Refs for Logic --
  const isDrawing = useRef(false);
  const isPanning = useRef(false);
  const lastMousePos = useRef<Point>({ x: 0, y: 0 });
  const currentPath = useRef<Point[]>([]);
  const startPoint = useRef<Point | null>(null);
  const currentShapeId = useRef<string | null>(null);
  const rafId = useRef<number | null>(null);  // For throttling redraws

  // -- Effects --

  // Clear canvas when parent triggers
  useEffect(() => {
    if (clearTrigger > 0) {
      setShapes([]);
      setTextInput(null);
      // Optional: Reset view on clear?
      // setScale(1);
      // setOffset({ x: 0, y: 0 });
    }
  }, [clearTrigger]);

  // -- Helpers --

  // Converts screen coordinates (mouse event) to World coordinates (drawing space)
  const screenToWorld = (x: number, y: number) => {
    return {
      x: (x - offset.x) / scale,
      y: (y - offset.y) / scale
    };
  };

  const getCoords = (e: React.MouseEvent | React.TouchEvent | MouseEvent): Point => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    let clientX: number, clientY: number;
    
    if ('touches' in e) {
        // For touch events, only use first touch
        const touch = (e as any).touches?.[0];
        if (!touch) return { x: 0, y: 0 };
        clientX = touch.clientX;
        clientY = touch.clientY;
    } else {
        clientX = (e as React.MouseEvent).clientX;
        clientY = (e as React.MouseEvent).clientY;
    }
    
    // Return CSS pixels relative to canvas (do NOT multiply by DPR here)
    return {
        x: clientX - rect.left,
        y: clientY - rect.top
    };
  };

  // -- Resizing Logic --
  
  // Use ResizeObserver to detect when the container changes size (e.g. sidebar close)
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
        handleResize();
    });

    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, [containerRef]);

  // Ensure canvas sized correctly on mount and when window resizes
  useEffect(() => {
    handleResize();
    const onWin = () => handleResize();
    window.addEventListener('resize', onWin);
    return () => {
        window.removeEventListener('resize', onWin);
        if (rafId.current !== null) cancelAnimationFrame(rafId.current);
    };
  }, []);

  const handleResize = () => {
    if (!containerRef.current || !canvasRef.current) return;
    const container = containerRef.current;
    const canvas = canvasRef.current;
    
    // Match canvas pixel size to display size
    const width = container.clientWidth;
    const height = container.clientHeight;
    const dpr = window.devicePixelRatio || 1;
    const targetWidth = Math.max(1, Math.floor(width * dpr));
    const targetHeight = Math.max(1, Math.floor(height * dpr));

    // Avoid resetting if size hasn't changed to prevent flicker
    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        // Keep CSS size in CSS pixels
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        // Redraw immediately after resize
        requestAnimationFrame(() => redrawAll(shapes, scale, offset));
    }
  };

  // -- Drawing Logic --

  // Redraw whenever visual state changes
  useEffect(() => {
    redrawAll(shapes, scale, offset);
  }, [shapes, scale, offset]);

  const redrawAll = (shapesToDraw: Shape[], currentScale: number, currentOffset: {x: number, y: number}) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Reset transform to clear the whole screen
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Account for devicePixelRatio when applying transforms so world units map correctly
    const dpr = window.devicePixelRatio || 1;
    // Transform: map world units -> device pixels: dpr * currentScale
    ctx.setTransform(dpr * currentScale, 0, 0, dpr * currentScale, currentOffset.x * dpr, currentOffset.y * dpr);

    shapesToDraw.forEach(shape => drawShape(ctx, shape));
  };

  const drawShape = (ctx: CanvasRenderingContext2D, shape: Shape) => {
    ctx.strokeStyle = shape.color;
    ctx.fillStyle = shape.color;
    ctx.lineWidth = shape.thickness;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (shape.type === 'path') {
      if (shape.points.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(shape.points[0].x, shape.points[0].y);
      for (let i = 1; i < shape.points.length; i++) {
        ctx.lineTo(shape.points[i].x, shape.points[i].y);
      }
      ctx.stroke();
    } else if (shape.type === 'rectangle') {
      ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
    } else if (shape.type === 'circle') {
      ctx.beginPath();
      ctx.arc(shape.x, shape.y, shape.radius, 0, Math.PI * 2);
      ctx.stroke();
    } else if (shape.type === 'text') {
      ctx.font = `${Math.max(8, shape.thickness * 6)}px Inter`;
      ctx.textBaseline = 'top';
      ctx.fillText(shape.text, shape.x, shape.y);
    }
  };

  // -- Interaction Handlers --

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomIntensity = 0.1;
    const direction = e.deltaY > 0 ? -1 : 1;
    const factor = 1 + (direction * zoomIntensity);
    
    const mousePos = getCoords(e); // Mouse relative to canvas DOM
    
    // Calculate new scale
    let newScale = scale * factor;
    // Limit zoom
    newScale = Math.min(Math.max(0.1, newScale), 5);

    // Calculate offset adjustment to zoom towards mouse
    const newOffset = {
        x: mousePos.x - (mousePos.x - offset.x) * (newScale / scale),
        y: mousePos.y - (mousePos.y - offset.y) * (newScale / scale)
    };

    setScale(newScale);
    setOffset(newOffset);
  };

  const startInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) {
        e.preventDefault();
        // Ignore if multiple touches (two-finger gesture)
        if ((e as any).touches.length > 1) {
            isDrawing.current = false;
            isPanning.current = false;
            return;
        }
    }
    const coords = getCoords(e);
    // World coordinates for drawing
    const worldCoords = screenToWorld(coords.x, coords.y);
    
    // Check if panning (Middle mouse or Hand tool or Spacebar)
    const isMiddleMouse = (e as React.MouseEvent).button === 1;
    if (currentTool === 'hand' || isSpacePressed || isMiddleMouse) {
        isPanning.current = true;
        lastMousePos.current = coords; // Use screen coords for panning delta
        return;
    }

    if (currentTool === 'text') {
      // Place text input at World Coordinates and store screen coords (CSS px) for DOM positioning
      const screenX = coords.x;
      const screenY = coords.y;
      setTextInput({ x: worldCoords.x, y: worldCoords.y, text: '', screenX, screenY });
      return;
    }

    isDrawing.current = true;
    startPoint.current = worldCoords;
    currentShapeId.current = Date.now().toString();

    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    if (currentTool === 'pen' || currentTool === 'eraser') {
      currentPath.current = [worldCoords];
      // We don't stroke immediately, we wait for move or up
    }
  };

  const moveInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) {
        e.preventDefault();
        // Ignore if multiple touches
        if ((e as any).touches.length > 1) {
            return;
        }
    }
    const coords = getCoords(e); // CSS pixel coords
    
    if (isPanning.current) {
        const deltaX = coords.x - lastMousePos.current.x;
        const deltaY = coords.y - lastMousePos.current.y;
        setOffset(prev => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
        lastMousePos.current = coords;
        return;
    }

    if (!isDrawing.current) return;
    
    const worldCoords = screenToWorld(coords.x, coords.y);
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    if (currentTool === 'pen' || currentTool === 'eraser') {
      currentPath.current.push(worldCoords);
      
      // Throttle redraws with requestAnimationFrame
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
      }
      
      rafId.current = requestAnimationFrame(() => {
        redrawAll(shapes, scale, offset);
        
        // Draw current path on top
        const dpr = window.devicePixelRatio || 1;
        ctx.setTransform(dpr * scale, 0, 0, dpr * scale, offset.x * dpr, offset.y * dpr);
        ctx.lineWidth = currentTool === 'eraser' ? currentThickness * 4 : currentThickness;
        ctx.strokeStyle = currentTool === 'eraser' ? '#ffffff' : currentColor;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        if (currentPath.current.length > 1) {
            ctx.moveTo(currentPath.current[0].x, currentPath.current[0].y);
            for(let i=1; i<currentPath.current.length; i++) {
                ctx.lineTo(currentPath.current[i].x, currentPath.current[i].y);
            }
        }
        ctx.stroke();
        rafId.current = null;
      });

    } else {
        // Shape preview - also throttled
        if (rafId.current !== null) {
          cancelAnimationFrame(rafId.current);
        }
        
        rafId.current = requestAnimationFrame(() => {
          redrawAll(shapes, scale, offset);
          const dpr = window.devicePixelRatio || 1;
          ctx.setTransform(dpr * scale, 0, 0, dpr * scale, offset.x * dpr, offset.y * dpr);
          ctx.strokeStyle = currentColor;
          ctx.lineWidth = currentThickness;
          
          if (currentTool === 'rectangle' && startPoint.current) {
              const w = worldCoords.x - startPoint.current.x;
              const h = worldCoords.y - startPoint.current.y;
              ctx.strokeRect(startPoint.current.x, startPoint.current.y, w, h);
          } else if (currentTool === 'circle' && startPoint.current) {
               const r = Math.sqrt(Math.pow(worldCoords.x - startPoint.current.x, 2) + Math.pow(worldCoords.y - startPoint.current.y, 2));
              ctx.beginPath();
              ctx.arc(startPoint.current.x, startPoint.current.y, r, 0, 2 * Math.PI);
              ctx.stroke();
          }
          rafId.current = null;
        });
    }
  };

  const stopInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e && (e as any).touches.length > 0) {
        // Still have fingers on screen (multi-touch), don't stop drawing
        return;
    }
    
    isPanning.current = false;
    
    // Cancel any pending redraw
    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
    
    if (!isDrawing.current) return;
    isDrawing.current = false;
    
    const coords = getCoords(e);
    const worldCoords = screenToWorld(coords.x, coords.y);
    
    let newShape: Shape | null = null;
    
    if (currentTool === 'pen' || currentTool === 'eraser') {
      newShape = {
        id: currentShapeId.current!,
        type: 'path',
        points: currentPath.current,
        color: currentTool === 'eraser' ? '#ffffff' : currentColor,
        thickness: currentTool === 'eraser' ? currentThickness * 4 : currentThickness
      };
    } else if (currentTool === 'rectangle' && startPoint.current) {
        newShape = {
            id: currentShapeId.current!,
            type: 'rectangle',
            x: startPoint.current.x,
            y: startPoint.current.y,
            width: worldCoords.x - startPoint.current.x,
            height: worldCoords.y - startPoint.current.y,
            color: currentColor,
            thickness: currentThickness
        };
    } else if (currentTool === 'circle' && startPoint.current) {
        const r = Math.sqrt(Math.pow(worldCoords.x - startPoint.current.x, 2) + Math.pow(worldCoords.y - startPoint.current.y, 2));
        newShape = { id: currentShapeId.current!, type: 'circle', x: startPoint.current.x, y: startPoint.current.y, radius: r, color: currentColor, thickness: currentThickness }
    }

    if (newShape) {
        setShapes(prev => {
          const updated = [...prev, newShape!];
          // Immediately redraw to ensure shape is visible
          requestAnimationFrame(() => redrawAll(updated, scale, offset));
          return updated;
        });
    } else {
        redrawAll(shapes, scale, offset); // Clear preview
    }
    
    // Reset drawing state
    currentPath.current = [];
    startPoint.current = null;
    currentShapeId.current = null;
  };

  // -- Text Input Logic --
  const handleTextInputKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && textInput) {
          if (textInput.text.trim()) {
              const newShape: Shape = {
                  id: Date.now().toString(),
                  type: 'text',
                  x: textInput.x,
                  y: textInput.y,
                  text: textInput.text,
                  color: currentColor,
                  thickness: currentThickness
              };
              setShapes(prev => {
                const updated = [...prev, newShape];
                requestAnimationFrame(() => redrawAll(updated, scale, offset));
                return updated;
              });
          }
          setTextInput(null);
      } else if (e.key === 'Escape') {
          setTextInput(null);
      }
  };

  // -- Keyboard Shortcuts --
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.code === 'Space') setIsSpacePressed(true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
        if (e.code === 'Space') setIsSpacePressed(false);
    };
    
    // Handle touch end globally to catch finger lifts outside canvas
    const handleTouchEnd = (e: TouchEvent) => {
        if (isDrawing.current) {
            stopInteraction(e as any);
        }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('touchend', handleTouchEnd);
    
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDrawing.current, shapes, scale, offset, currentTool, currentColor, currentThickness]);

  const clearCanvas = () => {
      if(confirm('Tem certeza que deseja limpar o quadro?')) {
          setShapes([]);
      }
  };

  const resetView = () => {
      setScale(1);
      setOffset({ x: 0, y: 0 });
  };

  // Generate thumbnail without background for saving
  const getThumbnail = () => {
      if(!canvasRef.current) return '';
      // We need to draw just the shapes on a clean context or temporary canvas
      // But for simplicity, we can just use current canvas state if we reset transform
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if(!ctx) return '';
      
      // Temporarily draw everything fitted to screen for thumbnail
      redrawAll(shapes, 1, {x:0, y:0}); 
      const data = canvas.toDataURL();
      // Restore view
      redrawAll(shapes, scale, offset);
      return data;
  };

  return (
    <div className={`flex h-full w-full relative transition-all duration-300 bg-bg-primary ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      
      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col relative h-full overflow-hidden">
          
          {/* Top Bar Controls (Floating) */}
          <div className="absolute top-4 left-4 z-20 flex flex-wrap gap-2 items-center pointer-events-auto select-none">
             <div className="flex bg-bg-tertiary rounded-lg p-1 border border-border shadow-lg backdrop-blur-sm bg-opacity-90">
                {[
                    { id: 'hand', icon: Hand, title: 'Mover (Espaço)' },
                    { id: 'pen', icon: Pen, title: 'Caneta' },
                    { id: 'eraser', icon: Eraser, title: 'Borracha' },
                    { id: 'text', icon: Type, title: 'Texto' },
                    { id: 'rectangle', icon: Square, title: 'Retângulo' },
                    { id: 'circle', icon: CircleIcon, title: 'Círculo' }
                ].map(tool => (
                    <button 
                        key={tool.id} 
                        onClick={() => { setCurrentTool(tool.id as Tool); setTextInput(null); }} 
                        className={`p-2 rounded-md transition-all ${currentTool === tool.id ? 'bg-neon-blue/20 text-neon-blue' : 'text-gray-400 hover:text-white'}`}
                        title={tool.title}
                    >
                        <tool.icon size={20} />
                    </button>
                ))}
             </div>
             
             <div className="flex bg-bg-tertiary rounded-lg p-1.5 border border-border gap-1 shadow-lg backdrop-blur-sm bg-opacity-90">
                {COLORS.map(color => (
                    <button key={color} onClick={() => setCurrentColor(color)} className={`w-6 h-6 rounded-full border-2 transition-transform ${currentColor === color ? 'border-white scale-110' : 'border-border'}`} style={{ backgroundColor: color }} />
                ))}
             </div>

             <div className="flex bg-bg-tertiary rounded-lg p-1 border border-border shadow-lg backdrop-blur-sm bg-opacity-90">
                 {THICKNESS_OPTIONS.map(size => (
                     <button key={size} onClick={() => setCurrentThickness(size)} className={`w-8 h-8 flex items-center justify-center rounded ${currentThickness === size ? 'bg-neon-blue/20 text-neon-blue' : 'text-gray-400'}`}>
                        <div className="bg-current rounded-full" style={{ width: size, height: size }} />
                     </button>
                 ))}
             </div>
             
             <button onClick={() => onSendToParkinho(shapes, getThumbnail())} className="flex items-center gap-2 px-3 py-2 bg-neon-purple text-white rounded-lg shadow-lg font-bold hover:brightness-110 transition-all">
                <Share size={16} /> Enviar p/ Parkinho
             </button>
             
             <button onClick={clearCanvas} className="p-2 bg-red-900/50 text-red-200 border border-red-800 rounded-lg shadow-lg hover:bg-red-900 transition-all" title="Limpar">
                <Trash2 size={20} />
             </button>
          </div>

           {/* Maximize Button - Top Right */}
           <div className="absolute top-4 right-4 z-20 pointer-events-auto">
                <button 
                    onClick={onToggleFullscreen} 
                    className="p-2 bg-bg-tertiary text-neon-blue border border-border rounded-lg shadow-lg hover:text-white transition-all"
                    title={isFullscreen ? "Sair do Fullscreen" : "Maximizar"}
                >
                    {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                </button>
           </div>

           {/* Zoom Controls - Bottom Right */}
           <div className="absolute bottom-4 right-4 z-20 pointer-events-auto flex flex-col gap-2">
                <div className="flex flex-col bg-bg-tertiary rounded-lg border border-border shadow-lg overflow-hidden">
                    <button onClick={() => setScale(s => Math.min(s * 1.2, 5))} className="p-2 hover:bg-white/10 text-white" title="Zoom In"><ZoomIn size={20} /></button>
                    <button onClick={() => setScale(s => Math.max(s / 1.2, 0.1))} className="p-2 hover:bg-white/10 text-white" title="Zoom Out"><ZoomOut size={20} /></button>
                    <button onClick={resetView} className="p-2 hover:bg-white/10 text-white border-t border-border" title="Reset View"><RotateCcw size={16} /></button>
                </div>
                <div className="bg-bg-tertiary px-2 py-1 rounded text-xs text-center border border-border text-gray-400">
                    {Math.round(scale * 100)}%
                </div>
           </div>

          {/* Canvas Container */}
          <div className="flex-1 bg-bg-primary relative overflow-hidden select-none" ref={containerRef} style={{ touchAction: 'none' }}>
              <div className="w-full h-full cursor-crosshair relative z-10"
                   onWheel={handleWheel}
              >
                  <canvas
                      ref={canvasRef}
                      onMouseDown={startInteraction}
                      onMouseMove={moveInteraction}
                      onMouseUp={stopInteraction}
                      onMouseLeave={stopInteraction}
                      onTouchStart={startInteraction}
                      onTouchMove={moveInteraction}
                      onTouchEnd={stopInteraction}
                      className={`block w-full h-full ${isSpacePressed || currentTool === 'hand' ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'}`}
                  />
                  
                  {/* Text Input Overlay */}
                  {textInput && (
                      <input 
                        autoFocus
                        value={textInput.text}
                        onChange={(e) => setTextInput({...textInput, text: e.target.value})}
                        onKeyDown={handleTextInputKeyDown}
                        onBlur={() => handleTextInputKeyDown({ key: 'Enter' } as any)}
                        style={{
                            position: 'absolute',
                            // Use stored CSS screen coords for positioning
                            left: `${textInput.screenX || 0}px`,
                            top: `${textInput.screenY || 0}px`,
                            // fontSize in CSS px (visual match to canvas at current scale)
                            fontSize: `${Math.max(12, currentThickness * 6 * scale)}px`,
                            color: currentColor,
                            fontFamily: 'Inter',
                            background: 'rgba(10, 10, 15, 0.9)',
                            border: '2px dashed #3b82f6',
                            outline: 'none',
                            padding: '4px 8px',
                            margin: 0,
                            minWidth: '120px',
                            maxWidth: '400px',
                            borderRadius: '4px',
                            zIndex: 30,
                            boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)'
                        }}
                        placeholder="Digite..."
                      />
                  )}
              </div>
          </div>
      </div>

      {/* Sidebar (Right Side) - Hidden in Fullscreen */}
      <div className={`w-[280px] bg-black border-l border-border flex flex-col z-20 shadow-xl transition-all duration-300 ${isFullscreen ? 'w-0 opacity-0 overflow-hidden' : ''}`}>
         <div className="p-6 border-b border-border">
             <h2 className="text-xl font-bold text-neon-pink neon-text mb-1">Backlog</h2>
             <p className="text-xs text-neon-purple font-semibold">Top 5 Prioridades</p>
         </div>
         
         <div className="flex-1 overflow-y-auto p-4 space-y-4">
             {backlogIdeas.length === 0 ? (
                 <p className="text-gray-500 text-sm text-center py-4">Nenhuma ideia priorizada</p>
             ) : (
                 backlogIdeas.slice(0, 5).map(idea => (
                     <div key={idea.__backendId} className="bg-bg-secondary p-3 rounded-lg border border-border hover:border-neon-blue transition-colors group">
                         <div className="flex justify-between items-start mb-1">
                             <h4 className="font-bold text-sm text-white truncate">{idea.idea_name}</h4>
                         </div>
                         <p className="text-xs text-gray-500 mb-2">por {idea.idea_author}</p>
                         <div className="flex justify-between items-center text-[10px] text-gray-600">
                             <span>#{idea.idea_order}</span>
                             <span className="bg-neon-pink/10 text-neon-pink px-1.5 py-0.5 rounded uppercase">{idea.idea_status}</span>
                         </div>
                     </div>
                 ))
             )}
         </div>
      </div>
    </div>
  );
};

export default CanvasBoard;
