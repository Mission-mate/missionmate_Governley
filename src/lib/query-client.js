import { QueryClient, QueryCache } from '@tanstack/react-query';
import { toast } from '@/components/ui/use-toast';

// One notice per burst — several reads usually fail together (e.g. going offline).
const NOTICE_GAP_MS = 5000;
let lastNoticeAt = 0;

export const queryClientInstance = new QueryClient({
	queryCache: new QueryCache({
		// A background refresh failed after data had loaded: the loaded content (and any
		// edit in progress) stays on screen, so the failure is reported as a notice.
		// First-load failures are shown in place by LoadError instead.
		onError: (_error, query) => {
			if (query.state.data === undefined) return;
			const now = Date.now();
			if (now - lastNoticeAt < NOTICE_GAP_MS) return;
			lastNoticeAt = now;
			toast({
				variant: 'destructive',
				title: 'Couldn’t refresh',
				description: 'Showing the last loaded data. Check your connection and try again.',
			});
		},
	}),
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			retry: 1,
		},
	},
});