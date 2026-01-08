import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lightbulb, ArrowRight, Sparkles, Archive, HelpCircle, X, User, Mail, Loader2, CheckCircle2 } from 'lucide-react';
import suzanoLogo from 'figma:asset/7403fc0046cdcec0745aa9e0759f8c5d1d156c64.png';

interface HomePageProps {
  onStartDrawing: (title: string, description: string) => void;
  onDirectSubmit: (title: string, description: string, userName: string, userEmail: string) => void;
  onViewParkingLot: () => void;
}

export function HomePage({ onStartDrawing, onDirectSubmit, onViewParkingLot }: HomePageProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [showDescription, setShowDescription] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');

  const handleDirectSend = () => {
    if (!title.trim() || !description.trim()) {
      alert('Por favor, preencha título e descrição!');
      return;
    }
    setShowUserModal(true);
  };

  const handleFinalSubmit = async () => {
    if (!userName.trim() || !userEmail.trim()) return;
    
    setIsSending(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSending(false);
    setSendSuccess(true);
    
    setTimeout(() => {
      onDirectSubmit(title, description, userName, userEmail);
      setShowUserModal(false);
      setSendSuccess(false);
      setUserName('');
      setUserEmail('');
      setTitle('');
      setDescription('');
    }, 1000);
  };

  const handleAddDetails = () => {
    if (!title.trim() || !description.trim()) {
      alert('Por favor, preencha título e descrição!');
      return;
    }
    onStartDrawing(title, description);
  };

  return (
    <>
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4">
        {/* Tech Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#0f1419] to-[#0a0a0a]">
          {/* Circuit Pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(0deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }} />
          
          {/* Tech Lines */}
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-[1px] bg-gradient-to-r from-transparent via-gray-700/20 to-transparent"
              style={{
                top: `${10 + i * 8}%`,
                left: i % 2 === 0 ? '0%' : '20%',
                width: i % 2 === 0 ? '40%' : '60%',
              }}
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: [0.2, 0.5, 0.2], x: 0 }}
              transition={{ 
                opacity: { duration: 3, repeat: Infinity, delay: i * 0.3 },
                x: { duration: 1, delay: i * 0.1 }
              }}
            />
          ))}

          {/* Subtle Glow */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-blue-900/10 via-transparent to-transparent rounded-full blur-3xl"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 8, repeat: Infinity }}
          />
        </div>

        {/* Parkinho Button - Top Right */}
        <motion.button
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          onClick={onViewParkingLot}
          className="fixed top-8 right-8 z-50 flex items-center gap-2 px-6 py-3 bg-gray-900/50 backdrop-blur-md border border-gray-700/50 text-gray-300 rounded-lg hover:border-gray-600 transition-all duration-300 hover:scale-105"
        >
          <Archive className="w-5 h-5" />
          <span>Parkinho</span>
        </motion.button>

        {/* Main Content */}
        <div className="relative z-10 w-full max-w-6xl">
          <AnimatePresence mode="wait">
            {!showDescription ? (
              // Initial Screen with CTO Branding
              <motion.div
                key="initial"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
                className="text-center space-y-16"
              >
                {/* Background Geometric Symbol - Watermark */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 1.5, delay: 0.3 }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ zIndex: 0 }}
                >
                  <svg width="600" height="600" viewBox="0 0 600 600" className="opacity-[0.03]">
                    {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => {
                      const size = 280 - (index * 35);
                      const points = Array.from({ length: 6 }, (_, i) => {
                        const angle = (Math.PI / 3) * i - Math.PI / 2;
                        const x = 300 + size * Math.cos(angle);
                        const y = 300 + size * Math.sin(angle);
                        return `${x},${y}`;
                      }).join(' ');

                      return (
                        <motion.polygon
                          key={index}
                          points={points}
                          fill="none"
                          stroke="#ffffff"
                          strokeWidth="3"
                          animate={{ 
                            rotate: index % 2 === 0 ? [0, 360] : [0, -360]
                          }}
                          transition={{ 
                            duration: 40 + index * 10, 
                            repeat: Infinity, 
                            ease: "linear" 
                          }}
                        />
                      );
                    })}
                  </svg>
                </motion.div>

                {/* Main Geometric Symbol - Center Focus */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.5, rotate: -180 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{ duration: 1.4, delay: 0.3, type: "spring", bounce: 0.3 }}
                  className="flex justify-center relative z-10 mb-12"
                >
                  <div className="relative">
                    {/* Enhanced Glow Effect */}
                    <div className="absolute inset-0 bg-blue-500/30 blur-[80px] rounded-full scale-150" />
                    
                    {/* Main Hexagon Symbol */}
                    <svg width="320" height="320" viewBox="0 0 320 320" className="drop-shadow-2xl relative z-10">
                      {[0, 1, 2, 3, 4, 5].map((index) => {
                        const size = 145 - (index * 24);
                        const points = Array.from({ length: 6 }, (_, i) => {
                          const angle = (Math.PI / 3) * i - Math.PI / 2;
                          const x = 160 + size * Math.cos(angle);
                          const y = 160 + size * Math.sin(angle);
                          return `${x},${y}`;
                        }).join(' ');

                        return (
                          <motion.polygon
                            key={index}
                            points={points}
                            fill="none"
                            stroke={index === 5 ? "#60a5fa" : index === 0 ? "#ffffff" : "#e5e5e5"}
                            strokeWidth={index === 0 ? "4" : index === 5 ? "3" : "2.5"}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ 
                              opacity: 1, 
                              scale: 1,
                              rotate: index % 2 === 0 ? [0, 360] : [0, -360]
                            }}
                            transition={{ 
                              opacity: { delay: 0.6 + index * 0.12, duration: 0.5 },
                              scale: { delay: 0.6 + index * 0.12, duration: 0.5 },
                              rotate: { duration: 25 + index * 6, repeat: Infinity, ease: "linear" }
                            }}
                            style={{
                              filter: index === 5 ? 'drop-shadow(0 0 12px rgba(96, 165, 250, 0.8))' : 'none'
                            }}
                          />
                        );
                      })}
                      
                      {/* Center Circle with Glow */}
                      <motion.circle
                        cx="160"
                        cy="160"
                        r="18"
                        fill="#60a5fa"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ 
                          opacity: 1, 
                          scale: 1,
                        }}
                        transition={{ 
                          opacity: { delay: 1.3, duration: 0.4 },
                          scale: { delay: 1.3, duration: 0.4 },
                        }}
                        style={{
                          filter: 'drop-shadow(0 0 16px rgba(96, 165, 250, 1))'
                        }}
                      />
                      
                      {/* Pulsing Ring */}
                      <motion.circle
                        cx="160"
                        cy="160"
                        r="18"
                        fill="none"
                        stroke="#60a5fa"
                        strokeWidth="2"
                        animate={{ 
                          scale: [1, 1.8, 1],
                          opacity: [0.8, 0, 0.8],
                        }}
                        transition={{ 
                          duration: 2.5,
                          repeat: Infinity,
                          ease: "easeOut"
                        }}
                      />
                    </svg>
                  </div>
                </motion.div>

                {/* Portal de Ideias - Main Content */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0, duration: 0.8 }}
                  className="space-y-10 relative z-10"
                >
                  {/* Main Title */}
                  <div className="space-y-4">
                    <motion.h1 
                      className="text-5xl md:text-6xl font-light tracking-tight"
                      style={{
                        background: 'linear-gradient(180deg, #ffffff 0%, #d0d0d0 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                      }}
                    >
                      Portal de Ideias
                    </motion.h1>
                    
                    {/* Subtitle */}
                    <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto font-light">
                      Compartilhe suas inovações e contribua com a transformação digital
                    </p>
                  </div>

                  {/* Divider */}
                  <motion.div
                    initial={{ opacity: 0, scaleX: 0 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    transition={{ delay: 1.2, duration: 0.6 }}
                    className="w-32 h-[1px] bg-gradient-to-r from-transparent via-gray-600 to-transparent mx-auto"
                  />

                  {/* CTA Buttons */}
                  <div className="flex flex-col items-center gap-4 pt-4">
                    <motion.button
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.4 }}
                      onClick={() => setShowDescription(true)}
                      className="group relative px-16 py-5 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 text-white text-lg font-light rounded-md overflow-hidden border border-gray-600 hover:border-gray-500 transition-all duration-500 hover:shadow-lg hover:shadow-blue-500/20"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-blue-500/20 to-blue-600/20"
                        initial={{ x: '-100%' }}
                        whileHover={{ x: '100%' }}
                        transition={{ duration: 0.6 }}
                      />
                      <span className="relative flex items-center gap-3">
                        Enviar Nova Ideia
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </motion.button>

                    <motion.button
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.6 }}
                      onClick={() => setShowHowItWorks(true)}
                      className="group flex items-center gap-2 px-8 py-3 bg-transparent border border-gray-700 text-gray-400 rounded-md hover:bg-gray-900/30 hover:border-gray-600 hover:text-gray-300 transition-all duration-300"
                      whileHover={{ scale: 1.02 }}
                    >
                      <HelpCircle className="w-5 h-5" />
                      Como funciona?
                    </motion.button>
                  </div>

                  {/* Features */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.8 }}
                    className="flex flex-wrap justify-center gap-8 pt-8 text-gray-500 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                      <span>Inovação Contínua</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                      <span>Colaboração</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                      <span>Transformação Digital</span>
                    </div>
                  </motion.div>
                </motion.div>

                {/* Bottom Left Branding - CTO + Suzano */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 2.0, duration: 0.8 }}
                  className="fixed bottom-8 left-8 flex items-center gap-4 z-20"
                >
                  {/* CTO Text - Small and Discrete */}
                  <div 
                    className="text-2xl font-bold tracking-tight opacity-75"
                    style={{
                      background: 'linear-gradient(180deg, #e5e5e5 0%, #a0a0a0 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                      letterSpacing: '-0.02em'
                    }}
                  >
                    CTO
                  </div>

                  {/* Vertical Divider */}
                  <div className="w-[1px] h-12 bg-gray-700/50" />

                  {/* Suzano Logo PNG */}
                  <div className="opacity-80">
                    <img 
                      src={suzanoLogo} 
                      alt="Suzano" 
                      className="h-14 w-auto object-contain"
                      style={{ filter: 'brightness(0.9)' }}
                    />
                  </div>
                </motion.div>
              </motion.div>
            ) : (
              // Description Form
              <motion.div
                key="description"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -20 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="max-w-2xl mx-auto"
              >
                <div className="space-y-8">
                  {/* Header */}
                  <div className="text-center space-y-3">
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="inline-block"
                    >
                      <Sparkles className="w-16 h-16 text-[#00ff9a] drop-shadow-[0_0_20px_rgba(0,255,154,0.6)]" />
                    </motion.div>
                    <h2 className="text-3xl md:text-4xl font-bold text-white neon-purple">
                      Conte sua ideia
                    </h2>
                    <p className="text-gray-400">
                      Preencha os detalhes da sua ideia
                    </p>
                  </div>

                  {/* Title Input */}
                  <div className="relative">
                    <motion.div
                      className="absolute -inset-1 bg-gradient-to-r from-[#00b0ff] via-[#9b5cff] to-[#ff006e] rounded-2xl blur opacity-20"
                      animate={{
                        opacity: [0.2, 0.3, 0.2],
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="✨ Título da sua ideia..."
                      className="relative w-full px-6 py-4 bg-[#1a1a1d]/90 backdrop-blur-sm border-2 border-[#00b0ff]/30 rounded-2xl text-white placeholder-gray-500 focus:border-[#00b0ff] focus:outline-none transition-all duration-300 text-lg"
                      autoFocus
                      required
                    />
                  </div>

                  {/* Description Input */}
                  <div className="relative">
                    <motion.div
                      className="absolute -inset-1 bg-gradient-to-r from-[#00b0ff] via-[#9b5cff] to-[#ff006e] rounded-2xl blur opacity-20"
                      animate={{
                        opacity: [0.2, 0.3, 0.2],
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Descreva sua ideia em detalhes... Ex: Uma plataforma para conectar voluntários com ONGs locais, permitindo que pessoas encontrem causas que se alinham com seus valores e disponibilidade."
                      className="relative w-full h-64 px-6 py-4 bg-[#1a1a1d]/90 backdrop-blur-sm border-2 border-[#00b0ff]/30 rounded-2xl text-white placeholder-gray-500 focus:border-[#00b0ff] focus:outline-none transition-all duration-300 resize-none text-lg"
                      maxLength={2000}
                      required
                    />
                    <div className="absolute bottom-4 right-4 text-sm text-gray-500">
                      {description.length}/2000
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-4">
                    <div className="flex gap-4">
                      <motion.button
                        type="button"
                        onClick={() => {
                          setShowDescription(false);
                          setTitle('');
                          setDescription('');
                        }}
                        className="flex-1 px-8 py-4 bg-gray-800/50 backdrop-blur-sm border-2 border-gray-700 text-gray-300 rounded-xl hover:bg-gray-700/50 hover:border-gray-600 transition-all duration-300"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Voltar
                      </motion.button>
                      <motion.button
                        type="button"
                        onClick={handleDirectSend}
                        disabled={!title.trim() || !description.trim()}
                        className="flex-1 group relative px-8 py-4 bg-gradient-to-r from-[#00b0ff] to-[#9b5cff] text-white rounded-xl overflow-hidden shadow-lg hover:shadow-[0_0_30px_rgba(0,176,255,0.5)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        whileHover={{ scale: (title.trim() && description.trim()) ? 1.02 : 1 }}
                        whileTap={{ scale: (title.trim() && description.trim()) ? 0.98 : 1 }}
                      >
                        <span className="relative flex items-center justify-center gap-2 font-semibold">
                          Enviar Ideia
                          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </span>
                      </motion.button>
                    </div>

                    {/* Optional Details Button */}
                    <motion.button
                      type="button"
                      onClick={handleAddDetails}
                      disabled={!title.trim() || !description.trim()}
                      className="w-full px-8 py-4 bg-white/5 backdrop-blur-sm border-2 border-white/10 text-white rounded-xl hover:bg-white/10 hover:border-white/20 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
                      whileHover={{ scale: (title.trim() && description.trim()) ? 1.02 : 1 }}
                      whileTap={{ scale: (title.trim() && description.trim()) ? 0.98 : 1 }}
                    >
                      <span className="flex items-center justify-center gap-2">
                        <Sparkles className="w-5 h-5" />
                        Adicionar Detalhes Visuais (Opcional)
                      </span>
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* How It Works Modal */}
      <AnimatePresence>
        {showHowItWorks && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
            onClick={() => setShowHowItWorks(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-4xl bg-[#1a1a1d] rounded-2xl overflow-hidden border-2 border-[#00b0ff]/30 shadow-2xl max-h-[85vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-800 sticky top-0 bg-[#1a1a1d] z-10">
                <h3 className="text-2xl font-bold text-white neon-text flex items-center gap-2">
                  <HelpCircle className="w-7 h-7" />
                  Como funciona?
                </h3>
                <button
                  onClick={() => setShowHowItWorks(false)}
                  className="p-2 bg-gray-800 text-gray-400 rounded-lg hover:bg-gray-700 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-8 space-y-8">
                {/* Step 1 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#00b0ff] to-[#9b5cff] flex items-center justify-center text-white text-xl font-bold">
                      1
                    </div>
                    <h4 className="text-xl text-white">Descreva sua ideia</h4>
                  </div>
                  <div className="ml-15 pl-3 border-l-2 border-[#00b0ff]/30 space-y-2">
                    <p className="text-gray-300">
                      Clique em <span className="text-[#00b0ff]">"Começar agora"</span> e preencha:
                    </p>
                    <ul className="list-disc list-inside text-gray-400 space-y-1 ml-4">
                      <li>Um <strong className="text-white">título</strong> chamativo para sua ideia</li>
                      <li>Uma <strong className="text-white">descrição</strong> detalhada (até 2000 caracteres)</li>
                    </ul>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#9b5cff] to-[#ff006e] flex items-center justify-center text-white text-xl font-bold">
                      2
                    </div>
                    <h4 className="text-xl text-white">Envie ou adicione detalhes</h4>
                  </div>
                  <div className="ml-15 pl-3 border-l-2 border-[#9b5cff]/30 space-y-3">
                    <p className="text-gray-300">Você tem duas opções:</p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-[#0f1113] p-4 rounded-xl border border-[#00b0ff]/20">
                        <h5 className="text-[#00b0ff] font-semibold mb-2">✅ Enviar direto</h5>
                        <p className="text-gray-400 text-sm">
                          Clique em <strong>"Enviar Ideia"</strong> para salvar apenas com texto
                        </p>
                      </div>
                      <div className="bg-[#0f1113] p-4 rounded-xl border border-[#9b5cff]/20">
                        <h5 className="text-[#9b5cff] font-semibold mb-2">✨ Adicionar desenho</h5>
                        <p className="text-gray-400 text-sm">
                          Clique em <strong>"Adicionar Detalhes Visuais"</strong> para desenhar ou ilustrar sua ideia
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#ff006e] to-[#00ff9a] flex items-center justify-center text-white text-xl font-bold">
                      3
                    </div>
                    <h4 className="text-xl text-white">Use o quadro branco (opcional)</h4>
                  </div>
                  <div className="ml-15 pl-3 border-l-2 border-[#ff006e]/30 space-y-2">
                    <p className="text-gray-300">Ferramentas disponíveis:</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div className="flex items-center gap-2 text-gray-400">
                        <div className="w-8 h-8 rounded bg-[#00b0ff]/20 flex items-center justify-center">✏️</div>
                        <span>Caneta (P)</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <div className="w-8 h-8 rounded bg-[#00b0ff]/20 flex items-center justify-center">🧹</div>
                        <span>Borracha (E)</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <div className="w-8 h-8 rounded bg-[#00b0ff]/20 flex items-center justify-center">📝</div>
                        <span>Texto (T)</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <div className="w-8 h-8 rounded bg-[#00b0ff]/20 flex items-center justify-center">⬜</div>
                        <span>Retângulo (R)</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <div className="w-8 h-8 rounded bg-[#00b0ff]/20 flex items-center justify-center">⭕</div>
                        <span>Círculo (C)</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <div className="w-8 h-8 rounded bg-[#00b0ff]/20 flex items-center justify-center">↩️</div>
                        <span>Ctrl+Z / Y</span>
                      </div>
                    </div>
                    <p className="text-gray-400 text-sm mt-3">
                      💡 <strong className="text-white">Dica:</strong> Use 7 cores neon e 4 tamanhos de traço para criar desenhos incríveis!
                    </p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#00ff9a] to-[#00b0ff] flex items-center justify-center text-white text-xl font-bold">
                      4
                    </div>
                    <h4 className="text-xl text-white">Identifique-se</h4>
                  </div>
                  <div className="ml-15 pl-3 border-l-2 border-[#00ff9a]/30">
                    <p className="text-gray-300 mb-2">
                      Antes de enviar, informe seu <strong className="text-white">nome</strong> e <strong className="text-white">e-mail</strong>
                    </p>
                    <p className="text-gray-400 text-sm">
                      Isso nos ajuda a creditar sua ideia e entrar em contato se necessário.
                    </p>
                  </div>
                </div>

                {/* Step 5 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white text-xl font-bold">
                      5
                    </div>
                    <h4 className="text-xl text-white">Gerencie no Parkinho</h4>
                  </div>
                  <div className="ml-15 pl-3 border-l-2 border-purple-500/30 space-y-2">
                    <p className="text-gray-300">
                      Todas as ideias ficam salvas no <span className="text-purple-400">🎪 Parkinho</span>
                    </p>
                    <ul className="list-disc list-inside text-gray-400 space-y-1 ml-4">
                      <li>Visualize todas as suas ideias em cards coloridos</li>
                      <li><strong className="text-white">Edite</strong> título, descrição e informações</li>
                      <li><strong className="text-white">Delete</strong> ideias que não precisa mais</li>
                      <li>Veja detalhes completos ao clicar em uma ideia</li>
                    </ul>
                  </div>
                </div>

                {/* Tips */}
                <div className="bg-gradient-to-r from-[#00b0ff]/10 to-[#9b5cff]/10 rounded-xl p-6 border border-[#00b0ff]/20">
                  <h4 className="text-lg text-white mb-3 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#00ff9a]" />
                    Dicas para boas ideias
                  </h4>
                  <ul className="space-y-2 text-gray-300 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-[#00b0ff] mt-0.5">✓</span>
                      <span>Seja específico: quanto mais detalhes, melhor!</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#9b5cff] mt-0.5">✓</span>
                      <span>Use o desenho para ilustrar conceitos complexos</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#00ff9a] mt-0.5">✓</span>
                      <span>Pense no problema que sua ideia resolve</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#ff006e] mt-0.5">✓</span>
                      <span>Não tenha medo de ser criativo e pensar fora da caixa!</span>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                            <ArrowRight className="w-5 h-5" />
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
                  <p className="text-gray-400">Sua ideia foi salva no Parkinho</p>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}