/** Display helpers for polls posted in a conversation. */
import { format, isThisYear } from 'date-fns';

export const MIN_POLL_OPTIONS = 2;
export const MAX_POLL_OPTIONS = 10;

const pollWhen = (iso) => {
  const d = new Date(iso);
  return format(d, isThisYear(d) ? 'd MMM, h:mm a' : 'd MMM yyyy, h:mm a');
};

/** e.g. "Single choice · Votes are final". */
export const pollRules = (poll) =>
  `${poll.multiple ? 'Multiple choice' : 'Single choice'} · ${poll.allow_change ? 'Votes can be changed' : 'Votes are final'}`;

/** Why the results are not on show yet. */
export const pollHiddenNote = (poll) =>
  (poll.results === 'after_vote' ? 'Results appear once you have voted.' : 'Results appear when the poll closes.');

/** e.g. "4 voted · Closes 18 Nov, 5:00 PM". */
export function pollStatusLine(poll, closed) {
  const voted = `${poll.voter_count} voted`;
  if (closed) return `${voted} · Closed ${pollWhen(poll.closed_at || poll.closes_at)}`;
  return poll.closes_at ? `${voted} · Closes ${pollWhen(poll.closes_at)}` : voted;
}