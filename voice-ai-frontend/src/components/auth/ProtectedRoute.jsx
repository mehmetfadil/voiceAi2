// voice-ai-frontend/src/components/auth/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
    // Token kontrolü
    const token = localStorage.getItem('token');

    // Token yoksa Login sayfasına at
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    // Token varsa istenen sayfayı göster
    return children;
};

export default ProtectedRoute;