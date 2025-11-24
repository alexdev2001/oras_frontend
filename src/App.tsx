import { useState, useEffect } from 'react';
import { AuthForm } from './components/auth/AuthForm.tsx';
import { OperatorDashboard } from './components/operator/OperatorDashboard.tsx';
import { AdminDashboard } from './components/admin/AdminDashboard.tsx';
import { authAPI } from '@/utils/API.ts';
import { jwtDecode } from "jwt-decode";
import type {DecodedToken} from "@/types/token.ts";

export default function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userRole, setUserRole] = useState< string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const session = authAPI.getSession();
            if (session) {
                const decoded = jwtDecode<DecodedToken>(session);
                const roles = decoded.roles || [];
                const primaryRole = roles.length > 0 ? roles[0] : "operator";

                setIsAuthenticated(true);
                setUserRole(primaryRole);
            }
        } catch (error) {
            console.error('No active session', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAuthSuccess = async () => {
        try {
            const token = localStorage.getItem("authToken");
            if (!token) {
                console.error("No auth token found");
                return;
            }

            const decoded = jwtDecode<DecodedToken>(token);
            const roles = decoded.roles || [];
            const primaryRole = roles.length > 0 ? roles[0] : "operator";

            setIsAuthenticated(true);
            setUserRole(primaryRole);

        } catch (error) {
            console.error("Failed to decode token:", error);
        }
    };

    const handleSignOut = () => {
        setIsAuthenticated(false);
        setUserRole(null);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <AuthForm onAuthSuccess={handleAuthSuccess} />;
    }

    if (userRole === 'admin') {
        return <AdminDashboard onSignOut={handleSignOut} />;
    }

    return <OperatorDashboard onSignOut={handleSignOut} />;
}
