import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { motion } from 'motion/react';
import { Play, Calendar, Share2, Youtube } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Live {
  id: string;
  youtube_id: string;
  title: string;
  date: string;
  is_main: boolean;
}

const FEATURED_VIDEO_ID = 'Bqc6B5LzTN0';
const FEATURED_VIDEO: Live = {
  id: 'featured-video-bqc6b5lztN0',
  youtube_id: FEATURED_VIDEO_ID,
  title: 'O FOGO ARDERÁ AO VIVO - Alexsander Lucio',
  date: '',
  is_main: true,
};

const LiveStream = () => {
  const [lives, setLives] = useState<Live[]>([]);
  const [mainLive, setMainLive] = useState<Live | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedFeedback, setCopiedFeedback] = useState(false);

  useEffect(() => {
    const mergeWithFeaturedVideo = (incomingLives: Live[]) => {
      const hasFeatured = incomingLives.some((live) => live.youtube_id === FEATURED_VIDEO_ID);
      return hasFeatured ? incomingLives : [FEATURED_VIDEO, ...incomingLives];
    };

    const getInitialMainLive = (incomingLives: Live[]) => {
      return (
        incomingLives.find((live) => live.youtube_id === FEATURED_VIDEO_ID) ||
        incomingLives.find((live) => live.is_main) ||
        incomingLives[0] ||
        null
      );
    };

    const fetchLives = async () => {
      const { data } = await supabase
        .from('lives')
        .select('*')
        .order('date', { ascending: false })
        .limit(10);
      const livesData = mergeWithFeaturedVideo(data || []);
      setLives(livesData);
      const main = getInitialMainLive(livesData);
      setMainLive(main);
      setLoading(false);
    };
    fetchLives();

    const channel = supabase
      .channel('lives-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lives' }, async () => {
        const { data } = await supabase.from('lives').select('*').order('date', { ascending: false }).limit(10);
        const livesData = mergeWithFeaturedVideo(data || []);
        setLives(livesData);
        const main = getInitialMainLive(livesData);
        setMainLive(main);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const getShareData = () => {
    if (!mainLive) return null;
    const url = `https://www.youtube.com/watch?v=${mainLive.youtube_id}`;
    const text = `Assista "${mainLive.title}" no canal O SALVE é pra JESUS: ${url}`;
    return { url, text, title: mainLive.title };
  };

  const copyShareText = async () => {
    const shareData = getShareData();
    if (!shareData) return;

    try {
      await navigator.clipboard.writeText(shareData.text);
      setCopiedFeedback(true);
      setTimeout(() => setCopiedFeedback(false), 2500);
    } catch {
      setCopiedFeedback(false);
    }
  };

  const handleShare = async () => {
    const shareData = getShareData();
    if (!shareData) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareData.title,
          text: shareData.text,
          url: shareData.url,
        });
      } catch {
        // If user cancels native share, do nothing.
      }
      return;
    }

    await copyShareText();
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
          <div className="mt-8 md:mt-10">
            <p className="font-urban font-bold text-sm tracking-widest uppercase text-urban-yellow mb-2">
              Mensagens e videos
            </p>
            <h1 className="font-display text-6xl text-white">ASSISTA <span className="text-urban-yellow">O SALVE</span></h1>
          </div>
          <div className="relative w-full md:w-auto">
            <button
              onClick={handleShare}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-urban-gray border border-white/10 rounded-xl text-white font-bold hover:bg-white/5 transition-colors"
            >
              <Share2 size={20} /> COMPARTILHAR TRANSMISSÃO
            </button>
            {copiedFeedback && (
              <p className="text-xs text-urban-yellow mt-2 text-center md:text-right">Link copiado para compartilhar.</p>
            )}
          </div>
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
                  <p className="text-gray-500 font-urban">Nenhuma transmissão agendada no momento.</p>
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
            <div className="p-8 rounded-3xl border border-white/10 bg-gradient-to-br from-urban-yellow/10 via-white/[0.03] to-transparent">
              <h3 className="font-display text-3xl text-white mb-4">SOBRE O SALVE</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                Nossas transmissões acontecem para que a palavra de Deus alcance todos os lugares.
                Acompanhe ao vivo e interaja conosco através do chat oficial no YouTube.
              </p>
              <a
                href="https://www.youtube.com/@salveprajesus"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-4 bg-urban-yellow text-urban-black font-bold rounded-xl hover:bg-yellow-500 transition-all street-border"
              >
                <Youtube size={24} /> INSCREVA-SE NO CANAL
              </a>
            </div>

            <div className="p-8 rounded-3xl border border-white/10 bg-gradient-to-br from-urban-yellow/10 via-white/[0.03] to-transparent">
              <h3 className="font-display text-3xl text-white mb-2">PRECISA DE ORAÇÃO?</h3>
              <p className="text-gray-400 text-sm mb-6">
                Enquanto assiste, você pode deixar seu pedido de oração e nossa equipe estará intercedendo por você.
              </p>
              <a
                href="/oracao"
                className="inline-block w-full text-center py-4 bg-urban-yellow text-urban-black font-bold rounded-xl hover:bg-yellow-500 transition-all street-border"
              >
                PEDIR ORAÇÃO
              </a>
            </div>
          </div>
        </div>

        <div>
          <h2 className="font-display text-5xl text-white mb-8">TRANSMISSÕES <span className="text-urban-yellow">ANTERIORES</span></h2>
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
