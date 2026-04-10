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
              <div className="rounded-3xl border border-cyan-300/20 bg-gradient-to-br from-cyan-400/10 via-cyan-300/5 to-transparent p-6 md:p-7">
                <div className="mb-5">
                  <span className="inline-flex px-3 py-1 rounded-full border border-cyan-300/25 text-[11px] tracking-[0.2em] uppercase font-urban text-cyan-200/80 mb-3">Frente 01</span>
                  <h4 className="font-display text-2xl tracking-wide text-cyan-100">DOAÇÕES EXTRAS</h4>
                </div>
                <p className="font-urban text-gray-300 mb-4 text-sm leading-relaxed">
                  Sabe aquelas peças que já não contam mais a sua história, mas podem aquecer a de alguém nas ruas e favelas? Aceitamos:
                </p>
                <ul className="grid grid-cols-1 gap-3 text-sm text-gray-200 font-urban">
                  <li className="border border-cyan-200/20 bg-black/25 px-4 py-3 rounded-xl">Roupas em bom estado</li>
                  <li className="border border-cyan-200/20 bg-black/25 px-4 py-3 rounded-xl">Calçados higienizados</li>
                  <li className="border border-cyan-200/20 bg-black/25 px-4 py-3 rounded-xl">Cobertores e agasalhos</li>
                </ul>
              </div>

              <div className="rounded-3xl border border-violet-300/20 bg-gradient-to-br from-violet-400/10 via-violet-300/5 to-transparent p-6 md:p-7">
                <div className="mb-5">
                  <span className="inline-flex px-3 py-1 rounded-full border border-violet-300/25 text-[11px] tracking-[0.2em] uppercase font-urban text-violet-200/80 mb-3">Frente 02</span>
                  <h4 className="font-display text-2xl tracking-wide text-violet-100">SEUS TALENTOS CURAM</h4>
                </div>
                <p className="font-urban text-gray-300 mb-4 text-sm leading-relaxed">
                  Mais do que serviços, o que transforma vidas é presença, escuta e cuidado genuíno. Se você tem um dom para compartilhar, independente de qual é, há espaço aqui:
                </p>
                <ul className="grid grid-cols-1 gap-3 text-sm text-gray-200 font-urban">
                  <li className="border border-violet-200/20 bg-black/25 px-4 py-3 rounded-xl">Escuta e Acolhimento</li>
                  <li className="border border-violet-200/20 bg-black/25 px-4 py-3 rounded-xl">Psicologia / Aconselhamento</li>
                  <li className="border border-violet-200/20 bg-black/25 px-4 py-3 rounded-xl">Educação e Reforço</li>
                  <li className="border border-violet-200/20 bg-black/25 px-4 py-3 rounded-xl">Cabelo e Barba</li>
                </ul>
              </div>

              <div className="rounded-3xl border border-emerald-300/20 bg-gradient-to-br from-emerald-400/10 via-emerald-300/5 to-transparent p-6 md:p-7 lg:col-span-2">
                <div className="mb-5">
                  <span className="inline-flex px-3 py-1 rounded-full border border-emerald-300/25 text-[11px] tracking-[0.2em] uppercase font-urban text-emerald-200/80 mb-3">Frente 03</span>
                  <h4 className="font-display text-2xl tracking-wide text-emerald-100">FAZER PARTE DO MOVIMENTO</h4>
                </div>
                <p className="font-urban text-gray-300 mb-4 text-sm leading-relaxed">
                  A SALVE se sustenta por pessoas que decidiram dizer sim. Se você quer contribuir para que mais ações como essa aconteçam, há espaço pra você:
                </p>
                <ul className="grid md:grid-cols-2 gap-3 text-sm text-gray-200 font-urban">
                  <li className="border border-emerald-200/20 bg-black/25 px-4 py-3 rounded-xl">Divulgar o evento e ampliar o alcance nas redes</li>
                  <li className="border border-emerald-200/20 bg-black/25 px-4 py-3 rounded-xl">Ajudar na recepção e acolhimento do público no dia</li>
                  <li className="border border-emerald-200/20 bg-black/25 px-4 py-3 rounded-xl">Apoiar na logística, transporte e montagem do espaço</li>
                  <li className="border border-emerald-200/20 bg-black/25 px-4 py-3 rounded-xl">Contribuir financeiramente para as próximas edições</li>
                </ul>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-white/10">
              <button
                onClick={() => setIsVolunteerModalOpen(true)}
                className="px-8 py-4 bg-urban-yellow text-urban-black border-2 border-urban-yellow font-bold uppercase tracking-wider rounded-xl hover:bg-yellow-400 transition-transform hover:scale-105 active:scale-95 w-full md:w-auto text-center font-urban street-border"
              >
                QUERO CAMINHAR COM A SALVE
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      <VolunteerModal isOpen={isVolunteerModalOpen} onClose={() => setIsVolunteerModalOpen(false)} />
    </div>
  );
};

export default Volunteers;
