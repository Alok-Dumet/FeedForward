import { useLoaderData } from "react-router-dom";
import { motion as Motion } from "motion/react";

import ListingCreateForm from "../../components/listingCreateForm.jsx";

export default function UserRequestCreate() {
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
                Create Request
              </p>
              <h1 className="mt-4 text-4xl font-extrabold sm:text-5xl">
                Your new request
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
            additionalInstructionsPlaceholder="Example: Please bring donations to the front desk during pantry intake hours"
            endpoint="/api/listings/requests/create"
            foodDescriptionPlaceholder="Example: Shelf-stable items, low-sodium options preferred, family-size packages welcome"
            foodNamePlaceholder="Example: Canned vegetables"
            formLabel="Request Form"
            locationUnavailableMessage="Your account needs a valid location before you can publish a request."
            publishLabel="Publish request"
            successLabel="Request published."
            travelDistanceLabel="Distance we're willing to pick up"
            user={user}
            availabilityTitle="Times people can drop off food"
            availabilityHint="Add the days and times when staff are available to receive food. This is optional."
          />
        </Motion.section>
      </div>
    </main>
  );
}
