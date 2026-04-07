import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowLeft, ArrowRight, Check, HeartHandshake } from 'lucide-react';
import { supabase } from '../supabase';
import { cn } from '../lib/utils';

// Opções de checklists
const HELP_OPTIONS = [
  "Levar doações (Alimentos e Agasalhos)",
  "Servir no dia da ação",
  "Ajudar na organização pré-evento",
  "Oferecer um talento especial",
  "Apoiar no transporte e logística"
];

const TALENT_OPTIONS = [
  { label: "Escuta e Acolhimento", icon: "🤝" },
  { label: "Psicologia / Aconselhamento", icon: "🧠" },
  { label: "Oração e Apoio Espiritual", icon: "✝️" },
  { label: "Educação / Reforço Escolar", icon: "📚" },
  { label: "Alimentação e Cozinha", icon: "🍳" },
  { label: "Fotografia / Mídia", icon: "📸" },
  { label: "Cabeleireiro / Barbeiro", icon: "✂️" },
  { label: "Música / Artes", icon: "🎵" },
];

const AVAILABILITY_OPTIONS = [
  "Posso ajudar no dia da ação",
  "Chego antes para ajudar a montar/organizar",
  "Posso ficar depois para desmontar"
];

const LOGISTICS_OPTIONS = [
  "Tenho carro/picape à disposição",
  "Posso dar carona para voluntários/doações"
];

export const VolunteerModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Estados do form
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [city, setCity] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  
  const [howToHelp, setHowToHelp] = useState<string[]>([]);
  const [talents, setTalents] = useState<string[]>([]);
  const [otherTalent, setOtherTalent] = useState('');
  const [availability, setAvailability] = useState<string[]>([]);
  const [logistics, setLogistics] = useState<string[]>([]);
  
  const [motivation, setMotivation] = useState('');
  const [notes, setNotes] = useState('');

  // Handlers
  const toggleArray = (setter: React.Dispatch<React.SetStateAction<string[]>>, val: string) => {
    setter(prev => prev.includes(val) ? prev.filter(i => i !== val) : [...prev, val]);
  };

  const nextStep = () => {
    if (step === 1 && (!name || !whatsapp)) {
      alert("Por favor, preencha nome e WhatsApp pra gente conseguir falar com você!");
      return;
    }
    setStep(prev => prev + 1);
  };

  const prevStep = () => setStep(prev => prev - 1);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    let finalTalents = [...talents];
    if (otherTalent) finalTalents.push(`[Outro] ${otherTalent}`);

    try {
      const { error } = await supabase.from('volunteers').insert([{
        name,
        age,
        city,
        whatsapp,
        how_to_help: howToHelp,
        talents: finalTalents,
        availability,
        logistics,
        motivation,
        notes
      }]);

      if (error) throw error;
      setIsSuccess(true);
    } catch (err) {
      console.error(err);
      alert('Ops! Deu um errinho de conexão. Tenta de novo?');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setIsSuccess(false);
    setStep(1);
    setName(''); setAge(''); setCity(''); setWhatsapp('');
    setHowToHelp([]); setTalents([]); setOtherTalent('');
    setAvailability([]); setLogistics([]); setMotivation(''); setNotes('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={isSuccess ? resetAndClose : onClose} />
          
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 30 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }} 
            exit={{ scale: 0.95, opacity: 0, y: 30 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-urban-black p-0 rounded-[2.5rem] w-full max-w-xl h-[85vh] max-h-[850px] relative z-10 border border-white/10 shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header + Barra de Progresso */}
            <div className="pt-8 px-8 pb-4 bg-urban-gray relative shrink-0">
              <button onClick={isSuccess ? resetAndClose : onClose} className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors bg-white/5 p-2 rounded-full">
                <X size={20} />
              </button>
              
              {!isSuccess && (
                <>
                  <div className="flex items-center gap-2 text-urban-yellow mb-2">
                    <HeartHandshake size={20} />
                    <span className="font-urban font-bold text-xs tracking-widest uppercase">Cadastro</span>
                  </div>
                  <h3 className="font-display text-4xl text-white">SOMA COM A GENTE</h3>
                  
                  {/* Progress Bar */}
                  <div className="w-full h-1 bg-white/10 mt-6 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-urban-yellow"
                      initial={{ width: '33%' }}
                      animate={{ width: `${(step / 3) * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar">
              
              {/* === SUCCESS STATE === */}
              {isSuccess ? (
                <div className="flex flex-col items-center justify-center text-center h-full py-8 space-y-6">
                  {/* Ícone com glow */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-urban-yellow/30 blur-2xl rounded-full scale-150" />
                    <div className="relative w-24 h-24 bg-urban-yellow/10 border-2 border-urban-yellow/30 rounded-full flex items-center justify-center">
                      <Check size={48} className="text-urban-yellow" strokeWidth={3} />
                    </div>
                  </div>

                  <div>
                    <p className="font-urban text-urban-yellow text-xs tracking-widest uppercase mb-2">Cadastro confirmado</p>
                    <h2 className="font-display text-6xl text-white leading-none">RECEBEMOS <span className="text-urban-yellow">VOCÊ!</span></h2>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-left space-y-3 w-full">
                    <p className="font-urban text-gray-300 text-sm leading-relaxed">
                      Mais do que uma inscrição finalizada, aqui começa uma nova etapa.
                    </p>
                    <p className="font-urban text-gray-400 text-sm leading-relaxed">
                      Em breve alguém da nossa equipe vai te chamar no WhatsApp para combinarmos os detalhes e você caminhar com a gente.
                    </p>
                  </div>

                  <button
                    onClick={resetAndClose}
                    className="w-full py-4 bg-urban-yellow text-urban-black font-bold uppercase tracking-widest rounded-2xl hover:bg-yellow-400 transition-all street-border font-urban text-base"
                  >
                    Até já! 🙌
                  </button>
                </div>
              ) : (
                
                <AnimatePresence mode="wait">
                  {/* === STEP 1: DADOS === */}
                  {step === 1 && (
                    <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                      <p className="font-urban text-gray-400 text-lg mb-8">Pra gente começar a caminhar junto.</p>
                      
                      <div>
                        <label className="block text-gray-400 text-sm font-bold font-urban mb-2">COMO A GENTE TE CHAMA?</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome ou apelido" className="w-full bg-urban-gray border border-white/5 rounded-xl px-5 py-4 text-white focus:border-urban-yellow focus:bg-white/5 outline-none transition-all font-urban text-lg" />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-gray-400 text-sm font-bold font-urban mb-2">SUA IDADE</label>
                          <input type="text" value={age} onChange={e => setAge(e.target.value)} placeholder="Ex: 25" className="w-full bg-urban-gray border border-white/5 rounded-xl px-5 py-4 text-white focus:border-urban-yellow focus:bg-white/5 outline-none transition-all font-urban text-lg" />
                        </div>
                        <div>
                          <label className="block text-gray-400 text-sm font-bold font-urban mb-2">QUAL WHATSAPP?</label>
                          <input type="tel" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="(DD) 9..." className="w-full bg-urban-gray border border-white/5 rounded-xl px-5 py-4 text-white focus:border-urban-yellow focus:bg-white/5 outline-none transition-all font-urban text-lg" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-gray-400 text-sm font-bold font-urban mb-2">DE ONDE VOCÊ É?</label>
                        <input type="text" value={city} onChange={e => setCity(e.target.value)} placeholder="Bairro / Cidade" className="w-full bg-urban-gray border border-white/5 rounded-xl px-5 py-4 text-white focus:border-urban-yellow focus:bg-white/5 outline-none transition-all font-urban text-lg" />
                      </div>

                    </motion.div>
                  )}

                  {/* === STEP 2: COMO AJUDAR === */}
                  {step === 2 && (
                    <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                      <p className="font-urban text-gray-400 text-lg mb-4">Todo mundo tem um jeito de cuidar. Qual é o seu?</p>
                      
                      <div>
                        <label className="block text-white text-lg font-display mb-4">ONDE VOCÊ GOSTARIA DE COLOCAR A MÃO NA MASSA?</label>
                        <div className="flex flex-col gap-2">
                          {HELP_OPTIONS.map(opt => (
                            <button key={opt} onClick={() => toggleArray(setHowToHelp, opt)} className={cn("text-left px-5 py-3 rounded-xl border transition-all font-urban flex items-center gap-3", howToHelp.includes(opt) ? "border-urban-yellow bg-urban-yellow/10 text-urban-yellow font-bold" : "border-white/5 bg-urban-gray text-gray-300 hover:border-white/20")}>
                              <div className={cn("w-5 h-5 rounded-md border flex items-center justify-center shrink-0", howToHelp.includes(opt) ? "bg-urban-yellow border-urban-yellow text-urban-black" : "border-gray-500 bg-transparent")}>
                                {howToHelp.includes(opt) && <Check size={14} strokeWidth={4} />}
                              </div>
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-white text-lg font-display mb-2">TEM ALGUM DON OU HABILIDADE PARA COMPARTILHAR?</label>
                        <p className="text-gray-500 text-sm font-urban mb-4">Seja escuta, aconselhamento, educação ou suporte prático — todo dom tem lugar aqui.</p>
                        <div className="flex flex-wrap gap-2">
                          {TALENT_OPTIONS.map(opt => (
                            <button key={opt.label} onClick={() => toggleArray(setTalents, opt.label)} className={cn("px-4 py-2 rounded-full border transition-all font-urban text-sm flex items-center gap-2", talents.includes(opt.label) ? "border-urban-yellow bg-urban-yellow text-urban-black font-bold" : "border-white/10 bg-urban-gray text-gray-300 hover:border-white/30")}>
                              <span>{opt.icon}</span> {opt.label}
                            </button>
                          ))}
                        </div>
                        <input type="text" value={otherTalent} onChange={e => setOtherTalent(e.target.value)} placeholder="Outro? Escreve aqui..." className="w-full bg-urban-gray border border-white/5 rounded-xl px-5 py-3 text-white focus:border-urban-yellow outline-none transition-all font-urban mt-3" />
                      </div>

                      <div>
                        <label className="block text-white text-lg font-display mb-4">COMO ESTÃO OS SEUS HORÁRIOS E LOGÍSTICA?</label>
                        <div className="flex flex-col gap-2 mb-2">
                          {AVAILABILITY_OPTIONS.map(opt => (
                            <button key={opt} onClick={() => toggleArray(setAvailability, opt)} className={cn("text-left px-5 py-3 rounded-xl border transition-all font-urban flex items-center gap-3", availability.includes(opt) ? "border-urban-yellow bg-urban-yellow/10 text-urban-yellow font-bold" : "border-white/5 bg-urban-gray text-gray-300")}>
                               <div className={cn("w-5 h-5 rounded-md border flex items-center justify-center shrink-0", availability.includes(opt) ? "bg-urban-yellow border-urban-yellow text-urban-black" : "border-gray-500 bg-transparent")}>
                                {availability.includes(opt) && <Check size={14} strokeWidth={4} />}
                              </div>
                              {opt}
                            </button>
                          ))}
                        </div>
                        <div className="flex flex-col gap-2">
                          {LOGISTICS_OPTIONS.map(opt => (
                             <button key={opt} onClick={() => toggleArray(setLogistics, opt)} className={cn("text-left px-5 py-3 rounded-xl border transition-all font-urban flex items-center gap-3", logistics.includes(opt) ? "border-blue-400 bg-blue-400/10 text-blue-400 font-bold" : "border-white/5 bg-urban-gray text-gray-300")}>
                              <div className={cn("w-5 h-5 rounded-md border flex items-center justify-center shrink-0", logistics.includes(opt) ? "bg-blue-400 border-blue-400 text-urban-black" : "border-gray-500 bg-transparent")}>
                                {logistics.includes(opt) && <Check size={14} strokeWidth={4} />}
                              </div>
                              {opt}
                             </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* === STEP 3: MOTIVAÇÃO === */}
                  {step === 3 && (
                    <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                      <p className="font-urban text-gray-400 text-lg mb-8">Mais do que braços, a gente precisa de coração.</p>

                      <div>
                        <label className="block text-white text-lg font-display mb-4">CONTA PRA GENTE: O QUE TE MOVE A ESTAR COM A GENTE NESSA?</label>
                        <textarea rows={5} value={motivation} onChange={e => setMotivation(e.target.value)} placeholder="Escreve do seu jeito..." className="w-full bg-urban-gray border border-white/5 rounded-xl px-5 py-4 text-white focus:border-urban-yellow focus:bg-white/5 outline-none transition-all font-urban text-lg custom-scrollbar resize-none" />
                      </div>

                      <div>
                        <label className="block text-white text-lg font-display mb-4 opacity-50">MAIS NENHUM DETALHE IMPORTANTE?</label>
                        <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Opcional. Ex: Tenho problema na coluna..." className="w-full bg-urban-gray border border-white/5 rounded-xl px-5 py-4 text-white focus:border-urban-yellow focus:bg-white/5 outline-none transition-all font-urban text-lg" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              )}
            </div>

            {/* Footer / Botões */}
            {!isSuccess && (
              <div className="bg-urban-gray p-6 border-t border-white/5 flex gap-4 shrink-0">
                {step > 1 && (
                  <button onClick={prevStep} className="px-6 py-4 rounded-xl text-white font-bold bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center">
                    <ArrowLeft size={20} />
                  </button>
                )}
                
                {step < 3 ? (
                  <button onClick={nextStep} className="flex-1 py-4 bg-urban-yellow text-urban-black font-bold uppercase tracking-widest rounded-xl hover:bg-yellow-500 transition-colors flex items-center justify-center gap-2">
                    Continuar <ArrowRight size={20} />
                  </button>
                ) : (
                  <button onClick={handleSubmit} disabled={isSubmitting} className="flex-1 py-4 bg-urban-yellow text-urban-black font-bold uppercase tracking-widest rounded-xl hover:bg-yellow-500 transition-colors flex items-center justify-center disabled:opacity-50">
                    {isSubmitting ? 'ENVIANDO...' : 'QUERO FAZER PARTE!'}
                  </button>
                )}
              </div>
            )}

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
