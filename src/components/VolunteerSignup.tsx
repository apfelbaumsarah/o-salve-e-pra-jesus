import React from 'react';
import { useNavigate } from 'react-router-dom';
import { VolunteerModal } from './VolunteerModal';

const VolunteerSignup = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-urban-black pt-24 pb-20 px-4">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="font-display text-5xl md:text-6xl text-white mb-3">
          FORMULÁRIO DE <span className="text-urban-yellow">VOLUNTÁRIOS</span>
        </h1>
        <p className="font-urban text-gray-400 text-lg">
          Preencha seu cadastro para servir com a SALVE.
        </p>
      </div>

      <VolunteerModal isOpen={true} onClose={() => navigate('/voluntarios')} />
    </div>
  );
};

export default VolunteerSignup;
