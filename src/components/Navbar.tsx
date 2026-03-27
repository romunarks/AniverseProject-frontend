// src/components/Navbar.tsx - Versión corregida
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
    FaSearch, FaUser, FaHeart, FaList, FaSignOutAlt,
    FaSignInAlt, FaChevronDown, FaBars, FaTimes
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { SearchBar } from './SearchBar';

// Hook personalizado para detectar clics fuera de un elemento
const useOutsideClick = (callback: () => void) => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                callback();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [callback]);

    return ref;
};

// Componente para un enlace de navegación
interface NavLinkProps {
    to: string;
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
}

const NavLink: React.FC<NavLinkProps> = ({ to, children, onClick, className = '' }) => {
    const location = useLocation();
    const isActive = location.pathname === to;

    return (
        <Link
            to={to}
            onClick={onClick}
            className={`font-medium ${isActive
                ? 'text-aniverse-cyan border-b-2 border-aniverse-cyan'
                : 'text-white hover:text-aniverse-cyan'} ${className}`}
            aria-current={isActive ? 'page' : undefined}
        >
            {children}
        </Link>
    );
};

// Menú desplegable
interface DropdownProps {
    label: React.ReactNode;
    children: React.ReactNode;
}

const Dropdown: React.FC<DropdownProps> = ({ label, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useOutsideClick(() => setIsOpen(false));

    return (
        <div ref={dropdownRef} className="relative group">
            <button
                className="font-medium text-white hover:text-aniverse-cyan px-3 py-2 rounded-md flex items-center focus:outline-none focus:ring-2 focus:ring-aniverse-cyan"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                aria-haspopup="true"
            >
                {label}
                <FaChevronDown className={`ml-1 text-xs transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} />
            </button>

            <div
                className={`absolute left-0 mt-1 w-48 bg-gray-800 rounded-md shadow-lg transition-all duration-200 
          ${isOpen
                    ? 'opacity-100 visible transform translate-y-0'
                    : 'opacity-0 invisible transform -translate-y-2'}`}
            >
                <div className="py-1">
                    {children}
                </div>
            </div>
        </div>
    );
};

// Ítem de menú desplegable
interface DropdownItemProps {
    to: string;
    children: React.ReactNode;
    onClick?: () => void;
}

const DropdownItem: React.FC<DropdownItemProps> = ({ to, children, onClick }) => (
    <Link
        to={to}
        className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-aniverse-cyan"
        onClick={onClick}
    >
        {children}
    </Link>
);

// Componente principal Navbar
export const Navbar: React.FC = () => {
    const { user, isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [showUserDropdown, setShowUserDropdown] = useState(false);

    const userDropdownRef = useOutsideClick(() => setShowUserDropdown(false));
    const mobileMenuRef = useRef<HTMLDivElement>(null);

    // Efecto para manejar la apariencia al hacer scroll
    useEffect(() => {
        const handleScroll = () => {
            const isScrolled = window.scrollY > 10;
            if (isScrolled !== scrolled) {
                setScrolled(isScrolled);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [scrolled]);

    // Cerrar menú móvil cuando cambia la ruta
    useEffect(() => {
        setShowMobileMenu(false);
    }, [location.pathname]);

    // Manejar cierre de sesión
    const handleLogout = async () => {
        try {
            await logout();
            setShowUserDropdown(false);
            setShowMobileMenu(false);
            navigate('/');
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }
    };

    // Cerrar todos los menús
    const closeMenus = () => {
        setShowMobileMenu(false);
        setShowUserDropdown(false);
    };

    // Rutas principales de navegación
    const mainNavLinks = [
        { to: '/', label: 'Inicio' },
        { to: '/animes', label: 'Catálogo' },
        { to: '/trending', label: 'Trending' },
    ];

    // Rutas del menú desplegable "Más"
    const moreNavLinks = [
        { to: '/animes', label: 'Catálogo completo' },
        { to: '/trending', label: 'Trending' },
        { to: '/estadisticas', label: 'Estadísticas' },
        { to: '/top-rated', label: 'Mejor puntuados' },
        { to: '/recent', label: 'Más recientes' },
        { to: '/most-voted', label: 'Más votados' },
    ];

    // Rutas para usuario autenticado
    const authNavLinks = [
        { to: '/profile/1', label: 'Favoritos', icon: <FaHeart className="mr-2" /> },
        { to: '/lists', label: 'Mis Listas', icon: <FaList className="mr-2" /> },
    ];

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
                scrolled ? 'bg-black/95 shadow-lg' : 'bg-gradient-to-b from-black/80 to-transparent'
            }`}
            role="banner"
        >
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center py-4">
                    {/* Logo */}
                    <Link to="/" className="flex items-center space-x-2" onClick={closeMenus}>
            <span className="text-2xl font-bold text-white">
              <span className="text-aniverse-cyan">ANI</span>VERSE
            </span>
                    </Link>

                    {/* Navegación principal - Desktop */}
                    <nav className="hidden md:flex items-center space-x-6" aria-label="Navegación principal">
                        {mainNavLinks.map(link => (
                            <NavLink key={link.to} to={link.to} onClick={closeMenus}>
                                {link.label}
                            </NavLink>
                        ))}

                        {/* Menú desplegable "Explorar" */}
                        <Dropdown label={<>Más <FaChevronDown className="ml-1 text-xs" /></>}>
                            {moreNavLinks.map(link => (
                                <DropdownItem key={link.to} to={link.to} onClick={closeMenus}>
                                    {link.label}
                                </DropdownItem>
                            ))}
                        </Dropdown>

                        {/* Enlaces adicionales para usuarios autenticados */}
                        {isAuthenticated && (
                            <>
                                <NavLink to="/profile/1" onClick={closeMenus}>
                                    Favoritos
                                </NavLink>
                                <NavLink to="/lists" onClick={closeMenus}>
                                    Mis Listas
                                </NavLink>
                            </>
                        )}
                    </nav>

                    {/* Área de búsqueda y usuario */}
                    <div className="flex items-center space-x-4">
                        {/* Búsqueda */}
                        <div className="hidden md:block">
                            <SearchBar />
                        </div>

                        {/* Usuario / Login */}
                        {isAuthenticated ? (
                            <div ref={userDropdownRef} className="relative">
                                <button
                                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                                    className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-aniverse-cyan rounded-full"
                                    aria-expanded={showUserDropdown}
                                    aria-haspopup="true"
                                    aria-label="Menú de usuario"
                                >
                                    <div className="w-8 h-8 rounded-full bg-aniverse-purple-light flex items-center justify-center text-white">
                                        {user?.nombre?.charAt(0).toUpperCase() || <FaUser />}
                                    </div>
                                    <span className="hidden md:inline-block text-white">{user?.nombre}</span>
                                    <FaChevronDown className={`ml-1 text-xs text-white transition-transform duration-200 ${
                                        showUserDropdown ? 'transform rotate-180' : ''
                                    }`} />
                                </button>

                                <div
                                    className={`absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg py-1 z-20 transition-all duration-200 ${
                                        showUserDropdown
                                            ? 'opacity-100 visible transform translate-y-0'
                                            : 'opacity-0 invisible transform -translate-y-2'
                                    }`}
                                    role="menu"
                                    aria-orientation="vertical"
                                    aria-labelledby="user-menu"
                                >
                                    <Link
                                        to={`/profile/${user?.id}`}
                                        className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-aniverse-cyan"
                                        onClick={() => setShowUserDropdown(false)}
                                        role="menuitem"
                                    >
                                        <FaUser className="inline mr-2" /> Perfil
                                    </Link>

                                    {authNavLinks.map(link => (
                                        <Link
                                            key={link.to}
                                            to={link.to}
                                            className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-aniverse-cyan"
                                            onClick={() => setShowUserDropdown(false)}
                                            role="menuitem"
                                        >
                                            {link.icon} {link.label}
                                        </Link>
                                    ))}

                                    <button
                                        onClick={handleLogout}
                                        className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-aniverse-cyan"
                                        role="menuitem"
                                    >
                                        <FaSignOutAlt className="inline mr-2" /> Cerrar Sesión
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <Link
                                to="/login"
                                className="flex items-center space-x-2 px-4 py-2 rounded-full bg-aniverse-purple hover:bg-aniverse-purple-light transition-colors"
                                onClick={closeMenus}
                            >
                                <FaSignInAlt />
                                <span className="hidden md:inline-block">Iniciar Sesión</span>
                            </Link>
                        )}

                        {/* Botón de menú móvil */}
                        <button
                            className="md:hidden text-white focus:outline-none focus:ring-2 focus:ring-aniverse-cyan rounded p-1"
                            onClick={() => setShowMobileMenu(!showMobileMenu)}
                            aria-label={showMobileMenu ? 'Cerrar menú' : 'Abrir menú'}
                            aria-expanded={showMobileMenu}
                        >
                            {showMobileMenu ? (
                                <FaTimes className="w-6 h-6" />
                            ) : (
                                <FaBars className="w-6 h-6" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Menú móvil */}
                <div
                    ref={mobileMenuRef}
                    className={`md:hidden py-4 border-t border-gray-700 transition-all duration-300 overflow-hidden ${
                        showMobileMenu ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
                    }`}
                    aria-hidden={!showMobileMenu}
                >
                    <div className="mb-4 px-4">
                        <SearchBar />
                    </div>

                    <nav className="flex flex-col space-y-1 px-4" aria-label="Navegación móvil">
                        {mainNavLinks.map(link => (
                            <Link
                                key={link.to}
                                to={link.to}
                                className={`block py-2 px-3 rounded-md text-base font-medium ${
                                    location.pathname === link.to
                                        ? 'bg-aniverse-purple/20 text-aniverse-cyan'
                                        : 'text-white hover:bg-gray-700 hover:text-aniverse-cyan'
                                }`}
                                onClick={closeMenus}
                                aria-current={location.pathname === link.to ? 'page' : undefined}
                            >
                                {link.label}
                            </Link>
                        ))}

                        {/* Enlaces adicionales en móvil */}
                        {moreNavLinks.map(link => (
                            <Link
                                key={link.to}
                                to={link.to}
                                className={`block py-2 px-3 rounded-md text-base font-medium ${
                                    location.pathname === link.to
                                        ? 'bg-aniverse-purple/20 text-aniverse-cyan'
                                        : 'text-white hover:bg-gray-700 hover:text-aniverse-cyan'
                                }`}
                                onClick={closeMenus}
                                aria-current={location.pathname === link.to ? 'page' : undefined}
                            >
                                {link.label}
                            </Link>
                        ))}

                        {/* Enlaces de usuario en móvil */}
                        {isAuthenticated ? (
                            <>
                                {authNavLinks.map(link => (
                                    <Link
                                        key={link.to}
                                        to={link.to}
                                        className={`block py-2 px-3 rounded-md text-base font-medium ${
                                            location.pathname === link.to
                                                ? 'bg-aniverse-purple/20 text-aniverse-cyan'
                                                : 'text-white hover:bg-gray-700 hover:text-aniverse-cyan'
                                        }`}
                                        onClick={closeMenus}
                                        aria-current={location.pathname === link.to ? 'page' : undefined}
                                    >
                                        {link.icon} {link.label}
                                    </Link>
                                ))}

                                <Link
                                    to={`/profile/${user?.id}`}
                                    className={`block py-2 px-3 rounded-md text-base font-medium ${
                                        location.pathname === `/profile/${user?.id}`
                                            ? 'bg-aniverse-purple/20 text-aniverse-cyan'
                                            : 'text-white hover:bg-gray-700 hover:text-aniverse-cyan'
                                    }`}
                                    onClick={closeMenus}
                                    aria-current={location.pathname === `/profile/${user?.id}` ? 'page' : undefined}
                                >
                                    <FaUser className="inline mr-2" /> Perfil
                                </Link>

                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left py-2 px-3 rounded-md text-base font-medium text-white hover:bg-gray-700 hover:text-aniverse-cyan"
                                >
                                    <FaSignOutAlt className="inline mr-2" /> Cerrar Sesión
                                </button>
                            </>
                        ) : (
                            <Link
                                to="/login"
                                className="block py-2 px-3 rounded-md text-base font-medium text-white hover:bg-gray-700 hover:text-aniverse-cyan"
                                onClick={closeMenus}
                            >
                                <FaSignInAlt className="inline mr-2" /> Iniciar Sesión
                            </Link>
                        )}
                    </nav>
                </div>
            </div>
        </header>
    );
};