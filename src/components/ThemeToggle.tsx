import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';

type Theme = 'light' | 'dark';

const ThemeToggle: React.FC = () => {
    const [theme, setTheme] = useState<Theme>(() => {
        // Check localStorage or system preference
        const stored = localStorage.getItem('theme') as Theme;
        if (stored) return stored;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });

    useEffect(() => {
        // Apply theme to document
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
        root.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="relative h-10 w-10 border-2 border-border/50 rounded-lg hover:bg-bg-hover transition-all duration-300"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            aria-label="Toggle theme"
        >
            <Sun
                className={`h-[1.2rem] w-[1.2rem] transition-all duration-300 absolute ${theme === 'dark' ? 'rotate-[-180deg] scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100 text-warning-amber'
                    }`}
            />
            <Moon
                className={`h-[1.2rem] w-[1.2rem] transition-all duration-300 absolute ${theme === 'dark' ? 'rotate-0 scale-100 opacity-100 text-focus-blue' : 'rotate-180 scale-0 opacity-0'
                    }`}
            />
        </Button>
    );
};

export default ThemeToggle;
