export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-6" role="status" aria-label="Loading">
      <div className="space-y-3 py-2"><div className="h-8 w-40 rounded-lg bg-secondary" /><div className="h-4 w-52 rounded-lg bg-secondary" /></div>
      <div className="grid gap-6 xl:grid-cols-12">
        <div className="app-panel overflow-hidden xl:col-span-4"><div className="h-48 bg-primary-soft" /><div className="space-y-5 p-6"><div className="h-4 w-24 rounded bg-muted" /><div className="grid grid-cols-2 gap-6"><div className="h-16 rounded-xl bg-muted" /><div className="h-16 rounded-xl bg-muted" /></div><div className="h-5 rounded bg-muted" /></div></div>
        <div className="app-panel space-y-6 p-6 xl:col-span-8"><div className="h-5 w-40 rounded bg-muted" /><div className="h-64 rounded-2xl bg-muted" /></div>
      </div>
      <div className="app-panel space-y-5 p-6"><div className="h-5 w-48 rounded bg-muted" />{[0, 1, 2].map(i => <div key={i} className="flex items-center gap-4 border-b border-border pb-5"><div className="h-10 w-10 rounded-xl bg-muted" /><div className="h-4 flex-1 rounded bg-muted" /><div className="h-4 w-20 rounded bg-muted" /></div>)}</div>
      <span className="sr-only">Loading your finances…</span>
    </div>
  );
}
