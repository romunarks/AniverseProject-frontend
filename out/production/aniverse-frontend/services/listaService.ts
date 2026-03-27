// src/services/listaService.ts
import api from '../api';
import { AniverseResponse } from '../types';
import { AxiosError } from 'axios';

/**
 * Interfaces para el sistema de listas
 */
export interface ListaDTO {
    id: number;
    nombre: string;
    descripcion?: string;
    usuarioId: number;
    usuarioNombre: string;
    publica: boolean;
    createdAt: string;
    cantidadAnimes: number;
}

export interface ListaCreateDTO {
    nombre: string;
    descripcion?: string;
    publica: boolean;
}

export interface ListaAnimeDTO {
    id: number;
    animeId: number;
    animeTitulo: string;
    animeImagenUrl?: string;
    notas?: string;
    episodiosVistos?: number;
    estado: string;
}

export interface ListaAnimeCreateDTO {
    animeId: number;
    notas?: string;
    episodiosVistos?: number;
    estado: string;
}

/**
 * Estados predefinidos para animes en listas
 */
export const ANIME_ESTADOS = {
    PENDIENTE: 'PENDIENTE',
    VIENDO: 'VIENDO',
    VISTO: 'VISTO',
    PAUSADO: 'PAUSADO',
    ABANDONADO: 'ABANDONADO',
    PLANIFICADO: 'PLANIFICADO'
} as const;

export type AnimeEstado = typeof ANIME_ESTADOS[keyof typeof ANIME_ESTADOS];

/**
 * Servicio para gestionar listas de animes
 */
export const listaService = {
    /**
     * Crear una nueva lista
     */
    createLista: async (usuarioId: number, listaData: ListaCreateDTO): Promise<ListaDTO> => {
        try {
            const response = await api.post<AniverseResponse<ListaDTO>>(
                `/listas/usuario/${usuarioId}`,
                listaData
            );

            if (response.data?.success) {
                return response.data.data;
            }

            throw new Error(response.data?.message || 'Error al crear lista');
        } catch (error) {
            handleServiceError('Error en createLista:', error);
            throw getErrorMessage(error);
        }
    },

    /**
     * Obtener listas de un usuario
     */
    getListasByUsuario: async (usuarioId: number, page: number = 0, size: number = 10): Promise<{
        content: ListaDTO[];
        totalElements: number;
        totalPages: number;
        number: number;
        size: number;
    }> => {
        try {
            const response = await api.get<AniverseResponse<any>>(
                `/listas/usuario/${usuarioId}?page=${page}&size=${size}`
            );

            if (response.data?.success) {
                return response.data.data;
            }

            return {
                content: [],
                totalElements: 0,
                totalPages: 0,
                number: 0,
                size: size
            };
        } catch (error) {
            handleServiceError('Error en getListasByUsuario:', error);
            return {
                content: [],
                totalElements: 0,
                totalPages: 0,
                number: 0,
                size: size
            };
        }
    },

    /**
     * Obtener listas públicas
     */
    getPublicListas: async (page: number = 0, size: number = 10): Promise<{
        content: ListaDTO[];
        totalElements: number;
        totalPages: number;
        number: number;
        size: number;
    }> => {
        try {
            const response = await api.get<AniverseResponse<any>>(
                `/listas/publicas?page=${page}&size=${size}`
            );

            if (response.data?.success) {
                return response.data.data;
            }

            return {
                content: [],
                totalElements: 0,
                totalPages: 0,
                number: 0,
                size: size
            };
        } catch (error) {
            handleServiceError('Error en getPublicListas:', error);
            return {
                content: [],
                totalElements: 0,
                totalPages: 0,
                number: 0,
                size: size
            };
        }
    },

    /**
     * Obtener detalles de una lista
     */
    getListaDetalles: async (listaId: number): Promise<ListaDTO | null> => {
        try {
            const response = await api.get<AniverseResponse<ListaDTO>>(`/listas/${listaId}`);

            if (response.data?.success) {
                return response.data.data;
            }

            return null;
        } catch (error) {
            handleServiceError('Error en getListaDetalles:', error);
            return null;
        }
    },

    /**
     * Actualizar una lista
     */
    updateLista: async (listaId: number, listaData: ListaCreateDTO): Promise<ListaDTO> => {
        try {
            const response = await api.put<AniverseResponse<ListaDTO>>(
                `/listas/${listaId}`,
                listaData
            );

            if (response.data?.success) {
                return response.data.data;
            }

            throw new Error(response.data?.message || 'Error al actualizar lista');
        } catch (error) {
            handleServiceError('Error en updateLista:', error);
            throw getErrorMessage(error);
        }
    },

    /**
     * ✅ CORREGIDO: Eliminar una lista (soft delete)
     * Cambiado para coincidir con el endpoint real del backend
     */
    deleteLista: async (listaId: number): Promise<string> => {
        try {
            const response = await api.delete<AniverseResponse<string>>(`/listas/${listaId}`);

            if (response.data?.success) {
                return response.data.data || response.data.message || 'Lista eliminada correctamente';
            }

            throw new Error(response.data?.message || 'Error al eliminar lista');
        } catch (error) {
            handleServiceError('Error en deleteLista:', error);
            throw getErrorMessage(error);
        }
    },

    /**
     * Obtener animes de una lista
     */
    getAnimesFromLista: async (listaId: number): Promise<ListaAnimeDTO[]> => {
        try {
            const response = await api.get<AniverseResponse<ListaAnimeDTO[]>>(
                `/listas/${listaId}/animes`
            );

            if (response.data?.success) {
                return response.data.data;
            }

            return [];
        } catch (error) {
            handleServiceError('Error en getAnimesFromLista:', error);
            return [];
        }
    },

    /**
     * Añadir anime a una lista
     */
    addAnimeToLista: async (listaId: number, animeData: ListaAnimeCreateDTO): Promise<ListaAnimeDTO> => {
        try {
            const response = await api.post<AniverseResponse<ListaAnimeDTO>>(
                `/listas/${listaId}/animes`,
                animeData
            );

            if (response.data?.success) {
                return response.data.data;
            }

            throw new Error(response.data?.message || 'Error al añadir anime a la lista');
        } catch (error) {
            handleServiceError('Error en addAnimeToLista:', error);
            throw getErrorMessage(error);
        }
    },

    /**
     * Actualizar anime en una lista
     */
    updateAnimeInLista: async (
        listaId: number,
        animeId: number,
        updateData: Partial<ListaAnimeCreateDTO>
    ): Promise<ListaAnimeDTO> => {
        try {
            const response = await api.put<AniverseResponse<ListaAnimeDTO>>(
                `/listas/${listaId}/animes/${animeId}`,
                updateData
            );

            if (response.data?.success) {
                return response.data.data;
            }

            throw new Error(response.data?.message || 'Error al actualizar anime en la lista');
        } catch (error) {
            handleServiceError('Error en updateAnimeInLista:', error);
            throw getErrorMessage(error);
        }
    },

    /**
     * Eliminar anime de una lista
     */
    removeAnimeFromLista: async (listaId: number, animeId: number): Promise<string> => {
        try {
            const response = await api.delete<AniverseResponse<string>>(
                `/listas/${listaId}/animes/${animeId}`
            );

            if (response.data?.success) {
                return response.data.data || response.data.message || 'Anime eliminado de la lista correctamente';
            }

            throw new Error(response.data?.message || 'Error al eliminar anime de la lista');
        } catch (error) {
            handleServiceError('Error en removeAnimeFromLista:', error);
            throw getErrorMessage(error);
        }
    },

    /**
     * Obtener listas eliminadas (para restaurar)
     */
    getDeletedListas: async (page: number = 0, size: number = 10): Promise<{
        content: ListaDTO[];
        totalElements: number;
        totalPages: number;
        number: number;
        size: number;
    }> => {
        try {
            const response = await api.get<AniverseResponse<any>>(
                `/listas/eliminadas?page=${page}&size=${size}`
            );

            if (response.data?.success) {
                return response.data.data;
            }

            return {
                content: [],
                totalElements: 0,
                totalPages: 0,
                number: 0,
                size: size
            };
        } catch (error) {
            handleServiceError('Error en getDeletedListas:', error);
            return {
                content: [],
                totalElements: 0,
                totalPages: 0,
                number: 0,
                size: size
            };
        }
    },

    /**
     * Restaurar una lista eliminada
     */
    restoreLista: async (listaId: number): Promise<ListaDTO> => {
        try {
            const response = await api.post<AniverseResponse<ListaDTO>>(
                `/listas/${listaId}/restaurar`
            );

            if (response.data?.success) {
                return response.data.data;
            }

            throw new Error(response.data?.message || 'Error al restaurar lista');
        } catch (error) {
            handleServiceError('Error en restoreLista:', error);
            throw getErrorMessage(error);
        }
    }
};

/**
 * Utilidades para estados de anime
 */
export const estadoUtils = {
    /**
     * Obtener todos los estados disponibles
     */
    getAllEstados: () => Object.values(ANIME_ESTADOS),

    /**
     * Obtener color para un estado
     */
    getEstadoColor: (estado: string): string => {
        switch (estado) {
            case ANIME_ESTADOS.VISTO:
                return 'bg-green-100 text-green-800 border-green-200';
            case ANIME_ESTADOS.VIENDO:
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case ANIME_ESTADOS.PAUSADO:
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case ANIME_ESTADOS.PENDIENTE:
                return 'bg-purple-100 text-purple-800 border-purple-200';
            case ANIME_ESTADOS.PLANIFICADO:
                return 'bg-indigo-100 text-indigo-800 border-indigo-200';
            case ANIME_ESTADOS.ABANDONADO:
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    },

    /**
     * Obtener icono para un estado
     */
    getEstadoIcon: (estado: string): string => {
        switch (estado) {
            case ANIME_ESTADOS.VISTO:
                return '✓';
            case ANIME_ESTADOS.VIENDO:
                return '▶';
            case ANIME_ESTADOS.PAUSADO:
                return '⏸';
            case ANIME_ESTADOS.PENDIENTE:
                return '⏳';
            case ANIME_ESTADOS.PLANIFICADO:
                return '📅';
            case ANIME_ESTADOS.ABANDONADO:
                return '❌';
            default:
                return '📺';
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