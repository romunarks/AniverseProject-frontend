// src/types/index.ts (updated) - Agregando interfaces de reseñas

export interface Usuario {
    id: number;
    nombre: string;
    email: string;
    roles: string[];
    seguidoresCount?: number;
    siguiendoCount?: number;
    siguiendoPorUsuarioActual?: boolean;
}

export interface Pageable {
    pageNumber: number;
    pageSize: number;
    sort: {
        empty: boolean;
        sorted: boolean;
        unsorted: boolean;
    };
    offset: number;
    paged: boolean;
    unpaged: boolean;
}
// Agregar a types/index.ts
export interface FavoritoToggleResponse {
    action: 'added' | 'removed';
    isFavorite: boolean;
    message: string;
    favoritoId?: number;
    animeId: number;
    animeTitulo: string;
}

export interface AnimeFavoritoParaResenar {
    id: number;
    jikanId?: number;
    titulo: string;
    imagenUrl?: string;
    yaReseno: boolean;
    resenyaId?: number;
}

export interface PaginatedData<T> {
    content: T[];
    pageable: Pageable;
    last: boolean;
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
    sort: {
        empty: boolean;
        sorted: boolean;
        unsorted: boolean;
    };
    first: boolean;
    numberOfElements: number;
    empty: boolean;
}

export interface Anime {
    id?: number | null;
    jikanId?: number | null;
    titulo: string;
    descripcion?: string;
    genero?: string;
    imagenUrl?: string;
    puntuacionPromedio?: number;
    totalResenyas?: number; // ⭐ NUEVO: Total de reseñas
    anyo?: number;
    temporada?: string;
}

export interface AniverseResponse<T> {
    success: boolean;
    message: string;
    data: T;
    timestamp: number;
}

export interface LoginRequest {
    email: string;
    contrasenya: string;
}

export interface RegisterRequest {
    nombre: string;
    email: string;
    contrasenya: string;
}

export interface LoginResponse {
    token: string;
    refreshToken: string;
    user: Usuario;
}

export interface Favorito {
    id: number;
    usuarioId: number;
    usuarioNombre: string;
    animeId: number;
    animeTitulo: string;
    anime: Anime;
}

// ⭐ INTERFACES ACTUALIZADAS DE RESEÑAS
export interface Resenya {
    id: number;
    usuarioId: number;
    usuarioNombre: string;
    animeId: number;
    animeTitulo: string;
    contenido: string;
    puntuacion: number; // ⭐ NUEVO: Puntuación 1-10
    fechaCreacion: string;
    fechaActualizacion?: string; // ⭐ NUEVO
    anime?: Anime; // Opcional para compatibilidad
}

// ⭐ NUEVAS INTERFACES PARA RESEÑAS
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
    totalComentarios: number;
}

export interface ResenyaCrear {
    animeId?: number;
    jikanId?: number;
    contenido: string;
    puntuacion: number;
}

export interface ResenyaActualizar {
    contenido?: string;
    puntuacion?: number;
}

export interface EstadisticasResenya {
    animeId: number;
    puntuacionPromedio: number;
    totalResenyas: number;
}

export interface Votacion {
    id: number;
    puntuacion: number;
    usuarioId: number;
    animeId: number;
}

export interface EstadisticasDTO {
    totalAnimes: number;
    totalUsuarios: number;
    totalResenyas: number;
    totalVotaciones: number;
    puntuacionPromedio: number;
    distribucionGeneros: GeneroEstadisticaDTO[];
    distribucionAnyos: AnyoEstadisticaDTO[];
}

export interface GeneroEstadisticaDTO {
    genero: string;
    cantidad: number;
    porcentaje: number;
}

export interface AnyoEstadisticaDTO {
    anyo: number;
    cantidad: number;
}

// Additional user stats interface for ProfilePage
export interface UserStats {
    favoritosCount: number;
    resenyasCount: number; // ⭐ YA EXISTÍA - Perfecto!
    votacionesCount: number;
    promedioPuntuacion: number;
    animesFavoritos: string[];
    generosFavoritos: { genero: string; count: number }[];
}

// Additional editable profile interface for ProfilePage
export interface EditableProfile {
    nombre: string;
    email: string;
}