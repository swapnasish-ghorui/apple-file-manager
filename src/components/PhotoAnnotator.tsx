import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  X,
  Download,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  Pen,
  Highlighter,
  Square,
  Circle,
  MoveRight,
  Type,
  Eraser,
  Undo2,
  Trash2,
  Cloud,
  Check,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type { FileItem } from "../data/mockData";
import {
  getFileRawUrl,
  getPhotoAnnotations,
  savePhotoAnnotations,
  saveAnnotatedImageToR2,
} from "../services/api";

type ToolType = "pen" | "highlighter" | "arrow" | "rect" | "circle" | "text" | "eraser";

interface AnnotationElement {
  id: string;
  type: ToolType;
  color: string;
  strokeWidth: number;
  points?: { x: number; y: number }[]; // for pen & highlighter
  start?: { x: number; y: number };    // for shapes
  end?: { x: number; y: number };
  text?: string;                      // for text
  x?: number;
  y?: number;
}

const COLORS = [
  { label: "Red", value: "#ef4444" },
  { label: "Orange", value: "#f97316" },
  { label: "Yellow", value: "#eab308" },
  { label: "Green", value: "#22c55e" },
  { label: "Blue", value: "#3b82f6" },
  { label: "Purple", value: "#a855f7" },
  { label: "White", value: "#ffffff" },
  { label: "Black", value: "#000000" },
];

const STROKE_SIZES = [
  { label: "Thin", value: 3 },
  { label: "Medium", value: 6 },
  { label: "Thick", value: 12 },
];

interface PhotoAnnotatorProps {
  file: FileItem;
  onClose: () => void;
  onSaved?: () => void;
}

export const PhotoAnnotator: React.FC<PhotoAnnotatorProps> = ({ file, onClose, onSaved }) => {
  const imageUrl = getFileRawUrl(file.path, file.path.startsWith("r2://"));

  const [tool, setTool] = useState<ToolType>("pen");
  const [color, setColor] = useState<string>("#ef4444");
  const [strokeWidth, setStrokeWidth] = useState<number>(4);
  const [rotation, setRotation] = useState<number>(0);
  const [flipH, setFlipH] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(100);

  const [elements, setElements] = useState<AnnotationElement[]>([]);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [currentElement, setCurrentElement] = useState<AnnotationElement | null>(null);

  const [textInput, setTextInput] = useState<{ x: number; y: number; text: string } | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // 1. Load Image and previous annotations
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
    img.onload = () => {
      imageRef.current = img;
      redrawCanvas();
    };

    // Load vector annotations
    getPhotoAnnotations(file.path)
      .then((data) => {
        if (data && Array.isArray(data.elements)) {
          setElements(data.elements);
          if (typeof data.rotation === "number") setRotation(data.rotation);
          if (typeof data.flipH === "boolean") setFlipH(data.flipH);
        }
      })
      .catch(() => {});
  }, [file.path, imageUrl]);

  // 2. Autosave vector annotations when elements change
  useEffect(() => {
    if (elements.length === 0 && rotation === 0 && !flipH) return;
    setSaveStatus("saving");
    const t = setTimeout(() => {
      savePhotoAnnotations(file.path, { elements, rotation, flipH })
        .then(() => {
          setSaveStatus("saved");
          setTimeout(() => setSaveStatus("idle"), 1500);
        })
        .catch(() => setSaveStatus("idle"));
    }, 500);
    return () => clearTimeout(t);
  }, [elements, rotation, flipH, file.path]);

  // 3. Render Canvas
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const isRotated90or270 = rotation % 180 !== 0;
    const width = isRotated90or270 ? img.naturalHeight : img.naturalWidth;
    const height = isRotated90or270 ? img.naturalWidth : img.naturalHeight;

    canvas.width = width;
    canvas.height = height;

    ctx.save();
    ctx.clearRect(0, 0, width, height);

    // Apply rotation & flip
    ctx.translate(width / 2, height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipH ? -1 : 1, 1);
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    ctx.restore();

    // Render all saved annotation elements
    const allElements = currentElement ? [...elements, currentElement] : elements;

    for (const el of allElements) {
      ctx.save();
      ctx.strokeStyle = el.color;
      ctx.fillStyle = el.color;
      ctx.lineWidth = el.strokeWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (el.type === "highlighter") {
        ctx.globalAlpha = 0.4;
        ctx.lineWidth = el.strokeWidth * 2.5;
      }

      if (el.type === "pen" || el.type === "highlighter") {
        if (el.points && el.points.length > 1) {
          ctx.beginPath();
          ctx.moveTo(el.points[0].x, el.points[0].y);
          for (let i = 1; i < el.points.length; i++) {
            ctx.lineTo(el.points[i].x, el.points[i].y);
          }
          ctx.stroke();
        }
      } else if (el.type === "rect" && el.start && el.end) {
        const x = Math.min(el.start.x, el.end.x);
        const y = Math.min(el.start.y, el.end.y);
        const w = Math.abs(el.start.x - el.end.x);
        const h = Math.abs(el.start.y - el.end.y);
        ctx.strokeRect(x, y, w, h);
      } else if (el.type === "circle" && el.start && el.end) {
        const rx = Math.abs(el.start.x - el.end.x) / 2;
        const ry = Math.abs(el.start.y - el.end.y) / 2;
        const cx = Math.min(el.start.x, el.end.x) + rx;
        const cy = Math.min(el.start.y, el.end.y) + ry;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (el.type === "arrow" && el.start && el.end) {
        drawArrow(ctx, el.start.x, el.start.y, el.end.x, el.end.y, el.strokeWidth);
      } else if (el.type === "text" && el.text && el.x !== undefined && el.y !== undefined) {
        ctx.font = `bold ${Math.max(el.strokeWidth * 4, 18)}px -apple-system, sans-serif`;
        // background pill
        const metrics = ctx.measureText(el.text);
        ctx.fillStyle = "rgba(0,0,0,0.65)";
        ctx.beginPath();
        ctx.roundRect(el.x - 6, el.y - 20, metrics.width + 12, 28, 6);
        ctx.fill();

        ctx.fillStyle = el.color;
        ctx.fillText(el.text, el.x, el.y);
      }
      ctx.restore();
    }
  }, [elements, currentElement, rotation, flipH]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Arrow Helper
  function drawArrow(ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number, width: number) {
    const headLength = Math.max(width * 3.5, 16);
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx);

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
  }

  // 4. Mouse event handlers
  function getCanvasCoords(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);

    if (tool === "text") {
      setTextInput({ x: coords.x, y: coords.y, text: "" });
      return;
    }

    if (tool === "eraser") {
      // Find and remove element nearest to click
      setElements((prev) =>
        prev.filter((el) => {
          if (el.points) {
            return !el.points.some((p) => Math.hypot(p.x - coords.x, p.y - coords.y) < 20);
          }
          if (el.start && el.end) {
            const minX = Math.min(el.start.x, el.end.x) - 15;
            const maxX = Math.max(el.start.x, el.end.x) + 15;
            const minY = Math.min(el.start.y, el.end.y) - 15;
            const maxY = Math.max(el.start.y, el.end.y) + 15;
            return !(coords.x >= minX && coords.x <= maxX && coords.y >= minY && coords.y <= maxY);
          }
          return true;
        })
      );
      return;
    }

    setIsDrawing(true);

    if (tool === "pen" || tool === "highlighter") {
      setCurrentElement({
        id: `el_${Date.now()}`,
        type: tool,
        color,
        strokeWidth,
        points: [coords],
      });
    } else if (tool === "arrow" || tool === "rect" || tool === "circle") {
      setCurrentElement({
        id: `el_${Date.now()}`,
        type: tool,
        color,
        strokeWidth,
        start: coords,
        end: coords,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentElement) return;
    const coords = getCanvasCoords(e);

    if (tool === "pen" || tool === "highlighter") {
      setCurrentElement((prev) =>
        prev ? { ...prev, points: [...(prev.points || []), coords] } : null
      );
    } else if (tool === "arrow" || tool === "rect" || tool === "circle") {
      setCurrentElement((prev) => (prev ? { ...prev, end: coords } : null));
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentElement) return;
    setIsDrawing(false);
    setElements((prev) => [...prev, currentElement]);
    setCurrentElement(null);
  };

  // Add text label
  const handleAddText = () => {
    if (textInput && textInput.text.trim()) {
      setElements((prev) => [
        ...prev,
        {
          id: `el_${Date.now()}`,
          type: "text",
          color,
          strokeWidth,
          text: textInput.text.trim(),
          x: textInput.x,
          y: textInput.y,
        },
      ]);
    }
    setTextInput(null);
  };

  // 5. Cloud Save & Export
  const handleSaveToCloud = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSaveStatus("saving");

    try {
      const dataUrl = canvas.toDataURL("image/png");
      const baseName = file.name.replace(/\.[^/.]+$/, "");
      const newKey = `Annotated/${baseName}_annotated.png`;

      await saveAnnotatedImageToR2(newKey, dataUrl);
      setSaveStatus("saved");
      if (onSaved) onSaved();
      setTimeout(() => setSaveStatus("idle"), 2000);
      alert(`Annotated photo successfully saved to: ${newKey}`);
    } catch (err: any) {
      alert(`Error saving to cloud: ${err.message}`);
      setSaveStatus("idle");
    }
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${file.name.replace(/\.[^/.]+$/, "")}_markup.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col select-none text-white"
      style={{ background: "rgba(18,18,20,0.96)", backdropFilter: "blur(20px)" }}
    >
      {/* ── Top Bar ─────────────────────────────────────────────────────────── */}
      <div
        className="h-13 flex items-center justify-between px-4 border-b border-white/10 flex-shrink-0"
        style={{ background: "rgba(24,24,28,0.98)", height: "52px" }}
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
            <p className="text-[10px] text-white/40">Photo Markup & Annotator</p>
          </div>
        </div>

        {/* Center: Tools */}
        <div className="flex items-center gap-1 bg-white/[0.06] rounded-xl p-1 border border-white/10">
          <button
            onClick={() => setTool("pen")}
            className={`p-2 rounded-lg transition-all ${tool === "pen" ? "bg-sky-500 text-white shadow-md shadow-sky-500/30" : "text-white/50 hover:text-white hover:bg-white/5"}`}
            title="Pen / Brush"
          >
            <Pen size={15} />
          </button>
          <button
            onClick={() => setTool("highlighter")}
            className={`p-2 rounded-lg transition-all ${tool === "highlighter" ? "bg-amber-500 text-white shadow-md shadow-amber-500/30" : "text-white/50 hover:text-white hover:bg-white/5"}`}
            title="Highlighter"
          >
            <Highlighter size={15} />
          </button>
          <button
            onClick={() => setTool("arrow")}
            className={`p-2 rounded-lg transition-all ${tool === "arrow" ? "bg-sky-500 text-white shadow-md shadow-sky-500/30" : "text-white/50 hover:text-white hover:bg-white/5"}`}
            title="Arrow Pointer"
          >
            <MoveRight size={15} />
          </button>
          <button
            onClick={() => setTool("rect")}
            className={`p-2 rounded-lg transition-all ${tool === "rect" ? "bg-sky-500 text-white shadow-md shadow-sky-500/30" : "text-white/50 hover:text-white hover:bg-white/5"}`}
            title="Rectangle"
          >
            <Square size={15} />
          </button>
          <button
            onClick={() => setTool("circle")}
            className={`p-2 rounded-lg transition-all ${tool === "circle" ? "bg-sky-500 text-white shadow-md shadow-sky-500/30" : "text-white/50 hover:text-white hover:bg-white/5"}`}
            title="Circle / Ellipse"
          >
            <Circle size={15} />
          </button>
          <button
            onClick={() => setTool("text")}
            className={`p-2 rounded-lg transition-all ${tool === "text" ? "bg-sky-500 text-white shadow-md shadow-sky-500/30" : "text-white/50 hover:text-white hover:bg-white/5"}`}
            title="Text Label"
          >
            <Type size={15} />
          </button>
          <button
            onClick={() => setTool("eraser")}
            className={`p-2 rounded-lg transition-all ${tool === "eraser" ? "bg-red-500 text-white shadow-md shadow-red-500/30" : "text-white/50 hover:text-white hover:bg-white/5"}`}
            title="Eraser"
          >
            <Eraser size={15} />
          </button>

          <div className="w-px h-5 bg-white/10 mx-1" />

          {/* Color palette */}
          <div className="flex items-center gap-1 px-1">
            {COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => setColor(c.value)}
                style={{ background: c.value }}
                className={`w-4 h-4 rounded-full transition-transform hover:scale-125 ${color === c.value ? "ring-2 ring-white scale-110 shadow-sm" : "opacity-80"}`}
                title={c.label}
              />
            ))}
          </div>

          <div className="w-px h-5 bg-white/10 mx-1" />

          {/* Stroke Width */}
          <div className="flex items-center gap-1">
            {STROKE_SIZES.map((s) => (
              <button
                key={s.value}
                onClick={() => setStrokeWidth(s.value)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${strokeWidth === s.value ? "bg-white/20 text-white" : "text-white/40 hover:text-white"}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5">
          {/* Rotate & Flip */}
          <button
            onClick={() => setRotation((r) => (r - 90 + 360) % 360)}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all"
            title="Rotate Left"
          >
            <RotateCcw size={15} />
          </button>
          <button
            onClick={() => setRotation((r) => (r + 90) % 360)}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all"
            title="Rotate Right"
          >
            <RotateCw size={15} />
          </button>
          <button
            onClick={() => setFlipH((f) => !f)}
            className={`p-1.5 rounded-lg transition-all ${flipH ? "bg-white/20 text-white" : "text-white/50 hover:text-white hover:bg-white/10"}`}
            title="Flip Horizontal"
          >
            <FlipHorizontal size={15} />
          </button>

          <div className="w-px h-5 bg-white/10 mx-1" />

          {/* Undo & Clear */}
          <button
            onClick={() => setElements((prev) => prev.slice(0, -1))}
            disabled={elements.length === 0}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all disabled:opacity-20"
            title="Undo"
          >
            <Undo2 size={15} />
          </button>
          <button
            onClick={() => setElements([])}
            disabled={elements.length === 0}
            className="p-1.5 rounded-lg text-white/50 hover:text-red-400 hover:bg-white/10 transition-all disabled:opacity-20"
            title="Clear Markup"
          >
            <Trash2 size={15} />
          </button>

          <div className="w-px h-5 bg-white/10 mx-1" />

          {/* Autosave status indicator */}
          <div className="flex items-center gap-1 text-[10px] w-14 justify-center text-white/40">
            {saveStatus === "saving" ? (
              <span className="text-white/40 animate-pulse">Saving…</span>
            ) : saveStatus === "saved" ? (
              <span className="text-emerald-400 flex items-center gap-0.5">
                <Check size={11} /> Saved
              </span>
            ) : null}
          </div>

          {/* Save to R2 Cloud */}
          <button
            onClick={handleSaveToCloud}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-white shadow-lg shadow-sky-500/25 transition-all"
            title="Save annotated image to Cloudflare R2 / Virtual Cloud"
          >
            <Cloud size={13} />
            Save to Cloud
          </button>

          {/* Download */}
          <button
            onClick={handleDownload}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all"
            title="Download Image"
          >
            <Download size={15} />
          </button>
        </div>
      </div>

      {/* ── Canvas Viewport ─────────────────────────────────────────────────── */}
      <div
        ref={containerRef}
        className="flex-1 flex items-center justify-center p-6 overflow-auto relative cursor-crosshair"
        style={{ background: "#1c1c1f" }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="rounded-xl shadow-2xl ring-1 ring-white/10 max-h-[82vh] max-w-[85vw] object-contain transition-transform"
          style={{ transform: `scale(${zoom / 100})` }}
        />

        {/* Floating Text Input Box */}
        {textInput && (
          <div
            className="absolute z-20 flex items-center gap-1 bg-black/85 p-2 rounded-xl border border-white/20 shadow-2xl"
            style={{ left: `${textInput.x}px`, top: `${textInput.y}px` }}
          >
            <input
              autoFocus
              type="text"
              value={textInput.text}
              placeholder="Enter text label…"
              onChange={(e) => setTextInput({ ...textInput, text: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddText();
                if (e.key === "Escape") setTextInput(null);
              }}
              className="bg-white/10 text-white px-2 py-1 text-xs rounded-lg outline-none focus:ring-1 focus:ring-sky-400 w-48"
            />
            <button
              onClick={handleAddText}
              className="px-2 py-1 bg-sky-500 hover:bg-sky-400 text-white rounded-lg text-xs font-semibold"
            >
              Add
            </button>
          </div>
        )}
      </div>

      {/* ── Bottom Floating Zoom Bar ────────────────────────────────────────── */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-xs">
        <button onClick={() => setZoom((z) => Math.max(z - 15, 30))} className="p-1 hover:text-sky-400">
          <ZoomOut size={13} />
        </button>
        <span className="font-mono text-[11px] w-9 text-center text-white/60">{zoom}%</span>
        <button onClick={() => setZoom((z) => Math.min(z + 15, 200))} className="p-1 hover:text-sky-400">
          <ZoomIn size={13} />
        </button>
        <div className="w-px h-3 bg-white/20 mx-1" />
        <span className="text-[10px] text-white/40">Markup Mode Active</span>
      </div>
    </div>
  );
};
