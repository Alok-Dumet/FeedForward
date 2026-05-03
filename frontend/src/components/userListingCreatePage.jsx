import { useLoaderData } from 'react-router-dom';
import { motion as Motion } from 'motion/react';

import ListingCreateForm from './listingCreateForm.jsx';

const CREATE_COPY = {
  offer: {
    eyebrow: 'Create Offer',
    title: 'Share available food',
  },
  request: {
    eyebrow: 'Create Request',
    title: 'Request food support',
  },
};

export default function UserListingCreatePage({ listingType }) {
  const { user } = useLoaderData();
  const copy = CREATE_COPY[listingType];

  return (
    <main className="px-6 py-10 sm:px-8 lg:px-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <Motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="rounded-[2rem] border border-white/70 bg-slate-950 px-8 py-10 text-white shadow-2xl"
        >
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-3xl">
              <p className="text-sm font-medium tracking-[0.2em] text-emerald-400 uppercase">
                {copy.eyebrow}
              </p>
              <h1 className="mt-4 max-w-3xl text-3xl font-extrabold text-white sm:text-4xl">
                {copy.title}
              </h1>
            </div>
          </div>
        </Motion.section>

        <Motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.4, ease: 'easeOut' }}
          className="grid gap-5"
        >
          <ListingCreateForm listingType={listingType} user={user} />
        </Motion.section>
      </div>
    </main>
  );
}
