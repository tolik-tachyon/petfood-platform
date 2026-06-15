import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import AuthProvider from '../context/AuthContext';
import PetProvider from '../context/PetContext/PetProvider';
import { BiotechProvider } from '../context/BiotechContext';
import { Dashboard } from './pages/Dashboard';
import { Requests } from './pages/Requests';
import { PetRequestForm } from './pages/PetRequestForm';
import { RequestProvider } from '../context/RequestContext';
import PetRegistration from '../src/pages/PetRegistration';
import PetProfile from '../src/pages/PetProfile';
import Login from '../src/pages/Login';
import ResetPassword from '../src/pages/ResetPassword';
import Register from '../src/pages/UserRegister';
import { VetDashboard } from './pages/VetDashboard';
import { VetRecommendationView } from './pages/VetRecommendationView';
import { VetRecommendationDetail } from './pages/VetRecommendationDetail';
import { UserRecommendationDetail } from './pages/UserRecommendationDetail';
import { UserAnalytics } from './pages/UserAnalytics';
import { RecommendationsList } from './pages/RecommendationsList';
import { AnalyticsList } from './pages/AnalyticsList';
import PrivateRoute from "../src/components/PrivateRoute";
import { DevRoleSwitch } from '../src/components/DevRoleSwitch';
import './App.css';
import { RequestDetail } from './pages/RequestDetail';
import { VetRecommendation } from './pages/VetRecommendation';
import { UserHandbook } from './pages/UserHandbook';
import { UserRecordsPage } from './pages/UserRecordsPage';
import { UserRecommendationCreate } from './pages/UserRecommendationCreate';
import { UserRecommendationView } from './pages/UserRecommendationView';
import { UserRecommendationCreateDetails } from './pages/UserRecommendationCreateDetails';
import { Settings } from './pages/Settings';
import { Help } from './pages/Help';
import { EditProfile } from './pages/EditProfile';





function App() {
  return (
     <Router basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <AuthProvider>
        <PetProvider>
          <RequestProvider>
            <BiotechProvider>
              <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />

                <Route path="/dev" element={<DevRoleSwitch />} />

                <Route
                  path="/login"
                  element={
                    <div className="auth-wrapper">
                      <Login />
                    </div>
                  }
                />
                <Route
                  path="/register"
                  element={
                    <div className="auth-wrapper">
                      <Register />
                    </div>
                  }
                />

                <Route
                  path="/reset-password"
                  element={
                    <div className="auth-wrapper">
                      <ResetPassword />
                    </div>
                  }
                />

                <Route
                  path="/dashboard"
                  element={
                    <PrivateRoute allowedRoles={['USER']}>
                      <Dashboard />
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/requests"
                  element={
                    <PrivateRoute allowedRoles={['USER']}>
                      <Requests />
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/create-request"
                  element={
                    <PrivateRoute allowedRoles={['USER']}>
                      <PetRequestForm />
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/register-pet"
                  element={
                    <PrivateRoute allowedRoles={['USER']}>
                      <PetRegistration />
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/register-pet/:id"
                  element={
                    <PrivateRoute allowedRoles={['USER']}>
                      <PetRegistration />
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/pet-profile/:id"
                  element={
                    <PrivateRoute allowedRoles={['USER']}>
                      <PetProfile />
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/request/:id"
                  element={
                    <PrivateRoute allowedRoles={['USER']}>
                      <RequestDetail />
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/recommendations"
                  element={
                    <PrivateRoute allowedRoles={['USER']}>
                      <RecommendationsList />
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/analytics"
                  element={
                    <PrivateRoute allowedRoles={['USER']}>
                      <AnalyticsList />
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/settings"
                  element={
                    <PrivateRoute allowedRoles={['USER', 'VET']}>
                      <Settings />
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/help"
                  element={
                    <PrivateRoute allowedRoles={['USER', 'VET']}>
                      <Help />
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/settings/edit-profile"
                  element={
                    <PrivateRoute allowedRoles={['USER', 'VET']}>
                      <EditProfile />
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/recommendation/:id"
                  element={
                    <PrivateRoute allowedRoles={['USER']}>
                      <UserRecommendationDetail />
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/analytics/:id"
                  element={
                    <PrivateRoute allowedRoles={['USER']}>
                      <UserAnalytics />
                    </PrivateRoute>
                  }
                />

                <Route
                path="/records"
                element={
                  <PrivateRoute allowedRoles={['USER']}>
                    <UserRecordsPage />
                  </PrivateRoute>
                }
              />
              <Route
                  path="/recommendationcreate/:id"
                  element={
                    <PrivateRoute allowedRoles={['USER']}>
                      <UserRecommendationCreate />
                    </PrivateRoute>
                  }
                />

              <Route
                  path="/recommendationcreate/:id/view"
                  element={
                    <PrivateRoute allowedRoles={['USER']}>
                      <UserRecommendationView />
                    </PrivateRoute>
                  }
                />

                
                
                <Route
                  path="/recommendationcreate/:id/detail"
                  element={
                    <PrivateRoute allowedRoles={['USER']}>
                      <UserRecommendationCreateDetails />
                    </PrivateRoute>
                  }
                />


                <Route
                  path="/vet/dashboard"
                  element={
                    <PrivateRoute allowedRoles={['VET']}>
                      <VetDashboard />
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/vet/recommendation/:id"
                  element={
                    <PrivateRoute allowedRoles={['VET']}>
                      <VetRecommendation />
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/vet/recommendation/:id/view"
                  element={
                    <PrivateRoute allowedRoles={['VET']}>
                      <VetRecommendationView />
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/vet/recommendation/:id/detail"
                  element={
                    <PrivateRoute allowedRoles={['VET']}>
                      <VetRecommendationDetail />
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/admin/dashboard"
                  element={
                    <PrivateRoute allowedRoles={['ADMIN']}>
                      <div style={{ padding: '2rem' }}>
                        <h1>Admin Dashboard</h1>
                        <p>В процессе реализации</p>
                      </div>
                    </PrivateRoute>
                  }
                />

              <Route
                path="/admin/users"
                element={
                  <PrivateRoute allowedRoles={['ADMIN']}>
                    <UserHandbook />
                  </PrivateRoute>
                }
              />
              </Routes>
            </BiotechProvider>
          </RequestProvider>
        </PetProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
