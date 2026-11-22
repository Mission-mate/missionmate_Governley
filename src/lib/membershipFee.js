// Fee resolution for the public membership flow. Handles Free, Fixed, Custom
// and Tiered pricing, plus a readable renewal-period label.

// Resolve the payable fee for a structure + optionally a chosen tier.
// Returns a number (0 when free / no fee).
export function resolveFee(structure, tier = null) {
  if (!structure) return 0;
  const feeType = structure.fee_type;
  if (!feeType || feeType === 'Free' || feeType === 'No Membership Fee') return 0;
  if (feeType === 'Tiered') {
    if (structure.tier_fees_differ && tier) return Number(tier.fee_amount) || 0;
    return Number(structure.fee_amount) || 0;
  }
  // Custom = Manual Assessment: fee determined case-by-case, no fixed amount.
  if (feeType === 'Custom') return 0;
  // Fixed
  return Number(structure.fee_amount) || Number(structure.price) || 0;
}

// Whether the structure carries a payable fee at all.
export function isPaidStructure(structure) {
  const feeType = structure?.fee_type;
  // Manual Assessment (Custom) has no upfront payable fee shown to applicants.
  return !!feeType && feeType !== 'Free' && feeType !== 'No Membership Fee' && feeType !== 'Custom';
}

// Format a dollar amount for display.
export function formatFee(amount) {
  const n = Number(amount) || 0;
  return `$${n.toFixed(2)}`;
}

// Short human label for the renewal period, e.g. "annual", "monthly".
export function renewalLabel(structure) {
  if (!structure) return '';
  if (structure.is_lifetime || structure.renewal_period === 'Lifetime (No Expiration)') return 'lifetime';
  switch (structure.renewal_period) {
    case 'Annually': return 'annual';
    case 'One-off': return 'one-off';
    case 'Every': {
      const value = Number(structure.renewal_interval_value) || 1;
      const unit = structure.renewal_interval_unit === 'Years' ? 'year' : 'month';
      return `${value} ${unit}${value === 1 ? '' : 's'}`;
    }
    default: {
      const m = Number(structure.duration_months) || 0;
      if (m === 12) return 'annual';
      if (m > 0) return `${m} months`;
      return '';
    }
  }
}

// Whether the structure offers selectable tiers/categories.
export function hasSelectableTiers(structure) {
  return !!structure?.has_tiers && Array.isArray(structure.tiers) && structure.tiers.length > 0;
}

// Resolve the recurrent (auto-rebilling) online payment link for a structure,
// preferring a per-tier link when a tier is chosen.
function recurrentLinkFor(structure, tier = null) {
  return tier?.recurrent_payment_link || structure?.recurrent_payment_link || '';
}

// Whether the structure accepts recurrent (auto-rebilling) online payments.
function acceptsRecurrentPayment(structure, tier = null) {
  return structure?.online_payment_type === 'both' && !!recurrentLinkFor(structure, tier);
}

// The online payment options a member can choose from. Each has a type,
// label, description and link. Per-tier links override the structure links.
export function onlinePaymentOptions(structure, tier = null) {
  if (!structure) return [];
  const oneTimeLink = tier?.one_time_payment_link || tier?.payment_link || structure.one_time_payment_link || structure.payment_link || '';
  const options = [];
  if (oneTimeLink) {
    options.push({
      type: 'one_time',
      title: 'One-time Membership Payment',
      description: 'This membership does not automatically rebill.',
      link: oneTimeLink,
    });
  }
  if (acceptsRecurrentPayment(structure, tier)) {
    options.push({
      type: 'recurrent',
      title: 'Recurrent Membership Payment',
      description: 'This membership automatically rebills.',
      link: recurrentLinkFor(structure, tier),
    });
  }
  return options;
}