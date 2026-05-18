'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BarChart3, Wallet, Briefcase, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
const items = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/dashboard', label: 'Trade', icon: BarChart3 },
    { href: '/dashboard#wallet', label: 'Wallet', icon: Wallet },
    { href: '/investor', label: 'Invest', icon: Briefcase },
    { href: '/admin', label: 'Admin', icon: Settings },
];
export function MobileBottomNav() {
    const pathname = usePathname();
    return (<nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t border-white/10 bg-ink-950/90 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
      <ul className="grid grid-cols-5">
        {items.map((it) => {
            const Icon = it.icon;
            const active = pathname === it.href.split('#')[0];
            return (<li key={it.href}>
              <Link href={it.href} className={cn('flex flex-col items-center justify-center gap-1 py-2.5 text-[11px]', active ? 'text-neon-green' : 'text-white/60 hover:text-white')}>
                <Icon className="h-5 w-5"/>
                <span>{it.label}</span>
              </Link>
            </li>);
        })}
      </ul>
    </nav>);
}
