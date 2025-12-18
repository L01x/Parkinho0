// 🎯 SNIPPETS DE MELHORIA - Opcionais para Implementar

// ============================================
// 1. UNDO/REDO SYSTEM
// ============================================

interface HistoryState {
  shapes: Shape[];
  timestamp: number;
}

const useUndoRedoCanvas = (initialShapes: Shape[] = []) => {
  const maxHistory = 50; // Limitar memória
  const [history, setHistory] = React.useState<HistoryState[]>([
    { shapes: initialShapes, timestamp: Date.now() }
  ]);
  const [currentIndex, setCurrentIndex] = React.useState(0);

  const addToHistory = (shapes: Shape[]) => {
    const newHistory = history.slice(0, currentIndex + 1);
    newHistory.push({ shapes, timestamp: Date.now() });
    
    if (newHistory.length > maxHistory) {
      newHistory.shift();
    } else {
      setCurrentIndex(newHistory.length - 1);
    }
    
    setHistory(newHistory);
  };

  const undo = () => {
    setCurrentIndex(prev => Math.max(0, prev - 1));
  };

  const redo = () => {
    setCurrentIndex(prev => Math.min(history.length - 1, prev + 1));
  };

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;
  const currentShapes = history[currentIndex].shapes;

  return { currentShapes, addToHistory, undo, redo, canUndo, canRedo };
};

// Uso:
// const { currentShapes, addToHistory, undo, redo } = useUndoRedoCanvas();
// <button onClick={undo} disabled={!canUndo}>↶ Desfazer</button>


// ============================================
// 2. HAPTIC FEEDBACK
// ============================================

const triggerHapticFeedback = (pattern: 'light' | 'medium' | 'heavy') => {
  if (!navigator.vibrate) return;
  
  const patterns = {
    light: [5],
    medium: [10],
    heavy: [20, 10, 20],
  };
  
  navigator.vibrate(patterns[pattern]);
};

// Uso:
// triggerHapticFeedback('medium'); // Ao iniciar draw


// ============================================
// 3. EXPORT AS IMAGE
// ============================================

const exportCanvasAsImage = (
  canvas: HTMLCanvasElement,
  filename: string = 'drawing.png',
  backgroundColor: string = '#ffffff'
) => {
  try {
    // Criar canvas temporário com background
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;
    
    // Preencher background
    tempCtx.fillStyle = backgroundColor;
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    
    // Copiar drawing
    tempCtx.drawImage(canvas, 0, 0);
    
    // Download
    const link = document.createElement('a');
    link.href = tempCanvas.toDataURL('image/png');
    link.download = filename;
    link.click();
    
  } catch (error) {
    console.error('Erro ao exportar:', error);
  }
};

// Uso:
// <button onClick={() => exportCanvasAsImage(canvasRef.current, 'minha-ideia.png')}>
//   📥 Exportar como PNG
// </button>


// ============================================
// 4. GESTURE RECOGNITION (Undo com 3 dedos)
// ============================================

const useGestureRecognition = () => {
  const [touchCount, setTouchCount] = React.useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchCount(e.touches.length);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    // Se levantou 3 dedos que estavam na tela
    if (touchCount === 3 && e.touches.length < 3) {
      return { gesture: 'three-finger-lift' };
    }
    setTouchCount(e.touches.length);
    return { gesture: null };
  };

  return { handleTouchStart, handleTouchEnd };
};

// Uso:
// const { handleTouchStart, handleTouchEnd } = useGestureRecognition();
// <canvas onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} />


// ============================================
// 5. PERFORMANCE MONITORING
// ============================================

class PerformanceMonitor {
  private frameCount = 0;
  private lastTime = performance.now();
  private fps = 60;
  private metrics = {
    drawTime: 0,
    renderTime: 0,
    shapes: 0
  };

  measureDraw(fn: () => void) {
    const start = performance.now();
    fn();
    this.metrics.drawTime = performance.now() - start;
  }

  updateFPS() {
    this.frameCount++;
    const now = performance.now();
    
    if (now - this.lastTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastTime = now;
    }
    
    return this.fps;
  }

  getMetrics() {
    return {
      fps: this.fps,
      ...this.metrics
    };
  }
}

// Uso:
// const monitor = new PerformanceMonitor();
// monitor.measureDraw(() => redrawAll(...));
// console.log(monitor.getMetrics());


// ============================================
// 6. TOUCH PRESSURE (iOS 13+)
// ============================================

const getTouchPressure = (touch: Touch): number => {
  if (!touch.force) return 1; // Default
  return Math.min(touch.force / touch.radiusX, 1); // Normalizar 0-1
};

const handlePressureSensitiveDrawing = (e: React.TouchEvent) => {
  const touch = e.touches[0];
  const pressure = getTouchPressure(touch);
  
  // Ajustar espessura baseado em pressão
  const adaptiveThickness = Math.max(1, 8 * pressure);
  return adaptiveThickness;
};

// Uso: Útil para S Pen no Samsung, Apple Pencil no iPad


// ============================================
// 7. AUTOSAVE SYSTEM
// ============================================

const useAutoSave = (shapes: Shape[], interval: number = 5000) => {
  React.useEffect(() => {
    const timer = setInterval(() => {
      // Salvar automaticamente
      localStorage.setItem('parkinho_autosave', JSON.stringify(shapes));
    }, interval);
    
    return () => clearInterval(timer);
  }, [shapes, interval]);

  const recoverFromAutosave = () => {
    const saved = localStorage.getItem('parkinho_autosave');
    return saved ? JSON.parse(saved) : null;
  };

  return { recoverFromAutosave };
};

// Uso:
// useAutoSave(shapes, 5000); // Salvar a cada 5 segundos


// ============================================
// 8. COLLABORATION MOCK (Multi-user)
// ============================================

interface CollaborativeShape extends Shape {
  userId: string;
  color: string;
  isLocal: boolean;
}

const useCollaborativeCanvas = () => {
  const [shapes, setShapes] = React.useState<CollaborativeShape[]>([]);
  const userId = React.useMemo(() => `user_${Date.now()}`, []);

  const addShapeLocally = (shape: Shape) => {
    const collabShape: CollaborativeShape = {
      ...shape,
      userId,
      isLocal: true
    };
    setShapes(prev => [...prev, collabShape]);
    // Aqui enviar para WebSocket/Server
  };

  const receiveRemoteShape = (shape: CollaborativeShape) => {
    setShapes(prev => [...prev, { ...shape, isLocal: false }]);
  };

  return { shapes, addShapeLocally, receiveRemoteShape };
};

// Seria necessário WebSocket para real-time


// ============================================
// 9. DARK MODE DETECTION
// ============================================

const useDarkModePreference = () => {
  const [isDark, setIsDark] = React.useState(() => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDark(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return isDark;
};

// Uso:
// const isDark = useDarkModePreference();
// const bgColor = isDark ? '#0a0a0f' : '#ffffff';


// ============================================
// 10. KEYBOARD SHORTCUTS MANAGER
// ============================================

interface Shortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
}

class KeyboardShortcutManager {
  private shortcuts: Map<string, Shortcut> = new Map();

  register(shortcut: Shortcut) {
    const key = this.getKey(shortcut);
    this.shortcuts.set(key, shortcut);
  }

  private getKey(shortcut: Shortcut): string {
    const parts = [];
    if (shortcut.ctrl) parts.push('ctrl');
    if (shortcut.shift) parts.push('shift');
    if (shortcut.alt) parts.push('alt');
    parts.push(shortcut.key);
    return parts.join('+');
  }

  handleKeyDown(e: KeyboardEvent) {
    const key = this.getKey({
      key: e.key.toLowerCase(),
      ctrl: e.ctrlKey,
      shift: e.shiftKey,
      alt: e.altKey,
      action: () => {}
    });

    const shortcut = this.shortcuts.get(key);
    if (shortcut && !this.isInputFocused()) {
      e.preventDefault();
      shortcut.action();
    }
  }

  private isInputFocused(): boolean {
    const active = document.activeElement;
    return active?.tagName === 'INPUT' || active?.tagName === 'TEXTAREA';
  }
}

// Uso:
// const manager = new KeyboardShortcutManager();
// manager.register({ key: 'z', ctrl: true, action: undo });
// manager.register({ key: 'y', ctrl: true, action: redo });
// window.addEventListener('keydown', e => manager.handleKeyDown(e));


// ============================================
// 11. RESPONSIVE CANVAS
// ============================================

const useResponsiveCanvas = (containerRef: React.RefObject<HTMLDivElement>) => {
  const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 });

  React.useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
      const { clientWidth, clientHeight } = containerRef.current!;
      setDimensions({ width: clientWidth, height: clientHeight });
    };

    updateDimensions();
    const observer = new ResizeObserver(updateDimensions);
    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [containerRef]);

  return dimensions;
};

// Já implementado no código original com ResizeObserver


// ============================================
// 12. SMOOTHING ALGORITHM (Bezier Curves)
// ============================================

const smoothPath = (points: Point[]): Point[] => {
  if (points.length < 2) return points;

  const result: Point[] = [];

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    
    // Gerar pontos intermediários
    for (let t = 0; t < 0.5; t += 0.1) {
      result.push({
        x: p0.x + (p1.x - p0.x) * t,
        y: p0.y + (p1.y - p0.y) * t
      });
    }
  }

  result.push(points[points.length - 1]);
  return result;
};

// Uso: Tornaria desenhos mais suaves
// currentPath.current = smoothPath(currentPath.current);


export {
  useUndoRedoCanvas,
  triggerHapticFeedback,
  exportCanvasAsImage,
  useGestureRecognition,
  PerformanceMonitor,
  getTouchPressure,
  useAutoSave,
  useCollaborativeCanvas,
  useDarkModePreference,
  KeyboardShortcutManager,
  useResponsiveCanvas,
  smoothPath
};
