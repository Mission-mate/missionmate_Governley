import { createContext, useContext } from 'react';
import { normalizeTracking, tracksCount, tracksCompletion } from '@/components/strategy/level6/tracking/trackingConfig';

/**
 * Data scope for the shared measure reporting (Data) workspace. Strategy is the
 * default; Program Deliverables use their own entities so records never mix.
 * `tracking(parent)` maps the parent record to { unit, direction, count, completion }.
 */
export const STRATEGY_REPORT_STORE = {
  report: 'StrategyBlockReport', parent: 'StrategyBlock', scope: 'block_id', notesType: 'strategy_block_report',
  tracking: (b) => ({
    ...normalizeTracking(b.tracking_config, b.level),
    direction: b.tracking_config?.direction,
    count: tracksCount(b.tracking_config, b.level),
    completion: tracksCompletion(b.tracking_config, b.level),
  }),
};

export const PROGRAM_REPORT_STORE = {
  report: 'ProgramDeliverableReport', parent: 'ProgramDeliverable', scope: 'deliverable_id', notesType: 'program_deliverable_report',
  tracking: (d) => ({ unit: d.unit || '#', direction: d.direction || 'Higher is Better', count: true, completion: false }),
};

export const PROJECT_REPORT_STORE = {
  ...PROGRAM_REPORT_STORE,
  report: 'ProjectDeliverableReport', parent: 'ProjectDeliverable', notesType: 'project_deliverable_report',
};

const ReportStoreContext = createContext(STRATEGY_REPORT_STORE);
export const ReportStoreProvider = ReportStoreContext.Provider;
export const useReportStore = () => useContext(ReportStoreContext);