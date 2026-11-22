import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ModuleLoader from '@/components/shared/states/ModuleLoader';
import { getAppConfig, saveAppConfig } from '@/lib/appConfig';
import {
  RISK_GUIDE_CONFIG_KEY,
  defaultRiskGuideCriteria } from
'@/lib/riskGuideDefaults';
import ThreeRegistersCard from './ThreeRegistersCard';
import RiskRatingCard from './RiskRatingCard';
import RiskAppetiteCard from './RiskAppetiteCard';
import CriteriaTable from './CriteriaTable';
import EditCriteriaPane from './EditCriteriaPane';

export default function RiskGuideTab() {
  const [record, setRecord] = useState(null);
  const [criteria, setCriteria] = useState(defaultRiskGuideCriteria());
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // 'consequence' | 'likelihood' | null

  useEffect(() => {
    (async () => {
      const rec = await getAppConfig(RISK_GUIDE_CONFIG_KEY);
      if (rec?.settings?.consequence && rec?.settings?.likelihood) {
        setCriteria(rec.settings);
      }
      setRecord(rec);
      setLoading(false);
    })();
  }, []);

  const saveCriteria = async (key, rows) => {
    const next = { ...criteria, [key]: rows };
    const rec = await saveAppConfig(RISK_GUIDE_CONFIG_KEY, next, record);
    setRecord(rec ?? { key: RISK_GUIDE_CONFIG_KEY, settings: next });
    setCriteria(next);
  };

  if (loading) {
    return <ModuleLoader />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6">
      
      <ThreeRegistersCard />

      {/* Top row — Risk Rating Description + Risk Appetite */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RiskRatingCard />
        <RiskAppetiteCard />
      </div>

      {/* System Assessment Criteria tables */}
      <div>
        <h3 className="text-base font-semibold text-foreground">Likelihood & Consequences (Impact) Assessment Criteria</h3>
        <p className="text-xs text-muted-foreground mt-0.5 mb-4">Criteria to assess consequence and likelihood. The assessment criteria can be modified to suit organisational preferences.


        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CriteriaTable
            title="Consequence"
            categoryLabel="Consequence"
            rows={criteria.consequence}
            onEdit={() => setEditing('consequence')} />
          
          <CriteriaTable
            title="Likelihood"
            categoryLabel="Likelihood"
            rows={criteria.likelihood}
            onEdit={() => setEditing('likelihood')} />
          
        </div>
      </div>

      <EditCriteriaPane
        isOpen={editing === 'consequence'}
        onClose={() => setEditing(null)}
        title="Consequence Criteria"
        rows={criteria.consequence}
        onSave={(rows) => saveCriteria('consequence', rows)} />
      
      <EditCriteriaPane
        isOpen={editing === 'likelihood'}
        onClose={() => setEditing(null)}
        title="Likelihood Criteria"
        rows={criteria.likelihood}
        onSave={(rows) => saveCriteria('likelihood', rows)} />
      
    </motion.div>);

}