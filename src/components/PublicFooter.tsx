import { Link } from "@tanstack/react-router";
import { BrandLogo } from "./BrandLogo";

export function PublicFooter() {
  return (
    <footer className="mt-auto bg-primary text-primary-foreground">
      <div className="sahiti-saffron-bar" />
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-2">
        <div>
          <BrandLogo compact invert />
          <p className="mt-4 max-w-md text-sm leading-6 text-white/75">
            Business finance guidance with local context for rural micro-entrepreneurs. Prototype
            built for Smart India Hackathon 2026, MoSJE problem statement 26091.
          </p>
        </div>
        <nav
          className="flex flex-wrap gap-x-6 gap-y-3 md:justify-end"
          aria-label="Footer navigation"
        >
          <Link to="/about" className="text-sm text-white/80 hover:text-white">
            About
          </Link>
          <Link to="/privacy" className="text-sm text-white/80 hover:text-white">
            Privacy
          </Link>
          <Link to="/terms" className="text-sm text-white/80 hover:text-white">
            Terms
          </Link>
        </nav>
      </div>
      <p className="border-t border-white/10 px-4 py-4 text-center text-xs text-white/60">
        Team Sahiti. A Smart India Hackathon prototype.
      </p>
    </footer>
  );
}
