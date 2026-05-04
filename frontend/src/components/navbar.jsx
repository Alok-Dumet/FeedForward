import { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';

import { DEFAULT_ROUTE_BY_ROLE, getMyListingRouteForRole, useSession, useSessionActions } from '../session.js';

const baseLinkClassName = 'cursor-pointer rounded-full px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-amber-50 hover:text-amber-800';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { role, userId } = useSession();
  const { clearSession } = useSessionActions();

  if (!role) {
    return null;
  }

  const isDonor = role === 'food_provider';
  const isMyListingsDetail = new URLSearchParams(location.search).get('from') === 'my-listings' && (location.pathname.startsWith('/offers/') || location.pathname.startsWith('/requests/'));
  let browseLabel = 'Offers';
  let browsePath = '/offers';
  let myListingsLabel = 'My Requests';
  let createLabel = 'Create Request';
  if (isDonor) {
    browseLabel = 'Requests';
    browsePath = '/requests';
    myListingsLabel = 'My Offers';
    createLabel = 'Create Offer';
  }

  const navItems = [
    {
      label: browseLabel,
      to: browsePath,
      isActive: (routerIsActive) => routerIsActive && !isMyListingsDetail,
    },
    {
      label: myListingsLabel,
      to: getMyListingRouteForRole(role, userId),
      end: true,
      isActive: (routerIsActive) => routerIsActive || isMyListingsDetail,
    },
    { label: 'History', to: '/history' },
    {
      label: createLabel,
      to: getMyListingRouteForRole(role, userId, '/create'),
    },
  ];

  function getNavLinkClassName(item, routerIsActive, extraClassName = '') {
    let isActive = routerIsActive;
    if (item.isActive) {
      isActive = item.isActive(routerIsActive);
    }
    let activeClassName = '';
    if (isActive) {
      activeClassName = 'bg-slate-900 text-white hover:bg-slate-900 hover:text-white';
    }

    return `${baseLinkClassName} ${extraClassName} ${activeClassName}`;
  }

  async function handleLogout() {
    clearSession();
    setIsMenuOpen(false);

    try {
      await fetch('/api/logout', {
        method: 'POST',
      });
    } catch {
      // Local dev may not expose a logout endpoint
    }

    navigate('/login', { replace: true });
  }

  return (
    <header className="sticky top-0 z-30 px-4 pt-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl rounded-[1.75rem] border border-white/70 bg-white/80 px-4 py-4 shadow-lg backdrop-blur-md sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <Link to={DEFAULT_ROUTE_BY_ROLE[role] ?? '/login'} className="cursor-pointer text-lg font-extrabold tracking-[0.08em] text-slate-950 uppercase">
            FeedForward
          </Link>

          <nav className="hidden items-center gap-2 md:flex" aria-label="Primary">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => getNavLinkClassName(item, isActive)}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <button type="button" onClick={handleLogout} className="btn-soft">
              Logout
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsMenuOpen((current) => !current)}
            className="btn-soft py-2 md:hidden"
            aria-expanded={isMenuOpen}
            aria-controls="mobile-navigation"
            aria-label="Toggle navigation menu"
          >
            Menu
          </button>
        </div>

        {isMenuOpen ? (
          <nav id="mobile-navigation" className="mt-4 flex flex-col gap-2 border-t border-slate-200/80 pt-4 md:hidden" aria-label="Mobile primary">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setIsMenuOpen(false)} className={({ isActive }) => getNavLinkClassName(item, isActive, 'text-left')}>
                {item.label}
              </NavLink>
            ))}

            <button type="button" onClick={handleLogout} className="btn-soft justify-center">
              Logout
            </button>
          </nav>
        ) : null}
      </div>
    </header>
  );
}
