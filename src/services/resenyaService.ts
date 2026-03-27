// src/services/resenyaService.ts
import api from '../api';
import { AniverseResponse, Resenya, Anime } from '../types';
import { AxiosError } from 'axios';

/**
 * Interfaces específicas para el sistema de reseñas
 */
export interface ResenyaCrear {
    animeId?: number;
    jikanId?: number;
    contenido: string;
    puntuacion: number; // 1-10
}

export interface ResenyaActualizar {
    contenido?: string;
    puntuacion?: number;
}

export interface ResenyaDetalle {
    id: number;
    usuario: {
        id: number;
        nombre: string;
        email: string;
    };
    anime: {
        id: number;
        jikanId?: number;
        titulo: string;
        imagenUrl?: string;
    };
    contenido: string;
    puntuacion: number;
    fechaCreacion: string;
    fechaActualizacion?: string;
    eliminado: boolean;
}

export interface PuedeResenarResponse {
    puedeResenar: boolean;
    mensaje: string;
    yaReseno?: boolean;
    resenyaExistente?: Resenya;
}

export interface AnimeFavoritoParaResenar {
    id: number;
    jikanId?: number;
    titulo: string;
    imagenUrl?: string;
    yaReseno: boolean;
    resenyaId?: number;
}

export interface PaginatedResenyas {
    content: Resenya[];
    totalPages: number;
    totalElements: number;
    size: number;
    number: number;
    first: boolean;
    last: boolean;
}

export interface EstadisticasResenyas {
    totalResenyas: number;
    puntuacionPromedio: number;
    distribucionPuntuaciones: { puntuacion: number; count: number }[];
    resenyasRecientes: Resenya[];
}

/**
 * Servicio para gestionar todas las operaciones relacionadas con reseñas
 * Implementa validación: solo se puede reseñar animes que estén en favoritos
 */
export const resenyaService = {
    /**
     * Crear nueva reseña
     * El backend valida que el anime esté en favoritos del usuario
     * @param resenyaData Datos de la reseña
     * @returns Promise con la reseña creada
     */
    crearResenya: async (resenyaData: ResenyaCrear): Promise<Resenya> => {
        try {
            // Validaciones frontales
            if (!resenyaData.contenido || resenyaData.contenido.trim().length === 0) {
                throw new Error("El contenido de la reseña es obligatorio");
            }

            if (!resenyaData.puntuacion || resenyaData.puntuacion < 1 || resenyaData.puntuacion > 10) {
                throw new Error("La puntuación debe estar entre 1 y 10");
            }

            if (!resenyaData.animeId && !resenyaData.jikanId) {
                throw new Error("Se requiere animeId o jikanId para crear reseña");
            }

            const response = await api.post<AniverseResponse<Resenya>>('/resenyas', resenyaData);

            if (response.data?.success) {
                return response.data.data;
            }

            throw new Error(response.data?.message || 'Error al crear reseña');
        } catch (error) {
            handleServiceError('Error al crear reseña:', error);
            throw getErrorMessage(error);
        }
    },

    /**
     * Verificar si el usuario puede reseñar un anime específico
     * Valida que esté en favoritos y no haya reseñado antes
     * @param animeId ID del anime (opcional si se usa jikanId)
     * @param jikanId ID de Jikan (opcional si se usa animeId)
     * @returns Promise con información de elegibilidad
     */
    puedeResenar: async (animeId?: number, jikanId?: number): Promise<PuedeResenarResponse> => {
        try {
            // Construir parámetros de consulta
            const params = new URLSearchParams();
            if (animeId) params.append('animeId', animeId.toString());
            if (jikanId) params.append('jikanId', jikanId.toString());

            if (params.toString() === '') {
                throw new Error("Se requiere animeId o jikanId para verificar elegibilidad");
            }

            const response = await api.get<AniverseResponse<PuedeResenarResponse>>(
                `/resenyas/puede-resenar?${params.toString()}`
            );

            if (response.data?.success) {
                return response.data.data;
            }

            // Si no es exitoso, asumir que no puede reseñar
            return {
                puedeResenar: false,
                mensaje: response.data?.message || 'No se puede reseñar este anime'
            };
        } catch (error) {
            handleServiceError('Error al verificar elegibilidad para reseña:', error);
            return {
                puedeResenar: false,
                mensaje: 'Error al verificar si puedes reseñar este anime'
            };
        }
    },

    /**
     * Obtener animes favoritos disponibles para reseñar
     * @param page Número de página
     * @param size Tamaño de página
     * @returns Promise con animes favoritos y estado de reseña
     */
    getAnimesFavoritosParaResenar: async (
        page: number = 0,
        size: number = 10
    ): Promise<{
        content: AnimeFavoritoParaResenar[];
        totalPages: number;
        totalElements: number;
        size: number;
        number: number;
        first: boolean;
        last: boolean;
    }> => {
        try {
            const response = await api.get<AniverseResponse<{
                content: AnimeFavoritoParaResenar[];
                totalPages: number;
                totalElements: number;
                size: number;
                number: number;
                first: boolean;
                last: boolean;
            }>>(`/resenyas/animes-favoritos-para-resenar?page=${page}&size=${size}`);

            if (response.data?.success) {
                return response.data.data;
            }

            throw new Error(response.data?.message || 'Error al obtener animes para reseñar');
        } catch (error) {
            handleServiceError('Error al obtener animes favoritos para reseñar:', error);
            return {
                content: [],
                totalPages: 0,
                totalElements: 0,
                size: size,
                number: page,
                first: true,
                last: true
            };
        }
    },

    /**
     * Obtener reseñas del usuario autenticado
     * @param page Número de página
     * @param size Tamaño de página
     * @param sortBy Campo de ordenamiento
     * @param direction Dirección del ordenamiento
     * @returns Promise con reseñas del usuario
     */
    getMisResenyas: async (
        page: number = 0,
        size: number = 10,
        sortBy: string = 'fechaCreacion',
        direction: string = 'desc'
    ): Promise<PaginatedResenyas> => {
        try {
            const response = await api.get<AniverseResponse<PaginatedResenyas>>(
                `/resenyas/mis-resenyas?page=${page}&size=${size}&sortBy=${sortBy}&direction=${direction}`
            );

            if (response.data?.success) {
                return response.data.data;
            }

            throw new Error(response.data?.message || 'Error al obtener mis reseñas');
        } catch (error) {
            handleServiceError('Error al obtener mis reseñas:', error);
            return {
                content: [],
                totalPages: 0,
                totalElements: 0,
                size: size,
                number: page,
                first: true,
                last: true
            };
        }
    },

    /**
     * Obtener reseñas de un anime específico
     * @param animeId ID del anime
     * @param page Número de página
     * @param size Tamaño de página
     * @returns Promise con reseñas del anime
     */
    getResenyasByAnime: async (
        animeId: number,
        page: number = 0,
        size: number = 10
    ): Promise<PaginatedResenyas> => {
        try {
            if (!animeId || animeId <= 0) {
                throw new Error("ID de anime inválido");
            }

            const response = await api.get<AniverseResponse<PaginatedResenyas>>(
                `/resenyas/anime/${animeId}?page=${page}&size=${size}`
            );

            if (response.data?.success) {
                return response.data.data;
            }

            throw new Error(response.data?.message || 'Error al obtener reseñas del anime');
        } catch (error) {
            handleServiceError(`Error al obtener reseñas del anime ${animeId}:`, error);
            return {
                content: [],
                totalPages: 0,
                totalElements: 0,
                size: size,
                number: page,
                first: true,
                last: true
            };
        }
    },

    /**
     * Obtener reseñas por Jikan ID
     * @param jikanId ID de Jikan
     * @param page Número de página
     * @param size Tamaño de página
     * @returns Promise con reseñas del anime
     */
    getResenyasByJikanId: async (
        jikanId: number,
        page: number = 0,
        size: number = 10
    ): Promise<PaginatedResenyas> => {
        try {
            if (!jikanId || jikanId <= 0) {
                throw new Error("Jikan ID inválido");
            }

            const response = await api.get<AniverseResponse<PaginatedResenyas>>(
                `/resenyas/anime/jikan/${jikanId}?page=${page}&size=${size}`
            );

            if (response.data?.success) {
                return response.data.data;
            }

            return {
                content: [],
                totalPages: 0,
                totalElements: 0,
                size: size,
                number: page,
                first: true,
                last: true
            };
        } catch (error) {
            handleServiceError(`Error al obtener reseñas por jikanId ${jikanId}:`, error);
            return {
                content: [],
                totalPages: 0,
                totalElements: 0,
                size: size,
                number: page,
                first: true,
                last: true
            };
        }
    },

    /**
     * Actualizar reseña existente
     * @param resenyaId ID de la reseña
     * @param resenyaData Datos actualizados
     * @returns Promise con la reseña actualizada
     */
    actualizarResenya: async (resenyaId: number, resenyaData: ResenyaActualizar): Promise<Resenya> => {
        try {
            if (!resenyaId || resenyaId <= 0) {
                throw new Error("ID de reseña inválido");
            }

            // Validaciones frontales para datos actualizados
            if (resenyaData.contenido !== undefined && resenyaData.contenido.trim().length === 0) {
                throw new Error("El contenido de la reseña no puede estar vacío");
            }

            if (resenyaData.puntuacion !== undefined &&
                (resenyaData.puntuacion < 1 || resenyaData.puntuacion > 10)) {
                throw new Error("La puntuación debe estar entre 1 y 10");
            }

            const response = await api.put<AniverseResponse<Resenya>>(
                `/resenyas/${resenyaId}`,
                resenyaData
            );

            if (response.data?.success) {
                return response.data.data;
            }

            throw new Error(response.data?.message || 'Error al actualizar reseña');
        } catch (error) {
            handleServiceError(`Error al actualizar reseña ${resenyaId}:`, error);
            throw getErrorMessage(error);
        }
    },

    /**
     * Eliminar reseña
     * @param resenyaId ID de la reseña
     * @returns Promise con mensaje de confirmación
     */
    eliminarResenya: async (resenyaId: number): Promise<string> => {
        try {
            if (!resenyaId || resenyaId <= 0) {
                throw new Error("ID de reseña inválido");
            }

            const response = await api.delete<AniverseResponse<string>>(`/resenyas/${resenyaId}`);

            if (response.data?.success) {
                return response.data.data || 'Reseña eliminada correctamente';
            }

            throw new Error(response.data?.message || 'Error al eliminar reseña');
        } catch (error) {
            handleServiceError(`Error al eliminar reseña ${resenyaId}:`, error);
            throw getErrorMessage(error);
        }
    },

    /**
     * Obtener reseñas de un usuario específico
     * @param usuarioId ID del usuario
     * @param page Número de página
     * @param size Tamaño de página
     * @returns Promise con reseñas del usuario
     */
    getResenyasByUsuario: async (
        usuarioId: number,
        page: number = 0,
        size: number = 10
    ): Promise<PaginatedResenyas> => {
        try {
            if (!usuarioId || usuarioId <= 0) {
                throw new Error("ID de usuario inválido");
            }

            const response = await api.get<AniverseResponse<PaginatedResenyas>>(
                `/resenyas/usuario/${usuarioId}?page=${page}&size=${size}`
            );

            if (response.data?.success) {
                return response.data.data;
            }

            throw new Error(response.data?.message || 'Error al obtener reseñas del usuario');
        } catch (error) {
            handleServiceError(`Error al obtener reseñas del usuario ${usuarioId}:`, error);
            return {
                content: [],
                totalPages: 0,
                totalElements: 0,
                size: size,
                number: page,
                first: true,
                last: true
            };
        }
    },

    /**
     * Buscar reseñas con filtros
     * @param filtros Criterios de búsqueda
     * @returns Promise con reseñas filtradas
     */
    buscarResenyas: async (filtros: {
        contenido?: string;
        puntuacionMin?: number;
        puntuacionMax?: number;
        usuarioId?: number;
        animeId?: number;
        page?: number;
        size?: number;
        sortBy?: string;
        direction?: string;
    }): Promise<PaginatedResenyas> => {
        try {
            // Construir parámetros de consulta
            const params = new URLSearchParams();

            if (filtros.contenido) params.append('contenido', filtros.contenido);
            if (filtros.puntuacionMin !== undefined) params.append('puntuacionMin', filtros.puntuacionMin.toString());
            if (filtros.puntuacionMax !== undefined) params.append('puntuacionMax', filtros.puntuacionMax.toString());
            if (filtros.usuarioId) params.append('usuarioId', filtros.usuarioId.toString());
            if (filtros.animeId) params.append('animeId', filtros.animeId.toString());
            if (filtros.page !== undefined) params.append('page', filtros.page.toString());
            if (filtros.size !== undefined) params.append('size', filtros.size.toString());
            if (filtros.sortBy) params.append('sortBy', filtros.sortBy);
            if (filtros.direction) params.append('direction', filtros.direction);

            const response = await api.get<AniverseResponse<PaginatedResenyas>>(
                `/resenyas/buscar?${params.toString()}`
            );

            if (response.data?.success) {
                return response.data.data;
            }

            return {
                content: [],
                totalPages: 0,
                totalElements: 0,
                size: filtros.size || 10,
                number: filtros.page || 0,
                first: true,
                last: true
            };
        } catch (error) {
            handleServiceError('Error al buscar reseñas:', error);
            return {
                content: [],
                totalPages: 0,
                totalElements: 0,
                size: filtros.size || 10,
                number: filtros.page || 0,
                first: true,
                last: true
            };
        }
    },

    /**
     * Obtener estadísticas de reseñas de un anime
     * @param animeId ID del anime
     * @returns Promise con estadísticas
     */
    getEstadisticasAnime: async (animeId: number): Promise<{
        totalResenyas: number;
        puntuacionPromedio: number;
        distribucionPuntuaciones: { puntuacion: number; count: number }[];
    } | null> => {
        try {
            if (!animeId || animeId <= 0) {
                throw new Error("ID de anime inválido");
            }

            const response = await api.get<AniverseResponse<{
                totalResenyas: number;
                puntuacionPromedio: number;
                distribucionPuntuaciones: { puntuacion: number; count: number }[];
            }>>(`/resenyas/anime/${animeId}/estadisticas`);

            if (response.data?.success) {
                return response.data.data;
            }

            return null;
        } catch (error) {
            handleServiceError(`Error al obtener estadísticas del anime ${animeId}:`, error);
            return null;
        }
    },

    /**
     * Obtener reseñas recientes del sistema
     * @param page Número de página
     * @param size Tamaño de página
     * @returns Promise con reseñas recientes
     */
    getResenyasRecientes: async (page: number = 0, size: number = 10): Promise<PaginatedResenyas> => {
        try {
            const response = await api.get<AniverseResponse<PaginatedResenyas>>(
                `/resenyas/recientes?page=${page}&size=${size}`
            );

            if (response.data?.success) {
                return response.data.data;
            }

            return {
                content: [],
                totalPages: 0,
                totalElements: 0,
                size: size,
                number: page,
                first: true,
                last: true
            };
        } catch (error) {
            handleServiceError('Error al obtener reseñas recientes:', error);
            return {
                content: [],
                totalPages: 0,
                totalElements: 0,
                size: size,
                number: page,
                first: true,
                last: true
            };
        }
    },

    /**
     * Obtener mejores reseñas (mejor puntuadas)
     * @param page Número de página
     * @param size Tamaño de página
     * @returns Promise con mejores reseñas
     */
    getMejoresResenyas: async (page: number = 0, size: number = 10): Promise<PaginatedResenyas> => {
        try {
            const response = await api.get<AniverseResponse<PaginatedResenyas>>(
                `/resenyas/mejores?page=${page}&size=${size}`
            );

            if (response.data?.success) {
                return response.data.data;
            }

            return {
                content: [],
                totalPages: 0,
                totalElements: 0,
                size: size,
                number: page,
                first: true,
                last: true
            };
        } catch (error) {
            handleServiceError('Error al obtener mejores reseñas:', error);
            return {
                content: [],
                totalPages: 0,
                totalElements: 0,
                size: size,
                number: page,
                first: true,
                last: true
            };
        }
    },

    /**
     * Obtener estadísticas generales de reseñas del usuario
     * @returns Promise con estadísticas del usuario
     */
    getEstadisticasUsuario: async (): Promise<{
        totalResenyas: number;
        puntuacionPromedio: number;
        generosFavoritos: { genero: string; count: number; promedioRating: number }[];
        resenyasRecientes: Resenya[];
    } | null> => {
        try {
            const response = await api.get<AniverseResponse<{
                totalResenyas: number;
                puntuacionPromedio: number;
                generosFavoritos: { genero: string; count: number; promedioRating: number }[];
                resenyasRecientes: Resenya[];
            }>>('/resenyas/estadisticas/usuario');

            if (response.data?.success) {
                return response.data.data;
            }

            return null;
        } catch (error) {
            handleServiceError('Error al obtener estadísticas de usuario:', error);
            return null;
        }
    }
};

/**
 * Funciones auxiliares para manejo de errores
 * Siguiendo el mismo patrón del animeService y favoritoService
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