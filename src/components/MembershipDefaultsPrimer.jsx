import { useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { ensureDefaultStructures } from '@/lib/membership';

/**
 * Runs the server-side default membership plan check once per session on app
 * init. Renders nothing; surfaces failures instead of swallowing them.
 */
export default function MembershipDefaultsPrimer() {
  const { toast } = useToast();

  useEffect(() => {
    ensureDefaultStructures().catch((error) => {
      toast({
        variant: 'destructive',
        title: 'Membership plans could not be verified',
        description: error?.message || 'The default membership plans could not be checked.',
      });
    });
  }, [toast]);

  return null;
}