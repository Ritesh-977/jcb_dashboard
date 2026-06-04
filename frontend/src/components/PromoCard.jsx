import React from 'react';
import promoImage from '../assets/promo-image.jpeg';

const API_BASE = import.meta.env.PROD ? import.meta.env.VITE_API_URL : 'http://localhost:8000';

const PromoCard = ({ title, description, imageUrl }) => {
  const finalImageUrl = imageUrl 
    ? (imageUrl.startsWith('http') ? imageUrl : `${API_BASE}${imageUrl}`) 
    : promoImage;

  return (
    <div className="lg:col-span-4 col-span-1 flex flex-col gap-3 md:gap-4">
      <div className="bg-[#3972c1] rounded-xl p-4 md:p-6 text-white shadow-sm">
        <h2 className="text-xs md:text-sm font-bold uppercase mb-2 md:mb-4 leading-relaxed">{title}</h2>
        <p className="text-[10px] md:text-xs text-blue-100 leading-relaxed">{description}</p>
      </div>
      <div className="bg-white rounded-xl shadow-sm h-full min-h-[200px] md:min-h-[300px] flex items-center justify-center overflow-hidden border border-gray-300 p-2">
        <img src={finalImageUrl} alt="Promo campaign" className="w-full h-full object-contain rounded-lg" />
      </div>
    </div>
  );
};

export default PromoCard;
