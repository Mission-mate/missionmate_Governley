import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { AppearanceProvider } from '@/lib/AppearanceContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ProtectedRoute from '@/components/ProtectedRoute';
import ModuleRoute from '@/components/ModuleRoute';
import { LoaderOne } from '@/components/ui/loaders';
import PageBoundary from '@/components/shared/states/PageBoundary';
import LocalDayProvider from '@/components/LocalDayProvider';
import NavigationGuard from '@/components/NavigationGuard';
import GlobalTitleTooltip from '@/components/shared/GlobalTitleTooltip';
// Auth pages
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

// Layout
import AppLayout from '@/components/layout/AppLayout';
import CopilotHost from '@/components/copilot/CopilotHost';

// Pages
import ContactDatabase from '@/pages/ContactDatabase';
import ContactDetail from '@/pages/ContactDetail';
import GrantDashboard from '@/pages/modules/GrantDashboard';
import GrantRegister from '@/pages/modules/GrantRegister';
import GrantDetail from '@/pages/modules/GrantDetail';
import GenericModule from '@/pages/modules/GenericModule';
import ReportingObligations from '@/pages/modules/ReportingObligations';
import ProgramManagement from '@/pages/modules/ProgramManagement';
import ProgramDetail from '@/pages/modules/ProgramDetail';
import ProjectDetail from '@/pages/modules/ProjectDetail';
import DeliverableWorkspace from '@/pages/modules/DeliverableWorkspace';
import { programDeliverablesApi, projectDeliverablesApi } from '@/lib/programs/deliverablesApi';
import PlannerDetail from '@/pages/modules/PlannerDetail';
import { PROGRAM_PLANNERS, PROJECT_PLANNERS } from '@/lib/programs/plannerSources';
import BoardMeetings from '@/pages/modules/BoardMeetings';
import MeetingProfile from '@/pages/modules/MeetingProfile';
import BoardDocuments from '@/pages/modules/BoardDocuments';
import BoardPeople from '@/pages/modules/BoardPeople';
import WorkPlans from '@/pages/modules/board/WorkPlans';
import WorkPlanDetail from '@/pages/modules/board/WorkPlanDetail';
import BoardCommittees from '@/pages/modules/BoardCommittees';
import BoardMeetingActions from '@/pages/modules/BoardMeetingActions';
import MeetingActionRegisterPage from '@/pages/modules/MeetingActionRegister';
import BoardDecisions from '@/pages/modules/BoardDecisions';
import DecisionRegisterPage from '@/pages/modules/DecisionRegister';
import Members from '@/pages/modules/Members';
import MemberDetail from '@/pages/modules/MemberDetail';
import MembershipConfiguration from '@/pages/modules/MembershipConfiguration';
import MembershipPlanEditor from '@/pages/modules/MembershipPlanEditor';
import StrategyRegister from '@/pages/modules/strategy/StrategyRegister';
import StrategyDetail from '@/pages/modules/strategy/StrategyDetail';
import DeliverableDetail from '@/pages/modules/strategy/DeliverableDetail';
import RiskDashboard from '@/pages/modules/risk/RiskDashboard';
import RiskRegister from '@/pages/modules/risk/RiskRegister';
import RiskDetail from '@/pages/modules/risk/RiskDetail';
import ComplianceObligations from '@/pages/modules/compliance/ComplianceObligations';
import ComplianceRegisterDetail from '@/pages/modules/compliance/ComplianceRegisterDetail';
import ComplianceRegisters from '@/pages/modules/compliance/ComplianceRegisters';
import ManagedRegisterDetail from '@/pages/modules/compliance/ManagedRegisterDetail';
import AssetDetail from '@/pages/modules/compliance/AssetDetail';
import HazardDetail from '@/pages/modules/compliance/HazardDetail';
import IncidentDetail from '@/pages/modules/compliance/IncidentDetail';
import SafetyCheckDetail from '@/pages/modules/compliance/SafetyCheckDetail';
import ContractDetail from '@/pages/modules/compliance/ContractDetail';
import WorkforcePersonDetail from '@/pages/modules/compliance/WorkforcePersonDetail';
import DonorDetail from '@/pages/modules/compliance/DonorDetail';
import DeclarantDetail from '@/pages/modules/compliance/DeclarantDetail';
import Settings from '@/pages/Settings';
import Home from '@/pages/Home';
import PolicyManagement from '@/pages/modules/compliance/PolicyManagement';
import PolicyDetail from '@/pages/modules/compliance/PolicyDetail';
import PublicMembershipForm from '@/pages/PublicMembershipForm';
import Conversations from '@/pages/modules/Conversations';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Public, no-login membership form — render directly, bypassing auth gating.
  if (typeof window !== 'undefined' && window.location.pathname === '/join') {
    return (
      <Routes>
        <Route path="/join" element={<PublicMembershipForm />} />
      </Routes>
    );
  }

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <LoaderOne size="lg" />
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      {/* Public, no-login membership form */}
      <Route path="/join" element={<PublicMembershipForm />} />

      {/* Auth routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Protected routes with layout */}
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        {/* Copilot dock (hold Space) is available on every signed-in page */}
        <Route element={<CopilotHost />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/conversations" element={<ModuleRoute id="conversations"><PageBoundary><Conversations /></PageBoundary></ModuleRoute>} />
          <Route path="/contacts" element={<ContactDatabase />} />
          <Route path="/contacts/:id" element={<ContactDetail />} />
          <Route path="/grants/dashboard" element={<GrantDashboard />} />
          <Route path="/grants/register" element={<GrantRegister />} />
          <Route path="/grants/:id" element={<GrantDetail />} />
          <Route path="/grants/reporting" element={<ReportingObligations />} />
          <Route path="/strategy/register" element={<StrategyRegister />} />
          <Route path="/strategy/register/:id" element={<StrategyDetail />} />
          {/* Semantic alias — both resolve to the same detail workspace so existing links keep working. */}
          <Route path="/strategy/deliverables/:id" element={<DeliverableDetail />} />
          <Route path="/strategy/measures/:id" element={<DeliverableDetail />} />
          <Route path="/risk/dashboard" element={<RiskDashboard />} />
          <Route path="/risk/register" element={<RiskRegister />} />
          <Route path="/risk/register/:id" element={<RiskDetail />} />
          <Route path="/compliance" element={<Navigate to="/compliance/obligations" replace />} />
          <Route path="/compliance/dashboard" element={<Navigate to="/compliance/obligations" replace />} />
          <Route path="/compliance/obligations" element={<ComplianceObligations />} />
          <Route path="/compliance/obligations/:id" element={<ComplianceRegisterDetail />} />
          <Route path="/compliance/registers" element={<ComplianceRegisters />} />
          <Route path="/compliance/registers/:id" element={<PageBoundary><ManagedRegisterDetail /></PageBoundary>} />
          <Route path="/compliance/registers/:registerId/asset/:assetId" element={<PageBoundary><AssetDetail /></PageBoundary>} />
          <Route path="/compliance/registers/:registerId/hazard/:hazardId" element={<PageBoundary><HazardDetail /></PageBoundary>} />
          <Route path="/compliance/registers/:registerId/incident/:incidentId" element={<PageBoundary><IncidentDetail /></PageBoundary>} />
          <Route path="/compliance/registers/:registerId/check/:checkId" element={<PageBoundary><SafetyCheckDetail /></PageBoundary>} />
          <Route path="/compliance/registers/:registerId/contract/:contractId" element={<PageBoundary><ContractDetail /></PageBoundary>} />
          <Route path="/compliance/registers/:registerId/person/:personId" element={<PageBoundary><WorkforcePersonDetail /></PageBoundary>} />
          <Route path="/compliance/registers/:registerId/donor/:donorId" element={<PageBoundary><DonorDetail /></PageBoundary>} />
          <Route path="/compliance/registers/:registerId/declarant/:declarantId" element={<PageBoundary><DeclarantDetail /></PageBoundary>} />
          <Route path="/compliance/policy" element={<PageBoundary><PolicyManagement /></PageBoundary>} />
          <Route path="/compliance/policy/:id" element={<PageBoundary><PolicyDetail /></PageBoundary>} />
          <Route path="/programs/overview" element={<ProgramManagement />} />
          <Route path="/programs/deliverables/:id" element={<PageBoundary><DeliverableWorkspace key="program" api={programDeliverablesApi} /></PageBoundary>} />
          <Route path="/projects/deliverables/:id" element={<PageBoundary><DeliverableWorkspace key="project" api={projectDeliverablesApi} /></PageBoundary>} />
          <Route path="/programs/planners/:id" element={<PageBoundary><PlannerDetail key="program" source={PROGRAM_PLANNERS} /></PageBoundary>} />
          <Route path="/projects/planners/:id" element={<PageBoundary><PlannerDetail key="project" source={PROJECT_PLANNERS} /></PageBoundary>} />
          <Route path="/programs/:id" element={<ProgramDetail />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/board/meetings" element={<PageBoundary><BoardMeetings /></PageBoundary>} />
          <Route path="/board/meetings/:id" element={<PageBoundary><MeetingProfile /></PageBoundary>} />
          <Route path="/board/meeting-actions" element={<PageBoundary><BoardMeetingActions /></PageBoundary>} />
          <Route path="/board/meeting-actions/:id" element={<PageBoundary><MeetingActionRegisterPage /></PageBoundary>} />
          <Route path="/board/decisions" element={<PageBoundary><BoardDecisions /></PageBoundary>} />
          <Route path="/board/decisions/:id" element={<PageBoundary><DecisionRegisterPage /></PageBoundary>} />
          <Route path="/board/documents" element={<PageBoundary><BoardDocuments /></PageBoundary>} />
          <Route path="/board/work-plans" element={<PageBoundary><WorkPlans /></PageBoundary>} />
          <Route path="/board/work-plans/:id" element={<PageBoundary><WorkPlanDetail /></PageBoundary>} />
          <Route path="/board/people" element={<PageBoundary><BoardPeople /></PageBoundary>} />
          <Route path="/board/committees" element={<PageBoundary><BoardCommittees /></PageBoundary>} />
          <Route path="/membership/members" element={<Members />} />
          <Route path="/membership/members/:id" element={<MemberDetail />} />
          <Route path="/membership/configuration" element={<MembershipConfiguration />} />
          <Route path="/membership/plans/:id" element={<MembershipPlanEditor />} />
          <Route path="/membership/settings" element={<GenericModule />} />
          <Route path="/volunteers/register" element={<GenericModule />} />
          <Route path="/volunteers/programs" element={<GenericModule />} />

        </Route>
        {/* Settings has its own layout (no main sidebar) */}
        <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppearanceProvider>
        <QueryClientProvider client={queryClientInstance}>
          <LocalDayProvider>
            <Router>
              <NavigationGuard />
              <AuthenticatedApp />
            </Router>
          </LocalDayProvider>
          <Toaster />
          <GlobalTitleTooltip />
        </QueryClientProvider>
      </AppearanceProvider>
    </AuthProvider>
  )
}

export default App