import { useState } from 'react';
import { HomePage } from './components/home-page';
import { DrawingBoard } from './components/drawing-board';
import { ParkingLot } from './components/parking-lot';

export interface Idea {
  id: string;
  title: string;
  description: string;
  drawing?: string; // Now optional
  userName: string;
  userEmail: string;
  createdAt: Date;
}

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'drawing' | 'parking'>('home');
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [currentIdea, setCurrentIdea] = useState<{ title: string; description: string } | null>(null);

  const handleStartDrawing = (title: string, description: string) => {
    setCurrentIdea({ title, description });
    setCurrentView('drawing');
  };

  const handleDirectSubmit = (title: string, description: string, userName: string, userEmail: string) => {
    const idea: Idea = {
      id: Date.now().toString(),
      title,
      description,
      userName,
      userEmail,
      createdAt: new Date(),
    };
    
    setIdeas([...ideas, idea]);
    setCurrentView('parking');
  };

  const handleSubmitIdea = (idea: Idea) => {
    setIdeas([...ideas, idea]);
    setCurrentView('parking');
    setCurrentIdea(null);
  };

  const handleUpdateIdea = (id: string, updates: Partial<Idea>) => {
    const updatedIdeas = ideas.map(idea => 
      idea.id === id ? { ...idea, ...updates } : idea
    );
    setIdeas(updatedIdeas);
  };

  const handleDeleteIdea = (id: string) => {
    setIdeas(ideas.filter(i => i.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#0b0b0d]">
      {currentView === 'home' && (
        <HomePage 
          onStartDrawing={handleStartDrawing}
          onDirectSubmit={handleDirectSubmit}
          onViewParkingLot={() => setCurrentView('parking')}
        />
      )}
      
      {currentView === 'drawing' && currentIdea && (
        <DrawingBoard
          title={currentIdea.title}
          description={currentIdea.description}
          onSubmit={handleSubmitIdea}
          onBack={() => setCurrentView('home')}
        />
      )}
      
      {currentView === 'parking' && (
        <ParkingLot
          ideas={ideas}
          onBack={() => setCurrentView('home')}
          onUpdateIdea={handleUpdateIdea}
          onDeleteIdea={handleDeleteIdea}
        />
      )}
    </div>
  );
}
