import { base44 } from '@/api/base44Client';
import { getReportType } from '@/lib/riskReportTypes';
import { localToday } from '@/lib/localClock';

export const RISK_REPORT_CONFIG_KEY = 'risk_report_snapshot';

/** Generate a fresh report of the given type (runs the CRO analysis + persists it). */
export async function generateRiskReport(reportTypeId = 'comprehensive', config = {}) {
  const type = getReportType(reportTypeId);
  const res = await base44.functions.invoke(type.fn, { ...config, today: localToday() });
  return res.data?.snapshot;
}

/** Load the last saved snapshot for a report type, or null if none has been generated. */
export async function getRiskReportSnapshot(reportTypeId = 'comprehensive') {
  const type = getReportType(reportTypeId);
  const rows = await base44.entities.AppConfig.filter({ key: type.configKey });
  return rows?.[0]?.settings ?? null;
}