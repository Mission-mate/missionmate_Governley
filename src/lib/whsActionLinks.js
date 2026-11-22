// Routing between the Actions Register and an action's source record (where it is edited).
const SOURCE_PATHS = { hazard: 'hazard', incident: 'incident', safety_check: 'check' };

/** Source record page, opened on its Actions tab with this action's edit pane focused. */
export const sourceActionPath = (action) =>
  `/compliance/registers/${action.register_id}/${SOURCE_PATHS[action.source_type]}/${action.source_id}?action=${action.id}`;

/** Action id requested via `?action=` on a source detail page. */
export const focusedActionId = () => new URLSearchParams(window.location.search).get('action');