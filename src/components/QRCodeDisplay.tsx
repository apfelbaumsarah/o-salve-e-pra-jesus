import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'motion/react';
import { Download, ExternalLink, QrCode, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function QRCodeDisplay() {
  const appUrl = window.location.origin + '/cadastro';

  const downloadQRCode = () => {
    const svg = document.getElementById('qr-code-svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      }
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = 'qrcode-o-salve-e-pra-jesus.png';
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <div className="min-h-screen bg-urban-black pt-24 pb-20 px-4">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-urban-yellow mb-8 transition-colors">
          <ArrowLeft size={20} /> VOLTAR PARA O INÍCIO
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-urban-gray/80 p-8 md:p-10 rounded-[2.5rem] border border-white/10 relative overflow-hidden text-center"
          >
            <div className="absolute top-0 left-0 w-full h-1.5 bg-urban-yellow" />
            <div className="flex justify-center mb-8">
              <div className="p-4 bg-urban-yellow/10 rounded-2xl border border-urban-yellow/20 text-urban-yellow">
                <QrCode size={48} />
              </div>
            </div>
            
            <h1 className="font-display text-5xl text-white mb-4">QR CODE <span className="text-urban-yellow">DO EVENTO</span></h1>
            <p className="font-urban text-gray-400 mb-8">Aponte a câmera para acessar o formulário de cadastro.</p>

            <div className="bg-white p-6 rounded-2xl inline-block shadow-2xl mb-8">
              <QRCodeSVG 
                id="qr-code-svg"
                value={appUrl} 
                size={200}
                level="H"
                includeMargin={true}
              />
            </div>

            <div className="flex flex-col gap-4">
              <button 
                onClick={downloadQRCode}
                className="w-full flex items-center justify-center gap-2 py-4 bg-urban-yellow text-urban-black font-bold rounded-xl hover:bg-yellow-500 transition-all street-border"
              >
                <Download size={20} /> BAIXAR QR CODE
              </button>
              <button 
                onClick={() => window.open(appUrl, '_blank')}
                className="w-full flex items-center justify-center gap-2 py-4 bg-black/30 border border-white/10 text-white rounded-xl font-bold hover:bg-white/5 transition-all"
              >
                <ExternalLink size={20} /> TESTAR LINK
              </button>
            </div>
          </motion.div>

          <div className="space-y-5">
            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-urban-yellow/10 via-white/[0.03] to-transparent p-7">
              <h3 className="font-display text-3xl text-white mb-2">ONDE USAR?</h3>
              <p className="font-urban text-gray-400 text-sm">
                Imprima em banners, telões, panfletos ou crachás dos voluntários. 
                É a forma mais rápida de coletar dados no meio do povo.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-urban-yellow/10 via-white/[0.03] to-transparent p-7">
              <h3 className="font-display text-3xl text-white mb-2">DICA DE OURO</h3>
              <p className="font-urban text-gray-400 text-sm">
                Peça para os ministradores avisarem no microfone sobre o QR Code na hora do apelo. 
                Isso aumenta muito a taxa de conversão!
              </p>
            </div>

            <div className="bg-black/30 p-6 rounded-2xl border border-white/10">
              <p className="text-xs text-gray-500 font-urban uppercase mb-2">LINK DIRETO:</p>
              <code className="text-xs text-urban-yellow font-mono break-all">
                {appUrl}
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
