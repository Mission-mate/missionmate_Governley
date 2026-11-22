import React from 'react';
import { Navigate } from 'react-router-dom';
import { useModules } from '@/hooks/useModules';

/** Renders a module's page only while that module is enabled; otherwise sends the visitor Home. */
export default function ModuleRoute({ id, children }) {
  const { isModuleActive, isLoading } = useModules();
  if (isLoading) return null;
  return isModuleActive(id) ? children : <Navigate to="/" replace />;
}