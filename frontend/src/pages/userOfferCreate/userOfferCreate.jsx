import { useLoaderData } from "react-router-dom";
import { motion as Motion } from "motion/react";

import ListingCreateForm from "../../components/listingCreateForm.jsx";

export default function UserOfferCreate() {
  const { user } = useLoaderData();

  return (
    <main className="px-6 py-10 sm:px-8 lg:px-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <Motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="rounded-[2rem] border border-white/70 bg-slate-950 px-8 py-10 text-white shadow-2xl"
        >
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-3xl">
              <p className="text-sm font-medium tracking-[0.2em] text-emerald-400 uppercase">
                Create Offer
              </p>
              <h1 className="mt-4 max-w-3xl text-3xl font-extrabold text-white sm:text-4xl">
                Share available food
              </h1>
            </div>
          </div>
        </Motion.section>

        <Motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.4, ease: "easeOut" }}
          className="grid gap-5"
        >
          <ListingCreateForm
            additionalInstructionsPlaceholder="Example: Please enter through the second door on the left side of the building"
            endpoint="/api/listings/offers/create"
            foodDescriptionPlaceholder="Example: Thin crust, pineapple, onions, olives, stuffed crust"
            foodNamePlaceholder="Example: Hawaiian Pizza"
            formLabel="Offer Form"
            locationUnavailableMessage="Your account needs a valid location before you can publish an offer."
            publishLabel="Publish offer"
            successLabel="Offer published."
            travelDistanceLabel="Distance we're willing to deliver"
            user={user}
            availabilityTitle="Times people can pick up food"
            availabilityHint="Add the days and times when staff are available to pass food on. This is optional."
          />
        </Motion.section>
      </div>
    </main>
  );
}
