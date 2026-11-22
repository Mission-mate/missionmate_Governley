/**
 * Edge function names in the app code are camelCase (as in Base44): invoke('deleteMeeting').
 * Supabase deploys function names in lowercase, so the folders use hyphens: delete-meeting.
 * This turns the first form into the second. Used by the browser app and the edge functions.
 */
export const functionSlug = (name) =>
  String(name)
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase();
