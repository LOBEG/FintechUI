'use client';
import { useSiteSettings } from '@/lib/useSession';
import { AlertTriangle, Megaphone } from 'lucide-react';

export function SiteBanner() {
  const s = useSiteSettings();
  if (!s) return null;
  return (
    <>
      {s.maintenanceMode && (
        <div className="relative z-40 bg-accent-error/15 border-b border-accent-error/30 text-accent-error text-xs sm:text-sm px-4 py-2 text-center">
          <AlertTriangle className="inline h-4 w-4 mr-2 -mt-0.5" />
          <strong>Maintenance mode</strong> - Oakmont Digital Capital Group is currently in read-only mode. Trading, investments and withdrawals are temporarily paused.
        </div>
      )}
      {s.banner && !s.maintenanceMode && (
        <div className="relative z-40 bg-accent-success/15 border-b border-accent-success/30 text-accent-success text-xs sm:text-sm px-4 py-2 text-center">
          <Megaphone className="inline h-4 w-4 mr-2 -mt-0.5" />
          {s.banner}
        </div>
      )}
    </>
  );
}
