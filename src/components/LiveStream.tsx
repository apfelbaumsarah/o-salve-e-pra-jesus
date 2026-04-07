import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { motion } from 'motion/react';
import { Play, Calendar, Video, Share2, Youtube } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Live {
  id: string;
  youtube_id: string;
  title: string;
  date: string;
  is_main: boolean;
}

const LiveStream = () => {
  const [lives, setLives] = useState<Live[]>([]);
  const [mainLive, setMainLive] = useState<Live | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLives = async () => {
      const { data } = await supabase
        .from('lives')
        .select('*')
        .order('date', { ascending: false })
        .limit(10);
      const livesData = data || [];
      setLives(livesData);
      const main = livesData.find((l) => l.is_main) || livesData[0] || null;
      setMainLive(main);
      setLoading(false);
    };
    fetchLives();

    const channel = supabase
      .channel('lives-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lives' }, async () => {
        const { data } = await supabase.from('lives').select('*').order('date', { ascending: false }).limit(10);
        const livesData = data || [];
        setLives(livesData);
        const main = livesData.find((l: Live) => l.is_main) || livesData[0] || null;
        setMainLive(main);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleShare = () => {
    if (mainLive) {
      const url = `https://www.youtube.com/watch?v=${mainLive.youtube_id}`;
      if (navigator.share) {
        navigator.share({ title: mainLive.title, url });
      } else {
        navigator.clipboard.writeText(url);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-urban-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-urban-yellow"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-urban-black pt-24 pb-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div>
            <div className="flex items-center gap-2 text-urban-yellow mb-2">
              <Video size={20} />
              <span className="font-urban font-bold text-sm tracking-widest uppercase">MENSAGENS E VÍDEOS</span>
            </div>
            <h1 className="font-display text-6xl text-white">ASSISTA <span className="text-urban-yellow">O SALVE</span></h1>
          </div>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-6 py-3 bg-urban-gray border border-white/10 rounded-xl text-white font-bold hover:bg-white/5 transition-colors"
          >
            <Share2 size={20} /> COMPARTILHAR TRANSMISSAO
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
          <div className="lg:col-span-2">
            <div className="relative aspect-video rounded-2xl overflow-hidden street-border bg-black">
              {mainLive ? (
                <iframe
                  src={`https://www.youtube.com/embed/${mainLive.youtube_id}?autoplay=0&rel=0`}
                  title={mainLive.title}
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                  <Youtube size={64} className="text-gray-700 mb-4" />
                  <p className="text-gray-500 font-urban">Nenhuma transmissao agendada no momento.</p>
                </div>
              )}
            </div>
            {mainLive && (
              <div className="mt-6">
                <h2 className="font-display text-4xl text-white mb-2">{mainLive.title}</h2>
                <div className="flex items-center gap-2 text-gray-400">
                  <Calendar size={18} />
                  <span className="font-urban text-sm uppercase">
                    {mainLive.date ? format(new Date(mainLive.date), "dd 'de' MMMM 'as' HH:mm", { locale: ptBR }) : 'Data em breve'}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-8">
            <div className="street-card p-8 rounded-2xl">
              <h3 className="font-display text-3xl text-white mb-4">SOBRE O SALVE</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                Nossas transmissoes acontecem para que a palavra de Deus alcance todos os lugares.
                Acompanhe ao vivo e interaja conosco atraves do chat oficial no YouTube.
              </p>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-4 bg-urban-yellow text-urban-black font-bold rounded-xl hover:bg-yellow-500 transition-colors"
              >
                <Youtube size={24} /> INSCREVA-SE NO CANAL
              </a>
            </div>

            <div className="bg-urban-yellow/10 p-8 rounded-2xl border border-urban-yellow/20">
              <h3 className="font-display text-3xl text-urban-yellow mb-2">PRECISA DE ORACAO?</h3>
              <p className="text-gray-400 text-sm mb-6">
                Enquanto assiste, voce pode deixar seu pedido de oracao e nossa equipe estara intercedendo por voce.
              </p>
              <a
                href="/oracao"
                className="inline-block w-full text-center py-3 bg-urban-yellow text-urban-black font-bold rounded-lg hover:bg-yellow-600 transition-colors"
              >
                PEDIR ORACAO
              </a>
            </div>
          </div>
        </div>

        <div>
          <h2 className="font-display text-5xl text-white mb-8">TRANSMISSOES <span className="text-urban-yellow">ANTERIORES</span></h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {lives.filter((l) => l.id !== mainLive?.id).map((live) => (
              <motion.div
                key={live.id}
                whileHover={{ scale: 1.02 }}
                onClick={() => setMainLive(live)}
                className="group cursor-pointer"
              >
                <div className="relative aspect-video rounded-xl overflow-hidden mb-3 bg-urban-gray border border-white/5 group-hover:border-urban-yellow transition-colors">
                  <img
                    src={`https://img.youtube.com/vi/${live.youtube_id}/mqdefault.jpg`}
                    alt={live.title}
                    className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="p-3 bg-urban-yellow rounded-full text-urban-black shadow-xl">
                      <Play size={24} fill="currentColor" />
                    </div>
                  </div>
                </div>
                <h4 className="font-urban font-bold text-white text-sm line-clamp-2 mb-1">{live.title}</h4>
                <p className="text-gray-500 text-xs uppercase">
                  {live.date ? format(new Date(live.date), 'dd/MM/yyyy', { locale: ptBR }) : ''}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveStream;
