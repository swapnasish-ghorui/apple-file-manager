import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Trash2,
  Highlighter,
  Pen,
  PanelRight,
  Check,
  ExternalLink,
} from "lucide-react";
import type { FileItem } from "../data/mockData";
import { getAnnotations, saveAnnotations, openNativeApp } from "../services/api";

// ─── Types ───────────────────────────────────────────────────────────────────

type PDFTool = "highlight" | "pen" | "rect" | "note";

interface Highlight {
  id: string;
  page: number;
  type?: PDFTool;
  xPct: number;
  yPct: number;
  wPct: number;
  hPct: number;
  color: string;
  text?: string;
  points?: { xPct: number; yPct: number }[]; // for freehand pen
  createdAt: number;
}

const TOTAL_PAGES = 5;

const HIGHLIGHT_COLORS = [
  { label: "Yellow", value: "rgba(253,224,71,0.45)", bg: "#fde047" },
  { label: "Green", value: "rgba(74,222,128,0.4)", bg: "#4ade80" },
  { label: "Blue", value: "rgba(96,165,250,0.4)", bg: "#60a5fa" },
  { label: "Pink", value: "rgba(249,168,212,0.45)", bg: "#f9a8d4" },
  { label: "Orange", value: "rgba(251,146,60,0.4)", bg: "#fb923c" },
  { label: "Purple", value: "rgba(192,132,252,0.4)", bg: "#c084fc" },
  { label: "Red", value: "rgba(239,68,68,0.5)", bg: "#ef4444" },
];

const DEFAULT_COLOR = HIGHLIGHT_COLORS[0];
const LS_KEY = (fileId: string) => `fm_highlights_${fileId}`;

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
  } catch {}
}

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
    page === 1 ? "Section 1.1 — Introduction and Overview" : `Section ${page}.1 — Details and Analysis`,
    "",
    "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae.",
    "",
    "Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt neque porro.",
  ];
}

// ─── PDF Page Component ───────────────────────────────────────────────────────

interface PDFPageProps {
  page: number;
  filename: string;
  highlights: Highlight[];
  activeTool: PDFTool | null;
  activeColor: string;
  onAddHighlight: (h: Highlight) => void;
  onDeleteHighlight: (id: string) => void;
  pageRef: React.RefObject<HTMLDivElement | null>;
}

const PDFPage: React.FC<PDFPageProps> = ({
  page,
  filename,
  highlights,
  activeTool,
  activeColor,
  onAddHighlight,
  onDeleteHighlight,
  pageRef,
}) => {
  const lines = getPageLines(page, filename);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPenPoints, setCurrentPenPoints] = useState<{ xPct: number; yPct: number }[]>([]);

  // Text selection highlight
  const handleMouseUp = useCallback(() => {
    if (activeTool !== "highlight") return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) return;

    const selectedText = sel.toString().trim();
    if (!selectedText) return;

    const range = sel.getRangeAt(0);
    const pageEl = pageRef.current;
    if (!pageEl || !pageEl.contains(range.commonAncestorContainer)) return;

    const rangeRect = range.getBoundingClientRect();
    const pageRect = pageEl.getBoundingClientRect();

    const xPct = ((rangeRect.left - pageRect.left) / pageRect.width) * 100;
    const yPct = ((rangeRect.top - pageRect.top) / pageRect.height) * 100;
    const wPct = (rangeRect.width / pageRect.width) * 100;
    const hPct = (rangeRect.height / pageRect.height) * 100;

    if (wPct < 0.1 || hPct < 0.1) return;

    onAddHighlight({
      id: `hl_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      page,
      type: "highlight",
      xPct,
      yPct,
      wPct,
      hPct,
      color: activeColor,
      text: selectedText,
      createdAt: Date.now(),
    });

    sel.removeAllRanges();
  }, [activeTool, activeColor, page, pageRef, onAddHighlight]);

  // Freehand Pen Drawing
  const handleMouseDown = (e: React.MouseEvent) => {
    if (activeTool !== "pen") return;
    const pageEl = pageRef.current;
    if (!pageEl) return;
    const rect = pageEl.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;
    setIsDrawing(true);
    setCurrentPenPoints([{ xPct, yPct }]);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || activeTool !== "pen") return;
    const pageEl = pageRef.current;
    if (!pageEl) return;
    const rect = pageEl.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;
    setCurrentPenPoints((prev) => [...prev, { xPct, yPct }]);
  };

  const handleMouseUpPen = () => {
    if (!isDrawing || activeTool !== "pen" || currentPenPoints.length < 2) {
      setIsDrawing(false);
      setCurrentPenPoints([]);
      return;
    }

    onAddHighlight({
      id: `pen_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      page,
      type: "pen",
      xPct: currentPenPoints[0].xPct,
      yPct: currentPenPoints[0].yPct,
      wPct: 0,
      hPct: 0,
      color: activeColor,
      points: currentPenPoints,
      createdAt: Date.now(),
    });

    setIsDrawing(false);
    setCurrentPenPoints([]);
  };

  const pageHighlights = highlights.filter((h) => h.page === page);

  return (
    <div
      ref={pageRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={() => {
        handleMouseUp();
        handleMouseUpPen();
      }}
      className="relative bg-white rounded shadow-2xl mx-auto select-text overflow-hidden"
      style={{
        width: "595px",
        minHeight: "842px",
        padding: "60px 70px",
        cursor: activeTool === "pen" ? "crosshair" : activeTool === "highlight" ? "text" : "default",
        fontFamily: "Georgia, serif",
      }}
    >
      {/* Freehand SVG Pen Layer */}
      <svg
        className="absolute inset-0 pointer-events-none z-20"
        style={{ width: "100%", height: "100%" }}
      >
        {pageHighlights
          .filter((h) => h.type === "pen" && h.points)
          .map((h) => (
            <path
              key={h.id}
              d={`M ${h.points!.map((p) => `${p.xPct * 5.95} ${p.yPct * 8.42}`).join(" L ")}`}
              stroke={h.color}
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              opacity="0.85"
            />
          ))}

        {/* Current drawing preview */}
        {isDrawing && currentPenPoints.length > 1 && (
          <path
            d={`M ${currentPenPoints.map((p) => `${p.xPct * 5.95} ${p.yPct * 8.42}`).join(" L ")}`}
            stroke={activeColor}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        )}
      </svg>

      {/* Highlights Overlay Layer */}
      {pageHighlights
        .filter((h) => h.type === "highlight" || !h.type)
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
              zIndex: 15,
            }}
          >
            {hoveredId === h.id && (
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDeleteHighlight(h.id);
                }}
                className="absolute -top-5 left-0 flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold text-white shadow-lg z-30 whitespace-nowrap"
                style={{ background: "rgba(0,0,0,0.85)" }}
              >
                <Trash2 size={9} /> Remove
              </button>
            )}
          </div>
        ))}

      {/* Page Header */}
      <div className="mb-8 pb-4 border-b-2" style={{ borderColor: "#1a1a2e" }}>
        <div className="text-xl font-bold" style={{ color: "#1a1a2e" }}>
          {page === 1 ? filename.replace(".pdf", "") : ""}
        </div>
        <div className="text-xs mt-1 text-gray-500">
          Page {page} of {TOTAL_PAGES}
        </div>
      </div>

      {/* Text Lines */}
      <div className="space-y-3">
        {lines.map((line, i) => (
          <p
            key={i}
            className={
              line === ""
                ? "h-2"
                : line.startsWith("Section") || line.startsWith(filename.replace(".pdf", ""))
                ? "font-bold text-sm"
                : line.startsWith("•")
                ? "ml-4 text-sm"
                : "text-sm"
            }
            style={{
              color: line === "" ? "transparent" : "#1a1a2e",
              lineHeight: 1.75,
              position: "relative",
              zIndex: 10,
            }}
          >
            {line}
          </p>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-16 pt-4 border-t text-center text-xs text-gray-400">
        {filename} · Page {page}
      </div>
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
  const [activeTool, setActiveTool] = useState<PDFTool | null>("highlight");
  const [activeColor, setActiveColor] = useState(DEFAULT_COLOR);
  const [highlights, setHighlights] = useState<Highlight[]>(() => loadHighlights(file.id));
  const [showSidebar, setShowSidebar] = useState(false);
  const [saveIndicator, setSaveIndicator] = useState<"idle" | "saving" | "saved">("idle");

  const pageRef = useRef<HTMLDivElement | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load from server on mount
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

  // Autosave whenever highlights change
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
    }, 400);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [highlights, file.id, file.path]);

  const handleAddHighlight = useCallback((h: Highlight) => {
    setHighlights((prev) => [...prev, h]);
  }, []);

  const handleDeleteHighlight = useCallback((id: string) => {
    setHighlights((prev) => prev.filter((h) => h.id !== id));
  }, []);

  const pageAnnotationCount = highlights.filter((h) => h.page === page).length;

  return (
    <div className="fixed inset-0 z-50 flex flex-col select-none" style={{ background: "rgba(0,0,0,0.92)" }}>
      {/* ── Top Bar ─────────────────────────────────────────────────────────── */}
      <div
        className="h-13 flex items-center justify-between px-4 border-b border-white/10 flex-shrink-0"
        style={{ background: "rgba(22,22,26,0.99)", height: "52px" }}
      >
        {/* Left: Close & File Info */}
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all"
          >
            <X size={16} />
          </button>
          <div>
            <p className="text-sm font-semibold text-white/90 truncate max-w-sm">{file.name}</p>
            <p className="text-[10px] text-white/40">
              Page {page} / {TOTAL_PAGES}
              {pageAnnotationCount > 0 && (
                <span className="ml-1.5 text-amber-400/80">
                  · {pageAnnotationCount} annotation{pageAnnotationCount > 1 ? "s" : ""}
                </span>
              )}
            </p>
          </div>

          {/* Page Navigator */}
          <div className="flex items-center gap-0.5 bg-white/10 rounded-xl px-1 py-0.5 ml-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-20"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs font-mono text-white/60 px-2 min-w-[50px] text-center">
              {page} / {TOTAL_PAGES}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, TOTAL_PAGES))}
              disabled={page === TOTAL_PAGES}
              className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-20"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Center: Comprehensive Annotation Tools */}
        <div className="flex items-center gap-1 bg-white/[0.06] rounded-xl p-1 border border-white/10">
          <button
            onClick={() => setActiveTool(activeTool === "highlight" ? null : "highlight")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeTool === "highlight"
                ? "bg-amber-400 text-gray-900 shadow-md shadow-amber-400/20"
                : "text-white/60 hover:text-white hover:bg-white/10"
            }`}
          >
            <Highlighter size={13} />
            Highlight
          </button>

          <button
            onClick={() => setActiveTool(activeTool === "pen" ? null : "pen")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeTool === "pen"
                ? "bg-sky-500 text-white shadow-md shadow-sky-500/20"
                : "text-white/60 hover:text-white hover:bg-white/10"
            }`}
          >
            <Pen size={13} />
            Pen Draw
          </button>

          <div className="w-px h-4 bg-white/10 mx-1" />

          {/* Color Palettes */}
          <div className="flex items-center gap-1 px-1">
            {HIGHLIGHT_COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => setActiveColor(c)}
                style={{ background: c.bg }}
                className={`w-4 h-4 rounded-full transition-transform hover:scale-125 ${
                  activeColor.value === c.value ? "ring-2 ring-white scale-110 shadow-sm" : "opacity-80"
                }`}
                title={c.label}
              />
            ))}
          </div>
        </div>

        {/* Right: Actions & Autosave Status */}
        <div className="flex items-center gap-2">
          {/* Autosave Status */}
          <div className="flex items-center gap-1 text-[10px] w-14 justify-center text-white/40">
            {saveIndicator === "saving" ? (
              <span className="text-white/40 animate-pulse">Saving…</span>
            ) : saveIndicator === "saved" ? (
              <span className="text-emerald-400 flex items-center gap-0.5">
                <Check size={11} /> Saved
              </span>
            ) : null}
          </div>

          <div className="w-px h-5 bg-white/10" />

          {/* Zoom */}
          <button
            onClick={() => setZoom((z) => Math.max(z - 15, 40))}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10"
          >
            <ZoomOut size={15} />
          </button>
          <span className="text-xs font-mono text-white/40 w-9 text-center">{zoom}%</span>
          <button
            onClick={() => setZoom((z) => Math.min(z + 15, 200))}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10"
          >
            <ZoomIn size={15} />
          </button>

          <div className="w-px h-5 bg-white/10" />

          {file.path && (
            <button
              onClick={() => openNativeApp(file.path)}
              className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10"
              title="Open in System App"
            >
              <ExternalLink size={15} />
            </button>
          )}

          <button
            onClick={() => setShowSidebar((v) => !v)}
            className={`p-1.5 rounded-lg transition-colors ${
              showSidebar ? "bg-white/20 text-white" : "text-white/50 hover:text-white hover:bg-white/10"
            }`}
            title="Annotations Sidebar"
          >
            <PanelRight size={15} />
          </button>
        </div>
      </div>

      {/* ── Body: PDF Canvas & Sidebar ───────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* PDF Canvas Viewport */}
        <div className="flex-1 overflow-auto flex justify-center py-8" style={{ background: "#38383a" }}>
          <div
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: "top center",
              minHeight: zoom < 100 ? `${(842 + 64) * (zoom / 100)}px` : undefined,
            }}
          >
            <PDFPage
              page={page}
              filename={file.name}
              highlights={highlights}
              activeTool={activeTool}
              activeColor={activeColor.value}
              onAddHighlight={handleAddHighlight}
              onDeleteHighlight={handleDeleteHighlight}
              pageRef={pageRef}
            />
          </div>
        </div>

        {/* Annotations Inspector Sidebar */}
        {showSidebar && (
          <div
            className="w-64 flex-shrink-0 border-l border-white/10 flex flex-col overflow-hidden text-xs text-white"
            style={{ background: "rgba(22,22,26,0.98)" }}
          >
            <div className="h-10 flex items-center justify-between px-3 border-b border-white/10">
              <span className="font-semibold text-white/70">Annotations ({highlights.length})</span>
              {highlights.length > 0 && (
                <button
                  onClick={() => setHighlights([])}
                  className="text-[10px] text-white/30 hover:text-red-400"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {highlights.map((h) => (
                <div
                  key={h.id}
                  onClick={() => setPage(h.page)}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer border border-white/5 flex items-start gap-2"
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1"
                    style={{ background: h.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] text-white/40 block">
                      Page {h.page} · {h.type || "highlight"}
                    </span>
                    {h.text && (
                      <p className="text-xs text-white/80 line-clamp-2 italic">"{h.text}"</p>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteHighlight(h.id);
                    }}
                    className="p-1 text-white/30 hover:text-red-400"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
