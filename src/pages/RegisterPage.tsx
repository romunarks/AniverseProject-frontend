// src/pages/RegisterPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AxiosError } from 'axios';
import { AniverseResponse } from '../types';
import { FaEye, FaEyeSlash, FaCheck, FaTimes } from 'react-icons/fa';

export const RegisterPage: React.FC = () => {
    // Estados del formulario
    const [formData, setFormData] = useState({
        nombre: '',
        email: '',
        contrasenya: '',
        confirmPassword: ''
    });

    // Estados de UI
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState({
        score: 0,
        hasMinLength: false,
        hasUppercase: false,
        hasLowercase: false,
        hasNumber: false,
        hasSpecial: false
    });

    // Hooks de navegación y autenticación
    const navigate = useNavigate();
    const { register, isAuthenticated } = useAuth();

    // Si está autenticado, redirigir al inicio
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/');
        }
    }, [isAuthenticated, navigate]);

    // Actualizar el estado del formulario
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Limpiar error específico al cambiar el valor
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }

        // Verificar fortaleza de contraseña si es el campo de contraseña
        if (name === 'contrasenya') {
            checkPasswordStrength(value);
        }

        // Verificar confirmación de contraseña
        if (name === 'confirmPassword' || (name === 'contrasenya' && formData.confirmPassword)) {
            const contrasenya = name === 'contrasenya' ? value : formData.contrasenya;
            const confirmation = name === 'confirmPassword' ? value : formData.confirmPassword;

            if (confirmation && contrasenya !== confirmation) {
                setErrors(prev => ({
                    ...prev,
                    confirmPassword: 'Las contraseñas no coinciden'
                }));
            } else {
                setErrors(prev => ({
                    ...prev,
                    confirmPassword: ''
                }));
            }
        }
    };

    // Verificar fortaleza de la contraseña
    const checkPasswordStrength = (password: string) => {
        const hasMinLength = password.length >= 8;
        const hasUppercase = /[A-Z]/.test(password);
        const hasLowercase = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecial = /[^A-Za-z0-9]/.test(password);

        // Calcular puntaje (de 0 a 5)
        let score = 0;
        if (hasMinLength) score++;
        if (hasUppercase) score++;
        if (hasLowercase) score++;
        if (hasNumber) score++;
        if (hasSpecial) score++;

        setPasswordStrength({
            score,
            hasMinLength,
            hasUppercase,
            hasLowercase,
            hasNumber,
            hasSpecial
        });
    };

    // Validar formulario completo
    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        // Validar nombre
        if (!formData.nombre.trim()) {
            newErrors.nombre = 'El nombre es obligatorio';
        } else if (formData.nombre.length < 3) {
            newErrors.nombre = 'El nombre debe tener al menos 3 caracteres';
        }

        // Validar email
        if (!formData.email.trim()) {
            newErrors.email = 'El email es obligatorio';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'El email no es válido';
        }

        // Validar contraseña
        if (!formData.contrasenya) {
            newErrors.contrasenya = 'La contraseña es obligatoria';
        } else if (passwordStrength.score < 3) {
            newErrors.contrasenya = 'La contraseña es demasiado débil';
        }

        // Validar confirmación
        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Confirma tu contraseña';
        } else if (formData.contrasenya !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Las contraseñas no coinciden';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Manejar envío del formulario
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validar formulario
        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            // Intenta registrar al usuario
            const success = await register({
                nombre: formData.nombre,
                email: formData.email,
                contrasenya: formData.contrasenya
            });

            if (success) {
                // Redirigir a login con estado para mostrar mensaje de éxito
                navigate('/login', { state: { registered: true } });
            } else {
                setErrors({
                    form: 'No se pudo completar el registro. Intenta de nuevo.'
                });
            }
        } catch (err) {
            // Manejar errores de manera específica
            if (err instanceof AxiosError && err.response?.data) {
                const responseData = err.response.data as AniverseResponse<unknown>;

                // Intentar determinar si es un error específico de campo
                if (responseData.message.toLowerCase().includes('email')) {
                    setErrors({
                        email: responseData.message || 'Este email ya está en uso'
                    });
                } else {
                    setErrors({
                        form: responseData.message || 'Error al registrarse'
                    });
                }
            } else if (err instanceof Error) {
                setErrors({
                    form: err.message
                });
            } else {
                setErrors({
                    form: 'Ha ocurrido un error inesperado. Por favor, intenta de nuevo más tarde.'
                });
            }
            console.error('Error de registro:', err);
        } finally {
            setLoading(false);
        }
    };

    // Componente para indicador de seguridad de contraseña
    const PasswordStrengthIndicator = () => {
        const getColor = () => {
            if (passwordStrength.score < 2) return 'bg-red-500';
            if (passwordStrength.score < 4) return 'bg-yellow-500';
            return 'bg-green-500';
        };

        const getLabel = () => {
            if (passwordStrength.score < 2) return 'Débil';
            if (passwordStrength.score < 4) return 'Moderada';
            return 'Fuerte';
        };

        return (
            <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                    <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                            className={`h-full ${getColor()} transition-all duration-300`}
                            style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                        ></div>
                    </div>
                    <span className="ml-2 text-xs text-gray-400">
                        {formData.contrasenya ? getLabel() : ''}
                    </span>
                </div>

                {formData.contrasenya && (
                    <div className="text-xs text-gray-400 mt-1">
                        <div className="grid grid-cols-2 gap-1">
                            <div className="flex items-center">
                                {passwordStrength.hasMinLength ? (
                                    <FaCheck className="text-green-500 mr-1" />
                                ) : (
                                    <FaTimes className="text-red-500 mr-1" />
                                )}
                                <span>Al menos 8 caracteres</span>
                            </div>
                            <div className="flex items-center">
                                {passwordStrength.hasUppercase ? (
                                    <FaCheck className="text-green-500 mr-1" />
                                ) : (
                                    <FaTimes className="text-red-500 mr-1" />
                                )}
                                <span>Mayúsculas</span>
                            </div>
                            <div className="flex items-center">
                                {passwordStrength.hasLowercase ? (
                                    <FaCheck className="text-green-500 mr-1" />
                                ) : (
                                    <FaTimes className="text-red-500 mr-1" />
                                )}
                                <span>Minúsculas</span>
                            </div>
                            <div className="flex items-center">
                                {passwordStrength.hasNumber ? (
                                    <FaCheck className="text-green-500 mr-1" />
                                ) : (
                                    <FaTimes className="text-red-500 mr-1" />
                                )}
                                <span>Números</span>
                            </div>
                            <div className="flex items-center">
                                {passwordStrength.hasSpecial ? (
                                    <FaCheck className="text-green-500 mr-1" />
                                ) : (
                                    <FaTimes className="text-red-500 mr-1" />
                                )}
                                <span>Caracteres especiales</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-aniverse-purple to-aniverse-pink">
            <div className="w-full max-w-lg px-6 py-8 bg-gray-900 rounded-lg shadow-xl">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white">Crear Cuenta</h1>
                    <p className="text-gray-400 mt-2">Únete a Aniverse y descubre el mundo del anime</p>
                </div>

                {/* Error general del formulario */}
                {errors.form && (
                    <div className="mb-6 p-4 rounded-md bg-red-500/20 border border-red-500 text-red-300">
                        {errors.form}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Campo de Nombre */}
                    <div>
                        <label htmlFor="nombre" className="block text-sm font-medium text-gray-300 mb-1">
                            Nombre de usuario
                        </label>
                        <input
                            id="nombre"
                            name="nombre"
                            type="text"
                            value={formData.nombre}
                            onChange={handleChange}
                            className={`w-full p-3 rounded-md bg-gray-800 border ${
                                errors.nombre ? 'border-red-500' : 'border-gray-700'
                            } text-white focus:outline-none focus:border-aniverse-cyan focus:ring-1 focus:ring-aniverse-cyan`}
                            placeholder="Tu nombre de usuario"
                            disabled={loading}
                        />
                        {errors.nombre && (
                            <p className="mt-1 text-sm text-red-400">{errors.nombre}</p>
                        )}
                    </div>

                    {/* Campo de Email */}
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                            Email
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            className={`w-full p-3 rounded-md bg-gray-800 border ${
                                errors.email ? 'border-red-500' : 'border-gray-700'
                            } text-white focus:outline-none focus:border-aniverse-cyan focus:ring-1 focus:ring-aniverse-cyan`}
                            placeholder="tu@email.com"
                            disabled={loading}
                            autoComplete="email"
                        />
                        {errors.email && (
                            <p className="mt-1 text-sm text-red-400">{errors.email}</p>
                        )}
                    </div>

                    {/* Campo de Contraseña */}
                    <div>
                        <label htmlFor="contrasenya" className="block text-sm font-medium text-gray-300 mb-1">
                            Contraseña
                        </label>
                        <div className="relative">
                            <input
                                id="contrasenya"
                                name="contrasenya"
                                type={showPassword ? 'text' : 'password'}
                                value={formData.contrasenya}
                                onChange={handleChange}
                                className={`w-full p-3 rounded-md bg-gray-800 border ${
                                    errors.contrasenya ? 'border-red-500' : 'border-gray-700'
                                } text-white focus:outline-none focus:border-aniverse-cyan focus:ring-1 focus:ring-aniverse-cyan`}
                                placeholder="••••••••"
                                disabled={loading}
                                autoComplete="new-password"
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>

                        {/* Indicador de fortaleza de contraseña */}
                        {formData.contrasenya && <PasswordStrengthIndicator />}

                        {errors.contrasenya && (
                            <p className="mt-1 text-sm text-red-400">{errors.contrasenya}</p>
                        )}
                    </div>

                    {/* Campo de Confirmación de Contraseña */}
                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">
                            Confirmar Contraseña
                        </label>
                        <div className="relative">
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type={showPassword ? 'text' : 'password'}
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className={`w-full p-3 rounded-md bg-gray-800 border ${
                                    errors.confirmPassword ? 'border-red-500' : 'border-gray-700'
                                } text-white focus:outline-none focus:border-aniverse-cyan focus:ring-1 focus:ring-aniverse-cyan`}
                                placeholder="••••••••"
                                disabled={loading}
                                autoComplete="new-password"
                            />
                        </div>
                        {errors.confirmPassword && (
                            <p className="mt-1 text-sm text-red-400">{errors.confirmPassword}</p>
                        )}
                    </div>

                    {/* Botón de Registro */}
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
                                Registrando...
                            </div>
                        ) : (
                            'Crear Cuenta'
                        )}
                    </button>

                    {/* Enlace a Login */}
                    <div className="text-center mt-4">
                        <p className="text-gray-400">
                            ¿Ya tienes una cuenta?{' '}
                            <Link to="/login" className="text-aniverse-cyan hover:text-aniverse-cyan-light font-medium">
                                Inicia sesión
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};