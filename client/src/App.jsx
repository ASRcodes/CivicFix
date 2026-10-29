import { Navigate, Route, Routes } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout.jsx';
import DashboardLayout from './layouts/DashboardLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AdminRoute from './components/AdminRoute.jsx';

import HomePage from './pages/public/HomePage.jsx';
import LoginPage from './pages/public/LoginPage.jsx';
import RegisterPage from './pages/public/RegisterPage.jsx';
import AboutPage from './pages/public/AboutPage.jsx';
import HelpPage from './pages/public/HelpPage.jsx';
import TrackComplaintPage from './pages/public/TrackComplaintPage.jsx';
import NotFoundPage from './pages/public/NotFoundPage.jsx';

import CitizenDashboard from './pages/citizen/CitizenDashboard.jsx';
import MyComplaints from './pages/citizen/MyComplaints.jsx';
import NewComplaint from './pages/citizen/NewComplaint.jsx';
import EditComplaint from './pages/citizen/EditComplaint.jsx';
import ComplaintDetails from './pages/citizen/ComplaintDetails.jsx';
import ProfilePage from './pages/citizen/ProfilePage.jsx';

import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminComplaints from './pages/admin/AdminComplaints.jsx';
import AdminUsers from './pages/admin/AdminUsers.jsx';
import AdminDepartments from './pages/admin/AdminDepartments.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="help" element={<HelpPage />} />
        <Route path="track" element={<TrackComplaintPage />} />
        {/* "Report Issue" requires login; unauthenticated users are sent to /login and returned here. */}
        <Route path="report" element={<ProtectedRoute role="citizen"><Navigate to="/dashboard/complaints/new" replace /></ProtectedRoute>} />
      </Route>

      <Route path="dashboard" element={<ProtectedRoute role="citizen"><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<CitizenDashboard />} />
        <Route path="complaints" element={<MyComplaints />} />
        <Route path="complaints/new" element={<NewComplaint />} />
        <Route path="complaints/:id" element={<ComplaintDetails />} />
        <Route path="complaints/:id/edit" element={<EditComplaint />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      <Route path="admin" element={<AdminRoute><DashboardLayout /></AdminRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="complaints" element={<AdminComplaints />} />
        <Route path="complaints/:id" element={<ComplaintDetails />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="departments" element={<AdminDepartments />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      <Route element={<PublicLayout />}>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
