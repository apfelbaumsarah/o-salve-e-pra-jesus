import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ImageIcon, Camera } from 'lucide-react';
import { supabase } from '../supabase';

interface GalleryPhoto {
  id: string;
  public_url: string;
}

interface EventGallery {
  id: string;
  name: string;
  slug: string;
  event_date: string | null;
  cover_photo_id: string | null;
  is_active: boolean;
  created_at: string;
  cover_url: string | null;
  photo_count: number;
}

const GalleryIndex = () => {
  const [events, setEvents] = useState<EventGallery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data: rawEvents, error } = await supabase
        .from('events_gallery')
        .select('id, name, slug, event_date, cover_photo_id, is_active, created_at')
        .eq('is_active', true)
        .order('event_date', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!rawEvents) { setEvents([]); return; }

      const enriched = await Promise.all(
        rawEvents.map(async (ev) => {
          let coverUrl: string | null = null;

          if (ev.cover_photo_id) {
            const { data: coverPhoto } = await supabase
              .from('gallery_photos')
              .select('public_url')
              .eq('id', ev.cover_photo_id)
              .single();
            coverUrl = coverPhoto?.public_url ?? null;
          }

          if (!coverUrl) {
            const { data: latestPhoto } = await supabase
              .from('gallery_photos')
              .select('public_url')
              .eq('event_id', ev.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();
            coverUrl = latestPhoto?.public_url ?? null;
          }

          const { count } = await supabase
            .from('gallery_photos')
            .select('id', { count: 'exact', head: true })
            .eq('event_id', ev.id);

          return {
            ...ev,
            cover_url: coverUrl,
            photo_count: count ?? 0,
          };
        })
      );

      setEvents(enriched);
    } catch (err) {
      console.error('Erro ao carregar eventos da galeria:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) =>
    format(new Date(dateStr + 'T12:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  return (
    <div className="min-h-screen bg-urban-black pt-20">
      {/* Header */}
      <section className="relative bg-urban-gray border-b border-white/5 overflow-hidden">
        <div className="absolute inset-0 bg-urban-yellow/5 blur-3xl opacity-30 rounded-full scale-150" />
        <div className="max-w-7xl mx-auto px-4 py-20 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-urban-yellow/10 text-urban-yellow text-xs font-bold uppercase tracking-widest rounded-full border border-urban-yellow/20 mb-6">
              <Camera size={14} /> Registro Visual
            </div>
            <h1 className="font-display text-7xl md:text-9xl text-white leading-none tracking-tighter mb-4">
              GALERIA
            </h1>
            <p className="font-urban text-gray-400 text-xl uppercase tracking-widest">
              Momentos do SALVE
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-72 rounded-2xl bg-white/5 animate-pulse"
              />
            ))}
          </div>
        ) : events.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
              <ImageIcon size={36} className="text-gray-600" />
            </div>
            <p className="font-display text-2xl text-gray-500 uppercase tracking-wide">
              Nenhum evento com fotos ainda.
            </p>
            <p className="font-urban text-gray-600 mt-2">Volte em breve.</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((ev, index) => (
              <motion.div
                key={ev.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.07 }}
              >
                <Link
                  to={`/galeria/${ev.slug}`}
                  className="group block rounded-2xl overflow-hidden border border-white/10 bg-urban-gray hover:border-urban-yellow/50 hover:ring-2 hover:ring-urban-yellow/30 transition-all duration-300"
                >
                  {/* Cover image */}
                  <div className="relative h-52 overflow-hidden bg-black/40">
                    {ev.cover_url ? (
                      <img
                        src={ev.cover_url}
                        alt={ev.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-white/[0.03]">
                        <ImageIcon size={48} className="text-gray-700" />
                      </div>
                    )}
                    {/* Photo count badge */}
                    {ev.photo_count > 0 && (
                      <div className="absolute top-3 right-3 px-2 py-1 bg-black/70 text-urban-yellow text-xs font-bold rounded-lg font-urban uppercase tracking-wider backdrop-blur-sm">
                        {ev.photo_count} {ev.photo_count === 1 ? 'foto' : 'fotos'}
                      </div>
                    )}
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-urban-gray via-transparent to-transparent opacity-80" />
                  </div>

                  {/* Info */}
                  <div className="p-5">
                    <h2 className="font-display text-2xl uppercase tracking-wide text-white group-hover:text-urban-yellow transition-colors leading-tight mb-1">
                      {ev.name}
                    </h2>
                    {ev.event_date && (
                      <p className="font-urban text-gray-500 text-sm capitalize">
                        {formatDate(ev.event_date)}
                      </p>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default GalleryIndex;
