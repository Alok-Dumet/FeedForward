import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import BackGround1 from "./components/background1.jsx";
import ErrorCheck from "./pages/errorCheck/errorCheck.jsx";
import Index from "./pages/index/index.jsx";
import Login from "./pages/login/login.jsx";
import Register from "./pages/register/register.jsx";
import Home from "./pages/home/home.jsx";
import homeLoader from "./pages/home/homeLoader.jsx";
import Offers from "./pages/offers/offers.jsx";
import offersLoader from "./pages/offers/offersLoader.jsx";
import Requests from "./pages/requests/requests.jsx";
import requestsLoader from "./pages/requests/requestsLoader.jsx";
import Details from "./pages/details/details.jsx";
import detailsLoader from "./pages/details/detailsLoader.jsx";
import UserOffers from "./pages/userOffers/userOffers.jsx";
import userOffersLoader from "./pages/userOffers/userOffersLoader.jsx";
import UserRequests from "./pages/userRequests/userRequests.jsx";
import userRequestsLoader from "./pages/userRequests/userRequestsLoader.jsx";
import UserOfferCreate from "./pages/userOfferCreate/userOfferCreate.jsx";
import userOfferCreateLoader from "./pages/userOfferCreate/userOfferCreateLoader.jsx";
import UserRequestCreate from "./pages/userRequestCreate/userRequestCreate.jsx";
import userRequestCreateLoader from "./pages/userRequestCreate/userRequestCreateLoader.jsx";
import History from "./pages/history/history.jsx";
import historyLoader from "./pages/history/historyLoader.jsx";

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
    element: <BackGround1 />,
    errorElement: <ErrorCheck />,
    children: [
      {
        path: "/",
        element: <Index />,
      },
      {
        path: "/login",
        element: <Login />,
      },
      {
        path: "/register",
        element: <Register />,
      },
      {
        path: "/home",
        element: <Home />,
        loader: homeLoader,
      },
      {
        path: "/offers",
        element: <Offers />,
        loader: offersLoader,
      },
      {
        path: "/requests",
        element: <Requests />,
        loader: requestsLoader,
      },
      {
        path: "/details",
        element: <Details />,
        loader: detailsLoader,
      },
      {
        path: "/history",
        element: <History />,
        loader: historyLoader,
      },
      {
        path: "/users/:id/offers",
        element: <UserOffers />,
        loader: userOffersLoader,
      },
      {
        path: "/users/:id/offers/create",
        element: <UserOfferCreate />,
        loader: userOfferCreateLoader,
      },
      {
        path: "/users/:id/requests",
        element: <UserRequests />,
        loader: userRequestsLoader,
      },
      {
        path: "/users/:id/requests/create",
        element: <UserRequestCreate />,
        loader: userRequestCreateLoader,
      },
    ],
  },
  // {
  //   element: <Background2 />
  //   errorElement:
  //   children:{

  //   }
  // },
]);

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
