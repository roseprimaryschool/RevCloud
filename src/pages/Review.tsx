import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { Flashcard } from './Dashboard';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../utils/errorHandling';

export function Review() {
  const { user } = useAuth();
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [finished, setFinished] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCards = async () => {
      if (!user) return;
      try {
        const q = query(
          collection(db, 'flashcards'),
          where('userId', '==', user.uid)
        );
        const snapshot = await getDocs(q);
        const fetchedCards: Flashcard[] = [];
        snapshot.forEach((doc) => {
          fetchedCards.push({ id: doc.id, ...doc.data() } as Flashcard);
        });
        
        // Shuffle cards for review
        const shuffled = fetchedCards.sort(() => Math.random() - 0.5);
        setCards(shuffled);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'flashcards');
      } finally {
        setLoading(false);
      }
    };

    fetchCards();
  }, [user]);

  const handleAnswer = async (status: 'learning' | 'known') => {
    if (!user || currentIndex >= cards.length) return;
    
    const currentCard = cards[currentIndex];
    
    try {
      const cardRef = doc(db, 'flashcards', currentCard.id);
      await updateDoc(cardRef, {
        status,
        lastReviewed: Date.now()
      });
      
      if (currentIndex + 1 < cards.length) {
        setCurrentIndex(prev => prev + 1);
        setIsFlipped(false);
      } else {
        setFinished(true);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `flashcards/${currentCard.id}`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-zinc-900 mb-4">No cards to review</h2>
        <p className="text-zinc-600 mb-8">Create some flashcards first before starting a review session.</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-bold text-zinc-900 mb-4">Session Complete!</h2>
        <p className="text-zinc-600 mb-8">You've reviewed all your flashcards for this session.</p>
        <div className="flex justify-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-zinc-100 text-zinc-900 rounded-xl hover:bg-zinc-200 transition-colors font-medium"
          >
            Back to Dashboard
          </button>
          <button
            onClick={() => {
              setFinished(false);
              setCurrentIndex(0);
              setIsFlipped(false);
              setCards([...cards].sort(() => Math.random() - 0.5));
            }}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Review Again
          </button>
        </div>
      </div>
    );
  }

  const currentCard = cards[currentIndex];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => navigate('/')}
          className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-sm font-medium text-zinc-500">
          Card {currentIndex + 1} of {cards.length}
        </div>
        <div className="w-9"></div> {/* Spacer for centering */}
      </div>

      <div className="w-full bg-zinc-200 rounded-full h-1.5 mb-8">
        <div
          className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${((currentIndex) / cards.length) * 100}%` }}
        ></div>
      </div>

      <div className="relative perspective-1000 min-h-[400px] mb-8">
        <div
          className={`w-full h-full min-h-[400px] transition-transform duration-500 transform-style-3d cursor-pointer ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          {/* Front */}
          <div className="absolute w-full h-full backface-hidden bg-white rounded-3xl shadow-sm border border-zinc-200 p-8 flex flex-col items-center justify-center text-center">
            <span className="absolute top-6 left-6 text-xs font-bold tracking-widest text-zinc-400 uppercase">Question</span>
            <h2 className="text-2xl sm:text-3xl font-medium text-zinc-900 leading-relaxed">
              {currentCard.front}
            </h2>
            <p className="absolute bottom-6 text-sm text-zinc-400">Tap to reveal answer</p>
          </div>

          {/* Back */}
          <div className="absolute w-full h-full backface-hidden bg-indigo-50 rounded-3xl shadow-sm border border-indigo-100 p-8 flex flex-col items-center justify-center text-center rotate-y-180">
            <span className="absolute top-6 left-6 text-xs font-bold tracking-widest text-indigo-400 uppercase">Answer</span>
            <p className="text-xl sm:text-2xl text-indigo-900 leading-relaxed">
              {currentCard.back}
            </p>
          </div>
        </div>
      </div>

      {isFlipped && (
        <div className="flex justify-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAnswer('learning');
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-white border-2 border-amber-200 text-amber-700 rounded-2xl hover:bg-amber-50 transition-colors font-medium shadow-sm"
          >
            <XCircle className="w-5 h-5" />
            Still Learning
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAnswer('known');
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-white border-2 border-emerald-200 text-emerald-700 rounded-2xl hover:bg-emerald-50 transition-colors font-medium shadow-sm"
          >
            <CheckCircle className="w-5 h-5" />
            Got It
          </button>
        </div>
      )}
    </div>
  );
}
