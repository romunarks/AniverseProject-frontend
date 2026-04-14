// src/services/votacionService.ts
import api from '../api';
import { AniverseResponse } from '../types'; // ✅ Se eliminó 'Votacion' que no se usaba
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

/**
 * Servicio para gestionar votaciones/calificaciones
 */
export const votacionService = {

    /**
     * Obtener votación del usuario por JikanId
     * ✅ Se cambió 'any' por 'VotacionResponseDTO | null'
     */
    getVotacionUsuarioAnimeByJikanId: async (userId: number, jikanId: number): Promise<VotacionResponseDTO | null> => {
        try {
            const response = await api.get<AniverseResponse<VotacionResponseDTO>>(`/votaciones/usuario/${userId}/jikan/${jikanId}`);
            return response.data.success ? response.data.data : null;
        } catch (error) {
            handleServiceError('Error getting user rating by JikanId:', error);
            return null;
        }
    },

    /**
     * Crear una nueva votación para un anime (UPSERT)
     * ✅ Se usó 'VotacionCreateDTO' y 'VotacionResponseDTO' en lugar de 'any'
     * ✅ Se limpió el throw atrapado localmente
     */
    createVotacion: async (payload: VotacionCreateDTO): Promise<VotacionResponseDTO> => {
        try {
            const response = await api.post<AniverseResponse<VotacionResponseDTO>>('/votaciones', payload);
            if (response.data.success) {
                return response.data.data;
            }
            throw new Error(response.data.message || 'Error al guardar la votación');
        } catch (error) {
            handleServiceError('Error creating rating:', error);
            throw getErrorMessage(error);
        }
    },

    /**
     * ✅ Se definió el tipo de retorno para evitar 'any'
     */
    getUserVotacion: async (jikanId: number): Promise<{ data: { hasVoted: boolean; rating: number } }> => {
        try {
            const response = await api.get(`/votaciones/user/${jikanId}`);
            return response.data;
        } catch (error) {
            handleServiceError('Error getting user rating:', error);
            return { data: { hasVoted: false, rating: 0 } };
        }
    },

    /**
     * Obtener votaciones de un usuario
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
     * ✅ Se limpió el throw atrapado localmente
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