import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, Maximize2, Minimize2, Eraser, Pencil, X, Undo2, Redo2, 
  Type, Square, Circle, ArrowLeft, Loader2, CheckCircle2, User, Mail 
} from 'lucide-react';
import { Tooltip } from './tooltip';
import { Idea } from '../App';

interface DrawingBoardProps {
  title: string;
  description: string;
  onSubmit: (idea: Idea) => void;
  onBack: () => void;
}

const COLORS = [
  { name: 'Azul Neon', value: '#00b0ff' },
  { name: 'Roxo Neon', value: '#9b5cff' },
  { name: 'Verde Neon', value: '#00ff9a' },
  { name: 'Rosa', value: '#ff006e' },
  { name: 'Laranja', value: '#ff6700' },
  { name: 'Amarelo', value: '#ffd60a' },
  { name: 'Branco', value: '#ffffff' },
];

const SIZES = [
  { name: 'Fino', value: 2 },
  { name: 'Médio', value: 4 },
  { name: 'Grosso', value: 8 },
  { name: 'Extra', value: 12 },
];

type Tool = 'pen' | 'eraser' | 'text' | 'rectangle' | 'circle';

export function DrawingBoard({ title, description, onSubmit, onBack }: DrawingBoardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState('#00b0ff');
  const [size, setSize] = useState(4);
  const [showUserModal, setShowUserModal] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        
        // Gradient background
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(1, '#f8f9ff');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        setContext(ctx);
        saveToHistory();
      }
    }
  }, [isExpanded]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          undo();
        } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
          e.preventDefault();
          redo();
        }
      }
      
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        switch(e.key.toLowerCase()) {
          case 'p': setTool('pen'); break;
          case 'e': setTool('eraser'); break;
          case 't': setTool('text'); break;
          case 'r': setTool('rectangle'); break;
          case 'c': setTool('circle'); break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [history, historyStep]);

  const saveToHistory = () => {
    if (!canvasRef.current) return;
    const imageData = canvasRef.current.toDataURL();
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(imageData);
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  const undo = () => {
    if (historyStep > 0 && canvasRef.current && context) {
      const newStep = historyStep - 1;
      const img = new Image();
      img.onload = () => {
        context.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
        context.drawImage(img, 0, 0);
      };
      img.src = history[newStep];
      setHistoryStep(newStep);
    }
  };

  const redo = () => {
    if (historyStep < history.length - 1 && canvasRef.current && context) {
      const newStep = historyStep + 1;
      const img = new Image();
      img.onload = () => {
        context.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
        context.drawImage(img, 0, 0);
      };
      img.src = history[newStep];
      setHistoryStep(newStep);
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!context) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setStartPos({ x, y });
    setIsDrawing(true);
    
    if (tool === 'pen' || tool === 'eraser') {
      context.beginPath();
      context.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !context || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (tool === 'pen') {
      context.strokeStyle = color;
      context.lineWidth = size;
      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.lineTo(x, y);
      context.stroke();
    } else if (tool === 'eraser') {
      context.strokeStyle = '#ffffff';
      context.lineWidth = 20;
      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.lineTo(x, y);
      context.stroke();
    }
  };

  const stopDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!context || !isDrawing || !startPos || !canvasRef.current) {
      setIsDrawing(false);
      return;
    }

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === 'rectangle') {
      context.strokeStyle = color;
      context.lineWidth = size;
      context.strokeRect(startPos.x, startPos.y, x - startPos.x, y - startPos.y);
    } else if (tool === 'circle') {
      context.strokeStyle = color;
      context.lineWidth = size;
      const radius = Math.sqrt(Math.pow(x - startPos.x, 2) + Math.pow(y - startPos.y, 2));
      context.beginPath();
      context.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
      context.stroke();
    } else if (tool === 'text') {
      const text = prompt('Digite o texto:');
      if (text) {
        context.fillStyle = color;
        context.font = `${size * 8}px Poppins`;
        context.fillText(text, startPos.x, startPos.y);
      }
    }

    setIsDrawing(false);
    context.closePath();
    saveToHistory();
  };

  const clearCanvas = () => {
    if (!context || !canvasRef.current) return;
    const gradient = context.createLinearGradient(0, 0, canvasRef.current.width, canvasRef.current.height);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(1, '#f8f9ff');
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    saveToHistory();
  };

  const handleSendClick = () => {
    if (!canvasRef.current || !title.trim()) {
      alert('Por favor, adicione um título!');
      return;
    }
    setShowUserModal(true);
  };

  const handleFinalSubmit = async () => {
    if (!userName.trim() || !userEmail.trim() || !canvasRef.current) return;
    
    setIsSending(true);
    
    const idea: Idea = {
      id: Date.now().toString(),
      title,
      description,
      drawing: canvasRef.current.toDataURL(),
      userName,
      userEmail,
      createdAt: new Date(),
    };

    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
    
    setIsSending(false);
    setSendSuccess(true);
    
    setTimeout(() => {
      onSubmit(idea);
    }, 1000);
  };

  return (
    <>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`${isExpanded ? 'fixed inset-0 z-40 bg-[#0b0b0d] p-4' : 'min-h-screen px-4 py-8'}`}
      >
        {/* Header */}
        <div className="max-w-7xl mx-auto mb-6">
          <div className="flex items-center justify-between mb-4">
            <Tooltip content="Voltar">
              <button
                onClick={onBack}
                className="ripple flex items-center gap-2 px-5 py-3 bg-gray-800/50 backdrop-blur-sm border-2 border-gray-700 text-gray-300 rounded-xl hover:bg-gray-700/50 hover:border-gray-600 transition-all duration-300"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Voltar</span>
              </button>
            </Tooltip>

            <div className="text-center flex-1 px-4">
              <h2 className="text-2xl md:text-3xl text-white neon-text">
                ✏️ Detalhes Visuais
              </h2>
              <p className="text-gray-400 text-sm mt-1">{title}</p>
              <p className="text-gray-500 text-xs mt-1 line-clamp-2">{description}</p>
            </div>

            <div className="w-20 sm:w-32"></div>
          </div>

          {/* Title Input */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="✨ Título da ideia..."
            className="w-full px-5 py-4 rounded-xl border-2 border-[#00b0ff]/30 focus:border-[#00b0ff] focus:outline-none bg-[#1a1a1d] text-white shadow-lg transition-all duration-300"
          />
        </div>

        {/* Main Drawing Area */}
        <div className="max-w-7xl mx-auto">
          {/* Toolbar */}
          <div className="flex flex-wrap gap-3 mb-4 p-4 bg-[#1a1a1d]/90 backdrop-blur-sm rounded-xl border border-[#00b0ff]/20">
            {/* Tools */}
            <div className="flex gap-2 flex-wrap">
              {[
                { tool: 'pen', icon: Pencil, label: 'Caneta', shortcut: 'P' },
                { tool: 'eraser', icon: Eraser, label: 'Borracha', shortcut: 'E' },
                { tool: 'text', icon: Type, label: 'Texto', shortcut: 'T' },
                { tool: 'rectangle', icon: Square, label: 'Retângulo', shortcut: 'R' },
                { tool: 'circle', icon: Circle, label: 'Círculo', shortcut: 'C' },
              ].map(({ tool: t, icon: Icon, label, shortcut }) => (
                <Tooltip key={t} content={label} shortcut={shortcut}>
                  <button
                    onClick={() => setTool(t as Tool)}
                    className={`ripple p-3 rounded-lg transition-all ${
                      tool === t
                        ? 'bg-gradient-to-r from-[#00b0ff] to-[#9b5cff] text-white shadow-lg'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </button>
                </Tooltip>
              ))}
            </div>

            {/* Undo/Redo */}
            <div className="flex gap-2">
              <Tooltip content="Desfazer" shortcut="Ctrl+Z">
                <button
                  onClick={undo}
                  disabled={historyStep <= 0}
                  className="ripple p-3 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Undo2 className="w-5 h-5" />
                </button>
              </Tooltip>
              <Tooltip content="Refazer" shortcut="Ctrl+Y">
                <button
                  onClick={redo}
                  disabled={historyStep >= history.length - 1}
                  className="ripple p-3 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Redo2 className="w-5 h-5" />
                </button>
              </Tooltip>
            </div>

            {/* Colors */}
            {(tool === 'pen' || tool === 'text' || tool === 'rectangle' || tool === 'circle') && (
              <div className="flex gap-2 items-center flex-wrap">
                {COLORS.map((c) => (
                  <Tooltip key={c.value} content={c.name}>
                    <button
                      onClick={() => setColor(c.value)}
                      className={`w-8 h-8 rounded-full transition-all ${
                        color === c.value ? 'ring-4 ring-[#00b0ff] scale-110' : ''
                      }`}
                      style={{ backgroundColor: c.value }}
                    />
                  </Tooltip>
                ))}
              </div>
            )}

            {/* Sizes */}
            {(tool === 'pen' || tool === 'rectangle' || tool === 'circle' || tool === 'text') && (
              <div className="flex gap-2">
                {SIZES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setSize(s.value)}
                    className={`px-3 py-2 rounded-lg text-sm transition-all ${
                      size === s.value
                        ? 'bg-[#00b0ff] text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            )}

            {/* Clear & Expand */}
            <div className="ml-auto flex gap-2">
              <Tooltip content="Limpar">
                <button
                  onClick={clearCanvas}
                  className="ripple p-3 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30"
                >
                  <X className="w-5 h-5" />
                </button>
              </Tooltip>
              <Tooltip content={isExpanded ? "Minimizar" : "Expandir"}>
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="ripple p-3 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700"
                >
                  {isExpanded ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                </button>
              </Tooltip>
            </div>
          </div>

          {/* Canvas */}
          <motion.div
            layout
            className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-[#00b0ff]/30 neon-border"
          >
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              className={`w-full cursor-crosshair ${isExpanded ? 'h-[calc(100vh-22rem)]' : 'h-[28rem] md:h-[36rem]'}`}
            />
          </motion.div>

          {/* Submit Button */}
          <div className="flex justify-center mt-6">
            <motion.button
              onClick={handleSendClick}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="group px-12 py-5 bg-gradient-to-r from-[#00b0ff] via-[#9b5cff] to-[#ff006e] text-white text-lg font-semibold rounded-full shadow-2xl hover:shadow-[0_0_40px_rgba(0,176,255,0.6)] transition-all duration-500"
            >
              <span className="flex items-center gap-3">
                <Send className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                Enviar para o Parkinho
              </span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* User Info Modal */}
      <AnimatePresence>
        {showUserModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => !isSending && setShowUserModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[#1a1a1d] rounded-2xl p-8 border-2 border-[#00b0ff]/30 shadow-2xl"
            >
              {!sendSuccess ? (
                <>
                  <h3 className="text-2xl font-bold text-white mb-2 neon-text">Quase lá!</h3>
                  <p className="text-gray-400 mb-6">Precisamos de algumas informações</p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-400 mb-2 text-sm">Seu nome</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                          type="text"
                          value={userName}
                          onChange={(e) => setUserName(e.target.value)}
                          placeholder="João Silva"
                          className="w-full pl-12 pr-4 py-3 bg-gray-900/50 border-2 border-[#00b0ff]/30 rounded-xl text-white focus:border-[#00b0ff] focus:outline-none"
                          disabled={isSending}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-gray-400 mb-2 text-sm">Seu email</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                          type="email"
                          value={userEmail}
                          onChange={(e) => setUserEmail(e.target.value)}
                          placeholder="joao@email.com"
                          className="w-full pl-12 pr-4 py-3 bg-gray-900/50 border-2 border-[#00b0ff]/30 rounded-xl text-white focus:border-[#00b0ff] focus:outline-none"
                          disabled={isSending}
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                      <button
                        onClick={() => setShowUserModal(false)}
                        disabled={isSending}
                        className="flex-1 px-6 py-3 bg-gray-800 text-gray-300 rounded-xl hover:bg-gray-700 transition-all disabled:opacity-50"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleFinalSubmit}
                        disabled={!userName.trim() || !userEmail.trim() || isSending}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-[#00b0ff] to-[#9b5cff] text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isSending ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <Send className="w-5 h-5" />
                            Enviar
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="text-center py-8"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1, rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    <CheckCircle2 className="w-20 h-20 text-[#00ff9a] mx-auto mb-4 drop-shadow-[0_0_20px_rgba(0,255,154,0.6)]" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-white mb-2">Enviado com sucesso!</h3>
                  <p className="text-gray-400">Sua ideia está salva no Parkinho</p>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}