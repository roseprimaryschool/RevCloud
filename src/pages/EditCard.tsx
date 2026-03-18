import React, { useEffect, useState } from 'react';
import { FlashcardForm } from '../components/FlashcardForm';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../utils/errorHandling';

export function EditCard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [initialData, setInitialData] = useState<{ id: string; front: string; back: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCard = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'flashcards', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setInitialData({ id, front: data.front, back: data.back });
        } else {
          navigate('/');
        }
      } catch (error) {
        setLoading(false);
        handleFirestoreError(error, OperationType.GET, `flashcards/${id}`);
      } finally {
        setLoading(false);
      }
    };

    fetchCard();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate('/')}
          className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-zinc-900">Edit Flashcard</h1>
      </div>
      {initialData && <FlashcardForm initialData={initialData} />}
    </div>
  );
}
