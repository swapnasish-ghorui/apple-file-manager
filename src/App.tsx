import { useState, useCallback, useMemo, useEffect } from "react";
import type { FileItem, SidebarItem } from "./data/mockData";
import { MOCK_FILES } from "./data/mockData";
import { TitleBar } from "./components/TitleBar";
import { Sidebar } from "./components/Sidebar";
import { Toolbar } from "./components/Toolbar";
import type { ViewMode, SortKey, SortDir } from "./components/Toolbar";
import { FileGrid, FileList } from "./components/FileView";
import { InfoPanel } from "./components/InfoPanel";
import { ContextMenu } from "./components/ContextMenu";
import { PDFViewer } from "./components/PDFViewer";
import { WordViewer } from "./components/WordViewer";
import { PresentationViewer } from "./components/PresentationViewer";
import { MediaViewer } from "./components/MediaViewer";
import {
  getSystemInfo,
  getFiles,
  createFolder,
  renameItem,
  deleteItem,
  duplicateItem,
  openNativeApp,
  revealInExplorer,
  toggleFavorite,
} from "./services/api";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildBreadcrumbs(currentPath: string): { label: string; path: string }[] {
  if (!currentPath || currentPath === "/" || currentPath === "/Home") {
    return [{ label: "Home", path: "/" }];
  }

  // Windows paths: e.g. C:\Users\MOON\Documents
  if (/^[a-zA-Z]:\\/i.test(currentPath) || /^[a-zA-Z]:\//i.test(currentPath)) {
    const driveRoot = currentPath.substring(0, 3); // "C:\"
    const crumbs = [{ label: driveRoot.replace(/\\|\//, ""), path: driveRoot }];
    const rest = currentPath.substring(3).split(/[\\/]/).filter(Boolean);
    let accum = driveRoot;
    for (const seg of rest) {
      accum = accum.endsWith("\\") ? accum + seg : accum + "\\" + seg;
      crumbs.push({ label: seg, path: accum });
    }
    return crumbs;
  }

  // Fallback / mock paths
  const parts = currentPath.split("/").filter(Boolean);
  const crumbs = [{ label: "Home", path: "/" }];
  let accum = "";
  for (const part of parts) {
    accum += "/" + part;
    crumbs.push({ label: part, path: accum });
  }
  return crumbs;
}

function sortFiles(files: FileItem[], key: SortKey, dir: SortDir): FileItem[] {
  return [...files].sort((a, b) => {
    // Folders always first
    if (a.type === "folder" && b.type !== "folder") return -1;
    if (a.type !== "folder" && b.type === "folder") return 1;

    let cmp = 0;
    switch (key) {
      case "name":
        cmp = a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
        break;
      case "size":
        cmp = (a.size ?? 0) - (b.size ?? 0);
        break;
      case "modified":
        cmp = new Date(a.modified).getTime() - new Date(b.modified).getTime();
        break;
      case "type":
        cmp = a.type.localeCompare(b.type);
        break;
    }
    return dir === "asc" ? cmp : -cmp;
  });
}

// ─── Main App ────────────────────────────────────────────────────────────────

export default function App() {
  const [currentPath, setCurrentPath] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [items, setItems] = useState<FileItem[]>([]);
  const [locations, setLocations] = useState<SidebarItem[]>([]);
  const [drives, setDrives] = useState<{ path: string; label: string }[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);

  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selected, setSelected] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [searchQuery, setSearchQuery] = useState("");
  const [showHidden, setShowHidden] = useState(false);
  const [showInfo, setShowInfo] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Viewers
  const [pdfFile, setPdfFile] = useState<FileItem | null>(null);
  const [wordFile, setWordFile] = useState<FileItem | null>(null);
  const [presentationFile, setPresentationFile] = useState<FileItem | null>(null);
  const [mediaFile, setMediaFile] = useState<FileItem | null>(null);

  // Dialogs & Context Menu
  const [contextMenu, setContextMenu] = useState<{ file: FileItem; x: number; y: number } | null>(null);
  const [promptModal, setPromptModal] = useState<{
    type: "newFolder" | "rename";
    target?: FileItem;
    defaultValue: string;
  } | null>(null);
  const [promptInput, setPromptInput] = useState("");

  // 1. Initial Load: System Info & Start Path
  useEffect(() => {
    getSystemInfo()
      .then((info) => {
        setLocations(info.locations || []);
        setDrives(info.drives || []);
        setFavorites(info.favorites || []);

        // Priority starting path: Documents -> Home -> C:\
        const docLocation = info.locations?.find((l) => l.id === "documents");
        const startPath = docLocation?.path || info.homedir || "C:\\";

        setCurrentPath(startPath);
        setHistory([startPath]);
        setHistoryIdx(0);
      })
      .catch(() => {
        // Fallback to mock data if backend not reachable yet
        setItems(MOCK_FILES);
        setCurrentPath("/");
        setHistory(["/"]);
        setHistoryIdx(0);
      });
  }, []);

  // 2. Load Directory Contents
  const loadDirectory = useCallback(
    async (dirPath: string) => {
      if (!dirPath) return;
      setIsLoading(true);
      setStatusMessage(null);

      try {
        const res = await getFiles(dirPath, showHidden);
        setItems(res.items);
        setSelected([]);
      } catch (err: any) {
        setStatusMessage(err.message || "Failed to load directory");
      } finally {
        setIsLoading(false);
      }
    },
    [showHidden]
  );

  useEffect(() => {
    if (currentPath) {
      loadDirectory(currentPath);
    }
  }, [currentPath, loadDirectory]);

  // 3. Navigation Controls
  const navigate = useCallback(
    (newPath: string) => {
      if (!newPath || newPath.toLowerCase() === currentPath.toLowerCase()) return;
      setCurrentPath(newPath);
      setSelected([]);
      setSearchQuery("");
      const nextHistory = [...history.slice(0, historyIdx + 1), newPath];
      setHistory(nextHistory);
      setHistoryIdx(nextHistory.length - 1);
    },
    [currentPath, history, historyIdx]
  );

  const goBack = useCallback(() => {
    if (historyIdx > 0) {
      const nextIdx = historyIdx - 1;
      setHistoryIdx(nextIdx);
      setCurrentPath(history[nextIdx]);
      setSelected([]);
    }
  }, [history, historyIdx]);

  const goForward = useCallback(() => {
    if (historyIdx < history.length - 1) {
      const nextIdx = historyIdx + 1;
      setHistoryIdx(nextIdx);
      setCurrentPath(history[nextIdx]);
      setSelected([]);
    }
  }, [history, historyIdx]);

  // 4. File Open Handling (Smart Viewer Selection)
  const handleOpen = useCallback(
    (file: FileItem) => {
      if (file.isDirectory || file.type === "folder") {
        navigate(file.path);
        return;
      }

      switch (file.type) {
        case "pdf":
          setPdfFile(file);
          break;
        case "document":
        case "word":
          setWordFile(file);
          break;
        case "presentation":
          setPresentationFile(file);
          break;
        case "image":
        case "video":
        case "audio":
          setMediaFile(file);
          break;
        default:
          // Try native system open
          openNativeApp(file.path).catch(() => {});
          break;
      }
    },
    [navigate]
  );

  // 5. File Operations
  const handleCreateFolder = async (folderName: string) => {
    if (!folderName.trim()) return;
    try {
      await createFolder(currentPath, folderName.trim());
      await loadDirectory(currentPath);
    } catch (err: any) {
      alert(`Error creating folder: ${err.message}`);
    }
  };

  const handleRenameItem = async (file: FileItem, newName: string) => {
    if (!newName.trim() || newName.trim() === file.name) return;
    try {
      await renameItem(file.path, newName.trim());
      await loadDirectory(currentPath);
    } catch (err: any) {
      alert(`Error renaming item: ${err.message}`);
    }
  };

  const handleDeleteItem = async (file: FileItem) => {
    if (confirm(`Are you sure you want to delete "${file.name}"?`)) {
      try {
        await deleteItem(file.path);
        await loadDirectory(currentPath);
      } catch (err: any) {
        alert(`Error deleting item: ${err.message}`);
      }
    }
  };

  const handleDuplicateItem = async (file: FileItem) => {
    try {
      await duplicateItem(file.path);
      await loadDirectory(currentPath);
    } catch (err: any) {
      alert(`Error duplicating item: ${err.message}`);
    }
  };

  const handleToggleFavorite = async (file: FileItem) => {
    try {
      const updated = await toggleFavorite(file.path);
      setFavorites(updated);
      setItems((prev) =>
        prev.map((it) => (it.path === file.path ? { ...it, isFavorite: !it.isFavorite } : it))
      );
    } catch {
      // Ignored
    }
  };

  // 6. Selection & Sorting
  const handleSelect = useCallback((id: string, multi: boolean) => {
    setSelected((prev) => {
      if (multi) {
        return prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id];
      }
      return [id];
    });
  }, []);

  const handleSort = useCallback(
    (key: SortKey) => {
      if (sortKey === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(key);
        setSortDir("asc");
      }
    },
    [sortKey]
  );

  // 7. Filtered & Sorted list
  const filteredAndSorted = useMemo(() => {
    let result = items;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((f) => f.name.toLowerCase().includes(q));
    }
    return sortFiles(result, sortKey, sortDir);
  }, [items, searchQuery, sortKey, sortDir]);

  const selectedFile = useMemo(() => {
    if (selected.length !== 1) return null;
    return items.find((f) => f.id === selected[0] || f.path === selected[0]) ?? null;
  }, [selected, items]);

  const breadcrumbs = useMemo(() => buildBreadcrumbs(currentPath), [currentPath]);

  // 8. Keyboard Shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (promptModal) return; // Don't intercept while typing in modal

      if (e.key === "Escape") {
        if (pdfFile) { setPdfFile(null); return; }
        if (wordFile) { setWordFile(null); return; }
        if (presentationFile) { setPresentationFile(null); return; }
        if (mediaFile) { setMediaFile(null); return; }
        setContextMenu(null);
        setSelected([]);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "[") {
        goBack();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "]") {
        goForward();
      }
      if (e.key === "Enter" && selectedFile) {
        handleOpen(selectedFile);
      }
      if (e.key === " " && selectedFile && !pdfFile && !wordFile && !presentationFile && !mediaFile) {
        handleOpen(selectedFile);
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [pdfFile, wordFile, presentationFile, mediaFile, selectedFile, promptModal, goBack, goForward, handleOpen]);

  return (
    <div className="flex flex-col h-screen overflow-hidden text-white" style={{ background: "#1c1c1e" }}>
      {/* Title Bar with Apple Finder Two-Tone Logo */}
      <TitleBar title={breadcrumbs[breadcrumbs.length - 1]?.label || "Finder"} />

      {/* Main Body */}
      <div className="flex flex-1 overflow-hidden" onClick={() => setContextMenu(null)}>
        {/* Sidebar */}
        <Sidebar
          currentPath={currentPath}
          onNavigate={navigate}
          favorites={favorites}
          locations={locations}
          drives={drives}
        />

        {/* Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Finder Toolbar */}
          <Toolbar
            breadcrumbs={breadcrumbs}
            onNavigate={navigate}
            canGoBack={historyIdx > 0}
            canGoForward={historyIdx < history.length - 1}
            onBack={goBack}
            onForward={goForward}
            viewMode={viewMode}
            onViewMode={setViewMode}
            searchQuery={searchQuery}
            onSearch={setSearchQuery}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={handleSort}
            onNewFolder={() => {
              setPromptInput("New Folder");
              setPromptModal({ type: "newFolder", defaultValue: "New Folder" });
            }}
            onRefresh={() => loadDirectory(currentPath)}
            showHidden={showHidden}
            onToggleHidden={() => setShowHidden((v) => !v)}
          />

          {/* Status Sub-bar */}
          <div
            className="h-7 flex items-center justify-between px-4 border-b border-white/[0.04] text-[11px] text-white/35 flex-shrink-0"
            style={{ background: "rgba(30,30,32,0.7)" }}
          >
            <span>
              {isLoading ? "Reading disk…" : `${filteredAndSorted.length} items`}
              {selected.length > 0 && ` · ${selected.length} selected`}
            </span>
            <span className="font-mono truncate max-w-sm">{currentPath}</span>
          </div>

          {/* Error notice if directory failed */}
          {statusMessage && (
            <div className="p-3 bg-red-500/10 border-b border-red-500/20 text-red-300 text-xs flex items-center justify-between">
              <span>{statusMessage}</span>
              <button
                onClick={() => setStatusMessage(null)}
                className="text-red-400 hover:text-white text-xs underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* File Grid / List */}
          <div
            className="flex-1 overflow-y-auto"
            onClick={() => setSelected([])}
          >
            {viewMode === "grid" ? (
              <FileGrid
                files={filteredAndSorted}
                selected={selected}
                onSelect={handleSelect}
                onOpen={handleOpen}
                onContextMenu={(e, file) => {
                  e.preventDefault();
                  setContextMenu({ file, x: e.clientX, y: e.clientY });
                  if (!selected.includes(file.id)) setSelected([file.id]);
                }}
                onToggleFavorite={handleToggleFavorite}
              />
            ) : (
              <FileList
                files={filteredAndSorted}
                selected={selected}
                onSelect={handleSelect}
                onOpen={handleOpen}
                onContextMenu={(e, file) => {
                  e.preventDefault();
                  setContextMenu({ file, x: e.clientX, y: e.clientY });
                  if (!selected.includes(file.id)) setSelected([file.id]);
                }}
              />
            )}
          </div>
        </div>

        {/* Info / Metadata Inspector Panel */}
        {showInfo && (
          <InfoPanel
            file={selectedFile}
            onClose={() => setShowInfo(false)}
          />
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          file={contextMenu.file}
          position={{ x: contextMenu.x, y: contextMenu.y }}
          onClose={() => setContextMenu(null)}
          onOpen={() => handleOpen(contextMenu.file)}
          onPreview={() => handleOpen(contextMenu.file)}
          onToggleFavorite={() => handleToggleFavorite(contextMenu.file)}
          onDelete={() => handleDeleteItem(contextMenu.file)}
          onOpenNative={() => openNativeApp(contextMenu.file.path)}
          onRevealInExplorer={() => revealInExplorer(contextMenu.file.path)}
          onDuplicate={() => handleDuplicateItem(contextMenu.file)}
          onRename={() => {
            setPromptInput(contextMenu.file.name);
            setPromptModal({
              type: "rename",
              target: contextMenu.file,
              defaultValue: contextMenu.file.name,
            });
          }}
          onCopyPath={() => navigator.clipboard.writeText(contextMenu.file.path)}
        />
      )}

      {/* Built-in PDF Viewer with Highlighting & Autosave */}
      {pdfFile && (
        <PDFViewer file={pdfFile} onClose={() => setPdfFile(null)} />
      )}

      {/* Built-in Word Document Viewer */}
      {wordFile && (
        <WordViewer file={wordFile} onClose={() => setWordFile(null)} />
      )}

      {/* Built-in PowerPoint Presentation Viewer */}
      {presentationFile && (
        <PresentationViewer file={presentationFile} onClose={() => setPresentationFile(null)} />
      )}

      {/* Media Viewer (Images, Audio, Video) */}
      {mediaFile && (
        <MediaViewer file={mediaFile} onClose={() => setMediaFile(null)} />
      )}

      {/* Clean Apple-style Prompt Modal (New Folder / Rename) */}
      {promptModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
        >
          <div
            className="w-80 rounded-2xl border border-white/10 p-5 shadow-2xl flex flex-col gap-4"
            style={{ background: "rgba(40,40,42,0.98)" }}
          >
            <h3 className="text-sm font-semibold text-white">
              {promptModal.type === "newFolder" ? "New Folder" : "Rename Item"}
            </h3>
            <input
              autoFocus
              type="text"
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (promptModal.type === "newFolder") {
                    handleCreateFolder(promptInput);
                  } else if (promptModal.target) {
                    handleRenameItem(promptModal.target, promptInput);
                  }
                  setPromptModal(null);
                } else if (e.key === "Escape") {
                  setPromptModal(null);
                }
              }}
              className="w-full px-3 py-1.5 text-xs rounded-lg bg-white/10 border border-white/15 text-white outline-none focus:border-sky-500"
            />
            <div className="flex items-center justify-end gap-2 text-xs">
              <button
                onClick={() => setPromptModal(null)}
                className="px-3 py-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/8 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (promptModal.type === "newFolder") {
                    handleCreateFolder(promptInput);
                  } else if (promptModal.target) {
                    handleRenameItem(promptModal.target, promptInput);
                  }
                  setPromptModal(null);
                }}
                className="px-4 py-1.5 rounded-lg bg-sky-500 text-white font-medium hover:bg-sky-400 transition-colors shadow-lg shadow-sky-500/20"
              >
                {promptModal.type === "newFolder" ? "Create" : "Rename"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
