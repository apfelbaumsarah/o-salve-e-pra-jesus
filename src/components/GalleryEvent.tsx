import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft, X, ChevronLeft, ChevronRight, ImageIcon, Download } from 'lucide-react';
import { supabase } from '../supabase';

const PAGE_SIZE = 50;

interface EventGallery {
  id: string;
  name: string;
  slug: string;
  event_date: string | null;
  cover_photo_id: string | null;
  is_active: boolean;
  created_at: string;
}

interface GalleryPhoto {
  id: string;
  event_id: string;
  storage_path: string;
  public_url: string;
  caption: string | null;
  width: number | null;
  height: number | null;
  uploaded_by: string | null;
  created_at: string;
}

const GalleryEvent = () => {
  const { slug } = useParams<{ slug: string }>();
  const [event, setEvent] = useState<EventGallery | null>(null);
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPage, setLoadingPage] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [notFound, setNotFound] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [loadedPhotoIds, setLoadedPhotoIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    window.scrollTo(0, 0);
    if (slug) fetchEventAndPhotos(slug);
  }, [slug]);

  const fetchPage = async (eventId: string, page: number) => {
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data, count } = await supabase
      .from('gallery_photos')
      .select('*', { count: 'exact' })
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })
      .range(from, to);
    return { data: data ?? [], count: count ?? 0 };
  };

  const fetchEventAndPhotos = async (eventSlug: string) => {
    setLoading(true);
    setNotFound(false);

    const { data: ev, error: evError } = await supabase
      .from('events_gallery')
      .select('*')
      .eq('slug', eventSlug)
      .single();

    if (evError || !ev) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setEvent(ev);

    const firstPage = 1;
    const { data, count } = await fetchPage(ev.id, firstPage);
    setPhotos(data);
    setLoadedPhotoIds({});
    setTotalCount(count);
    setCurrentPage(firstPage);
    setTotalPages(Math.max(1, Math.ceil(count / PAGE_SIZE)));
    setLoading(false);
  };

  const goToPage = async (page: number) => {
    if (!event || page < 1 || page > totalPages || page === currentPage || loadingPage) return;
    setLoadingPage(true);
    try {
      const { data, count } = await fetchPage(event.id, page);
      setPhotos(data);
      setLoadedPhotoIds({});
      setTotalCount(count);
      setTotalPages(Math.max(1, Math.ceil(count / PAGE_SIZE)));
      setCurrentPage(page);
    } finally {
      setLoadingPage(false);
    }
  };

  // Realtime subscription — only after event is resolved
  useEffect(() => {
    if (!event) return;

    const channel = supabase
      .channel(`public-gallery-${event.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'gallery_photos',
          filter: `event_id=eq.${event.id}`,
        },
        (payload) => {
          if (currentPage === 1) {
            setPhotos((prev) => {
              if (prev.some((p) => p.id === (payload.new as GalleryPhoto).id)) return prev;
              return [payload.new as GalleryPhoto, ...prev].slice(0, PAGE_SIZE);
            });
          }
          setTotalCount((c) => {
            const next = c + 1;
            setTotalPages(Math.max(1, Math.ceil(next / PAGE_SIZE)));
            return next;
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'gallery_photos',
          filter: `event_id=eq.${event.id}`,
        },
        (payload) => {
          if (currentPage === 1) {
            setPhotos((prev) => prev.filter((p) => p.id !== (payload.old as any).id));
          }
          setTotalCount((c) => {
            const next = Math.max(0, c - 1);
            setTotalPages(Math.max(1, Math.ceil(next / PAGE_SIZE)));
            return next;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [event, currentPage]);

  // Lightbox keyboard navigation
  useEffect(() => {
    if (lightboxIndex === null) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowRight') setLightboxIndex((i) => (i !== null ? Math.min(i + 1, photos.length - 1) : null));
      if (e.key === 'ArrowLeft') setLightboxIndex((i) => (i !== null ? Math.max(i - 1, 0) : null));
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightboxIndex, photos.length]);

  const formatDate = (dateStr: string) =>
    format(new Date(dateStr + 'T12:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  const displayEventName =
    event?.slug === 'salve-pra-jesus-1-edicao'
      ? 'O SALVE! é pra JESUS. 1ª edição'
      : event?.name;

  const downloadPhoto = async (photo: GalleryPhoto, index: number) => {
    try {
      const res = await fetch(photo.public_url);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const base = (event?.slug || 'foto').replace(/[^a-z0-9-]/gi, '-');
      a.href = url;
      a.download = `${base}-${String(index + 1).padStart(3, '0')}.webp`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      window.open(photo.public_url, '_blank');
    }
  };

  const markPhotoAsLoaded = (photoId: string) => {
    setLoadedPhotoIds((prev) => {
      if (prev[photoId]) return prev;
      return { ...prev, [photoId]: true };
    });
  };

  const paginationControls = totalPages > 1 && (
    <div className="flex flex-wrap items-center justify-center gap-3 py-6">
      <button
        onClick={() => goToPage(currentPage - 1)}
        disabled={loadingPage || currentPage === 1}
        className="px-5 py-2.5 bg-white/5 border border-white/10 text-white font-bold rounded-xl hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-urban uppercase text-xs tracking-widest"
      >
        Anterior
      </button>
      <span className="font-urban text-xs md:text-sm text-gray-400 uppercase tracking-widest">
        Pagina {currentPage} de {totalPages}
      </span>
      <button
        onClick={() => goToPage(currentPage + 1)}
        disabled={loadingPage || currentPage === totalPages}
        className="px-5 py-2.5 bg-urban-yellow text-urban-black font-bold rounded-xl hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-urban uppercase text-xs tracking-widest"
      >
        {loadingPage ? 'Carregando...' : 'Proxima'}
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-urban-black pt-20 flex items-center justify-center">
        <div className="space-y-4 w-full max-w-7xl mx-auto px-4 py-16">
          <div className="h-16 bg-white/5 rounded-xl animate-pulse w-1/2" />
          <div className="columns-2 md:columns-3 lg:columns-4 gap-3 mt-8">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="break-inside-avoid mb-3 rounded-lg bg-white/5 animate-pulse"
                style={{ height: `${150 + (i % 3) * 60}px` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-urban-black pt-20 flex items-center justify-center">
        <div className="text-center px-4">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
            <ImageIcon size={36} className="text-gray-600" />
          </div>
          <h1 className="font-display text-4xl text-white uppercase tracking-wide mb-3">
            Evento nao encontrado
          </h1>
          <p className="font-urban text-gray-500 mb-8">
            O evento que voce buscou nao existe ou foi removido.
          </p>
          <Link
            to="/galeria"
            className="inline-flex items-center gap-2 px-6 py-3 bg-urban-yellow text-urban-black font-bold rounded-xl hover:bg-yellow-400 transition-colors font-urban uppercase text-sm tracking-widest"
          >
            <ArrowLeft size={16} /> Voltar para Galeria
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-urban-black pt-20">
      {/* Header */}
      <section className="relative bg-urban-gray border-b border-white/5 overflow-hidden">
        <div className="absolute inset-0 bg-urban-yellow/5 blur-3xl opacity-20 rounded-full scale-150" />
        <div className="max-w-7xl mx-auto px-4 py-16 relative z-10">
          {/* Breadcrumb */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Link
              to="/galeria"
              className="inline-flex items-center gap-2 font-urban text-sm text-gray-500 hover:text-urban-yellow transition-colors uppercase tracking-widest mb-8"
            >
              <ArrowLeft size={14} /> Galeria
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            <h1 className="font-display text-3xl md:text-5xl text-white leading-tight tracking-tight">
              {displayEventName}
            </h1>

            <div className="flex flex-wrap items-center gap-4">
              {event?.event_date && (
                <span className="font-urban text-gray-400 text-sm capitalize">
                  {formatDate(event.event_date)}
                </span>
              )}

              <span className="font-urban text-gray-600 text-sm">
                {totalCount} {totalCount === 1 ? 'foto' : 'fotos'}
              </span>

            </div>
          </motion.div>
        </div>
      </section>

      {/* Photos */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        {paginationControls}

        {photos.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
              <ImageIcon size={36} className="text-gray-600" />
            </div>
            <p className="font-display text-2xl text-gray-500 uppercase tracking-wide">
              Em breve as fotos deste evento aparecerao aqui.
            </p>
          </motion.div>
        ) : (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-3">
            {photos.map((photo, index) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="break-inside-avoid mb-3"
              >
                <button
                  type="button"
                  onClick={() => setLightboxIndex(index)}
                  className="relative block w-full overflow-hidden rounded-lg bg-white/[0.04] cursor-pointer hover:ring-2 hover:ring-urban-yellow/50 transition-all duration-200"
                  style={{
                    aspectRatio:
                      photo.width && photo.height
                        ? `${photo.width} / ${photo.height}`
                        : '3 / 4',
                  }}
                  aria-label={photo.caption ?? `Abrir foto ${index + 1}`}
                >
                  <div
                    className={`absolute inset-0 animate-pulse bg-white/[0.06] transition-opacity duration-300 ${
                      loadedPhotoIds[photo.id] ? 'opacity-0' : 'opacity-100'
                    }`}
                  />
                  <img
                    loading="lazy"
                    decoding="async"
                    src={photo.public_url}
                    alt={photo.caption ?? `Foto ${index + 1}`}
                    onLoad={() => markPhotoAsLoaded(photo.id)}
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                      loadedPhotoIds[photo.id] ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                </button>
              </motion.div>
            ))}
          </div>
        )}

        {paginationControls}
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            key="lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
            onClick={() => setLightboxIndex(null)}
          >
            {/* Download button */}
            <button
              className="absolute top-4 right-16 z-10 p-2 rounded-full bg-white/10 text-white hover:bg-urban-yellow hover:text-urban-black transition-colors"
              onClick={(e) => { e.stopPropagation(); downloadPhoto(photos[lightboxIndex], lightboxIndex); }}
              aria-label="Baixar foto"
              title="Baixar"
            >
              <Download size={22} />
            </button>

            {/* Close button */}
            <button
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(null); }}
              aria-label="Fechar"
            >
              <X size={24} />
            </button>

            {/* Previous */}
            {lightboxIndex > 0 && (
              <button
                className="absolute left-4 z-10 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => (i !== null ? i - 1 : null)); }}
                aria-label="Foto anterior"
              >
                <ChevronLeft size={28} />
              </button>
            )}

            {/* Next */}
            {lightboxIndex < photos.length - 1 && (
              <button
                className="absolute right-4 z-10 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => (i !== null ? i + 1 : null)); }}
                aria-label="Proxima foto"
              >
                <ChevronRight size={28} />
              </button>
            )}

            {/* Image */}
            <motion.img
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              src={photos[lightboxIndex].public_url}
              alt={photos[lightboxIndex].caption ?? `Foto ${lightboxIndex + 1}`}
              className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Caption + counter */}
            <div className="absolute bottom-4 left-0 right-0 text-center space-y-1 pointer-events-none">
              {photos[lightboxIndex].caption && (
                <p className="font-urban text-sm text-gray-300 px-4">
                  {photos[lightboxIndex].caption}
                </p>
              )}
              <p className="font-urban text-xs text-gray-600 uppercase tracking-widest">
                {lightboxIndex + 1} / {photos.length}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GalleryEvent;
