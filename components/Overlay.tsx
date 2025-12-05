import React from 'react';
import { TreeState } from '../types';

interface OverlayProps {
  currentState: TreeState;
  onToggle: (state: TreeState) => void;
}

export const Overlay: React.FC<OverlayProps> = ({ currentState, onToggle }) => {
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 z-10">
      
      {/* Header */}
      <header className="flex flex-col items-center pt-4 opacity-0 animate-fade-in-down" style={{ animationFillMode: 'forwards' }}>
        <h1 className="font-display text-3xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-b from-[#FDD017] to-[#8B6508] drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] tracking-widest text-center">
          Christmas Tree
        </h1>
        <div className="h-0.5 w-32 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mt-4 mb-2 shadow-[0_0_20px_#D4AF37]"></div>
        <p className="font-luxury text-[#D4AF37] text-xs md:text-sm tracking-[0.4em] uppercase opacity-90 drop-shadow-md">
          The Ultimate Holiday Centerpiece
        </p>
      </header>

      {/* Controls */}
      <footer className="flex justify-center pb-10 pointer-events-auto">
        <button
          onClick={() => onToggle(currentState === TreeState.TREE_SHAPE ? TreeState.SCATTERED : TreeState.TREE_SHAPE)}
          className={`
            relative overflow-hidden group
            px-12 py-4
            border-2 border-[#D4AF37] 
            font-luxury text-sm md:text-base tracking-[0.2em] font-bold
            transition-all duration-700 ease-out
            backdrop-blur-sm
            ${currentState === TreeState.TREE_SHAPE 
              ? 'bg-[#D4AF37] text-[#01150f] shadow-[0_0_50px_rgba(212,175,55,0.7)]' 
              : 'bg-black/30 text-[#D4AF37] hover:bg-[#D4AF37]/20 hover:shadow-[0_0_30px_rgba(212,175,55,0.4)]'}
          `}
        >
          <span className="relative z-10">
            {currentState === TreeState.TREE_SHAPE ? 'RELEASE TO SCATTER' : 'ASSEMBLE FORM'}
          </span>
          {/* Shine effect */}
          <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-40 group-hover:animate-shine" />
        </button>
      </footer>

      {/* Styles for simple custom animations */}
      <style>{`
        @keyframes shine {
          100% {
            left: 125%;
          }
        }
        .animate-shine {
          animation: shine 1s;
        }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-down {
          animation: fadeInDown 1.8s cubic-bezier(0.22, 1, 0.36, 1);
        }
      `}</style>
    </div>
  );
};