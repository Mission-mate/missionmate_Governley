import useCollapse from '@/hooks/useCollapse';

/**
 * Render-prop version of useCollapse for content rendered inside loops (table rows).
 * children(className, closing) renders the content with its open/close animation class.
 */
export default function Collapse({ open, children }) {
  const { mounted, className, closing } = useCollapse(open);
  return mounted ? children(className, closing) : null;
}