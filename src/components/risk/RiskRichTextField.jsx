import React from 'react';
import RichTextField from '@/components/shared/RichTextField';
import { sanitizeRiskHtml } from '@/lib/riskHtml';

/** Rich-text editor for Risk fields — formatting only, sanitized on load, input and paste. */
export default function RiskRichTextField(props) {
  return <RichTextField {...props} sanitize={sanitizeRiskHtml} />;
}