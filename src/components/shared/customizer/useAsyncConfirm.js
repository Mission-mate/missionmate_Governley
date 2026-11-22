import { useRef, useState } from 'react';

/**
 * Awaitable confirmation for a save flow: `await ask(payload)` resolves true on
 * confirm, false on dismiss. Render a dialog from `pending` and call `answer(bool)`.
 */
export default function useAsyncConfirm() {
  const [pending, setPending] = useState(null);
  const resolver = useRef(null);

  const ask = (payload) => new Promise((resolve) => {
    resolver.current = resolve;
    setPending(payload);
  });

  const answer = (ok) => {
    resolver.current?.(ok);
    resolver.current = null;
    setPending(null);
  };

  return { pending, ask, answer };
}