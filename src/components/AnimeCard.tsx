// src/components/AnimeCard.tsx - Versión actualizada
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Anime } from '../types';
import { FavoriteButton } from './FavoriteButton';
import { RatingComponent } from './RatingComponent';
import { FaStar, FaEye } from 'react-icons/fa';

interface AnimeCardProps {
    anime: Anime;
    showFavoriteButton?: boolean;
    showRating?: boolean;
    className?: string;
}

const AnimeCard: React.FC<AnimeCardProps> = ({
                                                 anime,
                                                 showFavoriteButton = true,
                                                 showRating = true,
                                                 className = ''
                                             }) => {
    const [imageError, setImageError] = useState(false);
    const [imageLoading, setImageLoading] = useState(true);

    // Determinar la URL correcta según si es anime local o externo
    const getAnimeUrl = () => {
        if (anime.jikanId && !anime.id) {
            // Es un anime externo (solo tiene jikanId)
            return `/anime/external/${anime.jikanId}`;
        } else if (anime.id) {
            // Es un anime local (tiene id de base de datos)
            return `/anime/${anime.id}`;
        } else {
            // Fallback, aunque no debería ocurrir
            return `/anime/${anime.jikanId || anime.id}`;
        }
    };

    const handleImageLoad = () => {
        setImageLoading(false);
    };

    const handleImageError = () => {
        setImageError(true);
        setImageLoading(false);
    };

    // Renderizar imagen con fallback
    const renderImage = () => {
        if (imageError || !anime.imagenUrl) {
            return (
                <div className="w-full h-full bg-gradient-to-br from-aniverse-purple to-aniverse-pink flex items-center justify-center">
                    <div className="text-center text-white p-4">
                        <FaEye className="mx-auto mb-2 text-2xl opacity-60" />
                        <span className="text-sm font-medium opacity-80">No imagen</span>
                    </div>
                </div>
            );
        }

        return (
            <>
                {imageLoading && (
                    <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-aniverse-purple border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}
                <img
                    src={anime.imagenUrl}
                    alt={anime.titulo}
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                    className={`w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300 ${
                        imageLoading ? 'opacity-0' : 'opacity-100'
                    }`}
                />
            </>
        );
    };

    return (
        <div className={`group relative bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 ${className}`}>
            <Link to={getAnimeUrl()} className="block">
                {/* Imagen del anime */}
                <div className="aspect-[3/4] relative overflow-hidden bg-gray-100">
                    {renderImage()}

                    {/* Overlay con información adicional */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                            <div className="text-white">
                                {anime.genero && (
                                    <span className="inline-block bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium mb-2">
                                        {anime.genero}
                                    </span>
                                )}
                                {anime.anyo && (
                                    <div className="text-xs opacity-90">
                                        {anime.anyo}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Indicadores en esquinas */}
                    <div className="absolute top-2 right-2 flex flex-col gap-2">
                        {/* Indicador de fuente (API externa vs local) */}
                        {anime.jikanId && !anime.id && (
                            <span className="bg-purple-600/90 text-white text-xs px-2 py-1 rounded-full font-medium backdrop-blur-sm">
                                API
                            </span>
                        )}

                        {/* Puntuación promedio */}
                        {anime.puntuacionPromedio && anime.puntuacionPromedio > 0 && (
                            <div className="bg-yellow-500/90 text-white text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1 backdrop-blur-sm">
                                <FaStar className="text-xs" />
                                {anime.puntuacionPromedio.toFixed(1)}
                            </div>
                        )}
                    </div>

                    {/* Botón de favoritos en esquina superior izquierda */}
                    {showFavoriteButton && (
                        <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <FavoriteButton
                                animeId={anime.id}
                                jikanId={anime.jikanId}
                                animeTitulo={anime.titulo}
                                size="sm"
                                className="bg-white/90 backdrop-blur-sm border-0 hover:bg-white shadow-md"
                            />
                        </div>
                    )}
                </div>

                {/* Información del anime */}
                <div className="p-3">
                    <h3 className="font-semibold text-gray-800 line-clamp-4 group-hover:text-aniverse-purple transition-colors duration-200 mb-2">
                        {anime.titulo}
                    </h3>

                    {/* Descripción truncada */}
                    {anime.descripcion && (
                        <p className="text-gray-600 text-sm line-clamp-4 mb-3">
                            {anime.descripcion}
                        </p>
                    )}

                    {/* Rating component */}
                    {showRating && (
                        <div className="flex items-center justify-between">
                            <RatingComponent
                                animeId={anime.id}
                                jikanId={anime.jikanId}
                                size="sm"
                                showAverage={true}
                                averageRating={anime.puntuacionPromedio}
                                className="flex-1"
                            />

                            {/* Información adicional */}
                            <div className="text-xs text-gray-500 ml-2">
                                {anime.temporada && (
                                    <span className="capitalize">{anime.temporada}</span>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </Link>

            {/* Hover effect adicional */}
            <div className="absolute inset-0 ring-2 ring-aniverse-purple ring-opacity-0 group-hover:ring-opacity-50 transition-all duration-300 rounded-lg pointer-events-none"></div>
        </div>
    );
};

export default AnimeCard;