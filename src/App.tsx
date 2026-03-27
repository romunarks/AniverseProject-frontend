// src/App.tsx - Versión corregida SIN duplicados
import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PrivateRoute } from './components/PrivateRoute';

// Importaciones normales para componentes principales (más frecuentes)
import { HomePage } from './pages/HomePage';
import { AnimePage } from './pages/AnimePage';
import { TrendingPage } from './pages/TrendingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
// ❌ ELIMINADA: import {ListasPage} from "./pages/ListaPage.tsx";

// Componente de carga personalizado para lazy loading
const LoadingScreen = () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-black">
        <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-aniverse-cyan mx-auto mb-4"></div>
            <div className="text-white text-lg font-medium">Cargando Aniverse...</div>
            <div className="text-gray-400 text-sm mt-2">Preparando la experiencia perfecta</div>
        </div>
    </div>
);

// ========================================
// COMPONENTE PARA REDIRIGIR /profile → /profile/:id
// ========================================
const ProfileRedirect: React.FC = () => {
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading) {
            if (user?.id) {
                // Redirigir al perfil del usuario autenticado
                navigate(`/profile/${user.id}`, { replace: true });
            } else {
                // Si no hay usuario, redirigir al login
                navigate('/login', { replace: true });
            }
        }
    }, [user, loading, navigate]);

    // Mostrar loading mientras se procesa la redirección
    return (
        <div className="container mx-auto px-4 py-8 flex justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-aniverse-pink mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando tu perfil...</p>
            </div>
        </div>
    );
};

// Cargar componentes menos frecuentes con lazy loading para optimizar rendimiento
const AnimeDetailPage = lazy(() => import('./pages/AnimeDetailPage').then(module => ({
    default: module.AnimeDetailPage
})));

const ListaDetailPage = lazy(() => import('./pages/ListaDetailPage').then(module => ({
    default: module.ListaDetailPage
})));

const ExternalAnimePage = lazy(() => import('./pages/ExternalAnimePage').then(module => ({
    default: module.ExternalAnimePage
})));

const SearchResultsPage = lazy(() => import('./pages/SearchResultsPage').then(module => ({
    default: module.SearchResultsPage
})));

const FavoritesPage = lazy(() => import('./pages/FavoritesPage').then(module => ({
    default: module.FavoritesPage
})));

// ✅ CORREGIDO: Solo UNA declaración de ListasPage con ruta correcta
const ListasPage = lazy(() => import('./pages/ListasPage').then(module => ({
    default: module.ListasPage
})));

// ✅ SOLO UserProfilePage - Ya no necesitamos ProfilePage
const UserProfilePage = lazy(() => import('./pages/UserProfilePage').then(module => ({
    default: module.UserProfilePage
})));

const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then(module => ({
    default: module.NotFoundPage
})));

const EstadisticasPage = lazy(() => import('./pages/EstadisticasPage').then(module => ({
    default: module.EstadisticasPage
})));

const TopRatedAnimesPage = lazy(() => import('./pages/TopRatedAnimesPage').then(module => ({
    default: module.TopRatedAnimesPage
})));

const MostRecentAnimesPage = lazy(() => import('./pages/MostRecentAnimePages').then(module => ({
    default: module.MostRecentAnimesPage
})));

const MostVotedAnimesPage = lazy(() => import('./pages/MostVotedAnimesPage').then(module => ({
    default: module.MostVotedAnimesPage
})));

// Páginas de error personalizadas
const ForbiddenPage = () => (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-red-900 to-black px-4 text-center">
        <div className="max-w-md w-full">
            <div className="text-red-500 text-8xl mb-6">🚫</div>
            <h1 className="text-4xl font-bold text-red-400 mb-4">Acceso Denegado</h1>
            <p className="text-gray-300 text-lg mb-8">
                No tienes los permisos necesarios para acceder a esta sección de Aniverse.
            </p>
            <div className="space-y-3">
                <a
                    href="/"
                    className="block w-full px-6 py-3 bg-aniverse-purple text-white rounded-lg hover:bg-aniverse-purple/80 transition-colors font-medium"
                >
                    🏠 Volver al Inicio
                </a>
                <a
                    href="/login"
                    className="block w-full px-6 py-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                >
                    🔑 Iniciar Sesión
                </a>
            </div>
        </div>
    </div>
);

const ErrorBoundaryFallback = ({ error, resetError }: { error: Error; resetError: () => void }) => (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-red-900 to-black px-4 text-center">
        <div className="max-w-md w-full">
            <div className="text-red-500 text-8xl mb-6">💥</div>
            <h1 className="text-4xl font-bold text-red-400 mb-4">¡Oops! Algo salió mal</h1>
            <p className="text-gray-300 text-sm mb-6 font-mono bg-gray-800 p-3 rounded">
                {error.message}
            </p>
            <div className="space-y-3">
                <button
                    onClick={resetError}
                    className="block w-full px-6 py-3 bg-aniverse-purple text-white rounded-lg hover:bg-aniverse-purple/80 transition-colors font-medium"
                >
                    🔄 Reintentar
                </button>
                <a
                    href="/"
                    className="block w-full px-6 py-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                >
                    🏠 Ir al Inicio
                </a>
            </div>
        </div>
    </div>
);

// Administrador principal de rutas
function App() {
    return (
        <AuthProvider>
            <Router>
                <Suspense fallback={<LoadingScreen />}>
                    <Routes>
                        {/* 🏠 RUTAS PÚBLICAS - Páginas principales */}
                        <Route path="/" element={<HomePage />} />
                        <Route path="/animes" element={<AnimePage />} />
                        <Route path="/trending" element={<TrendingPage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />

                        {/* 📱 RUTAS PÚBLICAS - Páginas de contenido (lazy loaded) */}
                        <Route path="/anime/:id" element={<AnimeDetailPage />} />
                        <Route path="/anime/external/:id" element={<ExternalAnimePage />} />
                        <Route path="/search" element={<SearchResultsPage />} />
                        <Route path="/estadisticas" element={<EstadisticasPage />} />
                        <Route path="/top-rated" element={<TopRatedAnimesPage />} />
                        <Route path="/recent" element={<MostRecentAnimesPage />} />
                        <Route path="/most-voted" element={<MostVotedAnimesPage />} />

                        {/* ✅ RUTAS DE PERFIL CORREGIDAS - UserProfilePage maneja todo */}
                        <Route path="/profile/:id" element={<UserProfilePage />} />
                        <Route
                            path="/profile"
                            element={
                                <PrivateRoute>
                                    <ProfileRedirect />
                                </PrivateRoute>
                            }
                        />

                        {/* 🔒 RUTAS PROTEGIDAS - Requieren autenticación */}
                        <Route
                            path="/favorites"
                            element={
                                <PrivateRoute>
                                    <FavoritesPage />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/listas"
                            element={
                                <PrivateRoute>
                                    <ListasPage />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/lists"
                            element={
                                <PrivateRoute>
                                    <ListasPage />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/listas/:id"
                            element={
                                <PrivateRoute>
                                    <ListaDetailPage />
                                </PrivateRoute>
                            }
                        />

                        {/* 🛡️ RUTAS ADMIN - Requieren autenticación con rol específico */}
                        <Route
                            path="/admin/*"
                            element={
                                <PrivateRoute requiredRole="ADMIN">
                                    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-black">
                                        <div className="text-center">
                                            <div className="text-6xl mb-4">🔧</div>
                                            <h1 className="text-3xl font-bold text-white mb-4">Panel de Administración</h1>
                                            <p className="text-gray-400">Funcionalidades de administración en desarrollo</p>
                                        </div>
                                    </div>
                                </PrivateRoute>
                            }
                        />

                        {/* ⚠️ PÁGINAS DE ERROR */}
                        <Route path="/forbidden" element={<ForbiddenPage />} />

                        {/* 🔍 RUTA 404 - Página no encontrada (siempre al final) */}
                        <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                </Suspense>
            </Router>
        </AuthProvider>
    );
}

export default App;