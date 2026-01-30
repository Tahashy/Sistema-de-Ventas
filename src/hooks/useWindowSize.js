// src/hooks/useWindowSize.js
import { useState, useEffect } from 'react';

export const useWindowSize = () => {
    const [windowSize, setWindowSize] = useState({
        width: typeof window !== 'undefined' ? window.innerWidth : 1200,
        height: typeof window !== 'undefined' ? window.innerHeight : 800,
    });

    useEffect(() => {
        const handleResize = () => {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };

        window.addEventListener('resize', handleResize);
        handleResize(); // Llamar inmediatamente

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return {
        ...windowSize,
        isMobile: windowSize.width < 640,
        isTablet: windowSize.width >= 640 && windowSize.width < 1024,
        isDesktop: windowSize.width >= 1024,
    };
};

export default useWindowSize;
