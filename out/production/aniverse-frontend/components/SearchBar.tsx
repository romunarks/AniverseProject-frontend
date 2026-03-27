// src/components/SearchBar.tsx - VERSIÓN OPTIMIZADA
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaTimes } from 'react-icons/fa';
import { animeService } from '../services/animeService';
import { Anime } from '../types';

// Extender el tipo Anime para incluir puntuación de relevancia en búsqueda
type AnimeWithRelevance = Anime & {
    relevanceScore?: number;
};

export const SearchBar: React.FC = () => {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<AnimeWithRelevance[]>([]);
    const [loading, setLoading] = useState(false);
    const [focus, setFocus] = useState(false);
    const navigate = useNavigate();
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const searchRef = useRef<HTMLDivElement>(null);

    // Manejar clics fuera del componente para cerrar sugerencias
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setFocus(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Lógica de búsqueda y filtrado optimizada
    useEffect(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        if (query.trim().length < 2) {
            setSuggestions([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        timeoutRef.current = setTimeout(async () => {
            try {
                const localResultsResponse = await animeService.searchAnimes(query);
                const externalResults = await animeService.searchExternalAnimes(query);

                const localAnimes = Array.isArray(localResultsResponse?.content) ? localResultsResponse.content : [];
                const externalAnimes = Array.isArray(externalResults) ? externalResults : [];

                // Función para calcular relevancia (0-1) basada en coincidencia de texto
                const calculateRelevance = (title: string, searchQuery: string) => {
                    if (!title) return 0;
                    const normalizedTitle = title.toLowerCase();
                    const normalizedQuery = searchQuery.toLowerCase();

                    // Coincidencia exacta (mayor prioridad)
                    if (normalizedTitle === normalizedQuery) return 1;

                    // Coincidencia al inicio (segunda prioridad)
                    if (normalizedTitle.startsWith(normalizedQuery)) return 0.9;

                    // Coincidencia de palabras completas (tercera prioridad)
                    const words = normalizedTitle.split(/\s+/);
                    if (words.some(word => word === normalizedQuery)) return 0.8;

                    // Coincidencia parcial (cuarta prioridad)
                    if (normalizedTitle.includes(normalizedQuery)) return 0.7;

                    // Coincidencia parcial de palabras (quinta prioridad)
                    if (words.some(word => word.includes(normalizedQuery))) return 0.5;

                    // Coincidencia baja
                    return 0.1;
                };

                // Asignar puntaje de relevancia a cada resultado
                const scoredLocalAnimes = localAnimes.map(anime => ({
                    ...anime,
                    relevanceScore: calculateRelevance(anime.titulo, query)
                }));

                const scoredExternalAnimes = externalAnimes.map(anime => ({
                    ...anime,
                    relevanceScore: calculateRelevance(anime.titulo, query)
                }));

                // Combinar resultados evitando duplicados
                const combined = new Map();

                // Agregar animes locales
                scoredLocalAnimes.forEach(anime => {
                    if (anime.id) combined.set(anime.id, anime);
                });

                // Agregar animes externos (evitando duplicados con jikanId)
                scoredExternalAnimes.forEach(anime => {
                    if (!anime.jikanId) return; // Ignorar externos sin jikanId

                    // Verificar si ya existe un local con mismo jikanId
                    let isDuplicate = false;
                    for (const [key, value] of combined.entries()) {
                        if (value.jikanId && value.jikanId === anime.jikanId) {
                            isDuplicate = true;
                            break;
                        }
                    }

                    if (!isDuplicate) {
                        combined.set(`external-${anime.jikanId}`, anime);
                    }
                });

                // Convertir a array, ordenar por relevancia y limitar a 7 resultados
                const combinedResults = Array.from(combined.values())
                    .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
                    .filter(anime => (anime.relevanceScore || 0) > 0.2) // Filtrar resultados de baja relevancia
                    .slice(0, 7);

                setSuggestions(combinedResults);
            } catch (error) {
                console.error('Error en búsqueda:', error);
                setSuggestions([]);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [query]);

    // Manejar envío del formulario de búsqueda
    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            navigate(`/search?q=${encodeURIComponent(query.trim())}`);
            setFocus(false);
            setSuggestions([]);
        }
    };

    return (
        <div className="relative" ref={searchRef}>
            <form onSubmit={handleSearchSubmit} className="flex items-center">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setFocus(true)}
                    placeholder="Buscar animes..."
                    className="w-full bg-gray-800 text-white py-2 pl-10 pr-10 rounded-full border border-gray-700 focus:outline-none focus:border-aniverse-cyan"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaSearch className="text-gray-400" />
                </div>
                {query && (
                    <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => {
                            setQuery('');
                            setSuggestions([]);
                        }}
                    >
                        <FaTimes className="text-gray-400 hover:text-white" />
                    </button>
                )}
            </form>

            {/* SECCIÓN DE SUGERENCIAS OPTIMIZADA */}
            {focus && (query.length >= 2 || (suggestions.length > 0 && !loading)) && (
                <div className="absolute z-50 mt-2 w-full bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700 max-h-96 overflow-y-auto">
                    {loading && (
                        <div className="p-4 text-center text-gray-400">
                            <div className="inline-block animate-spin h-4 w-4 border-t-2 border-gray-400 rounded-full mr-2"></div>
                            Buscando...
                        </div>
                    )}

                    {!loading && suggestions.length > 0 && (
                        <ul>
                            {suggestions.map((anime, index) => {
                                // Generar key única usando múltiples propiedades
                                const uniqueKey = anime.id?.toString() ||
                                    `external-${anime.jikanId}` ||
                                    `suggestion-${anime.titulo}-${index}`;

                                // Determinar la URL de destino correctamente
                                let detailPagePath = '';

                                // Si tiene ID local válido, usamos la ruta local
                                if (anime.id && anime.id > 0) {
                                    detailPagePath = `/anime/${anime.id}`;
                                }
                                // Si tiene jikanId válido, usamos la ruta externa
                                else if (anime.jikanId && anime.jikanId > 0) {
                                    detailPagePath = `/anime/external/${anime.jikanId}`;
                                }

                                // Si no hay ruta válida, mostramos elemento no navegable
                                if (!detailPagePath) {
                                    return (
                                        <li key={uniqueKey} className="px-4 py-3 text-gray-500 border-b border-gray-700 last:border-b-0">
                                            {anime.titulo || 'Anime desconocido'} (No navegable)
                                        </li>
                                    );
                                }

                                // Mostrar score de relevancia en desarrollo (quitar en producción)
                                const relevanceLabel = anime.relevanceScore
                                    ? `(${(anime.relevanceScore * 100).toFixed(0)}% relevante)`
                                    : '';

                                // Renderizado normal para elementos navegables
                                return (
                                    <li key={uniqueKey} className="border-b border-gray-700 last:border-b-0">
                                        <button
                                            onClick={() => {
                                                if (detailPagePath) {
                                                    navigate(detailPagePath);
                                                    setFocus(false);
                                                    setQuery('');
                                                    setSuggestions([]);
                                                }
                                            }}
                                            className="w-full text-left px-4 py-3 hover:bg-gray-700 flex items-center space-x-3"
                                        >
                                            <div className="w-10 h-14 flex-shrink-0 bg-gray-700 rounded">
                                                <img
                                                    src={anime.imagenUrl || 'https://via.placeholder.com/40x56?text=?'}
                                                    alt={anime.titulo}
                                                    className="w-full h-full object-cover rounded"
                                                    onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/40x56?text=Err')}
                                                />
                                            </div>
                                            <div className="flex-grow min-w-0">
                                                <p className="text-white font-medium truncate">
                                                    {anime.titulo}
                                                    {/* Remover en producción, solo para debugging */}
                                                    {process.env.NODE_ENV === 'development' &&
                                                        <span className="text-xs text-gray-500 ml-1">
                                                       {relevanceLabel}
                                                     </span>
                                                    }
                                                </p>
                                                <p className="text-xs text-gray-400 truncate">{anime.genero || 'N/A'}</p>
                                            </div>
                                            {anime.jikanId && !anime.id && (
                                                <span className="ml-auto flex-shrink-0 text-xs bg-purple-900 text-purple-300 px-1.5 py-0.5 rounded">API</span>
                                            )}
                                            {anime.id && (
                                                <span className="ml-auto flex-shrink-0 text-xs bg-green-900 text-green-300 px-1.5 py-0.5 rounded">Local</span>
                                            )}
                                        </button>
                                    </li>
                                );
                            })}

                            {/* Botón "Ver todos los resultados" */}
                            <li className="border-t border-gray-700">
                                <button
                                    onClick={() => {
                                        navigate(`/search?q=${encodeURIComponent(query.trim())}`);
                                        setFocus(false);
                                        setSuggestions([]);
                                    }}
                                    className="w-full text-center py-3 text-aniverse-cyan hover:bg-gray-700 font-medium"
                                >
                                    Ver todos los resultados para "{query}"
                                </button>
                            </li>
                        </ul>
                    )}

                    {!loading && suggestions.length === 0 && query.length >= 2 && (
                        <div className="p-4 text-center text-gray-400">
                            No se encontraron resultados para "{query}"
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};