'use client';
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    if (!mounted)
        return <div className="h-9 w-9"/>;
    const isDark = theme !== 'light';
    return (<button onClick={() => setTheme(isDark ? 'light' : 'dark')} aria-label="Toggle theme" className="h-9 w-9 inline-flex items-center justify-center rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition">
      {isDark ? <Moon className="h-4 w-4"/> : <Sun className="h-4 w-4"/>}
    </button>);
}
