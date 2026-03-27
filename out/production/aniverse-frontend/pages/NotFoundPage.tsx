// src/pages/NotFoundPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { FaHome, FaSearch } from 'react-icons/fa';

export const NotFoundPage: React.FC = () => {
    return (
        <div className="min-h-screen flex flex-col bg-gray-900">
            <Navbar />

            <main className="flex-grow flex items-center justify-center">
                <div className="container mx-auto px-4 py-16 text-center">
                    <h1 className="text-8xl font-bold text-aniverse-cyan mb-6">404</h1>
                    <p className="text-2xl text-white mb-8">¡Oops! Página no encontrada</p>
                    <p className="text-gray-400 max-w-xl mx-auto mb-10">
                        Parece que has tomado un camino equivocado. La página que estás buscando no existe o ha sido movida.
                    </p>

                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Link
                            to="/"
                            className="px-6 py-3 bg-aniverse-purple hover:bg-aniverse-purple-light text-white font-medium rounded-full flex items-center justify-center transition-colors"
                        >
                            <FaHome className="mr-2" /> Volver al inicio
                        </Link>
                        <Link
                            to="/animes"
                            className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-full flex items-center justify-center transition-colors"
                        >
                            <FaSearch className="mr-2" /> Explorar animes
                        </Link>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};