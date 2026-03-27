// src/components/ResenyaCard.tsx - Siguiendo el patrón de Aniverse
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaEdit, FaTrash, FaUser, FaCalendarAlt, FaEllipsisV } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { StarRatingDisplay } from './StarRating';
import {Resenya} from "../types";

interface ResenyaCardProps {
    resenya: Resenya;
    onEdit?: (resenya: Resenya) => void;
    onDelete?: (resenyaId: number) => void;
    showAnimeInfo?: boolean;
    className?: string;
}

export const ResenyaCard: React.FC<ResenyaCardProps> = ({
                                                            resenya,
                                                            onEdit,
                                                            onDelete,
                                                            showAnimeInfo = false,
                                                            className = ''
                                                        }) => {
    const { user } = useAuth();
    const [isExpanded, setIsExpanded] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const isOwner = user?.id === resenya.usuarioId;
    const maxContentLength = 200;
    const shouldTruncate = resenya.contenido.length > maxContentLength;

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleDelete = async () => {
        if (!onDelete || !window.confirm('¿Estás seguro de que quieres eliminar esta reseña?')) {
            return;
        }

        try {
            setIsDeleting(true);
            await onDelete(resenya.id);
        } catch (error) {
            console.error('Error al eliminar reseña:', error);
        } finally {
            setIsDeleting(false);
            setShowMenu(false);
        }
    };

    const displayContent = shouldTruncate && !isExpanded
        ? resenya.contenido.substring(0, maxContentLength) + '...'
        : resenya.contenido;

    return (
        <div className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-200 ${className}`}>
            {/* Header con información del usuario */}
            <div className="flex items-start justify-between p-4 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                    {/* Avatar del usuario */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-aniverse-purple to-aniverse-pink flex items-center justify-center text-white font-bold text-sm">
                        {resenya.usuarioNombre.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1">
                        {/* Nombre del usuario */}
                        <div className="flex items-center space-x-2">
                            <Link
                                to={`/profile/${resenya.usuarioId}`}
                                className="font-semibold text-gray-900 hover:text-aniverse-purple transition-colors"
                            >
                                {resenya.usuarioNombre}
                            </Link>
                            {isOwner && (
                                <span className="text-xs bg-aniverse-purple text-white px-2 py-0.5 rounded-full">
                                    Tu reseña
                                </span>
                            )}
                        </div>

                        {/* Información del anime si se debe mostrar */}
                        {showAnimeInfo && (
                            <Link
                                to={`/anime/${resenya.animeId}`}
                                className="text-sm text-gray-600 hover:text-aniverse-purple transition-colors"
                            >
                                {resenya.animeTitulo}
                            </Link>
                        )}

                        {/* Fecha */}
                        <div className="flex items-center space-x-1 text-xs text-gray-500 mt-1">
                            <FaCalendarAlt />
                            <span>{formatDate(resenya.fechaCreacion)}</span>
                            {resenya.fechaActualizacion && resenya.fechaActualizacion !== resenya.fechaCreacion && (
                                <span className="ml-2 text-yellow-600">• Editado</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Puntuación y menú de opciones */}
                <div className="flex items-center space-x-2">
                    <StarRatingDisplay
                        rating={resenya.puntuacion}
                        size="sm"
                        showNumber={false}
                    />
                    <div className="text-lg font-bold text-aniverse-pink">
                        {resenya.puntuacion.toFixed(1)}
                    </div>

                    {/* Menú de opciones para el propietario */}
                    {isOwner && (onEdit || onDelete) && (
                        <div className="relative">
                            <button
                                onClick={() => setShowMenu(!showMenu)}
                                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                                title="Opciones"
                            >
                                <FaEllipsisV className="text-gray-400" />
                            </button>

                            {showMenu && (
                                <div className="absolute right-0 mt-1 w-32 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                                    {onEdit && (
                                        <button
                                            onClick={() => {
                                                if (onEdit) {
                                                    onEdit(resenya);
                                                }
                                                setShowMenu(false);
                                            }}
                                            className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                        >
                                            <FaEdit className="text-blue-500" />
                                            <span>Editar</span>
                                        </button>
                                    )}
                                    {onDelete && (
                                        <button
                                            onClick={handleDelete}
                                            disabled={isDeleting}
                                            className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                                        >
                                            <FaTrash className="text-red-500" />
                                            <span>{isDeleting ? 'Eliminando...' : 'Eliminar'}</span>
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Contenido de la reseña */}
            <div className="p-4">
                <div className="prose prose-sm max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                        {displayContent}
                    </p>

                    {shouldTruncate && (
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="text-aniverse-purple hover:text-aniverse-purple-light font-medium text-sm mt-2 transition-colors"
                        >
                            {isExpanded ? 'Ver menos' : 'Ver más'}
                        </button>
                    )}
                </div>
            </div>

            {/* Footer con información adicional */}
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 rounded-b-lg">
                <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center space-x-4">
                        <span>Puntuación: {resenya.puntuacion}/10</span>
                        {/* Aquí podrías agregar likes, comentarios, etc. */}
                    </div>

                    {/* Botón para ver anime completo si se muestra info del anime */}
                    {showAnimeInfo && (
                        <Link
                            to={`/anime/${resenya.animeId}`}
                            className="text-aniverse-purple hover:text-aniverse-purple-light font-medium transition-colors"
                        >
                            Ver anime →
                        </Link>
                    )}
                </div>
            </div>

            {/* Overlay para cerrar menú cuando se hace clic fuera */}
            {showMenu && (
                <div
                    className="fixed inset-0 z-5"
                    onClick={() => setShowMenu(false)}
                />
            )}
        </div>
    );
};