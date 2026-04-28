import Nav from '@/components/Nav';
import { Skeleton } from '@/components/Skeleton';
import { isAuthenticated } from '@/lib/api';

export default function CampaignLoading() {
  return (
    <>
      <Nav admin={isAuthenticated()} />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 space-y-3">
          <Skeleton className="h-9 w-2/3 max-w-md" />
          <Skeleton className="h-4 w-1/2 max-w-sm" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="card flex flex-col gap-4 sm:flex-row sm:items-center">
              <Skeleton className="h-36 w-36 flex-shrink-0 rounded-lg" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-14 w-full rounded-lg" />
                <Skeleton className="h-14 w-full rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
