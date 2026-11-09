import React, { useEffect, useState } from "react";
import {
  X,
  ZoomIn,
  ZoomOut,
  Download,
  FileText,
  Search,
  Printer,
  ExternalLink,
} from "lucide-react";
import type { FileItem } from "../data/mockData";
import { getDocxPreview, openNativeApp } from "../services/api";

type BlockType =
  | { kind: "h1"; text: string }
  | { kind: "h2"; text: string }
  | { kind: "h3"; text: string }
  | { kind: "p"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "ol"; items: string[] }
  | { kind: "table"; headers: string[]; rows: string[][] }
  | { kind: "hr" }
  | { kind: "blockquote"; text: string };

function getFallbackDocContent(filename: string): BlockType[] {
  const title = filename.replace(/\.(docx?|txt|md)$/i, "");
  return [
    { kind: "h1", text: title },
    {
      kind: "p",
      text: `Document prepared by the team · ${new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })}`,
    },
    { kind: "hr" },
    { kind: "h2", text: "Executive Summary" },
    {
      kind: "p",
      text: "This document outlines the key findings, strategic recommendations, and actionable insights derived from an extensive analysis of the current operational landscape. The conclusions presented herein are supported by rigorous data collection and stakeholder interviews conducted over a period of six weeks.",
    },
    {
      kind: "p",
      text: "Our primary objective is to provide a comprehensive overview that enables leadership to make well-informed decisions with respect to resource allocation, timeline adjustments, and risk mitigation strategies going forward.",
    },
    { kind: "h2", text: "Key Objectives" },
    {
      kind: "ul",
      items: [
        "Identify critical bottlenecks within the existing workflow pipeline",
        "Recommend process improvements that maximize throughput and reduce latency",
        "Establish measurable KPIs aligned with organisational goals for FY 2026",
        "Define a phased implementation roadmap with clear milestones and owners",
        "Ensure compliance with all applicable regulatory requirements",
      ],
    },
    { kind: "h2", text: "Findings & Analysis" },
    { kind: "h3", text: "1. Operational Efficiency" },
    {
      kind: "p",
      text: "Current operational workflows exhibit a 23% inefficiency rate attributable primarily to manual handoff steps between departments. Automation of these transitions could yield an estimated saving of 1,200 person-hours per quarter.",
    },
    { kind: "h3", text: "2. Technology Infrastructure" },
    {
      kind: "p",
      text: "Legacy systems account for 41% of total infrastructure expenditure while delivering diminishing returns in performance benchmarks. A phased migration to cloud-native architecture is strongly recommended.",
    },
    {
      kind: "blockquote",
      text: '"The cost of inaction over the next 18 months is projected to exceed the investment required for a full modernisation initiative by a factor of 3.4x." — Infrastructure Review Committee',
    },
    { kind: "h2", text: "Metrics Overview" },
    {
      kind: "table",
      headers: ["Metric", "Current", "Target", "Timeline"],
      rows: [
        ["Process Cycle Time", "14 days", "8 days", "Q2 2026"],
        ["Error Rate", "4.2%", "< 1%", "Q3 2026"],
        ["Customer Satisfaction", "72 / 100", "88 / 100", "Q4 2026"],
        ["Cost per Transaction", "$18.40", "$11.00", "Q2 2027"],
        ["System Uptime", "97.1%", "99.9%", "Q1 2026"],
      ],
    },
    { kind: "h2", text: "Recommendations" },
    {
      kind: "ol",
      items: [
        "Immediately halt further investment in legacy system maintenance and redirect to cloud migration budget",
        "Establish a cross-functional Transformation Office with authority to enforce process changes",
        "Deploy process automation tooling across the top five highest-volume workflows within Q1 2026",
        "Conduct quarterly retrospectives against the KPI framework defined in this document",
      ],
    },
  ];
}

const DocBlock: React.FC<{ block: BlockType }> = ({ block }) => {
  const baseText = { fontFamily: "'Georgia', serif", color: "#1a1a2e" };

  switch (block.kind) {
    case "h1":
      return (
        <h1 style={{ ...baseText, fontSize: "24px", fontWeight: 700, marginBottom: "4px", letterSpacing: "-0.3px" }}>
          {block.text}
        </h1>
      );
    case "h2":
      return (
        <h2 style={{ ...baseText, fontSize: "17px", fontWeight: 700, marginTop: "28px", marginBottom: "10px", paddingBottom: "6px", borderBottom: "1px solid #e5e7eb" }}>
          {block.text}
        </h2>
      );
    case "h3":
      return (
        <h3 style={{ ...baseText, fontSize: "14px", fontWeight: 600, marginTop: "18px", marginBottom: "6px" }}>
          {block.text}
        </h3>
      );
    case "p":
      return (
        <p style={{ ...baseText, fontSize: "13px", lineHeight: 1.8, marginBottom: "12px", color: "#2d3748" }}>
          {block.text}
        </p>
      );
    case "ul":
      return (
        <ul style={{ marginBottom: "14px", paddingLeft: "20px" }}>
          {block.items.map((item, i) => (
            <li key={i} style={{ ...baseText, fontSize: "13px", lineHeight: 1.8, marginBottom: "4px", color: "#2d3748", listStyleType: "disc" }}>
              {item}
            </li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol style={{ marginBottom: "14px", paddingLeft: "20px" }}>
          {block.items.map((item, i) => (
            <li key={i} style={{ ...baseText, fontSize: "13px", lineHeight: 1.8, marginBottom: "6px", color: "#2d3748", listStyleType: "decimal" }}>
              {item}
            </li>
          ))}
        </ol>
      );
    case "table":
      return (
        <div style={{ marginBottom: "18px", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", fontFamily: "'Helvetica Neue', sans-serif" }}>
            <thead>
              <tr style={{ background: "#1d4ed8" }}>
                {block.headers.map((h, i) => (
                  <th key={i} style={{ padding: "8px 12px", color: "white", fontWeight: 600, textAlign: "left", borderRight: i < block.headers.length - 1 ? "1px solid rgba(255,255,255,0.15)" : undefined }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, ri) => (
                <tr key={ri} style={{ background: ri % 2 === 0 ? "#f8faff" : "white" }}>
                  {row.map((cell, ci) => (
                    <td key={ci} style={{ padding: "7px 12px", color: "#374151", borderBottom: "1px solid #e5e7eb", borderRight: ci < row.length - 1 ? "1px solid #e5e7eb" : undefined }}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "hr":
      return <hr style={{ border: "none", borderTop: "1px solid #e5e7eb", margin: "16px 0" }} />;
    case "blockquote":
      return (
        <blockquote style={{ borderLeft: "3px solid #1d4ed8", paddingLeft: "16px", margin: "16px 0", color: "#4b5563", fontStyle: "italic", fontSize: "13px", lineHeight: 1.8, fontFamily: "Georgia, serif" }}>
          {block.text}
        </blockquote>
      );
    default:
      return null;
  }
};

interface WordViewerProps {
  file: FileItem;
  onClose: () => void;
}

export const WordViewer: React.FC<WordViewerProps> = ({ file, onClose }) => {
  const [zoom, setZoom] = useState(100);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [docBlocks, setDocBlocks] = useState<BlockType[]>([]);
  const [totalWords, setTotalWords] = useState(0);

  // Load from real backend or use template fallback
  useEffect(() => {
    let isMounted = true;
    if (file.path && file.path.toLowerCase().endsWith(".docx")) {
      getDocxPreview(file.path)
        .then((data) => {
          if (!isMounted) return;
          if (data && data.paragraphs && data.paragraphs.length > 0) {
            const blocks: BlockType[] = [
              { kind: "h1", text: data.title || file.name },
              { kind: "hr" },
            ];
            for (const p of data.paragraphs) {
              if (p.type === "h1") blocks.push({ kind: "h1", text: p.text });
              else if (p.type === "h2") blocks.push({ kind: "h2", text: p.text });
              else if (p.type === "h3") blocks.push({ kind: "h3", text: p.text });
              else if (p.type === "li") blocks.push({ kind: "ul", items: [p.text] });
              else blocks.push({ kind: "p", text: p.text });
            }
            setDocBlocks(blocks);
            setTotalWords(data.wordCount || 0);
          } else {
            const fallback = getFallbackDocContent(file.name);
            setDocBlocks(fallback);
          }
        })
        .catch(() => {
          if (!isMounted) return;
          setDocBlocks(getFallbackDocContent(file.name));
        });
    } else {
      setDocBlocks(getFallbackDocContent(file.name));
    }

    return () => {
      isMounted = false;
    };
  }, [file.name, file.path]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showSearch) setShowSearch(false);
        else onClose();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        setShowSearch((v) => !v);
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, showSearch]);

  const displayedBlocks = docBlocks.length > 0 ? docBlocks : getFallbackDocContent(file.name);

  return (
    <div className="fixed inset-0 z-50 flex flex-col select-text" style={{ background: "rgba(0,0,0,0.9)" }}>
      {/* Top bar */}
      <div
        className="h-13 flex items-center gap-3 px-4 border-b border-white/[0.07] flex-shrink-0"
        style={{ background: "rgba(22,22,24,0.99)", height: "52px" }}
      >
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-white/45 hover:text-white hover:bg-white/10 transition-all"
        >
          <X size={16} />
        </button>

        {/* File icon + name */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded flex items-center justify-center" style={{ background: "#1d4ed8" }}>
            <FileText size={14} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white/88 leading-tight">{file.name}</p>
            <p className="text-[10px] text-white/35">
              {totalWords > 0 ? `${totalWords.toLocaleString()} words` : "Word Document"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 ml-auto">
          {/* Search toggle */}
          <button
            onClick={() => setShowSearch((v) => !v)}
            className={`p-1.5 rounded-lg transition-all ${
              showSearch ? "bg-white/15 text-white" : "text-white/45 hover:text-white hover:bg-white/8"
            }`}
          >
            <Search size={15} />
          </button>

          {showSearch && (
            <input
              autoFocus
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Find in document…"
              className="h-7 px-3 text-xs rounded-lg bg-white/10 border border-white/15 text-white placeholder-white/30 outline-none focus:border-sky-400/60 w-48 transition-all"
            />
          )}

          <div className="w-px h-5 bg-white/10 mx-1" />

          <button
            onClick={() => setZoom((z) => Math.max(z - 10, 50))}
            className="p-1.5 rounded-lg text-white/45 hover:text-white hover:bg-white/8 transition-all"
          >
            <ZoomOut size={15} />
          </button>
          <span className="text-xs font-mono text-white/40 w-9 text-center">{zoom}%</span>
          <button
            onClick={() => setZoom((z) => Math.min(z + 10, 200))}
            className="p-1.5 rounded-lg text-white/45 hover:text-white hover:bg-white/8 transition-all"
          >
            <ZoomIn size={15} />
          </button>

          <div className="w-px h-5 bg-white/10 mx-1" />

          {file.path && (
            <button
              onClick={() => openNativeApp(file.path)}
              className="p-1.5 rounded-lg text-white/45 hover:text-white hover:bg-white/8 transition-all"
              title="Open in Microsoft Word / Default App"
            >
              <ExternalLink size={15} />
            </button>
          )}

          <button
            className="p-1.5 rounded-lg text-white/45 hover:text-white hover:bg-white/8 transition-all"
            title="Print"
          >
            <Printer size={15} />
          </button>
          <button
            className="p-1.5 rounded-lg text-white/45 hover:text-white hover:bg-white/8 transition-all"
            title="Download"
          >
            <Download size={15} />
          </button>
        </div>
      </div>

      {/* Document scroll area */}
      <div className="flex-1 overflow-auto" style={{ background: "#c8c8cc" }}>
        <div
          className="flex justify-center py-10"
          style={{
            transformOrigin: "top center",
            transform: `scale(${zoom / 100})`,
            minHeight: zoom < 100 ? `${100 / (zoom / 100)}%` : undefined,
          }}
        >
          {/* A4 page */}
          <div
            className="bg-white shadow-2xl"
            style={{ width: "794px", minHeight: "1123px", padding: "80px 90px", position: "relative" }}
          >
            {/* Top accent line */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "4px",
                background: "linear-gradient(90deg, #1d4ed8 0%, #3b82f6 100%)",
              }}
            />

            {/* Word badge */}
            <div
              className="absolute top-5 right-6 flex items-center gap-1.5 px-2 py-1 rounded"
              style={{ background: "#1d4ed8" }}
            >
              <span className="text-[9px] font-bold text-white tracking-wider">W</span>
              <span className="text-[9px] text-white/70">Word</span>
            </div>

            {/* Content */}
            <div>
              {displayedBlocks.map((block, i) => (
                <DocBlock key={i} block={block} />
              ))}
            </div>

            {/* Footer */}
            <div
              style={{
                marginTop: "60px",
                paddingTop: "16px",
                borderTop: "1px solid #e5e7eb",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: "10px", color: "#9ca3af", fontFamily: "sans-serif" }}>{file.name}</span>
              <span style={{ fontSize: "10px", color: "#9ca3af", fontFamily: "sans-serif" }}>Document Preview</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
