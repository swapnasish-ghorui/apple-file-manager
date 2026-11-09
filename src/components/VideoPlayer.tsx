import React, { useEffect, useRef, useState } from "react";
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Tv,
  Download,
  Forward,
  Rewind,
} from "lucide-react";
import type { FileItem } from "../data/mockData";
import { getFileRawUrl } from "../services/api";
import { formatFileSize } from "../utils/fileUtils";

interface VideoPlayerProps {
  file: FileItem;
  onClose: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ file, onClose }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [showSpeedMenu, setShowSpeedMenu] = useState<boolean>(false);

  const videoUrl = getFileRawUrl(file.path, file.path.startsWith("r2://"));
  const controlsTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-hide controls during playback
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    if (isPlaying) {
      controlsTimeout.current = setTimeout(() => setShowControls(false), 2800);
    }
  };

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setIsPlaying(true);
    } else {
      v.pause();
      setIsPlaying(false);
    }
  };

  const seekRelative = (seconds: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.duration, v.currentTime + seconds));
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (newVol: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = newVol;
    setVolume(newVol);
    if (newVol === 0) setIsMuted(true);
    else setIsMuted(false);
  };

  const changeSpeed = (rate: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = rate;
    setPlaybackRate(rate);
    setShowSpeedMenu(false);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const togglePiP = async () => {
    const v = videoRef.current;
    if (!v) return;
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
    } else if (document.pictureInPictureEnabled) {
      await v.requestPictureInPicture();
    }
  };

  // Keyboard controls
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "k") {
        togglePlay();
        e.preventDefault();
      } else if (e.key === "ArrowLeft") {
        seekRelative(-10);
        e.preventDefault();
      } else if (e.key === "ArrowRight") {
        seekRelative(10);
        e.preventDefault();
      } else if (e.key === "m" || e.key === "M") {
        toggleMute();
      } else if (e.key === "f" || e.key === "F") {
        toggleFullscreen();
      } else if (e.key === "p" || e.key === "P") {
        togglePiP();
      } else if (e.key === "Escape") {
        if (isFullscreen) {
          document.exitFullscreen().catch(() => {});
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  function formatTime(secs: number): string {
    if (isNaN(secs)) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  }

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="fixed inset-0 z-50 flex flex-col justify-between select-none bg-black text-white"
    >
      {/* ── Top Header Bar ───────────────────────────────────────────────────── */}
      <div
        className={`h-14 flex items-center justify-between px-5 transition-opacity duration-300 z-20 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.85) 0%, transparent 100%)" }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
          <div>
            <h3 className="text-sm font-semibold text-white/95 truncate max-w-lg">{file.name}</h3>
            <p className="text-[10px] text-white/40">
              {file.size ? formatFileSize(file.size) : "Video"} · Streaming from Cloud
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={videoUrl}
            download={file.name}
            className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            title="Download Video"
          >
            <Download size={16} />
          </a>
        </div>
      </div>

      {/* ── Video Element ────────────────────────────────────────────────────── */}
      <div
        className="flex-1 flex items-center justify-center relative cursor-pointer"
        onClick={togglePlay}
      >
        <video
          ref={videoRef}
          src={videoUrl}
          autoPlay
          playsInline
          onTimeUpdate={() => {
            if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
          }}
          onLoadedMetadata={() => {
            if (videoRef.current) setDuration(videoRef.current.duration);
          }}
          onEnded={() => setIsPlaying(false)}
          className="max-h-full max-w-full object-contain"
        />

        {/* Big play button flash on pause */}
        {!isPlaying && (
          <div className="absolute inset-0 m-auto w-20 h-20 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-2xl pointer-events-none transition-transform scale-110">
            <Play size={36} className="fill-white translate-x-1" />
          </div>
        )}
      </div>

      {/* ── Bottom Controls Bar ──────────────────────────────────────────────── */}
      <div
        className={`px-6 pb-6 pt-12 transition-opacity duration-300 z-20 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        style={{ background: "linear-gradient(0deg, rgba(0,0,0,0.92) 0%, transparent 100%)" }}
      >
        {/* Progress Scrubber */}
        <div
          className="relative w-full h-1.5 bg-white/20 hover:h-2.5 rounded-full cursor-pointer transition-all mb-4 group"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickPos = (e.clientX - rect.left) / rect.width;
            const newTime = clickPos * duration;
            if (videoRef.current) videoRef.current.currentTime = newTime;
          }}
        >
          {/* Progress filled bar */}
          <div
            className="h-full bg-sky-500 rounded-full relative"
            style={{ width: `${progressPct}%` }}
          >
            <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-between">
          {/* Left: Playback & Volume */}
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="p-2 rounded-full hover:bg-white/10 text-white transition-colors"
            >
              {isPlaying ? <Pause size={18} className="fill-white" /> : <Play size={18} className="fill-white translate-x-0.5" />}
            </button>

            <button
              onClick={() => seekRelative(-10)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors flex items-center gap-0.5 text-xs font-medium"
              title="Skip -10s (←)"
            >
              <Rewind size={16} />
              <span className="text-[10px]">10s</span>
            </button>

            <button
              onClick={() => seekRelative(10)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors flex items-center gap-0.5 text-xs font-medium"
              title="Skip +10s (→)"
            >
              <Forward size={16} />
              <span className="text-[10px]">10s</span>
            </button>

            {/* Time display */}
            <div className="text-xs font-mono text-white/60 ml-2">
              <span className="text-white">{formatTime(currentTime)}</span> / {formatTime(duration)}
            </div>

            <div className="w-px h-4 bg-white/20 mx-1" />

            {/* Volume */}
            <div className="flex items-center gap-2 group">
              <button
                onClick={toggleMute}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
              >
                {isMuted || volume === 0 ? <VolumeX size={17} /> : <Volume2 size={17} />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-16 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-sky-400"
              />
            </div>
          </div>

          {/* Right: Settings & Window Modes */}
          <div className="flex items-center gap-2 relative">
            {/* Speed Selector */}
            <div className="relative">
              <button
                onClick={() => setShowSpeedMenu((v) => !v)}
                className="px-2 py-1 rounded-md text-xs font-semibold text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                {playbackRate}x
              </button>

              {showSpeedMenu && (
                <div
                  className="absolute bottom-10 right-0 bg-black/90 border border-white/15 rounded-xl p-1 shadow-2xl flex flex-col min-w-[70px] text-xs backdrop-blur-md"
                >
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map((r) => (
                    <button
                      key={r}
                      onClick={() => changeSpeed(r)}
                      className={`px-2.5 py-1 text-left rounded-lg transition-colors ${playbackRate === r ? "bg-sky-500 text-white font-bold" : "text-white/60 hover:text-white hover:bg-white/10"}`}
                    >
                      {r}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Picture in Picture */}
            <button
              onClick={togglePiP}
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              title="Picture in Picture (P)"
            >
              <Tv size={17} />
            </button>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              title="Fullscreen (F)"
            >
              {isFullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
