import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Calendar, MapPin, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Banner {
  id: string;
  image_url: string;
  title: string;
  subtitle: string;
  order: number;
}

interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
}

const SCHEDULED_EVENT: Event = {
  id: 'evento-fixo-2026-04-21-14h',
  title: 'SALVE PRA JESUS',
  date: '2026-04-21T14:00:00-03:00',
  location: 'Concha Acústica Taquaral - Portão 2\nAv. Dr. Heitor Penteado, 1671 - Parque Taquaral, Campinas - SP, 13087-000',
  description: ''
};

const Home = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [loading, setLoading] = useState(true);

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
      const { data: bannersData } = await supabase
        .from('banners')
        .select('*')
        .eq('active', true)
        .order('order', { ascending: true });
      setBanners(bannersData || []);

      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true })
        .limit(3);
      setEvents(withScheduledEvent(eventsData || []));
      setLoading(false);
    };
    fetchData();

    const bannerChannel = supabase
      .channel('home-banners')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'banners' }, async () => {
        const { data } = await supabase.from('banners').select('*').eq('active', true).order('order', { ascending: true });
        setBanners(data || []);
      })
      .subscribe();

    const eventChannel = supabase
      .channel('home-events')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, async () => {
        const { data } = await supabase.from('events').select('*').order('date', { ascending: true }).limit(3);
        setEvents(withScheduledEvent(data || []));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(bannerChannel);
      supabase.removeChannel(eventChannel);
    };
  }, []);

  useEffect(() => {
    if (banners.length > 1) {
      const timer = setInterval(() => {
        setCurrentBanner((prev) => (prev + 1) % banners.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [banners.length]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-urban-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-urban-yellow"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-urban-black pt-16">
      <section className="relative h-[40vh] md:h-[50vh] overflow-hidden border-b-[8px] border-urban-yellow">
        <AnimatePresence mode="wait">
          {banners.length > 0 ? (
            <motion.div
              key={currentBanner}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-urban-black via-transparent to-transparent z-10" />
              <div className="absolute inset-0 bg-black/40 z-10" />
              <img
                src={banners[currentBanner].image_url}
                alt={banners[currentBanner].title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-4">
                <motion.h2
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="font-display text-4xl md:text-7xl text-white mb-2 tracking-tighter drop-shadow-2xl"
                >
                  {banners[currentBanner].title}
                </motion.h2>
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="font-urban text-base md:text-xl text-urban-yellow font-bold uppercase tracking-widest"
                >
                  {banners[currentBanner].subtitle}
                </motion.p>
              </div>
            </motion.div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-urban-gray">
              <div className="text-center">
                <h1 className="font-display text-4xl md:text-6xl text-white mb-4">O SALVE É PRA JESUS</h1>
                <p className="font-urban text-gray-400">EM BREVE NOVIDADES</p>
              </div>
            </div>
          )}
        </AnimatePresence>

        {banners.length > 1 && (
          <>
            <button
              onClick={() => setCurrentBanner((prev) => (prev - 1 + banners.length) % banners.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md text-white transition-all border border-white/10"
            >
              <ChevronLeft size={32} />
            </button>
            <button
              onClick={() => setCurrentBanner((prev) => (prev + 1) % banners.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md text-white transition-all border border-white/10"
            >
              <ChevronRight size={32} />
            </button>
          </>
        )}
      </section>

      <section className="max-w-7xl mx-auto px-4 py-12 md:py-16">
        <div className="py-2">
          <h1 className="font-display text-4xl md:text-6xl text-urban-yellow tracking-tight mb-4">
            O SALVE É REAL.
          </h1>
          <p className="font-urban text-gray-300 text-base md:text-xl leading-relaxed max-w-3xl">
            Não é sobre um dia, é sobre o que fica depois que as luzes apagam. O SALVE pra Jesus surgiu para ser voz em meio ao barulho. Uma geração, um propósito e a mesma verdade, falada do nosso jeito.
            <br />
            <br />
            Aqui você vê como tudo começou e para onde estamos indo.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
          <div>
            <h2 className="font-display text-5xl text-white mb-2">PRÓXIMOS <span className="text-urban-yellow">EVENTOS</span></h2>
            <p className="font-urban text-gray-400">Não perca o que Deus está fazendo em nossa cidade.</p>
          </div>
          <Link to="/historia" className="flex items-center gap-2 text-urban-yellow font-bold hover:underline">
            CONHECER A HISTÓRIA <ArrowRight size={20} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {events.length > 0 ? (
            events.map((event) => (
              <motion.div
                key={event.id}
                whileHover={{ y: -10 }}
                className="street-card p-6 rounded-xl border-l-4 border-l-urban-yellow"
              >
                <div className="flex items-center gap-2 text-urban-yellow mb-4">
                  <Calendar size={18} />
                  <span className="font-urban font-bold text-sm uppercase">
                    {event.date ? format(new Date(event.date), "dd 'de' MMMM '•' HH'h'", { locale: ptBR }) : 'Data em breve'}
                  </span>
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
            <div className="col-span-full text-center py-20 bg-urban-gray rounded-2xl border border-white/5">
              <p className="text-gray-500 font-urban">Nenhum evento agendado no momento.</p>
            </div>
          )}
        </div>
      </section>

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
            className="inline-block px-12 py-5 bg-urban-black text-white font-bold text-2xl rounded-xl street-border hover:scale-105 transition-transform"
          >
            FAZER MEU CADASTRO
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
