import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentsTab } from "@/components/calculations/DocumentsTab";
import { LoanMonitorTab } from "@/components/calculations/LoanMonitorTab";
import { MarketTab } from "@/components/calculations/MarketTab";
import { SchemeApplyTab } from "@/components/calculations/SchemeApplyTab";
import { useLanguage } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/calculations")({
  head: () => ({
    meta: [
      { title: "Calculations | Sahiti" },
      {
        name: "description",
        content:
          "Structure a loan, build a document checklist, track returns and find a scheme that fits.",
      },
      { property: "og:title", content: "Sahiti calculations" },
      {
        property: "og:description",
        content: "Loan structuring, documents, ROI tracking and scheme applications.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Calculations,
});

const TABS = [
  { value: "documents", labelKey: "tabDocuments", panel: <DocumentsTab /> },
  { value: "market", labelKey: "tabMarket", panel: <MarketTab /> },
  { value: "monitor", labelKey: "tabLoanMonitor", panel: <LoanMonitorTab /> },
  { value: "apply", labelKey: "tabApply", panel: <SchemeApplyTab /> },
] as const;

function Calculations() {
  const { t } = useLanguage();
  const [current, setCurrent] = useState("documents");
  const listRef = useRef<HTMLDivElement>(null);

  /*
   * The panels are long, so a tab can be switched from a long way down the page.
   * If the tab strip has already scrolled off the top, bring it back; scroll-mt
   * keeps it clear of the sticky header. Left alone when the strip is already
   * visible, because yanking the page then is just annoying.
   */
  function changeTab(next: string) {
    setCurrent(next);
    const strip = listRef.current;
    if (!strip) return;
    if (strip.getBoundingClientRect().top < 0) {
      strip.scrollIntoView({ block: "start" });
    }
  }

  return (
    <>
      <PageHeader title={t("calcTitle")} description={t("calcSubtitle")} />

      <Tabs value={current} onValueChange={changeTab}>
        <div ref={listRef} className="scroll-mt-28">
          <TabsList className="flex h-auto w-full flex-wrap justify-start">
            {TABS.map((entry) => (
              <TabsTrigger key={entry.value} value={entry.value}>
                {t(entry.labelKey)}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {TABS.map((entry) => (
          <TabsContent
            key={entry.value}
            value={entry.value}
            /*
             * Panels differ wildly in height. A floor stops the page from
             * collapsing and re-growing under the user when they switch tabs.
             */
            className="sahiti-tab-panel mt-6"
          >
            {entry.panel}
          </TabsContent>
        ))}
      </Tabs>
    </>
  );
}
