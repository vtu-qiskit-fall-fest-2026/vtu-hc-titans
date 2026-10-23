import { useEffect, useState } from "react";
import { BuilderPage } from "./components/BuilderPage";
import { HomePage } from "./pages/HomePage";
import { LearnPage } from "./pages/LearnPage";

type Route = "/" | "/builder" | "/learn";

function currentRoute(): Route {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  return path === "/builder" || path === "/learn" ? path : "/";
}

export default function App() {
  const [route, setRoute] = useState<Route>(currentRoute);

  useEffect(() => {
    const onPopState = () => setRoute(currentRoute());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  function navigate(path: Route, query = "") {
    window.history.pushState(null, "", `${path}${query}`);
    setRoute(path);
    window.scrollTo(0, 0);
  }

  const sharedProps = {
    onNavigate: navigate,
    route,
  };

  return route === "/builder" ? (
    <BuilderPage {...sharedProps} />
  ) : route === "/learn" ? (
    <LearnPage {...sharedProps} />
  ) : (
    <HomePage {...sharedProps} />
  );
}
