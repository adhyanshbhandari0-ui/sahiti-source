import { useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PublicFooter } from "@/components/PublicFooter";
import { PublicHeader } from "@/components/PublicHeader";
import { useLanguage } from "@/lib/i18n";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms and Conditions | Sahiti" },
      {
        name: "description",
        content:
          "Terms of use for the Sahiti prototype: eligibility, acceptable use, prototype disclaimers, liability limits and dispute resolution in New Delhi.",
      },
      { property: "og:title", content: "Sahiti Terms and Conditions" },
      {
        property: "og:description",
        content: "Eligibility, acceptable use, disclaimers and dispute resolution for Sahiti.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Terms,
});

const RULES = ["termsS6P1", "termsS6P2", "termsS6P3", "termsS6P4"] as const;

const SECTIONS = [
  { heading: "termsS1H", body: "termsS1" },
  { heading: "termsS2H", body: "termsS2" },
  { heading: "termsS3H", body: "termsS3" },
  { heading: "termsS4H", body: "termsS4" },
  { heading: "termsS5H", body: "termsS5" },
] as const;

const TRAILING_SECTIONS = [
  { heading: "termsS7H", body: "termsS7" },
  { heading: "termsS8H", body: "termsS8" },
] as const;

function Terms() {
  const { t } = useLanguage();

  useEffect(() => {
    document.title = `${t("termsTitle")} | ${t("titleSuffix")}`;
  }, [t]);

  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-semibold">{t("termsTitle")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("termsUpdated")}</p>
        <div className="mt-8 space-y-6 text-sm leading-7 text-muted-foreground">
          {SECTIONS.map((section) => (
            <section key={section.heading}>
              <h2 className="text-lg font-semibold text-foreground">{t(section.heading)}</h2>
              <p>{t(section.body)}</p>
            </section>
          ))}
          <section>
            <h2 className="text-lg font-semibold text-foreground">{t("termsS6H")}</h2>
            <ul className="list-disc space-y-2 pl-5">
              {RULES.map((key) => (
                <li key={key}>{t(key)}</li>
              ))}
            </ul>
            <p className="mt-3">{t("termsS6Outro")}</p>
          </section>
          {TRAILING_SECTIONS.map((section) => (
            <section key={section.heading}>
              <h2 className="text-lg font-semibold text-foreground">{t(section.heading)}</h2>
              <p>{t(section.body)}</p>
            </section>
          ))}
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
