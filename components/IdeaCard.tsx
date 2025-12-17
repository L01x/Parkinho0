import React from 'react';
import { Idea } from '../types';
import { Star, Clock, Edit2, GripVertical, ArrowRightCircle, Eye } from 'lucide-react';

interface IdeaCardProps {
  idea: Idea;
  onFavorite?: (idea: Idea) => void;
  onEdit?: (idea: Idea) => void;
  onMoveToBacklog?: (idea: Idea) => void;
  onViewImage?: (idea: Idea) => void;
  isDraggable?: boolean;
  onDragStart?: (e: React.DragEvent, id: string) => void;
  onDrop?: (e: React.DragEvent, id: string) => void;
  folderName?: string;
}

const statusColors = {
  draft: 'text-gray-400 border-gray-400',
  parkinho: 'text-neon-purple border-neon-purple',
  backlog: 'text-neon-pink border-neon-pink',
  analyzing: 'text-neon-yellow border-neon-yellow',
  approved: 'text-green-500 border-green-500',
  rejected: 'text-red-500 border-red-500',
};

const statusLabels = {
  draft: 'Rascunho',
  parkinho: 'No Parkinho',
  backlog: 'Backlog',
  analyzing: 'Em Análise',
  approved: 'Aprovado',
  rejected: 'Recusado',
};

export const IdeaCard: React.FC<IdeaCardProps> = ({ 
  idea, 
  onFavorite, 
  onEdit, 
  onMoveToBacklog,
  onViewImage,
  isDraggable, 
  onDragStart, 
  onDrop,
  folderName
}) => {
  return (
    <div 
      draggable={isDraggable}
      onDragStart={(e) => onDragStart && idea.__backendId && onDragStart(e, idea.__backendId)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => onDrop && idea.__backendId && onDrop(e, idea.__backendId)}
      className={`bg-bg-secondary border-2 border-border rounded-xl p-4 transition-all group flex flex-col h-[360px] relative ${isDraggable ? 'cursor-move hover:border-neon-blue' : 'hover:border-neon-purple'}`}
    >
      {/* Drag Handle Overlay */}
      {isDraggable && (
        <div className="absolute top-2 left-2 text-gray-600 opacity-50 group-hover:opacity-100 z-10 cursor-move">
          <GripVertical size={20} />
        </div>
      )}

      {/* Image Container - Increased height slightly */}
      <div className="relative h-40 w-full bg-bg-tertiary rounded-lg mb-3 overflow-hidden border border-border shrink-0 group/image">
        {idea.idea_thumbnail_data ? (
          <>
            <img src={idea.idea_thumbnail_data} alt={idea.idea_name} className="w-full h-full object-cover" />
            
            {/* Overlay with View Button */}
            {onViewImage && (
                <div 
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center justify-center cursor-pointer z-10"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onViewImage(idea); }}
                >
                    <button className="bg-black/60 text-white px-3 py-1.5 rounded-full hover:bg-neon-blue hover:scale-110 transition-all flex items-center gap-2 text-xs font-bold border border-white/20">
                        <Eye size={16} /> Visualizar
                    </button>
                </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">Sem imagem</div>
        )}
        
        {/* Status Badge */}
        <div className={`absolute bottom-2 right-2 px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-black/80 border z-20 ${statusColors[idea.idea_status] || statusColors.draft}`}>
          {statusLabels[idea.idea_status] || idea.idea_status}
        </div>
      </div>
      
      <div className="flex justify-between items-start mb-2 gap-2">
        <h3 className="font-bold text-white truncate text-sm" title={idea.idea_name}>{idea.idea_name}</h3>
        <div className="flex gap-1 shrink-0">
          {onEdit && (
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit(idea); }}
              className="text-gray-500 hover:text-white transition-colors p-1"
              title="Editar"
            >
              <Edit2 size={14} />
            </button>
          )}
          <button 
            onClick={(e) => { e.stopPropagation(); onFavorite && onFavorite(idea); }}
            className={`text-gray-500 hover:text-yellow-400 transition-colors p-1 ${idea.idea_is_favorite ? 'text-yellow-400' : ''}`}
          >
            <Star size={14} fill={idea.idea_is_favorite ? "currentColor" : "none"} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-1 overflow-hidden">
        <p className="text-xs text-gray-400">por <span className="text-neon-purple">{idea.idea_author}</span></p>
        
        {folderName && (
          <p className="text-[10px] text-gray-500 flex items-center gap-1">
             📁 {folderName}
          </p>
        )}

        <div className="flex flex-wrap gap-1 mt-auto content-start max-h-[40px] overflow-hidden">
          {idea.idea_tags && idea.idea_tags.split(',').filter(t => t.trim()).map((tag, i) => (
             <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-neon-blue/10 text-neon-blue border border-neon-blue/20">
               #{tag.trim()}
             </span>
           ))}
        </div>
      </div>

      {onMoveToBacklog && idea.idea_status === 'parkinho' && (
          <button 
            type="button"
            onClick={(e) => { 
                e.preventDefault(); 
                e.stopPropagation(); 
                onMoveToBacklog(idea); 
            }}
            className="mt-3 w-full py-2 bg-neon-pink/10 border border-neon-pink text-neon-pink rounded flex items-center justify-center gap-2 text-xs font-bold hover:bg-neon-pink hover:text-white transition-all z-20 cursor-pointer"
          >
              <ArrowRightCircle size={14} /> Trazer p/ Backlog
          </button>
      )}

      <div className="mt-2 pt-2 border-t border-border flex items-center justify-between text-[10px] text-gray-500">
        <div className="flex items-center gap-1">
          <Clock size={12} />
          {new Date(idea.idea_created_at).toLocaleDateString()}
        </div>
        {idea.idea_order > 0 && <span className="opacity-50">#{idea.idea_order}</span>}
      </div>
    </div>
  );
};
