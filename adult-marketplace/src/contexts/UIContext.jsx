import { createContext, useContext, useState, useEffect } from 'react';

const UIContext = createContext();

export function UIProvider({ children }) {
    const [discreetMode, setDiscreetMode] = useState(() => {
        return localStorage.getItem('discreetMode') === 'true';
    });

    const [darkMode, setDarkMode] = useState(() => {
        return localStorage.getItem('darkMode') === 'true';
    });

    useEffect(() => {
        localStorage.setItem('discreetMode', discreetMode);
    }, [discreetMode]);

    useEffect(() => {
        localStorage.setItem('darkMode', darkMode);
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [darkMode]);

    const toggleDiscreetMode = () => setDiscreetMode(prev => !prev);
    const toggleDarkMode = () => setDarkMode(prev => !prev);

    return (
        <UIContext.Provider value={{
            discreetMode,
            toggleDiscreetMode,
            darkMode,
            toggleDarkMode,
            projectName: discreetMode ? 'Portal' : 'FlowConnect',
            logoChar: discreetMode ? 'P' : 'F'
        }}>
            {children}
        </UIContext.Provider>
    );
}

export const useUI = () => {
    const context = useContext(UIContext);
    if (!context) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
};
