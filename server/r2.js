import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  CopyObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import os from "os";

// ─── Local Virtual Storage Fallback Directory ─────────────────────────────────
const DATA_DIR = path.join(os.homedir(), ".apple-file-manager");
const R2_CONFIG_FILE = path.join(DATA_DIR, "r2-config.json");
const LOCAL_STORAGE_DIR = path.join(DATA_DIR, "virtual-cloud");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(LOCAL_STORAGE_DIR)) fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true });

// Create initial starter folders in virtual cloud if empty
const DEFAULT_FOLDERS = ["Documents", "Photos", "Videos", "Annotated"];
for (const folder of DEFAULT_FOLDERS) {
  const p = path.join(LOCAL_STORAGE_DIR, folder);
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

// ─── R2 Config State ──────────────────────────────────────────────────────────
let r2Config = {
  accountId: process.env.R2_ACCOUNT_ID || "",
  accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  bucketName: process.env.R2_BUCKET_NAME || "",
  publicDomain: process.env.R2_PUBLIC_DOMAIN || "",
};

// Load saved config if exists
if (fs.existsSync(R2_CONFIG_FILE)) {
  try {
    const saved = JSON.parse(fs.readFileSync(R2_CONFIG_FILE, "utf8"));
    r2Config = { ...r2Config, ...saved };
  } catch (err) {
    console.error("Failed to load R2 config file:", err.message);
  }
}

let s3Client = null;

function initS3Client() {
  if (
    r2Config.accountId &&
    r2Config.accessKeyId &&
    r2Config.secretAccessKey &&
    r2Config.bucketName
  ) {
    s3Client = new S3Client({
      region: "auto",
      endpoint: `https://${r2Config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: r2Config.accessKeyId,
        secretAccessKey: r2Config.secretAccessKey,
      },
    });
    console.log(`☁️ Cloudflare R2 Client initialized for bucket: ${r2Config.bucketName}`);
  } else {
    s3Client = null;
    console.log("📂 Running in Local Virtual Cloud Mode (R2 credentials not set)");
  }
}

initS3Client();

// ─── Exported R2 Service Functions ────────────────────────────────────────────

export function getR2Config() {
  return {
    isConfigured: !!s3Client,
    bucketName: r2Config.bucketName,
    accountId: r2Config.accountId ? `${r2Config.accountId.slice(0, 6)}...` : "",
    publicDomain: r2Config.publicDomain,
    mode: s3Client ? "cloudflare-r2" : "local-virtual",
  };
}

export async function updateR2Config(newConfig) {
  r2Config = {
    ...r2Config,
    ...newConfig,
  };
  fs.writeFileSync(R2_CONFIG_FILE, JSON.stringify(r2Config, null, 2), "utf8");
  initS3Client();
  return testR2Connection();
}

export async function testR2Connection() {
  if (!s3Client) {
    return { success: false, message: "Missing required R2 credentials (Account ID, Access Key, Secret Key, Bucket Name)" };
  }
  try {
    const cmd = new ListObjectsV2Command({
      Bucket: r2Config.bucketName,
      MaxKeys: 1,
    });
    await s3Client.send(cmd);
    return { success: true, message: `Successfully connected to Cloudflare R2 bucket: "${r2Config.bucketName}"` };
  } catch (err) {
    return { success: false, message: `Cloudflare R2 Connection Failed: ${err.message}` };
  }
}

/**
 * List files and virtual folders in cloud storage
 * @param {string} prefix - folder prefix e.g. "Documents/" or ""
 */
export async function listCloudFiles(prefix = "") {
  // Normalize prefix
  let cleanPrefix = prefix.replace(/^\/+/, "");
  if (cleanPrefix && !cleanPrefix.endsWith("/")) cleanPrefix += "/";

  if (s3Client) {
    // ── Real Cloudflare R2 ────────────────────────────────────────────────────
    const cmd = new ListObjectsV2Command({
      Bucket: r2Config.bucketName,
      Prefix: cleanPrefix,
      Delimiter: "/",
    });
    const response = await s3Client.send(cmd);

    const items = [];

    // Virtual Folders (CommonPrefixes)
    if (response.CommonPrefixes) {
      for (const cp of response.CommonPrefixes) {
        const folderKey = cp.Prefix;
        const name = folderKey.slice(cleanPrefix.length).replace(/\/$/, "");
        if (name) {
          items.push({
            id: folderKey,
            name,
            type: "folder",
            path: folderKey,
            isDirectory: true,
            modified: new Date(),
            created: new Date(),
          });
        }
      }
    }

    // Files (Contents)
    if (response.Contents) {
      for (const obj of response.Contents) {
        if (obj.Key === cleanPrefix) continue; // skip folder marker object
        const name = obj.Key.slice(cleanPrefix.length);
        if (!name || name.includes("/")) continue; // nested sub-items handled by CommonPrefixes

        const ext = path.extname(name).replace(".", "").toLowerCase();
        const type = detectType(name, false);

        items.push({
          id: obj.Key,
          name,
          type,
          size: obj.Size,
          modified: obj.LastModified || new Date(),
          created: obj.LastModified || new Date(),
          path: obj.Key,
          extension: ext,
          isDirectory: false,
          storage: "r2",
        });
      }
    }

    return {
      currentPath: cleanPrefix,
      isRoot: cleanPrefix === "",
      items,
      storageMode: "r2",
    };
  } else {
    // ── Local Virtual Cloud Storage Fallback ──────────────────────────────────
    const targetDir = path.join(LOCAL_STORAGE_DIR, cleanPrefix);
    if (!fs.existsSync(targetDir)) {
      await fsp.mkdir(targetDir, { recursive: true });
    }

    const dirents = await fsp.readdir(targetDir, { withFileTypes: true });
    const items = [];

    for (const ent of dirents) {
      const name = ent.name;
      const fullPath = path.join(targetDir, name);
      const isDir = ent.isDirectory();
      let size = 0;
      let modified = new Date();
      let created = new Date();

      try {
        const st = await fsp.stat(fullPath);
        size = st.size;
        modified = st.mtime;
        created = st.birthtime;
      } catch {}

      const ext = isDir ? "" : path.extname(name).replace(".", "").toLowerCase();
      const relativePath = cleanPrefix ? `${cleanPrefix}${name}${isDir ? "/" : ""}` : `${name}${isDir ? "/" : ""}`;

      items.push({
        id: relativePath,
        name,
        type: detectType(name, isDir),
        size: isDir ? undefined : size,
        modified,
        created,
        path: relativePath,
        extension: ext,
        isDirectory: isDir,
        storage: "local-cloud",
      });
    }

    return {
      currentPath: cleanPrefix,
      isRoot: cleanPrefix === "",
      items,
      storageMode: "local-cloud",
    };
  }
}

/**
 * Get readable stream / buffer for a file
 */
export async function getCloudFileStream(key, rangeHeader = null) {
  if (s3Client) {
    const params = {
      Bucket: r2Config.bucketName,
      Key: key,
    };
    if (rangeHeader) {
      params.Range = rangeHeader;
    }

    const cmd = new GetObjectCommand(params);
    const data = await s3Client.send(cmd);
    return {
      stream: data.Body,
      contentLength: data.ContentLength,
      contentType: data.ContentType,
      contentRange: data.ContentRange,
      acceptRanges: data.AcceptRanges || "bytes",
    };
  } else {
    const fullPath = path.join(LOCAL_STORAGE_DIR, key);
    if (!fs.existsSync(fullPath)) throw new Error("File not found");

    const stat = await fsp.stat(fullPath);
    const fileSize = stat.size;
    const contentType = getMimeType(key);

    if (rangeHeader) {
      const parts = rangeHeader.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;
      const stream = fs.createReadStream(fullPath, { start, end });
      return {
        stream,
        contentLength: chunksize,
        contentType,
        contentRange: `bytes ${start}-${end}/${fileSize}`,
        acceptRanges: "bytes",
        isPartial: true,
      };
    }

    return {
      stream: fs.createReadStream(fullPath),
      contentLength: fileSize,
      contentType,
      acceptRanges: "bytes",
      isPartial: false,
    };
  }
}

/**
 * Upload file to cloud storage
 */
export async function uploadCloudFile(key, buffer, contentType) {
  if (s3Client) {
    const cmd = new PutObjectCommand({
      Bucket: r2Config.bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType || getMimeType(key),
    });
    return s3Client.send(cmd);
  } else {
    const fullPath = path.join(LOCAL_STORAGE_DIR, key);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) await fsp.mkdir(dir, { recursive: true });
    await fsp.writeFile(fullPath, buffer);
    return { success: true };
  }
}

/**
 * Create a virtual folder in cloud storage
 */
export async function createCloudFolder(folderPath) {
  let clean = folderPath.replace(/^\/+/, "");
  if (!clean.endsWith("/")) clean += "/";

  if (s3Client) {
    const cmd = new PutObjectCommand({
      Bucket: r2Config.bucketName,
      Key: clean,
      Body: "",
      ContentType: "application/x-directory",
    });
    return s3Client.send(cmd);
  } else {
    const fullPath = path.join(LOCAL_STORAGE_DIR, clean);
    await fsp.mkdir(fullPath, { recursive: true });
    return { success: true };
  }
}

/**
 * Delete a file or virtual folder
 */
export async function deleteCloudItem(key) {
  if (s3Client) {
    const isFolder = key.endsWith("/");
    if (isFolder) {
      // List all objects with this prefix and delete them
      const listCmd = new ListObjectsV2Command({
        Bucket: r2Config.bucketName,
        Prefix: key,
      });
      const listRes = await s3Client.send(listCmd);
      if (listRes.Contents && listRes.Contents.length > 0) {
        const deleteCmd = new DeleteObjectsCommand({
          Bucket: r2Config.bucketName,
          Delete: {
            Objects: listRes.Contents.map((c) => ({ Key: c.Key })),
          },
        });
        await s3Client.send(deleteCmd);
      }
    }
    const cmd = new DeleteObjectCommand({
      Bucket: r2Config.bucketName,
      Key: key,
    });
    return s3Client.send(cmd);
  } else {
    const fullPath = path.join(LOCAL_STORAGE_DIR, key);
    if (fs.existsSync(fullPath)) {
      await fsp.rm(fullPath, { recursive: true, force: true });
    }
    return { success: true };
  }
}

/**
 * Calculate total cloud storage usage
 */
export async function getCloudStorageStats() {
  if (s3Client) {
    let totalSize = 0;
    let fileCount = 0;
    let continuationToken = null;

    do {
      const cmd = new ListObjectsV2Command({
        Bucket: r2Config.bucketName,
        ContinuationToken: continuationToken,
      });
      const res = await s3Client.send(cmd);
      if (res.Contents) {
        for (const item of res.Contents) {
          totalSize += item.Size || 0;
          fileCount++;
        }
      }
      continuationToken = res.NextContinuationToken;
    } while (continuationToken);

    return {
      totalBytes: totalSize,
      fileCount,
      quotaBytes: 10 * 1024 * 1024 * 1024, // 10 GB Cloudflare R2 Free Tier
      mode: "cloudflare-r2",
    };
  } else {
    // Local directory stats
    let totalSize = 0;
    let fileCount = 0;

    async function walk(dir) {
      const entries = await fsp.readdir(dir, { withFileTypes: true });
      for (const ent of entries) {
        const fp = path.join(dir, ent.name);
        if (ent.isDirectory()) {
          await walk(fp);
        } else {
          try {
            const st = await fsp.stat(fp);
            totalSize += st.size;
            fileCount++;
          } catch {}
        }
      }
    }

    await walk(LOCAL_STORAGE_DIR);
    return {
      totalBytes: totalSize,
      fileCount,
      quotaBytes: 10 * 1024 * 1024 * 1024,
      mode: "local-virtual",
    };
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function detectType(fileName, isDir) {
  if (isDir) return "folder";
  const ext = path.extname(fileName).toLowerCase().replace(".", "");
  switch (ext) {
    case "pdf": return "pdf";
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
    case "webm":
    case "mov":
    case "mkv":
    case "avi":
      return "video";
    case "mp3":
    case "wav":
    case "ogg":
    case "flac":
    case "m4a":
    case "aac":
      return "audio";
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
    case "zip":
    case "tar":
    case "gz":
    case "rar":
    case "7z":
      return "archive";
    case "txt":
    case "md":
    case "json":
    case "js":
    case "ts":
      return "text";
    default:
      return "unknown";
  }
}

function getMimeType(fileName) {
  const ext = path.extname(fileName).toLowerCase();
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
