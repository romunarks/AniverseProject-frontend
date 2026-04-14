// src/hooks/useFavorites.tsx
import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { favoritoService } from '../services/favoritoService';

// ✅ Cambiamos a exportación nombrada directa para evitar el aviso de "Unused"
export const useFavorites = () => {
    const { isAuthenticated, user } = useAuth();
    const [favorites, setFavorites] = useState<Set<number>>(new Set());
    const [loading, setLoading] = useState(false);

    const isFavorite = useCallback((jikanId: number | null | undefined): boolean => {
        if (!jikanId) return false;
        return favorites.has(Number(jikanId));
    }, [favorites]);

    const loadFavorites = useCallback(async (): Promise<void> => {
        if (!isAuthenticated || !user) {
            setFavorites(new Set());
            return;
        }

        try {
            setLoading(true);
            const data = await favoritoService.getMisFavoritos(0, 100);

            if (data && Array.isArray(data.content)) {
                // Tipado para evitar 'any' y filtrar valores nulos
                const jikanIds = data.content
                    .map((f: { anime?: { jikanId?: number } }) => f.anime?.jikanId)
                    .filter((id?: number): id is number => id !== undefined && id !== null);

                setFavorites(new Set(jikanIds.map(Number)));
            }
        } catch (err) {
            console.error('Error cargando favoritos:', err);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, user]);

    useEffect(() => {
        void loadFavorites(); // ✅ 'void' para ignorar la promesa intencionalmente
    }, [loadFavorites]);

    const toggleFavorite = useCallback(async (jikanId: number) => {
        if (!isAuthenticated || !jikanId) return;

        const numId = Number(jikanId);
        const wasFavorite = favorites.has(numId);

        // ✅ REEMPLAZO DE EXPRESIONES (if/else en lugar de ternarios sueltos)
        setFavorites(prev => {
            const next = new Set(prev);
            if (wasFavorite) {
                next.delete(numId);
            } else {
                next.add(numId);
            }
            return next;
        });

        try {
            const result = await favoritoService.toggleFavorito(jikanId);
            setFavorites(prev => {
                const next = new Set(prev);
                if (result.isFavorite) {
                    next.add(numId);
                } else {
                    next.delete(numId);
                }
                return next;
            });
        } catch (err) {
            // Rollback en caso de error
            setFavorites(prev => {
                const next = new Set(prev);
                if (wasFavorite) {
                    next.add(numId);
                } else {
                    next.delete(numId);
                }
                return next;
            });
        }
    }, [isAuthenticated, favorites]);

    return {
        favorites: Array.from(favorites),
        isFavorite,
        toggleFavorite,
        loading
    };
};