import React from "react";
import { Star, MoreHorizontal } from "lucide-react";
import type { FileItem } from "../data/mockData";
import { FileIcon } from "./FileIcon";
import { formatFileSize, formatDate } from "../utils/fileUtils";
import clsx from "clsx";

interface FileGridProps {
  files: FileItem[];
  selected: string[];
  onSelect: (id: string, multi: boolean) => void;
  onOpen: (file: FileItem) => void;
  onContextMenu: (e: React.MouseEvent, file: FileItem) => void;
  onToggleFavorite: (file: FileItem) => void;
}

export const FileGrid: React.FC<FileGridProps> = ({
  files,
  selected,
  onSelect,
  onOpen,
  onContextMenu,
  onToggleFavorite,
}) => {
  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-white/25">
        <div className="text-6xl mb-4">🗂️</div>
        <p className="text-sm font-medium">This folder is empty</p>
      </div>
    );
  }

  return (
    <div className="p-4 grid gap-2"
      style={{ gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))" }}>
      {files.map((file) => {
        const isSelected = selected.includes(file.id);
        return (
          <div
            key={file.id}
            className={clsx(
              "group relative flex flex-col items-center gap-2 p-3 rounded-xl cursor-default transition-all duration-150 no-select",
              isSelected
                ? "bg-sky-500/20 ring-1 ring-sky-500/40"
                : "hover:bg-white/5"
            )}
            onClick={(e) => onSelect(file.id, e.metaKey || e.ctrlKey)}
            onDoubleClick={() => onOpen(file)}
            onContextMenu={(e) => onContextMenu(e, file)}
          >
            {/* Favorite star */}
            {file.isFavorite && (
              <button
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => { e.stopPropagation(); onToggleFavorite(file); }}
              >
                <Star size={12} className="fill-amber-400 text-amber-400" />
              </button>
            )}
            {!file.isFavorite && (
              <button
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => { e.stopPropagation(); onToggleFavorite(file); }}
              >
                <Star size={12} className="text-white/30 hover:text-amber-400 transition-colors" />
              </button>
            )}

            {/* Icon */}
            <div className="flex items-center justify-center w-16 h-16 rounded-xl transition-transform duration-150 group-hover:scale-105">
              <FileIcon type={file.type} size={52} />
            </div>

            {/* Name */}
            <div className="w-full text-center">
              <p className={clsx(
                "text-xs font-medium leading-tight break-all line-clamp-2",
                isSelected ? "text-white" : "text-white/80"
              )}>
                {file.name}
              </p>
              {file.size && (
                <p className="text-[10px] text-white/35 mt-0.5">
                  {formatFileSize(file.size)}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

interface FileListProps {
  files: FileItem[];
  selected: string[];
  onSelect: (id: string, multi: boolean) => void;
  onOpen: (file: FileItem) => void;
  onContextMenu: (e: React.MouseEvent, file: FileItem) => void;
  onToggleFavorite?: (file: FileItem) => void;
}

export const FileList: React.FC<FileListProps> = ({
  files,
  selected,
  onSelect,
  onOpen,
  onContextMenu,
  onToggleFavorite: _onToggleFavorite,
}) => {
  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-white/25">
        <div className="text-6xl mb-4">🗂️</div>
        <p className="text-sm font-medium">This folder is empty</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-2">
      {/* Header */}
      <div className="grid gap-4 px-3 py-1.5 mb-1 text-[10px] font-semibold uppercase tracking-wider text-white/30"
        style={{ gridTemplateColumns: "1fr 80px 120px 80px" }}>
        <span>Name</span>
        <span className="text-right">Size</span>
        <span>Modified</span>
        <span>Kind</span>
      </div>

      {/* Rows */}
      <div className="space-y-0.5">
        {files.map((file) => {
          const isSelected = selected.includes(file.id);
          return (
            <div
              key={file.id}
              className={clsx(
                "group grid gap-4 items-center px-3 py-2 rounded-lg cursor-default transition-all duration-100 no-select",
                isSelected
                  ? "bg-sky-500/20 ring-1 ring-sky-500/30"
                  : "hover:bg-white/5"
              )}
              style={{ gridTemplateColumns: "1fr 80px 120px 80px" }}
              onClick={(e) => onSelect(file.id, e.metaKey || e.ctrlKey)}
              onDoubleClick={() => onOpen(file)}
              onContextMenu={(e) => onContextMenu(e, file)}
            >
              {/* Name + icon */}
              <div className="flex items-center gap-2.5 overflow-hidden">
                <FileIcon type={file.type} size={20} />
                <span className={clsx(
                  "text-sm font-medium truncate",
                  isSelected ? "text-white" : "text-white/85"
                )}>
                  {file.name}
                </span>
                {file.isFavorite && (
                  <Star size={11} className="fill-amber-400 text-amber-400 flex-shrink-0" />
                )}
              </div>

              {/* Size */}
              <span className="text-xs text-white/40 text-right font-mono">
                {file.size ? formatFileSize(file.size) : "—"}
              </span>

              {/* Modified */}
              <span className="text-xs text-white/40">
                {formatDate(file.modified)}
              </span>

              {/* Kind */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/35 capitalize">
                  {file.type}
                </span>
                <button
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-white/40 hover:text-white transition-all"
                  onClick={(e) => { e.stopPropagation(); onContextMenu(e, file); }}
                >
                  <MoreHorizontal size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
