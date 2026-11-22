import { useBoardInit } from '@/hooks/useBoardInit';

/**
 * Seeds the mandatory default board committees once per session at app init,
 * so they exist no matter which board page the user opens first.
 * Renders nothing.
 */
export default function BoardDefaultsPrimer() {
  useBoardInit();
  return null;
}