import React from "react";

/**
 * Apple Finder–style logo:
 * Blue gradient square with the iconic two-tone face.
 */
export const FinderLogo: React.FC<{ size?: number; className?: string }> = ({
  size = 32,
  className = "",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      {/* Background gradient — left lighter, right darker, like real Finder */}
      <linearGradient id="bg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#5AC8FA" />
        <stop offset="100%" stopColor="#007AFF" />
      </linearGradient>

      {/* Left face half — slightly lighter */}
      <linearGradient id="faceL" x1="0" y1="0" x2="32" y2="64" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#A8DAFF" />
        <stop offset="100%" stopColor="#5AC8FA" />
      </linearGradient>

      {/* Right face half — darker */}
      <linearGradient id="faceR" x1="32" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#007AFF" />
        <stop offset="100%" stopColor="#005EC4" />
      </linearGradient>

      <clipPath id="roundRect">
        <rect width="64" height="64" rx="14" ry="14" />
      </clipPath>
    </defs>

    {/* Background */}
    <rect width="64" height="64" rx="14" fill="url(#bg)" />

    {/* Face base — left half */}
    <ellipse cx="32" cy="36" rx="20" ry="20" fill="url(#faceL)" clipPath="url(#leftHalf)" />

    {/* Left half clip */}
    <clipPath id="leftHalf">
      <rect x="0" y="0" width="32" height="64" />
    </clipPath>
    <clipPath id="rightHalf">
      <rect x="32" y="0" width="32" height="64" />
    </clipPath>

    {/* Face — left half (lighter) */}
    <ellipse cx="32" cy="37" rx="19" ry="18" fill="url(#faceL)" clipPath="url(#leftHalf)" />

    {/* Face — right half (darker) */}
    <ellipse cx="32" cy="37" rx="19" ry="18" fill="url(#faceR)" clipPath="url(#rightHalf)" />

    {/* Dividing line between halves */}
    <line x1="32" y1="19" x2="32" y2="55" stroke="white" strokeWidth="1.2" strokeOpacity="0.3" />

    {/* Left eye — white circle with dark pupil */}
    <circle cx="23.5" cy="31" r="4.5" fill="white" />
    <circle cx="23.5" cy="31" r="2" fill="#1a1a2e" />
    {/* left eye highlight */}
    <circle cx="22.5" cy="30" r="0.8" fill="white" fillOpacity="0.7" />

    {/* Right eye — slightly different shade */}
    <circle cx="40.5" cy="31" r="4.5" fill="white" fillOpacity="0.9" />
    <circle cx="40.5" cy="31" r="2" fill="#1a1a2e" />
    {/* right eye highlight */}
    <circle cx="39.5" cy="30" r="0.8" fill="white" fillOpacity="0.7" />

    {/* Smile — left side curves up */}
    {/* Left cheek / chin line */}
    <path
      d="M 18 42 Q 24 51 32 51"
      stroke="white"
      strokeWidth="2.5"
      strokeLinecap="round"
      fill="none"
      strokeOpacity="0.95"
    />
    {/* Right cheek / chin line — slightly different opacity like Finder */}
    <path
      d="M 32 51 Q 40 51 46 42"
      stroke="white"
      strokeWidth="2.5"
      strokeLinecap="round"
      fill="none"
      strokeOpacity="0.75"
    />

    {/* Subtle shine overlay */}
    <rect width="64" height="32" rx="14" fill="white" fillOpacity="0.06" clipPath="url(#roundRect)" />
  </svg>
);
