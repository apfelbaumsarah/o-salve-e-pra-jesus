import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { VolunteerModal } from './VolunteerModal';

const Volunteers = () => {
  const [isVolunteerModalOpen, setIsVolunteerModalOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-urban-black pt-24 pb-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-urban-gray p-8 md:p-10 rounded-[2.5rem] border border-white/5 relative overflow-hidden mb-10">
          <div className="absolute top-0 left-0 w-full h-2 bg-urban-yellow" />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid lg:grid-cols-[1.2fr_0.8fr] gap-8 lg:gap-10 items-stretch"
          >
            <div className="text-left">
              <h1 className="font-display text-5xl md:text-6xl text-white mb-6 tracking-tight">
                A MESA É <span className="text-urban-yellow">GRANDE</span>
              </h1>
              <div className="space-y-4 font-urban text-base md:text-lg leading-relaxed text-gray-300">
                <p>
                  Jesus viveu de um jeito que não deixava ninguém invisível. Percebia quem precisava, tocava, cuidava e se envolvia de forma real. Não era um cuidado distante ou superficial, era presença de verdade.
                </p>
                <p>
                  E foi esse amor que o levou a se entregar na cruz por todos nós.
                </p>
                <p className="text-gray-100">
                  É esse coração que inspira tudo o que a gente faz aqui.
                </p>
              </div>
            </div>

            <div className="relative rounded-[2rem] overflow-hidden border border-white/10 aspect-square w-full">
              <img
                src="/banner-logo.png"
                alt="Voluntários da SALVE em ação"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="absolute bottom-0 p-6">
                <p className="font-display text-2xl text-white tracking-wide">Servir é amar com atitude</p>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-urban-gray/60 border border-white/10 rounded-[2rem] p-8 md:p-10"
          >
            <div className="mb-8">
              <p className="font-urban text-xs uppercase tracking-[0.22em] text-gray-500 mb-2">Possibilidades de Serviço</p>
              <h3 className="font-display text-3xl md:text-4xl text-white tracking-wide">Escolha seu lugar na missão</h3>
            </div>

            <div className="grid lg:grid-cols-2 gap-5">
              <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-urban-yellow/10 via-white/[0.03] to-transparent p-6 md:p-7">
                <div className="mb-5">
                  <span className="inline-flex px-3 py-1 rounded-full border border-urban-yellow/30 text-[11px] tracking-[0.2em] uppercase font-urban text-urban-yellow mb-3">Frente 01</span>
                  <h4 className="font-display text-2xl tracking-wide text-white">DOAÇÕES EXTRAS</h4>
                </div>
                <p className="font-urban text-gray-300 mb-4 text-sm leading-relaxed">
                  Sabe aquelas peças que já não contam mais a sua história, mas podem aquecer a de alguém nas ruas e favelas? Aceitamos:
                </p>
                <ul className="grid grid-cols-1 gap-3 text-sm text-gray-200 font-urban">
                  <li className="border border-white/10 bg-black/25 px-4 py-3 rounded-xl hover:border-urban-yellow/40 hover:bg-urban-yellow/5 transition-colors">Roupas em bom estado</li>
                  <li className="border border-white/10 bg-black/25 px-4 py-3 rounded-xl hover:border-urban-yellow/40 hover:bg-urban-yellow/5 transition-colors">Calçados higienizados</li>
                  <li className="border border-white/10 bg-black/25 px-4 py-3 rounded-xl hover:border-urban-yellow/40 hover:bg-urban-yellow/5 transition-colors">Cobertores e agasalhos</li>
                </ul>
              </div>

              <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-urban-yellow/10 via-white/[0.03] to-transparent p-6 md:p-7">
                <div className="mb-5">
                  <span className="inline-flex px-3 py-1 rounded-full border border-urban-yellow/30 text-[11px] tracking-[0.2em] uppercase font-urban text-urban-yellow mb-3">Frente 02</span>
                  <h4 className="font-display text-2xl tracking-wide text-white">SEUS TALENTOS CURAM</h4>
                </div>
                <p className="font-urban text-gray-300 mb-4 text-sm leading-relaxed">
                  Mais do que serviços, o que transforma vidas é presença, escuta e cuidado genuíno. Se você tem um dom para compartilhar, independente de qual é, há espaço aqui:
                </p>
                <ul className="grid grid-cols-1 gap-3 text-sm text-gray-200 font-urban">
                  <li className="border border-white/10 bg-black/25 px-4 py-3 rounded-xl hover:border-urban-yellow/40 hover:bg-urban-yellow/5 transition-colors">Escuta e Acolhimento</li>
                  <li className="border border-white/10 bg-black/25 px-4 py-3 rounded-xl hover:border-urban-yellow/40 hover:bg-urban-yellow/5 transition-colors">Psicologia / Aconselhamento</li>
                  <li className="border border-white/10 bg-black/25 px-4 py-3 rounded-xl hover:border-urban-yellow/40 hover:bg-urban-yellow/5 transition-colors">Educação e Reforço</li>
                  <li className="border border-white/10 bg-black/25 px-4 py-3 rounded-xl hover:border-urban-yellow/40 hover:bg-urban-yellow/5 transition-colors">Cabelo e Barba</li>
                </ul>
              </div>

              <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-urban-yellow/10 via-white/[0.03] to-transparent p-6 md:p-7 lg:col-span-2">
                <div className="mb-5">
                  <span className="inline-flex px-3 py-1 rounded-full border border-urban-yellow/30 text-[11px] tracking-[0.2em] uppercase font-urban text-urban-yellow mb-3">Frente 03</span>
                  <h4 className="font-display text-2xl tracking-wide text-white">FAZER PARTE DO MOVIMENTO</h4>
                </div>
                <p className="font-urban text-gray-300 mb-4 text-sm leading-relaxed">
                  A SALVE se sustenta por pessoas que decidiram dizer sim. Se você quer contribuir para que mais ações como essa aconteçam, há espaço pra você:
                </p>
                <ul className="grid md:grid-cols-2 gap-3 text-sm text-gray-200 font-urban">
                  <li className="border border-white/10 bg-black/25 px-4 py-3 rounded-xl hover:border-urban-yellow/40 hover:bg-urban-yellow/5 transition-colors">Divulgar o evento e ampliar o alcance nas redes</li>
                  <li className="border border-white/10 bg-black/25 px-4 py-3 rounded-xl hover:border-urban-yellow/40 hover:bg-urban-yellow/5 transition-colors">Ajudar na recepção e acolhimento do público no dia</li>
                  <li className="border border-white/10 bg-black/25 px-4 py-3 rounded-xl hover:border-urban-yellow/40 hover:bg-urban-yellow/5 transition-colors">Apoiar na logística, transporte e montagem do espaço</li>
                  <li className="border border-white/10 bg-black/25 px-4 py-3 rounded-xl hover:border-urban-yellow/40 hover:bg-urban-yellow/5 transition-colors">Contribuir financeiramente para as próximas edições</li>
                </ul>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-white/10 space-y-4">
              <p className="font-urban text-sm text-gray-300 leading-relaxed">
                A SALVE é uma iniciativa totalmente de pessoas. Não há empresa por trás, patrocínio fixo ou estrutura comercial:
                cada edição só acontece porque voluntários e apoiadores decidiram construir isso juntos.
              </p>
              <div className="flex flex-col md:flex-row gap-3">
              <button
                onClick={() => setIsVolunteerModalOpen(true)}
                className="px-8 py-4 bg-urban-yellow text-urban-black border-2 border-urban-yellow font-bold uppercase tracking-wider rounded-xl hover:bg-yellow-400 transition-transform hover:scale-105 active:scale-95 w-full md:w-auto text-center font-urban street-border"
              >
                QUERO CAMINHAR COM A SALVE
              </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <VolunteerModal isOpen={isVolunteerModalOpen} onClose={() => setIsVolunteerModalOpen(false)} />
    </div>
  );
};

export default Volunteers;
