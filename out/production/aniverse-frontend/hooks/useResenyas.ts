// src/hooks/useResenyas.ts
import { useState, useEffect, useCallback } from 'react';
import { resenyaService, PaginatedResenyas, ResenyaCrear, ResenyaActualizar } from '../services/resenyaService';
import { Resenya } from '../types';

interface UseResenyasOptions {
    animeId?: number;
    jikanId?: number;
    usuarioId?: number;
    autoLoad?: boolean;
    pageSize?: number;
    initialFilters?: {
        contenido?: string;
        puntuacionMin?: number;
        puntuacionMax?: number;
        sortBy?: 'fechaCreacion' | 'puntuacion';
        direction?: 'asc' | 'desc';
    };
}

interface FiltersState {
    contenido: string;
    puntuacionMin: number | null;
    puntuacionMax: number | null;
    sortBy: 'fechaCreacion' | 'puntuacion';
    direction: 'asc' | 'desc';
}

interface UseResenyasResult {
    // Estados principales
    resenyas: Resenya[];
    loading: boolean;
    error: string | null;

    // Estados de paginación
    currentPage: number;
    totalPages: number;
    totalElements: number;
    hasMore: boolean;

    // Estados de filtros
    filters: FiltersState;

    // Funciones de control
    loadMore: () => Promise<void>;
    refresh: () => Promise<void>;
    updateFilters: (newFilters: Partial<UseResenyasOptions['initialFilters']>) => void;
    search: (term: string) => void;

    // Funciones CRUD
    createResenya: (data: ResenyaCrear) => Promise<Resenya>;
    updateResenya: (id: number, data: ResenyaActualizar) => Promise<Resenya>;
    deleteResenya: (id: number) => Promise<void>;

    // Funciones de utilidad
    canUserReview: () => Promise<boolean>;
    checkEligibility: () => Promise<{ puedeResenar: boolean; mensaje: string; yaReseno?: boolean }>;
}

export const useResenyas = (options: UseResenyasOptions = {}): UseResenyasResult => {
    const {
        animeId,
        jikanId,
        usuarioId,
        autoLoad = true,
        pageSize = 10,
        initialFilters
    } = options;

    // Estados principales
    const [resenyas, setResenyas] = useState<Resenya[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Estados de paginación
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [hasMore, setHasMore] = useState(false);

    // Estados de filtros - Inicialización más robusta
    const [filters, setFilters] = useState<FiltersState>(() => ({
        contenido: initialFilters?.contenido ?? '',
        puntuacionMin: initialFilters?.puntuacionMin ?? null,
        puntuacionMax: initialFilters?.puntuacionMax ?? null,
        sortBy: initialFilters?.sortBy ?? 'fechaCreacion',
        direction: initialFilters?.direction ?? 'desc'
    }));

    // Estados auxiliares
    const [searchTimeout, setSearchTimeout] = useState<number | null>(null);

    // Función principal para cargar reseñas
    const loadResenyas = useCallback(async (page: number = 0, append: boolean = false) => {
        try {
            if (!append) {
                setLoading(true);
                setError(null);
            }

            let response: PaginatedResenyas;

            // Determinar qué servicio usar según los parámetros
            if (animeId) {
                response = await resenyaService.getResenyasByAnime(animeId, page, pageSize);
            } else if (jikanId) {
                response = await resenyaService.getResenyasByJikanId(jikanId, page, pageSize);
            } else if (usuarioId) {
                response = await resenyaService.getResenyasByUsuario(usuarioId, page, pageSize);
            } else {
                // Búsqueda general con filtros
                response = await resenyaService.buscarResenyas({
                    contenido: filters.contenido || undefined,
                    puntuacionMin: filters.puntuacionMin || undefined,
                    puntuacionMax: filters.puntuacionMax || undefined,
                    page,
                    size: pageSize,
                    sortBy: filters.sortBy,
                    direction: filters.direction
                });
            }

            // Actualizar estados
            if (append) {
                setResenyas(prev => [...prev, ...response.content]);
            } else {
                setResenyas(response.content);
            }

            setCurrentPage(response.number);
            setTotalPages(response.totalPages);
            setTotalElements(response.totalElements);
            setHasMore(!response.last);

        } catch (err: any) {
            console.error('Error loading reseñas:', err);
            setError(err.message || 'Error al cargar las reseñas');
            if (!append) {
                setResenyas([]);
            }
        } finally {
            setLoading(false);
        }
    }, [animeId, jikanId, usuarioId, pageSize, filters]);

    // Cargar reseñas inicial
    useEffect(() => {
        if (autoLoad) {
            loadResenyas(0, false);
        }
    }, [autoLoad, loadResenyas]);

    // Función para cargar más (paginación infinita)
    const loadMore = useCallback(async () => {
        if (!loading && hasMore) {
            await loadResenyas(currentPage + 1, true);
        }
    }, [loading, hasMore, currentPage, loadResenyas]);

    // Función para refrescar
    const refresh = useCallback(async () => {
        setCurrentPage(0);
        await loadResenyas(0, false);
    }, [loadResenyas]);

    // Función para actualizar filtros
    const updateFilters = useCallback((newFilters: Partial<FiltersState>) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
        setCurrentPage(0);
        // La recarga se maneja automáticamente por el useEffect de loadResenyas
    }, []);

    // Función para búsqueda con debounce
    const search = useCallback((term: string) => {
        setFilters(prev => ({ ...prev, contenido: term }));

        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        const timeout = window.setTimeout(() => {
            setCurrentPage(0);
            loadResenyas(0, false);
        }, 500);

        setSearchTimeout(timeout);
    }, [searchTimeout, loadResenyas]);

    // Limpiar timeout al desmontar
    useEffect(() => {
        return () => {
            if (searchTimeout) {
                window.clearTimeout(searchTimeout);
            }
        };
    }, [searchTimeout]);

    // Función para crear reseña
    const createResenya = useCallback(async (data: ResenyaCrear): Promise<Resenya> => {
        try {
            const nuevaResenya = await resenyaService.crearResenya(data);

            // Agregar al inicio de la lista
            setResenyas(prev => [nuevaResenya, ...prev]);
            setTotalElements(prev => prev + 1);

            return nuevaResenya;
        } catch (error: any) {
            throw new Error(error.message || 'Error al crear la reseña');
        }
    }, []);

    // Función para actualizar reseña
    const updateResenya = useCallback(async (id: number, data: ResenyaActualizar): Promise<Resenya> => {
        try {
            const resenyaActualizada = await resenyaService.actualizarResenya(id, data);

            // Actualizar en la lista
            setResenyas(prev =>
                prev.map(r => r.id === id ? resenyaActualizada : r)
            );

            return resenyaActualizada;
        } catch (error: any) {
            throw new Error(error.message || 'Error al actualizar la reseña');
        }
    }, []);

    // Función para eliminar reseña
    const deleteResenya = useCallback(async (id: number): Promise<void> => {
        try {
            await resenyaService.eliminarResenya(id);

            // Remover de la lista
            setResenyas(prev => prev.filter(r => r.id !== id));
            setTotalElements(prev => prev - 1);
        } catch (error: any) {
            throw new Error(error.message || 'Error al eliminar la reseña');
        }
    }, []);

    // Función para verificar si el usuario puede reseñar
    const canUserReview = useCallback(async (): Promise<boolean> => {
        if (!animeId && !jikanId) return false;

        try {
            const result = await resenyaService.puedeResenar(animeId, jikanId);
            return result.puedeResenar;
        } catch (error) {
            console.error('Error checking review eligibility:', error);
            return false;
        }
    }, [animeId, jikanId]);

    // Función para verificar elegibilidad completa
    const checkEligibility = useCallback(async () => {
        if (!animeId && !jikanId) {
            return { puedeResenar: false, mensaje: 'Anime no especificado' };
        }

        try {
            return await resenyaService.puedeResenar(animeId, jikanId);
        } catch (error: any) {
            return {
                puedeResenar: false,
                mensaje: error.message || 'Error al verificar elegibilidad'
            };
        }
    }, [animeId, jikanId]);

    return {
        // Estados principales
        resenyas,
        loading,
        error,

        // Estados de paginación
        currentPage,
        totalPages,
        totalElements,
        hasMore,

        // Estados de filtros
        filters,

        // Funciones de control
        loadMore,
        refresh,
        updateFilters,
        search,

        // Funciones CRUD
        createResenya,
        updateResenya,
        deleteResenya,

        // Funciones de utilidad
        canUserReview,
        checkEligibility
    };
};