import React from "react";
import {
  Clock,
  Home,
  Monitor,
  FileText,
  Download,
  Image,
  Music,
  Video,
  Star,
  HardDrive,
  Folder,
  Cloud,
  Settings,
  Sparkles,
} from "lucide-react";
import type { SidebarItem, FileItem } from "../data/mockData";
import type { R2Config, R2StorageStats } from "../services/api";
import { formatFileSize } from "../utils/fileUtils";
import clsx from "clsx";

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  favorites: (FileItem | string)[];
  locations?: SidebarItem[];
  drives?: { path: string; label: string; letter?: string }[];
  r2Config?: R2Config | null;
  r2Stats?: R2StorageStats | null;
  onOpenR2Settings?: () => void;
}

const iconMap: Record<string, React.ReactNode> = {
  cloud: <Cloud size={15} />,
  clock: <Clock size={15} />,
  home: <Home size={15} />,
  monitor: <Monitor size={15} />,
  "file-text": <FileText size={15} />,
  download: <Download size={15} />,
  image: <Image size={15} />,
  music: <Music size={15} />,
  video: <Video size={15} />,
  folder: <Folder size={15} />,
  "edit-3": <Sparkles size={15} />,
};

const colorMap: Record<string, string> = {
  cloud: "#38bdf8",
  clock: "#a78bfa",
  home: "#60a5fa",
  monitor: "#94a3b8",
  "file-text": "#60a5fa",
  download: "#34d399",
  image: "#c084fc",
  music: "#fb7185",
  video: "#f97316",
  folder: "#38bdf8",
  "edit-3": "#fbbf24",
};

interface SidebarSectionProps {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

const SidebarSection: React.FC<SidebarSectionProps> = ({ title, action, children }) => (
  <div className="mb-4">
    <div className="px-3 mb-1 flex items-center justify-between">
      <span className="text-[10px] font-semibold tracking-widest uppercase text-white/30">
        {title}
      </span>
      {action}
    </div>
    {children}
  </div>
);

interface SidebarLinkProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  iconColor?: string;
  badge?: string;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({
  icon,
  label,
  active,
  onClick,
  iconColor = "#60a5fa",
  badge,
}) => (
  <button
    onClick={onClick}
    className={clsx(
      "w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs transition-all duration-150 group no-select text-left",
      active
        ? "bg-white/10 text-white font-medium shadow-sm"
        : "text-white/60 hover:text-white/95 hover:bg-white/5"
    )}
  >
    <span style={{ color: active ? iconColor : undefined }} className="flex-shrink-0">
      {icon}
    </span>
    <span className="truncate flex-1">{label}</span>
    {badge && (
      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-white/10 text-white/40 font-mono">
        {badge}
      </span>
    )}
  </button>
);

export const Sidebar: React.FC<SidebarProps> = ({
  currentPath,
  onNavigate,
  favorites,
  locations,
  drives,
  r2Config,
  r2Stats,
  onOpenR2Settings,
}) => {
  const CLOUD_LOCATIONS = [
    { label: "iCloud / R2 Drive", icon: "cloud", path: "r2://", color: "#38bdf8" },
    { label: "Documents", icon: "file-text", path: "r2://Documents", color: "#60a5fa" },
    { label: "Photos", icon: "image", path: "r2://Photos", color: "#c084fc" },
    { label: "Videos", icon: "video", path: "r2://Videos", color: "#f97316" },
    { label: "Annotated", icon: "edit-3", path: "r2://Annotated", color: "#fbbf24" },
  ];

  const driveItems = drives && drives.length > 0 ? drives : [{ path: "C:\\", label: "Windows (C:)" }];

  const totalUsed = r2Stats?.totalBytes || 0;
  const quota = r2Stats?.quotaBytes || 10 * 1024 * 1024 * 1024;
  const usedPercent = Math.min(100, Math.max(1, (totalUsed / quota) * 100));

  return (
    <aside
      className="w-56 flex-shrink-0 h-full flex flex-col py-4 border-r border-white/[0.06] select-none"
      style={{ background: "rgba(24,24,26,0.96)" }}
    >
      {/* ── Virtual Cloud Storage ────────────────────────────────────────────── */}
      <SidebarSection
        title="Cloud Storage"
        action={
          onOpenR2Settings && (
            <button
              onClick={onOpenR2Settings}
              className="text-white/30 hover:text-white transition-colors"
              title="Cloudflare R2 Settings"
            >
              <Settings size={12} />
            </button>
          )
        }
      >
        {CLOUD_LOCATIONS.map((loc) => {
          const isAct = currentPath.toLowerCase() === loc.path.toLowerCase() ||
            (loc.path === "r2://" && (currentPath === "r2://" || currentPath === ""));
          return (
            <SidebarLink
              key={loc.path}
              icon={iconMap[loc.icon]}
              label={loc.label}
              active={isAct}
              onClick={() => onNavigate(loc.path)}
              iconColor={loc.color}
            />
          );
        })}
      </SidebarSection>

      {/* ── Local Windows Locations ──────────────────────────────────────────── */}
      {locations && locations.length > 0 && (
        <SidebarSection title="Local Laptop">
          {locations
            .filter((l) => !l.path.startsWith("r2://"))
            .map((item) => {
              const isAct = currentPath.toLowerCase() === item.path.toLowerCase();
              return (
                <SidebarLink
                  key={item.id || item.path}
                  icon={iconMap[item.icon] || <Folder size={15} />}
                  label={item.label}
                  active={isAct}
                  onClick={() => onNavigate(item.path)}
                  iconColor={colorMap[item.icon] || "#60a5fa"}
                />
              );
            })}
        </SidebarSection>
      )}

      {/* ── Pinned Favorites ─────────────────────────────────────────────────── */}
      {favorites.length > 0 && (
        <SidebarSection title="Pinned">
          {favorites.map((fav) => {
            const isStr = typeof fav === "string";
            const name = isStr ? fav.split(/[\\/]/).pop() || fav : fav.name;
            const favPath = isStr ? fav : fav.path;
            const isAct = currentPath.toLowerCase() === favPath.toLowerCase();
            return (
              <SidebarLink
                key={favPath}
                icon={<Star size={13} className="fill-amber-400 text-amber-400" />}
                label={name}
                active={isAct}
                onClick={() => onNavigate(favPath)}
                iconColor="#fbbf24"
              />
            );
          })}
        </SidebarSection>
      )}

      {/* ── Local Drives ─────────────────────────────────────────────────────── */}
      <SidebarSection title="Drives">
        {driveItems.map((drv) => {
          const isAct =
            currentPath.toLowerCase() === drv.path.toLowerCase() ||
            currentPath.toLowerCase() === drv.path.replace(/\\$/, "").toLowerCase();
          return (
            <SidebarLink
              key={drv.path}
              icon={<HardDrive size={15} />}
              label={drv.label}
              active={isAct}
              onClick={() => onNavigate(drv.path)}
              iconColor="#94a3b8"
            />
          );
        })}
      </SidebarSection>

      {/* ── Storage Status Indicator at Bottom ───────────────────────────────── */}
      <div className="mt-auto px-4 pt-3 border-t border-white/5">
        <div className="mb-1.5 flex justify-between items-center text-[10px]">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                r2Config?.isConfigured ? "bg-emerald-400 shadow-sm shadow-emerald-400" : "bg-sky-400"
              }`}
            />
            <span className="text-white/60 font-medium">
              {r2Config?.isConfigured ? "Cloudflare R2" : "Virtual Cloud"}
            </span>
          </div>
          <span className="text-white/40 font-mono">
            {formatFileSize(totalUsed)}
          </span>
        </div>

        <div className="h-1 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${usedPercent}%`,
              background: r2Config?.isConfigured
                ? "linear-gradient(90deg, #f97316, #eab308)"
                : "linear-gradient(90deg, #0ea5e9, #8b5cf6)",
            }}
          />
        </div>
        <p className="text-[9px] text-white/30 mt-1">10 GB Free Tier</p>
      </div>
    </aside>
  );
};
