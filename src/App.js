import EditListing from './pages/EditListing'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/AuthContext'
import Layout from './components/Layout'
import Home from './pages/Home'
import Browse from './pages/Browse'
import ListingDetail from './pages/ListingDetail'
import NewListing from './pages/NewListing'
import Matches from './pages/Matches'
import Messages from './pages/Messages'
import Profile from './pages/Profile'
import Login from './pages/Login'
import Register from './pages/Register'
import Admin from './pages/Admin'
import './styles.css'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>
  return user ? children : <Navigate to="/login" />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="edit-listing/:id" element={<PrivateRoute><EditListing /></PrivateRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="browse" element={<Browse />} />
            <Route path="listing/:id" element={<ListingDetail />} />
            <Route path="new-listing" element={<PrivateRoute><NewListing /></PrivateRoute>} />
            <Route path="matches" element={<PrivateRoute><Matches /></PrivateRoute>} />
            <Route path="messages" element={<PrivateRoute><Messages /></PrivateRoute>} />
            <Route path="messages/:threadId" element={<PrivateRoute><Messages /></PrivateRoute>} />
            <Route path="profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
            <Route path="admin" element={<PrivateRoute><Admin /></PrivateRoute>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
