import { useState } from "react";
import { Link, NavLink, useNavigate, useRouteLoaderData } from "react-router-dom";

import {
  clearMockSession,
  getDefaultRouteForUserType,
  getUserType,
} from "../session.js";

const baseLinkClassName =
  "rounded-full px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-amber-50 hover:text-amber-800";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const session = useRouteLoaderData("root");
  const userType = getUserType(session);

  if (!userType) {
    return null;
  }

  const navItems =
    userType === "donor"
      ? [
          { label: "Requests", to: "/requests" },
          { label: "History", to: "/history" },
        ]
      : [
          { label: "Offers", to: "/offers" },
          { label: "History", to: "/history" },
        ];

  const createAction =
    userType === "donor"
      ? { label: "Create Request", to: "/users/user-01/requests/create" }
      : { label: "Create Offer", to: "/users/user-01/offers/create" };

  async function handleLogout() {
    clearMockSession();
    setIsMenuOpen(false);

    try {
      await fetch("/api/logout", {
        method: "POST",
      });
    } catch {
      // Local dev may not expose a logout endpoint.
    }

    navigate("/login", { replace: true });
  }

  return (
    <header className="relative z-20 px-4 pt-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl rounded-[1.75rem] border border-white/70 bg-white/80 px-4 py-4 shadow-lg backdrop-blur-md sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <Link
            to={getDefaultRouteForUserType(userType)}
            className="text-lg font-extrabold tracking-[0.08em] text-slate-950 uppercase"
          >
            FeedForward
          </Link>

          <nav className="hidden items-center gap-2 md:flex" aria-label="Primary">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `${baseLinkClassName} ${
                    isActive ? "bg-slate-900 text-white hover:bg-slate-900 hover:text-white" : ""
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-amber-300 hover:text-amber-800"
            >
              Logout
            </button>
            <Link
              to={createAction.to}
              className="inline-flex rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              {createAction.label}
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setIsMenuOpen((current) => !current)}
            className="inline-flex rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-amber-300 hover:text-amber-800 md:hidden"
            aria-expanded={isMenuOpen}
            aria-controls="mobile-navigation"
            aria-label="Toggle navigation menu"
          >
            Menu
          </button>
        </div>

        {isMenuOpen ? (
          <nav
            id="mobile-navigation"
            className="mt-4 flex flex-col gap-2 border-t border-slate-200/80 pt-4 md:hidden"
            aria-label="Mobile primary"
          >
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setIsMenuOpen(false)}
                className={({ isActive }) =>
                  `${baseLinkClassName} text-left ${
                    isActive ? "bg-slate-900 text-white hover:bg-slate-900 hover:text-white" : ""
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}

            <Link
              to={createAction.to}
              onClick={() => setIsMenuOpen(false)}
              className="mt-2 inline-flex justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              {createAction.label}
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-amber-300 hover:text-amber-800"
            >
              Logout
            </button>
          </nav>
        ) : null}
      </div>
    </header>
  );
}
