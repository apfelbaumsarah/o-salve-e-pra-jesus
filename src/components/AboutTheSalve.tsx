import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Flame, Heart, Users } from 'lucide-react';

const AboutTheSalve = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-urban-black pt-20">
      <section className="relative bg-urban-gray min-h-[90vh] flex items-center border-b border-white/5 overflow-hidden">
        <div className="absolute top-0 right-0 w-full md:w-1/2 h-full bg-urban-yellow/5 blur-3xl -z-0 rounded-full mix-blend-screen opacity-50 transform translate-x-1/4"></div>
        <div className="absolute bottom-0 left-0 w-full md:w-1/2 h-full bg-blue-500/5 blur-3xl -z-0 rounded-full mix-blend-screen opacity-30 transform -translate-x-1/4"></div>

        <div className="max-w-7xl mx-auto px-4 py-24 relative z-10 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 md:gap-24 items-start">
            
            {/* Texto Pesado e Emocional */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-urban-yellow/10 text-urban-yellow text-xs font-bold uppercase tracking-widest rounded-full border border-urban-yellow/20">
                <Flame size={14} /> O Testemunho
              </div>
              
              <h2 className="font-display text-5xl md:text-7xl text-white leading-[0.9] tracking-tighter">
                O RENASCIMENTO <br/> DA <span className="text-urban-yellow">SALVE</span>
              </h2>

              <div className="space-y-6 text-gray-400 font-urban text-lg leading-relaxed">
                <p>
                  A <strong className="text-white">SALVE</strong> começou como uma festa. Era um evento voltado para entretenimento, que cresceu, ganhou alcance e reuniu muitas pessoas, principalmente nas redes sociais.
                </p>
                <p>
                  Com o tempo, algo mudou de forma real. O fundador teve um encontro com Jesus, e isso transformou completamente a forma de enxergar tudo o que estava sendo construído. O que antes fazia sentido, já não fazia mais da mesma forma.
                </p>
                <p>
                  Não foi uma decisão de simplesmente encerrar, porque já existia um alcance e uma conexão com muitas pessoas. Mas também não fazia sentido continuar do mesmo jeito. A escolha foi <strong className="text-urban-yellow">dar um novo significado</strong> para aquilo que já existia.
                </p>
                <p>
                  A partir disso, a SALVE deixou de ser apenas um evento e passou a carregar um propósito diferente. Hoje, ela se tornou um movimento que busca criar um ambiente de encontro, onde a presença, o cuidado e a mensagem de Jesus são vividos de forma simples e acessível.
                </p>
                <p>
                  Não existe um formato fechado, nem uma exigência para fazer parte. Existe um convite aberto para estar presente, viver o momento e se aproximar de algo que vai além do que é visível.
                </p>
                <p>
                  A SALVE hoje não se define pelo que foi, mas pelo que <strong className="text-urban-yellow">decidiu se tornar</strong>: um espaço aberto, vivo e acessível, onde pessoas podem se encontrar, se aproximar e, de alguma forma, serem tocadas por Deus.
                </p>
                <p>
                  E talvez isso também diga muito sobre quem faz parte dela. Porque assim como a SALVE não se define pelo que já foi um dia, a gente também não.
                </p>
                <p>
                  São pessoas comuns, muitas vezes <strong className="text-urban-yellow">improváveis</strong>, que decidiram dizer sim e fazer parte de algo maior. Gente que talvez ninguém apostaria, mas que hoje está disponível para servir, construir e viver isso junto.
                </p>
                <p className="pt-4">
                  <strong className="text-urban-yellow">No fim, não é sobre quem a gente era, mas sobre o que Deus decidiu fazer a partir disso.</strong>
                </p>
              </div>
            </motion.div>

            {/* Grid de Ícones e Valores */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative lg:pt-32">
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                whileHover={{ y: -5 }}
                className="street-card bg-urban-black/80 backdrop-blur-xl border border-white/10 p-8 rounded-3xl"
              >
                <div className="w-14 h-14 bg-urban-yellow/10 text-urban-yellow rounded-2xl flex items-center justify-center mb-6">
                  <Heart size={28} />
                </div>
                <h4 className="font-display text-2xl text-white mb-2">PARA TODOS</h4>
                <p className="font-urban text-gray-500 text-sm leading-relaxed">
                  Não é sobre um tipo específico de pessoa. A SALVE é para quem já caminha na fé, para quem está recomeçando, para quem ainda está buscando ou simplesmente sente no coração que deve estar ali.
                </p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                whileHover={{ y: -5 }}
                className="street-card bg-urban-black/80 backdrop-blur-xl border border-white/10 p-8 rounded-3xl md:mt-12"
              >
                <div className="w-14 h-14 bg-[#00FF66]/10 text-[#00FF66] rounded-2xl flex items-center justify-center mb-6">
                  <Users size={28} />
                </div>
                <h4 className="font-display text-2xl text-white mb-2">FEITO POR PESSOAS</h4>
                <p className="font-urban text-gray-500 text-sm leading-relaxed">
                  Tudo acontece através de pessoas que decidiram caminhar juntas, contribuindo com o que têm e fazendo parte dessa construção e propósito de forma puramente voluntária.
                </p>
              </motion.div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutTheSalve;
