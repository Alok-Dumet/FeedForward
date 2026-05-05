import { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';

import { getMyListingRouteForRole, useSession, useSessionActions } from '../session.js';
import { apiRequest } from '../utils/api.js';
import { useToast } from './toast.jsx';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { defaultRoute, role, userId } = useSession();
  const { clearSession } = useSessionActions();
  const { showToast } = useToast();

  if (!role) {
    return null;
  }

  const isDonor = role === 'food_provider';
  const searchParams = new URLSearchParams(location.search);
  const cameFromMyListings = searchParams.get('from') === 'my-listings';
  const isListingDetailsPage = location.pathname.startsWith('/offers/') || location.pathname.startsWith('/requests/');
  const isMyListingsDetail = cameFromMyListings && isListingDetailsPage;
  const myListingsPath = getMyListingRouteForRole(role, userId);
  const createListingPath = getMyListingRouteForRole(role, userId, '/create');
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
      to: myListingsPath,
      end: true,
      isActive: (routerIsActive) => routerIsActive || isMyListingsDetail,
    },
    { label: 'History', to: '/history' },
    {
      label: createLabel,
      to: createListingPath,
    },
  ];

  function getNavLinkClassName(item, routerIsActive, extraClassName = '') {
    let isActive = routerIsActive;
    if (item.isActive) {
      isActive = item.isActive(routerIsActive);
    }
    if (isActive) {
      return `nav-link ${extraClassName} nav-link-active`.trim();
    }

    return `nav-link ${extraClassName}`.trim();
  }

  async function handleLogout() {
    setIsMenuOpen(false);

    try {
      await apiRequest('/api/logout', {
        method: 'POST',
        errorMessage: 'Unable to log out.',
        networkErrorMessage: 'Network error while logging out.',
      });
    } catch (error) {
      showToast(error.message, 'error');
      return;
    }

    clearSession();
    navigate('/login', { replace: true });
  }

  return (
    <header className="sticky top-0 z-30 px-4 pt-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl rounded-[1.75rem] border border-white/70 bg-white/80 px-4 py-4 shadow-lg backdrop-blur-md sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <Link to={defaultRoute} className="cursor-pointer text-lg font-extrabold tracking-[0.08em] text-slate-950 uppercase">
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
