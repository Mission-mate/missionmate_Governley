import React from 'react';
import OptionFieldConfigPane from '@/components/shared/customizer/OptionFieldConfigPane';

// Only Category and Regulator are customisable here.
const MANAGED_FIELD_IDS = ['category', 'regulator'];

export default function ComplianceFieldConfigPane(props) {
  return <OptionFieldConfigPane {...props} managedIds={MANAGED_FIELD_IDS} subtitle="Manage Category and Regulator field options" />;
}