import type { MouseEvent, ReactNode } from "react";

export type AppRoute = "/" | "/builder" | "/learn";
export type Navigate = (route: AppRoute, query?: string) => void;

interface SiteLayoutProps {
  children: ReactNode;
  onNavigate: Navigate;
  route: AppRoute;
}

function handleLink(
  event: MouseEvent<HTMLAnchorElement>,
  onNavigate: Navigate,
  route: AppRoute,
  query = "",
) {
  if (
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) return;
  event.preventDefault();
  onNavigate(route, query);
}

export function RouteLink({
  "aria-label": ariaLabel,
  children,
  className,
  onNavigate,
  query = "",
  to,
}: {
  "aria-label"?: string;
  children: ReactNode;
  className?: string;
  onNavigate: Navigate;
  query?: string;
  to: AppRoute;
}) {
  return (
    <a
      aria-label={ariaLabel}
      className={className}
      href={`${to}${query}`}
      onClick={(event) => handleLink(event, onNavigate, to, query)}
    >
      {children}
    </a>
  );
}

export function SiteLayout({
  children,
  onNavigate,
  route,
}: SiteLayoutProps) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <RouteLink className="brand" onNavigate={onNavigate} to="/" aria-label="QubitLab home">
          <span className="brand-mark" aria-hidden="true"><span /><span /><span /></span>
          <span>qubit<span className="brand-light">lab</span></span>
        </RouteLink>
        <nav className="primary-nav" aria-label="Main navigation">
          {([
            ["/", "Home"],
            ["/builder", "Builder"],
            ["/learn", "Learn"],
          ] as const).map(([path, label]) => (
            <RouteLink
              className={`nav-link ${route === path ? "nav-link-active" : ""}`}
              key={path}
              onNavigate={onNavigate}
              to={path}
            >
              {label}
            </RouteLink>
          ))}
        </nav>
        <span className="version-label">VTU-QFF-HC-0065</span>
      </header>
      {children}
      <footer className="site-footer">
        <div>
          <strong>Team VTU HC Titans</strong>
          <span>VTU-QFF-HC-0065</span>
        </div>
        <span>IBM Quantum x VTU Qiskit Fall Fest 2026</span>
      </footer>
    </div>
  );
}
