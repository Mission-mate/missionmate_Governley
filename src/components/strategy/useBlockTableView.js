import { useMemo, useState } from 'react';
import { BLOCK_FIELDS, matchesSearch, matchesFilters, groupBlocks } from '@/lib/strategy/blockTableView';
import { exportBlocksToExcel, exportBlocksToPdf } from '@/lib/strategy/blockExport';

/**
 * Search + filter + group state for a strategy level table.
 * Returns the toolbar props, the visible rows, and grouped sections for rendering.
 *
 * `fields` is the level's full field list (built-ins plus the Customiser's
 * custom columns) so grouping and filtering can resolve custom_fields values.
 * `customCols` is passed through to the exporters so custom data reaches
 * Excel / PDF as its own columns.
 */
export default function useBlockTableView(blocks, level, exportTitle, fields = BLOCK_FIELDS, customCols = []) {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [groupBy, setGroupBy] = useState('');
  const [exportFormat, setExportFormat] = useState(null);
  const [healthFilter, setHealthFilter] = useState('');

  const fieldByKey = (key) => fields.find((f) => f.key === key) || { key };

  const matchesHealth = (b) => {
    if (!healthFilter) return true;
    if (healthFilter === 'on_track') return b.health === 'On Track';
    if (healthFilter === 'at_risk') return b.health === 'At Risk' || b.health === 'Monitor';
    if (healthFilter === 'off_track') return b.health === 'Off Track';
    return true;
  };

  // Rows matching everything except the health capsule filter — used for the tab counts.
  const baseRows = useMemo(
    () => blocks
      .filter((b) => b.level === level)
      .filter((b) => matchesSearch(b, search))
      .filter((b) => matchesFilters(b, filters, fields)),
    [blocks, level, search, filters, fields]
  );

  const rows = useMemo(() => baseRows.filter(matchesHealth), [baseRows, healthFilter]);

  const healthCounts = useMemo(() => ({
    '': baseRows.length,
    on_track: baseRows.filter((b) => b.health === 'On Track').length,
    at_risk: baseRows.filter((b) => b.health === 'At Risk' || b.health === 'Monitor').length,
    off_track: baseRows.filter((b) => b.health === 'Off Track').length,
  }), [baseRows]);

  const hasFilters = Object.values(filters).some(Boolean);
  const canReorder = !search.trim() && !hasFilters && !groupBy && !healthFilter;

  /**
   * scopeIds — a Set of row ids to limit the export to (null = all rows).
   * statuses / healths — multi-select value lists; a row matching any listed
   * value is included. 'At Risk' also matches the stored 'Monitor' health.
   */
  const runExport = (format, order, scopeIds = null, statuses = [], healths = []) => {
    let visible = order;
    if (statuses.length || healths.length) {
      visible = order.filter(
        (r) =>
          (!statuses.length || statuses.includes(r.status)) &&
          (!healths.length || healths.includes(r.health) || (healths.includes('At Risk') && r.health === 'Monitor'))
      );
    } else if (scopeIds && scopeIds.size) {
      visible = order.filter((r) => scopeIds.has(r.id));
    }

    const flat = groupBy
      ? groupBlocks(visible, fieldByKey(groupBy)).flatMap((g) => g.rows.map((r) => ({ ...r, _group: g.label })))
      : visible;
    if (format === 'excel') exportBlocksToExcel(flat, exportTitle, customCols);
    else exportBlocksToPdf(flat, exportTitle, customCols);
  };

  const sectionsFor = (order) => (groupBy ? groupBlocks(order, fieldByKey(groupBy)) : [{ label: null, rows: order }]);

  const toolbarProps = {
    rows,
    search,
    onSearch: setSearch,
    groupBy,
    onGroup: setGroupBy,
    onClearGroup: () => setGroupBy(''),
    filters,
    onFilter: (key, value) => setFilters((f) => { const next = { ...f }; if (value) next[key] = value; else delete next[key]; return next; }),
    onClearFilters: () => setFilters({}),
    onExport: setExportFormat,
    fields,
  };

  return {
    rows,
    canReorder,
    groupBy,
    healthFilter,
    setHealthFilter,
    healthCounts,
    sectionsFor,
    runExport,
    toolbarProps,
    exportFormat,
    closeExport: () => setExportFormat(null),
  };
}