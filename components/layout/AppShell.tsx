import type { SessionUser } from '@/types';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MobileNav } from './MobileNav';

export function AppShell({
  user,
  firmName,
  openAlerts,
  demoMode,
  children,
}: {
  user: SessionUser;
  firmName: string;
  openAlerts: number;
  demoMode: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh">
      <Sidebar role={user.role} firmName={firmName} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar user={user} firmName={firmName} openAlerts={openAlerts} demoMode={demoMode} />
        <main className="flex-1 px-4 pt-5 pb-24 sm:px-6 lg:pb-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
        <MobileNav role={user.role} />
      </div>
    </div>
  );
}
