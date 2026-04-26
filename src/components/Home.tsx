import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { motion } from 'motion/react';
import { Calendar, MapPin, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import mainCoverImage from '../../imagens/35.png';
import secondaryCoverImage from '../../imagens/36.png';
import mobileCoverImageOne from '../../imagens/40.png';
import mobileCoverImageTwo from '../../imagens/41.png';

interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
}

interface GalleryPhoto {
  id: string;
  public_url: string;
  caption: string | null;
}

const GALLERY_SLUG = 'salve-pra-jesus-1-edicao';
const GALLERY_EXTERNAL_URL = 'https://www.salveprajesus.org/galeria/salve-pra-jesus-1-edicao';
const DESKTOP_COVER_IMAGES = [mainCoverImage, secondaryCoverImage];
const MOBILE_COVER_IMAGES = [mobileCoverImageTwo, mobileCoverImageOne];
const COVER_CAROUSEL_LENGTH = Math.max(DESKTOP_COVER_IMAGES.length, MOBILE_COVER_IMAGES.length);

const SCHEDULED_EVENT: Event = {
  id: 'evento-fixo-2026-04-21-14h',
  title: 'SALVE PRA JESUS',
  date: '2026-04-21T14:00:00-03:00',
  location: 'Concha Acústica Taquaral - Portão 2\nAv. Dr. Heitor Penteado, 1671 - Parque Taquaral, Campinas - SP, 13087-000',
  description: ''
};

const Home = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [galleryPhotos, setGalleryPhotos] = useState<GalleryPhoto[]>([]);

  useEffect(() => {
    let metaDescription = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      document.head.appendChild(metaDescription);
    }
    metaDescription.content = 'Canal oficial SALVE pra Jesus. Eventos, registros e conexão para a nova geração.';
  }, []);

  useEffect(() => {
    const withScheduledEvent = (incomingEvents: Event[]) => {
      const alreadyHasScheduled = incomingEvents.some(
        (event) =>
          event.title === SCHEDULED_EVENT.title &&
          event.location === SCHEDULED_EVENT.location &&
          event.date === SCHEDULED_EVENT.date
      );
      const mergedEvents = alreadyHasScheduled
        ? incomingEvents
        : [SCHEDULED_EVENT, ...incomingEvents];
      return mergedEvents.slice(0, 3);
    };

    const fetchData = async () => {
      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true })
        .limit(3);
      setEvents(withScheduledEvent(eventsData || []));

      const { data: galleryEvent } = await supabase
        .from('events_gallery')
        .select('id')
        .eq('slug', GALLERY_SLUG)
        .single();
      if (galleryEvent?.id) {
        const { data: photosData } = await supabase
          .from('gallery_photos')
          .select('id, public_url, caption')
          .eq('event_id', galleryEvent.id)
          .order('created_at', { ascending: false })
          .limit(5);
        setGalleryPhotos(photosData || []);
      }

      setLoading(false);
    };
    fetchData();

    const eventChannel = supabase
      .channel('home-events')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, async () => {
        const { data } = await supabase.from('events').select('*').order('date', { ascending: true }).limit(3);
        setEvents(withScheduledEvent(data || []));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(eventChannel);
    };
  }, []);

  useEffect(() => {
    if (COVER_CAROUSEL_LENGTH > 1) {
      const timer = setInterval(() => {
        setCurrentBanner((prev) => (prev + 1) % COVER_CAROUSEL_LENGTH);
      }, 10000);
      return () => clearInterval(timer);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-urban-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-urban-yellow"></div>
      </div>
    );
  }

  const goToNextBanner = () => setCurrentBanner((prev) => (prev + 1) % COVER_CAROUSEL_LENGTH);
  const goToPreviousBanner = () =>
    setCurrentBanner((prev) => (prev - 1 + COVER_CAROUSEL_LENGTH) % COVER_CAROUSEL_LENGTH);

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    setTouchStartX(event.touches[0]?.clientX ?? null);
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX === null) return;
    const touchEndX = event.changedTouches[0]?.clientX ?? touchStartX;
    const deltaX = touchStartX - touchEndX;
    const minSwipeDistance = 50;

    if (deltaX > minSwipeDistance) {
      goToNextBanner();
    } else if (deltaX < -minSwipeDistance) {
      goToPreviousBanner();
    }
    setTouchStartX(null);
  };

  return (
    <div className="min-h-screen bg-urban-black pt-20 md:pt-24">
      <section className="relative overflow-hidden aspect-[16/9] md:aspect-[8/3]">
        <div
          className="absolute inset-0 overflow-hidden bg-urban-gray"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <motion.div
            className="flex h-full"
            animate={{ x: `-${currentBanner * 100}%` }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
          >
            {Array.from({ length: COVER_CAROUSEL_LENGTH }).map((_, index) => {
              const slideDesktopImage = DESKTOP_COVER_IMAGES[index % DESKTOP_COVER_IMAGES.length];
              const slideMobileImage = MOBILE_COVER_IMAGES[index % MOBILE_COVER_IMAGES.length];

              return (
                <div key={`cover-slide-${index}`} className="relative w-full h-full shrink-0">
                  <img
                    src={slideMobileImage}
                    alt="O SALVE É PRA JESUS"
                    className="absolute inset-0 w-full h-full object-cover object-center block md:hidden bg-urban-black"
                  />
                  <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-urban-black/50 to-transparent md:hidden pointer-events-none" />
                  <div className="absolute inset-x-0 bottom-0 h-16 md:hidden pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-t from-urban-black/95 via-urban-black/55 to-transparent" />
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 h-10 w-[78%] rounded-full bg-urban-black/80 blur-xl opacity-85" />
                  </div>
                  <div className="absolute inset-0 hidden md:block">
                    <img
                      src={slideDesktopImage}
                      alt="O SALVE É PRA JESUS"
                      className="w-full h-full object-cover object-center"
                    />
                    <div className="absolute inset-0 bg-black/28 pointer-events-none" />
                    <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-urban-black/80 to-transparent pointer-events-none" />
                    <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-urban-black/70 to-transparent pointer-events-none" />
                  </div>
                </div>
              );
            })}
          </motion.div>
        </div>

        <div className="absolute inset-x-0 bottom-3 z-20 flex items-center justify-center gap-2 md:bottom-5">
          {Array.from({ length: COVER_CAROUSEL_LENGTH }).map((_, index) => (
            <button
              key={`cover-dot-${index}`}
              type="button"
              onClick={() => setCurrentBanner(index)}
              className={`h-1.5 rounded-full transition-all ${
                currentBanner === index ? 'w-6 bg-urban-yellow' : 'w-2 bg-white/60'
              }`}
              aria-label={`Ir para banner ${index + 1}`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={goToPreviousBanner}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 h-9 w-9 rounded-full bg-black/35 text-white text-xl leading-none flex items-center justify-center md:hidden"
          aria-label="Banner anterior"
        >
          ‹
        </button>
        <button
          type="button"
          onClick={goToNextBanner}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 h-9 w-9 rounded-full bg-black/35 text-white text-xl leading-none flex items-center justify-center md:hidden"
          aria-label="Proximo banner"
        >
          ›
        </button>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-6 md:py-16">
        <div className="py-0">
          <h1 className="font-display text-4xl md:text-6xl text-urban-yellow tracking-tight mb-4">
            O SALVE É REAL.
          </h1>
          <p className="font-urban text-gray-300 text-base md:text-xl leading-relaxed max-w-3xl">
            Não é sobre um dia, é sobre o que fica depois que as luzes apagam. O SALVE pra Jesus surgiu para ser voz em meio ao barulho. Uma geração, um propósito e a mesma verdade, falada do nosso jeito.
            <br />
            <br />
            Aqui você vê como tudo começou e para onde estamos indo.
          </p>
          <Link to="/historia" className="inline-flex items-center gap-2 text-urban-yellow font-bold hover:underline mt-8">
            CONHECER A HISTÓRIA <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 pt-8 pb-20 md:py-20">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
          <div>
            <h2 className="font-display text-5xl text-white mb-2">PRÓXIMOS <span className="text-urban-yellow">EVENTOS</span></h2>
            <p className="font-urban text-gray-400">Não perca o que Deus está fazendo em nossa cidade.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {events.length > 0 ? (
            events.map((event) => (
              <motion.div
                key={event.id}
                whileHover={{ y: -10 }}
                className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-urban-yellow/10 via-white/[0.03] to-transparent"
              >
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <div className="inline-flex items-center gap-2 text-urban-yellow px-3 py-1.5 rounded-full border border-urban-yellow/25 bg-urban-yellow/10">
                    <Calendar size={18} />
                    <span className="font-urban font-bold text-sm uppercase">
                      {event.date ? format(new Date(event.date), "dd 'de' MMMM '•' HH'h'", { locale: ptBR }) : 'Data em breve'}
                    </span>
                  </div>
                  {event.date && new Date(event.date).getTime() < Date.now() && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 text-emerald-300">
                      <CheckCircle2 size={14} />
                      <span className="font-urban font-bold text-xs uppercase tracking-wide">JÁ ACONTECEU</span>
                    </div>
                  )}
                </div>
                <h3 className="font-display text-3xl text-white mb-3">{event.title}</h3>
                <div className="flex items-start gap-2 text-gray-400 mb-6">
                  <MapPin size={18} className="shrink-0 mt-1" />
                  <span className="text-sm whitespace-pre-line">{event.location}</span>
                </div>
                {event.description && (
                  <p className="text-gray-500 text-sm mb-6 line-clamp-3">{event.description}</p>
                )}
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center py-20 rounded-2xl border border-white/10 bg-gradient-to-br from-urban-yellow/10 via-white/[0.03] to-transparent">
              <p className="text-gray-500 font-urban">Nenhum evento agendado no momento.</p>
            </div>
          )}
        </div>
      </section>

      {galleryPhotos.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 pt-8 pb-20 md:py-20">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
            <div>
              <h2 className="font-display text-5xl text-white mb-2">
                <span className="text-urban-yellow">GALERIA</span>
              </h2>
              <p className="font-urban text-gray-400">Reviva os melhores momentos do SALVE pra Jesus.</p>
            </div>
            <a
              href={GALLERY_EXTERNAL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-urban-yellow text-urban-black font-bold rounded-xl hover:bg-yellow-400 transition-all font-urban uppercase text-sm tracking-widest"
            >
              Ver todas as fotos <ArrowRight size={18} />
            </a>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {galleryPhotos.slice(0, 5).map((photo, index) => (
              <a
                key={photo.id}
                href={GALLERY_EXTERNAL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={`relative overflow-hidden rounded-xl group ${
                  index === 0 ? 'col-span-2 md:col-span-2 md:row-span-2 aspect-square' : 'aspect-square'
                }`}
              >
                <img
                  loading="lazy"
                  src={photo.public_url}
                  alt={photo.caption ?? `Foto ${index + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
              </a>
            ))}
          </div>
        </section>
      )}

      <section className="bg-urban-yellow py-20 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="text-[200px] font-display whitespace-nowrap animate-pulse">
            O SALVE É PRA JESUS O SALVE É PRA JESUS
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="font-display text-6xl text-urban-black mb-6">VOCÊ JÁ DEU O SEU <span className="text-white">SALVE?</span></h2>
          <p className="font-urban text-urban-black/80 text-xl mb-10">
            Se você aceitou Jesus ou quer saber mais sobre como caminhar com Ele, clique no botão abaixo.
          </p>
          <Link
            to="/cadastro"
            className="inline-block px-12 py-5 bg-urban-black text-white font-bold text-2xl rounded-xl street-border hover:bg-black/80 transition-all"
          >
            TÔ DENTRO!
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
