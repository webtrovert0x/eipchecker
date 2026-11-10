'use client';

import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export function EIPCheckerLogo({ className = 'w-10 h-10', size }: LogoProps) {
  const style = size ? { width: `${size}px`, height: `${size}px` } : undefined;

  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-label="EIPChecker Logo"
    >
      <defs>
        <linearGradient id="eipLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1d4ed8" />
          <stop offset="50%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
        <linearGradient id="eipCheckGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <filter id="eipLogoShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#1d4ed8" floodOpacity="0.25" />
        </filter>
      </defs>

      {/* Rounded Outer Shield */}
      <rect
        x="6"
        y="6"
        width="88"
        height="88"
        rx="22"
        fill="url(#eipLogoGrad)"
        filter="url(#eipLogoShadow)"
      />
      <rect
        x="7.5"
        y="7.5"
        width="85"
        height="85"
        rx="20.5"
        stroke="#ffffff"
        strokeOpacity="0.2"
        strokeWidth="1.5"
      />

      {/* Ethereum Diamond Structure */}
      <polygon points="46,20 62,44 46,38" fill="#ffffff" fillOpacity="0.95" />
      <polygon points="46,20 30,44 46,38" fill="#dbeafe" />
      <polygon points="46,42 62,49 46,65" fill="#bfdbfe" fillOpacity="0.85" />
      <polygon points="46,42 30,49 46,65" fill="#93c5fd" fillOpacity="0.9" />

      {/* Circuit Standards Track */}
      <circle cx="22" cy="44" r="2.5" fill="#bfdbfe" />
      <line
        x1="22"
        y1="44"
        x2="30"
        y2="44"
        stroke="#bfdbfe"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="2 2"
      />

      {/* Verification Check Badge */}
      <circle cx="70" cy="70" r="17" fill="#ffffff" />
      <circle cx="70" cy="70" r="14.5" fill="url(#eipCheckGrad)" />
      <path
        d="M63 70.5 L67.5 75 L77 64"
        stroke="#ffffff"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

