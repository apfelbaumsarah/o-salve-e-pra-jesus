import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle } from 'lucide-react';
import { supabase } from '../supabase';
import { cn } from '../lib/utils';

const COLLECTION_OPTIONS = [
  'Cesta básica',
  'Roupas',
  'Calçados',
  'Cobertores / agasalhos',
  'Itens de higiene',
  'Brinquedos',
  'Outros',
];

export default function CollectionSignup() {
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [city, setCity] = useState('');
  const [pickupRegion, setPickupRegion] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = useMemo(
    () => Boolean(name.trim() && whatsapp.trim() && selectedItems.length > 0),
    [name, whatsapp, selectedItems.length],
  );

  const toggleOption = (value: string) => {
    setSelectedItems((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) {
      setError('Preencha nome, WhatsApp e selecione como quer ajudar na coleta.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const notesParts = [
        pickupRegion ? `Região para coleta: ${pickupRegion}` : '',
        notes ? `Observações: ${notes}` : '',
      ].filter(Boolean);

      const { error: supaError } = await supabase.from('collection_signups').insert([
        {
          name,
          whatsapp,
          city,
          how_to_help: ['Coleta de doações'],
          talents: selectedItems,
          pickup_region: pickupRegion || null,
          notes: notesParts.join(' | '),
        },
      ]);

      if (supaError) throw supaError;
      setIsSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Error saving collection signup:', err);
      setError('Não foi possível enviar agora. Tente novamente em instantes.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-urban-black flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-xl w-full p-10 rounded-3xl border border-white/10 bg-gradient-to-br from-urban-yellow/10 via-white/[0.03] to-transparent text-center"
        >
          <div className="flex justify-center mb-6">
            <div className="p-5 bg-urban-yellow/10 rounded-full text-urban-yellow">
              <CheckCircle size={64} />
            </div>
          </div>
          <h1 className="font-display text-5xl text-white mb-3">VOCÊ FAZ PARTE DISSO AGORA</h1>
          <p className="font-urban text-gray-300 text-base leading-relaxed">
            Obrigado por responder ao que você viveu aqui.
            <br />
            A gente vai falar com você.
            <br />
            E aquilo que começou... continua.
          </p>
          <p className="font-urban text-urban-yellow text-base leading-relaxed mt-5">
            "Deem, e será dado a vocês."
            <br />
            — Lucas 6:38
          </p>
          <a
            href="/arrecadacao"
            className="inline-block mt-8 px-8 py-4 bg-urban-yellow text-urban-black font-bold rounded-xl hover:bg-yellow-400 transition-all street-border"
          >
            VOLTAR PARA ARRECADAÇÃO
          </a>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-urban-black pt-24 pb-20 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-10 text-center">
          <p className="font-urban text-xs uppercase tracking-[0.22em] text-urban-yellow mb-2">
            ISSO NAO TERMINA AQUI
          </p>
          <h1 className="font-display text-5xl md:text-6xl text-white mb-4">
            O que começou aqui pode continuar{' '}
            <span className="text-urban-yellow">através de você.</span>
          </h1>
          <p className="font-urban text-gray-400 text-lg">
            Se você deseja contribuir com a missão, deixa seu contato.
          </p>
        </div>

        <AnimatePresence mode="wait">
          <motion.form
            key="collection-form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSubmit}
            className="p-8 md:p-10 rounded-3xl border border-white/10 bg-gradient-to-br from-urban-yellow/10 via-white/[0.03] to-transparent space-y-7"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block font-urban text-sm font-bold text-gray-400 uppercase mb-2">
                  Nome *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full bg-urban-black border border-white/10 rounded-xl px-4 py-4 text-white focus:border-urban-yellow outline-none"
                />
              </div>
              <div>
                <label className="block font-urban text-sm font-bold text-gray-400 uppercase mb-2">
                  WhatsApp *
                </label>
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="(00) 00000-0000"
                  className="w-full bg-urban-black border border-white/10 rounded-xl px-4 py-4 text-white focus:border-urban-yellow outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block font-urban text-sm font-bold text-gray-400 uppercase mb-2">
                  Cidade / Bairro
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ex: Campinas - Taquaral"
                  className="w-full bg-urban-black border border-white/10 rounded-xl px-4 py-4 text-white focus:border-urban-yellow outline-none"
                />
              </div>
              <div>
                <label className="block font-urban text-sm font-bold text-gray-400 uppercase mb-2">
                  Região para coleta
                </label>
                <input
                  type="text"
                  value={pickupRegion}
                  onChange={(e) => setPickupRegion(e.target.value)}
                  placeholder="Ex: Centro / Zona Norte"
                  className="w-full bg-urban-black border border-white/10 rounded-xl px-4 py-4 text-white focus:border-urban-yellow outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-urban text-sm font-bold text-gray-400 uppercase mb-3">
                Em que você quer ajudar na coleta? *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {COLLECTION_OPTIONS.map((option) => {
                  const active = selectedItems.includes(option);
                  return (
                    <button
                      type="button"
                      key={option}
                      onClick={() => toggleOption(option)}
                      className={cn(
                        'text-left px-4 py-3 rounded-xl border font-urban transition-all',
                        active
                          ? 'bg-urban-yellow text-urban-black border-urban-yellow font-bold'
                          : 'bg-urban-black text-gray-300 border-white/10 hover:border-urban-yellow/50',
                      )}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block font-urban text-sm font-bold text-gray-400 uppercase mb-2">
                Observações (opcional)
              </label>
              <textarea
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: consigo levar no sábado / tenho pouca quantidade agora"
                className="w-full bg-urban-black border border-white/10 rounded-xl px-4 py-4 text-white focus:border-urban-yellow outline-none resize-none"
              />
            </div>

            {error && <p className="text-urban-yellow text-sm font-bold text-center">{error}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-3 py-4 bg-urban-yellow text-urban-black font-bold rounded-xl hover:bg-yellow-400 transition-all street-border disabled:opacity-60"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-white" />
              ) : (
                'TÔ DENTRO'
              )}
            </button>
            <p className="text-center text-sm text-gray-400 font-urban">
              Nosso time vai te chamar pra te orientar da melhor forma.
            </p>
          </motion.form>
        </AnimatePresence>
      </div>
    </div>
  );
}
