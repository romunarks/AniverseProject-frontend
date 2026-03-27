// src/services/animeService.ts
import api from '../api';
import { Anime, AniverseResponse, PaginatedData } from '../types';
import { AxiosError } from 'axios';

/**
 * Servicio para gestionar todas las operaciones relacionadas con animes
 */
export const animeService = {
    /**
     * Obtiene datos para la página principal (home)
     * @returns Promise con datos categorizados del home
     */
    getHomeData: async (): Promise<{
        local: Anime[];
        trending: Anime[];
        recent: Anime[];
        topRated: Anime[];
    }> => {
        try {
            const response = await api.get<AniverseResponse<{
                local: Anime[];
                trending: Anime[];
                recent: Anime[];
                topRated: Anime[];
            }>>('/animes/home');

            if (response.data.success) {
                return response.data.data;
            }

            // Si falla, devolver estructura vacía
            return {
                local: [],
                trending: [],
                recent: [],
                topRated: []
            };
        } catch (error) {
            handleServiceError("Error obteniendo datos del home:", error);
            return {
                local: [],
                trending: [],
                recent: [],
                topRated: []
            };
        }
    },

    // al final del objeto exportado
    // src/services/animeService.ts
    getAnimesRecomendados: async (jikanId: number | string) => {
        if (!jikanId) return [];

        const res = await api.get<
            AniverseResponse<Anime[]>
        >(`/animes/${jikanId}/recomendados`);

        return res.data.success ? res.data.data : [];
    },

    /**
     * Obtiene animes por categoría específica
     * @param category Categoría ('trending', 'recent', 'top-rated')
     * @param limit Número máximo de animes a obtener
     * @returns Promise con lista de animes de la categoría
     */
    getAnimesByCategory: async (category: string, limit: number = 10): Promise<Anime[]> => {
        try {
            // Mapear categorías a endpoints correctos
            const endpoints: Record<string, string> = {
                'trending': '/animes/trending',
                'recent': '/animes/recent',
                'top-rated': '/animes/top-rated'
            };

            const endpoint = endpoints[category];
            if (!endpoint) {
                console.error(`Categoría no válida: ${category}`);
                return [];
            }

            const response = await api.get<AniverseResponse<Anime[]>>(`${endpoint}?limit=${limit}`);

            if (response.data.success) {
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
            return [];
        } catch (error) {
            handleServiceError(`Error en getAnimesByCategory(${category}):`, error);
            return [];
        }
    },

    /**
     * Obtiene animes en tendencia
     * @param limit Número de animes a obtener
     * @returns Promise con animes en tendencia
     */
    getTrendingAnimes: async (limit: number = 10): Promise<Anime[]> => {
        return animeService.getAnimesByCategory('trending', limit);
    },

    /**
     * Obtiene animes recientes
     * @param limit Número de animes a obtener
     * @returns Promise con animes recientes
     */
    getRecentAnimes: async (limit: number = 10): Promise<Anime[]> => {
        return animeService.getAnimesByCategory('recent', limit);
    },

    /**
     * Obtiene animes mejor puntuados
     * @param limit Número de animes a obtener
     * @returns Promise con animes mejor puntuados
     */
    getTopRatedAnimes: async (limit: number = 10): Promise<Anime[]> => {
        return animeService.getAnimesByCategory('top-rated', limit);
    },

    /**
     * Obtiene animes paginados (solo locales)
     * @param page Número de página (comenzando desde 0)
     * @param size Tamaño de la página
     * @param sortBy Campo por el que ordenar
     * @param direction Dirección del ordenamiento
     * @returns Promise con datos paginados de animes
     */
    getRealAnimesPaginated: async (
        page: number = 0,
        size: number = 10,
        sortBy: string = 'id',
        direction: string = 'desc'
    ): Promise<any> => {
        try {
            const response = await api.get<AniverseResponse<PaginatedData<Anime>>>(
                `/animes?page=${page}&size=${size}&sortBy=${sortBy}&direction=${direction}`
            );

            if (response.data && response.data.success) {
                return response.data.data;
            }
            throw new Error(response.data?.message || 'Error fetching paginated animes');
        } catch (error) {
            handleServiceError("Error en getRealAnimesPaginated:", error);
            return {
                numberOfElements: 0,
                pageable: undefined,
                sort: { empty: false, sorted: false, unsorted: false },
                content: [],
                totalElements: 0,
                totalPages: 0,
                size: size,
                number: page,
                first: true,
                last: true,
                empty: true
            };
        }
    },

    /**
     * Obtiene un anime destacado para mostrar en Hero section
     * @returns Promise con el anime destacado
     */
    getFeaturedAnime: async (): Promise<Anime> => {
        try {
            const response = await api.get<AniverseResponse<Anime>>('/animes/external/featured');

            if (response.data?.success && response.data.data) {
                return response.data.data;
            }

            throw new Error(response.data?.message || 'Formato de respuesta incorrecto');
        } catch (error) {
            handleServiceError('Error fetching featured anime:', error);

            // Devolver un anime por defecto para evitar errores en la UI
            return {
                id: null,
                jikanId: null,
                titulo: "No se pudo cargar el anime destacado",
                descripcion: "Por favor, intenta recargar la página.",
                genero: "",
                imagenUrl: "",
                puntuacionPromedio: 0,
                anyo: 0,
                temporada: ""
            };
        }
    },

    /**
     * Obtiene un anime por su ID (local)
     * @param id ID local del anime
     * @returns Promise con el anime encontrado
     */
    getAnimeById: async (id: number | string): Promise<Anime | null> => {
        if (!id || id === 'null' || id === 'undefined') {
            console.error("ID inválido:", id);
            throw new Error("ID de anime inválido");
        }

        try {
            const response = await api.get<AniverseResponse<Anime>>(`/animes/${id}`);

            if (response.data?.success) {
                return response.data.data;
            }

            throw new Error(response.data?.message || 'Error al obtener anime');
        } catch (error) {
            handleServiceError(`Error al obtener anime con ID ${id}:`, error);
            throw error;
        }
    },

    /**
     * Obtiene un anime por su ID de Jikan/MAL
     * @param jikanId ID de Jikan/MAL
     * @returns Promise con el anime encontrado
     */
    getAnimeByJikanId: async (jikanId: number | string): Promise<Anime | null> => {
        if (!jikanId || jikanId === 'null' || jikanId === 'undefined') {
            console.error("Jikan ID inválido:", jikanId);
            throw new Error("Jikan ID de anime inválido");
        }

        try {
            const response = await api.get<AniverseResponse<Anime>>(`/animes/external/${jikanId}`);

            if (response.data?.success) {
                return response.data.data;
            }

            throw new Error(response.data?.message || 'Error al obtener anime por Jikan ID');
        } catch (error) {
            handleServiceError(`Error al obtener anime con Jikan ID ${jikanId}:`, error);
            throw error;
        }
    },

    /**
     * Busca animes (local y externo)
     * @param query Término de búsqueda
     * @param page Número de página (desde 0)
     * @param includeExternal Incluir resultados de APIs externas
     * @returns Promise con datos paginados de la búsqueda
     */
    searchAnimes: async (
        query: string,
        page: number = 0,
        includeExternal: boolean = true
    ): Promise<{
        number: number;
        numberOfElements: number;
        size: number;
        last: boolean;
        totalPages: number;
        pageable: undefined;
        sort: { unsorted: boolean; sorted: boolean; empty: boolean };
        content: any[];
        first: boolean;
        totalElements: number;
        empty: boolean
    }> => {
        try {
            const params = new URLSearchParams({
                titulo: query,
                page: page.toString(),
                size: '12',
                includeExternal: includeExternal.toString()
            });

            const response = await api.get<AniverseResponse<PaginatedData<Anime>>>(
                `/animes/buscar?${params.toString()}`
            );

            if (response.data?.success) {
                return response.data.data;
            }

            throw new Error(response.data?.message || 'Error searching animes');
        } catch (error) {
            handleServiceError("Error en searchAnimes:", error);
            return {
                numberOfElements: 0, pageable: undefined, sort: {empty: false, sorted: false, unsorted: false},
                content: [],
                totalElements: 0,
                totalPages: 0,
                size: 12,
                number: page,
                first: true,
                last: true,
                empty: true
            };
        }
    },

    /**
     * Busca animes solo en fuentes externas
     * @param query Término de búsqueda
     * @returns Promise con lista de animes externos encontrados
     */
    searchExternalAnimes: async (query: string): Promise<Anime[]> => {
        try {
            const response = await api.get<AniverseResponse<Anime[]>>(
                `/animes/external/search?query=${encodeURIComponent(query)}`
            );

            if (response.data?.success && Array.isArray(response.data.data)) {
                return response.data.data;
            }

            throw new Error(response.data?.message || 'Error searching external animes');
        } catch (error) {
            handleServiceError("Error en searchExternalAnimes:", error);
            return [];
        }
    },

    /**
     * Genera la URL para la página de detalles de un anime
     * @param anime Objeto anime con ID o jikanId
     * @returns URL para la página de detalles
     */
    getAnimeDetailUrl: (anime: Anime): string => {
        // Si tiene ID local, usamos esa URL
        if (anime.id && anime.id > 0) {
            return `/anime/${anime.id}`;
        }
        // Si solo tiene jikanId, usamos ese
        else if (anime.jikanId) {
            return `/anime/external/${anime.jikanId}`; // ✅ CORREGIDO: era /mal/ ahora /external/
        }
        else {
            console.error("Anime sin identificador:", anime);
            return "/not-found";
        }
    },

    /**
     * Guarda un anime externo en la biblioteca local
     * @param animeData Datos del anime a guardar
     * @returns Promise con el anime guardado
     */
    saveExternalAnime: async (animeData: Partial<Anime>): Promise<Anime | null> => {
        try {
            if (!animeData.jikanId || !animeData.titulo) {
                throw new Error("Se requiere jikanId y título para guardar un anime externo");
            }

            const response = await api.post<AniverseResponse<Anime>>('/animes/save-external', {
                jikanId: animeData.jikanId,
                titulo: animeData.titulo,
                descripcion: animeData.descripcion || '',
                genero: animeData.genero || '',
                anyo: animeData.anyo || null,
                temporada: animeData.temporada || '',
                imagenUrl: animeData.imagenUrl || ''
            });

            if (response.data?.success) {
                return response.data.data;
            }

            throw new Error(response.data?.message || 'Error al guardar anime externo');
        } catch (error) {
            handleServiceError("Error guardando anime externo:", error);
            throw getErrorMessage(error);
        }
    }
};

// Funciones auxiliares (mantener las mismas)
function handleServiceError(context: string, error: unknown): void {
    if (isAxiosError(error)) {
        console.error(context, error.message, 'Status:', error.response?.status, 'Data:', error.response?.data);
    } else if (error instanceof Error) {
        console.error(context, error.message);
    } else {
        console.error(context, error);
    }
}

// Continuación de animeService.ts - Funciones auxiliares

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