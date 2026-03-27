// src/services/favoritoService.ts - VERSIÓN FINAL ARREGLADA
import api from '../api';
import { AxiosError } from 'axios';

/**
 * Interfaces basadas en tu backend REAL
 */
export interface FavoritoCheckResponse {
    isFavorite: boolean;
    jikanId: number;
    userId: number;
}

export interface FavoritoToggleResponse {
    success: boolean;
    action: 'added' | 'removed';
    isFavorite: boolean;
    message: string;
    jikanId: number;
    data?: {
        favoritoId: number;
        animeId: number;
        animeTitulo: string;
    };
}

/**
 * ✅ SERVICIO ARREGLADO - Usando endpoints REALES de tu backend
 */
export const favoritoService = {
    /**
     * ✅ MÉTODO AUXILIAR: Verificar token antes de cualquier llamada
     */
    _verifyToken: () => {
        const token = localStorage.getItem('token');
        if (!token) {
            console.log('❌ No hay token en localStorage');
            throw new Error('UNAUTHENTICATED');
        }

        try {
            // ✅ Verificar si el token está expirado
            const payload = JSON.parse(atob(token.split('.')[1]));
            const isExpired = payload.exp * 1000 < Date.now();

            if (isExpired) {
                console.log('❌ Token expirado');
                // Limpiar token expirado
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('refreshToken');
                throw new Error('UNAUTHENTICATED');
            }

            console.log('✅ Token válido, expira:', new Date(payload.exp * 1000));
            return token;
        } catch (error) {
            console.log('❌ Token inválido:', error.message);
            // Limpiar token corrupto
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('refreshToken');
            throw new Error('UNAUTHENTICATED');
        }
    },

    /**
     * ✅ VERIFICAR FAVORITO - Con verificación de token
     * @param jikanId - ID de Jikan del anime
     */
    checkFavorito: async (jikanId: number): Promise<FavoritoCheckResponse> => {
        try {
            console.log(`🔍 Verificando favorito para JikanID: ${jikanId}`);

            // ✅ VERIFICAR TOKEN ANTES DE LA LLAMADA
            const token = favoritoService._verifyToken();

            // ✅ VERIFICAR que el header de autorización esté configurado
            if (!api.defaults.headers.common['Authorization']) {
                console.log('🔧 Configurando header de autorización');
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            }

            // ✅ ENDPOINT CORRECTO según tu FavoritoController
            const response = await api.get(`/favoritos/check/${jikanId}`);

            console.log('✅ Respuesta checkFavorito:', response.data);

            // ✅ Manejar respuesta exitosa
            if (response.data.success && response.data.data) {
                return {
                    isFavorite: response.data.data.isFavorite,
                    jikanId: response.data.data.jikanId,
                    userId: response.data.data.userId
                };
            }

            // ✅ Si no es exitoso, no es favorito
            return {
                isFavorite: false,
                jikanId: jikanId,
                userId: 0
            };

        } catch (error) {
            console.log(`⚠️ Error verificando favorito para JikanID ${jikanId}:`, error);

            // ✅ MANEJO CORRECTO DE ERRORES
            if (isAxiosError(error)) {
                const status = error.response?.status;

                // Si es 401 (no autenticado), propagar el error
                if (status === 401) {
                    console.log('🔒 Usuario no autenticado para verificar favoritos');
                    throw new Error('UNAUTHENTICATED');
                }

                // Si es 404 o cualquier otro error, asumir que no es favorito
                if (status === 404) {
                    console.log('📭 Anime no encontrado en favoritos');
                    return {
                        isFavorite: false,
                        jikanId: jikanId,
                        userId: 0
                    };
                }
            }

            // ✅ Si el error es de token, propagarlo
            if (error instanceof Error && error.message === 'UNAUTHENTICATED') {
                throw error;
            }

            // ✅ Cualquier otro error, asumir que no es favorito
            return {
                isFavorite: false,
                jikanId: jikanId,
                userId: 0
            };
        }
    },

    /**
     * ✅ TOGGLE FAVORITO - Usando endpoint POST /api/favoritos/toggle
     * @param jikanId - ID de Jikan del anime
     * @param animeData - Datos adicionales del anime (opcional)
     */
    toggleFavorito: async (
        jikanId: number,
        animeData?: {
            titulo?: string;
            imagenUrl?: string;
            tipo?: string;
            episodios?: number;
            estado?: string;
            puntuacion?: number;
            generos?: string;
            sinopsis?: string;
        }
    ): Promise<FavoritoToggleResponse> => {
        try {
            console.log(`🔄 Toggle favorito para JikanID: ${jikanId}`);

            // ✅ PAYLOAD CORRECTO según tu FavoritoController
            const payload = {
                jikanId: jikanId,
                ...animeData // Spread de datos adicionales si existen
            };

            console.log('📤 Payload enviado:', payload);

            // ✅ ENDPOINT CORRECTO
            const response = await api.post('/favoritos/toggle', payload);

            console.log('✅ Respuesta toggleFavorito:', response.data);

            if (response.data.success && response.data.data) {
                return {
                    success: response.data.data.success,
                    action: response.data.data.action,
                    isFavorite: response.data.data.isFavorite,
                    message: response.data.data.message,
                    jikanId: response.data.data.jikanId,
                    data: response.data.data.data
                };
            }

            throw new Error(response.data.message || 'Error en toggle de favorito');

        } catch (error) {
            console.error('❌ Error en toggleFavorito:', error);

            if (isAxiosError(error)) {
                const status = error.response?.status;
                const message = error.response?.data?.message || error.message;

                // Manejar errores específicos
                if (status === 401) {
                    throw new Error('Debes iniciar sesión para gestionar favoritos');
                }

                if (status === 403) {
                    throw new Error('No tienes permisos para esta acción');
                }

                if (status === 404) {
                    throw new Error('Anime no encontrado');
                }

                throw new Error(message || 'Error al actualizar favorito');
            }

            throw new Error('Error de conexión');
        }
    },

    /**
     * ✅ VERIFICACIÓN SIMPLE - Usando endpoint GET /api/favoritos/is-favorite/{jikanId}
     * @param jikanId - ID de Jikan del anime
     */
    isFavorite: async (jikanId: number): Promise<boolean> => {
        try {
            console.log(`🔍 Verificación simple para JikanID: ${jikanId}`);

            // ✅ ENDPOINT SIMPLE que devuelve solo boolean
            const response = await api.get(`/favoritos/is-favorite/${jikanId}`);

            console.log('✅ Respuesta isFavorite:', response.data);

            // ✅ Este endpoint devuelve directamente boolean
            return response.data === true;

        } catch (error) {
            console.log(`⚠️ Error en verificación simple para JikanID ${jikanId}:`, error);

            if (isAxiosError(error)) {
                const status = error.response?.status;

                // Si es 401, propagar error
                if (status === 401) {
                    throw new Error('UNAUTHENTICATED');
                }
            }

            // Para cualquier otro error, asumir que no es favorito
            return false;
        }
    },

    /**
     * ✅ OBTENER MIS FAVORITOS - Con verificación de token
     */
    getMisFavoritos: async (page: number = 0, size: number = 20) => {
        try {
            console.log(`📋 Obteniendo favoritos - página ${page}, tamaño ${size}`);

            // ✅ VERIFICAR TOKEN ANTES DE LA LLAMADA
            const token = favoritoService._verifyToken();

            // ✅ VERIFICAR que el header de autorización esté configurado
            if (!api.defaults.headers.common['Authorization']) {
                console.log('🔧 Configurando header de autorización para favoritos');
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            }

            const response = await api.get('/favoritos/mis-favoritos', {
                params: { page, size }
            });

            console.log('✅ Favoritos obtenidos:', response.data);

            if (response.data.success) {
                return response.data.data;
            }

            throw new Error(response.data.message || 'Error al obtener favoritos');

        } catch (error) {
            console.error('❌ Error obteniendo favoritos:', error);

            // ✅ Si el error es de token, propagarlo
            if (error instanceof Error && error.message === 'UNAUTHENTICATED') {
                throw new Error('Debes iniciar sesión para ver tus favoritos');
            }

            if (isAxiosError(error)) {
                const status = error.response?.status;

                if (status === 401) {
                    throw new Error('Debes iniciar sesión para ver tus favoritos');
                }
            }

            throw new Error('Error al cargar favoritos');
        }
    },

    /**
     * ✅ MÉTODO ALIAS para compatibilidad (mismo que getMisFavoritos)
     */
    getFavoritosByUsuario: async (userId: number, page: number = 0, size: number = 20) => {
        // Este método es un alias para getMisFavoritos
        // No necesita userId porque usa el token del usuario autenticado
        return favoritoService.getMisFavoritos(page, size);
    },

    /**
     * ✅ ELIMINAR FAVORITO - Endpoint DELETE /api/favoritos/{jikanId}
     */
    removeFavorito: async (jikanId: number): Promise<string> => {
        try {
            console.log(`🗑️ Eliminando favorito para JikanID: ${jikanId}`);

            const response = await api.delete(`/favoritos/${jikanId}`);

            console.log('✅ Favorito eliminado:', response.data);

            if (response.data.success) {
                return response.data.message || 'Favorito eliminado correctamente';
            }

            throw new Error(response.data.message || 'Error al eliminar favorito');

        } catch (error) {
            console.error('❌ Error eliminando favorito:', error);

            if (isAxiosError(error)) {
                const status = error.response?.status;
                const message = error.response?.data?.message || error.message;

                if (status === 401) {
                    throw new Error('Debes iniciar sesión para eliminar favoritos');
                }

                if (status === 404) {
                    throw new Error('Favorito no encontrado');
                }

                throw new Error(message || 'Error al eliminar favorito');
            }

            throw new Error('Error de conexión');
        }
    }
};

/**
 * ✅ FUNCIÓN AUXILIAR: Verificar si es error de Axios
 */
function isAxiosError(error: unknown): error is AxiosError {
    return (typeof error === 'object' &&
        error !== null &&
        'isAxiosError' in error && (error as AxiosError).isAxiosError);
}

export default favoritoService;