import React from 'react';
import { useNavigate } from 'react-router-dom';
import { VolunteerModal } from './VolunteerModal';

const VolunteerSignup = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-urban-black pt-24 pb-20 px-4">
      <div className="max-w-6xl mx-auto text-center mb-10">
        <h1 className="font-display text-5xl md:text-6xl text-white mb-3">
          TEM LUGAR PRA <span className="text-urban-yellow">VOCÊ AQUI</span>
        </h1>
        <p className="font-urban text-gray-400 text-lg">
          Se o que você viveu com a Salve fez sentido pra você,
          <br />
          talvez seja hora de fazer parte disso.
        </p>
      </div>

      <div className="max-w-6xl mx-auto">
        <VolunteerModal embedded onClose={() => navigate('/voluntarios')} />
      </div>
    </div>
  );
};

export default VolunteerSignup;
