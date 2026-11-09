import type { FileType } from "../data/mockData";

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function formatDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } else if (days === 1) {
    return "Yesterday";
  } else if (days < 7) {
    return date.toLocaleDateString([], { weekday: "short" });
  } else {
    return date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: days > 365 ? "numeric" : undefined,
    });
  }
}

export function getFileColor(type: FileType): string {
  switch (type) {
    case "folder":
      return "#0ea5e9";
    case "pdf":
      return "#ef4444";
    case "image":
      return "#8b5cf6";
    case "video":
      return "#f97316";
    case "audio":
      return "#ec4899";
    case "document":
    case "word":
      return "#1d4ed8";
    case "spreadsheet":
      return "#22c55e";
    case "presentation":
      return "#c2410c";
    case "code":
      return "#06b6d4";
    case "archive":
      return "#a78bfa";
    case "text":
      return "#94a3b8";
    default:
      return "#64748b";
  }
}

export function getFileTypeLabel(type: FileType): string {
  switch (type) {
    case "folder":
      return "Folder";
    case "pdf":
      return "PDF Document";
    case "image":
      return "Image";
    case "video":
      return "Video";
    case "audio":
      return "Audio";
    case "document":
    case "word":
      return "Word Document";
    case "spreadsheet":
      return "Spreadsheet";
    case "presentation":
      return "PowerPoint Presentation";
    case "code":
      return "Source Code";
    case "archive":
      return "Archive";
    case "text":
      return "Text File";
    default:
      return "File";
  }
}
