import React from "react";
import { Link } from "react-router-dom";

/**
 * Split-panel auth layout.
 * - left: coloured panel with headline + CTA link
 * - right: white form panel
 */
export default function AuthSplitLayout({
  leftTitle,
  leftSubtitle,
  leftLinkLabel,
  leftLinkTo,
  children,
}) {
  return (
    <div className="min-h-screen flex bg-white">
      {/* Left panel */}
      <div className="hidden md:flex flex-col items-center justify-center w-2/5 bg-gradient-to-br from-[#5b7be9] to-[#3a5bd9] text-white text-center px-10 rounded-br-[100px]" style={{minHeight: '100vh'}}>
        <h2 className="text-3xl font-bold mb-3 leading-snug">{leftTitle}</h2>
        {leftSubtitle && (
          <p className="text-sm text-white/80 mb-8">{leftSubtitle}</p>
        )}
        {leftLinkLabel && leftLinkTo && (
          <Link
            to={leftLinkTo}
            className="px-8 py-2 rounded-full border-2 border-white text-white font-semibold text-sm hover:bg-white hover:text-[#3a5bd9] transition-colors"
          >
            {leftLinkLabel}
          </Link>
        )}
      </div>

      {/* Right panel */}
      <div className="flex-1 bg-white flex flex-col justify-center px-8 md:px-16 lg:px-24 py-12">
        <div className="w-full max-w-md mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
}