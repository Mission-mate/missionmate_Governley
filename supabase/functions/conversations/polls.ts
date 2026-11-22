/** Poll rules for the conversations function: validation, closing, and what each member may see. */

const RESULT_MODES = ['always', 'after_vote', 'after_close'];
const MIN_OPTIONS = 2;
const MAX_OPTIONS = 10;
const VOTE_PAGE = 500;

const clean = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/** Validates a new poll. Returns { poll } ready to store, or { error } for the caller. */
export function buildPoll(body) {
  const question = clean(body.question, 300);
  if (!question) return { error: 'Write a question for the poll.' };
  const texts = Array.isArray(body.options) ? body.options.map((o) => clean(o, 120)).filter(Boolean) : [];
  if (texts.length < MIN_OPTIONS || texts.length > MAX_OPTIONS) {
    return { error: `Add between ${MIN_OPTIONS} and ${MAX_OPTIONS} options.` };
  }
  if (new Set(texts.map((t) => t.toLowerCase())).size !== texts.length) return { error: 'Each option must be different.' };
  if (!RESULT_MODES.includes(body.results)) return { error: 'Choose when the results are shown.' };
  let closesAt = '';
  if (body.closes_at) {
    const at = new Date(body.closes_at);
    if (!(at.getTime() > Date.now())) return { error: 'Choose a closing date and time in the future.' };
    closesAt = at.toISOString();
  }
  return {
    poll: {
      question,
      options: texts.map((text, i) => ({ id: String(i + 1), text })),
      multiple: body.multiple === true,
      allow_change: body.allow_change === true,
      results: body.results,
      closes_at: closesAt,
      closed_at: '',
    },
  };
}

/** When the poll closed, or '' while it is open. A passed deadline counts as closed the moment it is read. */
export function pollClosedAt(poll) {
  if (poll.closed_at) return poll.closed_at;
  return poll.closes_at && poll.closes_at <= new Date().toISOString() ? poll.closes_at : '';
}

/** Votes for the given polls: Map of message id → Map of user id → option ids. One vote counts per member. */
export async function loadPollVotes(svc, messageIds) {
  const byMessage = new Map();
  let cursor = null;
  do {
    const page = await svc.ConversationPollVote.filter(
      { message_id: { $in: messageIds } },
      { sort: 'created_date', limit: VOTE_PAGE, ...(cursor ? { cursor } : {}) },
    );
    for (const vote of page.items) {
      const votes = byMessage.get(vote.message_id) || new Map();
      if (!votes.has(vote.user_id)) votes.set(vote.user_id, vote.option_ids || []);
      byMessage.set(vote.message_id, votes);
    }
    cursor = page.has_more ? page.next_cursor : null;
  } while (cursor);
  return byMessage;
}

/** The poll as one member may see it. Per-option totals and voters are left out until this poll's results rule allows them. */
export function publicPoll(poll, votes, userId) {
  const closedAt = pollClosedAt(poll);
  const mine = votes?.get(userId) || [];
  const visible = !!closedAt || poll.results === 'always' || (poll.results === 'after_vote' && mine.length > 0);
  // Voter IDs per option; members of the conversation see names under the same rule as totals.
  const voters = {};
  if (visible && votes) {
    for (const [voterId, optionIds] of votes) {
      for (const id of optionIds) (voters[id] ||= []).push(voterId);
    }
  }
  return {
    question: poll.question,
    multiple: !!poll.multiple,
    allow_change: !!poll.allow_change,
    results: poll.results,
    closes_at: poll.closes_at || '',
    closed_at: closedAt,
    options: poll.options.map((o) => ({ id: o.id, text: o.text, votes: voters[o.id]?.length || 0, voter_ids: voters[o.id] || [] })),
    voter_count: votes?.size || 0,
    my_option_ids: mine,
    results_visible: visible,
  };
}