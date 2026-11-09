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
} from "lucide-react";
import { SIDEBAR_ITEMS } from "../data/mockData";
import type { SidebarItem, FileItem } from "../data/mockData";
import clsx from "clsx";

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  favorites: (FileItem | string)[];
  locations?: SidebarItem[];
  drives?: { path: string; label: string; letter?: string }[];
}

const iconMap: Record<string, React.ReactNode> = {
  clock: <Clock size={15} />,
  home: <Home size={15} />,
  monitor: <Monitor size={15} />,
  "file-text": <FileText size={15} />,
  download: <Download size={15} />,
  image: <Image size={15} />,
  music: <Music size={15} />,
  video: <Video size={15} />,
  folder: <Folder size={15} />,
};

const colorMap: Record<string, string> = {
  clock: "#a78bfa",
  home: "#60a5fa",
  monitor: "#94a3b8",
  "file-text": "#60a5fa",
  download: "#34d399",
  image: "#c084fc",
  music: "#fb7185",
  video: "#f97316",
  folder: "#38bdf8",
};

interface SidebarSectionProps {
  title: string;
  children: React.ReactNode;
}

const SidebarSection: React.FC<SidebarSectionProps> = ({ title, children }) => (
  <div className="mb-5">
    <div className="px-3 mb-1">
      <span className="text-[10px] font-semibold tracking-widest uppercase text-white/30">
        {title}
      </span>
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
}

const SidebarLink: React.FC<SidebarLinkProps> = ({
  icon,
  label,
  active,
  onClick,
  iconColor = "#60a5fa",
}) => (
  <button
    onClick={onClick}
    className={clsx(
      "w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm transition-all duration-150 group no-select text-left",
      active
        ? "bg-white/10 text-white"
        : "text-white/60 hover:text-white/90 hover:bg-white/5"
    )}
  >
    <span style={{ color: active ? iconColor : undefined }} className="flex-shrink-0">{icon}</span>
    <span className="font-medium truncate">{label}</span>
  </button>
);

export const Sidebar: React.FC<SidebarProps> = ({
  currentPath,
  onNavigate,
  favorites,
  locations,
  drives,
}) => {
  const sidebarNavItems = locations && locations.length > 0 ? locations : SIDEBAR_ITEMS;
  const driveItems = drives && drives.length > 0 ? drives : [{ path: "C:\\", label: "Windows (C:)" }];

  return (
    <aside
      className="w-52 flex-shrink-0 h-full flex flex-col py-4 border-r border-white/[0.06] select-none"
      style={{ background: "rgba(28,28,30,0.95)" }}
    >
      {/* Locations */}
      <SidebarSection title="Favorites">
        {sidebarNavItems.map((item: SidebarItem) => {
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

      {/* Favorited Files */}
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
                icon={<Star size={14} className="fill-amber-400/80 text-amber-400" />}
                label={name}
                active={isAct}
                onClick={() => onNavigate(favPath)}
                iconColor="#fbbf24"
              />
            );
          })}
        </SidebarSection>
      )}

      {/* Devices / Drives */}
      <SidebarSection title="Drives">
        {driveItems.map((drv) => {
          const isAct = currentPath.toLowerCase() === drv.path.toLowerCase() ||
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

      {/* Storage indicator at bottom */}
      <div className="mt-auto px-4">
        <div className="mb-1.5 flex justify-between items-center">
          <span className="text-[10px] text-white/40">Local System</span>
          <span className="text-[10px] text-white/40 font-mono">Windows</span>
        </div>
        <div className="h-1 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: "55%",
              background: "linear-gradient(90deg, #0ea5e9, #8b5cf6)",
            }}
          />
        </div>
      </div>
    </aside>
  );
};
