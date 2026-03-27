
import React from 'react';

export const Button = ({ children, variant = 'primary', className = '', ...props }: any) => {
  const base = "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:active:scale-100";
  const variants: any = {
    primary: "bg-[#1B2B5B] text-white hover:bg-[#152145] shadow-md",
    secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50",
    danger: "bg-red-600 text-white hover:bg-red-700 shadow-md",
    ghost: "text-slate-600 hover:bg-slate-100"
  };
  return <button className={`${base} ${variants[variant]} ${className}`} {...props}>{children}</button>;
};

export const Input = ({ label, error, className = '', ...props }: any) => (
  <div className="mb-4">
    {label && <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>}
    <input className={`w-full px-4 py-3 rounded-lg border ${error ? 'border-red-500' : 'border-slate-300'} focus:ring-2 focus:ring-[#1B2B5B] focus:outline-none bg-white text-right ${className}`} {...props} />
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
);

export const Card = ({ children, className = '', onClick }: any) => (
  <div onClick={onClick} className={`bg-white rounded-xl border border-slate-200 shadow-sm ${onClick ? 'cursor-pointer' : ''} ${className}`}>
    {children}
  </div>
);

export const Badge = ({ children, color = 'bg-slate-100 text-slate-800' }: any) => (
  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${color}`}>{children}</span>
);

// High Fidelity Branding for "Apex Health || IRAQ"
export const BrandLogo = ({ size = 'lg', className = '' }: { size?: 'sm' | 'lg', className?: string }) => {
  const isLarge = size === 'lg';

  // SVG composite to perfectly replicate the Apex logo with the Red X Accent
  // The Red accent is the upper-right arm of the X.
  
  return (
    <div className={`flex flex-col ${isLarge ? 'items-center' : 'items-start'} select-none ${className}`}>
      {/* Main Apex Text - Using SVG for perfect control over the X geometry 
          Added dir="ltr" to force English reading order (Ape -> X)
      */}
      <div className={`flex items-center ${isLarge ? 'h-24' : 'h-10'}`} dir="ltr">
         {/* 'Ape' Text */}
         <span className={`font-serif font-extrabold tracking-tighter text-[#1B2B5B] ${isLarge ? 'text-8xl' : 'text-3xl'} leading-none`}>
           Ape
         </span>
         
         {/* Custom X Construction */}
         <div className={`relative ${isLarge ? 'w-16 h-20 -ml-1' : 'w-6 h-8 -ml-0.5'}`}>
            {/* The X is constructed of two strokes. 
                Stroke 1: Top-Left to Bottom-Right (Blue)
                Stroke 2: Bottom-Left to Top-Right (Split Blue/Red)
            */}
            <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
               {/* Blue parts */}
               <path d="M20,0 L0,0 L80,100 L100,100 Z" fill="#1B2B5B" /> {/* TopLeft to BottomRight */}
               <path d="M0,100 L20,100 L50,60 L30,60 Z" fill="#1B2B5B" /> {/* BottomLeft to Center */}
               
               {/* Red Accent (Top Right Arm) */}
               <path d="M50,40 L70,40 L100,0 L80,0 Z" fill="#EF4444" /> {/* Center to TopRight */}
            </svg>
         </div>
      </div>
      
      {/* Subtitles Container */}
      <div className={`flex flex-col ${isLarge ? 'items-center mt-4 gap-1' : 'items-start ml-1 mt-1 gap-0'}`}>
        {/* English Subtitle */}
        <div className={`font-sans font-medium text-[#5d7285] tracking-[0.3em] uppercase flex items-center gap-3 ${isLarge ? 'text-xl' : 'text-[0.6rem]'}`} dir="ltr">
          Health 
          <span className="flex gap-1 text-slate-300 font-light">
            <span className="w-px h-4 bg-slate-300 block"></span>
            <span className="w-px h-4 bg-slate-300 block"></span>
          </span> 
          IRAQ
        </div>
        {/* Arabic Subtitle */}
        <div className={`font-cairo font-bold text-[#1B2B5B] tracking-wider mt-1 ${isLarge ? 'text-2xl' : 'text-[0.7rem]'}`}>
          ابيكــــس هيلــــث | العــــراق
        </div>
      </div>
    </div>
  );
};
