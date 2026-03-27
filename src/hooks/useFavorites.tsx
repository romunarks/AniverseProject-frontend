// src/hooks/useFavorites.tsx - Hook actualizado para los endpoints corregidos
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import favoritoService from '../services/favoritoService';

/**
 * Hook personalizado para manejar favoritos de forma eficiente
 */
export const useFavorites = () => {
    const { isAuthenticated, user } = useAuth();
    const [favorites, setFavorites] = useState<Set<number>>(new Set());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Verifica si un anime es favorito (desde el estado local)
     */
    const isFavorite = useCallback((jikanId: number) => {
        return favorites.has(Number(jikanId));
    }, [favorites]);

    /**
     * Verifica el estado de favorito de un anime específico (desde el servidor)
     */
    const checkFavorite = useCallback(async (jikanId: number) => {
        if (!isAuthenticated || !user || !jikanId) return false;

        try {
            setLoading(true);
            const isFav = await favoritoService.checkFavoriteByJikanId(jikanId);

            setFavorites(prev => {
                const newFavorites = new Set(prev);
                if (isFav) {
                    newFavorites.add(Number(jikanId));
                } else {
                    newFavorites.delete(Number(jikanId));
                }
                return newFavorites;
            });

            return isFav;
        } catch (err: any) {
            setError(err.message || 'Error verificando favorito');
            return false;
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, user]);

    /**
     * Verifica múltiples favoritos de una vez (optimización para listas)
     */
    const checkMultipleFavorites = useCallback(async (jikanIds: number[]) => {
        if (!isAuthenticated || !user || !Array.isArray(jikanIds) || jikanIds.length === 0) {
            return {};
        }

        try {
            setLoading(true);
            const results = await favoritoService.checkMultiplesFavoritos(jikanIds);

            setFavorites(prev => {
                const newFavorites = new Set(prev);
                Object.entries(results).forEach(([id, isFav]) => {
                    const numId = Number(id);
                    if (isFav) {
                        newFavorites.add(numId);
                    } else {
                        newFavorites.delete(numId);
                    }
                });
                return newFavorites;
            });

            return results;
        } catch (err: any) {
            setError(err.message || 'Error verificando múltiples favoritos');
            return {};
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, user]);

    /**
     * Alterna el estado de favorito
     */
    const toggleFavorite = useCallback(async (
        jikanId: number,
        animeData: {
            titulo?: string;
            imagenUrl?: string;
            tipo?: string;
            episodios?: number;
            estado?: string;
            puntuacion?: number;
            generos?: string;
            sinopsis?: string;
        }
    ) => {
        if (!isAuthenticated || !user || !jikanId) {
            throw new Error('Usuario no autenticado o datos insuficientes');
        }

        try {
            setLoading(true);
            const result = await favoritoService.toggleFavorito({
                jikanId,
                ...animeData
            });

            if (result) {
                setFavorites(prev => {
                    const newFavorites = new Set(prev);
                    const numId = Number(jikanId);

                    if (result.isFavorite) {
                        newFavorites.add(numId);
                    } else {
                        newFavorites.delete(numId);
                    }

                    return newFavorites;
                });
            }

            return result;
        } catch (err: any) {
            setError(err.message || 'Error al modificar favorito');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, user]);

    /**
     * Elimina un favorito
     */
    const removeFavorite = useCallback(async (jikanId: number) => {
        if (!isAuthenticated || !user || !jikanId) {
            throw new Error('Usuario no autenticado o JikanId inválido');
        }

        try {
            setLoading(true);
            await favoritoService.removeFavorito(jikanId);

            setFavorites(prev => {
                const newFavorites = new Set(prev);
                newFavorites.delete(Number(jikanId));
                return newFavorites;
            });

            return true;
        } catch (err: any) {
            setError(err.message || 'Error al eliminar favorito');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, user]);

    /**
     * Limpia el estado de favoritos
     */
    const clearFavorites = useCallback(() => {
        setFavorites(new Set());
        setError(null);
    }, []);

    /**
     * Inicializa favoritos con una lista (útil para páginas que cargan listas)
     */
    const initializeFavorites = useCallback((jikanIds: number[]) => {
        if (Array.isArray(jikanIds)) {
            setFavorites(new Set(jikanIds.map(id => Number(id))));
        }
    }, []);

    return {
        favorites: Array.from(favorites), // Convertir Set a Array para facilitar uso
        isFavorite,
        checkFavorite,
        checkMultipleFavorites,
        toggleFavorite,
        removeFavorite,
        clearFavorites,
        initializeFavorites,
        loading,
        error,
        setError
    };
};

/**
 * Hook simplificado para un solo favorito
 */
export const useSingleFavorite = (jikanId?: number) => {
    const { isAuthenticated, user } = useAuth();
    const [isFavorite, setIsFavorite] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Verificar estado inicial
    useEffect(() => {
        if (jikanId && isAuthenticated && user) {
            const checkInitialState = async () => {
                try {
                    setLoading(true);
                    const result = await favoritoService.checkFavoriteByJikanId(jikanId);
                    setIsFavorite(result);
                } catch (err: any) {
                    setError(err.message || 'Error verificando favorito');
                } finally {
                    setLoading(false);
                }
            };

            checkInitialState();
        }
    }, [jikanId, isAuthenticated, user]);

    const toggle = useCallback(async (animeData: {
        titulo?: string;
        imagenUrl?: string;
        tipo?: string;
        episodios?: number;
        estado?: string;
        puntuacion?: number;
        generos?: string;
        sinopsis?: string;
    }) => {
        if (!jikanId || !isAuthenticated || !user) {
            throw new Error('Datos insuficientes para toggle');
        }

        try {
            setLoading(true);
            const result = await favoritoService.toggleFavorito({
                jikanId,
                ...animeData
            });

            if (result) {
                setIsFavorite(result.isFavorite);
            }

            return result;
        } catch (err: any) {
            setError(err.message || 'Error en toggle');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [jikanId, isAuthenticated, user]);

    const refresh = useCallback(async () => {
        if (jikanId && isAuthenticated && user) {
            try {
                setLoading(true);
                const result = await favoritoService.checkFavoriteByJikanId(jikanId);
                setIsFavorite(result);
            } catch (err: any) {
                setError(err.message || 'Error refrescando favorito');
            } finally {
                setLoading(false);
            }
        }
    }, [jikanId, isAuthenticated, user]);

    return {
        isFavorite,
        toggle,
        refresh,
        loading,
        error,
        setError
    };
};

export default useFavorites;