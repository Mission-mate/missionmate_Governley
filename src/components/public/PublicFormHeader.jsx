import React from 'react';

/**
 * Branded header for the public membership form:
 * full-width banner, org logo on the right, title + description.
 */
export default function PublicFormHeader({ bannerUrl, logoUrl, orgName, title, description }) {
  return (
    <div className="bg-card">
      {bannerUrl &&
      <div className="w-full h-40 md:h-56 overflow-hidden">
          <img src={bannerUrl} alt="" className="w-full h-full object-cover" />
        </div>
      }
      <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8">
        <div className="flex items-start gap-4 sm:gap-5">
          {logoUrl &&
          <img
            src={logoUrl}
            alt={orgName || 'Logo'}
            className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-xl object-contain border border-border bg-background shrink-0" />

          }
          <div className="min-w-0 flex-1">
            {orgName &&
            <p className="font-semibold mb-1 text-[hsl(var(--foreground))] text-lg">{orgName}</p>
            }
            <h1 className="font-bold text-foreground text-xl sm:text-2xl">{title || orgName}</h1>
            {description &&
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed whitespace-pre-line">{description}</p>
            }
          </div>
        </div>
      </div>
    </div>);

}