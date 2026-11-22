import React from 'react';
import RichTextField from '@/components/shared/RichTextField';

// Rich-text editor for plan content sections. Supports basic formatting and
// links, and matches the app's existing lightweight editor styling.
export default function PlanRichText({ value, onChange, placeholder }) {
  return (
    <RichTextField
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      minHeight={100}
      enableLinks
    />
  );
}