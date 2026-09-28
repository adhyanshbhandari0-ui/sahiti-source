import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Calculator, LogOut, Map, Newspaper, Sparkles, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { BrandLogo } from "./BrandLogo";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Button } from "./ui/button";
import { useLanguage } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { cn } from "@/lib/utils";

/**
 * Sahiti has four destinations after sign-in: the Live feed (home), Sahiti AI,
 * the Risk map, and Business calculations. Every other path still exists but is
 * reached from inside these pages, so the nav never offers two ways into the
 * same feature.
 */
const links = [
  { to: "/dashboard" as const, key: "feed", icon: Newspaper },
  { to: "/ai" as const, key: "assistant", icon: Sparkles },
  { to: "/heatmap" as const, key: "heatmap", icon: Map },
  { to: "/calculations" as const, key: "calculations", icon: Calculator },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const { signOut } = useSession();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  async function handleSignOut() {
    await signOut();
    await navigate({ to: "/" });
  }

  function navClass(to: string) {
    const active = pathname === to || pathname.startsWith(`${to}/`);
    return cn(
      "relative flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium",
      active
        ? "bg-primary text-primary-foreground shadow-sm"
        : "text-foreground/80 hover:bg-secondary hover:text-primary",
    );
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-40 bg-primary text-primary-foreground shadow-[0_8px_28px_rgb(24_37_58_/_0.18)]">
        <div className="mx-auto grid h-16 max-w-7xl grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 px-4 sm:px-6">
          {/* Logo owns the centre column so the header reads as one lockup (BUG-01). */}
          <Link
            to="/dashboard"
            aria-label="Sahiti dashboard"
            className="order-2 justify-self-center"
          >
            <BrandLogo compact invert hideSubtitle />
          </Link>
          <div className="order-1 flex min-w-0 items-center gap-1">
            <LanguageSwitcher />
          </div>
          <div className="order-3 flex items-center justify-end gap-2">
            <Button
              variant="outline"
              className="hidden border-white/30 bg-transparent text-white hover:bg-white/10 lg:inline-flex"
              onClick={handleSignOut}
            >
              <LogOut aria-hidden="true" className="size-4" />
              {t("logout")}
            </Button>
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10 lg:hidden"
            >
              <Link to="/profile" aria-label={t("profile")}>
                <UserRound aria-hidden="true" className="size-5" />
              </Link>
            </Button>
          </div>
        </div>
        <div className="sahiti-saffron-bar" />{" "}
        {/* Desktop secondary nav scrolls with the page, so the sticky header
              stays one bar tall and the content starts higher (BUG-03). */}
        <nav
          className="relative z-40 mx-auto hidden max-w-7xl items-center justify-center gap-1 border-b border-border/70 bg-background px-4 py-2 text-foreground lg:flex sm:px-6"
          aria-label="Main navigation"
        >
          {links.map((link) => (
            <Link key={link.to} to={link.to} className={navClass(link.to)}>
              <link.icon aria-hidden="true" className="size-4" />
              <span className="hidden xl:inline">{t(link.key)}</span>
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 pb-24 pt-8 sm:px-6 lg:pb-10">{children}</main>
      <nav
        className="sahiti-mobile-nav fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgb(24_37_58_/_0.06)] backdrop-blur lg:hidden"
        aria-label="Primary mobile navigation"
      >
        <div className="mx-auto grid h-16 max-w-lg grid-cols-4">
          {links.map((link) => {
            const active = pathname === link.to || pathname.startsWith(`${link.to}/`);
            return (
              <Link
                key={link.to}
                to={link.to}
                aria-label={t(link.key)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex min-w-0 flex-col items-center justify-center gap-1 px-1 text-[11px] font-medium",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {active ? (
                  <span
                    className="absolute inset-x-5 top-0 h-0.5 rounded-full bg-saffron"
                    aria-hidden="true"
                  />
                ) : null}
                <link.icon aria-hidden="true" className="size-5 shrink-0" />
                <span className="w-full truncate text-center">{t(link.key)}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
