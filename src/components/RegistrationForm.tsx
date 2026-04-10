import React, { useState } from 'react';
import { supabase } from '../supabase';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, Send } from 'lucide-react';
import { cn } from '../lib/utils';

export default function RegistrationForm() {
  const [formData, setFormData] = useState({
    name: '',
    whatsapp: '',
    email: '',
    city: '',
    neighborhood: '',
    accepted_jesus: false,
    wants_updates: false,
    prayer_request: '',
    attends_church: null as boolean | null,
    has_bible: null as boolean | null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [decisionChoice, setDecisionChoice] = useState<'today' | 'knowing' | 'already' | null>(null);

  const formatWhatsApp = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const isValidWhatsApp = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.length === 11;
  };

  const handleWhatsAppChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatWhatsApp(e.target.value);
    setFormData({ ...formData, whatsapp: formatted });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.whatsapp) {
      setError('Por favor, preencha os campos obrigatórios (Nome e WhatsApp).');
      return;
    }

    if (!decisionChoice) {
      setError('Por favor, nos responda a seção "SOBRE SUA DECISÃO COM JESUS HOJE".');
      return;
    }

    if (!isValidWhatsApp(formData.whatsapp)) {
      setError('Por favor, insira um WhatsApp válido com DDD (ex: 11 99999-9999).');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const finalData = { ...formData, accepted_jesus: decisionChoice === 'today' };
      const { error: supaError } = await supabase.from('registrations').insert([finalData]);
      if (supaError) throw supaError;
      setIsSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Error adding registration:', err);
      setError('Ocorreu um erro ao enviar seus dados. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-urban-black flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full street-card p-12 rounded-3xl text-center border-t-8 border-t-urban-yellow"
        >
          <div className="flex justify-center mb-8">
            <div className="p-6 bg-urban-yellow/10 rounded-full text-urban-yellow">
              <CheckCircle size={80} />
            </div>
          </div>
          <h2 className="font-display text-6xl text-white mb-4">GLÓRIA A DEUS!</h2>
          <p className="font-urban text-gray-400 text-lg mb-10">
            Seu cadastro foi realizado com sucesso. Que a paz de Jesus esteja com você!
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="w-full py-4 bg-urban-yellow text-urban-black font-bold text-xl rounded-xl hover:bg-yellow-500 transition-colors street-border"
          >
            VOLTAR PARA O INÍCIO
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-urban-black pt-24 pb-20 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="font-display text-7xl text-white mb-4">O SALVE É PRA <span className="text-urban-yellow">JESUS</span></h1>
          <p className="font-urban text-gray-400 text-xl">Deixe seus dados para mantermos contato e crescermos juntos.</p>
        </div>

        <form onSubmit={handleSubmit} className="street-card p-10 rounded-3xl space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="md:col-span-2">
              <label className="block font-urban text-sm font-bold text-gray-400 uppercase mb-2">NOME COMPLETO *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-urban-black border border-white/10 rounded-xl px-4 py-4 text-white focus:border-urban-yellow focus:ring-1 focus:ring-urban-yellow transition-all outline-none"
                placeholder="Seu nome completo"
              />
            </div>

            <div>
              <label className="block font-urban text-sm font-bold text-gray-400 uppercase mb-2">WHATSAPP *</label>
              <input
                type="tel"
                required
                value={formData.whatsapp}
                onChange={handleWhatsAppChange}
                maxLength={15}
                className="w-full bg-urban-black border border-white/10 rounded-xl px-4 py-4 text-white focus:border-urban-yellow focus:ring-1 focus:ring-urban-yellow transition-all outline-none"
                placeholder="(00) 00000-0000"
              />
            </div>

            <div>
              <label className="block font-urban text-sm font-bold text-gray-400 uppercase mb-2">E-MAIL (OPCIONAL)</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-urban-black border border-white/10 rounded-xl px-4 py-4 text-white focus:border-urban-yellow focus:ring-1 focus:ring-urban-yellow transition-all outline-none"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label className="block font-urban text-sm font-bold text-gray-400 uppercase mb-2">CIDADE</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full bg-urban-black border border-white/10 rounded-xl px-4 py-4 text-white focus:border-urban-yellow focus:ring-1 focus:ring-urban-yellow transition-all outline-none"
                placeholder="Sua cidade"
              />
            </div>

            <div>
              <label className="block font-urban text-sm font-bold text-gray-400 uppercase mb-2">BAIRRO</label>
              <input
                type="text"
                value={formData.neighborhood}
                onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                className="w-full bg-urban-black border border-white/10 rounded-xl px-4 py-4 text-white focus:border-urban-yellow focus:ring-1 focus:ring-urban-yellow transition-all outline-none"
                placeholder="Seu bairro"
              />
            </div>
          </div>

          
          <div className="space-y-4 pt-4 border-t border-white/5">
            <label className="block font-urban text-sm font-bold text-gray-400 uppercase mb-4">VOCÊ FREQUENTA ALGUMA IGREJA? *</label>
            <div className="flex flex-wrap gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, attends_church: true })}
                className={cn(
                  "flex-1 py-4 rounded-xl font-bold transition-all border-2",
                  formData.attends_church === true 
                    ? "bg-urban-yellow border-urban-yellow text-urban-black" 
                    : "bg-urban-black border-white/10 text-gray-400 hover:border-urban-yellow"
                )}
              >
                SIM
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, attends_church: false })}
                className={cn(
                  "flex-1 py-4 rounded-xl font-bold transition-all border-2",
                  formData.attends_church === false 
                    ? "bg-urban-yellow border-urban-yellow text-urban-black" 
                    : "bg-urban-black border-white/10 text-gray-400 hover:border-urban-yellow"
                )}
              >
                NÃO
              </button>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-white/5">
            <label className="block font-urban text-sm font-bold text-gray-400 uppercase mb-4">VOCÊ TEM UMA BÍBLIA EM CASA? *</label>
            <div className="flex flex-wrap gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, has_bible: true })}
                className={cn(
                  "flex-1 py-4 rounded-xl font-bold transition-all border-2",
                  formData.has_bible === true 
                    ? "bg-urban-yellow border-urban-yellow text-urban-black" 
                    : "bg-urban-black border-white/10 text-gray-400 hover:border-urban-yellow"
                )}
              >
                SIM
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, has_bible: false })}
                className={cn(
                  "flex-1 py-4 rounded-xl font-bold transition-all border-2",
                  formData.has_bible === false 
                    ? "bg-urban-yellow border-urban-yellow text-urban-black" 
                    : "bg-urban-black border-white/10 text-gray-400 hover:border-urban-yellow"
                )}
              >
                NÃO
              </button>
            </div>
          </div>


          <div className="space-y-4 pt-4 border-t border-white/5">
            <label className="block font-urban text-sm font-bold text-gray-400 uppercase mb-4">SOBRE SUA DECISÃO COM JESUS HOJE: *</label>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => setDecisionChoice('today')}
                className={cn(
                  "w-full text-left px-6 py-4 rounded-xl font-bold transition-all border-2",
                  decisionChoice === 'today' 
                    ? "bg-urban-yellow border-urban-yellow text-urban-black" 
                    : "bg-urban-black border-white/10 text-gray-400 hover:border-urban-yellow"
                )}
              >
                <span>TOMEI MINHA DECISÃO E ENTREGUEI MINHA VIDA A JESUS HOJE</span>
              </button>
              <button
                type="button"
                onClick={() => setDecisionChoice('knowing')}
                className={cn(
                  "w-full text-left px-6 py-4 rounded-xl font-bold transition-all border-2",
                  decisionChoice === 'knowing' 
                    ? "bg-urban-yellow border-urban-yellow text-urban-black" 
                    : "bg-urban-black border-white/10 text-gray-400 hover:border-urban-yellow"
                )}
              >
                <span>AINDA ESTOU CONHECENDO E QUERO SABER MAIS</span>
              </button>
              <button
                type="button"
                onClick={() => setDecisionChoice('already')}
                className={cn(
                  "w-full text-left px-6 py-4 rounded-xl font-bold transition-all border-2",
                  decisionChoice === 'already' 
                    ? "bg-urban-yellow border-urban-yellow text-urban-black" 
                    : "bg-urban-black border-white/10 text-gray-400 hover:border-urban-yellow"
                )}
              >
                <span>JÁ CAMINHO COM JESUS (SOU CRISTÃO)</span>
              </button>
            </div>
          </div>

          <div className="space-y-4 pt-4">

            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={formData.wants_updates}
                  onChange={(e) => setFormData({ ...formData, wants_updates: e.target.checked })}
                />
                <div className={cn(
                  "w-6 h-6 border-2 rounded transition-all flex items-center justify-center",
                  formData.wants_updates ? "bg-urban-yellow border-urban-yellow" : "border-gray-600 group-hover:border-urban-yellow"
                )}>
                  {formData.wants_updates && <CheckCircle size={16} className="text-white" />}
                </div>
              </div>
              <span
                className={cn(
                  "font-urban text-sm md:text-base px-3 py-1.5 rounded-lg border transition-all",
                  formData.wants_updates
                    ? "text-urban-yellow border-urban-yellow/40 bg-urban-yellow/10"
                    : "text-gray-200 border-white/10 bg-white/5 group-hover:border-urban-yellow/30"
                )}
              >
                Quero receber avisos dos próximos eventos
              </span>
            </label>
          </div>

          <div>
            <label className="block font-urban text-sm font-bold text-gray-400 uppercase mb-2">PEDIDO DE ORAÇÃO (OPCIONAL)</label>
            <textarea
              rows={4}
              value={formData.prayer_request}
              onChange={(e) => setFormData({ ...formData, prayer_request: e.target.value })}
              className="w-full bg-urban-black border border-white/10 rounded-xl px-4 py-4 text-white focus:border-urban-yellow focus:ring-1 focus:ring-urban-yellow transition-all outline-none resize-none"
              placeholder="Como podemos orar por você?"
            />
          </div>

          {error && (
            <p className="text-urban-yellow text-sm font-bold text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-3 py-5 bg-urban-yellow text-urban-black font-bold text-2xl rounded-xl hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all street-border"
          >
            {isSubmitting ? (
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-white"></div>
            ) : (
              <>
                <Send size={28} /> ENVIAR MEU SALVE
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
