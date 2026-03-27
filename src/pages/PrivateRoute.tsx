// src/components/PrivateRoute.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface PrivateRouteProps {
    children: React.ReactNode;
    requiredRole?: string; // Permite especificar un rol requerido (opcional)
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({
                                                              children,
                                                              requiredRole
                                                          }) => {
    const { isAuthenticated, user, loading } = useAuth();
    const location = useLocation();

    // Mostrar loader mientras verifica autenticación
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-aniverse-cyan"></div>
            </div>
        );
    }

    // Si no está autenticado, redirigir a login guardando la ruta original
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }

    // Si se requiere un rol específico, verificar que el usuario lo tenga
    if (requiredRole && user && user.roles) {
        // Verificar si el usuario tiene el rol requerido
        const hasRequiredRole = user.roles.includes(requiredRole);

        if (!hasRequiredRole) {
            // Redirigir a una página de acceso denegado o a la página principal
            return <Navigate to="/forbidden" replace />;
        }
    }

    // Si está autenticado (y tiene el rol requerido, si se especificó), renderizar el contenido
    return <>{children}</>;
};