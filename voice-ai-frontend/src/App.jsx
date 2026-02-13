import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Dashboard from './pages/Dashboard';
import KnowledgeBase from './pages/KnowledgeBase'; // Clone yerine KnowledgeBase
import TestAgent from './pages/TestAgent';
import Login from './pages/Login';
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
    return (
        <ThemeProvider>
            <Router>
                <Routes>
                    {/* Public Route (Herkes Erişebilir) */}
                    <Route path="/login" element={<Login />} />

                    {/* Protected Routes (Sadece Giriş Yapanlar) */}
                    <Route path="/" element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    } />

                    <Route path="/knowledge" element={
                        <ProtectedRoute>
                            <KnowledgeBase />
                        </ProtectedRoute>
                    } />

                    <Route path="/test" element={
                        <ProtectedRoute>
                            <TestAgent />
                        </ProtectedRoute>
                    } />

                    {/* 404 Sayfası */}
                    <Route path="*" element={
                        <div className="min-h-screen bg-background-dark text-white flex items-center justify-center font-mono">
                            <div className="text-center">
                                <h1 className="text-4xl text-primary mb-4">404</h1>
                                <p>Page not found.</p>
                            </div>
                        </div>
                    } />
                </Routes>
            </Router>
        </ThemeProvider>
    );
}

export default App;