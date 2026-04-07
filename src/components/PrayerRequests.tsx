import React, { useState } from 'react';
import { supabase } from '../supabase';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Send, CheckCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const PrayerRequests = () => {
  const [formData, setFormData] = useState({ name: '', request: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.request) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const { error: supaError } = await supabase.from('prayer_requests').insert([formData]);
      if (supaError) throw supaError;
      setIsSuccess(true);
      setFormData({ name: '', request: '' });
    } catch (err: any) {
      console.error('Error adding prayer request:', err);
      setError('Ocorreu um erro ao enviar seu pedido. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-urban-black pt-24 pb-20 px-4">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-urban-yellow mb-8 transition-colors">
          <ArrowLeft size={20} /> VOLTAR PARA O INÍCIO
        </Link>

        <div className="street-card p-10 rounded-3xl border-t-8 border-t-urban-yellow">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-4 bg-urban-yellow/10 rounded-2xl text-urban-yellow">
              <Heart size={40} fill="currentColor" />
            </div>
            <div>
              <h1 className="font-display text-5xl text-white">PEDIDO DE <span className="text-urban-yellow">ORAÇÃO</span></h1>
              <p className="font-urban text-gray-400">Nossa equipe de intercessão estará orando por você.</p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {isSuccess ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <div className="flex justify-center mb-6">
                  <CheckCircle size={80} className="text-urban-yellow" />
                </div>
                <h2 className="font-display text-4xl text-white mb-4">PEDIDO RECEBIDO!</h2>
                <p className="font-urban text-gray-400 mb-8">
                  Deus ouve o seu clamor. Estaremos em oração pela sua vida e pela sua família.
                </p>
                <button
                  onClick={() => setIsSuccess(false)}
                  className="px-8 py-3 bg-urban-yellow text-urban-black font-bold rounded-xl hover:bg-yellow-500 transition-colors"
                >
                  ENVIAR OUTRO PEDIDO
                </button>
              </motion.div>
            ) : (
              <motion.form
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit}
                className="space-y-8"
              >
                <div>
                  <label className="block font-urban text-sm font-bold text-gray-400 uppercase mb-2">SEU NOME</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-urban-black border border-white/10 rounded-xl px-4 py-4 text-white focus:border-urban-yellow focus:ring-1 focus:ring-urban-yellow transition-all outline-none"
                    placeholder="Como você se chama?"
                  />
                </div>

                <div>
                  <label className="block font-urban text-sm font-bold text-gray-400 uppercase mb-2">SEU PEDIDO</label>
                  <textarea
                    rows={6}
                    value={formData.request}
                    onChange={(e) => setFormData({ ...formData, request: e.target.value })}
                    className="w-full bg-urban-black border border-white/10 rounded-xl px-4 py-4 text-white focus:border-urban-yellow focus:ring-1 focus:ring-urban-yellow transition-all outline-none resize-none"
                    placeholder="Conte-nos pelo que você precisa de oração..."
                  />
                </div>

                {error && (
                  <p className="text-urban-yellow text-sm font-bold text-center">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-3 py-5 bg-urban-yellow text-urban-black font-bold text-xl rounded-xl hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all street-border"
                >
                  {isSubmitting ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-white"></div>
                  ) : (
                    <>
                      <Send size={24} /> ENVIAR PEDIDO DE ORAÇÃO
                    </>
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm font-urban italic">
            "Pedi, e dar-se-vos-á; buscai, e encontrareis; batei, e abrir-se-vos-á." <br />
            <span className="font-bold">Mateus 7:7</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrayerRequests;
