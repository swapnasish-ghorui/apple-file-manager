import React, { useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  LayoutGrid,
  List,
  SlidersHorizontal,
  ChevronUp,
  ChevronDown,
  FolderPlus,
  RotateCw,
  Eye,
  EyeOff,
  UploadCloud,
  Cloud,
} from "lucide-react";
import clsx from "clsx";

export type ViewMode = "grid" | "list" | "columns";
export type SortKey = "name" | "size" | "modified" | "type";
export type SortDir = "asc" | "desc";

interface ToolbarProps {
  breadcrumbs: { label: string; path: string }[];
  onNavigate: (path: string) => void;
  canGoBack: boolean;
  canGoForward: boolean;
  onBack: () => void;
  onForward: () => void;
  viewMode: ViewMode;
  onViewMode: (mode: ViewMode) => void;
  searchQuery: string;
  onSearch: (q: string) => void;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
  onNewFolder?: () => void;
  onRefresh?: () => void;
  showHidden?: boolean;
  onToggleHidden?: () => void;
  onUpload?: (files: FileList) => void;
  onOpenR2Settings?: () => void;
  isCloud?: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  breadcrumbs,
  onNavigate,
  canGoBack,
  canGoForward,
  onBack,
  onForward,
  viewMode,
  onViewMode,
  searchQuery,
  onSearch,
  sortKey,
  sortDir,
  onSort,
  onNewFolder,
  onRefresh,
  showHidden = false,
  onToggleHidden,
  onUpload,
  onOpenR2Settings,
  isCloud = false,
}) => {
  const [showSort, setShowSort] = React.useState(false);
  const sortRef = React.useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setShowSort(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div
      className="h-12 flex items-center gap-2 px-3 border-b border-white/[0.06] flex-shrink-0 select-none"
      style={{ background: "rgba(36,36,38,0.95)" }}
    >
      {/* Back / Forward */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={onBack}
          disabled={!canGoBack}
          title="Back"
          className={clsx(
            "p-1.5 rounded-md transition-all",
            canGoBack
              ? "text-white/70 hover:text-white hover:bg-white/8 active:scale-95"
              : "text-white/20 cursor-not-allowed"
          )}
        >
          <ChevronLeft size={16} />
        </button>
        <button
          onClick={onForward}
          disabled={!canGoForward}
          title="Forward"
          className={clsx(
            "p-1.5 rounded-md transition-all",
            canGoForward
              ? "text-white/70 hover:text-white hover:bg-white/8 active:scale-95"
              : "text-white/20 cursor-not-allowed"
          )}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Cloud Actions (New Folder, Upload, Refresh) */}
      <div className="flex items-center gap-1 border-l border-white/10 pl-2">
        {onUpload && (
          <>
            <input
              type="file"
              ref={fileInputRef}
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  onUpload(e.target.files);
                  e.target.value = "";
                }
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Upload to Cloudflare R2 / Cloud Storage"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-sky-500/20 text-sky-400 hover:bg-sky-500 hover:text-white transition-all shadow-sm"
            >
              <UploadCloud size={14} />
              Upload
            </button>
          </>
        )}

        {onNewFolder && (
          <button
            onClick={onNewFolder}
            title="New Folder"
            className="p-1.5 rounded-md text-white/60 hover:text-white hover:bg-white/8 active:scale-95 transition-all"
          >
            <FolderPlus size={15} />
          </button>
        )}

        {onRefresh && (
          <button
            onClick={onRefresh}
            title="Refresh"
            className="p-1.5 rounded-md text-white/60 hover:text-white hover:bg-white/8 active:scale-95 transition-all"
          >
            <RotateCw size={14} />
          </button>
        )}

        {onToggleHidden && !isCloud && (
          <button
            onClick={onToggleHidden}
            title={showHidden ? "Hide Hidden Files" : "Show Hidden Files"}
            className={clsx(
              "p-1.5 rounded-md transition-all",
              showHidden
                ? "text-sky-400 bg-sky-500/15"
                : "text-white/40 hover:text-white hover:bg-white/8"
            )}
          >
            {showHidden ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>
        )}
      </div>

      {/* Breadcrumbs */}
      <div className="flex items-center gap-0 overflow-x-auto no-scrollbar flex-1 min-w-0 px-2">
        {breadcrumbs.map((crumb, i) => (
          <React.Fragment key={crumb.path || i}>
            {i > 0 && (
              <ChevronRight size={13} className="text-white/25 flex-shrink-0 mx-0.5" />
            )}
            <button
              onClick={() => onNavigate(crumb.path)}
              className={clsx(
                "text-xs font-medium truncate transition-colors px-1.5 py-0.5 rounded max-w-[150px]",
                i === breadcrumbs.length - 1
                  ? "text-white font-semibold bg-white/5"
                  : "text-white/45 hover:text-white/80 hover:bg-white/5"
              )}
            >
              {crumb.label}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Search */}
      <div className="relative w-44 flex-shrink-0">
        <Search
          size={13}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/35 pointer-events-none"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search files…"
          className="w-full h-7 pl-7 pr-3 text-xs rounded-lg bg-white/8 border border-white/8 text-white placeholder-white/30 outline-none focus:border-sky-500/50 focus:bg-white/10 transition-all"
        />
      </div>

      {/* View toggle */}
      <div className="flex items-center gap-0.5 bg-white/6 rounded-lg p-0.5 flex-shrink-0">
        {(["grid", "list"] as ViewMode[]).map((m) => (
          <button
            key={m}
            onClick={() => onViewMode(m)}
            title={`${m.toUpperCase()} View`}
            className={clsx(
              "p-1.5 rounded-md transition-all",
              viewMode === m
                ? "bg-white/15 text-white"
                : "text-white/40 hover:text-white/70"
            )}
          >
            {m === "grid" ? <LayoutGrid size={14} /> : <List size={14} />}
          </button>
        ))}
      </div>

      {/* Sort */}
      <div ref={sortRef} className="relative flex-shrink-0">
        <button
          onClick={() => setShowSort((v) => !v)}
          title="Sort Options"
          className={clsx(
            "p-1.5 rounded-md text-white/50 hover:text-white hover:bg-white/8 transition-all",
            showSort && "bg-white/10 text-white"
          )}
        >
          <SlidersHorizontal size={14} />
        </button>
        {showSort && (
          <div
            className="absolute right-0 top-9 z-50 w-44 rounded-xl border border-white/10 shadow-2xl overflow-hidden py-1"
            style={{ background: "rgba(40,40,42,0.98)", backdropFilter: "blur(20px)" }}
          >
            <div className="px-3 py-1.5 border-b border-white/8">
              <span className="text-[10px] font-semibold tracking-wider uppercase text-white/40">
                Sort By
              </span>
            </div>
            {(["name", "modified", "size", "type"] as SortKey[]).map((k) => (
              <button
                key={k}
                onClick={() => { onSort(k); setShowSort(false); }}
                className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-white/75 hover:text-white hover:bg-white/8 transition-colors capitalize text-left"
              >
                <span>{k === "modified" ? "Date Modified" : k}</span>
                {sortKey === k && (
                  sortDir === "asc"
                    ? <ChevronUp size={13} className="text-sky-400" />
                    : <ChevronDown size={13} className="text-sky-400" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* R2 Cloud Settings Button */}
      {onOpenR2Settings && (
        <button
          onClick={onOpenR2Settings}
          title="Cloudflare R2 Settings"
          className="p-1.5 rounded-md text-orange-400 hover:text-orange-300 hover:bg-orange-500/15 transition-all"
        >
          <Cloud size={15} />
        </button>
      )}
    </div>
  );
};
