import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Instagram, Facebook, Youtube } from 'lucide-react';
import Navbar from './components/Navbar';
import Home from './components/Home';
import RegistrationForm from './components/RegistrationForm';
import AdminPanel from './components/AdminPanel';
import QRCodeDisplay from './components/QRCodeDisplay';
import LiveStream from './components/LiveStream';
import PrayerRequests from './components/PrayerRequests';
import FoodDonation from './components/FoodDonation';
import AboutTheSalve from './components/AboutTheSalve';
import Volunteers from './components/Volunteers';
import { supabase } from './supabase';

function App() {
  useEffect(() => {
    document.title = 'Salve pra Jesus | Movimento Cristão em Campinas';
    const fetchSettings = async () => {
      const { data } = await supabase.from('settings').select('site_name, google_fonts_url, font_family').eq('id', 1).single();
      if (!data) return;
      if (data.google_fonts_url) {
        let link = document.getElementById('custom-font-link') as HTMLLinkElement;
        if (!link) {
          link = document.createElement('link');
          link.id = 'custom-font-link';
          link.rel = 'stylesheet';
          document.head.appendChild(link);
        }
        link.href = data.google_fonts_url;
      }
      if (data.font_family) {
        document.body.style.fontFamily = `${data.font_family}, sans-serif`;
      }
    };
    fetchSettings();

    const channel = supabase
      .channel('app-settings')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'settings' }, async () => {
        fetchSettings();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-urban-black flex flex-col">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/cadastro" element={<RegistrationForm />} />
            <Route path="/ao-vivo" element={<LiveStream />} />
            <Route path="/oracao" element={<PrayerRequests />} />
            <Route path="/voluntarios" element={<Volunteers />} />
            <Route path="/arrecadacao" element={<FoodDonation />} />
            <Route path="/qrcode" element={<QRCodeDisplay />} />
            <Route path="/historia" element={<AboutTheSalve />} />
            <Route path="/admin" element={<AdminPanel />} />
          </Routes>
        </main>
        <footer className="bg-urban-gray pt-12 border-t border-white/5 text-center">
          <div className="max-w-7xl mx-auto px-4">
            <h3 className="font-display text-3xl text-white mb-4 tracking-wider">O SALVE <span className="text-urban-yellow">É PRA JESUS</span></h3>
            <p className="font-urban text-gray-500 text-sm mb-6">
              "Ide por todo o mundo, pregai o evangelho a toda criatura." <br />
              <span className="font-bold">Marcos 16:15</span>
            </p>
            <div className="flex justify-center gap-4 mb-8">
              <a href="https://www.instagram.com/salveprajesus" target="_blank" rel="noopener noreferrer" className="p-3 bg-white/5 border border-white/10 rounded-full text-gray-400 hover:text-urban-yellow hover:bg-urban-yellow/10 transition-all">
                <Instagram size={24} />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="p-3 bg-white/5 border border-white/10 rounded-full text-gray-400 hover:text-blue-500 hover:bg-blue-500/10 transition-all">
                <Facebook size={24} />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="p-3 bg-white/5 border border-white/10 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-all">
                <Youtube size={24} />
              </a>
            </div>
            <div className="text-gray-600 text-xs font-urban uppercase tracking-widest">
              &copy; {new Date().getFullYear()} O SALVE É PRA JESUS &bull; TODOS OS DIREITOS RESERVADOS
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
