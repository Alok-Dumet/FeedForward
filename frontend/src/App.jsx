import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import BackGround1 from "./components/background1.jsx";
import ErrorCheck from "./pages/errorCheck/errorCheck.jsx";
import Index from "./pages/index/index.jsx";
import Login from "./pages/login/login.jsx";
import Register from "./pages/register/register.jsx";
import Home from "./pages/home/home.jsx";
import homeLoader from "./pages/home/homeLoader.jsx";

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
        loader: homeLoader
      },
    ],
  }
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
