import { useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import marketImg from "@/assets/market-cluster.jpg";
import { PublicFooter } from "@/components/PublicFooter";
import { PublicHeader } from "@/components/PublicHeader";
import { useLanguage } from "@/lib/i18n";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Sahiti | Hyper-local business advisory prototype" },
      {
        name: "description",
        content:
          "Sahiti is a Smart India Hackathon 2026 prototype for MoSJE problem statement 26091, built to help rural micro-entrepreneurs structure finance and read their local market.",
      },
      { property: "og:title", content: "About Sahiti" },
      {
        property: "og:description",
        content: "Why Sahiti exists, who it is for and what the prototype does not do.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: About,
});

const INCLUDED = [
  "aboutIncluded1",
  "aboutIncluded2",
  "aboutIncluded3",
  "aboutIncluded4",
  "aboutIncluded5",
  "aboutIncluded6",
] as const;

function About() {
  const { t } = useLanguage();

  useEffect(() => {
    document.title = `${t("aboutTitle")} | ${t("titleSuffix")}`;
  }, [t]);

  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6">
        <div className="overflow-hidden rounded-lg border shadow-[0_18px_50px_rgb(30_58_138_/_0.08)]">
          <img src={marketImg} alt={t("aboutHeroAlt")} className="h-56 w-full object-cover" />
        </div>
        <p className="sahiti-kicker mt-10 text-primary">{t("aboutKicker")}</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-primary">
          {t("aboutTitle")}
        </h1>

        <div className="mt-6 space-y-5 text-sm leading-7 text-muted-foreground">
          <p>{t("aboutLead")}</p>
          <p>{t("aboutProblem")}</p>

          <h2 className="font-display text-xl font-semibold text-foreground">
            {t("aboutInsideTitle")}
          </h2>
          <ul className="space-y-3">
            {INCLUDED.map((key) => (
              <li key={key} className="flex gap-3">
                <span
                  className="mt-2 size-1.5 shrink-0 rounded-full bg-saffron"
                  aria-hidden="true"
                />
                <span>{t(key)}</span>
              </li>
            ))}
          </ul>

          <h2 className="font-display text-xl font-semibold text-foreground">
            {t("aboutNotTitle")}
          </h2>
          <p>{t("aboutNotBody")}</p>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
