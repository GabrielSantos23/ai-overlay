import { Link, Outlet } from "react-router-dom";

export function App() {
  return (
    <div style={{ fontFamily: "system-ui, -apple-system, Segoe UI, Roboto" }}>
      <header style={{ padding: "1rem", borderBottom: "1px solid #eee" }}>
        <nav style={{ display: "flex", gap: "1rem" }}>
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
          <Link to="/login">Login</Link>
        </nav>
      </header>
      <main style={{ padding: "1.5rem" }}>
        <Outlet />
      </main>
      <footer style={{ padding: "1rem", borderTop: "1px solid #eee" }}>
        <small>AI Overlay Site</small>
      </footer>
    </div>
  );
}


