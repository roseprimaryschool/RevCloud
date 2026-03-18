import React from 'react';
import { FlashcardForm } from '../components/FlashcardForm';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function CreateCard() {
  const navigate = useNavigate();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate('/')}
          className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-zinc-900">Create Flashcard</h1>
      </div>
      <FlashcardForm />
    </div>
  );
}
