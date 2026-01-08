import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Lightbulb, Edit2, Trash2, X, Check, User, Mail, FileText } from 'lucide-react';
import { Idea } from '../App';

interface ParkingLotProps {
  ideas: Idea[];
  onBack: () => void;
  onUpdateIdea: (id: string, updates: Partial<Idea>) => void;
  onDeleteIdea: (id: string) => void;
}

export function ParkingLot({ ideas, onBack, onUpdateIdea, onDeleteIdea }: ParkingLotProps) {
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<Partial<Idea>>({});

  const handleEdit = (idea: Idea) => {
    setSelectedIdea(idea);
    setEditMode(true);
    setEditData({
      title: idea.title,
      description: idea.description,
      userName: idea.userName,
      userEmail: idea.userEmail,
    });
  };

  const handleSaveEdit = async () => {
    if (!selectedIdea) return;
    
    await onUpdateIdea(selectedIdea.id, editData);
    setEditMode(false);
    setSelectedIdea(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta ideia?')) {
      await onDeleteIdea(id);
      if (selectedIdea?.id === id) {
        setSelectedIdea(null);
      }
    }
  };

  const getRandomFloat = (index: number) => {
    const positions = [
      { x: 0, y: 0, rotation: -2 },
      { x: 10, y: -5, rotation: 2 },
      { x: -8, y: 3, rotation: -1 },
      { x: 5, y: -8, rotation: 1.5 },
      { x: -5, y: 5, rotation: 1 },
      { x: 8, y: -3, rotation: -1.5 },
    ];
    return positions[index % positions.length];
  };

  return (
    <div className="min-h-screen bg-[#0b0b0d] relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-br from-[#00b0ff]/20 to-[#9b5cff]/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-br from-[#ff006e]/20 to-[#00ff9a]/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -50, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 12, repeat: Infinity }}
        />

        {/* Sparkles */}
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 3,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between mb-12"
        >
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-6 py-3 bg-gray-800/50 backdrop-blur-sm border-2 border-gray-700 text-gray-300 rounded-xl hover:bg-gray-700/50 transition-all duration-300 hover:scale-105"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar
          </button>

          <div className="text-center flex-1">
            <motion.h1
              className="text-4xl md:text-5xl font-bold text-white neon-text mb-2"
            >
              🎪 Parkinho de Ideias
            </motion.h1>
            <p className="text-gray-400">
              {ideas.length} {ideas.length === 1 ? 'ideia salva' : 'ideias salvas'}
            </p>
          </div>

          <div className="w-32"></div>
        </motion.div>

        {/* Ideas Grid */}
        {ideas.length === 0 ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center justify-center min-h-[60vh]"
          >
            <div className="bg-[#1a1a1d]/90 backdrop-blur-sm rounded-3xl p-16 border-2 border-[#00b0ff]/20 text-center">
              <motion.div
                animate={{ y: [0, -15, 0], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Lightbulb className="w-24 h-24 text-[#00ff9a] mx-auto mb-6 drop-shadow-[0_0_30px_rgba(0,255,154,0.6)]" />
              </motion.div>
              <h2 className="text-2xl text-white mb-3">Nenhuma ideia ainda</h2>
              <p className="text-gray-400 text-lg">
                Crie sua primeira ideia e ela aparecerá aqui!
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-12">
            {ideas.map((idea, index) => {
              const floatPos = getRandomFloat(index);
              return (
                <motion.div
                  key={idea.id}
                  initial={{ opacity: 0, scale: 0.5, y: 100 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    y: 0,
                  }}
                  transition={{
                    duration: 0.6,
                    delay: index * 0.1,
                    type: "spring",
                    bounce: 0.4,
                  }}
                  whileHover={{ scale: 1.05, y: -10 }}
                  className="group relative cursor-pointer"
                  style={{
                    animation: `float ${4 + (index % 3)}s ease-in-out infinite`,
                    animationDelay: `${index * 0.3}s`,
                  }}
                  onClick={() => setSelectedIdea(idea)}
                >
                  <div className="bg-gradient-to-br from-[#1a1a1d] to-[#252529] rounded-2xl shadow-2xl p-6 border-2 border-[#00b0ff]/20 hover:border-[#00b0ff]/60 transition-all duration-300 backdrop-blur-sm">
                    {/* Preview */}
                    {idea.drawing && (
                      <div className="aspect-square rounded-xl overflow-hidden mb-4 bg-white shadow-lg ring-2 ring-[#00b0ff]/20">
                        <img
                          src={idea.drawing}
                          alt={idea.title}
                          className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                    )}

                    {/* Title */}
                    <div className="flex items-start gap-2 mb-3">
                      <Lightbulb className="w-5 h-5 text-[#00ff9a] flex-shrink-0 mt-0.5 drop-shadow-[0_0_8px_rgba(0,255,154,0.8)]" />
                      <h3 className="text-white line-clamp-2 group-hover:text-[#00b0ff] transition-colors">
                        {idea.title}
                      </h3>
                    </div>

                    {/* User Info */}
                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                      <User className="w-4 h-4" />
                      <span className="truncate">{idea.userName}</span>
                    </div>

                    {/* Date */}
                    <p className="text-gray-500 text-xs">
                      {new Date(idea.createdAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>

                    {/* Glow Effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#00b0ff]/0 via-[#9b5cff]/0 to-[#ff006e]/0 group-hover:from-[#00b0ff]/10 group-hover:via-[#9b5cff]/10 group-hover:to-[#ff006e]/10 rounded-2xl blur-xl -z-10 transition-all duration-500" />

                    {/* Sparkle */}
                    <motion.div
                      className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100"
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <span className="text-2xl drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">✨</span>
                    </motion.div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Idea Detail Modal */}
      <AnimatePresence>
        {selectedIdea && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
            onClick={() => {
              setSelectedIdea(null);
              setEditMode(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-4xl bg-[#1a1a1d] rounded-2xl overflow-hidden border-2 border-[#00b0ff]/30 shadow-2xl"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-800">
                <h3 className="text-2xl font-bold text-white neon-text">
                  {editMode ? 'Editar Ideia' : 'Detalhes da Ideia'}
                </h3>
                <div className="flex gap-2">
                  {!editMode && (
                    <>
                      <button
                        onClick={() => handleEdit(selectedIdea)}
                        className="p-2 bg-[#00b0ff]/20 text-[#00b0ff] rounded-lg hover:bg-[#00b0ff]/30 transition-all"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(selectedIdea.id)}
                        className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => {
                      setSelectedIdea(null);
                      setEditMode(false);
                    }}
                    className="p-2 bg-gray-800 text-gray-400 rounded-lg hover:bg-gray-700 transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 max-h-[70vh] overflow-y-auto">
                {editMode ? (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-gray-400 mb-2">Título</label>
                      <input
                        type="text"
                        value={editData.title || ''}
                        onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-900/50 border-2 border-[#00b0ff]/30 rounded-xl text-white focus:border-[#00b0ff] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-400 mb-2">Descrição</label>
                      <textarea
                        value={editData.description || ''}
                        onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-3 bg-gray-900/50 border-2 border-[#00b0ff]/30 rounded-xl text-white focus:border-[#00b0ff] focus:outline-none resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-400 mb-2">Nome</label>
                        <input
                          type="text"
                          value={editData.userName || ''}
                          onChange={(e) => setEditData({ ...editData, userName: e.target.value })}
                          className="w-full px-4 py-3 bg-gray-900/50 border-2 border-[#00b0ff]/30 rounded-xl text-white focus:border-[#00b0ff] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-gray-400 mb-2">Email</label>
                        <input
                          type="email"
                          value={editData.userEmail || ''}
                          onChange={(e) => setEditData({ ...editData, userEmail: e.target.value })}
                          className="w-full px-4 py-3 bg-gray-900/50 border-2 border-[#00b0ff]/30 rounded-xl text-white focus:border-[#00b0ff] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setEditMode(false)}
                        className="flex-1 px-6 py-3 bg-gray-800 text-gray-300 rounded-xl hover:bg-gray-700 transition-all"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-[#00b0ff] to-[#9b5cff] text-white rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2"
                      >
                        <Check className="w-5 h-5" />
                        Salvar Alterações
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Drawing */}
                    {selectedIdea.drawing && (
                      <div className="bg-white rounded-xl p-4 shadow-lg">
                        <img
                          src={selectedIdea.drawing}
                          alt={selectedIdea.title}
                          className="w-full h-auto max-h-96 object-contain mx-auto"
                        />
                      </div>
                    )}

                    {/* Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center gap-2 text-gray-400 mb-2">
                            <FileText className="w-4 h-4" />
                            <span className="text-sm">Título</span>
                          </div>
                          <p className="text-white text-lg">{selectedIdea.title}</p>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 text-gray-400 mb-2">
                            <FileText className="w-4 h-4" />
                            <span className="text-sm">Descrição</span>
                          </div>
                          <p className="text-gray-300">{selectedIdea.description}</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center gap-2 text-gray-400 mb-2">
                            <User className="w-4 h-4" />
                            <span className="text-sm">Criado por</span>
                          </div>
                          <p className="text-white">{selectedIdea.userName}</p>
                          <p className="text-gray-400 text-sm">{selectedIdea.userEmail}</p>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 text-gray-400 mb-2">
                            <span className="text-sm">Data de criação</span>
                          </div>
                          <p className="text-gray-300">
                            {new Date(selectedIdea.createdAt).toLocaleString('pt-BR')}
                          </p>
                        </div>

                        {selectedIdea.notionId && (
                          <div>
                            <div className="flex items-center gap-2 text-gray-400 mb-2">
                              <span className="text-sm">Status</span>
                            </div>
                            <div className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-[#00b0ff]/20 to-[#9b5cff]/20 rounded-lg border border-[#00b0ff]/30">
                              <div className="w-2 h-2 bg-[#00ff9a] rounded-full animate-pulse" />
                              <span className="text-[#00b0ff]">Sincronizado com Notion</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          25% { transform: translateY(-12px); }
          50% { transform: translateY(-5px); }
          75% { transform: translateY(-15px); }
        }
      `}</style>
    </div>
  );
}