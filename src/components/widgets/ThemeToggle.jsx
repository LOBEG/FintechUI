'use client';
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
export function ThemeToggle() {
    const { resolvedTheme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    if (!mounted)
        return <div className="h-9 w-9"/>;
    const isDark = resolvedTheme !== 'light';
    return (<button onClick={() => setTheme(isDark ? 'light' : 'dark')} aria-label="Toggle theme" title={isDark ? 'Switch to cyan midnight theme' : 'Switch to dark trading theme'} className="h-9 w-9 inline-flex items-center justify-center rounded-lg bg-white/5 border border-blue-500/15 hover:bg-blue-500/10 transition text-white">
      {isDark ? <Moon className="h-4 w-4"/> : <Sun className="h-4 w-4 text-blue-400"/>}
    </button>);
}
