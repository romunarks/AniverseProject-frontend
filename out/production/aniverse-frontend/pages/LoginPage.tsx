// src/pages/LoginPage.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { AxiosError } from 'axios';
import { AniverseResponse } from '../types';

interface LocationState {
    from?: string;
    registered?: boolean;
}

export const LoginPage: React.FC = () => {
    // Estados para el formulario
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);

    // Estados para UI
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // Hooks de navegación y autenticación
    const { login, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Extraer la ruta de origen y otros estados
    const state = location.state as LocationState;
    const from = state?.from || '/';
    const justRegistered = state?.registered || false;

    // Si el usuario viene después de registrarse, mostrar mensaje
    useEffect(() => {
        if (justRegistered) {
            setSuccessMessage('Registro exitoso. Ahora puedes iniciar sesión.');
        }
    }, [justRegistered]);

    // Si ya está autenticado, redirigir a la página principal
    useEffect(() => {
        if (isAuthenticated) {
            navigate(from);
        }
    }, [isAuthenticated, navigate, from]);

    // Validar email con una expresión regular
    const isValidEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    // Manejar el envío del formulario
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Limpiar mensajes
        setError('');
        setSuccessMessage('');

        // Validación básica de campos
        if (!email.trim() || !password.trim()) {
            setError('Por favor, completa todos los campos.');
            return;
        }

        // Validar formato de email
        if (!isValidEmail(email)) {
            setError('Por favor, ingresa un email válido.');
            return;
        }

        setLoading(true);

        try {
            // Intentar iniciar sesión
            const success = await login(email, password);

            if (success) {
                // Si el login tiene éxito, redirigir a la página original o al inicio
                navigate(from);
            } else {
                setError('Credenciales incorrectas. Por favor, verifica e intenta de nuevo.');
            }
        } catch (err) {
            // Manejar errores específicos
            if (err instanceof AxiosError && err.response?.data) {
                const responseData = err.response.data as AniverseResponse<unknown>;
                setError(responseData.message || 'Error al iniciar sesión');
            } else if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Ha ocurrido un error inesperado. Por favor, intenta de nuevo más tarde.');
            }
            console.error('Error de login:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-aniverse-purple to-aniverse-purple-light">
            <div className="w-full max-w-md px-6 py-8 bg-gray-900 rounded-lg shadow-xl">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white">Iniciar Sesión</h1>
                    <p className="text-gray-400 mt-2">Bienvenido de nuevo a Aniverse</p>
                </div>

                {/* Mensaje de éxito */}
                {successMessage && (
                    <div className="mb-6 p-4 rounded-md bg-green-500/20 border border-green-500 text-green-300">
                        {successMessage}
                    </div>
                )}

                {/* Mensaje de error */}
                {error && (
                    <div className="mb-6 p-4 rounded-md bg-red-500/20 border border-red-500 text-red-300">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Campo de Email */}
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-3 rounded-md bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-aniverse-cyan focus:ring-1 focus:ring-aniverse-cyan"
                            placeholder="tu@email.com"
                            disabled={loading}
                            autoComplete="email"
                        />
                    </div>

                    {/* Campo de Contraseña */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                                Contraseña
                            </label>
                            <Link to="/forgot-password" className="text-sm text-aniverse-cyan hover:text-aniverse-cyan-light">
                                ¿Olvidaste tu contraseña?
                            </Link>
                        </div>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-3 rounded-md bg-gray-800 border border-gray-700 text-white focus:outline-none focus:border-aniverse-cyan focus:ring-1 focus:ring-aniverse-cyan"
                            placeholder="••••••••"
                            disabled={loading}
                            autoComplete="current-password"
                        />
                    </div>

                    {/* Opción "Recordarme" */}
                    <div className="flex items-center">
                        <input
                            id="remember-me"
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-600 text-aniverse-cyan focus:ring-aniverse-cyan"
                        />
                        <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300">
                            Recordarme
                        </label>
                    </div>

                    {/* Botón de Inicio de Sesión */}
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full p-3 rounded-md bg-aniverse-cyan text-gray-900 font-semibold hover:bg-aniverse-cyan-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-aniverse-cyan transition-colors ${
                            loading ? 'opacity-70 cursor-not-allowed' : ''
                        }`}
                    >
                        {loading ? (
                            <div className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-900" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Iniciando sesión...
                            </div>
                        ) : (
                            'Iniciar Sesión'
                        )}
                    </button>

                    {/* Enlace a Registro */}
                    <div className="text-center mt-4">
                        <p className="text-gray-400">
                            ¿No tienes una cuenta?{' '}
                            <Link to="/register" className="text-aniverse-cyan hover:text-aniverse-cyan-light font-medium">
                                Regístrate
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};