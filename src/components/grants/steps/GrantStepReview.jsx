import React from 'react';

function ReviewRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}:</span>
      <span className={`text-sm font-medium ${value ? 'text-foreground' : 'text-muted-foreground italic'}`}>
        {value || 'Not provided'}
      </span>
    </div>
  );
}

export default function GrantStepReview({ form }) {
  const amount = form.total_amount ? `$${Number(form.total_amount).toLocaleString()}` : null;

  return (
    <div className="border border-border rounded-xl p-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-bold text-foreground">Ready to create grant?</h3>
        <p className="text-sm text-primary mt-1">Review the information and click 'Save & Create Grant' to finish.</p>
      </div>

      <div className="max-w-sm mx-auto">
        <ReviewRow label="Title" value={form.name} />
        <ReviewRow label="Provider" value={form.provider} />
        <ReviewRow label="Amount" value={amount} />
      </div>
    </div>
  );
}