import React, { useState, useEffect } from 'react';
import CanvasBoard from './components/CanvasBoard';
import { Modal } from './components/Modal';
import { IdeaCard } from './components/IdeaCard';
import { Toast, ToastType } from './components/Toast';
import { Idea, Shape, Folder, IdeaStatus } from './types';
import { saveIdea, initDataSdk, updateIdea } from './services/sdk';
import { FolderPlus, MonitorPlay, List, PenTool, LayoutGrid, Layers, MessageCircle } from 'lucide-react';

const App = () => {
  const [view, setView] = useState<'landing' | 'canvas' | 'parkinho' | 'backlog'>('landing');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [clearCanvasTrigger, setClearCanvasTrigger] = useState(0);
  
  // Modals
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewImageModalOpen, setViewImageModalOpen] = useState(false);
  
  // Toast
  const [toast, setToast] = useState<{msg: string, type: ToastType} | null>(null);
  
  // Data
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  
  // Create Idea State
  const [currentShapes, setCurrentShapes] = useState<Shape[]>([]);
  const [currentThumbnail, setCurrentThumbnail] = useState<string>('');
  const [formTitle, setFormTitle] = useState('');
  const [formAuthor, setFormAuthor] = useState('');
  
  // Edit/View Idea State
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null);
  const [viewingIdea, setViewingIdea] = useState<Idea | null>(null);

  // Filters
  const [selectedFolder, setSelectedFolder] = useState<string>('all');

  useEffect(() => {
    initDataSdk((data) => {
        const loadedIdeas = data.filter((item: any) => item.idea_name);
        const loadedFolders = data.filter((item: any) => item.folder_name);
        
        // Sort ideas by order for backlog
        const sortedIdeas = loadedIdeas.sort((a: Idea, b: Idea) => (a.idea_order || 0) - (b.idea_order || 0));
        
        setIdeas(sortedIdeas);
        setFolders(loadedFolders);
    });
  }, []);

  const showToast = (msg: string, type: ToastType) => {
      setToast({ msg, type });
  };

  // --- Actions ---

  const handleOpenSave = (shapes: Shape[], thumb: string) => {
      if (shapes.length === 0) return showToast("Desenhe algo primeiro!", 'error');
      setCurrentShapes(shapes);
      setCurrentThumbnail(thumb);
      setSaveModalOpen(true);
  };

  const handleOpenParkinhoSubmit = (shapes: Shape[], thumb: string) => {
      if (shapes.length === 0) return showToast("Desenhe algo primeiro!", 'error');
      setCurrentShapes(shapes);
      setCurrentThumbnail(thumb);
      setSubmitModalOpen(true);
  };

  const handleCreateFolder = async () => {
      const name = prompt("Nome da nova pasta:");
      if (!name) return;
      
      const newFolder: Folder = {
          folder_name: name,
          folder_created_at: new Date().toISOString()
      };
      
      const res = await window.dataSdk.create(newFolder);
      if(!res.isOk) {
          showToast('Erro ao criar pasta', 'error');
      } else {
          showToast('Pasta criada com sucesso!', 'success');
      }
  };

  const executeSave = async (targetStatus: IdeaStatus) => {
    try {
      if (!formAuthor?.trim() || !formTitle?.trim()) {
        return showToast("Preencha título e autor", 'error');
      }

      const newIdea: Partial<Idea> = {
          idea_name: formTitle.trim(),
          idea_author: formAuthor.trim(),
          idea_status: targetStatus,
          idea_drawing_data: JSON.stringify(currentShapes),
          idea_thumbnail_data: currentThumbnail,
          idea_created_at: new Date().toISOString(),
          idea_is_favorite: false,
          idea_order: 0,
          idea_tags: '',
          idea_folder_id: '' 
      };

      const result = await saveIdea(newIdea);
      
      if (result.isOk) {
          // Fetch fresh data or update local state
          setIdeas(prev => [...prev, result.data]);
          
          setSaveModalOpen(false);
          setSubmitModalOpen(false);
          setFormTitle('');
          setFormAuthor('');
          setCurrentShapes([]);
          setCurrentThumbnail('');
          
          if (targetStatus === 'parkinho') {
              // Clear canvas
              showToast('Ideia enviada para o Parkinho!', 'success');
              setClearCanvasTrigger(prev => prev + 1);
          } else {
              showToast('Rascunho salvo!', 'success');
          }
      } else {
          showToast("Erro ao salvar: " + (result.error?.message || "Erro desconhecido"), 'error');
      }
    } catch (err) {
        showToast("Erro inesperado ao salvar.", 'error');
    }
  };

  const moveToBacklog = async (idea: Idea) => {
      try {
          const maxOrder = ideas.filter(i => ['backlog', 'analyzing', 'approved', 'rejected'].includes(i.idea_status)).reduce((max, i) => Math.max(max, i.idea_order || 0), 0);
          
          const updatedIdea = {
              ...idea,
              idea_status: 'backlog' as IdeaStatus,
              idea_order: maxOrder + 1
          };
          
          const res = await updateIdea(updatedIdea);

          if (res.isOk) {
              setIdeas(prev => prev.map(i => i.__backendId === idea.__backendId ? updatedIdea : i));
              showToast(`"${idea.idea_name}" movido para o Backlog!`, 'success');
          } else {
              showToast('Erro ao mover ideia.', 'error');
          }
      } catch (err) {
          showToast('Erro ao processar movimento.', 'error');
      }
  };

  // --- Drag and Drop Logic ---

  const handleDragStart = (e: React.DragEvent, id: string) => {
      e.dataTransfer.setData('text/plain', id);
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
      e.preventDefault();
      try {
          const draggedId = e.dataTransfer.getData('text/plain');
          if (draggedId === targetId) return;

          const items = [...ideas];
          const draggedIndex = items.findIndex(i => i.__backendId === draggedId);
          const targetIndex = items.findIndex(i => i.__backendId === targetId);
          
          if (draggedIndex === -1 || targetIndex === -1) return;

          // Reorder locally first for UI
          const [removed] = items.splice(draggedIndex, 1);
          items.splice(targetIndex, 0, removed);
          
          // Update orders
          const updates = items.map((item, index) => ({
              ...item,
              idea_order: index
          }));

          // Optimistic update
          setIdeas(updates);

          let hasError = false;
          for (const item of updates) {
              const res = await updateIdea(item);
              if (!res.isOk) hasError = true;
          }
          
          if (hasError) {
              showToast('Erro ao reordenar algumas ideias.', 'error');
          }
      } catch (err) {
          showToast('Erro ao processar reordenação.', 'error');
      }
  };

  // --- Edit/View Logic ---

  const openEditModal = (idea: Idea) => {
      setEditingIdea({ ...idea });
      setEditModalOpen(true);
  };

  const openViewImageModal = (idea: Idea) => {
      setViewingIdea(idea);
      setViewImageModalOpen(true);
  };

  const saveEdit = async () => {
      try {
          if (!editingIdea) return;
          if (!editingIdea.idea_name?.trim() || !editingIdea.idea_author?.trim()) {
              return showToast('Título e autor são obrigatórios.', 'error');
          }
          const res = await updateIdea(editingIdea);
          if (res.isOk) {
              setIdeas(prev => prev.map(i => i.__backendId === editingIdea.__backendId ? editingIdea : i));
              showToast('Ideia atualizada!', 'success');
              setEditModalOpen(false);
              setEditingIdea(null);
          } else {
              showToast('Erro ao atualizar: ' + (res.error?.message || 'erro desconhecido'), 'error');
          }
      } catch (err) {
          showToast('Erro ao processar atualização.', 'error');
      }
  };

  // --- Views Filtering ---

  // Parkinho: Shows 'parkinho' status. It's a "holding area".
  const parkinhoIdeas = ideas.filter(i => i.idea_status === 'parkinho'); 
  
  // Backlog: Shows backlog, analyzing, approved, rejected (Management items)
  const backlogIdeas = ideas.filter(i => ['backlog', 'analyzing', 'approved', 'rejected'].includes(i.idea_status));
  
  const filteredBacklog = selectedFolder === 'all' 
    ? backlogIdeas 
    : backlogIdeas.filter(i => i.idea_folder_id === selectedFolder);

  return (
    <div className="h-full w-full flex flex-col font-sans bg-bg-primary text-white selection:bg-neon-pink/30 relative">
      
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Top Navigation - Hides when Fullscreen OR on Landing Page */}
      {!isFullscreen && view !== 'landing' && (
        <header className="flex-none p-4 border-b border-border bg-bg-secondary flex justify-between items-center shadow-lg z-10 animate-in slide-in-from-top-2">
            <div className="cursor-pointer" onClick={() => setView('landing')}>
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-neon-blue to-neon-purple neon-text" style={{ textShadow: '0 0 20px rgba(59,130,246,0.5)' }}>
                    Desenhe sua Ideia!
                </h1>
            </div>
            
            <div className="flex gap-2">
                <button 
                    onClick={() => setView('canvas')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${view === 'canvas' ? 'bg-bg-tertiary text-neon-blue border border-neon-blue shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'text-gray-400 hover:text-white'}`}
                >
                    Quadro
                </button>
                <button 
                    onClick={() => setView('parkinho')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${view === 'parkinho' ? 'bg-bg-tertiary text-neon-purple border border-neon-purple shadow-[0_0_15px_rgba(139,92,246,0.2)]' : 'text-gray-400 hover:text-white'}`}
                >
                    Parkinho
                </button>
                <button 
                    onClick={() => setView('backlog')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${view === 'backlog' ? 'bg-bg-tertiary text-neon-pink border border-neon-pink shadow-[0_0_15px_rgba(236,72,153,0.2)]' : 'text-gray-400 hover:text-white'}`}
                >
                    Backlog
                </button>
            </div>
        </header>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative bg-[#0a0a0f]">
        
        {view === 'landing' && (
            <div className="flex flex-col items-center justify-center h-full w-full bg-[#0a0a0f] text-center p-8 animate-in fade-in zoom-in duration-500 relative overflow-hidden">
               {/* Background Glows */}
               <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-neon-blue/20 rounded-full blur-[120px] pointer-events-none"></div>
               <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-neon-pink/10 rounded-full blur-[120px] pointer-events-none"></div>

               <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tighter leading-tight">
                 <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6]">Compartilhe</span><br />
                 <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#8b5cf6] to-[#ec4899]">sua ideia</span>
               </h1>
               
               <p className="text-xl md:text-2xl text-gray-400 mb-16 max-w-2xl font-light">
                 Toda grande ideia começa aqui. Transforme ideias em ações.
               </p>
               
               <div className="flex flex-wrap gap-6 justify-center w-full max-w-4xl z-10">
                  <button 
                    onClick={() => setView('canvas')}
                    className="flex items-center gap-3 px-8 py-4 bg-[#00a3bf] hover:bg-[#008ba3] text-white rounded-lg font-bold text-lg shadow-[0_0_30px_rgba(0,163,191,0.4)] transition-all hover:scale-105 active:scale-95"
                  >
                    <PenTool size={24} /> Criar Nova Ideia
                  </button>
                  
                  <button 
                    onClick={() => setView('parkinho')}
                    className="flex items-center gap-3 px-8 py-4 bg-transparent border-2 border-neon-pink text-neon-pink hover:bg-neon-pink/10 rounded-lg font-bold text-lg shadow-[0_0_20px_rgba(236,72,153,0.2)] transition-all hover:scale-105 active:scale-95"
                  >
                    <LayoutGrid size={24} /> Explorar Parkinho
                  </button>
                  
                  <button 
                    onClick={() => setView('backlog')}
                    className="flex items-center gap-3 px-8 py-4 bg-transparent border-2 border-[#6d28d9] text-[#a78bfa] hover:bg-[#6d28d9]/20 rounded-lg font-bold text-lg shadow-[0_0_20px_rgba(109,40,217,0.2)] transition-all hover:scale-105 active:scale-95"
                  >
                    <Layers size={24} /> Ver Backlog
                  </button>
               </div>

               <div className="absolute bottom-8 right-8 text-gray-600 hover:text-white transition-colors cursor-pointer">
                    <MessageCircle size={32} />
               </div>
            </div>
        )}

        {view === 'canvas' && (
            <div className={`w-full h-full transition-all duration-300 ${isFullscreen ? '' : 'p-4 pl-8 pb-8 flex items-end justify-start'}`}>
                <div className={`w-full h-full overflow-hidden transition-all duration-300 bg-bg-primary ${isFullscreen ? '' : 'rounded-2xl border border-[#27272a] shadow-2xl ring-1 ring-white/5'}`}>
                    <CanvasBoard 
                        onSave={handleOpenSave}
                        onSendToParkinho={handleOpenParkinhoSubmit}
                        backlogIdeas={backlogIdeas}
                        isFullscreen={isFullscreen}
                        onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
                        clearTrigger={clearCanvasTrigger}
                    />
                </div>
            </div>
        )}
        
        {view === 'parkinho' && (
            <div className="h-full overflow-y-auto p-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-3xl font-bold mb-2 text-neon-purple neon-text">🅿️ Parkinho</h2>
                            <p className="text-gray-400">Ideias aguardando triagem. Clique na imagem para expandir.</p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setView('canvas')} className="flex items-center gap-2 px-4 py-2 bg-bg-tertiary text-neon-blue border border-neon-blue rounded-lg hover:bg-neon-blue/10 transition-all font-bold">
                                <MonitorPlay size={16} /> Voltar p/ Quadro
                            </button>
                            <button onClick={() => setView('backlog')} className="flex items-center gap-2 px-4 py-2 bg-bg-tertiary text-neon-pink border border-neon-pink rounded-lg hover:bg-neon-pink/10 transition-all font-bold">
                                <List size={16} /> Ir p/ Backlog
                            </button>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                        {parkinhoIdeas.length === 0 ? <p className="text-gray-500 col-span-full text-center py-20 border-2 border-dashed border-border rounded-xl">Nenhuma ideia nova no parkinho.</p> : null}
                        {parkinhoIdeas.map(idea => (
                            <IdeaCard 
                                key={idea.__backendId} 
                                idea={idea} 
                                onMoveToBacklog={moveToBacklog}
                                onViewImage={openViewImageModal}
                                onFavorite={async (i) => {
                                    const res = await updateIdea({...i, idea_is_favorite: !i.idea_is_favorite});
                                    if (res.isOk) {
                                        setIdeas(prev => prev.map(idea => idea.__backendId === i.__backendId ? {...i, idea_is_favorite: !i.idea_is_favorite} : idea));
                                    }
                                }}
                                folderName={folders.find(f => f.__backendId === idea.idea_folder_id)?.folder_name}
                            />
                        ))}
                    </div>
                </div>
            </div>
        )}

        {view === 'backlog' && (
             <div className="h-full flex overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                {/* Sidebar Filters */}
                <aside className="w-64 bg-bg-secondary border-r border-border p-4 flex flex-col gap-4">
                    <button onClick={handleCreateFolder} className="w-full py-2 bg-neon-blue/10 border border-neon-blue text-neon-blue rounded-lg hover:bg-neon-blue/20 flex items-center justify-center gap-2">
                        <FolderPlus size={16} /> Nova Pasta
                    </button>
                    
                    <div className="flex-1 overflow-y-auto">
                        <div 
                            className={`p-2 rounded cursor-pointer mb-1 ${selectedFolder === 'all' ? 'bg-bg-tertiary text-white font-bold border-l-2 border-neon-pink' : 'text-gray-400 hover:bg-bg-tertiary'}`}
                            onClick={() => setSelectedFolder('all')}
                        >
                            Todas as Ideias
                        </div>
                        {folders.map(f => (
                             <div 
                                key={f.__backendId}
                                className={`p-2 rounded cursor-pointer mb-1 truncate ${selectedFolder === f.__backendId ? 'bg-bg-tertiary text-white font-bold border-l-2 border-neon-pink' : 'text-gray-400 hover:bg-bg-tertiary'}`}
                                onClick={() => setSelectedFolder(f.__backendId!)}
                            >
                                📁 {f.folder_name}
                            </div>
                        ))}
                    </div>
                </aside>

                {/* List Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-6xl mx-auto">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-3xl font-bold text-neon-pink neon-text">Backlog e Produção</h2>
                                <p className="text-gray-500 text-sm mt-1">{filteredBacklog.length} itens • Arraste para reordenar</p>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
                            {filteredBacklog.length === 0 ? <p className="text-gray-500 col-span-full text-center py-20">Esta pasta está vazia.</p> : null}
                            {filteredBacklog.map(idea => (
                                <IdeaCard 
                                    key={idea.__backendId} 
                                    idea={idea} 
                                    isDraggable={true}
                                    onDragStart={handleDragStart}
                                    onDrop={handleDrop}
                                    onEdit={openEditModal}
                                    onViewImage={openViewImageModal}
                                    folderName={folders.find(f => f.__backendId === idea.idea_folder_id)?.folder_name}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )}
      </main>

      {/* --- MODALS --- */}

      {/* View Image Modal */}
      <Modal isOpen={viewImageModalOpen} onClose={() => setViewImageModalOpen(false)} title={viewingIdea?.idea_name || "Visualizar Ideia"} maxWidth="max-w-4xl">
         {viewingIdea && (
             <div className="flex flex-col items-center">
                 <div className="w-full bg-white/5 rounded-lg p-2 border border-border">
                    <img src={viewingIdea.idea_thumbnail_data} alt={viewingIdea.idea_name} className="w-full h-auto object-contain rounded" />
                 </div>
                 <div className="mt-4 w-full flex justify-between text-sm text-gray-400 border-t border-border pt-4">
                     <span>Autor: <span className="text-white">{viewingIdea.idea_author}</span></span>
                     <span>Criado em: {new Date(viewingIdea.idea_created_at).toLocaleDateString()}</span>
                 </div>
             </div>
         )}
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Editar Ideia">
         {editingIdea && (
             <div className="space-y-4">
                 <div>
                    <label className="text-xs text-gray-500">Título</label>
                    <input 
                        value={editingIdea.idea_name} 
                        onChange={e => setEditingIdea({...editingIdea, idea_name: e.target.value})}
                        className="w-full bg-bg-tertiary border border-border rounded p-2 text-white"
                    />
                 </div>
                 <div>
                    <label className="text-xs text-gray-500">Autor</label>
                    <input 
                        value={editingIdea.idea_author} 
                        onChange={e => setEditingIdea({...editingIdea, idea_author: e.target.value})}
                        className="w-full bg-bg-tertiary border border-border rounded p-2 text-white"
                    />
                 </div>
                 <div>
                    <label className="text-xs text-gray-500">Status</label>
                    <select 
                        value={editingIdea.idea_status} 
                        onChange={e => setEditingIdea({...editingIdea, idea_status: e.target.value as IdeaStatus})}
                        className="w-full bg-bg-tertiary border border-border rounded p-2 text-white"
                    >
                        <option value="draft">Rascunho</option>
                        <option value="parkinho">Parkinho (Triagem)</option>
                        <option value="backlog">Backlog</option>
                        <option value="analyzing">Em Análise</option>
                        <option value="approved">Aprovado</option>
                        <option value="rejected">Recusado</option>
                    </select>
                 </div>
                 <div>
                    <label className="text-xs text-gray-500">Pasta</label>
                    <select 
                        value={editingIdea.idea_folder_id || ''} 
                        onChange={e => setEditingIdea({...editingIdea, idea_folder_id: e.target.value})}
                        className="w-full bg-bg-tertiary border border-border rounded p-2 text-white"
                    >
                        <option value="">Sem Pasta</option>
                        {folders.map(f => (
                            <option key={f.__backendId} value={f.__backendId}>{f.folder_name}</option>
                        ))}
                    </select>
                 </div>
                 <div>
                    <label className="text-xs text-gray-500">Tags (separadas por vírgula)</label>
                    <input 
                        value={editingIdea.idea_tags || ''} 
                        onChange={e => setEditingIdea({...editingIdea, idea_tags: e.target.value})}
                        className="w-full bg-bg-tertiary border border-border rounded p-2 text-white"
                    />
                 </div>
                 <div className="flex justify-end gap-2 pt-4">
                     <button onClick={() => setEditModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white">Cancelar</button>
                     <button onClick={saveEdit} className="px-4 py-2 bg-neon-blue text-white rounded font-bold shadow-lg shadow-neon-blue/20">Salvar Alterações</button>
                 </div>
             </div>
         )}
      </Modal>

      {/* Save Draft Modal */}
      <Modal isOpen={saveModalOpen} onClose={() => setSaveModalOpen(false)} title="Salvar Rascunho">
        <div className="space-y-4">
            <div>
                <label className="block text-sm text-gray-400 mb-1">Título</label>
                <input 
                    value={formTitle}
                    onChange={e => setFormTitle(e.target.value)}
                    className="w-full bg-bg-tertiary border border-border rounded p-2 text-white focus:border-neon-blue focus:outline-none"
                />
            </div>
            <div>
                <label className="block text-sm text-gray-400 mb-1">Autor</label>
                <input 
                    value={formAuthor}
                    onChange={e => setFormAuthor(e.target.value)}
                    className="w-full bg-bg-tertiary border border-border rounded p-2 text-white focus:border-neon-blue focus:outline-none"
                />
            </div>
            <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setSaveModalOpen(false)} className="px-4 py-2 rounded text-gray-400 hover:text-white">Cancelar</button>
                <button onClick={() => executeSave('draft')} className="px-6 py-2 bg-neon-blue/10 text-neon-blue border border-neon-blue rounded hover:bg-neon-blue hover:text-white transition-all font-bold">Salvar</button>
            </div>
        </div>
      </Modal>

      {/* Submit Parkinho Modal */}
      <Modal isOpen={submitModalOpen} onClose={() => setSubmitModalOpen(false)} title="Enviar p/ Parkinho">
        <div className="space-y-4">
             <p className="text-sm text-gray-400">Sua ideia ficará visível para todos na aba Parkinho.</p>
            <div>
                <label className="block text-sm text-gray-400 mb-1">Título da Ideia</label>
                <input 
                    value={formTitle}
                    onChange={e => setFormTitle(e.target.value)}
                    className="w-full bg-bg-tertiary border border-border rounded p-2 text-white focus:border-neon-purple focus:outline-none"
                />
            </div>
            <div>
                <label className="block text-sm text-gray-400 mb-1">Seu Nome</label>
                <input 
                    value={formAuthor}
                    onChange={e => setFormAuthor(e.target.value)}
                    className="w-full bg-bg-tertiary border border-border rounded p-2 text-white focus:border-neon-purple focus:outline-none"
                />
            </div>
            <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setSubmitModalOpen(false)} className="px-4 py-2 rounded text-gray-400 hover:text-white">Cancelar</button>
                <button onClick={() => executeSave('parkinho')} className="px-6 py-2 bg-neon-purple/10 text-neon-purple border border-neon-purple rounded hover:bg-neon-purple hover:text-white transition-all font-bold">Enviar</button>
            </div>
        </div>
      </Modal>

    </div>
  );
};

export default App;
