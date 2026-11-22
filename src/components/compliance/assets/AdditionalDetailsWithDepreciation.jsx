import React from 'react';
import AdditionalDetailsFields from './AdditionalDetailsFields';
import DepreciationFields from './DepreciationFields';

/** Additional Details card body — additional fields followed by depreciation fields. */
export default function AdditionalDetailsWithDepreciation(props) {
  return (
    <div className="space-y-4">
      <AdditionalDetailsFields {...props} />
      <DepreciationFields {...props} />
    </div>
  );
}