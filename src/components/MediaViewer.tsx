import React, { useEffect } from "react";
import { X, Download, ExternalLink } from "lucide-react";
import type { FileItem } from "../data/mockData";
import { openNativeApp } from "../services/api";
import { formatFileSize, formatDate } from "../utils/fileUtils";

interface MediaViewerProps {
  file: FileItem;
  onClose: () => void;
}

export const MediaViewer: React.FC<MediaViewerProps> = ({ file, onClose }) => {
  const isImage = file.type === "image";
  const isVideo = file.type === "video";
  const isAudio = file.type === "audio";
  const rawUrl = `/api/file/raw?path=${encodeURIComponent(file.path)}`;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === " ") {
        onClose();
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col select-none"
      style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(16px)" }}
      onClick={onClose}
    >
      {/* Top bar */}
      <div
        className="h-12 flex items-center justify-between px-4 flex-shrink-0 border-b border-white/10"
        style={{ background: "rgba(24,24,26,0.96)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all"
          >
            <X size={16} />
          </button>
          <div>
            <p className="text-sm font-semibold text-white/90 truncate max-w-md">{file.name}</p>
            <p className="text-[10px] text-white/40">
              {file.size ? formatFileSize(file.size) : ""} · Modified {formatDate(file.modified)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {file.path && (
            <button
              onClick={() => openNativeApp(file.path)}
              title="Open in System Default App"
              className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all"
            >
              <ExternalLink size={15} />
            </button>
          )}
          <a
            href={rawUrl}
            download={file.name}
            title="Download"
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all"
          >
            <Download size={15} />
          </a>
        </div>
      </div>

      {/* Main View */}
      <div
        className="flex-1 flex items-center justify-center p-8 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {isImage && (
          <img
            src={rawUrl}
            alt={file.name}
            className="max-h-[82vh] max-w-[85vw] object-contain rounded-xl shadow-2xl ring-1 ring-white/10"
          />
        )}

        {isVideo && (
          <video
            src={rawUrl}
            controls
            autoPlay
            className="max-h-[80vh] max-w-[85vw] rounded-xl shadow-2xl ring-1 ring-white/10 bg-black"
          />
        )}

        {isAudio && (
          <div
            className="p-8 rounded-2xl border border-white/10 flex flex-col items-center gap-6 shadow-2xl"
            style={{ background: "rgba(36,36,38,0.95)", minWidth: "360px" }}
          >
            <div className="w-20 h-20 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center text-3xl shadow-inner">
              🎵
            </div>
            <div className="text-center">
              <h3 className="text-base font-semibold text-white">{file.name}</h3>
              <p className="text-xs text-white/40 mt-1">{file.size ? formatFileSize(file.size) : "Audio file"}</p>
            </div>
            <audio src={rawUrl} controls autoPlay className="w-full" />
          </div>
        )}
      </div>
    </div>
  );
};
