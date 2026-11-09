import express from "express";
import cors from "cors";
import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import os from "os";
import { exec } from "child_process";
import multer from "multer";
import AdmZip from "adm-zip";
import dotenv from "dotenv";
dotenv.config();

import {
  getR2Config,
  updateR2Config,
  testR2Connection,
  listCloudFiles,
  getCloudFileStream,
  uploadCloudFile,
  createCloudFolder,
  deleteCloudItem,
  getCloudStorageStats,
} from "./r2.js";

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
const PHOTO_ANNOTATIONS_FILE = path.join(APP_DATA_DIR, "photo-annotations.json");
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

// ─── Multer In-Memory for R2 & Disk for Local ────────────────────────────────
const memoryUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 500 * 1024 * 1024 } }); // 500MB max per upload

// ─── Helper: Detect File Type ────────────────────────────────────────────────
function getFileType(fileName, isDir) {
  if (isDir) return "folder";
  const ext = path.extname(fileName).toLowerCase().replace(".", "");

  switch (ext) {
    case "pdf": return "pdf";
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
      return "code";
    case "txt":
    case "md":
    case "log":
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
    ".mkv": "video/x-matroska",
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".ogg": "audio/ogg",
    ".txt": "text/plain; charset=utf-8",
    ".json": "application/json",
  };
  return map[ext] || "application/octet-stream";
}

// ─── CLOUDFLARE R2 VIRTUAL STORAGE API ────────────────────────────────────────

// 1. R2 Config & Status
app.get("/api/r2/config", (req, res) => {
  res.json(getR2Config());
});

app.post("/api/r2/config", async (req, res) => {
  const result = await updateR2Config(req.body);
  res.json(result);
});

app.post("/api/r2/test", async (req, res) => {
  const result = await testR2Connection();
  res.json(result);
});

// 2. Storage Stats
app.get("/api/r2/stats", async (req, res) => {
  try {
    const stats = await getCloudStorageStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. List Cloud Files & Folders
app.get("/api/r2/files", async (req, res) => {
  const prefix = req.query.prefix || "";
  try {
    const data = await listCloudFiles(String(prefix));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Stream Cloud File (Photos, Video, Audio, PDF) with HTTP Range Support
app.get("/api/r2/raw", async (req, res) => {
  const key = req.query.key ? String(req.query.key) : "";
  if (!key) return res.status(400).send("Key required");

  try {
    const rangeHeader = req.headers.range;
    const result = await getCloudFileStream(key, rangeHeader);

    const headers = {
      "Content-Type": result.contentType || getMimeType(key),
      "Accept-Ranges": result.acceptRanges || "bytes",
    };

    if (result.contentLength) {
      headers["Content-Length"] = result.contentLength;
    }
    if (result.contentRange) {
      headers["Content-Range"] = result.contentRange;
    }

    if (rangeHeader && (result.contentRange || result.isPartial)) {
      res.writeHead(206, headers);
    } else {
      res.writeHead(200, headers);
    }

    result.stream.pipe(res);
  } catch (err) {
    res.status(500).send(`Error reading file: ${err.message}`);
  }
});

// 5. Upload File to Cloudflare R2
app.post("/api/r2/upload", memoryUpload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file provided" });
  }

  const prefix = req.query.prefix ? String(req.query.prefix).replace(/^\/+/, "") : "";
  const key = prefix ? `${prefix.replace(/\/$/, "")}/${req.file.originalname}` : req.file.originalname;

  try {
    await uploadCloudFile(key, req.file.buffer, req.file.mimetype);
    res.json({
      success: true,
      key,
      name: req.file.originalname,
      size: req.file.size,
    });
  } catch (err) {
    res.status(500).json({ error: `Upload failed: ${err.message}` });
  }
});

// 6. Create Virtual Folder in R2
app.post("/api/r2/folder", async (req, res) => {
  const { path: folderPath } = req.body;
  if (!folderPath) return res.status(400).json({ error: "Path required" });
  try {
    await createCloudFolder(folderPath);
    res.json({ success: true, path: folderPath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Delete Item / Folder in R2
app.post("/api/r2/delete", async (req, res) => {
  const { key } = req.body;
  if (!key) return res.status(400).json({ error: "Key required" });
  try {
    await deleteCloudItem(key);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── ANNOTATIONS API (For both PDF & Photos) ──────────────────────────────────

// PDF Annotations
app.get("/api/annotations", (req, res) => {
  const filePath = req.query.path ? String(req.query.path) : "";
  if (!filePath) return res.status(400).json({ error: "Path query param required" });
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

// Photo Annotations (drawings, callouts, text labels, shapes)
app.get("/api/photo-annotations", (req, res) => {
  const imagePath = req.query.path ? String(req.query.path) : "";
  if (!imagePath) return res.status(400).json({ error: "Path query param required" });
  const all = loadJson(PHOTO_ANNOTATIONS_FILE, {});
  const annotations = all[imagePath] || null;
  res.json({ path: imagePath, annotations });
});

app.post("/api/photo-annotations", (req, res) => {
  const { path: imagePath, annotations } = req.body;
  if (!imagePath || !annotations) {
    return res.status(400).json({ error: "path and annotations required" });
  }
  const all = loadJson(PHOTO_ANNOTATIONS_FILE, {});
  all[imagePath] = annotations;
  saveJson(PHOTO_ANNOTATIONS_FILE, all);
  res.json({ success: true });
});

// Save annotated photo binary directly to R2 / local cloud
app.post("/api/photo-annotations/save-image", express.json({ limit: "100mb" }), async (req, res) => {
  const { key, base64Data } = req.body;
  if (!key || !base64Data) {
    return res.status(400).json({ error: "key and base64Data required" });
  }

  try {
    const buffer = Buffer.from(base64Data.replace(/^data:image\/\w+;base64,/, ""), "base64");
    await uploadCloudFile(key, buffer, "image/png");
    res.json({ success: true, key });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── LOCAL SYSTEM / HYBRID ACCESS FALLBACKS ───────────────────────────────────

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
    } catch {}
  }
  return drives.length > 0 ? drives : [{ path: "C:\\", label: "Windows (C:)" }];
}

app.get("/api/system/info", (req, res) => {
  const home = os.homedir();
  const drives = getWindowsDrives();
  const standardDirs = [
    { id: "cloud", label: "Cloudflare R2", icon: "cloud", path: "r2://" },
    { id: "documents", label: "Documents", icon: "file-text", path: "r2://Documents" },
    { id: "photos", label: "Photos", icon: "image", path: "r2://Photos" },
    { id: "videos", label: "Videos", icon: "video", path: "r2://Videos" },
    { id: "annotated", label: "Annotated", icon: "edit-3", path: "r2://Annotated" },
    { id: "home", label: "Local Home", icon: "home", path: home },
  ];
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

// Local file listings
app.get("/api/files", async (req, res) => {
  const reqPath = req.query.path ? String(req.query.path) : "";

  // If path is a virtual cloud path (r2://...)
  if (reqPath.startsWith("r2://") || reqPath.startsWith("cloud://") || !reqPath || reqPath === "/") {
    const prefix = reqPath.replace(/^(r2:\/\/|cloud:\/\/)/, "").replace(/^\/+/, "");
    try {
      const cloudData = await listCloudFiles(prefix);
      return res.json({
        currentPath: reqPath.startsWith("r2://") ? reqPath : `r2://${prefix}`,
        parentPath: prefix ? (prefix.includes("/") ? `r2://${prefix.split("/").slice(0, -2).join("/")}` : "r2://") : null,
        isRoot: !prefix,
        items: cloudData.items,
        isCloud: true,
      });
    } catch (err) {
      return res.status(500).json({ error: err.message, items: [] });
    }
  }

  // Local filesystem
  let targetPath = path.resolve(reqPath);
  try {
    const stat = await fsp.stat(targetPath);
    if (!stat.isDirectory()) {
      return res.status(400).json({ error: "Not a directory" });
    }
    const dirents = await fsp.readdir(targetPath, { withFileTypes: true });
    const favorites = loadJson(FAVORITES_FILE, []);
    const items = [];

    for (const ent of dirents) {
      const name = ent.name;
      if (name.startsWith(".") || name.startsWith("$") || name.toLowerCase() === "desktop.ini") continue;
      const fullPath = path.join(targetPath, name);
      let size = 0;
      let modified = new Date();
      let created = new Date();
      let isDir = ent.isDirectory();

      try {
        const st = await fsp.stat(fullPath);
        size = st.size;
        modified = st.mtime;
        created = st.birthtime;
        isDir = st.isDirectory();
      } catch {}

      items.push({
        id: fullPath,
        name,
        type: getFileType(name, isDir),
        size: isDir ? undefined : size,
        modified,
        created,
        path: fullPath,
        extension: isDir ? "" : path.extname(name).replace(".", "").toLowerCase(),
        isFavorite: favorites.includes(fullPath),
        isDirectory: isDir,
      });
    }

    const parsed = path.parse(targetPath);
    res.json({
      currentPath: targetPath,
      parentPath: targetPath === parsed.root ? null : path.dirname(targetPath),
      isRoot: targetPath === parsed.root,
      items,
      isCloud: false,
    });
  } catch (err) {
    res.status(500).json({ error: err.message, items: [] });
  }
});

// Native operations
app.post("/api/file/open-native", (req, res) => {
  const { path: targetPath } = req.body;
  if (!targetPath || !fs.existsSync(targetPath)) return res.status(404).json({ error: "Path not found" });
  const cmd = process.platform === "win32" ? `start "" "${targetPath}"` : `open "${targetPath}"`;
  exec(cmd, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.post("/api/file/reveal", (req, res) => {
  const { path: targetPath } = req.body;
  if (!targetPath || !fs.existsSync(targetPath)) return res.status(404).json({ error: "Path not found" });
  const cmd = process.platform === "win32" ? `explorer.exe /select,"${targetPath}"` : `open -R "${targetPath}"`;
  exec(cmd, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`☁️ Personal Cloud & R2 File Manager Backend running at http://localhost:${PORT}`);
});
