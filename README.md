# 🍎 Apple File Manager for Windows

A modern, minimalist, Apple Finder-inspired local file manager built for Windows laptops. Features full local filesystem navigation, built-in PDF viewer with persistent autosaved text highlighting, built-in Word & PowerPoint document inspection, media preview, and Windows system integrations.

---

## 📥 How to Download and Run on Any Laptop

### Prerequisites
Install **Node.js** (v18 or higher):
- **From Command Prompt / PowerShell (Quickest)**:
  ```cmd
  winget install OpenJS.NodeJS.LTS
  ```
- **Or from browser**: Download installer from **[https://nodejs.org/](https://nodejs.org/)**.

---

### Step 1: Get the Code

#### Option A: Clone with Git (Recommended)
Open your terminal (PowerShell or Command Prompt) and run:
```bash
git clone https://github.com/swapnasish-ghorui/apple-file-manager.git
cd apple-file-manager
```

#### Option B: Download as ZIP (No Git needed)
1. On GitHub, click the green **Code** button and choose **Download ZIP**.
2. Extract the downloaded zip file onto your laptop.
3. Open the extracted `apple-file-manager` folder.

---

### Step 2: Start the App

#### 🌟 1-Click Startup (Easiest)
Just **double-click `start.bat`**:
- Automatically checks for Node.js.
- Automatically installs required packages (`npm install`) on first launch.
- Boots both the backend server and frontend.
- Automatically opens **`http://localhost:5173`** in your default web browser.

#### 💻 Manual Startup (Terminal)
Inside the project folder:
```bash
# 1. Install dependencies (first time only)
npm install

# 2. Start the unified app
npm run dev
```
Then visit **[http://localhost:5173](http://localhost:5173)** in your browser!

---

## 🔒 Where are PDF Highlights Stored?
- Annotations and highlights are saved on your laptop at:
  `C:\Users\<YourUsername>\.apple-file-manager\annotations.json`
- **Zero duplicates**: No extra files like `report_highlighted.pdf` are ever created.
- To transfer existing highlights to a new machine, copy the `annotations.json` file to the same folder on the new laptop.

---

## ✨ Features

- **Apple Finder Interface**:
  - Two-tone smiling Finder face logo in the title bar & browser tab favicon
  - Traffic light window controls (close, minimize, maximize)
  - Frosted glass sidebar with quick shortcuts (*Home, Desktop, Documents, Downloads, Pictures, Music, Videos*)
  - Automatic detection of mounted Windows drives (`C:\`, `D:\`, etc.)
  - Grid View & List View with sort options (*Name, Date Modified, Size, Kind*)
  - Breadcrumbs path navigation with instant folder jumping
  - Real-time search filter and hidden files toggle (`👁`)

- **Built-in PDF Viewer with Autosaved Highlighting**:
  - Text selection highlighter with 6 color options (`⌘H` / `Ctrl+H`)
  - Realistic `mix-blend-mode: multiply` ink blending
  - Instant autosave to backend storage without duplicate files
  - Highlights panel with quotes and jump-to-page navigation
  - Page thumbnails with highlight indicator dots

- **Built-in Word & PowerPoint Document Viewers**:
  - **Word Viewer (`.docx`)**: Real document text extraction (headings, paragraphs, word count) with search (`⌘F`) and zoom
  - **PowerPoint Viewer (`.pptx`)**: Slide deck viewer with thumbnails, slide progress indicator, and presentation mode
  - One-click button to open in native Microsoft Word or PowerPoint

- **Media Quick Look**:
  - Preview `.png`, `.jpg`, `.mp4`, `.mov`, `.mp3`, etc. with audio/video playback and download support

- **Local File Operations**:
  - Create new folders
  - Rename items
  - Duplicate files
  - Delete files
  - Open in System Default App (`start "" "path"`)
  - Show in Windows File Explorer (`explorer.exe /select`)
  - Pin items to sidebar favorites

---

## 🛠️ Project Structure

```
apple-file-manager/
├── server/
│   └── index.js             # Express backend: fs/promises, drives, annotations, docx/pptx
├── src/
│   ├── components/
│   │   ├── TitleBar.tsx     # Window header with Finder face logo
│   │   ├── FinderLogo.tsx   # Two-tone Apple Finder SVG icon
│   │   ├── Sidebar.tsx      # Sidebar with locations, pinned files, and drives
│   │   ├── Toolbar.tsx      # Navigation, breadcrumbs, search, view modes, new folder
│   │   ├── FileView.tsx     # Apple Grid View and List View
│   │   ├── FileIcon.tsx     # Color-coded file type icons (PDF, Word, PPT, Code, etc.)
│   │   ├── InfoPanel.tsx    # Right inspector with file details and tags
│   │   ├── ContextMenu.tsx  # Right-click menu with system actions
│   │   ├── PDFViewer.tsx    # PDF viewer with persistent autosaved highlights
│   │   ├── WordViewer.tsx   # Word document viewer with text extraction
│   │   ├── PresentationViewer.tsx # Slide presentation viewer
│   │   └── MediaViewer.tsx  # Image, video, and audio player
│   ├── services/
│   │   └── api.ts           # Clean typed client for backend API
│   ├── data/
│   │   └── mockData.ts      # Type definitions and fallback data
│   └── utils/
│       └── fileUtils.ts     # Size, date, and color helpers
├── start.bat                # 1-Click Windows launcher script
├── package.json             # Scripts & dependencies
└── vite.config.ts           # Vite dev server with proxy to port 3001
```
