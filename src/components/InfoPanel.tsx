import React from "react";
import {
  X,
  Star,
  Folder,
  Calendar,
  HardDrive,
  Clock,
} from "lucide-react";
import type { FileItem } from "../data/mockData";
import { FileIcon } from "./FileIcon";
import {
  formatFileSize,
  getFileTypeLabel,
  getFileColor,
} from "../utils/fileUtils";

interface InfoPanelProps {
  file: FileItem | null;
  onClose: () => void;
}

const InfoRow: React.FC<{
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}> = ({ label, value, icon }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[10px] font-semibold uppercase tracking-wider text-white/30">
      {label}
    </span>
    <div className="flex items-center gap-1.5 text-sm text-white/75">
      {icon && <span className="text-white/35">{icon}</span>}
      <span className="break-all">{value}</span>
    </div>
  </div>
);

export const InfoPanel: React.FC<InfoPanelProps> = ({ file, onClose }) => {
  if (!file) {
    return (
      <aside
        className="w-60 flex-shrink-0 border-l border-white/[0.06] flex flex-col items-center justify-center gap-3 text-white/20"
        style={{ background: "rgba(28,28,30,0.95)" }}
      >
        <div className="text-5xl">🔍</div>
        <p className="text-xs text-center">Select a file to see its details</p>
      </aside>
    );
  }

  const color = getFileColor(file.type);

  return (
    <aside
      className="w-60 flex-shrink-0 border-l border-white/[0.06] flex flex-col overflow-hidden"
      style={{ background: "rgba(28,28,30,0.95)" }}
    >
      {/* Header */}
      <div className="h-12 flex items-center justify-between px-4 border-b border-white/[0.06] flex-shrink-0">
        <span className="text-xs font-semibold text-white/50">Info</span>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-white/35 hover:text-white hover:bg-white/8 transition-all"
        >
          <X size={13} />
        </button>
      </div>

      {/* Preview area */}
      <div
        className="flex flex-col items-center pt-8 pb-6 px-4 gap-3"
        style={{
          background: `radial-gradient(circle at 50% 100%, ${color}18, transparent 70%)`,
        }}
      >
        {/* Big icon */}
        <div className="relative">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-xl"
            style={{
              background: `${color}15`,
              border: `1px solid ${color}30`,
            }}
          >
            <FileIcon type={file.type} size={52} />
          </div>
          {file.isFavorite && (
            <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center shadow-lg">
              <Star size={10} className="fill-white text-white" />
            </div>
          )}
        </div>

        {/* Name */}
        <div className="text-center">
          <h3 className="text-sm font-semibold text-white leading-tight break-all">
            {file.name}
          </h3>
          <span
            className="inline-block mt-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full"
            style={{ background: `${color}20`, color }}
          >
            {getFileTypeLabel(file.type)}
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-white/[0.06] mx-4" />

      {/* Details */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
        {file.size && (
          <InfoRow
            label="Size"
            value={formatFileSize(file.size)}
            icon={<HardDrive size={12} />}
          />
        )}

        <InfoRow
          label="Location"
          value={file.path.split("/").slice(0, -1).join("/") || "/"}
          icon={<Folder size={12} />}
        />

        <InfoRow
          label="Modified"
          value={file.modified.toLocaleString([], {
            dateStyle: "medium",
            timeStyle: "short",
          })}
          icon={<Clock size={12} />}
        />

        <InfoRow
          label="Created"
          value={file.created.toLocaleDateString([], { dateStyle: "medium" })}
          icon={<Calendar size={12} />}
        />

        {file.extension && (
          <InfoRow
            label="Extension"
            value={`.${file.extension.toUpperCase()}`}
          />
        )}

        {/* Tags placeholder */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-white/30">
            Tags
          </span>
          <div className="flex flex-wrap gap-1.5">
            {["Work", "Important"].map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-2 py-0.5 rounded-full bg-white/8 text-white/50"
              >
                {tag}
              </span>
            ))}
            <button className="text-[10px] px-2 py-0.5 rounded-full border border-dashed border-white/15 text-white/30 hover:text-white/50 hover:border-white/25 transition-all">
              + Add
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
