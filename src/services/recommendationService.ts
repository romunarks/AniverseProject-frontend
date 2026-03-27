// src/services/recommendationService.ts
import api from '../api';
import { AniverseResponse, Anime } from '../types';
import { AxiosError } from 'axios';

/**
 * Servicio para gestionar recomendaciones de animes
 */
export const recommendationService = {
    /**
     * Obtener recomendaciones personalizadas para un usuario
     */
    getPersonalizedRecommendations: async (usuarioId: number, limit: number = 10): Promise<Anime[]> => {
        try {
            const response = await api.get<AniverseResponse<Anime[]>>(
                `/recomendaciones/usuario/${usuarioId}?limit=${limit}`
            );

            if (response.data?.success) {
                return response.data.data || [];
            }

            throw new Error(response.data?.message || 'Error al obtener recomendaciones');
        } catch (error) {
            handleServiceError('Error en getPersonalizedRecommendations:', error);
            return [];
        }
    },

    /**
     * Obtener recomendaciones avanzadas (con ML)
     */
    getAdvancedRecommendations: async (usuarioId: number, limit: number = 10): Promise<Anime[]> => {
        try {
            const response = await api.get<AniverseResponse<Anime[]>>(
                `/recomendaciones/avanzadas/usuario/${usuarioId}?limit=${limit}`
            );

            if (response.data?.success) {
                return response.data.data || [];
            }

            throw new Error(response.data?.message || 'Error al obtener recomendaciones avanzadas');
        } catch (error) {
            handleServiceError('Error en getAdvancedRecommendations:', error);
            // Fallback a recomendaciones básicas
            return recommendationService.getPersonalizedRecommendations(usuarioId, limit);
        }
    },

    /**
     * Obtener animes similares a uno específico
     */
    getSimilarAnimes: async (animeId: number, limit: number = 5): Promise<Anime[]> => {
        try {
            const response = await api.get<AniverseResponse<Anime[]>>(
                `/recomendaciones/similares/${animeId}?limit=${limit}`
            );

            if (response.data?.success) {
                return response.data.data || [];
            }

            throw new Error(response.data?.message || 'Error al obtener animes similares');
        } catch (error) {
            handleServiceError('Error en getSimilarAnimes:', error);
            return [];
        }
    },

    /**
     * Obtener animes mejor puntuados por género
     */
    getTopRatedByGenre: async (genero: string, limit: number = 10): Promise<Anime[]> => {
        try {
            const response = await api.get<AniverseResponse<Anime[]>>(
                `/recomendaciones/genero/${encodeURIComponent(genero)}?limit=${limit}`
            );

            if (response.data?.success) {
                return response.data.data || [];
            }

            throw new Error(response.data?.message || 'Error al obtener animes por género');
        } catch (error) {
            handleServiceError('Error en getTopRatedByGenre:', error);
            return [];
        }
    },

    /**
     * Obtener información de debug de preferencias del usuario
     */
    getUserPreferencesDebug: async (usuarioId: number): Promise<any> => {
        try {
            const response = await api.get<AniverseResponse<any>>(
                `/recomendaciones/debug/usuario/${usuarioId}`
            );

            if (response.data?.success) {
                return response.data.data || null;
            }

            return null;
        } catch (error) {
            handleServiceError('Error en getUserPreferencesDebug:', error);
            return null;
        }
    }
};

/**
 * Funciones auxiliares para manejo de errores
 */
function handleServiceError(context: string, error: unknown): void {
    if (isAxiosError(error)) {
        console.error(
            context,
            error.message,
            'Status:', error.response?.status,
            'Data:', error.response?.data
        );
    } else if (error instanceof Error) {
        console.error(context, error.message);
    } else {
        console.error(context, error);
    }
}

function isAxiosError(error: unknown): error is AxiosError {
    return (typeof error === 'object' &&
        error !== null &&
        'isAxiosError' in error && (error as AxiosError).isAxiosError);
}