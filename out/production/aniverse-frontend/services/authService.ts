// src/services/authService.ts
import api from '../api';
import axios, { AxiosResponse } from 'axios';
import { Usuario } from '../types';

// Interfaces para request/response
export interface LoginRequest {
    email: string;
    contrasenya: string;
}

export interface LoginResponse {
    token: string;
    refreshToken: string;
    user: Usuario;
}

export interface RegisterRequest {
    nombre: string;
    email: string;
    contrasenya: string;
}

// Interfaz para respuestas de la API
export interface AniverseResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

// Servicio de autenticación
export const authService = {
    /**
     * Inicia sesión con las credenciales proporcionadas
     */
    login: async (credentials: LoginRequest): Promise<AniverseResponse<LoginResponse>> => {
        try {
            // Validar datos básicos antes de enviar
            if (!credentials.email || !credentials.contrasenya) {
                throw new Error('Email y contraseña son requeridos');
            }

            // Validar formato de email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(credentials.email)) {
                throw new Error('Formato de email inválido');
            }

            // Corrección: Especificar correctamente el tipo de la respuesta
            const response: AxiosResponse<AniverseResponse<LoginResponse>> =
                await api.post('/login', credentials);

            // Asegurar que la respuesta tiene la estructura esperada
            if (!response.data) {
                throw new Error('Respuesta inválida del servidor');
            }

            // Si es exitoso, almacenar datos
            if (response.data.success && response.data.data) {
                const { token, refreshToken, user } = response.data.data;

                if (token && refreshToken && user) {
                    localStorage.setItem('token', token);
                    localStorage.setItem('refreshToken', refreshToken);
                    localStorage.setItem('user', JSON.stringify(user));

                    // Configurar para futuras peticiones
                    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                }
            }

            // Retornar explícitamente el tipo correcto
            return response.data;
        } catch (error) {
            if (error instanceof Error) {
                // Error propio de validación
                throw error;
            }

            // Error de la API o de red
            throw new Error('Error al iniciar sesión. Por favor, intente de nuevo más tarde.');
        }
    },

    /**
     * Registra un nuevo usuario
     */
    register: async (userData: RegisterRequest): Promise<AniverseResponse<Usuario>> => {
        try {
            // Validar datos básicos
            if (!userData.nombre || !userData.email || !userData.contrasenya) {
                throw new Error('Todos los campos son requeridos');
            }

            // Validar formato de email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(userData.email)) {
                throw new Error('Formato de email inválido');
            }

            // Validar longitud de contraseña
            if (userData.contrasenya.length < 6) {
                throw new Error('La contraseña debe tener al menos 6 caracteres');
            }

            // Corrección: Especificar correctamente el tipo de la respuesta
            const response: AxiosResponse<AniverseResponse<Usuario>> =
                await api.post('/register', userData);

            if (!response.data) {
                throw new Error('Respuesta inválida del servidor');
            }

            // Retornar explícitamente el tipo correcto
            return response.data;
        } catch (error) {
            if (error instanceof Error) {
                // Error propio de validación
                throw error;
            }

            // Error de la API o de red
            throw new Error('Error al registrar usuario. Por favor, intente de nuevo más tarde.');
        }
    },

    // Resto del código sin cambios...
    logout: async (): Promise<void> => {
        try {
            const refreshToken = localStorage.getItem('refreshToken');

            if (refreshToken) {
                await api.post('/logout', { refreshToken });
            }
        } catch (error) {
            console.error('Error durante logout:', error);
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            delete api.defaults.headers.common['Authorization'];
        }
    },

    getCurrentUser: (): Usuario | null => {
        try {
            const userStr = localStorage.getItem('user');
            if (!userStr) return null;

            const user = JSON.parse(userStr) as Usuario;
            if (!user || !user.id || !user.email) {
                localStorage.removeItem('user');
                return null;
            }

            return user;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            localStorage.removeItem('user');
            return null;
        }
    },

    isAuthenticated: (): boolean => {
        return !!localStorage.getItem('token');
    },

    updateUserData: (userData: Partial<Usuario>): void => {
        try {
            const userStr = localStorage.getItem('user');
            if (!userStr) return;

            const currentUser = JSON.parse(userStr) as Usuario;
            const updatedUser = { ...currentUser, ...userData };

            localStorage.setItem('user', JSON.stringify(updatedUser));
        } catch (error) {
            console.error('Error updating user data:', error);
        }
    }
};