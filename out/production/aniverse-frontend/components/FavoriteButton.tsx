// src/components/FavoriteButton.tsx - VERSIÓN FINAL ARREGLADA
import React, { useState, useEffect } from 'react';
import { FaHeart, FaRegHeart, FaSpinner } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { favoritoService } from '../services/favoritoService';

interface FavoriteButtonProps {
    animeId?: number;
    jikanId?: number;
    animeTitulo?: string;
    imagenUrl?: string;
    initialIsFavorite?: boolean;
    onToggle?: (isFavorite: boolean) => void;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
    showText?: boolean;
    variant?: 'filled' | 'outlined' | 'minimal';
}

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({
                                                                  animeId,
                                                                  jikanId,
                                                                  animeTitulo = '',
                                                                  imagenUrl,
                                                                  initialIsFavorite = false,
                                                                  onToggle,
                                                                  className = '',
                                                                  size = 'md',
                                                                  showText = false,
                                                                  variant = 'filled'
                                                              }) => {
    const { isAuthenticated, user, loading } = useAuth(); // ✅ Agregar loading
    const navigate = useNavigate();

    const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
    const [buttonLoading, setButtonLoading] = useState(false); // ✅ Cambiar nombre para evitar conflicto
    const [error, setError] = useState<string | null>(null);
    const [showTooltip, setShowTooltip] = useState(false);

    // ✅ VERIFICAR FAVORITO - Solo si está autenticado Y tiene jikanId Y no está loading
    useEffect(() => {
        const checkFavoriteStatus = async () => {
            console.log(`🔍 FavoriteButton useEffect - Loading: ${loading}, Auth: ${isAuthenticated}, User: ${!!user}, JikanID: ${jikanId}`);

            // ✅ VERIFICACIÓN CRÍTICA: NO hacer nada mientras está loading
            if (loading) {
                console.log('⏳ AuthContext aún está cargando, esperando...');
                return;
            }

            // ✅ VERIFICACIÓN ESTRICTA: debe estar autenticado Y tener usuario
            if (!isAuthenticated || !user) {
                console.log('❌ NO autenticado o sin usuario, estableciendo como no favorito');
                setIsFavorite(false);
                return;
            }

            // ✅ Verificar que el token existe
            const token = localStorage.getItem('token');
            if (!token) {
                console.log('❌ No hay token, estableciendo como no favorito');
                setIsFavorite(false);
                return;
            }

            // ✅ Necesitamos jikanId para el backend
            if (!jikanId) {
                console.log('⚠️ FavoriteButton: No hay jikanId disponible para verificar favorito');
                setIsFavorite(false);
                return;
            }

            try {
                console.log(`✅ TODAS LAS VALIDACIONES PASADAS - Verificando favorito para JikanID: ${jikanId}`);

                // ✅ Usar método correcto con jikanId
                const result = await favoritoService.checkFavorito(jikanId);
                setIsFavorite(result.isFavorite);

                console.log(`✅ Resultado: ${result.isFavorite ? 'ES favorito' : 'NO es favorito'}`);
            } catch (error: any) {
                console.log('⚠️ Error verificando favorito:', error.message);

                // ✅ Si es error de autenticación, NO mostrar error
                if (error.message === 'UNAUTHENTICATED') {
                    console.log('🔒 Error de autenticación, estableciendo como no favorito');
                    setIsFavorite(false);
                    return;
                }

                // ✅ Para otros errores, asumir que no es favorito
                setIsFavorite(false);
            }
        };

        // ✅ Solo ejecutar después de un delay pequeño para evitar renders múltiples
        const timeoutId = setTimeout(checkFavoriteStatus, 100);
        return () => clearTimeout(timeoutId);
    }, [loading, isAuthenticated, user, jikanId]); // ✅ Incluir loading como dependencia

    // ✅ TOGGLE FAVORITO
    const handleToggleFavorite = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // ✅ Verificar autenticación
        if (!isAuthenticated) {
            console.log('🔒 Usuario no autenticado, redirigiendo a login');
            navigate('/login');
            return;
        }

        // ✅ Necesitamos jikanId para el backend
        if (!jikanId) {
            setError('No se puede procesar el favorito: falta JikanID del anime');
            setTimeout(() => setError(null), 3000);
            return;
        }

        setButtonLoading(true);
        setError(null);

        try {
            console.log(`🔄 Toggle favorito para JikanID: ${jikanId}`);

            // ✅ Preparar datos adicionales del anime
            const animeData = {
                titulo: animeTitulo,
                imagenUrl: imagenUrl
            };

            // ✅ Llamada correcta al toggle
            const result = await favoritoService.toggleFavorito(jikanId, animeData);

            console.log('✅ Resultado toggle:', result);

            // ✅ Actualizar estado basado en la respuesta
            setIsFavorite(result.isFavorite);

            // ✅ Callback
            if (onToggle) {
                onToggle(result.isFavorite);
            }

            // ✅ Mostrar confirmación
            setShowTooltip(true);
            setTimeout(() => setShowTooltip(false), 2000);

        } catch (err: any) {
            console.error('❌ Error en toggle favorito:', err);

            const errorMessage = err.message || 'Error al modificar favoritos';
            setError(errorMessage);
            setTimeout(() => setError(null), 3000);
        } finally {
            setButtonLoading(false);
        }
    };

    // ✅ ESTILOS (mantener los mismos)
    const getSizeClasses = () => {
        switch (size) {
            case 'sm':
                return {
                    button: 'p-2 text-sm',
                    icon: 'text-sm',
                    text: 'text-xs'
                };
            case 'lg':
                return {
                    button: 'p-4 text-lg',
                    icon: 'text-xl',
                    text: 'text-base'
                };
            default: // md
                return {
                    button: 'p-3 text-base',
                    icon: 'text-lg',
                    text: 'text-sm'
                };
        }
    };

    const getVariantClasses = () => {
        const baseClasses = 'transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2';

        switch (variant) {
            case 'outlined':
                return `${baseClasses} border-2 bg-white hover:bg-gray-50 ${
                    isFavorite
                        ? 'border-red-500 text-red-500 focus:ring-red-500'
                        : 'border-gray-300 text-gray-500 hover:border-red-300 hover:text-red-500 focus:ring-gray-500'
                }`;
            case 'minimal':
                return `${baseClasses} bg-transparent hover:bg-gray-100 ${
                    isFavorite
                        ? 'text-red-500'
                        : 'text-gray-400 hover:text-red-500'
                }`;
            default: // filled
                return `${baseClasses} border-2 ${
                    isFavorite
                        ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100 focus:ring-red-500'
                        : 'bg-white border-gray-200 text-gray-500 hover:bg-red-50 hover:border-red-200 hover:text-red-500 focus:ring-gray-500'
                }`;
        }
    };

    const sizeClasses = getSizeClasses();
    const variantClasses = getVariantClasses();

    // ✅ Si AuthContext está loading, mostrar spinner
    if (loading) {
        return (
            <div className="relative inline-block">
                <button
                    disabled
                    className={`
                        ${getSizeClasses().button}
                        ${className}
                        rounded-lg flex items-center gap-2 font-medium
                        bg-gray-100 text-gray-400 border-2 border-gray-200
                        cursor-not-allowed
                    `}
                    title="Cargando..."
                >
                    <FaSpinner className={`${getSizeClasses().icon} animate-spin`} />
                    {showText && (
                        <span className={getSizeClasses().text}>Cargando...</span>
                    )}
                </button>
            </div>
        );
    }

    // ✅ Si no está autenticado, mostrar botón deshabilitado
    if (!isAuthenticated) {
        return (
            <div className="relative inline-block">
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        navigate('/login');
                    }}
                    className={`
                        ${sizeClasses.button}
                        ${className}
                        rounded-lg flex items-center gap-2 font-medium
                        bg-gray-200 text-gray-400 border-2 border-gray-300
                        hover:bg-gray-300 hover:text-gray-500 transition-colors
                    `}
                    title="Inicia sesión para agregar a favoritos"
                >
                    <FaRegHeart className={sizeClasses.icon} />
                    {showText && (
                        <span className={sizeClasses.text}>Inicia sesión</span>
                    )}
                </button>
            </div>
        );
    }

    // ✅ Si no hay jikanId, no mostrar el botón
    if (!jikanId) {
        return (
            <div className="relative inline-block">
                <button
                    disabled
                    className={`
                        ${sizeClasses.button}
                        ${className}
                        rounded-lg flex items-center gap-2 font-medium
                        bg-gray-100 text-gray-300 border-2 border-gray-200
                        cursor-not-allowed
                    `}
                    title="Anime no disponible para favoritos"
                >
                    <FaRegHeart className={sizeClasses.icon} />
                    {showText && (
                        <span className={sizeClasses.text}>No disponible</span>
                    )}
                </button>
            </div>
        );
    }

    return (
        <div className="relative inline-block">
            <button
                onClick={handleToggleFavorite}
                disabled={buttonLoading} // ✅ Usar buttonLoading
                className={`
                    ${sizeClasses.button}
                    ${variantClasses}
                    ${className}
                    ${buttonLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    rounded-lg flex items-center gap-2 font-medium
                `}
                title={
                    buttonLoading
                        ? 'Procesando...'
                        : isFavorite
                            ? 'Remover de favoritos'
                            : 'Agregar a favoritos'
                }
                onMouseEnter={() => !buttonLoading && setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
            >
                {buttonLoading ? ( // ✅ Usar buttonLoading
                    <FaSpinner className={`${sizeClasses.icon} animate-spin`} />
                ) : (
                    <>
                        {isFavorite ? (
                            <FaHeart className={`${sizeClasses.icon}`} />
                        ) : (
                            <FaRegHeart className={`${sizeClasses.icon}`} />
                        )}
                        {showText && (
                            <span className={sizeClasses.text}>
                                {isFavorite ? 'En Favoritos' : 'Agregar'}
                            </span>
                        )}
                    </>
                )}
            </button>

            {/* Tooltip de confirmación */}
            {showTooltip && !error && !buttonLoading && ( // ✅ Usar buttonLoading
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-black text-white text-xs rounded-md whitespace-nowrap z-10 opacity-90">
                    {isFavorite
                        ? '❤️ Agregado a favoritos'
                        : '💔 Removido de favoritos'
                    }
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black"></div>
                </div>
            )}

            {/* Mensaje de error */}
            {error && (
                <div className="absolute top-full left-0 mt-1 px-3 py-2 bg-red-100 border border-red-300 text-red-700 text-xs rounded-md z-20 whitespace-nowrap shadow-lg">
                    {error}
                    <div className="absolute bottom-full left-4 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-red-100"></div>
                </div>
            )}
        </div>
    );
};