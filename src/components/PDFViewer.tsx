import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Download,
  Trash2,
  Highlighter,
  PanelRight,
  Check,
  Save,
  ExternalLink,
} from "lucide-react";
import type { FileItem } from "../data/mockData";
import { getAnnotations, saveAnnotations, openNativeApp } from "../services/api";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Highlight {
  id: string;
  page: number;
  /** position as % of the page container so zoom doesn't break them */
  xPct: number;
  yPct: number;
  wPct: number;
  hPct: number;
  color: string;
  text: string; // selected text snapshot
  createdAt: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const TOTAL_PAGES = 5;

const HIGHLIGHT_COLORS: { label: string; value: string; bg: string }[] = [
  { label: "Yellow",  value: "rgba(253,224,71,0.45)",   bg: "#fde047" },
  { label: "Green",   value: "rgba(74,222,128,0.4)",    bg: "#4ade80" },
  { label: "Blue",    value: "rgba(96,165,250,0.4)",    bg: "#60a5fa" },
  { label: "Pink",    value: "rgba(249,168,212,0.45)",  bg: "#f9a8d4" },
  { label: "Orange",  value: "rgba(251,146,60,0.4)",    bg: "#fb923c" },
  { label: "Purple",  value: "rgba(192,132,252,0.4)",   bg: "#c084fc" },
];

const DEFAULT_COLOR = HIGHLIGHT_COLORS[0];
const LS_KEY = (fileId: string) => `fm_highlights_${fileId}`;

// ─── LocalStorage helpers ─────────────────────────────────────────────────────

function loadHighlights(fileId: string): Highlight[] {
  try {
    const raw = localStorage.getItem(LS_KEY(fileId));
    return raw ? (JSON.parse(raw) as Highlight[]) : [];
  } catch {
    return [];
  }
}

function saveHighlights(fileId: string, highlights: Highlight[]) {
  try {
    localStorage.setItem(LS_KEY(fileId), JSON.stringify(highlights));
  } catch {
    // quota exceeded – silently ignore
  }
}

// ─── PDF page content (demo) ──────────────────────────────────────────────────

function getPageLines(page: number, filename: string): string[] {
  const title = filename.replace(".pdf", "");
  return [
    page === 1 ? title : `${title} — continued`,
    "",
    page === 1
      ? "This document contains important information related to the subject matter described in the title above. Please read carefully before proceeding."
      : "Continuing from the previous page, additional details are provided below for further analysis.",
    "",
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi aliquip.",
    "",
    "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
    "",
    "• Key point number one related to this section of the document",
    "• Another important consideration to keep in mind while reading",
    "• Third bullet point with additional context and supporting information",
    "• Fourth item that elaborates on the main topic in this section",
    "",
    page === 1
      ? "Section 1.1 — Introduction and Overview"
      : `Section ${page}.1 — Details and Analysis`,
    "",
    "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae.",
    "",
    "Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt neque porro.",
    "",
    "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint.",
  ];
}

// ─── PDFPage component ────────────────────────────────────────────────────────

interface PDFPageProps {
  page: number;
  filename: string;
  highlights: Highlight[];
  isHighlightMode: boolean;
  activeColor: string;
  onAddHighlight: (h: Highlight) => void;
  onDeleteHighlight: (id: string) => void;
  pageRef: React.RefObject<HTMLDivElement | null>;
}

const PDFPage: React.FC<PDFPageProps> = ({
  page,
  filename,
  highlights,
  isHighlightMode,
  activeColor,
  onAddHighlight,
  onDeleteHighlight,
  pageRef,
}) => {
  const lines = getPageLines(page, filename);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // On mouseup inside page, capture text selection
  const handleMouseUp = useCallback(() => {
    if (!isHighlightMode) return;

    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) return;

    const selectedText = sel.toString().trim();
    if (!selectedText) return;

    const range = sel.getRangeAt(0);
    const pageEl = pageRef.current;
    if (!pageEl) return;

    // Check selection is inside the page container
    if (!pageEl.contains(range.commonAncestorContainer)) return;

    const rangeRect = range.getBoundingClientRect();
    const pageRect = pageEl.getBoundingClientRect();

    // Convert to percentages relative to the page box
    const xPct = ((rangeRect.left - pageRect.left) / pageRect.width) * 100;
    const yPct = ((rangeRect.top - pageRect.top) / pageRect.height) * 100;
    const wPct = (rangeRect.width / pageRect.width) * 100;
    const hPct = (rangeRect.height / pageRect.height) * 100;

    // Guard against zero-size (happens on empty selection)
    if (wPct < 0.1 || hPct < 0.1) return;

    const newHighlight: Highlight = {
      id: `hl_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      page,
      xPct,
      yPct,
      wPct,
      hPct,
      color: activeColor,
      text: selectedText,
      createdAt: Date.now(),
    };

    onAddHighlight(newHighlight);
    sel.removeAllRanges();
  }, [isHighlightMode, activeColor, page, pageRef, onAddHighlight]);

  return (
    <div
      ref={pageRef}
      onMouseUp={handleMouseUp}
      className="relative bg-white rounded shadow-2xl mx-auto select-text"
      style={{
        width: "595px",
        minHeight: "842px",
        padding: "60px 70px",
        cursor: isHighlightMode ? "text" : "default",
        fontFamily: "Georgia, serif",
      }}
    >
      {/* Highlight overlay layer (renders behind text via mix-blend-mode) */}
      {highlights
        .filter((h) => h.page === page)
        .map((h) => (
          <div
            key={h.id}
            onMouseEnter={() => setHoveredId(h.id)}
            onMouseLeave={() => setHoveredId(null)}
            style={{
              position: "absolute",
              left: `${h.xPct}%`,
              top: `${h.yPct}%`,
              width: `${h.wPct}%`,
              height: `${h.hPct}%`,
              background: h.color,
              mixBlendMode: "multiply",
              borderRadius: "2px",
              pointerEvents: "all",
              zIndex: 10,
              transition: "opacity 0.15s",
            }}
          >
            {/* Delete button on hover */}
            {hoveredId === h.id && (
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDeleteHighlight(h.id);
                }}
                className="absolute -top-5 left-0 flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold text-white shadow-lg z-20 whitespace-nowrap"
                style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
                title="Remove highlight"
              >
                <Trash2 size={9} />
                Remove
              </button>
            )}
          </div>
        ))}

      {/* Page header */}
      <div className="mb-8 pb-4 border-b-2" style={{ borderColor: "#1a1a2e" }}>
        <div className="text-xl font-bold" style={{ color: "#1a1a2e" }}>
          {page === 1 ? filename.replace(".pdf", "") : ""}
        </div>
        <div className="text-xs mt-1" style={{ color: "#888" }}>
          Page {page} of {TOTAL_PAGES}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-3">
        {lines.map((line, i) => (
          <p
            key={i}
            className={
              line === ""
                ? "h-2"
                : line.startsWith("Section") ||
                  line.startsWith(filename.replace(".pdf", "")) ||
                  line.includes("continued")
                ? "font-bold text-sm"
                : line.startsWith("•")
                ? "ml-4 text-sm"
                : "text-sm"
            }
            style={{
              color: line === "" ? "transparent" : "#1a1a2e",
              lineHeight: 1.75,
              position: "relative",
              zIndex: 20,
            }}
          >
            {line}
          </p>
        ))}
      </div>

      {/* Footer */}
      <div
        className="mt-16 pt-4 border-t text-center text-xs"
        style={{ borderColor: "#ddd", color: "#aaa" }}
      >
        {filename} · Page {page}
      </div>
    </div>
  );
};

// ─── Highlights sidebar ───────────────────────────────────────────────────────

interface HighlightsSidebarProps {
  highlights: Highlight[];
  currentPage: number;
  onGoToPage: (page: number) => void;
  onDelete: (id: string) => void;
}

const HighlightsSidebar: React.FC<HighlightsSidebarProps> = ({
  highlights,
  currentPage: _currentPage,
  onGoToPage,
  onDelete,
}) => {
  if (highlights.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-white/25 px-4 text-center">
        <Highlighter size={28} />
        <p className="text-xs">
          No highlights yet. Select text in highlight mode to add one.
        </p>
      </div>
    );
  }

  // Group by page
  const byPage = highlights.reduce<Record<number, Highlight[]>>((acc, h) => {
    (acc[h.page] ??= []).push(h);
    return acc;
  }, {});

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {Object.entries(byPage)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([p, items]) => (
          <div key={p} className="border-b border-white/[0.06] last:border-0">
            <div className="px-3 py-2 sticky top-0 z-10"
              style={{ background: "rgba(28,28,30,0.95)" }}>
              <span className="text-[9px] font-bold tracking-widest uppercase text-white/30">
                Page {p}
              </span>
            </div>
            <div className="px-3 pb-2 space-y-1.5">
              {items.map((h) => (
                <div
                  key={h.id}
                  className="group flex items-start gap-2 p-2 rounded-lg cursor-pointer transition-colors hover:bg-white/5"
                  onClick={() => onGoToPage(Number(p))}
                >
                  {/* Color swatch */}
                  <div
                    className="w-2.5 h-2.5 rounded-sm flex-shrink-0 mt-1 ring-1 ring-black/10"
                    style={{ background: h.color.replace("0.4", "0.9").replace("0.45", "0.9") }}
                  />
                  {/* Text */}
                  <p className="flex-1 text-xs text-white/65 leading-relaxed line-clamp-3 italic">
                    "{h.text}"
                  </p>
                  {/* Delete */}
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(h.id); }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-white/30 hover:text-red-400 transition-all flex-shrink-0"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
    </div>
  );
};

// ─── Main PDFViewer ───────────────────────────────────────────────────────────

interface PDFViewerProps {
  file: FileItem;
  onClose: () => void;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({ file, onClose }) => {
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [isHighlightMode, setIsHighlightMode] = useState(false);
  const [activeColor, setActiveColor] = useState(DEFAULT_COLOR);
  const [highlights, setHighlights] = useState<Highlight[]>(() =>
    loadHighlights(file.id)
  );
  const [showSidebar, setShowSidebar] = useState(false);
  const [saveIndicator, setSaveIndicator] = useState<"idle" | "saving" | "saved">("idle");

  const pageRef = useRef<HTMLDivElement | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load backend annotations on mount
  useEffect(() => {
    if (file.path) {
      getAnnotations(file.path)
        .then((serverHls) => {
          if (Array.isArray(serverHls) && serverHls.length > 0) {
            setHighlights(serverHls);
          }
        })
        .catch(() => {});
    }
  }, [file.path]);

  // ── Autosave whenever highlights change ──────────────────────────────────────
  useEffect(() => {
    setSaveIndicator("saving");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveHighlights(file.id || file.path, highlights);
      if (file.path) {
        saveAnnotations(file.path, highlights).catch(() => {});
      }
      setSaveIndicator("saved");
      saveTimerRef.current = setTimeout(() => setSaveIndicator("idle"), 1800);
    }, 400); // 400ms debounce

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [highlights, file.id, file.path]);

  // ── Add highlight ────────────────────────────────────────────────────────────
  const handleAddHighlight = useCallback((h: Highlight) => {
    setHighlights((prev) => [...prev, h]);
    if (!showSidebar) {
      // Briefly pulse the sidebar button
    }
  }, [showSidebar]);

  // ── Delete highlight ─────────────────────────────────────────────────────────
  const handleDeleteHighlight = useCallback((id: string) => {
    setHighlights((prev) => prev.filter((h) => h.id !== id));
  }, []);

  // ── Keyboard shortcuts ───────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") setPage((p) => Math.max(p - 1, 1));
      if (e.key === "ArrowRight" || e.key === "ArrowDown") setPage((p) => Math.min(p + 1, TOTAL_PAGES));
      if ((e.metaKey || e.ctrlKey) && e.key === "h") { setIsHighlightMode((m) => !m); e.preventDefault(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const pageHighlightCount = highlights.filter((h) => h.page === page).length;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: "rgba(0,0,0,0.9)", backdropFilter: "blur(6px)" }}
    >
      {/* ── Top Bar ─────────────────────────────────────────────────────────── */}
      <div
        className="h-13 flex items-center gap-3 px-4 flex-shrink-0 border-b border-white/[0.07]"
        style={{ background: "rgba(22,22,24,0.99)", height: "52px" }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-white/45 hover:text-white hover:bg-white/10 transition-all flex-shrink-0"
        >
          <X size={16} />
        </button>

        {/* File info */}
        <div className="flex-shrink-0">
          <p className="text-sm font-semibold text-white/88 leading-tight">{file.name}</p>
          <p className="text-[10px] text-white/35">
            Page {page} / {TOTAL_PAGES}
            {pageHighlightCount > 0 && (
              <span className="ml-1.5 text-amber-400/70">
                · {pageHighlightCount} highlight{pageHighlightCount > 1 ? "s" : ""}
              </span>
            )}
          </p>
        </div>

        {/* Page navigation */}
        <div className="flex items-center gap-0.5 bg-white/[0.07] rounded-xl px-1 py-1 flex-shrink-0 ml-2">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all disabled:opacity-25 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={15} />
          </button>
          <span className="text-xs font-mono text-white/55 px-2 min-w-[52px] text-center">
            {page} / {TOTAL_PAGES}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(p + 1, TOTAL_PAGES))}
            disabled={page === TOTAL_PAGES}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all disabled:opacity-25 disabled:cursor-not-allowed"
          >
            <ChevronRight size={15} />
          </button>
        </div>

        {/* ── HIGHLIGHT TOOLBAR ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-1.5 ml-auto">
          {/* Highlight mode toggle */}
          <button
            onClick={() => setIsHighlightMode((m) => !m)}
            title="Toggle highlight mode (⌘H)"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              isHighlightMode
                ? "text-gray-900 shadow-lg shadow-amber-400/20"
                : "text-white/55 hover:text-white hover:bg-white/8"
            }`}
            style={isHighlightMode ? { background: activeColor.bg ?? "#fde047" } : {}}
          >
            <Highlighter size={14} />
            {isHighlightMode ? "Highlighting" : "Highlight"}
          </button>

          {/* Color swatches (only visible in highlight mode) */}
          {isHighlightMode && (
            <div className="flex items-center gap-1 bg-white/[0.07] rounded-xl px-2 py-1.5">
              {HIGHLIGHT_COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setActiveColor(c)}
                  title={c.label}
                  className="relative w-5 h-5 rounded-full transition-transform hover:scale-110 ring-offset-1 ring-offset-black"
                  style={{
                    background: c.bg,
                    outline:
                      activeColor.value === c.value
                        ? `2px solid ${c.bg}`
                        : "2px solid transparent",
                    outlineOffset: "2px",
                  }}
                >
                  {activeColor.value === c.value && (
                    <Check
                      size={10}
                      className="absolute inset-0 m-auto"
                      style={{ color: "rgba(0,0,0,0.6)" }}
                    />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Autosave indicator */}
          <div className={`flex items-center gap-1 text-[10px] transition-all duration-300 w-16 justify-center ${
            saveIndicator === "idle" ? "opacity-0" : "opacity-100"
          }`}>
            {saveIndicator === "saving" ? (
              <span className="text-white/35 animate-pulse">Saving…</span>
            ) : (
              <span className="text-emerald-400 flex items-center gap-1">
                <Save size={10} /> Saved
              </span>
            )}
          </div>

          <div className="w-px h-5 bg-white/10" />

          {/* Zoom */}
          <button
            onClick={() => setZoom((z) => Math.max(z - 15, 40))}
            className="p-1.5 rounded-lg text-white/45 hover:text-white hover:bg-white/8 transition-all"
          >
            <ZoomOut size={15} />
          </button>
          <span className="text-xs font-mono text-white/40 w-9 text-center">{zoom}%</span>
          <button
            onClick={() => setZoom((z) => Math.min(z + 15, 220))}
            className="p-1.5 rounded-lg text-white/45 hover:text-white hover:bg-white/8 transition-all"
          >
            <ZoomIn size={15} />
          </button>

          <div className="w-px h-5 bg-white/10" />

          {file.path && (
            <button
              onClick={() => openNativeApp(file.path)}
              title="Open in System Default Application"
              className="p-1.5 rounded-lg text-white/45 hover:text-white hover:bg-white/8 transition-all flex items-center gap-1 text-xs"
            >
              <ExternalLink size={14} />
            </button>
          )}

          <button className="p-1.5 rounded-lg text-white/45 hover:text-white hover:bg-white/8 transition-all" title="Download">
            <Download size={15} />
          </button>

          {/* Highlights panel toggle */}
          <button
            onClick={() => setShowSidebar((v) => !v)}
            title="Highlights panel"
            className={`relative p-1.5 rounded-lg transition-all ${
              showSidebar
                ? "bg-white/15 text-white"
                : "text-white/45 hover:text-white hover:bg-white/8"
            }`}
          >
            <PanelRight size={15} />
            {highlights.length > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full text-[8px] font-bold flex items-center justify-center text-white"
                style={{ background: activeColor.bg ?? "#fde047", color: "rgba(0,0,0,0.75)" }}
              >
                {highlights.length > 9 ? "9+" : highlights.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Body (PDF + optional sidebar) ───────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* PDF scroll area */}
        <div
          className="flex-1 overflow-auto relative"
          style={{ background: "#3a3a3c" }}
        >
          {/* Highlight mode banner */}
          {isHighlightMode && (
            <div
              className="sticky top-0 z-30 flex items-center justify-center gap-2 py-1.5 text-xs font-medium text-gray-900"
              style={{ background: activeColor.bg ?? "#fde047", opacity: 0.95 }}
            >
              <Highlighter size={12} />
              Select text to highlight · Press <kbd className="px-1 py-0.5 rounded text-[10px] bg-black/15 font-mono">Esc</kbd> to exit
            </div>
          )}

          {/* Page wrapper with zoom */}
          <div
            className="flex justify-center py-8"
            style={{
              transformOrigin: "top center",
              transform: `scale(${zoom / 100})`,
              minHeight:
                zoom < 100
                  ? `${(842 + 64) * (zoom / 100)}px`
                  : undefined,
            }}
          >
            <PDFPage
              page={page}
              filename={file.name}
              highlights={highlights}
              isHighlightMode={isHighlightMode}
              activeColor={activeColor.value}
              onAddHighlight={handleAddHighlight}
              onDeleteHighlight={handleDeleteHighlight}
              pageRef={pageRef}
            />
          </div>
        </div>

        {/* Highlights sidebar */}
        {showSidebar && (
          <div
            className="w-64 flex-shrink-0 border-l border-white/[0.07] flex flex-col overflow-hidden"
            style={{ background: "rgba(22,22,24,0.98)" }}
          >
            <div className="h-10 flex items-center justify-between px-3 border-b border-white/[0.06] flex-shrink-0">
              <div className="flex items-center gap-2">
                <Highlighter size={13} className="text-white/40" />
                <span className="text-xs font-semibold text-white/60">
                  Highlights
                </span>
                {highlights.length > 0 && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/10 text-white/45">
                    {highlights.length}
                  </span>
                )}
              </div>
              {highlights.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm("Remove all highlights from this document?")) {
                      setHighlights([]);
                    }
                  }}
                  className="text-[10px] text-white/25 hover:text-red-400 transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>
            <HighlightsSidebar
              highlights={highlights}
              currentPage={page}
              onGoToPage={setPage}
              onDelete={handleDeleteHighlight}
            />
          </div>
        )}
      </div>

      {/* ── Thumbnail strip ──────────────────────────────────────────────────── */}
      <div
        className="h-20 flex items-center gap-3 px-4 overflow-x-auto border-t border-white/[0.07] flex-shrink-0"
        style={{ background: "rgba(22,22,24,0.98)" }}
      >
        {Array.from({ length: TOTAL_PAGES }, (_, i) => i + 1).map((p) => {
          const hCount = highlights.filter((h) => h.page === p).length;
          return (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`relative flex-shrink-0 h-14 w-10 rounded-md overflow-hidden transition-all border-2 ${
                p === page
                  ? "border-sky-500 shadow-lg shadow-sky-500/25"
                  : "border-transparent opacity-50 hover:opacity-80"
              }`}
            >
              <div className="bg-white w-full h-full flex items-center justify-center">
                <span className="text-[8px] font-bold text-gray-400">{p}</span>
              </div>
              {/* Highlight dot indicator */}
              {hCount > 0 && (
                <div
                  className="absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full"
                  style={{ background: "#fde047", boxShadow: "0 0 4px #fde047" }}
                  title={`${hCount} highlight${hCount > 1 ? "s" : ""}`}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
