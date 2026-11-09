import type { FileItem, SidebarItem } from "../data/mockData";

export interface SystemInfo {
  username: string;
  homedir: string;
  platform: string;
  drives: { path: string; label: string; letter?: string }[];
  locations: SidebarItem[];
  favorites: string[];
}

export interface FilesResponse {
  currentPath: string;
  parentPath: string | null;
  isRoot: boolean;
  items: FileItem[];
  isCloud?: boolean;
}

export interface R2Config {
  isConfigured: boolean;
  bucketName: string;
  accountId: string;
  publicDomain: string;
  mode: "cloudflare-r2" | "local-virtual";
}

export interface R2StorageStats {
  totalBytes: number;
  fileCount: number;
  quotaBytes: number;
  mode: string;
}

export interface DocxContent {
  title: string;
  paragraphs: { type: "h1" | "h2" | "h3" | "p" | "li"; text: string }[];
  wordCount: number;
}

export interface PptxContent {
  title: string;
  slideCount: number;
  slides: {
    index: number;
    title: string;
    bullets: string[];
  }[];
}

const API_BASE = "/api";

// ─── System & Files ──────────────────────────────────────────────────────────

export async function getSystemInfo(): Promise<SystemInfo> {
  const res = await fetch(`${API_BASE}/system/info`);
  if (!res.ok) throw new Error("Failed to load system info");
  return res.json();
}

export async function getFiles(path: string, showHidden = false): Promise<FilesResponse> {
  const params = new URLSearchParams({ path, showHidden: String(showHidden) });
  const res = await fetch(`${API_BASE}/files?${params}`);
  if (!res.ok) throw new Error("Failed to load directory");
  const data = await res.json();
  return {
    ...data,
    items: (data.items || []).map((it: any) => ({
      ...it,
      modified: new Date(it.modified),
      created: new Date(it.created),
    })),
  };
}

export function getFileRawUrl(filePath: string, isCloud = false): string {
  if (isCloud || filePath.startsWith("r2://") || !filePath.includes(":\\")) {
    const key = filePath.replace(/^r2:\/\//, "");
    return `${API_BASE}/r2/raw?key=${encodeURIComponent(key)}`;
  }
  return `${API_BASE}/file/raw?path=${encodeURIComponent(filePath)}`;
}

// ─── Cloudflare R2 Operations ────────────────────────────────────────────────

export async function getR2Config(): Promise<R2Config> {
  const res = await fetch(`${API_BASE}/r2/config`);
  if (!res.ok) throw new Error("Failed to get R2 configuration");
  return res.json();
}

export async function saveR2Config(config: {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicDomain?: string;
}): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/r2/config`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });
  return res.json();
}

export async function getR2Stats(): Promise<R2StorageStats> {
  const res = await fetch(`${API_BASE}/r2/stats`);
  if (!res.ok) return { totalBytes: 0, fileCount: 0, quotaBytes: 10 * 1024 * 1024 * 1024, mode: "unknown" };
  return res.json();
}

export async function uploadToR2(prefix: string, file: File): Promise<any> {
  const formData = new FormData();
  formData.append("file", file);
  const cleanPrefix = prefix.replace(/^r2:\/\//, "");
  const res = await fetch(`${API_BASE}/r2/upload?prefix=${encodeURIComponent(cleanPrefix)}`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Upload failed");
  }
  return res.json();
}

export async function createCloudFolder(path: string): Promise<void> {
  const clean = path.replace(/^r2:\/\//, "");
  const res = await fetch(`${API_BASE}/r2/folder`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: clean }),
  });
  if (!res.ok) throw new Error("Failed to create cloud folder");
}

export async function deleteCloudItem(path: string): Promise<void> {
  const key = path.replace(/^r2:\/\//, "");
  const res = await fetch(`${API_BASE}/r2/delete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key }),
  });
  if (!res.ok) throw new Error("Failed to delete item from cloud");
}

// ─── PDF & Photo Annotations ─────────────────────────────────────────────────

export async function getAnnotations(path: string): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE}/annotations?path=${encodeURIComponent(path)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.highlights || [];
  } catch {
    return [];
  }
}

export async function saveAnnotations(path: string, highlights: any[]): Promise<void> {
  await fetch(`${API_BASE}/annotations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, highlights }),
  });
}

export async function getPhotoAnnotations(path: string): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/photo-annotations?path=${encodeURIComponent(path)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.annotations;
  } catch {
    return null;
  }
}

export async function savePhotoAnnotations(path: string, annotations: any): Promise<void> {
  await fetch(`${API_BASE}/photo-annotations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, annotations }),
  });
}

export async function saveAnnotatedImageToR2(key: string, base64Data: string): Promise<void> {
  const cleanKey = key.replace(/^r2:\/\//, "");
  const res = await fetch(`${API_BASE}/photo-annotations/save-image`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key: cleanKey, base64Data }),
  });
  if (!res.ok) throw new Error("Failed to save annotated image");
}

// ─── Document Viewers ────────────────────────────────────────────────────────

export async function getDocxPreview(path: string): Promise<DocxContent> {
  const res = await fetch(`${API_BASE}/file/docx?path=${encodeURIComponent(path)}`);
  if (!res.ok) throw new Error("Failed to parse docx");
  return res.json();
}

export async function getPptxPreview(path: string): Promise<PptxContent> {
  const res = await fetch(`${API_BASE}/file/pptx?path=${encodeURIComponent(path)}`);
  if (!res.ok) throw new Error("Failed to parse pptx");
  return res.json();
}

// ─── Native Helpers ──────────────────────────────────────────────────────────

export async function createFolder(parentPath: string, name: string): Promise<void> {
  const res = await fetch(`${API_BASE}/folder/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ parentPath, name }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to create folder");
  }
}

export async function renameItem(oldPath: string, newName: string): Promise<void> {
  const res = await fetch(`${API_BASE}/file/rename`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ oldPath, newName }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to rename item");
  }
}

export async function deleteItem(path: string): Promise<void> {
  const res = await fetch(`${API_BASE}/file/delete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to delete item");
  }
}

export async function duplicateItem(path: string): Promise<void> {
  const res = await fetch(`${API_BASE}/file/duplicate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to duplicate item");
  }
}

export async function toggleFavorite(path: string): Promise<string[]> {
  const res = await fetch(`${API_BASE}/favorites/toggle`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path }),
  });
  const data = await res.json();
  return data.favorites || [];
}

export async function openNativeApp(path: string): Promise<void> {
  await fetch(`${API_BASE}/file/open-native`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path }),
  });
}

export async function revealInExplorer(path: string): Promise<void> {
  await fetch(`${API_BASE}/file/reveal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path }),
  });
}
