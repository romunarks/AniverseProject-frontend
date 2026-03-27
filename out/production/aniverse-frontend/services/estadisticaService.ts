// src/services/estadisticaService.ts
import api from '../api';
import { AniverseResponse, Anime } from '../types';
import { AxiosError } from 'axios';

/**
 * Interfaces específicas para estadísticas
 */
export interface EstadisticasGenerales {
    totalAnimes: number;
    totalUsuarios: number;
    totalResenyas: number;
    totalFavoritos: number;
    promedioPuntuacion: number;
}

export interface EstadisticasAnime {
    animeId: number;
    titulo: string;
    totalFavoritos: number;
    totalResenyas: number;
    promedioPuntuacion: number;
    imagenUrl?: string;
}

export interface GeneroEstadistica {
    genero: string;
    count: number;
    porcentaje: number;
}

/**
 * Servicio para gestionar estadísticas y rankings de animes
 * Sigue el patrón arquitectónico de AniverseResponse del proyecto
 */
export const estadisticaService = {
    /**
     * Obtener animes mejor puntuados
     * @param limit Número de animes a obtener (por defecto 10)
     * @returns Promise con lista de animes mejor puntuados
     */
    getTopRatedAnimes: async (limit: number = 10): Promise<Anime[]> => {
        try {
            const response = await api.get<AniverseResponse<Anime[]>>(
                `/estadisticas/top-rated?limit=${limit}`
            );

            if (response.data?.success) {
                // Procesar y validar cada anime
                return response.data.data.map((anime: Partial<Anime>) => ({
                    id: anime.id ?? null,
                    jikanId: anime.jikanId ?? null,
                    titulo: anime.titulo ?? "Sin título",
                    descripcion: anime.descripcion ?? "",
                    genero: anime.genero ?? "",
                    imagenUrl: anime.imagenUrl ?? "",
                    puntuacionPromedio: anime.puntuacionPromedio ?? 0,
                    anyo: anime.anyo ?? 0,
                    temporada: anime.temporada ?? ""
                }));
            }

            throw new Error(response.data?.message || 'Error al obtener animes mejor puntuados');
        } catch (error) {
            handleServiceError('Error en getTopRatedAnimes:', error);

            // Fallback: Si el endpoint no existe, usar endpoint de animes y ordenar por puntuación
            try {
                console.warn('Endpoint de estadísticas no disponible, usando fallback...');
                const fallbackResponse = await api.get<AniverseResponse<{
                    content: Anime[];
                }>>(`/animes?page=0&size=${limit}&sortBy=puntuacionPromedio&direction=desc`);

                if (fallbackResponse.data?.success) {
                    return fallbackResponse.data.data.content || [];
                }
            } catch (fallbackError) {
                console.error('Fallback también falló:', fallbackError);
            }

            return [];
        }
    },

    /**
     * Obtener animes más populares (por favoritos)
     * @param limit Número de animes a obtener
     * @returns Promise con lista de animes más populares
     */
    getMostPopularAnimes: async (limit: number = 10): Promise<Anime[]> => {
        try {
            const response = await api.get<AniverseResponse<Anime[]>>(
                `/estadisticas/most-popular?limit=${limit}`
            );

            if (response.data?.success) {
                return response.data.data.map((anime: Partial<Anime>) => ({
                    id: anime.id ?? null,
                    jikanId: anime.jikanId ?? null,
                    titulo: anime.titulo ?? "Sin título",
                    descripcion: anime.descripcion ?? "",
                    genero: anime.genero ?? "",
                    imagenUrl: anime.imagenUrl ?? "",
                    puntuacionPromedio: anime.puntuacionPromedio ?? 0,
                    anyo: anime.anyo ?? 0,
                    temporada: anime.temporada ?? ""
                }));
            }

            return [];
        } catch (error) {
            handleServiceError('Error en getMostPopularAnimes:', error);
            return [];
        }
    },

    /**
     * Obtener estadísticas generales del sistema
     * @returns Promise con estadísticas generales
     */
    getEstadisticasGenerales: async (): Promise<EstadisticasGenerales | null> => {
        try {
            const response = await api.get<AniverseResponse<EstadisticasGenerales>>(
                '/estadisticas/generales'
            );

            if (response.data?.success) {
                return response.data.data;
            }

            return null;
        } catch (error) {
            handleServiceError('Error en getEstadisticasGenerales:', error);
            return null;
        }
    },

    /**
     * Obtener estadísticas por género
     * @param limit Número de géneros a obtener
     * @returns Promise con estadísticas de géneros
     */
    getEstadisticasPorGenero: async (limit: number = 10): Promise<GeneroEstadistica[]> => {
        try {
            const response = await api.get<AniverseResponse<GeneroEstadistica[]>>(
                `/estadisticas/generos?limit=${limit}`
            );

            if (response.data?.success) {
                return response.data.data;
            }

            return [];
        } catch (error) {
            handleServiceError('Error en getEstadisticasPorGenero:', error);
            return [];
        }
    },

    /**
     * Obtener animes trending (con algoritmo de tendencias)
     * @param limit Número de animes a obtener
     * @returns Promise con animes trending
     */
    getTrendingAnimes: async (limit: number = 10): Promise<Anime[]> => {
        try {
            const response = await api.get<AniverseResponse<Anime[]>>(
                `/estadisticas/trending?limit=${limit}`
            );

            if (response.data?.success) {
                return response.data.data.map((anime: Partial<Anime>) => ({
                    id: anime.id ?? null,
                    jikanId: anime.jikanId ?? null,
                    titulo: anime.titulo ?? "Sin título",
                    descripcion: anime.descripcion ?? "",
                    genero: anime.genero ?? "",
                    imagenUrl: anime.imagenUrl ?? "",
                    puntuacionPromedio: anime.puntuacionPromedio ?? 0,
                    anyo: anime.anyo ?? 0,
                    temporada: anime.temporada ?? ""
                }));
            }

            throw new Error(response.data?.message || 'Error al obtener trending animes');
        } catch (error) {
            handleServiceError('Error en getTrendingAnimes:', error);

            // Fallback: usar el método existente del animeService
            try {
                console.warn('Endpoint de trending estadísticas no disponible, usando fallback...');
                const fallbackResponse = await api.get<AniverseResponse<Anime[]>>(
                    `/animes/trending?limit=${limit}`
                );

                if (fallbackResponse.data?.success) {
                    return fallbackResponse.data.data || [];
                }
            } catch (fallbackError) {
                console.error('Fallback trending también falló:', fallbackError);
            }

            return [];
        }
    },

    /**
     * Obtener ranking de animes por diversos criterios
     * @param criteria Criterio de ranking ('rating', 'popularity', 'recent', 'favorites')
     * @param limit Número de animes a obtener
     * @returns Promise con ranking de animes
     */
    getRankingAnimes: async (
        criteria: 'rating' | 'popularity' | 'recent' | 'favorites',
        limit: number = 10
    ): Promise<Anime[]> => {
        try {
            const response = await api.get<AniverseResponse<Anime[]>>(
                `/estadisticas/ranking/${criteria}?limit=${limit}`
            );

            if (response.data?.success) {
                return response.data.data.map((anime: Partial<Anime>) => ({
                    id: anime.id ?? null,
                    jikanId: anime.jikanId ?? null,
                    titulo: anime.titulo ?? "Sin título",
                    descripcion: anime.descripcion ?? "",
                    genero: anime.genero ?? "",
                    imagenUrl: anime.imagenUrl ?? "",
                    puntuacionPromedio: anime.puntuacionPromedio ?? 0,
                    anyo: anime.anyo ?? 0,
                    temporada: anime.temporada ?? ""
                }));
            }

            return [];
        } catch (error) {
            handleServiceError(`Error en getRankingAnimes(${criteria}):`, error);
            return [];
        }
    },

    /**
     * Obtener estadísticas de un anime específico
     * @param animeId ID del anime
     * @returns Promise con estadísticas del anime
     */
    getEstadisticasAnime: async (animeId: number): Promise<EstadisticasAnime | null> => {
        try {
            if (!animeId || animeId <= 0) {
                throw new Error("ID de anime inválido");
            }

            const response = await api.get<AniverseResponse<EstadisticasAnime>>(
                `/estadisticas/anime/${animeId}`
            );

            if (response.data?.success) {
                return response.data.data;
            }

            return null;
        } catch (error) {
            handleServiceError(`Error en getEstadisticasAnime(${animeId}):`, error);
            return null;
        }
    }
};

/**
 * Funciones auxiliares para manejo de errores
 * Siguiendo el patrón del proyecto
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