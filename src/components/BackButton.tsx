import React from 'react';
import { useNavigate } from 'react-router-dom';

export const BackButton: React.FC = () => {
    const navigate = useNavigate();

    return (
        <button
            onClick={() => navigate(-1)}
            className="mb-6 flex items-center text-aniverse-cyan hover:text-white transition-colors group font-semibold"
        >
            <span className="mr-2 transform group-hover:-translate-x-1 transition-transform">←</span>
            Volver
        </button>
    );
};