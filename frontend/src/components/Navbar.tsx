import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-base-border bg-base/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-display font-semibold text-lg">
          <span className="w-2 h-2 rounded-full bg-signal shadow-glow" />
          HireSense <span className="text-signal">AI</span>
        </Link>

        <nav className="flex items-center gap-6 text-sm font-medium text-ink-muted">
          {user ? (
            <>
              <Link to="/resume" className="hover:text-ink transition-colors">
                Resume Analysis
              </Link>
              <span className="hidden sm:inline text-ink-faint">|</span>
              <span className="hidden sm:inline text-ink-muted">Hi, {user.name.split(" ")[0]}</span>
              <button
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                className="btn-secondary py-1.5 px-4"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-ink transition-colors">
                Log in
              </Link>
              <Link to="/register" className="btn-primary py-1.5 px-4">
                Get started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
