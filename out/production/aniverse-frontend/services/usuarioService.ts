// src/services/usuarioService.ts - Versión completa
import api from '../api';
import { AniverseResponse, Usuario, UserStats } from '../types';
import { AxiosError } from 'axios';

/**
 * Interfaz para las estadísticas detalladas del usuario
 */
export interface UsuarioStatsDTO {
    usuarioId: number;
    nombreUsuario: string;
    totalFavoritos: number;
    totalResenyas: number;
    totalVotaciones: number;
    promedioPuntuacion: number;
    animesFavoritos: string[];
    generosFavoritos: GeneroFavoritoDTO[];
}

export interface GeneroFavoritoDTO {
    genero: string;
    count: number;
}

/**
 * Interfaz para editar perfil
 */
export interface EditableProfile {
    nombre: string;
    email: string;
}

/**
 * Interfaz para cambio de contraseña
 */
export interface PasswordChangeDTO {
    oldPassword: string;
    newPassword: string;
    confirmPassword: string;
}

/**
 * Servicio para gestión de usuarios y perfiles
 */
export const usuarioService = {
    /**
     * Obtener usuario por ID
     * @param usuarioId ID del usuario
     * @returns Promise con los datos del usuario
     */
    getUsuarioById: async (usuarioId: number): Promise<Usuario> => {
        try {
            const response = await api.get<AniverseResponse<Usuario>>(`/usuarios/${usuarioId}`);

            if (response.data.success) {
                return response.data.data;
            }

            throw new Error(response.data.message || 'Error al obtener usuario');
        } catch (error) {
            handleServiceError('Error al obtener usuario:', error);
            throw getErrorMessage(error);
        }
    },

    /**
     * Obtener estadísticas de usuario
     * @param usuarioId ID del usuario
     * @returns Promise con las estadísticas del usuario
     */
    getUserStats: async (usuarioId: number): Promise<UserStats> => {
        try {
            const response = await api.get<AniverseResponse<UsuarioStatsDTO>>(`/usuarios/${usuarioId}/stats`);

            if (response.data.success) {
                const stats = response.data.data;

                // Convertir UsuarioStatsDTO a UserStats
                return {
                    favoritosCount: stats.totalFavoritos,
                    resenyasCount: stats.totalResenyas,
                    votacionesCount: stats.totalVotaciones,
                    promedioPuntuacion: stats.promedioPuntuacion,
                    animesFavoritos: stats.animesFavoritos,
                    generosFavoritos: stats.generosFavoritos
                };
            }

            throw new Error(response.data.message || 'Error al obtener estadísticas');
        } catch (error) {
            handleServiceError('Error al obtener estadísticas:', error);
            throw getErrorMessage(error);
        }
    },

    /**
     * Actualizar perfil de usuario
     * @param usuarioId ID del usuario
     * @param profileData Datos actualizados del perfil
     * @returns Promise con el usuario actualizado
     */
    updateProfile: async (usuarioId: number, profileData: EditableProfile): Promise<Usuario> => {
        try {
            const response = await api.put<AniverseResponse<Usuario>>(`/usuarios/${usuarioId}`, profileData);

            if (response.data.success) {
                return response.data.data;
            }

            throw new Error(response.data.message || 'Error al actualizar perfil');
        } catch (error) {
            handleServiceError('Error al actualizar perfil:', error);
            throw getErrorMessage(error);
        }
    },

    /**
     * Cambiar contraseña
     * @param usuarioId ID del usuario
     * @param passwordData Datos de cambio de contraseña
     * @returns Promise con mensaje de confirmación
     */
    changePassword: async (usuarioId: number, passwordData: PasswordChangeDTO): Promise<string> => {
        try {
            // Validar que las contraseñas coincidan
            if (passwordData.newPassword !== passwordData.confirmPassword) {
                throw new Error('Las contraseñas nuevas no coinciden');
            }

            const payload = {
                oldPassword: passwordData.oldPassword,
                newPassword: passwordData.newPassword
            };

            const response = await api.patch<AniverseResponse<string>>(`/usuarios/${usuarioId}/contrasenya`, payload);

            if (response.data.success) {
                return response.data.data || 'Contraseña actualizada correctamente';
            }

            throw new Error(response.data.message || 'Error al cambiar contraseña');
        } catch (error) {
            handleServiceError('Error al cambiar contraseña:', error);
            throw getErrorMessage(error);
        }
    },

    /**
     * Obtener perfil del usuario actual
     * @returns Promise con los datos del usuario actual
     */
    getCurrentUserProfile: async (): Promise<Usuario> => {
        try {
            const response = await api.get<AniverseResponse<Usuario>>('/usuarios/me');

            if (response.data.success) {
                return response.data.data;
            }

            throw new Error(response.data.message || 'Error al obtener perfil actual');
        } catch (error) {
            handleServiceError('Error al obtener perfil actual:', error);
            throw getErrorMessage(error);
        }
    },

    /**
     * Buscar usuarios
     * @param query Término de búsqueda
     * @param page Número de página
     * @param size Tamaño de página
     * @returns Promise con usuarios encontrados
     */
    searchUsuarios: async (query: string, page: number = 0, size: number = 10): Promise<Usuario[]> => {
        try {
            const response = await api.get<AniverseResponse<{ content: Usuario[] }>>(
                `/usuarios/search?q=${encodeURIComponent(query)}&page=${page}&size=${size}`
            );

            if (response.data.success) {
                return response.data.data.content;
            }

            throw new Error(response.data.message || 'Error al buscar usuarios');
        } catch (error) {
            handleServiceError('Error al buscar usuarios:', error);
            return [];
        }
    },

    /**
     * Obtener actividad reciente de un usuario
     * @param usuarioId ID del usuario
     * @param page Número de página
     * @param size Tamaño de página
     * @returns Promise con actividades recientes
     */
    getUserActivity: async (usuarioId: number, page: number = 0, size: number = 10): Promise<any[]> => {
        try {
            const response = await api.get<AniverseResponse<{ content: any[] }>>(
                `/usuarios/${usuarioId}/activity?page=${page}&size=${size}`
            );

            if (response.data.success) {
                return response.data.data.content;
            }

            return [];
        } catch (error) {
            handleServiceError('Error al obtener actividad del usuario:', error);
            return [];
        }
    },

    /**
     * Verificar si existe un usuario con el email especificado
     * @param email Email a verificar
     * @returns Promise con booleano indicando si existe
     */
    checkEmailExists: async (email: string): Promise<boolean> => {
        try {
            const response = await api.get<AniverseResponse<{ exists: boolean }>>(
                `/usuarios/check-email?email=${encodeURIComponent(email)}`
            );

            if (response.data.success) {
                return response.data.data.exists;
            }

            return false;
        } catch (error) {
            handleServiceError('Error al verificar email:', error);
            return false;
        }
    },

    /**
     * Obtener usuarios seguidos
     * @param usuarioId ID del usuario
     * @param page Número de página
     * @param size Tamaño de página
     * @returns Promise con usuarios seguidos
     */
    getFollowing: async (usuarioId: number, page: number = 0, size: number = 10): Promise<Usuario[]> => {
        try {
            const response = await api.get<AniverseResponse<{ content: Usuario[] }>>(
                `/usuarios/${usuarioId}/following?page=${page}&size=${size}`
            );

            if (response.data.success) {
                return response.data.data.content;
            }

            return [];
        } catch (error) {
            handleServiceError('Error al obtener usuarios seguidos:', error);
            return [];
        }
    },

    /**
     * Obtener seguidores
     * @param usuarioId ID del usuario
     * @param page Número de página
     * @param size Tamaño de página
     * @returns Promise con seguidores
     */
    getFollowers: async (usuarioId: number, page: number = 0, size: number = 10): Promise<Usuario[]> => {
        try {
            const response = await api.get<AniverseResponse<{ content: Usuario[] }>>(
                `/usuarios/${usuarioId}/followers?page=${page}&size=${size}`
            );

            if (response.data.success) {
                return response.data.data.content;
            }

            return [];
        } catch (error) {
            handleServiceError('Error al obtener seguidores:', error);
            return [];
        }
    }
};

/**
 * Función auxiliar para manejar errores del servicio
 */
function handleServiceError(context: string, error: unknown): void {
    if (isAxiosError(error)) {
        console.error(context, error.message, 'Status:', error.response?.status, 'Data:', error.response?.data);
    } else if (error instanceof Error) {
        console.error(context, error.message);
    } else {
        console.error(context, error);
    }
}

/**
 * Verifica si un error es una instancia de AxiosError
 */
function isAxiosError(error: unknown): error is AxiosError {
    return (typeof error === 'object' &&
        error !== null &&
        'isAxiosError' in error && (error as AxiosError).isAxiosError);
}

/**
 * Extrae un mensaje de error amigable
 */
function getErrorMessage(error: unknown): Error {
    if (isAxiosError(error)) {
        const responseData = error.response?.data as AniverseResponse<unknown>;
        return new Error(responseData?.message || `Error de API: ${error.response?.status}`);
    }

    if (error instanceof Error) {
        return error;
    }

    return new Error('Error desconocido');
}