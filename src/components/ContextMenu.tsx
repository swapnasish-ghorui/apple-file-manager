import React from "react";
import {
  Star,
  Trash2,
  FolderOpen,
  FileDown,
  Eye,
  ExternalLink,
  FolderSearch,
  Edit2,
  Copy,
} from "lucide-react";
import type { FileItem } from "../data/mockData";
import { formatFileSize, getFileTypeLabel } from "../utils/fileUtils";
import { FileIcon } from "./FileIcon";

interface ContextMenuProps {
  file: FileItem;
  position: { x: number; y: number };
  onClose: () => void;
  onOpen: () => void;
  onPreview: () => void;
  onToggleFavorite: () => void;
  onDelete: () => void;
  onOpenNative?: () => void;
  onRevealInExplorer?: () => void;
  onRename?: () => void;
  onDuplicate?: () => void;
  onCopyPath?: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  file,
  position,
  onClose,
  onOpen,
  onPreview,
  onToggleFavorite,
  onDelete,
  onOpenNative,
  onRevealInExplorer,
  onRename,
  onDuplicate,
  onCopyPath,
}) => {
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  // Adjust position to stay within viewport
  const style: React.CSSProperties = {
    position: "fixed",
    top: Math.min(position.y, window.innerHeight - 380),
    left: Math.min(position.x, window.innerWidth - 220),
    zIndex: 1000,
  };

  const Divider = () => <div className="h-px mx-2 my-1 bg-white/8" />;

  interface MenuItemProps {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    danger?: boolean;
    shortcut?: string;
  }

  const MenuItem: React.FC<MenuItemProps> = ({ icon, label, onClick, danger, shortcut }) => (
    <button
      onClick={() => {
        onClick();
        onClose();
      }}
      className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium transition-colors rounded-lg mx-1 ${
        danger
          ? "text-red-400 hover:bg-red-500/15 hover:text-red-300"
          : "text-white/80 hover:text-white hover:bg-white/8"
      }`}
      style={{ width: "calc(100% - 8px)" }}
    >
      <span className="flex-shrink-0 opacity-70">{icon}</span>
      <span className="flex-1 text-left truncate">{label}</span>
      {shortcut && <span className="text-[10px] text-white/30 flex-shrink-0 font-mono">{shortcut}</span>}
    </button>
  );

  const canPreview =
    file.type === "pdf" ||
    file.type === "document" ||
    file.type === "word" ||
    file.type === "presentation" ||
    file.type === "image" ||
    file.type === "text" ||
    file.type === "code";

  return (
    <div
      ref={menuRef}
      style={style}
      className="w-56 rounded-xl border border-white/10 shadow-2xl overflow-hidden py-1.5 select-none"
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Background glass */}
      <div
        className="absolute inset-0 rounded-xl"
        style={{
          background: "rgba(38,38,40,0.98)",
          backdropFilter: "blur(24px)",
        }}
      />
      <div className="relative z-10">
        {/* File header */}
        <div className="flex items-center gap-2.5 px-3 py-2 mb-1 border-b border-white/8">
          <FileIcon type={file.type} size={24} />
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-white/95 truncate">{file.name}</p>
            <p className="text-[10px] text-white/40">
              {file.size ? formatFileSize(file.size) : getFileTypeLabel(file.type)}
            </p>
          </div>
        </div>

        {/* Quick actions */}
        <MenuItem
          icon={<FolderOpen size={13} />}
          label={file.type === "folder" ? "Open Folder" : "Open in Viewer"}
          onClick={onOpen}
          shortcut="⏎"
        />

        {canPreview && file.type !== "folder" && (
          <MenuItem
            icon={<Eye size={13} />}
            label="Quick Look"
            onClick={onPreview}
            shortcut="Space"
          />
        )}

        {onOpenNative && (
          <MenuItem
            icon={<ExternalLink size={13} />}
            label="Open in System App"
            onClick={onOpenNative}
          />
        )}

        {onRevealInExplorer && (
          <MenuItem
            icon={<FolderSearch size={13} />}
            label="Show in Explorer"
            onClick={onRevealInExplorer}
          />
        )}

        <Divider />

        {onDuplicate && (
          <MenuItem
            icon={<FileDown size={13} />}
            label="Duplicate"
            onClick={onDuplicate}
            shortcut="⌘D"
          />
        )}

        {onRename && (
          <MenuItem
            icon={<Edit2 size={13} />}
            label="Rename…"
            onClick={onRename}
          />
        )}

        {onCopyPath && (
          <MenuItem
            icon={<Copy size={13} />}
            label="Copy Path"
            onClick={onCopyPath}
          />
        )}

        <Divider />

        <MenuItem
          icon={<Star size={13} className={file.isFavorite ? "fill-amber-400 text-amber-400" : ""} />}
          label={file.isFavorite ? "Remove from Pinned" : "Pin to Sidebar"}
          onClick={onToggleFavorite}
        />

        <Divider />

        <MenuItem
          icon={<Trash2 size={13} />}
          label="Delete"
          onClick={onDelete}
          danger
          shortcut="⌫"
        />
      </div>
    </div>
  );
};
