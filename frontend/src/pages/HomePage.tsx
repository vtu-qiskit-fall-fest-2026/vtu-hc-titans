import { RouteLink, SiteLayout, type AppRoute, type Navigate } from "../components/SiteLayout";

export function HomePage({
  onNavigate,
  route,
}: {
  onNavigate: Navigate;
  route: AppRoute;
}) {
  return (
    <SiteLayout onNavigate={onNavigate} route={route}>
      <main className="home-page">
        <section className="home-hero">
          <div className="hero-copy">
            <div className="eyebrow"><span /> QUANTUM, MADE TANGIBLE</div>
            <h1>Curiosity meets<br /><span>quantum.</span></h1>
            <p>
              Build a circuit, run a local simulation, and see how quantum gates
              turn into measurable outcomes.
            </p>
            <div className="hero-actions">
              <RouteLink className="button button-primary" onNavigate={onNavigate} to="/builder">
                Build a Circuit <span aria-hidden="true">↗</span>
              </RouteLink>
              <RouteLink
                className="button button-secondary"
                onNavigate={onNavigate}
                query="?example=bell"
                to="/builder"
              >
                Run Simulation <span aria-hidden="true">→</span>
              </RouteLink>
            </div>
            <RouteLink className="tutorial-link" onNavigate={onNavigate} to="/learn">
              Explore Tutorials <span aria-hidden="true">↗</span>
            </RouteLink>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="orbit orbit-three" />
            <span className="orbit-node node-one" />
            <span className="orbit-node node-two" />
            <span className="orbit-node node-three" />
            <span className="hero-ket">|ψ⟩</span>
            <span className="hero-label label-one">H</span>
            <span className="hero-label label-two">CX</span>
            <span className="hero-label label-three">M</span>
            <div className="hero-caption">FROM CIRCUIT TO OUTCOME</div>
          </div>
        </section>
        <section className="home-intro">
          <span className="step-number">01</span>
          <div>
            <h2>A first step into quantum circuits.</h2>
            <p>
              Place familiar gates, choose which qubits to measure, then compare
              the simulator&apos;s counts with the circuit&apos;s ideal probabilities.
            </p>
          </div>
          <RouteLink className="button button-secondary" onNavigate={onNavigate} to="/builder">
            Open the builder <span aria-hidden="true">↗</span>
          </RouteLink>
        </section>
      </main>
    </SiteLayout>
  );
}
