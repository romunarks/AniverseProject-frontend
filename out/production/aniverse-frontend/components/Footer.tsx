// src/components/Footer.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { FaGithub, FaTwitter, FaEnvelope, FaHeart } from 'react-icons/fa';

export const Footer: React.FC = () => {
    return (
        <footer className="bg-gray-900 border-t border-gray-800">
            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div>
                        <h3 className="text-xl font-bold text-white mb-4">
                            <span className="text-aniverse-cyan">ANI</span>VERSE
                        </h3>
                        <p className="text-gray-400 text-sm">
                            Tu plataforma para descubrir y seguir tus animes favoritos. Explora, califica y comparte tu pasión por el anime.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-white font-semibold mb-4">Explorar</h4>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link to="/animes" className="text-gray-400 hover:text-aniverse-cyan transition-colors">
                                    Catálogo
                                </Link>
                            </li>
                            <li>
                                <Link to="/trending" className="text-gray-400 hover:text-aniverse-cyan transition-colors">
                                    Trending
                                </Link>
                            </li>
                            <li>
                                <Link to="/genre/action" className="text-gray-400 hover:text-aniverse-cyan transition-colors">
                                    Acción
                                </Link>
                            </li>
                            <li>
                                <Link to="/genre/romance" className="text-gray-400 hover:text-aniverse-cyan transition-colors">
                                    Romance
                                </Link>
                            </li>
                            <li>
                                <Link to="/genre/comedy" className="text-gray-400 hover:text-aniverse-cyan transition-colors">
                                    Comedia
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-semibold mb-4">Mi Cuenta</h4>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link to="/login" className="text-gray-400 hover:text-aniverse-cyan transition-colors">
                                    Iniciar Sesión
                                </Link>
                            </li>
                            <li>
                                <Link to="/register" className="text-gray-400 hover:text-aniverse-cyan transition-colors">
                                    Registrarse
                                </Link>
                            </li>
                            <li>
                                <Link to="/favorites" className="text-gray-400 hover:text-aniverse-cyan transition-colors">
                                    Mis Favoritos
                                </Link>
                            </li>
                            <li>
                                <Link to="/lists" className="text-gray-400 hover:text-aniverse-cyan transition-colors">
                                    Mis Listas
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-semibold mb-4">Contacto</h4>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <a href="mailto:info@aniverse.com" className="text-gray-400 hover:text-aniverse-cyan transition-colors flex items-center">
                                    <FaEnvelope className="mr-2" /> info@aniverse.com
                                </a>
                            </li>
                            <li>
                                <a href="https://github.com/romunarks" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-aniverse-cyan transition-colors flex items-center">
                                    <FaGithub className="mr-2" /> GitHub
                                </a>
                            </li>
                            <li>
                                <a href="https://twitter.com/romunarks" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-aniverse-cyan transition-colors flex items-center">
                                    <FaTwitter className="mr-2" /> Twitter
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-800 mt-8 pt-6 text-center">
                    <p className="text-gray-500 text-sm flex items-center justify-center">
                        Hecho con <FaHeart className="text-red-500 mx-1" /> por Rodrigo Prieto Munar - &copy; {new Date().getFullYear()} Aniverse
                    </p>
                </div>
            </div>
        </footer>
    );
};