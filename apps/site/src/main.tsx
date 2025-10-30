import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { App } from "./routes/App";
import { Home } from "./routes/Home";
import { About } from "./routes/About";
import { Login } from "./routes/Login";
import { AuthCallback } from "./routes/AuthCallback";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: "about", element: <About /> },
      { path: "login", element: <Login /> },
      { path: "auth/callback", element: <AuthCallback /> },
    ],
  },
]);

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  const RP = RouterProvider as unknown as React.ComponentType<{
    router: typeof router;
    fallbackElement?: React.ReactNode;
  }>;
  root.render(<RP router={router} fallbackElement={<div>Loading...</div>} />);
}
