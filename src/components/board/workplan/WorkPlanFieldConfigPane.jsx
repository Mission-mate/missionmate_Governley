import React from 'react';
import OptionFieldConfigPane from '@/components/shared/customizer/OptionFieldConfigPane';

// Only Category is customisable for work plans.
const MANAGED_FIELD_IDS = ['category'];

export default function WorkPlanFieldConfigPane(props) {
  return <OptionFieldConfigPane {...props} managedIds={MANAGED_FIELD_IDS} subtitle="Manage Category field options" />;
}