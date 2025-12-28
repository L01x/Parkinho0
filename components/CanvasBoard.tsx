import React, { useEffect, useRef, useState, useLayoutEffect, useCallback } from 'react';
import { Shape, Tool, Point, Idea } from '../types';
import { Maximize, Minimize, Share, Eraser, Pen, Type, Square, Circle as CircleIcon, Trash2, Hand, ZoomIn, ZoomOut, RotateCcw, Undo2, Redo2 } from 'lucide-react';
import { COLORS, THICKNESS_OPTIONS } from '../constants';

interface CanvasBoardProps {
  onSave: (shapes: Shape[], thumbnail: string) => void;
  onSendToParkinho: (shapes: Shape[], thumbnail: string) => void;
  backlogIdeas: Idea[];
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  clearTrigger?: number;
}

interface HistoryState {
  shapes: Shape[];
  timestamp: number;
}

// Smoothing algorithm using quadratic curves
const smoothPath = (points: Point[]): Point[] => {
  if (points.length < 3) return points;
  
  const smoothed: Point[] = [points[0]];
  
  for (let i = 1; i < points.length - 1; i++) {
    const p0 = points[i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    
    // Calculate control point for quadratic curve
    const cp = {
      x: p1.x,
      y: p1.y
    };
    
    // Add intermediate points for smooth curve
    for (let t = 0.25; t < 1; t += 0.25) {
      const x = (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * cp.x + t * t * p2.x;
      const y = (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * cp.y + t * t * p2.y;
      smoothed.push({ x, y });
    }
  }
  
  smoothed.push(points[points.length - 1]);
  return smoothed;
};

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
  const textInputRef = useRef<HTMLDivElement>(null);
  
  // -- State --
  const [currentTool, setCurrentTool] = useState<Tool>('pen');
  const [currentColor, setCurrentColor] = useState<string>(COLORS[0]);
  const [currentThickness, setCurrentThickness] = useState<number>(4);
  const [shapes, setShapes] = useState<Shape[]>([]);
  
  // Undo/Redo History
  const [history, setHistory] = useState<HistoryState[]>([
    { shapes: [], timestamp: Date.now() }
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const maxHistory = 50;
  
  // Zoom & Pan State
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  // Text Input State - using contenteditable div for mobile IME support
  const [textInput, setTextInput] = useState<{ 
    x: number; 
    y: number; 
    text: string; 
    screenX?: number; 
    screenY?: number;
    id?: string;
  } | null>(null);

  // -- Refs for Logic --
  const isDrawing = useRef(false);
  const isPanning = useRef(false);
  const lastPointerPos = useRef<Point>({ x: 0, y: 0 });
  const currentPath = useRef<Point[]>([]);
  const startPoint = useRef<Point | null>(null);
  const currentShapeId = useRef<string | null>(null);
  const rafId = useRef<number | null>(null);
  const lastRedrawTime = useRef<number>(0);
  const minRedrawInterval = 16; // ~60fps throttle
  
  // Active pointer tracking for multi-touch prevention
  const activePointers = useRef<Map<number, PointerEvent>>(new Map());

  // -- Undo/Redo Logic --
  
  const addToHistory = useCallback((newShapes: Shape[]) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push({ shapes: [...newShapes], timestamp: Date.now() });
      
      // Limit history size
      if (newHistory.length > maxHistory) {
        newHistory.shift();
      } else {
        setHistoryIndex(newHistory.length - 1);
      }
      
      return newHistory;
    });
  }, [historyIndex]);

  const undo = useCallback(() => {
    setHistoryIndex(prev => {
      const newIndex = Math.max(0, prev - 1);
      setShapes(history[newIndex].shapes);
      return newIndex;
    });
  }, [history]);

  const redo = useCallback(() => {
    setHistoryIndex(prev => {
      const newIndex = Math.min(history.length - 1, prev + 1);
      setShapes(history[newIndex].shapes);
      return newIndex;
    });
  }, [history]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // -- Effects --

  // Clear canvas when parent triggers
  useEffect(() => {
    if (clearTrigger > 0) {
      limparTudo();
    }
  }, [clearTrigger]);

  // Update history index when shapes change externally
  useEffect(() => {
    if (historyIndex < history.length && 
        JSON.stringify(history[historyIndex].shapes) !== JSON.stringify(shapes)) {
      // Shapes changed externally, update history
      addToHistory(shapes);
    }
  }, [shapes]);

  // -- Helpers --

  // Converts screen coordinates (pointer event) to World coordinates (drawing space)
  const screenToWorld = useCallback((x: number, y: number) => {
    return {
      x: (x - offset.x) / scale,
      y: (y - offset.y) / scale
    };
  }, [offset, scale]);

  const getCoords = useCallback((e: React.PointerEvent | PointerEvent | React.TouchEvent | React.MouseEvent): Point => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    let clientX: number, clientY: number;
    
    if ('pointerId' in e && 'clientX' in e) {
      // Pointer event
      clientX = e.clientX;
      clientY = e.clientY;
    } else if ('touches' in e) {
      // Touch event fallback
      const touch = (e as React.TouchEvent).touches?.[0];
      if (!touch) return { x: 0, y: 0 };
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      // Mouse event fallback
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    
    // Return CSS pixels relative to canvas
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }, []);

  // -- Resizing Logic --
  
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });

    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    handleResize();
    const onWin = () => handleResize();
    window.addEventListener('resize', onWin);
    window.addEventListener('orientationchange', onWin);
    return () => {
      window.removeEventListener('resize', onWin);
      window.removeEventListener('orientationchange', onWin);
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
    };
  }, []);

  const handleResize = useCallback(() => {
    if (!containerRef.current || !canvasRef.current) return;
    const container = containerRef.current;
    const canvas = canvasRef.current;
    
    const width = container.clientWidth;
    const height = container.clientHeight;
    const dpr = window.devicePixelRatio || 1;
    const targetWidth = Math.max(1, Math.floor(width * dpr));
    const targetHeight = Math.max(1, Math.floor(height * dpr));

    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      
      // Redraw with proper DPR scaling
      requestAnimationFrame(() => redrawAll(shapes, scale, offset));
    }
  }, [shapes, scale, offset]);

  // -- Drawing Logic --

  useEffect(() => {
    redrawAll(shapes, scale, offset);
  }, [shapes, scale, offset]);

  const redrawAll = useCallback((shapesToDraw: Shape[], currentScale: number, currentOffset: {x: number, y: number}) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { 
      alpha: false, // Better performance
      desynchronized: true // Better performance on mobile
    });
    if (!canvas || !ctx) return;

    const now = performance.now();
    if (now - lastRedrawTime.current < minRedrawInterval && rafId.current === null) {
      // Throttle redraws
      rafId.current = requestAnimationFrame(() => {
        lastRedrawTime.current = performance.now();
        redrawAll(shapesToDraw, currentScale, currentOffset);
        rafId.current = null;
      });
      return;
    }
    lastRedrawTime.current = now;

    // Clear canvas
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Apply devicePixelRatio and transform
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(
      dpr * currentScale, 0, 0, 
      dpr * currentScale, 
      currentOffset.x * dpr, 
      currentOffset.y * dpr
    );

    // Enable smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    shapesToDraw.forEach(shape => drawShape(ctx, shape));
  }, []);

  const drawShape = (ctx: CanvasRenderingContext2D, shape: Shape) => {
    ctx.strokeStyle = shape.color;
    ctx.fillStyle = shape.color;
    ctx.lineWidth = shape.thickness;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    if (shape.type === 'path') {
      if (shape.points.length < 2) return;
      ctx.beginPath();
      const smoothed = smoothPath(shape.points);
      ctx.moveTo(smoothed[0].x, smoothed[0].y);
      for (let i = 1; i < smoothed.length; i++) {
        ctx.lineTo(smoothed[i].x, smoothed[i].y);
      }
      ctx.stroke();
    } else if (shape.type === 'rectangle') {
      ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
    } else if (shape.type === 'circle') {
      ctx.beginPath();
      ctx.arc(shape.x, shape.y, shape.radius, 0, Math.PI * 2);
      ctx.stroke();
    } else if (shape.type === 'text') {
      ctx.font = `${Math.max(8, shape.thickness * 6)}px Inter, sans-serif`;
      ctx.textBaseline = 'top';
      ctx.fillText(shape.text, shape.x, shape.y);
    }
  };

  // -- Interaction Handlers (Pointer Events) --

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomIntensity = 0.1;
    const direction = e.deltaY > 0 ? -1 : 1;
    const factor = 1 + (direction * zoomIntensity);
    
    const mousePos = getCoords(e);
    
    let newScale = scale * factor;
    newScale = Math.min(Math.max(0.1, newScale), 5);

    const newOffset = {
      x: mousePos.x - (mousePos.x - offset.x) * (newScale / scale),
      y: mousePos.y - (mousePos.y - offset.y) * (newScale / scale)
    };

    setScale(newScale);
    setOffset(newOffset);
  };

  const startInteraction = (e: React.PointerEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set pointer capture for better mobile handling
    if (e.pointerType !== 'mouse') {
      canvas.setPointerCapture(e.pointerId);
    }

    // Track active pointer
    activePointers.current.set(e.pointerId, e.nativeEvent as PointerEvent);

    // Ignore multi-touch for drawing (allow for pan/zoom gestures)
    if (activePointers.current.size > 1) {
      isDrawing.current = false;
      isPanning.current = false;
      return;
    }

    const coords = getCoords(e);
    const worldCoords = screenToWorld(coords.x, coords.y);
    
    // Check if panning
    const isMiddleMouse = (e as any).button === 1;
    if (currentTool === 'hand' || isSpacePressed || isMiddleMouse) {
      isPanning.current = true;
      lastPointerPos.current = coords;
      return;
    }

    if (currentTool === 'text') {
      const screenX = coords.x;
      const screenY = coords.y;
      const textId = Date.now().toString();
      setTextInput({ 
        x: worldCoords.x, 
        y: worldCoords.y, 
        text: '', 
        screenX, 
        screenY,
        id: textId
      });
      
      // Focus text input after state update
      setTimeout(() => {
        if (textInputRef.current) {
          textInputRef.current.focus();
          // Move cursor to end
          const range = document.createRange();
          const sel = window.getSelection();
          range.selectNodeContents(textInputRef.current);
          range.collapse(false);
          sel?.removeAllRanges();
          sel?.addRange(range);
        }
      }, 0);
      return;
    }

    isDrawing.current = true;
    startPoint.current = worldCoords;
    currentShapeId.current = Date.now().toString();

    if (currentTool === 'pen' || currentTool === 'eraser') {
      currentPath.current = [worldCoords];
    }
  };

  const moveInteraction = (e: React.PointerEvent) => {
    e.preventDefault();
    
    // Update pointer tracking
    activePointers.current.set(e.pointerId, e.nativeEvent as PointerEvent);

    // Ignore if multiple pointers
    if (activePointers.current.size > 1) {
      return;
    }

    const coords = getCoords(e);
    
    if (isPanning.current) {
      const deltaX = coords.x - lastPointerPos.current.x;
      const deltaY = coords.y - lastPointerPos.current.y;
      setOffset(prev => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
      lastPointerPos.current = coords;
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
        
        // Draw current path on top with smoothing
        const dpr = window.devicePixelRatio || 1;
        ctx.setTransform(dpr * scale, 0, 0, dpr * scale, offset.x * dpr, offset.y * dpr);
        ctx.lineWidth = currentTool === 'eraser' ? currentThickness * 4 : currentThickness;
        ctx.strokeStyle = currentTool === 'eraser' ? '#ffffff' : currentColor;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        if (currentPath.current.length > 1) {
          ctx.beginPath();
          const smoothed = smoothPath(currentPath.current);
          ctx.moveTo(smoothed[0].x, smoothed[0].y);
          for (let i = 1; i < smoothed.length; i++) {
            ctx.lineTo(smoothed[i].x, smoothed[i].y);
          }
          ctx.stroke();
        }
        rafId.current = null;
      });

    } else {
      // Shape preview
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
      }
      
      rafId.current = requestAnimationFrame(() => {
        redrawAll(shapes, scale, offset);
        const dpr = window.devicePixelRatio || 1;
        ctx.setTransform(dpr * scale, 0, 0, dpr * scale, offset.x * dpr, offset.y * dpr);
        ctx.strokeStyle = currentColor;
        ctx.lineWidth = currentThickness;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        if (currentTool === 'rectangle' && startPoint.current) {
          const w = worldCoords.x - startPoint.current.x;
          const h = worldCoords.y - startPoint.current.y;
          ctx.strokeRect(startPoint.current.x, startPoint.current.y, w, h);
        } else if (currentTool === 'circle' && startPoint.current) {
          const r = Math.sqrt(
            Math.pow(worldCoords.x - startPoint.current.x, 2) + 
            Math.pow(worldCoords.y - startPoint.current.y, 2)
          );
          ctx.beginPath();
          ctx.arc(startPoint.current.x, startPoint.current.y, r, 0, 2 * Math.PI);
          ctx.stroke();
        }
        rafId.current = null;
      });
    }
  };

  const stopInteraction = (e: React.PointerEvent) => {
    e.preventDefault();
    
    // Remove pointer tracking
    activePointers.current.delete(e.pointerId);
    
    // Release pointer capture
    const canvas = canvasRef.current;
    if (canvas && canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }

    // If still have active pointers, don't stop
    if (activePointers.current.size > 0 && isDrawing.current) {
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
      if (currentPath.current.length > 1) {
        newShape = {
          id: currentShapeId.current!,
          type: 'path',
          points: [...currentPath.current],
          color: currentTool === 'eraser' ? '#ffffff' : currentColor,
          thickness: currentTool === 'eraser' ? currentThickness * 4 : currentThickness
        };
      }
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
      const r = Math.sqrt(
        Math.pow(worldCoords.x - startPoint.current.x, 2) + 
        Math.pow(worldCoords.y - startPoint.current.y, 2)
      );
      newShape = { 
        id: currentShapeId.current!, 
        type: 'circle', 
        x: startPoint.current.x, 
        y: startPoint.current.y, 
        radius: r, 
        color: currentColor, 
        thickness: currentThickness 
      };
    }

    if (newShape) {
      setShapes(prev => {
        const updated = [...prev, newShape!];
        addToHistory(updated);
        requestAnimationFrame(() => redrawAll(updated, scale, offset));
        return updated;
      });
    } else {
      redrawAll(shapes, scale, offset);
    }
    
    // Reset drawing state
    currentPath.current = [];
    startPoint.current = null;
    currentShapeId.current = null;
  };

  // Handle pointer cancel (e.g., finger leaves screen)
  const handlePointerCancel = (e: React.PointerEvent) => {
    activePointers.current.delete(e.pointerId);
    if (isDrawing.current) {
      stopInteraction(e);
    }
  };

  // -- Text Input Logic --
  
  const handleTextInputChange = useCallback(() => {
    if (!textInputRef.current || !textInput) return;
    const text = textInputRef.current.textContent || '';
    setTextInput(prev => prev ? { ...prev, text } : null);
  }, [textInput]);

  const handleTextInputKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (textInput && textInput.text.trim()) {
        const newShape: Shape = {
          id: textInput.id || Date.now().toString(),
          type: 'text',
          x: textInput.x,
          y: textInput.y,
          text: textInput.text.trim(),
          color: currentColor,
          thickness: currentThickness
        };
        setShapes(prev => {
          const updated = [...prev, newShape];
          addToHistory(updated);
          requestAnimationFrame(() => redrawAll(updated, scale, offset));
          return updated;
        });
      }
      setTextInput(null);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setTextInput(null);
    }
  }, [textInput, currentColor, currentThickness, scale, offset, addToHistory]);

  const handleTextInputBlur = useCallback(() => {
    // Small delay to allow Enter key to process
    setTimeout(() => {
      if (textInput && textInput.text.trim()) {
        const newShape: Shape = {
          id: textInput.id || Date.now().toString(),
          type: 'text',
          x: textInput.x,
          y: textInput.y,
          text: textInput.text.trim(),
          color: currentColor,
          thickness: currentThickness
        };
        setShapes(prev => {
          const updated = [...prev, newShape];
          addToHistory(updated);
          requestAnimationFrame(() => redrawAll(updated, scale, offset));
          return updated;
        });
      }
      setTextInput(null);
    }, 100);
  }, [textInput, currentColor, currentThickness, scale, offset, addToHistory]);

  // Handle IME composition events for mobile keyboards
  const handleCompositionStart = useCallback(() => {
    // IME started (e.g., Chinese/Japanese input)
  }, []);

  const handleCompositionEnd = useCallback(() => {
    handleTextInputChange();
  }, [handleTextInputChange]);

  // -- Keyboard Shortcuts --
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in text input
      if (textInput || document.activeElement?.tagName === 'INPUT' || 
          document.activeElement?.tagName === 'TEXTAREA' ||
          (document.activeElement as HTMLElement)?.contentEditable === 'true') {
        if (e.code === 'Escape' && textInput) {
          setTextInput(null);
        }
        return;
      }

      if (e.code === 'Space' && !e.repeat) {
        setIsSpacePressed(true);
      }
      
      // Undo/Redo shortcuts
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) undo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        if (canRedo) redo();
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [canUndo, canRedo, undo, redo, textInput]);

  // -- Clear Function --
  const limparTudo = useCallback(() => {
    if (confirm('Tem certeza que deseja limpar o quadro?')) {
      // Clear canvas
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx && canvas) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      
      // Clear state
      setShapes([]);
      setTextInput(null);
      
      // Clear undo/redo history
      const emptyHistory = [{ shapes: [], timestamp: Date.now() }];
      setHistory(emptyHistory);
      setHistoryIndex(0);
      
      // Clear localStorage autosave if exists
      try {
        localStorage.removeItem('parkinho_canvas_autosave');
      } catch (e) {
        // Ignore storage errors
      }
      
      // Reset view (optional)
      // setScale(1);
      // setOffset({ x: 0, y: 0 });
      
      // Cancel any pending animations
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
      
      // Reset drawing state
      isDrawing.current = false;
      isPanning.current = false;
      currentPath.current = [];
      startPoint.current = null;
      currentShapeId.current = null;
      activePointers.current.clear();
    }
  }, []);

  const clearCanvas = limparTudo;

  const resetView = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  // Generate thumbnail
  const getThumbnail = () => {
    if (!canvasRef.current) return '';
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    
    // Temporarily draw everything fitted to screen for thumbnail
    redrawAll(shapes, 1, { x: 0, y: 0 });
    const data = canvas.toDataURL('image/png');
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
                        onClick={() => { 
                          setCurrentTool(tool.id as Tool); 
                          setTextInput(null); 
                        }} 
                        className={`p-2 rounded-md transition-all touch-manipulation ${currentTool === tool.id ? 'bg-neon-blue/20 text-neon-blue' : 'text-gray-400 hover:text-white'}`}
                        title={tool.title}
                        style={{ touchAction: 'manipulation' }}
                    >
                        <tool.icon size={20} />
                    </button>
                ))}
             </div>
             
             <div className="flex bg-bg-tertiary rounded-lg p-1.5 border border-border gap-1 shadow-lg backdrop-blur-sm bg-opacity-90">
                {COLORS.map(color => (
                    <button 
                      key={color} 
                      onClick={() => setCurrentColor(color)} 
                      className={`w-6 h-6 rounded-full border-2 transition-transform touch-manipulation ${currentColor === color ? 'border-white scale-110' : 'border-border'}`} 
                      style={{ backgroundColor: color, touchAction: 'manipulation' }}
                    />
                ))}
             </div>

             <div className="flex bg-bg-tertiary rounded-lg p-1 border border-border shadow-lg backdrop-blur-sm bg-opacity-90">
                 {THICKNESS_OPTIONS.map(size => (
                     <button 
                       key={size} 
                       onClick={() => setCurrentThickness(size)} 
                       className={`w-8 h-8 flex items-center justify-center rounded touch-manipulation ${currentThickness === size ? 'bg-neon-blue/20 text-neon-blue' : 'text-gray-400'}`}
                       style={{ touchAction: 'manipulation' }}
                     >
                        <div className="bg-current rounded-full" style={{ width: size, height: size }} />
                     </button>
                 ))}
             </div>

             {/* Undo/Redo Buttons */}
             <div className="flex bg-bg-tertiary rounded-lg p-1 border border-border shadow-lg backdrop-blur-sm bg-opacity-90 gap-1">
               <button 
                 onClick={undo} 
                 disabled={!canUndo}
                 className={`p-2 rounded-md transition-all touch-manipulation ${canUndo ? 'text-gray-400 hover:text-white' : 'text-gray-600 cursor-not-allowed'}`}
                 title="Desfazer (Ctrl+Z)"
                 style={{ touchAction: 'manipulation' }}
               >
                 <Undo2 size={20} />
               </button>
               <button 
                 onClick={redo} 
                 disabled={!canRedo}
                 className={`p-2 rounded-md transition-all touch-manipulation ${canRedo ? 'text-gray-400 hover:text-white' : 'text-gray-600 cursor-not-allowed'}`}
                 title="Refazer (Ctrl+Y)"
                 style={{ touchAction: 'manipulation' }}
               >
                 <Redo2 size={20} />
               </button>
             </div>
             
             <button 
               onClick={() => onSendToParkinho(shapes, getThumbnail())} 
               className="flex items-center gap-2 px-3 py-2 bg-neon-purple text-white rounded-lg shadow-lg font-bold hover:brightness-110 transition-all touch-manipulation"
               style={{ touchAction: 'manipulation' }}
             >
                <Share size={16} /> Enviar p/ Parkinho
             </button>
             
             <button 
               onClick={clearCanvas} 
               className="p-2 bg-red-900/50 text-red-200 border border-red-800 rounded-lg shadow-lg hover:bg-red-900 transition-all touch-manipulation" 
               title="Limpar"
               style={{ touchAction: 'manipulation' }}
             >
                <Trash2 size={20} />
             </button>
          </div>

           {/* Maximize Button - Top Right */}
           <div className="absolute top-4 right-4 z-20 pointer-events-auto">
                <button 
                    onClick={onToggleFullscreen} 
                    className="p-2 bg-bg-tertiary text-neon-blue border border-border rounded-lg shadow-lg hover:text-white transition-all touch-manipulation"
                    title={isFullscreen ? "Sair do Fullscreen" : "Maximizar"}
                    style={{ touchAction: 'manipulation' }}
                >
                    {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                </button>
           </div>

           {/* Zoom Controls - Bottom Right */}
           <div className="absolute bottom-4 right-4 z-20 pointer-events-auto flex flex-col gap-2">
                <div className="flex flex-col bg-bg-tertiary rounded-lg border border-border shadow-lg overflow-hidden">
                    <button 
                      onClick={() => setScale(s => Math.min(s * 1.2, 5))} 
                      className="p-2 hover:bg-white/10 text-white touch-manipulation" 
                      title="Zoom In"
                      style={{ touchAction: 'manipulation' }}
                    >
                      <ZoomIn size={20} />
                    </button>
                    <button 
                      onClick={() => setScale(s => Math.max(s / 1.2, 0.1))} 
                      className="p-2 hover:bg-white/10 text-white touch-manipulation" 
                      title="Zoom Out"
                      style={{ touchAction: 'manipulation' }}
                    >
                      <ZoomOut size={20} />
                    </button>
                    <button 
                      onClick={resetView} 
                      className="p-2 hover:bg-white/10 text-white border-t border-border touch-manipulation" 
                      title="Reset View"
                      style={{ touchAction: 'manipulation' }}
                    >
                      <RotateCcw size={16} />
                    </button>
                </div>
                <div className="bg-bg-tertiary px-2 py-1 rounded text-xs text-center border border-border text-gray-400">
                    {Math.round(scale * 100)}%
                </div>
           </div>

          {/* Canvas Container */}
          <div 
            className="flex-1 bg-bg-primary relative overflow-hidden select-none" 
            ref={containerRef} 
            style={{ touchAction: 'none' }}
          >
              <div 
                className="w-full h-full cursor-crosshair relative z-10"
                onWheel={handleWheel}
              >
                  <canvas
                      ref={canvasRef}
                      onPointerDown={startInteraction}
                      onPointerMove={moveInteraction}
                      onPointerUp={stopInteraction}
                      onPointerCancel={handlePointerCancel}
                      onPointerLeave={stopInteraction}
                      // Fallback for browsers without pointer events
                      onMouseDown={(e) => {
                        if (!('PointerEvent' in window)) {
                          startInteraction(e as any);
                        }
                      }}
                      onMouseMove={(e) => {
                        if (!('PointerEvent' in window)) {
                          moveInteraction(e as any);
                        }
                      }}
                      onMouseUp={(e) => {
                        if (!('PointerEvent' in window)) {
                          stopInteraction(e as any);
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!('PointerEvent' in window)) {
                          stopInteraction(e as any);
                        }
                      }}
                      onTouchStart={(e) => {
                        if (!('PointerEvent' in window)) {
                          e.preventDefault();
                          startInteraction(e as any);
                        }
                      }}
                      onTouchMove={(e) => {
                        if (!('PointerEvent' in window)) {
                          e.preventDefault();
                          moveInteraction(e as any);
                        }
                      }}
                      onTouchEnd={(e) => {
                        if (!('PointerEvent' in window)) {
                          e.preventDefault();
                          stopInteraction(e as any);
                        }
                      }}
                      className={`block w-full h-full ${isSpacePressed || currentTool === 'hand' ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'}`}
                      style={{ touchAction: 'none' }}
                  />
                  
                  {/* Text Input Overlay - ContentEditable for mobile IME support */}
                  {textInput && (
                      <div
                        ref={textInputRef}
                        contentEditable
                        suppressContentEditableWarning
                        onInput={handleTextInputChange}
                        onKeyDown={handleTextInputKeyDown}
                        onBlur={handleTextInputBlur}
                        onCompositionStart={handleCompositionStart}
                        onCompositionEnd={handleCompositionEnd}
                        style={{
                            position: 'absolute',
                            left: `${textInput.screenX || 0}px`,
                            top: `${textInput.screenY || 0}px`,
                            fontSize: `${Math.max(12, currentThickness * 6 * scale)}px`,
                            color: currentColor,
                            fontFamily: 'Inter, sans-serif',
                            background: 'rgba(10, 10, 15, 0.9)',
                            border: '2px dashed #3b82f6',
                            outline: 'none',
                            padding: '4px 8px',
                            margin: 0,
                            minWidth: '120px',
                            maxWidth: '400px',
                            minHeight: '24px',
                            borderRadius: '4px',
                            zIndex: 30,
                            boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)',
                            wordWrap: 'break-word',
                            whiteSpace: 'pre-wrap',
                            touchAction: 'manipulation',
                            WebkitUserSelect: 'text',
                            userSelect: 'text',
                            WebkitTapHighlightColor: 'transparent'
                        }}
                        data-placeholder={textInput.text ? '' : 'Digite...'}
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
