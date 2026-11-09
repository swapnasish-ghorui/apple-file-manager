import React from "react";
import { X, Minus, Maximize2 } from "lucide-react";
import { FinderLogo } from "./FinderLogo";

interface TitleBarProps {
  title: string;
}

export const TitleBar: React.FC<TitleBarProps> = ({ title }) => {
  return (
    <div
      className="h-11 flex items-center px-4 flex-shrink-0 relative select-none"
      style={{
        background: "rgba(28,28,30,0.98)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      {/* macOS-style traffic lights */}
      <div className="flex items-center gap-2 z-10">
        <button className="group w-3 h-3 rounded-full bg-red-500 hover:bg-red-400 transition-colors flex items-center justify-center">
          <X size={7} className="opacity-0 group-hover:opacity-100 text-red-900" strokeWidth={2.5} />
        </button>
        <button className="group w-3 h-3 rounded-full bg-amber-400 hover:bg-amber-300 transition-colors flex items-center justify-center">
          <Minus size={7} className="opacity-0 group-hover:opacity-100 text-amber-900" strokeWidth={2.5} />
        </button>
        <button className="group w-3 h-3 rounded-full bg-green-500 hover:bg-green-400 transition-colors flex items-center justify-center">
          <Maximize2 size={6} className="opacity-0 group-hover:opacity-100 text-green-900" strokeWidth={2.5} />
        </button>
      </div>

      {/* Centered: logo + title */}
      <div className="absolute inset-0 flex items-center justify-center gap-2 pointer-events-none">
        <FinderLogo size={22} />
        <span className="text-sm font-semibold text-white/65 tracking-tight">
          {title}
        </span>
      </div>
    </div>
  );
};
