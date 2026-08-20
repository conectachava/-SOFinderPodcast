"use client";
import React, { useState, useEffect } from 'react';
import { storage } from '@/lib/firebase';
import { ref, listAll, getDownloadURL, getMetadata } from 'firebase/storage';
import { useAuth } from '@/app/AuthProvider';
import { Play, Download, FileAudio, Loader2 } from 'lucide-react';

export function GeneratedAudioGallery() {
  const { user } = useAuth();
  const [audios, setAudios] = useState<{name: string, url: string, date: string}[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    const fetchAudios = async () => {
      setLoading(true);
      try {
        const listRef = ref(storage, `audios/${user.uid}`);
        const res = await listAll(listRef);
        const audioData = await Promise.all(
          res.items.map(async (itemRef) => {
            const url = await getDownloadURL(itemRef);
            const metadata = await getMetadata(itemRef);
            return {
              name: itemRef.name,
              url,
              date: metadata.timeCreated
            };
          })
        );
        setAudios(audioData);
      } catch (e) {
        console.error("Error al cargar audios:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchAudios();
  }, [user]);

  if (loading) return <div className="text-center p-4"><Loader2 className="animate-spin inline"/></div>;

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-lg">Mis Audios Generados</h3>
      {audios.length === 0 ? <p className="text-sm">No hay audios disponibles.</p> : (
        <div className="grid gap-2">
          {audios.map((audio) => (
            <div key={audio.name} className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <div className="flex items-center gap-2">
                <FileAudio className="w-5 h-5 text-indigo-500" />
                <span className="text-sm font-medium">{audio.name}</span>
              </div>
              <div className="flex gap-2">
                <a href={audio.url} target="_blank" rel="noreferrer" className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full">
                  <Play className="w-4 h-4" />
                </a>
                <a href={audio.url} download className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full">
                  <Download className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
