/* eslint-disable react-refresh/only-export-components */
import { useLoaderData } from 'react-router-dom';

import ListingCreateForm from '../../components/listingCreateForm.jsx';
import { createUserListingLoader } from '../../utils/listings.js';

export const userOfferCreateLoader = createUserListingLoader('Food Provider');

export default function UserOfferCreate() {
  const { user } = useLoaderData();

  return (
    <main className="px-6 py-10 sm:px-8 lg:px-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <section className="rounded-[2rem] border border-white/70 bg-slate-950 px-8 py-10 text-white shadow-2xl">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-3xl">
              <p className="text-sm font-medium tracking-[0.2em] text-emerald-400 uppercase">Create Offer</p>
              <h1 className="mt-4 max-w-3xl text-3xl font-extrabold text-white sm:text-4xl">Share available food</h1>
            </div>
          </div>
        </section>

        <section className="grid gap-5">
          <ListingCreateForm listingType="offer" user={user} />
        </section>
      </div>
    </main>
  );
}
