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
    items: data.items.map((it: any) => ({
      ...it,
      modified: new Date(it.modified),
      created: new Date(it.created),
    })),
  };
}

export async function getRawFileUrl(path: string): Promise<string> {
  return `${API_BASE}/file/raw?path=${encodeURIComponent(path)}`;
}

export async function getTextContent(path: string): Promise<string> {
  const res = await fetch(`${API_BASE}/file/text?path=${encodeURIComponent(path)}`);
  if (!res.ok) throw new Error("Failed to read text file");
  const data = await res.json();
  return data.content;
}

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

export async function deleteAnnotations(path: string): Promise<void> {
  await fetch(`${API_BASE}/annotations?path=${encodeURIComponent(path)}`, {
    method: "DELETE",
  });
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

export async function createFolder(parentPath: string, name: string): Promise<void> {
  const res = await fetch(`${API_BASE}/folder/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ parentPath, name }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to create folder");
  }
}

export async function createFile(parentPath: string, name: string, content = ""): Promise<void> {
  const res = await fetch(`${API_BASE}/file/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ parentPath, name, content }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to create file");
  }
}

export async function renameItem(oldPath: string, newName: string): Promise<void> {
  const res = await fetch(`${API_BASE}/file/rename`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ oldPath, newName }),
  });
  if (!res.ok) {
    const err = await res.json();
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
    const err = await res.json();
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
    const err = await res.json();
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
