// src/services/votacionService.ts
import api from '../api';
import { AniverseResponse, Votacion } from '../types';
import { AxiosError } from 'axios';

/**
 * Interfaz para crear una nueva votación
 */
export interface VotacionCreateDTO {
    animeId?: number;
    jikanId?: number;
    puntuacion: number;
}

/**
 * Interfaz para respuesta de votación
 */
export interface VotacionResponseDTO {
    id: number;
    usuarioId: number;
    usuarioNombre: string;
    animeId: number;
    animeTitulo: string;
    puntuacion: number;
}


// Obtener votación del usuario por JikanId
export const getVotacionUsuarioAnimeByJikanId = async (userId: number, jikanId: number): Promise<any> => {
    try {
        const response = await api.get(`/votaciones/usuario/${userId}/jikan/${jikanId}`);
        return response.data.success ? response.data.data : null;
    } catch (error) {
        console.error('Error getting user rating by JikanId:', error);
        return null;
    }
};

/**
 * Servicio para gestionar votaciones/calificaciones
 */
export const votacionService = {
    /**
     * Crear una nueva votación para un anime
     * @returns Promise con la votación creada
     * @param payload
     */
    createVotacion: async (payload: any): Promise<any> => {
        try {
            const response = await api.post('/votaciones', payload);
            return response.data;
        } catch (error) {
            console.error('Error creating rating:', error);
            throw error;
        }
    },

// AGREGAR también este método:
    getUserVotacion: async (jikanId: number) => {
        try {
            const response = await api.get(`/votaciones/user/${jikanId}`);
            return response.data;
        } catch (error) {
            console.error('Error getting user rating:', error);
            return { data: { hasVoted: false, rating: 0 } };
        }
    },

    /**
     * Obtener votaciones de un usuario
     * @param usuarioId ID del usuario
     * @param page Número de página
     * @param size Tamaño de página
     * @returns Promise con las votaciones del usuario
     */
    getVotacionesByUsuario: async (usuarioId: number, page: number = 0, size: number = 10): Promise<VotacionResponseDTO[]> => {
        try {
            const response = await api.get<AniverseResponse<VotacionResponseDTO[]>>(
                `/votaciones/usuario/${usuarioId}?page=${page}&size=${size}`
            );

            if (response.data.success) {
                return response.data.data;
            }

            throw new Error(response.data.message || 'Error al obtener votaciones del usuario');
        } catch (error) {
            handleServiceError('Error al obtener votaciones del usuario:', error);
            return [];
        }
    },

    /**
     * Obtener votación específica de un usuario para un anime
     * @param usuarioId ID del usuario
     * @param animeId ID del anime
     * @returns Promise con la votación o null si no existe
     */
    getVotacionUsuarioAnime: async (usuarioId: number, animeId: number): Promise<VotacionResponseDTO | null> => {
        try {
            const response = await api.get<AniverseResponse<VotacionResponseDTO>>(
                `/votaciones/usuario/${usuarioId}/anime/${animeId}`
            );

            if (response.data.success) {
                return response.data.data;
            }

            return null;
        } catch (error) {
            if (isAxiosError(error) && error.response?.status === 404) {
                return null;
            }
            handleServiceError('Error al obtener votación específica:', error);
            return null;
        }
    },

    /**
     * Obtener conteo de votaciones para un anime
     * @param animeId ID del anime
     * @returns Promise con el conteo de votaciones
     */
    getVotacionesCount: async (animeId: number): Promise<number> => {
        try {
            const response = await api.get<AniverseResponse<{ count: number }>>(`/votaciones/count/${animeId}`);

            if (response.data.success) {
                return response.data.data.count;
            }

            return 0;
        } catch (error) {
            handleServiceError('Error al obtener conteo de votaciones:', error);
            return 0;
        }
    },

    /**
     * Eliminar una votación
     * @param votacionId ID de la votación
     * @returns Promise con mensaje de confirmación
     */
    deleteVotacion: async (votacionId: number): Promise<string> => {
        try {
            const response = await api.delete<AniverseResponse<string>>(`/votaciones/${votacionId}`);

            if (response.data.success) {
                return response.data.data || 'Votación eliminada correctamente';
            }

            throw new Error(response.data.message || 'Error al eliminar votación');
        } catch (error) {
            handleServiceError('Error al eliminar votación:', error);
            throw getErrorMessage(error);
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