// Shown instantly while any dashboard page loads its data, instead of a blank
// screen. It only hints at the layout (title, summary cards, a list).
export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-6 pb-8" role="status" aria-label="Loading">
      <div className="flex items-center justify-between gap-4 rounded-4xl border border-gray-50 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gray-100" />
          <div className="space-y-2">
            <div className="h-5 w-40 rounded-full bg-gray-100" />
            <div className="h-3.5 w-64 max-w-[50vw] rounded-full bg-gray-100" />
          </div>
        </div>
        <div className="hidden h-11 w-36 rounded-full bg-gray-100 sm:block" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center justify-between rounded-3xl border border-gray-50 bg-white p-5 shadow-sm">
            <div className="space-y-2">
              <div className="h-3 w-24 rounded-full bg-gray-100" />
              <div className="h-6 w-32 rounded-full bg-gray-100" />
            </div>
            <div className="h-10 w-10 rounded-full bg-gray-100" />
          </div>
        ))}
      </div>

      <div className="space-y-3 rounded-4xl border border-gray-50 bg-white p-6 shadow-sm">
        <div className="h-5 w-48 rounded-full bg-gray-100" />
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-4 rounded-2xl border border-gray-50 p-4">
            <div className="h-11 w-11 shrink-0 rounded-xl bg-gray-100" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/3 rounded-full bg-gray-100" />
              <div className="h-3 w-1/4 rounded-full bg-gray-100" />
            </div>
            <div className="h-4 w-20 rounded-full bg-gray-100" />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
