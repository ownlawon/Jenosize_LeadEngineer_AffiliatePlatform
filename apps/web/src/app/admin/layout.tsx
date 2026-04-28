import Nav from '@/components/Nav';
import { isAuthenticated } from '@/lib/api';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // Show the public Nav (just Home + Admin button) on the login page —
  // i.e. when there's no auth cookie yet — so we don't tease admin links
  // at users who can't actually use them.
  const authed = isAuthenticated();
  return (
    <>
      <Nav admin={authed} />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>
    </>
  );
}
