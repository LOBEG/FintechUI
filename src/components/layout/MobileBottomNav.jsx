'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TrendingUp, Wallet, ListOrdered, History, BarChart3, Bot, Bell, Shield, Settings, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/components/I18nProvider';

const items = [
    { href: '/brokerage', label: 'brokerage', icon: Briefcase, fallback: 'Brokerage' },
    { href: '/dashboard/trade', label: 'trade', icon: TrendingUp },
    { href: '/dashboard/wallet', label: 'wallet', icon: Wallet },
    { href: '/dashboard/positions', label: 'positions', icon: ListOrdered },
    { href: '/dashboard/history', label: 'history', icon: History },
    { href: '/dashboard/analytics', label: 'analytics', icon: BarChart3 },
    { href: '/dashboard/analytics', label: 'aiBot', icon: Bot },
    { href: '/dashboard/security', label: 'alerts', icon: Bell },
    { href: '/dashboard/security', label: 'security', icon: Shield },
    { href: '/dashboard/security', label: 'settings', icon: Settings },
];

export function MobileBottomNav() {
    const pathname = usePathname();
    const { t } = useI18n();
    
    return (<nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t border-white/10 bg-ink-950/90 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
      <ul className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory">
        {items.map((it) => {
            const Icon = it.icon;
            const active = pathname === it.href;
            const label = it.fallback ? (t(it.label) === it.label ? it.fallback : t(it.label)) : t(it.label);
            return (<li key={it.href} className="snap-start">
              <Link href={it.href} className={cn('flex flex-col items-center justify-center gap-1 py-2.5 px-4 text-[11px] min-w-[72px]', active ? 'text-neon-green' : 'text-white/60 hover:text-white')}>
                <Icon className="h-5 w-5"/>
                <span>{label}</span>
              </Link>
            </li>);
        })}
      </ul>
    </nav>);
}
