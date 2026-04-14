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

export const useResenyas = (options: UseResenyasOptions = {}) => {
    const { animeId, jikanId, usuarioId, autoLoad = true, pageSize = 10, initialFilters } = options;

    const [resenyas, setResenyas] = useState<Resenya[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [hasMore, setHasMore] = useState(false);

    const [filters, setFilters] = useState<FiltersState>(() => ({
        contenido: initialFilters?.contenido ?? '',
        puntuacionMin: initialFilters?.puntuacionMin ?? null,
        puntuacionMax: initialFilters?.puntuacionMax ?? null,
        sortBy: initialFilters?.sortBy ?? 'fechaCreacion',
        direction: initialFilters?.direction ?? 'desc'
    }));

    const [searchTimeout, setSearchTimeout] = useState<number | null>(null);

    const loadResenyas = useCallback(async (page: number = 0, append: boolean = false) => {
        try {
            if (!append) {
                setLoading(true);
                setError(null);
            }

            let response: PaginatedResenyas;

            // ✅ PRIORIDAD: Buscar siempre por ID de la base de datos local primero
            if (animeId) {
                response = await resenyaService.getResenyasByAnime(animeId, page, pageSize);
            } else if (usuarioId) {
                response = await resenyaService.getResenyasByUsuario(usuarioId, page, pageSize);
            } else {
                response = await resenyaService.buscarResenyas({
                    contenido: filters.contenido || undefined,
                    puntuacionMin: filters.puntuacionMin || undefined,
                    puntuacionMax: filters.puntuacionMax || undefined,
                    page, size: pageSize, sortBy: filters.sortBy, direction: filters.direction
                });
            }

            if (append) {
                setResenyas(prev => [...prev, ...response.content]);
            } else {
                setResenyas(response.content);
            }

            setCurrentPage(response.number);
            setTotalPages(response.totalPages);
            setTotalElements(response.totalElements);
            setHasMore(!response.last);

        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error al cargar las reseñas';
            console.error('Error loading reseñas:', msg);
            setError(msg);
            if (!append) setResenyas([]);
        } finally {
            setLoading(false);
        }
    }, [animeId, usuarioId, pageSize, filters]);

    useEffect(() => {
        if (autoLoad) loadResenyas(0, false);
    }, [autoLoad, loadResenyas]);

    const loadMore = useCallback(async () => {
        if (!loading && hasMore) await loadResenyas(currentPage + 1, true);
    }, [loading, hasMore, currentPage, loadResenyas]);

    const refresh = useCallback(async () => {
        setCurrentPage(0);
        await loadResenyas(0, false);
    }, [loadResenyas]);

    const updateFilters = useCallback((newFilters: Partial<FiltersState>) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
        setCurrentPage(0);
    }, []);

    const search = useCallback((term: string) => {
        setFilters(prev => ({ ...prev, contenido: term }));
        if (searchTimeout) clearTimeout(searchTimeout);
        const timeout = window.setTimeout(() => {
            setCurrentPage(0);
            loadResenyas(0, false);
        }, 500);
        setSearchTimeout(timeout);
    }, [searchTimeout, loadResenyas]);

    useEffect(() => {
        return () => { if (searchTimeout) window.clearTimeout(searchTimeout); };
    }, [searchTimeout]);

    const createResenya = useCallback(async (data: ResenyaCrear): Promise<Resenya> => {
        try {
            const nuevaResenya = await resenyaService.crearResenya(data);
            setResenyas(prev => [nuevaResenya, ...prev]);
            setTotalElements(prev => prev + 1);
            return nuevaResenya;
        } catch (err: unknown) {
            throw new Error(err instanceof Error ? err.message : 'Error al crear la reseña');
        }
    }, []);

    const updateResenya = useCallback(async (id: number, data: ResenyaActualizar): Promise<Resenya> => {
        try {
            const resenyaActualizada = await resenyaService.actualizarResenya(id, data);
            setResenyas(prev => prev.map(r => r.id === id ? resenyaActualizada : r));
            return resenyaActualizada;
        } catch (err: unknown) {
            throw new Error(err instanceof Error ? err.message : 'Error al actualizar');
        }
    }, []);

    const deleteResenya = useCallback(async (id: number): Promise<void> => {
        try {
            await resenyaService.eliminarResenya(id);
            setResenyas(prev => prev.filter(r => r.id !== id));
            setTotalElements(prev => prev - 1);
        } catch (err: unknown) {
            throw new Error(err instanceof Error ? err.message : 'Error al eliminar');
        }
    }, []);

    const canUserReview = useCallback(async (): Promise<boolean> => {
        if (!animeId && !jikanId) return false;
        try {
            const result = await resenyaService.puedeResenar(animeId, jikanId);
            return result.puedeResenar;
        } catch (error) {
            return false;
        }
    }, [animeId, jikanId]);

    const checkEligibility = useCallback(async () => {
        if (!animeId && !jikanId) return { puedeResenar: false, mensaje: 'Anime no especificado' };
        try {
            return await resenyaService.puedeResenar(animeId, jikanId);
        } catch (err: unknown) {
            return { puedeResenar: false, mensaje: err instanceof Error ? err.message : 'Error al verificar' };
        }
    }, [animeId, jikanId]);

    return {
        resenyas, loading, error, currentPage, totalPages, totalElements, hasMore, filters,
        loadMore, refresh, updateFilters, search, createResenya, updateResenya, deleteResenya,
        canUserReview, checkEligibility
    };
};