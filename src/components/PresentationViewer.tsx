import React, { useEffect, useState } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Download,
  Play,
  LayoutGrid,
  Tv2,
  ExternalLink,
} from "lucide-react";
import type { FileItem } from "../data/mockData";
import { getPptxPreview, openNativeApp } from "../services/api";

// ─── Slide content types ──────────────────────────────────────────────────────

type SlideLayout =
  | "title"
  | "title-content"
  | "two-column"
  | "image-text"
  | "bullets"
  | "quote"
  | "chart"
  | "section"
  | "blank-data";

interface Slide {
  layout: SlideLayout;
  title: string;
  subtitle?: string;
  bullets?: string[];
  col1?: { heading: string; items: string[] };
  col2?: { heading: string; items: string[] };
  quote?: string;
  author?: string;
  chartData?: { label: string; value: number; color: string }[];
  accentColor: string;
  bgColor: string;
  textColor: string;
}

function getDemoSlides(filename: string): Slide[] {
  const name = filename.replace(/\.(pptx?|key)$/i, "");
  const primary = "#1d4ed8";
  const dark = "#0f172a";

  return [
    {
      layout: "title",
      title: name,
      subtitle: `Presented by the Strategy Team · ${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}`,
      accentColor: primary,
      bgColor: "#0f172a",
      textColor: "#f8fafc",
    },
    {
      layout: "title-content",
      title: "Agenda",
      bullets: [
        "01 — Executive Overview & Context",
        "02 — Market Landscape Analysis",
        "03 — Strategic Recommendations",
        "04 — Implementation Roadmap",
        "05 — Financial Projections",
        "06 — Next Steps & Q&A",
      ],
      accentColor: primary,
      bgColor: "#ffffff",
      textColor: dark,
    },
    {
      layout: "section",
      title: "Executive Overview",
      subtitle: "Section 01",
      accentColor: "#7c3aed",
      bgColor: "#4c1d95",
      textColor: "#f5f3ff",
    },
    {
      layout: "two-column",
      title: "Strengths vs. Challenges",
      col1: {
        heading: "✅ Strengths",
        items: [
          "Market-leading brand recognition",
          "Established distribution network",
          "Strong R&D capabilities",
          "Loyal customer base (NPS 68)",
        ],
      },
      col2: {
        heading: "⚠️ Challenges",
        items: [
          "Rising operational costs (+18% YoY)",
          "Legacy tech debt accumulation",
          "Increasing competitive pressure",
          "Talent acquisition difficulties",
        ],
      },
      accentColor: primary,
      bgColor: "#f8fafc",
      textColor: dark,
    },
    {
      layout: "chart",
      title: "Revenue Growth by Quarter",
      chartData: [
        { label: "Q1", value: 72, color: "#3b82f6" },
        { label: "Q2", value: 85, color: "#6366f1" },
        { label: "Q3", value: 78, color: "#8b5cf6" },
        { label: "Q4", value: 94, color: "#a855f7" },
        { label: "Q1'26", value: 110, color: "#1d4ed8" },
      ],
      accentColor: primary,
      bgColor: "#ffffff",
      textColor: dark,
    },
    {
      layout: "quote",
      title: "",
      quote:
        "\"Our ability to adapt and innovate at speed will define the next decade of growth. The strategies outlined here represent our clearest path to market leadership.\"",
      author: "— Chief Executive Officer",
      accentColor: "#0ea5e9",
      bgColor: "#0c4a6e",
      textColor: "#f0f9ff",
    },
    {
      layout: "bullets",
      title: "Strategic Recommendations",
      bullets: [
        "Accelerate cloud-first digital transformation across all business units",
        "Invest $24M in AI/ML capabilities to unlock operational efficiencies",
        "Expand into 3 new geographic markets by end of FY2026",
        "Restructure sales incentive programme to drive enterprise growth",
        "Establish a dedicated Innovation Lab with ring-fenced budget",
      ],
      accentColor: "#059669",
      bgColor: "#ffffff",
      textColor: dark,
    },
    {
      layout: "blank-data",
      title: "Implementation Timeline",
      bullets: [
        "Phase 1 (Q1 2026) — Foundation & Tooling setup",
        "Phase 2 (Q2 2026) — Pilot programmes launch",
        "Phase 3 (Q3 2026) — Full-scale rollout begins",
        "Phase 4 (Q4 2026) — Review, optimise & scale",
      ],
      accentColor: primary,
      bgColor: "#f8fafc",
      textColor: dark,
    },
    {
      layout: "title",
      title: "Thank You",
      subtitle: "Questions & Discussion · Slides available at the shared drive link",
      accentColor: primary,
      bgColor: "#1e293b",
      textColor: "#f1f5f9",
    },
  ];
}

// ─── Slide renderer ───────────────────────────────────────────────────────────

const SlideRenderer: React.FC<{ slide: Slide; scale?: number }> = ({ slide, scale = 1 }) => {
  const { layout, title, subtitle, bullets, col1, col2, quote, author, chartData, accentColor, bgColor, textColor } = slide;

  const W = 960;
  const H = 540;

  const base: React.CSSProperties = {
    width: `${W}px`,
    height: `${H}px`,
    background: bgColor,
    color: textColor,
    position: "relative",
    overflow: "hidden",
    flexShrink: 0,
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    transform: `scale(${scale})`,
    transformOrigin: "top left",
  };

  // Decorative accent bar
  const AccentBar = () => (
    <div style={{ position: "absolute", left: 0, top: 0, width: "8px", height: "100%", background: accentColor }} />
  );

  // Corner circle decoration
  const CornerCircle = () => (
    <div style={{
      position: "absolute",
      right: "-80px",
      bottom: "-80px",
      width: "280px",
      height: "280px",
      borderRadius: "50%",
      background: accentColor,
      opacity: 0.08,
    }} />
  );

  if (layout === "title") {
    return (
      <div style={base}>
        <div style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "5px", background: accentColor }} />
        <div style={{ position: "absolute", right: "-100px", top: "-100px", width: "400px", height: "400px", borderRadius: "50%", background: accentColor, opacity: 0.1 }} />
        <div style={{ position: "absolute", left: "80px", top: "50%", transform: "translateY(-50%)", maxWidth: "680px" }}>
          <div style={{ width: "60px", height: "5px", background: accentColor, borderRadius: "3px", marginBottom: "32px" }} />
          <h1 style={{ fontSize: "52px", fontWeight: 800, lineHeight: 1.1, margin: 0, letterSpacing: "-1px" }}>{title}</h1>
          {subtitle && (
            <p style={{ marginTop: "24px", fontSize: "16px", opacity: 0.6, lineHeight: 1.5 }}>{subtitle}</p>
          )}
        </div>
        <div style={{ position: "absolute", bottom: "32px", left: "80px", fontSize: "11px", opacity: 0.35, fontWeight: 500, letterSpacing: "1px", textTransform: "uppercase" }}>
          CONFIDENTIAL
        </div>
      </div>
    );
  }

  if (layout === "section") {
    return (
      <div style={base}>
        <div style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", background: `linear-gradient(135deg, ${bgColor} 0%, ${accentColor}80 100%)` }} />
        <div style={{ position: "absolute", left: "80px", bottom: "80px" }}>
          <p style={{ fontSize: "13px", opacity: 0.6, letterSpacing: "3px", textTransform: "uppercase", marginBottom: "12px", position: "relative", zIndex: 1 }}>{subtitle}</p>
          <h1 style={{ fontSize: "60px", fontWeight: 800, margin: 0, letterSpacing: "-2px", position: "relative", zIndex: 1 }}>{title}</h1>
        </div>
        <div style={{ position: "absolute", right: "60px", top: "50%", transform: "translateY(-50%)", opacity: 0.12, fontSize: "200px", fontWeight: 900, lineHeight: 1 }}>
          {subtitle?.replace("Section ", "")}
        </div>
      </div>
    );
  }

  if (layout === "title-content" || layout === "bullets") {
    return (
      <div style={base}>
        <AccentBar />
        <CornerCircle />
        <div style={{ paddingLeft: "72px", paddingRight: "60px", paddingTop: "52px" }}>
          <h2 style={{ fontSize: "34px", fontWeight: 700, margin: "0 0 32px 0", letterSpacing: "-0.5px" }}>{title}</h2>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "14px" }}>
            {bullets?.map((item, i) => (
              <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: "12px", fontSize: "17px", lineHeight: 1.4 }}>
                <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: accentColor, flexShrink: 0, marginTop: "7px" }} />
                <span style={{ opacity: 0.85 }}>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  if (layout === "two-column") {
    return (
      <div style={base}>
        <div style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "80px", background: accentColor, display: "flex", alignItems: "center", paddingLeft: "52px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 700, margin: 0, color: "white" }}>{title}</h2>
        </div>
        <div style={{ display: "flex", gap: "0", height: "100%", paddingTop: "80px" }}>
          {[col1, col2].map((col, ci) => col && (
            <div key={ci} style={{ flex: 1, padding: "32px 40px", borderRight: ci === 0 ? "1px solid rgba(0,0,0,0.06)" : undefined }}>
              <h3 style={{ fontSize: "15px", fontWeight: 700, margin: "0 0 20px 0", color: accentColor }}>{col.heading}</h3>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
                {col.items.map((item, i) => (
                  <li key={i} style={{ fontSize: "14px", lineHeight: 1.5, opacity: 0.8, paddingLeft: "14px", borderLeft: `2px solid ${ci === 0 ? "#22c55e" : "#f97316"}40` }}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (layout === "chart" && chartData) {
    const max = Math.max(...chartData.map((d) => d.value));
    return (
      <div style={base}>
        <AccentBar />
        <div style={{ paddingLeft: "72px", paddingRight: "60px", paddingTop: "52px" }}>
          <h2 style={{ fontSize: "30px", fontWeight: 700, margin: "0 0 40px 0" }}>{title}</h2>
          {/* Bar chart */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: "24px", height: "280px" }}>
            {chartData.map((d, i) => {
              const barH = (d.value / max) * 240;
              return (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", flex: 1 }}>
                  <span style={{ fontSize: "14px", fontWeight: 700, opacity: 0.8 }}>{d.value}M</span>
                  <div style={{ width: "100%", height: `${barH}px`, background: d.color, borderRadius: "6px 6px 0 0", position: "relative", minWidth: "60px" }}>
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 100%)", borderRadius: "6px 6px 0 0" }} />
                  </div>
                  <span style={{ fontSize: "12px", opacity: 0.6, fontWeight: 600 }}>{d.label}</span>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: "12px", height: "1px", background: "rgba(0,0,0,0.1)" }} />
        </div>
      </div>
    );
  }

  if (layout === "quote") {
    return (
      <div style={base}>
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${bgColor} 0%, ${accentColor}50 100%)` }} />
        <div style={{ position: "absolute", left: "80px", right: "80px", top: "50%", transform: "translateY(-50%)", zIndex: 1, textAlign: "center" }}>
          <div style={{ fontSize: "80px", lineHeight: 0.5, opacity: 0.3, marginBottom: "24px", fontFamily: "Georgia, serif" }}>"</div>
          <p style={{ fontSize: "22px", lineHeight: 1.6, fontStyle: "italic", fontFamily: "Georgia, serif", margin: "0 0 24px 0" }}>{quote}</p>
          <p style={{ fontSize: "14px", opacity: 0.65, fontWeight: 600, letterSpacing: "0.5px" }}>{author}</p>
        </div>
        <CornerCircle />
      </div>
    );
  }

  // blank-data / fallback
  return (
    <div style={base}>
      <AccentBar />
      <CornerCircle />
      <div style={{ paddingLeft: "72px", paddingRight: "60px", paddingTop: "52px" }}>
        <h2 style={{ fontSize: "30px", fontWeight: 700, margin: "0 0 32px 0" }}>{title}</h2>
        {bullets && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
            {bullets.map((item, i) => {
              const [phase, ...rest] = item.split(" — ");
              return (
                <div key={i} style={{ display: "flex", alignItems: "stretch", marginBottom: "0" }}>
                  {/* Timeline line */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "32px", marginRight: "20px" }}>
                    <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: accentColor, flexShrink: 0, marginTop: "14px" }} />
                    {i < (bullets?.length ?? 1) - 1 && (
                      <div style={{ width: "2px", flex: 1, background: `${accentColor}30`, minHeight: "30px" }} />
                    )}
                  </div>
                  <div style={{ paddingBottom: "20px" }}>
                    <p style={{ margin: "10px 0 2px 0", fontSize: "13px", fontWeight: 700, color: accentColor }}>{phase}</p>
                    <p style={{ margin: 0, fontSize: "15px", opacity: 0.75 }}>{rest.join(" — ")}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Thumbnail ────────────────────────────────────────────────────────────────

const SlideThumbnail: React.FC<{ slide: Slide; index: number; active: boolean; onClick: () => void }> = ({
  slide, index, active, onClick,
}) => (
  <button
    onClick={onClick}
    className={`group w-full flex flex-col items-center gap-1.5 p-2 rounded-lg transition-all ${
      active ? "bg-sky-500/15" : "hover:bg-white/5"
    }`}
  >
    <div
      className={`relative rounded overflow-hidden transition-all ${
        active ? "ring-2 ring-sky-400 shadow-lg shadow-sky-500/20" : "ring-1 ring-white/10"
      }`}
      style={{ width: "140px", height: "79px" }}
    >
      <div style={{ transform: "scale(0.1458)", transformOrigin: "top left", width: "960px", height: "540px" }}>
        <SlideRenderer slide={slide} />
      </div>
    </div>
    <span className={`text-[10px] font-medium ${active ? "text-sky-300" : "text-white/35"}`}>
      {index + 1}
    </span>
  </button>
);

// ─── Main component ───────────────────────────────────────────────────────────

interface PresentationViewerProps {
  file: FileItem;
  onClose: () => void;
}

export const PresentationViewer: React.FC<PresentationViewerProps> = ({ file, onClose }) => {
  const [slides, setSlides] = useState<Slide[]>(() => getDemoSlides(file.name));
  const [current, setCurrent] = useState(0);
  const [zoom, setZoom] = useState(72);
  const [showThumbs, setShowThumbs] = useState(true);

  // Load real slides if file is .pptx
  useEffect(() => {
    let isMounted = true;
    if (file.path && file.path.toLowerCase().endsWith(".pptx")) {
      getPptxPreview(file.path)
        .then((data) => {
          if (!isMounted) return;
          if (data && data.slides && data.slides.length > 0) {
            const mapped: Slide[] = data.slides.map((s, idx) => ({
              layout: idx === 0 ? "title" : "bullets",
              title: s.title || `Slide ${idx + 1}`,
              bullets: s.bullets,
              accentColor: "#c2410c",
              bgColor: idx === 0 ? "#0f172a" : "#ffffff",
              textColor: idx === 0 ? "#f8fafc" : "#0f172a",
            }));
            setSlides(mapped);
          }
        })
        .catch(() => {});
    }
    return () => {
      isMounted = false;
    };
  }, [file.name, file.path]);

  const slide = slides[current] || slides[0];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " ") {
        setCurrent((c) => Math.min(c + 1, slides.length - 1));
        e.preventDefault();
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        setCurrent((c) => Math.max(c - 1, 0));
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, slides.length]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "rgba(0,0,0,0.9)" }}>
      {/* Top bar */}
      <div
        className="flex items-center gap-3 px-4 border-b border-white/[0.07] flex-shrink-0"
        style={{ background: "rgba(22,22,24,0.99)", height: "52px" }}
      >
        <button onClick={onClose} className="p-1.5 rounded-lg text-white/45 hover:text-white hover:bg-white/10 transition-all">
          <X size={16} />
        </button>

        {/* File info */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded flex items-center justify-center" style={{ background: "#c2410c" }}>
            <Tv2 size={14} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white/88 leading-tight">{file.name}</p>
            <p className="text-[10px] text-white/35">{slides.length} slides</p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-0.5 bg-white/[0.07] rounded-xl px-1 py-1 ml-3">
          <button
            onClick={() => setCurrent((c) => Math.max(c - 1, 0))}
            disabled={current === 0}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all disabled:opacity-25 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={15} />
          </button>
          <span className="text-xs font-mono text-white/55 px-2 min-w-[60px] text-center">
            {current + 1} / {slides.length}
          </span>
          <button
            onClick={() => setCurrent((c) => Math.min(c + 1, slides.length - 1))}
            disabled={current === slides.length - 1}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all disabled:opacity-25 disabled:cursor-not-allowed"
          >
            <ChevronRight size={15} />
          </button>
        </div>

        <div className="flex items-center gap-1 ml-auto">
          {/* Thumbnail toggle */}
          <button
            onClick={() => setShowThumbs((v) => !v)}
            className={`p-1.5 rounded-lg transition-all ${showThumbs ? "bg-white/15 text-white" : "text-white/45 hover:text-white hover:bg-white/8"}`}
            title="Slide panel"
          >
            <LayoutGrid size={15} />
          </button>

          <div className="w-px h-5 bg-white/10 mx-1" />

          <button onClick={() => setZoom((z) => Math.max(z - 10, 30))} className="p-1.5 rounded-lg text-white/45 hover:text-white hover:bg-white/8 transition-all">
            <ZoomOut size={15} />
          </button>
          <span className="text-xs font-mono text-white/40 w-9 text-center">{zoom}%</span>
          <button onClick={() => setZoom((z) => Math.min(z + 10, 150))} className="p-1.5 rounded-lg text-white/45 hover:text-white hover:bg-white/8 transition-all">
            <ZoomIn size={15} />
          </button>

          <div className="w-px h-5 bg-white/10 mx-1" />

          {file.path && (
            <button
              onClick={() => openNativeApp(file.path)}
              className="p-1.5 rounded-lg text-white/45 hover:text-white hover:bg-white/8 transition-all"
              title="Open in Microsoft PowerPoint / Default App"
            >
              <ExternalLink size={15} />
            </button>
          )}

          {/* Present button */}
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90"
            style={{ background: "#c2410c" }}
          >
            <Play size={12} className="fill-white" />
            Present
          </button>

          <button className="p-1.5 rounded-lg text-white/45 hover:text-white hover:bg-white/8 transition-all ml-1">
            <Download size={15} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Slide thumbnails */}
        {showThumbs && (
          <div
            className="w-44 flex-shrink-0 overflow-y-auto border-r border-white/[0.07] py-3 px-2"
            style={{ background: "rgba(18,18,20,0.98)" }}
          >
            {slides.map((s, i) => (
              <SlideThumbnail
                key={i}
                slide={s}
                index={i}
                active={i === current}
                onClick={() => setCurrent(i)}
              />
            ))}
          </div>
        )}

        {/* Main stage */}
        <div className="flex-1 overflow-auto flex items-center justify-center" style={{ background: "#2a2a2c" }}>
          <div
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: "center center",
              borderRadius: "6px",
              overflow: "hidden",
              boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
            }}
          >
            <SlideRenderer slide={slide} />
          </div>
        </div>
      </div>

      {/* Bottom slide strip */}
      <div
        className="h-10 flex items-center justify-center gap-2 border-t border-white/[0.07] flex-shrink-0"
        style={{ background: "rgba(18,18,20,0.98)" }}
      >
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`rounded-full transition-all ${
              i === current ? "w-5 h-2 bg-sky-400" : "w-2 h-2 bg-white/20 hover:bg-white/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
};
