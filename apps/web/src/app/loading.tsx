import Nav from '@/components/Nav';
import { Skeleton } from '@/components/Skeleton';
import { isAuthenticated } from '@/lib/api';

export default function HomeLoading() {
  return (
    <>
      <Nav admin={isAuthenticated()} />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <Skeleton className="mb-12 h-48 rounded-2xl" />
        <Skeleton className="mb-4 h-6 w-40" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
