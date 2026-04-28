import Link from 'next/link';

interface Step {
  n: number;
  title: string;
  body: string;
  href: string;
  cta: string;
}

const STEPS: Step[] = [
  {
    n: 1,
    title: 'Add a product',
    body: 'Pick a Quick Sample (Matcha, Yoga Mat, Earbuds, …) — both Lazada and Shopee offers will land in one row.',
    href: '/admin/products',
    cta: 'Go to Products',
  },
  {
    n: 2,
    title: 'Create a campaign',
    body: 'Group your products under a UTM tag like summer_deal_2025 with start/end dates.',
    href: '/admin/campaigns',
    cta: 'Go to Campaigns',
  },
  {
    n: 3,
    title: 'Generate short links',
    body: 'For each product × campaign × marketplace, mint a /go/<code> link to share.',
    href: '/admin/links',
    cta: 'Go to Links',
  },
];

/**
 * Shown on the dashboard when the catalogue is empty (or freshly reset).
 * Walks a first-time admin through the three actions that turn a blank
 * dashboard into a functional demo.
 */
export default function OnboardingCard() {
  return (
    <div className="card overflow-hidden p-0">
      <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-500">
          Get started
        </p>
        <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
          Three steps to your first tracked click
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          The catalogue is empty. Run through these to populate the demo end-to-end.
        </p>
      </div>
      <ol className="divide-y divide-slate-100">
        {STEPS.map((s) => (
          <li
            key={s.n}
            className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center"
          >
            <span
              className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-700"
              aria-hidden
            >
              {s.n}
            </span>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-900">{s.title}</p>
              <p className="mt-0.5 text-xs text-slate-500">{s.body}</p>
            </div>
            <Link href={s.href} className="btn-outline self-start text-xs sm:self-auto">
              {s.cta} →
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
