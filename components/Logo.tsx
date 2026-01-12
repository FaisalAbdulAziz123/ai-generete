import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    viewBox="0 0 100 100" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
  >
    {/* Stylized P Shape */}
    <path 
      d="M30 90 V35 C30 20 40 10 55 10 C75 10 90 25 90 45 C90 65 75 80 55 80 H50" 
      stroke="currentColor" 
      strokeWidth="12" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    {/* Glowing Dot */}
    <circle cx="55" cy="45" r="8" fill="currentColor" />
    {/* Optional Glow Effect for some contexts */}
    <circle cx="55" cy="45" r="12" stroke="currentColor" strokeWidth="2" opacity="0.5" />
  </svg>
);
