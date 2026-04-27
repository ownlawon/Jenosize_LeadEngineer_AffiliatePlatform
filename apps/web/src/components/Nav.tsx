import Link from 'next/link';

export default function Nav({ admin = false }: { admin?: boolean }) {
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          <span className="text-brand-600">Jenosize</span> Affiliate
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          {admin ? (
            <>
              <Link href="/admin/dashboard" className="hover:text-brand-600">Dashboard</Link>
              <Link href="/admin/products" className="hover:text-brand-600">Products</Link>
              <Link href="/admin/campaigns" className="hover:text-brand-600">Campaigns</Link>
              <Link href="/admin/links" className="hover:text-brand-600">Links</Link>
              <form action="/api/logout" method="post">
                <button className="btn-outline">Logout</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/" className="hover:text-brand-600">Home</Link>
              <Link href="/admin/login" className="btn-outline">Admin</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
