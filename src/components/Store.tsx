import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import storeImageOne from '../../imagens/store/1.png';
import storeImageTwo from '../../imagens/store/2.png';
import storeImageThree from '../../imagens/store/3.png';
import storeImageFour from '../../imagens/store/4.png';
import storeImageFive from '../../imagens/store/5.png';

const PRODUCT = {
  name: 'Camiseta Oficial O SALVE! é pra JESUS.',
  price: 'R$ 90,00',
  description: 'Modelo Oversized com estampa O SALVE! é pra JESUS',
};

const SIZES = ['P', 'M', 'G', 'GG'] as const;
const COLORS = ['BRANCA', 'PRETA', 'BEIGE', 'MARROM'] as const;
type Size = (typeof SIZES)[number];
type Color = (typeof COLORS)[number];
const DEFAULT_WHATSAPP_NUMBER = '5519983095193';
const PRODUCT_IMAGES = [`${storeImageTwo}?v=20260506-2`, storeImageOne, storeImageThree, storeImageFour, storeImageFive];

const Store = () => {
  const [selectedSize, setSelectedSize] = useState<Size | null>(null);
  const [selectedColor, setSelectedColor] = useState<Color | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const configuredWhatsappNumber = (import.meta.env.VITE_STORE_WHATSAPP_NUMBER as string | undefined)?.replace(/\D/g, '') ?? '';
  const whatsappNumber = configuredWhatsappNumber || DEFAULT_WHATSAPP_NUMBER;

  const whatsappLink = useMemo(() => {
    if (!selectedSize || !selectedColor || !whatsappNumber) return '';
    const message = `Oi, vim pelo site!\nEu gostaria de uma camiseta tamanho ${selectedSize}, na cor ${selectedColor}.`;
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
  }, [selectedSize, selectedColor, whatsappNumber]);

  const goToPreviousImage = () => {
    setSelectedImageIndex((prev) => (prev - 1 + PRODUCT_IMAGES.length) % PRODUCT_IMAGES.length);
  };

  const goToNextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % PRODUCT_IMAGES.length);
  };

  const handleImageTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    setTouchStartX(event.touches[0]?.clientX ?? null);
  };

  const handleImageTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX === null) return;

    const touchEndX = event.changedTouches[0]?.clientX ?? touchStartX;
    const deltaX = touchStartX - touchEndX;
    const minSwipeDistance = 40;

    if (deltaX > minSwipeDistance) {
      goToNextImage();
    } else if (deltaX < -minSwipeDistance) {
      goToPreviousImage();
    }

    setTouchStartX(null);
  };

  return (
    <section className="min-h-screen bg-urban-black pt-32 md:pt-36 pb-16">
      <div className="mx-auto max-w-[1240px] px-5 md:px-8">
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.03] px-4 py-2 text-xs uppercase tracking-[0.18em] text-white/80 hover:border-white/35 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            Voltar para home
          </Link>
        </div>

        <div className="grid items-start gap-8 md:grid-cols-[1.2fr_0.9fr] md:gap-12">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[72px_1fr] md:gap-6">
            <div className="hidden md:flex md:flex-col md:gap-3">
              {PRODUCT_IMAGES.map((imageSrc, index) => {
                const isActive = selectedImageIndex === index;
                return (
                  <button
                    key={`product-thumb-${index}`}
                    type="button"
                    onClick={() => setSelectedImageIndex(index)}
                    className={`overflow-hidden rounded-sm border transition-colors ${
                      isActive ? 'border-black' : 'border-black/20 hover:border-black/60'
                    }`}
                    aria-label={`Selecionar foto ${index + 1}`}
                  >
                    <img src={imageSrc} alt={`${PRODUCT.name} miniatura ${index + 1}`} className="h-full w-full object-cover" />
                  </button>
                );
              })}
            </div>
            <div
              className="relative overflow-hidden rounded-sm border border-white/15 bg-white touch-pan-y"
              onTouchStart={handleImageTouchStart}
              onTouchEnd={handleImageTouchEnd}
            >
              <div
                className="flex w-full transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${selectedImageIndex * 100}%)` }}
              >
                {PRODUCT_IMAGES.map((imageSrc, index) => (
                  <div key={`product-image-${index}`} className="w-full shrink-0">
                    <img src={imageSrc} alt={`${PRODUCT.name} foto ${index + 1}`} className="h-full w-full object-cover object-center" />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 md:hidden">
              {PRODUCT_IMAGES.map((_, index) => {
                const isActive = selectedImageIndex === index;
                return (
                  <button
                    key={`product-dot-${index}`}
                    type="button"
                    onClick={() => setSelectedImageIndex(index)}
                    className={`h-2.5 rounded-full transition-all ${
                      isActive ? 'w-6 bg-urban-yellow' : 'w-2.5 bg-white/45'
                    }`}
                    aria-label={`Ir para foto ${index + 1}`}
                  />
                );
              })}
            </div>
          </div>

          <div className="md:pt-1">
            <h1 className="max-w-xl font-display text-3xl leading-[1.1] text-white md:text-5xl">{PRODUCT.name}</h1>
            <p className="mt-5 max-w-lg font-urban text-sm leading-snug text-white/85 md:text-xl">{PRODUCT.description}</p>

            <div className="mt-6">
              <p className="mb-3 font-display text-2xl text-white md:text-3xl">TAMANHO</p>
              <div className="flex flex-wrap gap-3">
                {SIZES.map((size) => {
                  const isSelected = selectedSize === size;
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`h-10 min-w-10 rounded-sm border px-3 text-base font-medium transition-colors ${
                        isSelected
                          ? 'border-urban-yellow bg-urban-yellow text-urban-black'
                          : 'border-white/50 bg-transparent text-white hover:border-white'
                      }`}
                      aria-pressed={isSelected}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-5">
              <p className="mb-3 font-display text-2xl text-white md:text-3xl">COR</p>
              <div className="flex flex-wrap gap-3">
                {COLORS.map((color) => {
                  const isSelected = selectedColor === color;
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`h-10 rounded-sm border px-3 text-base font-medium transition-colors ${
                        isSelected
                          ? 'border-urban-yellow bg-urban-yellow text-urban-black'
                          : 'border-white/50 bg-transparent text-white hover:border-white'
                      }`}
                      aria-pressed={isSelected}
                    >
                      {color}
                    </button>
                  );
                })}
              </div>
            </div>

            <p className="mt-6 font-display text-4xl text-white md:text-5xl">{PRODUCT.price}</p>

            <a
              href={whatsappLink || undefined}
              target="_blank"
              rel="noopener noreferrer"
              className={`mt-7 inline-flex w-full items-center justify-center rounded-md px-8 py-4 text-2xl font-display transition-colors ${
                whatsappLink
                  ? 'bg-urban-yellow text-urban-black hover:bg-yellow-400'
                  : 'bg-urban-yellow/50 text-urban-black/80 cursor-not-allowed pointer-events-none'
              }`}
            >
              Adquirir
            </a>

          </div>
        </div>
      </div>
    </section>
  );
};

export default Store;
