import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import BackGround1 from './components/background1.jsx';
import { ToastProvider } from './components/toast.jsx';
import ErrorCheck from './pages/errorCheck/errorCheck.jsx';
import Index from './pages/index/index.jsx';
import Login from './pages/login/login.jsx';
import Register from './pages/register/register.jsx';
import NotAuthorized from './pages/notAuthorized/notAuthorized.jsx';
import Offers, { offersLoader } from './pages/offers/offers.jsx';
import Requests, { requestsLoader } from './pages/requests/requests.jsx';
import Details from './pages/details/details.jsx';
import { historyDetailsLoader, offerDetailsLoader, requestDetailsLoader } from './pages/details/detailsLoader.jsx';
import UserOffers, { userOffersLoader } from './pages/userOffers/userOffers.jsx';
import UserRequests, { userRequestsLoader } from './pages/userRequests/userRequests.jsx';
import UserOfferCreate, { userOfferCreateLoader } from './pages/userOfferCreate/userOfferCreate.jsx';
import UserRequestCreate, { userRequestCreateLoader } from './pages/userRequestCreate/userRequestCreate.jsx';
import History from './pages/history/history.jsx';
import historyLoader from './pages/history/historyLoader.jsx';
import { withProtectedLoader } from './auth.js';
import { fetchSession } from './session.js';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

const router = createBrowserRouter([
  {
    id: 'root',
    element: <BackGround1 />,
    loader: ({ request }) => fetchSession(request),
    errorElement: <ErrorCheck />,
    children: [
      { path: '/', element: <Index /> },
      { path: '/login', element: <Login /> },
      { path: '/register', element: <Register /> },
      { path: '/not_authorized', element: <NotAuthorized /> },
      {
        path: '/offers',
        element: <Offers />,
        loader: withProtectedLoader(offersLoader, ['recipient_organization']),
      },
      {
        path: '/offers/:id',
        element: <Details />,
        loader: withProtectedLoader(offerDetailsLoader),
      },
      {
        path: '/requests',
        element: <Requests />,
        loader: withProtectedLoader(requestsLoader, ['food_provider']),
      },
      {
        path: '/requests/:id',
        element: <Details />,
        loader: withProtectedLoader(requestDetailsLoader),
      },
      {
        path: '/history',
        element: <History />,
        loader: withProtectedLoader(historyLoader),
      },
      {
        path: '/history/:id',
        element: <Details />,
        loader: withProtectedLoader(historyDetailsLoader),
      },
      {
        path: '/users/:id/offers',
        element: <UserOffers />,
        loader: withProtectedLoader(userOffersLoader, ['food_provider']),
      },
      {
        path: '/users/:id/offers/create',
        element: <UserOfferCreate />,
        loader: withProtectedLoader(userOfferCreateLoader, ['food_provider']),
      },
      {
        path: '/users/:id/requests',
        element: <UserRequests />,
        loader: withProtectedLoader(userRequestsLoader, ['recipient_organization']),
      },
      {
        path: '/users/:id/requests/create',
        element: <UserRequestCreate />,
        loader: withProtectedLoader(userRequestCreateLoader, ['recipient_organization']),
      },
    ],
  },
]);

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </QueryClientProvider>
  );
}
