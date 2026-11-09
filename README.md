# ☁️ Apple-Style Personal Cloud Storage & Media Suite (Powered by Cloudflare R2)

A personal virtual cloud storage app styled like Apple macOS Finder & iCloud Drive. Built with **React**, **Node.js**, and **Cloudflare R2** (S3-compatible zero-egress object storage). Features a comprehensive **PDF annotation suite**, a full-featured **Photo markup tool**, direct **Video streaming player**, and local Windows/hybrid filesystem browsing.

---

## 🌟 Key Capabilities

### 1. ☁️ Personal Cloud Storage (Cloudflare R2 + Local Cloud Hybrid)
- **Zero Egress Fees**: Direct integration with Cloudflare R2 object storage.
- **Out-of-the-Box Local Fallback**: Works immediately in local virtual cloud mode without requiring R2 keys; connects instantly once credentials are provided.
- **In-App R2 Config Modal**: Enter your Cloudflare Account ID, Access Key, Secret Key, and Bucket Name directly in the UI with instant connection testing.
- **Drag & Drop Upload**: Drag files directly from your desktop into any cloud folder (`r2://Documents`, `r2://Photos`, `r2://Videos`, `r2://Annotated`).
- **Storage Gauge**: Real-time storage usage counter with progress bar for Cloudflare R2's 10 GB free tier.

---

### 2. 📄 Comprehensive PDF Annotation Tool
- **Selection Highlighter**: Text selection highlighter with 7 ink colors (`#fde047`, `#4ade80`, `#60a5fa`, `#f9a8d4`, `#fb923c`, `#c084fc`, `#ef4444`).
- **Freehand Pen Drawing**: Smooth vector pen drawing directly on PDF pages with custom colors and stroke thicknesses.
- **Multiply Ink Blending**: Realistic highlighter look where text remains crisp beneath the color.
- **Autosaved with Zero Duplicates**:
  - Highlights & pen drawings autosave to cloud metadata without creating duplicate files like `document_annotated.pdf`.
  - Re-opening the file reloads all annotations automatically.
- **Annotations Drawer**: Shows all highlights & pen marks grouped by page with quoted excerpts and jump-to-page navigation.

---

### 3. 🎨 Comprehensive Photo & Image Markup Suite
- **Freehand Pen & Brush**: Smooth drawing on photos with 8 vibrant colors and adjustable stroke sizes (*Thin, Medium, Thick*).
- **Semi-Transparent Highlighter**: Highlight areas of images without covering details.
- **Arrow Pointer**: Click-and-drag arrows to point out features or issues on photos.
- **Shapes**: Rectangle boxes and circles/ellipses for boxing details.
- **Text Labels & Captions**: Click anywhere on the image to place crisp text callouts with dark pill backgrounds.
- **Eraser & Undo**: Selectively erase elements or undo strokes.
- **Image Transformations**: Rotate Left 90°, Rotate Right 90°, Flip Horizontal.
- **Save to Cloud**: One-click **"Save to Cloud"** renders and uploads the annotated copy directly to your `Annotated/` cloud folder.

---

### 4. 🎬 Direct Video Streaming Player
- **Zero-Latency Streaming**: Streams `.mp4`, `.webm`, `.mov`, `.mkv` directly from Cloudflare R2 with HTTP Range header seeking support.
- **Floating Apple-Style Controls**:
  - Play / Pause (`Space` / `K`)
  - Skip -10s / +10s (`←` / `→`)
  - Volume slider and Mute (`M`)
  - Playback speed selector (`0.5x`, `0.75x`, `1.0x`, `1.25x`, `1.5x`, `2.0x`)
  - Fullscreen (`F`) and Picture-in-Picture (`P`)
  - Direct video download button

---

### 5. 🗂️ Apple Finder Interface
- macOS window chrome with traffic lights and Apple Finder smiling face logo.
- Grid View and List View with file size, modified date, and kind.
- Dynamic breadcrumbs with folder jumping.
- Starred / pinned files section.
- Also supports browsing local Windows drives (`C:\`, `D:\`) alongside your cloud drive.

---

## 🚀 Quick Start

### Prerequisites
Install **Node.js** (v18 or higher):
- **From Command Prompt / PowerShell (Windows)**:
  ```cmd
  winget install OpenJS.NodeJS.LTS
  ```
- **From Browser**: Download from **[https://nodejs.org/](https://nodejs.org/)**.

---

### Step 1: Clone or Download
```bash
git clone https://github.com/swapnasish-ghorui/apple-file-manager.git
cd apple-file-manager
```

---

### Step 2: Start the App

#### 🌟 1-Click Startup (Windows)
Double-click **`start.bat`**:
- Installs dependencies automatically on first run.
- Launches backend server and frontend concurrently.
- Automatically opens **`http://localhost:5173`** in your browser.

#### 💻 Terminal Startup
```bash
npm install
npm run dev
```

---

### ☁️ Configuring Cloudflare R2 Storage (Optional)

1. Open the app at **`http://localhost:5173`**.
2. Click the **Cloud Settings** icon (`☁️`) in the top toolbar or sidebar.
3. Enter your Cloudflare R2 credentials:
   - **Account ID** (found on Cloudflare dashboard URL)
   - **Access Key ID** (from R2 → Manage R2 API Tokens)
   - **Secret Access Key**
   - **Bucket Name**
4. Click **Save & Connect**. The app will verify the connection and switch to live Cloudflare R2 storage!

*(You can also set these in `.env` if preferred)*.
