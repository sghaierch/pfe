import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';

// Pages publiques
import Home from './pages/Home';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ForgetPassword from './components/Auth/ForgetPassword';
import NotFound from './pages/NotFound';
import Unauthorized from './pages/Unauthorized';
import CompanyRegistration from './pages/public/CompanyRegistration';
import EmployeeDashboard from './pages/employee/EmployeeDashboard';

// SuperAdmin
import SuperAdminLayout from './pages/superadmin/layout/SuperAdminLayout';
import Dashboard from './pages/superadmin/dashboard/Dashboard';
import SubscriptionsList from './pages/superadmin/subscriptions/SubscriptionsList';
import PlansList from './pages/superadmin/plans/PlansList';
import PlanCreate from './pages/superadmin/plans/PlanCreate';
import PlanEdit from './pages/superadmin/plans/PlanEdit';
import TenantsList from './pages/superadmin/tenants/TenantsList';

// Company
import CompanyLayout    from './pages/company/layout/CompanyLayout';
import CompanyDashboard from './pages/company/dashboard/CompanyDashboard';
import CompanyUsersList from './pages/company/users/CompanyUsersList';
import CompanyUserCreate from './pages/company/users/CompanyUserCreate';
import CompanyUserEdit   from './pages/company/users/CompanyUserEdit';
import ProjectsList     from './pages/company/projects/ProjectsList';
import ProjectDetail    from './pages/company/projects/ProjectDetail';
import WorkflowDetail   from './pages/company/workflows/WorkflowDetail';
import PostsList from './pages/company/settings/PostsList';
import DepartmentsList from './pages/company/departments/DepartmentsList';
import TemplatesList              from './pages/company/templates/TemplatesList';
import CreateWorkflowFromTemplate from './pages/company/workflows/CreateWorkflowFromTemplate';
import GenerateWithAI from './pages/company/workflows/GenerateWithAI';
import WorkflowEditPage from './pages/company/workflows/WorkflowEditPage';
import AuditLog from './pages/company/audit/AuditLog';
import CompanySettings from './pages/company/settings/CompanySettings';
import UserProfile from './pages/company/profile/UserProfile';
import WorkflowAssistant from './pages/company/workflows/WorkflowAssistant';
import EmployeeRequestList  from './pages/employee/EmployeeRequestList';
import EmployeeSubmitRequest from './pages/employee/EmployeeSubmitRequest';
import Workfloweditinfopage from './pages/company/workflows/Workfloweditinfopage';
import EmployeeRequestDetail from './pages/employee/EmployeeRequestDetail';
import DocumentTypesPage from './pages/company/document-types/DocumentTypesPage';
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Routes publiques */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forget-password" element={<ForgetPassword />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/company/register" element={<CompanyRegistration />} />

          {/* SuperAdmin */}
          <Route path="/dashboard/superadmin" element={
            <ProtectedRoute allowedRoles={['superadmin']}>
              <SuperAdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="plans" element={<PlansList />} />
            <Route path="plans/create" element={<PlanCreate />} />
            <Route path="plans/edit/:id" element={<PlanEdit />} />
            <Route path="subscriptions" element={<SubscriptionsList />} />
            <Route path="tenants" element={<TenantsList />} />
          </Route>

          {/* Company Dashboard */}
          <Route path="/dashboard/company" element={
            <ProtectedRoute>
              <CompanyLayout />
            </ProtectedRoute>
          }>
            <Route index element={<CompanyDashboard />} />
            <Route path="users"              element={<CompanyUsersList />} />
            <Route path="users/create"       element={<CompanyUserCreate />} />
            <Route path="users/edit/:id"     element={<CompanyUserEdit />} />
            <Route path="projects"           element={<ProjectsList />} />
            <Route path="projects/:id"       element={<ProjectDetail />} />
            <Route path="workflows/:id"      element={<WorkflowDetail />} />
            <Route path="workflows/:id/edit" element={<WorkflowEditPage />} />
            <Route path="workflows/:id/edit-info" element={<Workfloweditinfopage />} />
            <Route path="settings/posts"     element={<PostsList />} />
            <Route path="departments"        element={<DepartmentsList />} />
            <Route path="templates"          element={<TemplatesList />} />
            <Route path="document-types" element={<DocumentTypesPage />} />
            <Route path="workflows/new"      element={<CreateWorkflowFromTemplate />} />
            <Route path="projects/:id/generate-ai" element={<GenerateWithAI />} />
            <Route path="ai-assistant" element={<WorkflowAssistant />} />
            <Route path="audit" element={<AuditLog />} />
            <Route path="settings/notifications" element={<CompanySettings />} />
            <Route path="profile" element={<UserProfile />} />
          </Route>

          {/* Employee */}
          <Route path="/dashboard/employee" element={
            <ProtectedRoute><EmployeeDashboard /></ProtectedRoute>
          } />
          <Route path="/dashboard/employee/new-request" element={
            <ProtectedRoute><EmployeeRequestList /></ProtectedRoute>
          } />
          <Route path="/dashboard/employee/submit-request" element={
            <ProtectedRoute><EmployeeSubmitRequest /></ProtectedRoute>
          } />
          <Route path="/dashboard/employee/requests/:id" element={
            <ProtectedRoute><EmployeeRequestDetail /></ProtectedRoute>
          } />
          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;