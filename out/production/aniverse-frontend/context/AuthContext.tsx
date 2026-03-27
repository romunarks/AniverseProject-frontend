// src/context/AuthContext.tsx
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import api from '../api'; // Instancia de Axios configurada
import { Usuario } from '../types';
import { jwtDecode } from 'jwt-decode';



// Define la interfaz para el contexto
interface AuthContextType {
    isAuthenticated: boolean;
    user: Usuario | null;
    token: string | null;
    loading: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => Promise<void>;
    register: (userData: RegisterData) => Promise<boolean>;
    clearError: () => void;
}

// Datos de registro
interface RegisterData {
    nombre: string;
    email: string;
    contrasenya: string;
}

// Interfaz para el contenido del token
interface TokenPayload {
    sub: string; // Normalmente el ID o email del usuario
    exp: number; // Timestamp de expiración
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [user, setUser] = useState<Usuario | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshTimer, setRefreshTimer] = useState<number | null>(null);
    // Verificar token y establecer temporizador para renovarlo
    const setupTokenRefresh = (token: string) => {
        try {
            const decoded = jwtDecode<TokenPayload>(token);
            const expirationTime = decoded.exp * 1000; // Convertir a milisegundos
            const timeUntilExpiry = expirationTime - Date.now();

            // Si el token ya expiró, limpiamos todo
            if (timeUntilExpiry <= 0) {
                clearAuthState();
                return false;
            }

            // Programar renovación 5 minutos antes de que expire
            const refreshTime = Math.max(timeUntilExpiry - 5 * 60 * 1000, 1000);

            // Limpiar temporizador anterior si existe
            if (refreshTimer) {
                clearTimeout(refreshTimer);
            }

            // Establecer nuevo temporizador para renovar token
            const timer = setTimeout(async () => {
                try {
                    // Intentar renovar usando el refreshToken
                    const refreshToken = localStorage.getItem('refreshToken');
                    if (refreshToken) {
                        const response = await api.post('/refresh', { refreshToken });
                        if (response.data.success) {
                            const { token: newToken, refreshToken: newRefreshToken } = response.data.data;
                            updateToken(newToken, newRefreshToken);
                        } else {
                            clearAuthState();
                        }
                    } else {
                        clearAuthState();
                    }
                } catch (error) {
                    console.error("Error refreshing token:", error);
                    clearAuthState();
                }
            }, refreshTime);

            setRefreshTimer(timer);
            return true;
        } catch (error) {
            console.error("Invalid token:", error);
            clearAuthState();
            return false;
        }
    };

    // Actualizar token y almacenarlo
    const updateToken = (newToken: string, newRefreshToken: string) => {
        localStorage.setItem('token', newToken);
        localStorage.setItem('refreshToken', newRefreshToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        setToken(newToken);
        setupTokenRefresh(newToken);
    };

    // Limpiar estado de autenticación
    const clearAuthState = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('refreshToken');
        api.defaults.headers.common['Authorization'] = '';
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);

        if (refreshTimer) {
            clearTimeout(refreshTimer);
            setRefreshTimer(null);
        }
    };

    // Cargar estado inicial de autenticación
    useEffect(() => {
        const loadAuthState = async () => {
            setLoading(true);
            try {
                const storedToken = localStorage.getItem('token');
                const storedUser = localStorage.getItem('user');

                if (storedToken && storedUser) {
                    // Verificar si el token es válido
                    const isValid = setupTokenRefresh(storedToken);

                    if (isValid) {
                        // Configurar el token en Axios
                        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;

                        try {
                            // Verificar con el backend si el token sigue siendo válido
                            await api.get('/usuarios/me');

                            // Token válido, establecer estado de autenticación
                            setToken(storedToken);
                            try {
                                const userData = JSON.parse(storedUser);
                                setUser(userData);
                                setIsAuthenticated(true);
                            } catch (e) {
                                console.error("Invalid user data in localStorage:", e);
                                clearAuthState();
                            }
                        } catch (error) {
                            console.error("Token validation failed:", error);
                            clearAuthState();
                        }
                    }
                }
            } catch (error) {
                console.error("Error loading auth state:", error);
                clearAuthState();
            } finally {
                setLoading(false);
            }
        };

        loadAuthState();

        // Limpiar temporizador al desmontar
        return () => {
            if (refreshTimer) {
                clearTimeout(refreshTimer);
            }
        };
    }, []);

    // Función de login
    const login = async (email: string, password: string): Promise<boolean> => {
        setError(null);
        try {
            const response = await api.post('/login', { email, contrasenya: password });

            if (response.data.success) {
                const { token, refreshToken, user } = response.data.data;

                // Guardar token y datos de usuario
                localStorage.setItem('token', token);
                localStorage.setItem('refreshToken', refreshToken);
                localStorage.setItem('user', JSON.stringify(user));

                // Configurar el token en Axios
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

                // Configurar renovación automática
                setupTokenRefresh(token);

                // Actualizar estado
                setToken(token);
                setUser(user);
                setIsAuthenticated(true);

                return true;
            } else {
                setError(response.data.message || 'Error de inicio de sesión');
                return false;
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Error de conexión';
            setError(errorMessage);
            console.error("Login error:", error);
            return false;
        }
    };

    // Función de logout
    const logout = async (): Promise<void> => {
        try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
                await api.post('/logout', { refreshToken }).catch(err =>
                    console.error("Error during logout API call:", err)
                );
            }
        } catch (error) {
            console.error("Error during logout:", error);
        } finally {
            clearAuthState();
        }
    };

    // Función de registro
    const register = async (userData: RegisterData): Promise<boolean> => {
        setError(null);
        try {
            const response = await api.post('/register', userData);

            if (response.data.success) {
                return true;
            } else {
                setError(response.data.message || 'Error al registrarse');
                return false;
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Error de conexión';
            setError(errorMessage);
            console.error("Registration error:", error);
            return false;
        }
    };

    // Función para limpiar errores
    const clearError = () => {
        setError(null);
    };

    const value = {
        isAuthenticated,
        user,
        token,
        loading,
        error,
        login,
        logout,
        register,
        clearError
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook personalizado para usar el contexto
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth debe ser usado dentro de un AuthProvider');
    }
    return context;
};