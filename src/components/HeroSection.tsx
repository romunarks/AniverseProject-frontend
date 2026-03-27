// src/components/HeroSection.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Anime } from '../types';
import { FaPlay, FaHeart, FaInfoCircle } from 'react-icons/fa';

interface HeroSectionProps {
    anime: Anime | null;
    loading: boolean;
}

const HeroSection: React.FC<HeroSectionProps> = ({ anime, loading }) => {
    if (loading) {
        return (
            <div className="relative w-full h-[70vh] bg-gray-900 animate-pulse">
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/70 to-transparent"></div>
                <div className="container mx-auto px-4 h-full flex items-end pb-16">
                    <div className="w-full max-w-2xl">
                        <div className="h-8 w-64 bg-gray-800 rounded mb-4"></div>
                        <div className="h-4 w-32 bg-gray-800 rounded mb-6"></div>
                        <div className="h-20 w-full bg-gray-800 rounded mb-8"></div>
                        <div className="flex space-x-4">
                            <div className="h-12 w-32 bg-gray-800 rounded"></div>
                            <div className="h-12 w-32 bg-gray-800 rounded"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!anime) {
        return null;
    }

    // Asegurar que tenemos la URL de una imagen
    const heroImage = anime.imagenUrl || 'https://via.placeholder.com/1200x600?text=No+Image';

    return (
        <div className="relative w-full h-[70vh] overflow-hidden">
            {/* Imagen de fondo */}
            <div className="absolute inset-0 bg-center bg-cover" style={{ backgroundImage: `url(${heroImage})` }}>
                {/* Overlay con gradiente */}
                <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/70 to-transparent"></div>
            </div>

            {/* Contenido */}
            <div className="container mx-auto px-4 h-full flex items-end pb-16 relative z-10">
                <div className="w-full max-w-2xl">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">{anime.titulo}</h1>

                    <div className="flex flex-wrap gap-2 mb-4">
            <span className="px-3 py-1 bg-aniverse-purple-light rounded-full text-sm text-white">
              {anime.genero || 'Sin género'}
            </span>
                        {anime.anyo && (
                            <span className="px-3 py-1 bg-gray-800/80 rounded-full text-sm text-white">
                {anime.anyo}
              </span>
                        )}
                        {anime.temporada && (
                            <span className="px-3 py-1 bg-gray-800/80 rounded-full text-sm text-white">
                {anime.temporada.charAt(0).toUpperCase() + anime.temporada.slice(1)}
              </span>
                        )}
                        {anime.jikanId && (
                            <span className="px-3 py-1 bg-purple-900/80 rounded-full text-sm text-purple-300">
                API Externa
              </span>
                        )}
                    </div>

                    <p className="text-gray-300 mb-8 line-clamp-3">
                        {anime.descripcion || 'No hay descripción disponible para este anime.'}
                    </p>

                    <div className="flex flex-wrap gap-4">
                        <Link
                            to={`/anime/${anime.id}`}
                            className="flex items-center px-6 py-3 bg-aniverse-cyan hover:bg-aniverse-cyan/80 text-black font-semibold rounded-full transition-colors"
                        >
                            <FaPlay className="mr-2" /> Ver Detalles
                        </Link>
                        <button
                            className="flex items-center px-6 py-3 bg-gray-800/80 hover:bg-gray-700 text-white rounded-full transition-colors"
                        >
                            <FaHeart className="mr-2" /> Añadir a Favoritos
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HeroSection;