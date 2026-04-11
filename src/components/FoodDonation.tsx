import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBasket, MapPin, Calendar, Heart, X, Coffee, Utensils, ChevronDown, HeartHandshake } from 'lucide-react';
import { supabase } from '../supabase';
import { VolunteerModal } from './VolunteerModal';

const FoodDonation = () => {
  const [settings, setSettings] = useState<any>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVolunteerModalOpen, setIsVolunteerModalOpen] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from('settings').select('*').eq('id', 1).single();
      if (data) setSettings(data);
    };
    fetchSettings();

    const channel = supabase
      .channel('food-settings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, (p) => {
        if (p.new) setSettings(p.new);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const categories = [
    {
      icon: <Utensils size={32} className="text-urban-yellow mb-6" />,
      title: "A Base que Sustenta",
      desc: "O feijão com arroz de cada dia. Esses são os mantimentos essenciais que garantem que nenhuma panela fique vazia e que a refeição da família esteja sempre garantida.",
      tags: ["Arroz", "Feijão", "Macarrão", "Óleo"]
    },
    {
      icon: <Coffee size={32} className="text-urban-yellow mb-6" />,
      title: "O Desjejum e o Conforto",
      desc: "Para o café da manhã ou o momento de reunir a família. É o alento que traz energia para começar o dia e aquece o coração com dignidade.",
      tags: ["Açúcar", "Café", "Leite em pó", "Biscoitos"]
    },
    {
      icon: <Heart size={32} className="text-urban-yellow mb-6" />,
      title: "Cuidado e Nutrição",
      desc: "Os itens que complementam a refeição e trazem mais força, sabor e nutrição para as crianças e pais que lutam bravamente todos os dias.",
      tags: ["Enlatados", "Sardinha", "Molho de Tomate"]
    }
  ];
  const waysToServe = [
    {
      title: 'Presença no dia',
      description:
        'Servir na recepção, entrega de doações, cuidado com famílias e apoio em cada detalhe da ação.'
    },
    {
      title: 'Talentos e dons',
      description:
        'Compartilhar escuta, oração, cuidado pessoal, educação, arte, mídia ou qualquer talento que leve dignidade.'
    },
    {
      title: 'Bastidores e logística',
      description:
        'Ajudar na montagem, transporte, organização antes e depois, para que tudo aconteça com excelência.'
    }
  ];

  return (
    <div className="min-h-screen bg-urban-black pt-24 pb-20 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-24 items-center">
          <div>
            <div className="flex items-center gap-2 text-urban-yellow mb-4">
              <ShoppingBasket size={24} />
              <span className="font-urban font-bold text-sm tracking-widest uppercase">Ação Social / Arrecadação</span>
            </div>
            <h1 className="font-display text-6xl md:text-7xl text-white mb-6 leading-none">AJUDE QUEM <br /><span className="text-urban-yellow">PRECISA</span></h1>
            <p className="font-urban text-gray-400 text-lg mb-8 leading-relaxed">
              O SALVE é pra Jesus também é sobre amar o próximo de forma tangível. Durante nossos cultos a céu aberto, unimos forças para levar mantimentos e estender a mão para famílias em situação de vulnerabilidade.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-urban-gray rounded-full border border-white/10 text-white text-sm font-bold font-urban">
                <MapPin size={16} className="text-urban-yellow" /> NO LOCAL DO EVENTO
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-urban-gray rounded-full border border-white/10 text-white text-sm font-bold font-urban">
                <Calendar size={16} className="text-urban-yellow" /> DURANTE O CULTO
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-urban-yellow/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-urban-yellow/20 rounded-full blur-3xl pointer-events-none" />
            <div className="relative street-border rounded-[2.5rem] overflow-hidden aspect-square bg-urban-gray border-2 border-white/10 shadow-2xl">
              <img
                src="/imagens/7.png"
                alt="Ação Social"
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-urban-black via-transparent to-transparent opacity-80"></div>
              <div className="absolute bottom-6 left-6 font-display text-4xl text-urban-yellow tracking-widest drop-shadow-lg">
                DOE AMOR
              </div>
            </div>
          </div>
        </div>
        
        {/* Nova Seção de Categorias de Impacto */}
        <div className="mb-24">
          <p className="font-urban text-xs uppercase tracking-[0.22em] text-gray-500 mb-2 text-center">Possibilidades de Doação</p>
          <h2 className="font-display text-4xl md:text-5xl text-white mb-12 text-center tracking-tight">O QUE COMPÕE A <span className="text-urban-yellow">NOSSA MESA?</span></h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {categories.map((cat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-gradient-to-br from-urban-yellow/10 via-white/[0.03] to-transparent p-8 rounded-[2rem] border border-white/10 hover:border-urban-yellow/40 transition-colors flex flex-col"
              >
                {cat.icon}
                <h3 className="font-display text-3xl text-white mb-4 tracking-wide">{cat.title}</h3>
                <p className="font-urban text-gray-400 mb-8 leading-relaxed flex-grow">
                  {cat.desc}
                </p>
                <div className="flex flex-wrap gap-2 mt-auto">
                  {cat.tags.map(tag => (
                    <span key={tag} className="text-xs font-bold font-urban uppercase px-3 py-1 bg-black/25 text-gray-300 rounded-full border border-white/10">
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Novo CTA Principal */}
        <div className="text-center bg-urban-gray p-10 md:p-16 rounded-[2.5rem] border border-white/5 relative overflow-hidden flex flex-col items-center">
          <div className="absolute top-0 left-0 w-full h-2 bg-urban-yellow" />
          
          <h2 className="font-display text-4xl md:text-5xl text-white mb-6">SUA PRESENÇA TAMBÉM É <span className="text-urban-yellow">DOAÇÃO</span></h2>
          <p className="font-urban text-gray-400 text-lg md:text-xl max-w-3xl mx-auto mb-10 leading-relaxed font-light">
            Cada doação é mais do que um item: é cuidado em forma de gesto. Se você quer servir com a gente, escolha abaixo o próximo passo e venha fazer parte dessa missão.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto justify-center mb-10">
            <button 
              onClick={() => setIsVolunteerModalOpen(true)}
              className="px-8 py-4 bg-transparent text-white border-2 border-white/10 font-bold uppercase tracking-wider rounded-xl hover:bg-white/5 transition-transform hover:scale-105 active:scale-95 w-full md:w-auto text-center font-urban">
              QUERO SER VOLUNTÁRIO
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-8 py-4 bg-urban-yellow text-urban-black border-2 border-urban-yellow font-bold uppercase tracking-wider rounded-xl hover:bg-yellow-400 transition-transform hover:scale-105 active:scale-95 w-full md:w-auto text-center font-urban street-border flex items-center justify-center gap-2">
              <ChevronDown size={18} /> OUTRAS FORMAS DE AJUDAR
            </button>
          </div>
        </div>
      </div>

      {/* Modal / Dialog */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          >
            {/* Backdrop Blur overlay */}
            <div 
              className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
              onClick={() => setIsModalOpen(false)} 
            />
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 20 }} 
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-urban-gray p-8 sm:p-10 rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto relative z-10 border border-white/5 shadow-2xl custom-scrollbar"
            >
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="absolute top-6 right-6 text-gray-400 hover:text-urban-yellow transition-colors bg-white/5 hover:bg-white/10 p-2 rounded-full"
              >
                <X size={20} />
              </button>
              
              <h3 className="font-display text-4xl text-white mb-4">A MESA É <span className="text-urban-yellow">GRANDE</span></h3>
              <p className="font-urban text-gray-400 mb-8 leading-relaxed text-lg pb-6 border-b border-white/5">
                A nossa vocação é cuidar de vidas, e há sempre mais um jeito de amar. Se você não puder levar alimentos perecíveis no momento, existem muitas outras formas de estender a mão.
              </p>

              <div>
                <div className="mb-8 text-white">
                  <h4 className="font-display text-3xl tracking-wide">COMO VOCÊ PODE SERVIR</h4>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  {waysToServe.map((item) => (
                    <div key={item.title} className="rounded-2xl border border-white/10 bg-black/20 p-5">
                      <h5 className="font-display text-xl text-white mb-3">{item.title}</h5>
                      <p className="font-urban text-gray-400 leading-relaxed text-sm">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-12 pt-8 border-t border-white/5">
                <div className="bg-urban-yellow/5 border border-urban-yellow/20 rounded-3xl p-8 text-center">
                  <p className="font-display text-3xl text-white mb-2 tracking-tight">PRONTO PARA <span className="text-urban-yellow">FAZER PARTE?</span></p>
                  <p className="font-urban text-gray-400 text-sm mb-8 leading-relaxed">
                    Deixa seu nome e entraremos em contato pelo WhatsApp para combinar todos os detalhes.
                  </p>
                  <button
                    onClick={() => { setIsModalOpen(false); setIsVolunteerModalOpen(true); }}
                    className="w-full py-5 bg-urban-yellow text-urban-black font-bold text-xl uppercase tracking-widest rounded-2xl hover:bg-yellow-400 transition-all street-border flex items-center justify-center gap-3"
                  >
                    <HeartHandshake size={24} /> QUERO SER VOLUNTÁRIO
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <VolunteerModal isOpen={isVolunteerModalOpen} onClose={() => setIsVolunteerModalOpen(false)} />
    </div>
  );
};

export default FoodDonation;
