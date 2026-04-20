import { Link, useLoaderData } from "react-router-dom";

export default function Details() {
  const { record } = useLoaderData();

  return (
    <main className="px-6 py-10 sm:px-8 lg:px-12">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
        <section className="rounded-[1.75rem] border border-white/70 bg-white/85 px-6 py-5 shadow-xl backdrop-blur-md">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium tracking-[0.18em] text-amber-700 uppercase">
                {record.sectionLabel}
              </p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900">{record.title}</h1>
              <p className="mt-2 text-sm text-slate-600">{record.orderNumber}</p>
            </div>

            <Link
              to={record.backTo}
              className="inline-flex rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-amber-300 hover:text-amber-800"
            >
              Back to {record.backLabel}
            </Link>
          </div>

          {record.primaryAction ? (
            <div className="mt-5">
              <button
                type="button"
                className="inline-flex rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                {record.primaryAction.label}
              </button>
            </div>
          ) : null}
        </section>

        <section className="rounded-[1.75rem] border border-white/70 bg-white/85 px-6 py-5 shadow-xl backdrop-blur-md">
          <h2 className="text-lg font-semibold text-slate-900">Items</h2>
          <div className="mt-4 divide-y divide-slate-200">
            {record.items.map((item) => (
              <div
                key={`${item.name}-${item.quantity ?? "item"}`}
                className="flex items-start justify-between gap-4 py-3"
              >
                <p className="text-sm font-medium text-slate-900">{item.name}</p>
                <p className="text-sm text-slate-600">{item.quantity ?? "To be confirmed"}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-white/70 bg-white/85 px-6 py-5 shadow-xl backdrop-blur-md">
          <h2 className="text-lg font-semibold text-slate-900">
            Delivery / Recipient Information
          </h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold tracking-[0.15em] text-slate-500 uppercase">
                Organization
              </dt>
              <dd className="mt-1 text-sm text-slate-900">{record.organization_name}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold tracking-[0.15em] text-slate-500 uppercase">
                Completion Time
              </dt>
              <dd className="mt-1 text-sm text-slate-900">{record.completionTime}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold tracking-[0.15em] text-slate-500 uppercase">
                Address
              </dt>
              <dd className="mt-1 text-sm text-slate-900">{record.address}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold tracking-[0.15em] text-slate-500 uppercase">
                Phone Number
              </dt>
              <dd className="mt-1 text-sm text-slate-900">{record.phoneNumber}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-[1.75rem] border border-white/70 bg-white/85 px-6 py-5 shadow-xl backdrop-blur-md">
          <h2 className="text-lg font-semibold text-slate-900">Order Information</h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold tracking-[0.15em] text-slate-500 uppercase">
                Order Number
              </dt>
              <dd className="mt-1 text-sm text-slate-900">{record.orderNumber}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold tracking-[0.15em] text-slate-500 uppercase">
                Order Status
              </dt>
              <dd className="mt-1 text-sm text-slate-900">{record.status}</dd>
            </div>
          </dl>
        </section>
      </div>
    </main>
  );
}
