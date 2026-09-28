import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/lib/i18n";
import { BrandLogo } from "./BrandLogo";
import { Button } from "./ui/button";

const linkTargets = ["/about", "/privacy", "/terms"] as const;

export function PublicHeader() {
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();

  const links = [
    { to: linkTargets[0], label: t("navAbout") },
    { to: linkTargets[1], label: t("navPrivacy") },
    { to: linkTargets[2], label: t("navTerms") },
  ];

  return (
    <header className="sticky top-0 z-40 bg-primary text-primary-foreground shadow-[0_8px_28px_rgb(24_37_58_/_0.18)]">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" aria-label="Sahiti home">
          <BrandLogo compact invert />
        </Link>
        <nav className="hidden items-center gap-7 md:flex" aria-label="Main navigation">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-sm font-medium text-white/80 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
          <Button asChild className="bg-saffron font-semibold text-foreground hover:bg-saffron/90">
            <Link to="/auth">Get Started</Link>
          </Button>
        </nav>
        <Button
          className="text-white hover:bg-white/10 md:hidden"
          variant="ghost"
          size="icon"
          aria-expanded={open}
          aria-label={open ? t("navCloseMenu") : t("navOpenMenu")}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X /> : <Menu />}
        </Button>
      </div>
      {open && (
        <nav
          className="border-t border-white/15 px-4 py-4 md:hidden"
          aria-label="Mobile navigation"
        >
          <div className="flex flex-col gap-3">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className="py-2 text-sm font-medium text-white"
              >
                {link.label}
              </Link>
            ))}
            <Button
              asChild
              className="bg-saffron font-semibold text-foreground hover:bg-saffron/90"
            >
              <Link to="/auth">{t("getStarted")}</Link>
            </Button>
          </div>
        </nav>
      )}
      <div className="sahiti-saffron-bar" />
    </header>
  );
}
