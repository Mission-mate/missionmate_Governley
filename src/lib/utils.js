import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
} 


export const isIframe = window.self !== window.top;

// The platform-level System Collaborator / System Owner. Only this user can see
// owner-only UI such as the Access Control settings tab.
export const SYSTEM_COLLABORATOR_EMAIL = 'nilesh.dilushan@gmail.com';

export const isSystemCollaborator = (user) =>
  user?.email?.toLowerCase() === SYSTEM_COLLABORATOR_EMAIL;