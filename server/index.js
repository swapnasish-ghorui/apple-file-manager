import express from "express";
import cors from "cors";
import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import os from "os";
import { exec } from "child_process";
import multer from "multer";
import AdmZip from "adm-zip";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: "50mb" }));

// ─── Data Persistence (Annotations & Favorites) ──────────────────────────────
const APP_DATA_DIR = path.join(os.homedir(), ".apple-file-manager");
if (!fs.existsSync(APP_DATA_DIR)) {
  fs.mkdirSync(APP_DATA_DIR, { recursive: true });
}

const ANNOTATIONS_FILE = path.join(APP_DATA_DIR, "annotations.json");
const FAVORITES_FILE = path.join(APP_DATA_DIR, "favorites.json");

function loadJson(file, fallback = {}) {
  try {
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, "utf8"));
    }
  } catch (err) {
    console.error(`Failed to read ${file}:`, err.message);
  }
  return fallback;
}

function saveJson(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error(`Failed to write ${file}:`, err.message);
  }
}

// ─── Multer Upload Config ────────────────────────────────────────────────────
const uploadStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dest = req.query.dest || os.homedir();
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage: uploadStorage });

// ─── Helper: Detect File Type ────────────────────────────────────────────────
function getFileType(fileName, isDir) {
  if (isDir) return "folder";
  const ext = path.extname(fileName).toLowerCase().replace(".", "");

  switch (ext) {
    case "pdf":
      return "pdf";
    case "doc":
    case "docx":
    case "rtf":
    case "odt":
      return "document";
    case "ppt":
    case "pptx":
    case "key":
      return "presentation";
    case "xls":
    case "xlsx":
    case "csv":
      return "spreadsheet";
    case "png":
    case "jpg":
    case "jpeg":
    case "gif":
    case "webp":
    case "svg":
    case "bmp":
    case "ico":
      return "image";
    case "mp4":
    case "mkv":
    case "webm":
    case "avi":
    case "mov":
      return "video";
    case "mp3":
    case "wav":
    case "ogg":
    case "flac":
    case "m4a":
    case "aac":
      return "audio";
    case "zip":
    case "tar":
    case "gz":
    case "rar":
    case "7z":
      return "archive";
    case "js":
    case "ts":
    case "jsx":
    case "tsx":
    case "html":
    case "css":
    case "py":
    case "json":
    case "rs":
    case "go":
    case "c":
    case "cpp":
    case "h":
    case "cs":
    case "java":
    case "sh":
    case "bat":
    case "ps1":
      return "code";
    case "txt":
    case "md":
    case "log":
    case "env":
    case "yml":
    case "yaml":
    case "ini":
    case "conf":
      return "text";
    default:
      return "unknown";
  }
}

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const map = {
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".mov": "video/quicktime",
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".ogg": "audio/ogg",
    ".txt": "text/plain; charset=utf-8",
    ".json": "application/json",
    ".html": "text/html",
    ".css": "text/css",
    ".js": "text/javascript",
  };
  return map[ext] || "application/octet-stream";
}

// ─── Windows Available Drives ────────────────────────────────────────────────
function getWindowsDrives() {
  if (process.platform !== "win32") {
    return [{ path: "/", label: "Root (/)" }];
  }
  const drives = [];
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  for (const letter of letters) {
    const drivePath = `${letter}:\\`;
    try {
      if (fs.existsSync(drivePath)) {
        drives.push({
          path: drivePath,
          label: letter === "C" ? "Windows (C:)" : `Drive (${letter}:)`,
          letter,
        });
      }
    } catch {
      // Ignored
    }
  }
  return drives.length > 0 ? drives : [{ path: "C:\\", label: "Windows (C:)" }];
}

// ─── API Routes ──────────────────────────────────────────────────────────────

// 1. System Info & Standard Locations
app.get("/api/system/info", (req, res) => {
  const home = os.homedir();
  const drives = getWindowsDrives();

  const standardDirs = [
    { id: "home", label: "Home", icon: "home", path: home },
    { id: "desktop", label: "Desktop", icon: "monitor", path: path.join(home, "Desktop") },
    { id: "documents", label: "Documents", icon: "file-text", path: path.join(home, "Documents") },
    { id: "downloads", label: "Downloads", icon: "download", path: path.join(home, "Downloads") },
    { id: "pictures", label: "Pictures", icon: "image", path: path.join(home, "Pictures") },
    { id: "music", label: "Music", icon: "music", path: path.join(home, "Music") },
    { id: "videos", label: "Videos", icon: "video", path: path.join(home, "Videos") },
  ].filter((item) => {
    try {
      return fs.existsSync(item.path);
    } catch {
      return false;
    }
  });

  const favorites = loadJson(FAVORITES_FILE, []);

  res.json({
    username: os.userInfo().username,
    homedir: home,
    platform: process.platform,
    drives,
    locations: standardDirs,
    favorites,
  });
});

// 2. Directory Listing
app.get("/api/files", async (req, res) => {
  let targetPath = req.query.path ? String(req.query.path) : os.homedir();
  const showHidden = req.query.showHidden === "true";

  // Normalize path
  try {
    targetPath = path.resolve(targetPath);
  } catch {
    targetPath = os.homedir();
  }

  try {
    const stat = await fsp.stat(targetPath);
    if (!stat.isDirectory()) {
      return res.status(400).json({ error: "Provided path is not a directory" });
    }

    const dirents = await fsp.readdir(targetPath, { withFileTypes: true });
    const favorites = loadJson(FAVORITES_FILE, []);

    const items = [];

    for (const ent of dirents) {
      const name = ent.name;

      // Filter hidden/system files unless requested
      const isHidden =
        name.startsWith(".") ||
        name.startsWith("$") ||
        name.toLowerCase() === "desktop.ini" ||
        name.toLowerCase() === "ntuser.dat" ||
        name.toLowerCase().startsWith("ntuser.dat{") ||
        name.toLowerCase().endsWith(".sys") ||
        name.toLowerCase() === "thumbs.db";

      if (!showHidden && isHidden) continue;

      const fullPath = path.join(targetPath, name);
      let size = 0;
      let modified = new Date();
      let created = new Date();
      let isDir = ent.isDirectory();

      try {
        const itemStat = await fsp.stat(fullPath);
        size = itemStat.size;
        modified = itemStat.mtime;
        created = itemStat.birthtime;
        isDir = itemStat.isDirectory();
      } catch {
        // Fallback if stat fails (e.g. permission)
      }

      const fileType = getFileType(name, isDir);
      const ext = isDir ? "" : path.extname(name).replace(".", "").toLowerCase();

      items.push({
        id: fullPath,
        name,
        type: fileType,
        size: isDir ? undefined : size,
        modified,
        created,
        path: fullPath,
        extension: ext,
        isFavorite: favorites.includes(fullPath),
        isDirectory: isDir,
        isHidden,
      });
    }

    // Determine parent path
    const parsed = path.parse(targetPath);
    const isRoot = targetPath === parsed.root;
    const parentPath = isRoot ? null : path.dirname(targetPath);

    res.json({
      currentPath: targetPath,
      parentPath,
      isRoot,
      items,
    });
  } catch (err) {
    res.status(500).json({
      error: `Cannot read directory: ${err.message}`,
      currentPath: targetPath,
      items: [],
    });
  }
});

// 3. Raw File Streaming (Images, PDF, Video, Audio) with HTTP Range Support
app.get("/api/file/raw", async (req, res) => {
  const filePath = req.query.path ? String(req.query.path) : "";
  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(404).send("File not found");
  }

  try {
    const stat = await fsp.stat(filePath);
    if (stat.isDirectory()) {
      return res.status(400).send("Path is a directory");
    }

    const mimeType = getMimeType(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;
      const file = fs.createReadStream(filePath, { start, end });
      const head = {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunksize,
        "Content-Type": mimeType,
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        "Content-Length": fileSize,
        "Content-Type": mimeType,
        "Accept-Ranges": "bytes",
      };
      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (err) {
    res.status(500).send(`Error reading file: ${err.message}`);
  }
});

// 4. Read Text / Code / Markdown
app.get("/api/file/text", async (req, res) => {
  const filePath = req.query.path ? String(req.query.path) : "";
  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found" });
  }

  try {
    const stat = await fsp.stat(filePath);
    if (stat.size > 5 * 1024 * 1024) {
      return res.status(400).json({ error: "File is too large to preview (>5MB)" });
    }
    const content = await fsp.readFile(filePath, "utf8");
    res.json({ content, size: stat.size, path: filePath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Word Document (.docx) Extraction
app.get("/api/file/docx", async (req, res) => {
  const filePath = req.query.path ? String(req.query.path) : "";
  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found" });
  }

  try {
    const zip = new AdmZip(filePath);
    const docEntry = zip.getEntry("word/document.xml");
    if (!docEntry) {
      return res.status(400).json({ error: "Invalid docx: document.xml not found" });
    }

    const xml = docEntry.getData().toString("utf8");

    // Clean XML to extract paragraphs
    const paragraphs = [];
    const pMatches = xml.match(/<w:p[\s\S]*?<\/w:p>/g) || [];

    for (const pXml of pMatches) {
      // Check if it's a heading
      const isHeading = /<w:pStyle\s+w:val="Heading1"/i.test(pXml)
        ? "h1"
        : /<w:pStyle\s+w:val="Heading2"/i.test(pXml)
        ? "h2"
        : /<w:pStyle\s+w:val="Heading3"/i.test(pXml)
        ? "h3"
        : null;

      // Check if list item
      const isList = /<w:numPr>/i.test(pXml);

      // Extract text inside <w:t> tags
      const textMatches = pXml.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g) || [];
      const text = textMatches
        .map((t) => t.replace(/<[^>]+>/g, ""))
        .join("")
        .trim();

      if (text) {
        paragraphs.push({
          type: isHeading || (isList ? "li" : "p"),
          text,
        });
      }
    }

    const title = path.basename(filePath, path.extname(filePath));
    const wordCount = paragraphs.reduce((acc, p) => acc + p.text.split(/\s+/).length, 0);

    res.json({
      title,
      paragraphs,
      wordCount,
    });
  } catch (err) {
    res.status(500).json({ error: `Cannot parse docx: ${err.message}` });
  }
});

// 6. PowerPoint Presentation (.pptx) Extraction
app.get("/api/file/pptx", async (req, res) => {
  const filePath = req.query.path ? String(req.query.path) : "";
  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found" });
  }

  try {
    const zip = new AdmZip(filePath);
    const zipEntries = zip.getEntries();

    // Find all slide entries
    const slideEntries = zipEntries
      .filter((e) => /^ppt\/slides\/slide\d+\.xml$/i.test(e.entryName))
      .sort((a, b) => {
        const numA = parseInt(a.entryName.match(/\d+/)[0], 10);
        const numB = parseInt(b.entryName.match(/\d+/)[0], 10);
        return numA - numB;
      });

    const slides = [];

    for (let i = 0; i < slideEntries.length; i++) {
      const entry = slideEntries[i];
      const xml = entry.getData().toString("utf8");

      // Extract all text inside <a:t>
      const textMatches = xml.match(/<a:t>([\s\S]*?)<\/a:t>/g) || [];
      const lines = textMatches.map((t) => t.replace(/<[^>]+>/g, "").trim()).filter(Boolean);

      const title = lines[0] || `Slide ${i + 1}`;
      const bullets = lines.slice(1);

      slides.push({
        index: i + 1,
        title,
        bullets,
      });
    }

    res.json({
      title: path.basename(filePath, path.extname(filePath)),
      slideCount: slides.length,
      slides,
    });
  } catch (err) {
    res.status(500).json({ error: `Cannot parse pptx: ${err.message}` });
  }
});

// 7. PDF Annotations (Autosaved to exact file path without duplicates)
app.get("/api/annotations", (req, res) => {
  const filePath = req.query.path ? String(req.query.path) : "";
  if (!filePath) {
    return res.status(400).json({ error: "Path query param required" });
  }
  const allAnnotations = loadJson(ANNOTATIONS_FILE, {});
  const highlights = allAnnotations[filePath] || [];
  res.json({ path: filePath, highlights });
});

app.post("/api/annotations", (req, res) => {
  const { path: filePath, highlights } = req.body;
  if (!filePath || !Array.isArray(highlights)) {
    return res.status(400).json({ error: "path and highlights array required" });
  }

  const allAnnotations = loadJson(ANNOTATIONS_FILE, {});
  allAnnotations[filePath] = highlights;
  saveJson(ANNOTATIONS_FILE, allAnnotations);

  res.json({ success: true, count: highlights.length });
});

app.delete("/api/annotations", (req, res) => {
  const filePath = req.query.path ? String(req.query.path) : "";
  if (!filePath) {
    return res.status(400).json({ error: "Path required" });
  }
  const allAnnotations = loadJson(ANNOTATIONS_FILE, {});
  delete allAnnotations[filePath];
  saveJson(ANNOTATIONS_FILE, allAnnotations);
  res.json({ success: true });
});

// 8. Open In Native Default Windows Program
app.post("/api/file/open-native", (req, res) => {
  const { path: targetPath } = req.body;
  if (!targetPath || !fs.existsSync(targetPath)) {
    return res.status(404).json({ error: "Path not found" });
  }

  const cmd = process.platform === "win32" ? `start "" "${targetPath}"` : `open "${targetPath}"`;
  exec(cmd, (err) => {
    if (err) {
      return res.status(500).json({ error: `Failed to open: ${err.message}` });
    }
    res.json({ success: true, message: "Opened in default application" });
  });
});

// 9. Reveal in Windows File Explorer
app.post("/api/file/reveal", (req, res) => {
  const { path: targetPath } = req.body;
  if (!targetPath || !fs.existsSync(targetPath)) {
    return res.status(404).json({ error: "Path not found" });
  }

  const cmd = process.platform === "win32" ? `explorer.exe /select,"${targetPath}"` : `open -R "${targetPath}"`;
  exec(cmd, (err) => {
    if (err) {
      return res.status(500).json({ error: `Failed to reveal: ${err.message}` });
    }
    res.json({ success: true });
  });
});

// 10. File Operations: Create Folder, Create File, Rename, Delete, Duplicate
app.post("/api/folder/create", async (req, res) => {
  const { parentPath, name } = req.body;
  if (!parentPath || !name) {
    return res.status(400).json({ error: "parentPath and name are required" });
  }
  const target = path.join(parentPath, name.trim());
  try {
    await fsp.mkdir(target, { recursive: false });
    res.json({ success: true, path: target });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/file/create", async (req, res) => {
  const { parentPath, name, content = "" } = req.body;
  if (!parentPath || !name) {
    return res.status(400).json({ error: "parentPath and name are required" });
  }
  const target = path.join(parentPath, name.trim());
  try {
    await fsp.writeFile(target, content, "utf8");
    res.json({ success: true, path: target });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/file/rename", async (req, res) => {
  const { oldPath, newName } = req.body;
  if (!oldPath || !newName) {
    return res.status(400).json({ error: "oldPath and newName are required" });
  }
  const dir = path.dirname(oldPath);
  const target = path.join(dir, newName.trim());
  try {
    await fsp.rename(oldPath, target);
    res.json({ success: true, oldPath, newPath: target });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/file/delete", async (req, res) => {
  const { path: targetPath } = req.body;
  if (!targetPath || !fs.existsSync(targetPath)) {
    return res.status(404).json({ error: "Path does not exist" });
  }
  try {
    await fsp.rm(targetPath, { recursive: true, force: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/file/duplicate", async (req, res) => {
  const { path: targetPath } = req.body;
  if (!targetPath || !fs.existsSync(targetPath)) {
    return res.status(404).json({ error: "Path does not exist" });
  }
  try {
    const dir = path.dirname(targetPath);
    const ext = path.extname(targetPath);
    const base = path.basename(targetPath, ext);
    let copyName = `${base} copy${ext}`;
    let copyPath = path.join(dir, copyName);
    let counter = 2;
    while (fs.existsSync(copyPath)) {
      copyName = `${base} copy ${counter}${ext}`;
      copyPath = path.join(dir, copyName);
      counter++;
    }

    const stat = await fsp.stat(targetPath);
    if (stat.isDirectory()) {
      await fsp.cp(targetPath, copyPath, { recursive: true });
    } else {
      await fsp.copyFile(targetPath, copyPath);
    }
    res.json({ success: true, newPath: copyPath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 11. Pin / Unpin Favorites
app.get("/api/favorites", (req, res) => {
  const favorites = loadJson(FAVORITES_FILE, []);
  res.json({ favorites });
});

app.post("/api/favorites/toggle", (req, res) => {
  const { path: targetPath } = req.body;
  if (!targetPath) {
    return res.status(400).json({ error: "Path required" });
  }
  let favorites = loadJson(FAVORITES_FILE, []);
  if (favorites.includes(targetPath)) {
    favorites = favorites.filter((p) => p !== targetPath);
  } else {
    favorites.push(targetPath);
  }
  saveJson(FAVORITES_FILE, favorites);
  res.json({ success: true, favorites });
});

// 12. Upload File
app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  res.json({ success: true, file: req.file });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🍎 Apple File Manager Backend running at http://localhost:${PORT}`);
});
