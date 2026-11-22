/**
 * Shared validation for mandatory strategy meta fields.
 * Health is required on every level; Status is required on every level that has it
 * (Priorities has no Status field, so pass { status: false } there).
 */
export function validateMeta(form, { status = true } = {}) {
  const errors = {};
  if (!form?.health) errors.health = 'Health is required';
  if (status && !form?.status) errors.status = 'Status is required';
  return errors;
}

export const hasErrors = (errors) => Object.keys(errors).length > 0;