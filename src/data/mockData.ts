// Mock file system data for the frontend
export type FileType =
  | "folder"
  | "pdf"
  | "image"
  | "video"
  | "audio"
  | "document"   // .docx / .doc / Word
  | "word"       // alias kept for icon discrimination
  | "code"
  | "archive"
  | "text"
  | "spreadsheet"
  | "presentation" // .pptx / .ppt / PowerPoint
  | "unknown";

export interface FileItem {
  id: string;
  name: string;
  type: FileType;
  size?: number; // bytes
  modified: Date;
  created: Date;
  path: string;
  extension?: string;
  children?: FileItem[];
  isFavorite?: boolean;
  isDirectory?: boolean;
  isHidden?: boolean;
  tags?: string[];
  thumbnail?: string;
}

export interface SidebarItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  type: "location" | "favorite" | "tag" | "device";
  color?: string;
}

function makeDate(daysAgo: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d;
}

function formatSize(bytes: number): number {
  return bytes;
}

export const MOCK_FILES: FileItem[] = [
  {
    id: "1",
    name: "Documents",
    type: "folder",
    modified: makeDate(0),
    created: makeDate(365),
    path: "/Documents",
    children: [
      {
        id: "1-1",
        name: "Work",
        type: "folder",
        modified: makeDate(1),
        created: makeDate(200),
        path: "/Documents/Work",
        children: [
          {
            id: "1-1-1",
            name: "Project Proposal.pdf",
            type: "pdf",
            size: formatSize(2_450_000),
            modified: makeDate(2),
            created: makeDate(10),
            path: "/Documents/Work/Project Proposal.pdf",
            extension: "pdf",
            isFavorite: true,
          },
          {
            id: "1-1-2",
            name: "Budget 2026.xlsx",
            type: "spreadsheet",
            size: formatSize(348_000),
            modified: makeDate(5),
            created: makeDate(30),
            path: "/Documents/Work/Budget 2026.xlsx",
            extension: "xlsx",
          },
          {
            id: "1-1-3",
            name: "Meeting Notes.txt",
            type: "text",
            size: formatSize(12_500),
            modified: makeDate(1),
            created: makeDate(5),
            path: "/Documents/Work/Meeting Notes.txt",
            extension: "txt",
          },
          {
            id: "1-1-4",
            name: "Q4 Strategy Deck.pptx",
            type: "presentation",
            size: formatSize(8_300_000),
            modified: makeDate(3),
            created: makeDate(15),
            path: "/Documents/Work/Q4 Strategy Deck.pptx",
            extension: "pptx",
            isFavorite: true,
          },
          {
            id: "1-1-5",
            name: "Product Roadmap 2026.pptx",
            type: "presentation",
            size: formatSize(5_200_000),
            modified: makeDate(7),
            created: makeDate(20),
            path: "/Documents/Work/Product Roadmap 2026.pptx",
            extension: "pptx",
          },
          {
            id: "1-1-6",
            name: "Market Analysis Report.docx",
            type: "document",
            size: formatSize(1_850_000),
            modified: makeDate(2),
            created: makeDate(12),
            path: "/Documents/Work/Market Analysis Report.docx",
            extension: "docx",
            isFavorite: true,
          },
          {
            id: "1-1-7",
            name: "Team Handbook.docx",
            type: "document",
            size: formatSize(920_000),
            modified: makeDate(14),
            created: makeDate(60),
            path: "/Documents/Work/Team Handbook.docx",
            extension: "docx",
          },
        ],
      },
      {
        id: "1-2",
        name: "Personal",
        type: "folder",
        modified: makeDate(3),
        created: makeDate(300),
        path: "/Documents/Personal",
        children: [
          {
            id: "1-2-1",
            name: "Resume.pdf",
            type: "pdf",
            size: formatSize(890_000),
            modified: makeDate(7),
            created: makeDate(45),
            path: "/Documents/Personal/Resume.pdf",
            extension: "pdf",
            isFavorite: true,
          },
          {
            id: "1-2-2",
            name: "Tax Return 2025.pdf",
            type: "pdf",
            size: formatSize(1_200_000),
            modified: makeDate(60),
            created: makeDate(60),
            path: "/Documents/Personal/Tax Return 2025.pdf",
            extension: "pdf",
          },
          {
            id: "1-2-3",
            name: "Cover Letter Template.docx",
            type: "document",
            size: formatSize(45_000),
            modified: makeDate(10),
            created: makeDate(10),
            path: "/Documents/Personal/Cover Letter Template.docx",
            extension: "docx",
          },
          {
            id: "1-2-4",
            name: "Year in Review.pptx",
            type: "presentation",
            size: formatSize(3_100_000),
            modified: makeDate(90),
            created: makeDate(90),
            path: "/Documents/Personal/Year in Review.pptx",
            extension: "pptx",
          },
        ],
      },
      {
        id: "1-3",
        name: "Annual Report.pdf",
        type: "pdf",
        size: formatSize(5_600_000),
        modified: makeDate(14),
        created: makeDate(14),
        path: "/Documents/Annual Report.pdf",
        extension: "pdf",
      },
    ],
  },
  {
    id: "2",
    name: "Pictures",
    type: "folder",
    modified: makeDate(0),
    created: makeDate(365),
    path: "/Pictures",
    children: [
      {
        id: "2-1",
        name: "Vacation 2025",
        type: "folder",
        modified: makeDate(30),
        created: makeDate(30),
        path: "/Pictures/Vacation 2025",
        children: [
          {
            id: "2-1-1",
            name: "beach_sunset.jpg",
            type: "image",
            size: formatSize(4_200_000),
            modified: makeDate(30),
            created: makeDate(30),
            path: "/Pictures/Vacation 2025/beach_sunset.jpg",
            extension: "jpg",
          },
          {
            id: "2-1-2",
            name: "mountain_view.png",
            type: "image",
            size: formatSize(6_800_000),
            modified: makeDate(31),
            created: makeDate(31),
            path: "/Pictures/Vacation 2025/mountain_view.png",
            extension: "png",
          },
        ],
      },
      {
        id: "2-2",
        name: "Screenshots",
        type: "folder",
        modified: makeDate(0),
        created: makeDate(100),
        path: "/Pictures/Screenshots",
        children: [],
      },
      {
        id: "2-3",
        name: "profile_photo.jpg",
        type: "image",
        size: formatSize(2_100_000),
        modified: makeDate(5),
        created: makeDate(5),
        path: "/Pictures/profile_photo.jpg",
        extension: "jpg",
        isFavorite: true,
      },
    ],
  },
  {
    id: "3",
    name: "Music",
    type: "folder",
    modified: makeDate(2),
    created: makeDate(365),
    path: "/Music",
    children: [
      {
        id: "3-1",
        name: "Favorites",
        type: "folder",
        modified: makeDate(2),
        created: makeDate(180),
        path: "/Music/Favorites",
        children: [
          {
            id: "3-1-1",
            name: "Chill Vibes.mp3",
            type: "audio",
            size: formatSize(8_500_000),
            modified: makeDate(10),
            created: makeDate(10),
            path: "/Music/Favorites/Chill Vibes.mp3",
            extension: "mp3",
          },
        ],
      },
    ],
  },
  {
    id: "4",
    name: "Videos",
    type: "folder",
    modified: makeDate(1),
    created: makeDate(365),
    path: "/Videos",
    children: [
      {
        id: "4-1",
        name: "Tutorial React 2025.mp4",
        type: "video",
        size: formatSize(285_000_000),
        modified: makeDate(5),
        created: makeDate(5),
        path: "/Videos/Tutorial React 2025.mp4",
        extension: "mp4",
      },
      {
        id: "4-2",
        name: "Family Dinner.mov",
        type: "video",
        size: formatSize(1_200_000_000),
        modified: makeDate(20),
        created: makeDate(20),
        path: "/Videos/Family Dinner.mov",
        extension: "mov",
      },
    ],
  },
  {
    id: "5",
    name: "Downloads",
    type: "folder",
    modified: makeDate(0),
    created: makeDate(365),
    path: "/Downloads",
    children: [
      {
        id: "5-1",
        name: "installer.exe",
        type: "unknown",
        size: formatSize(45_000_000),
        modified: makeDate(0),
        created: makeDate(0),
        path: "/Downloads/installer.exe",
        extension: "exe",
      },
      {
        id: "5-2",
        name: "archive.zip",
        type: "archive",
        size: formatSize(120_000_000),
        modified: makeDate(1),
        created: makeDate(1),
        path: "/Downloads/archive.zip",
        extension: "zip",
      },
      {
        id: "5-3",
        name: "Design Assets.zip",
        type: "archive",
        size: formatSize(234_000_000),
        modified: makeDate(3),
        created: makeDate(3),
        path: "/Downloads/Design Assets.zip",
        extension: "zip",
      },
    ],
  },
  {
    id: "6",
    name: "Development",
    type: "folder",
    modified: makeDate(0),
    created: makeDate(365),
    path: "/Development",
    children: [
      {
        id: "6-1",
        name: "my-app",
        type: "folder",
        modified: makeDate(0),
        created: makeDate(60),
        path: "/Development/my-app",
        children: [
          {
            id: "6-1-1",
            name: "index.tsx",
            type: "code",
            size: formatSize(4_200),
            modified: makeDate(0),
            created: makeDate(60),
            path: "/Development/my-app/index.tsx",
            extension: "tsx",
          },
          {
            id: "6-1-2",
            name: "package.json",
            type: "code",
            size: formatSize(1_800),
            modified: makeDate(0),
            created: makeDate(60),
            path: "/Development/my-app/package.json",
            extension: "json",
          },
          {
            id: "6-1-3",
            name: "README.md",
            type: "document",
            size: formatSize(5_200),
            modified: makeDate(1),
            created: makeDate(60),
            path: "/Development/my-app/README.md",
            extension: "md",
          },
        ],
      },
    ],
  },
  {
    id: "7",
    name: "Desktop",
    type: "folder",
    modified: makeDate(0),
    created: makeDate(365),
    path: "/Desktop",
    children: [
      {
        id: "7-1",
        name: "Quick Notes.txt",
        type: "text",
        size: formatSize(3_400),
        modified: makeDate(0),
        created: makeDate(2),
        path: "/Desktop/Quick Notes.txt",
        extension: "txt",
      },
    ],
  },
];

export const SIDEBAR_ITEMS: SidebarItem[] = [
  { id: "recents", label: "Recents", icon: "clock", path: "/Recents", type: "location" },
  { id: "home", label: "Home", icon: "home", path: "/", type: "location" },
  { id: "desktop", label: "Desktop", icon: "monitor", path: "/Desktop", type: "location" },
  { id: "documents", label: "Documents", icon: "file-text", path: "/Documents", type: "location" },
  { id: "downloads", label: "Downloads", icon: "download", path: "/Downloads", type: "location" },
  { id: "pictures", label: "Pictures", icon: "image", path: "/Pictures", type: "location" },
  { id: "music", label: "Music", icon: "music", path: "/Music", type: "location" },
  { id: "videos", label: "Videos", icon: "video", path: "/Videos", type: "location" },
];
