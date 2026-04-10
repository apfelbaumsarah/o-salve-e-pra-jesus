import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Cross, Heart, Play, Calendar, UserCheck, Flame } from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../supabase';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<any>({
    site_name: 'O SALVE E PRA JESUS',
    logo_url: ''
  });
  const location = useLocation();

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from('settings').select('*').eq('id', 1).single();
      if (data) setSettings(data);
    };
    fetchSettings();

    const channel = supabase
      .channel('navbar-settings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, (p) => {
        if (p.new) setSettings(p.new);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  const navItems = [
    { name: 'Inicio', path: '/', icon: Cross },
    { name: 'A História', path: '/historia', icon: Flame },
    { name: 'Vídeos', path: '/ao-vivo', icon: Play },
    { name: 'Oracao', path: '/oracao', icon: Heart },
    { name: 'Arrecadacao', path: '/arrecadacao', icon: Calendar },
    { name: 'O Salve', path: '/cadastro', icon: UserCheck },
  ];

  const siteName = settings.site_name || 'O SALVE E PRA JESUS';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-urban-black/80 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 md:h-24">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.svg" alt={siteName} className="h-12 md:h-16 w-auto object-contain" />
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'font-urban text-sm font-medium transition-colors hover:text-urban-yellow',
                  location.pathname === item.path ? 'text-urban-yellow' : 'text-gray-400'
                )}
              >
                {item.name}
              </Link>
            ))}
          </div>

          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-400 hover:text-white p-2">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-urban-gray border-b border-white/10">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-base font-medium',
                  location.pathname === item.path
                    ? 'bg-urban-yellow/10 text-urban-yellow'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                )}
              >
                <item.icon size={20} />
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
