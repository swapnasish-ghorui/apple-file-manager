import React from "react";
import {
  FileText,
  Image,
  Video,
  Music,
  File,
  Code,
  Archive,
  FileSpreadsheet,
} from "lucide-react";
import type { FileType } from "../data/mockData";
import { getFileColor } from "../utils/fileUtils";

interface FileIconProps {
  type: FileType;
  size?: number;
  className?: string;
}

/** Microsoft Word icon — blue badge with "W" */
const WordIcon: React.FC<{ size: number; className?: string }> = ({ size, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    {/* Page background */}
    <path d="M4 2C4 2 4 2 5 2H14L20 8V22C20 22 20 22 19 22H5C4 22 4 22 4 22V2Z" fill="#1d4ed8" fillOpacity={0.12} />
    <path d="M4 4C4 2.89543 4.89543 2 6 2H14L20 8V20C20 21.1046 19.1046 22 18 22H6C4.89543 22 4 21.1046 4 20V4Z" fill="#1d4ed8" fillOpacity={0.18} />
    {/* Fold */}
    <path d="M14 2L20 8H16C14.8954 8 14 7.10457 14 6V2Z" fill="#1d4ed8" fillOpacity={0.55} />
    <path d="M14 2L20 8H16C14.8954 8 14 7.10457 14 6V2Z" fill="white" fillOpacity={0.12} />
    {/* Badge */}
    <rect x="2" y="11" width="14" height="9" rx="1.5" fill="#1d4ed8" />
    {/* W letter */}
    <text x="4.5" y="19" fontSize="7" fontWeight="800" fill="white" fontFamily="Arial, sans-serif">W</text>
  </svg>
);

/** Microsoft PowerPoint icon — orange/red badge with "P" */
const PowerPointIcon: React.FC<{ size: number; className?: string }> = ({ size, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    {/* Page background */}
    <path d="M4 4C4 2.89543 4.89543 2 6 2H14L20 8V20C20 21.1046 19.1046 22 18 22H6C4.89543 22 4 21.1046 4 20V4Z" fill="#c2410c" fillOpacity={0.18} />
    {/* Fold */}
    <path d="M14 2L20 8H16C14.8954 8 14 7.10457 14 6V2Z" fill="#c2410c" fillOpacity={0.55} />
    <path d="M14 2L20 8H16C14.8954 8 14 7.10457 14 6V2Z" fill="white" fillOpacity={0.12} />
    {/* Slide representation */}
    <rect x="6.5" y="10" width="8" height="5.5" rx="0.5" fill="#c2410c" fillOpacity={0.25} stroke="#c2410c" strokeWidth="0.5" strokeOpacity={0.4} />
    {/* Badge */}
    <rect x="2" y="13" width="12" height="8" rx="1.5" fill="#c2410c" />
    {/* P letter */}
    <text x="4.5" y="20" fontSize="7" fontWeight="800" fill="white" fontFamily="Arial, sans-serif">P</text>
  </svg>
);

export const FileIcon: React.FC<FileIconProps> = ({
  type,
  size = 24,
  className = "",
}) => {
  const color = getFileColor(type);
  const props = { size, className, style: { color } };

  switch (type) {
    case "folder":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
          <path
            d="M2 7C2 5.89543 2.89543 5 4 5H9.58579C9.851 5 10.1054 5.10536 10.2929 5.29289L11.7071 6.70711C11.8946 6.89464 12.149 7 12.4142 7H20C21.1046 7 22 7.89543 22 9V18C22 19.1046 21.1046 20 20 20H4C2.89543 20 2 19.1046 2 18V7Z"
            fill={color}
            fillOpacity={0.9}
          />
          <path
            d="M2 7C2 5.89543 2.89543 5 4 5H9.58579C9.851 5 10.1054 5.10536 10.2929 5.29289L11.7071 6.70711C11.8946 6.89464 12.149 7 12.4142 7H20C21.1046 7 22 7.89543 22 9V18C22 19.1046 21.1046 20 20 20H4C2.89543 20 2 19.1046 2 18V7Z"
            fill="url(#folderGrad)"
            fillOpacity={0.5}
          />
          <defs>
            <linearGradient id="folderGrad" x1="2" y1="5" x2="22" y2="20" gradientUnits="userSpaceOnUse">
              <stop stopColor="white" stopOpacity={0.3} />
              <stop offset="1" stopColor="white" stopOpacity={0} />
            </linearGradient>
          </defs>
        </svg>
      );

    case "pdf":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
          <path d="M4 4C4 2.89543 4.89543 2 6 2H14L20 8V20C20 21.1046 19.1046 22 18 22H6C4.89543 22 4 21.1046 4 20V4Z" fill="#ef4444" fillOpacity={0.18} />
          <path d="M14 2L20 8H16C14.8954 8 14 7.10457 14 6V2Z" fill="#ef4444" fillOpacity={0.65} />
          <path d="M14 2L20 8H16C14.8954 8 14 7.10457 14 6V2Z" fill="white" fillOpacity={0.12} />
          <rect x="2" y="11" width="14" height="9" rx="1.5" fill="#ef4444" />
          <text x="3.5" y="19" fontSize="6.5" fontWeight="800" fill="white" fontFamily="Arial, sans-serif">PDF</text>
        </svg>
      );

    case "document":
    case "word":
      return <WordIcon size={size} className={className} />;

    case "presentation":
      return <PowerPointIcon size={size} className={className} />;

    case "image":
      return <Image {...props} />;
    case "video":
      return <Video {...props} />;
    case "audio":
      return <Music {...props} />;
    case "spreadsheet":
      return <FileSpreadsheet {...props} />;
    case "code":
      return <Code {...props} />;
    case "archive":
      return <Archive {...props} />;
    case "text":
      return <FileText {...props} />;
    default:
      return <File {...props} />;
  }
};
