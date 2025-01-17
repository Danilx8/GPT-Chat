import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Chat from './pages/Chat';
import PrivateRoute from './components/PrivateRoute';
import { useAuthStore } from './store/authStore';

function App() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/chat" />} />
        <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/chat" />} />
        <Route path="/chat" element={
          <PrivateRoute>
            <Chat />
          </PrivateRoute>
        } />
        <Route path="/" element={<Navigate to="/chat" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;