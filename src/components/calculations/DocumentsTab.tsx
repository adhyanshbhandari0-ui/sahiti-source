import jsPDF from "jspdf";
import { Download } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SCHEME_SECTORS, SCHEMES } from "@/data/schemes";
import { useLanguage } from "@/lib/i18n";
import { Panel, ShareBar } from "./shared";

/*
 * Paperwork does not arrive in one pile. Banks ask for it in stages, so the
 * checklist is grouped by the aspect a person actually gathers it under.
 */

type AspectId = "identity" | "business" | "finance" | "project" | "premises" | "scheme";

const ASPECTS: Array<{ id: AspectId; titleKey: string; blurbKey: string }> = [
  { id: "identity", titleKey: "docsAspectIdentity", blurbKey: "docsAspectIdentityBlurb" },
  { id: "business", titleKey: "docsAspectBusiness", blurbKey: "docsAspectBusinessBlurb" },
  { id: "finance", titleKey: "docsAspectFinance", blurbKey: "docsAspectFinanceBlurb" },
  { id: "project", titleKey: "docsAspectProject", blurbKey: "docsAspectProjectBlurb" },
  { id: "premises", titleKey: "docsAspectPremises", blurbKey: "docsAspectPremisesBlurb" },
  { id: "scheme", titleKey: "docsAspectScheme", blurbKey: "docsAspectSchemeBlurb" },
];

type DocItem = {
  id: string;
  labelKey: string;
  aspect: AspectId;
  /** Only offered for these business categories. Empty means every category. */
  sectors?: string[];
  /** Only offered for these scheme ids. Empty means every scheme. */
  schemes?: string[];
};

const DOCUMENTS: DocItem[] = [
  // Identity and address
  { id: "photo", labelKey: "docPhoto", aspect: "identity" },
  { id: "id-proof", labelKey: "docIdProof", aspect: "identity" },
  { id: "addr-proof", labelKey: "docAddrProof", aspect: "identity" },

  // Business registration
  { id: "udyam", labelKey: "docUdyam", aspect: "business" },
  { id: "gst", labelKey: "docGst", aspect: "business" },
  { id: "shop-est", labelKey: "docShopEst", aspect: "business" },
  {
    id: "fssai",
    labelKey: "docFssai",
    aspect: "business",
    sectors: ["Food"],
  },
  {
    id: "craft-proof",
    labelKey: "docCraftProof",
    aspect: "business",
    sectors: ["Artisan"],
  },

  // Financial records
  { id: "bank-6m", labelKey: "docBank6m", aspect: "finance" },
  { id: "existing-loans", labelKey: "docExistingLoans", aspect: "finance" },
  { id: "itr", labelKey: "docItr", aspect: "finance" },
  {
    id: "milk-buyer",
    labelKey: "docMilkBuyer",
    aspect: "finance",
    sectors: ["Dairy"],
  },

  // Project and quotations
  { id: "quotes", labelKey: "docQuotes", aspect: "project" },
  { id: "cost-sheet", labelKey: "docCostSheet", aspect: "project" },
  { id: "plan", labelKey: "docPlan", aspect: "project" },
  {
    id: "supplier-list",
    labelKey: "docSupplierList",
    aspect: "project",
    sectors: ["Retail", "General store", "Hardware"],
  },
  {
    id: "cattle-quote",
    labelKey: "docCattleQuote",
    aspect: "project",
    sectors: ["Dairy"],
  },
  {
    id: "crop-plan",
    labelKey: "docCropPlan",
    aspect: "project",
    sectors: ["Agriculture"],
  },
  {
    id: "tool-quote",
    labelKey: "docToolQuote",
    aspect: "project",
    sectors: ["Repair", "Artisan"],
  },
  {
    id: "machinery-quote",
    labelKey: "docMachineryQuote",
    aspect: "project",
    sectors: ["Manufacturing", "Textiles"],
  },

  // Premises
  { id: "rent", labelKey: "docRent", aspect: "premises" },
  {
    id: "kitchen",
    labelKey: "docKitchen",
    aspect: "premises",
    sectors: ["Food"],
  },
  {
    id: "land",
    labelKey: "docLand",
    aspect: "premises",
    sectors: ["Agriculture", "Dairy"],
  },
  {
    id: "workshop",
    labelKey: "docWorkshop",
    aspect: "premises",
    sectors: ["Repair", "Garage"],
  },
  {
    id: "power",
    labelKey: "docPower",
    aspect: "premises",
    sectors: ["Manufacturing"],
  },

  // Scheme specific
  {
    id: "trade-list",
    labelKey: "docTradeList",
    aspect: "scheme",
    schemes: ["pm-vishwakarma"],
  },
  {
    id: "vending-cert",
    labelKey: "docVendingCert",
    aspect: "scheme",
    schemes: ["pm-svanidhi"],
  },
  {
    id: "vending-photo",
    labelKey: "docVendingPhoto",
    aspect: "scheme",
    schemes: ["pm-svanidhi"],
  },
  {
    id: "category-cert",
    labelKey: "docCategoryCert",
    aspect: "scheme",
    schemes: ["stand-up-india", "pmegp"],
  },
  {
    id: "greenfield",
    labelKey: "docGreenfield",
    aspect: "scheme",
    schemes: ["stand-up-india"],
  },
  {
    id: "margin-proof",
    labelKey: "docMarginProof",
    aspect: "scheme",
    schemes: ["sidbi-micro"],
  },
  {
    id: "collateral",
    labelKey: "docCollateral",
    aspect: "scheme",
    schemes: ["sidbi-term-loan", "cgtmse"],
  },
  {
    id: "project-report",
    labelKey: "docProjectReport",
    aspect: "scheme",
    schemes: ["sidbi-term-loan", "ahidf", "nlm"],
  },
  {
    id: "education-cert",
    labelKey: "docEducationCert",
    aspect: "scheme",
    schemes: ["pmegp"],
  },
  {
    id: "licence",
    labelKey: "docLicence",
    aspect: "scheme",
    schemes: ["pli-pharma", "pli-telecom", "spi", "amdcf"],
  },
];

function matches(item: DocItem, sector: string, schemeId: string) {
  if (item.sectors && item.sectors.length > 0 && !item.sectors.includes(sector)) return false;
  if (item.schemes && item.schemes.length > 0 && !item.schemes.includes(schemeId)) return false;
  return true;
}

export function DocumentsTab() {
  const { t } = useLanguage();
  const [sector, setSector] = useState<string>("Retail");
  const [schemeId, setSchemeId] = useState<string>("pmmy-mudra");
  const [collected, setCollected] = useState<Record<string, boolean>>({});

  const groups = useMemo(() => {
    const visible = DOCUMENTS.filter((item) => matches(item, sector, schemeId));
    return ASPECTS.map((aspect) => ({
      ...aspect,
      items: visible.filter((item) => item.aspect === aspect.id),
    })).filter((group) => group.items.length > 0);
  }, [sector, schemeId]);

  const total = groups.reduce((sum, group) => sum + group.items.length, 0);
  const done = groups.reduce(
    (sum, group) => sum + group.items.filter((item) => collected[item.id]).length,
    0,
  );
  const selectedScheme = SCHEMES.find((scheme) => scheme.id === schemeId);

  function download() {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(t("docsPdfTitle"), 14, 20);
    doc.setFontSize(11);
    doc.text(`${t("docsPdfCategory")}: ${t(`sector.${sector}`)}`, 14, 30);
    doc.text(`${t("docsPdfScheme")}: ${selectedScheme?.name ?? t("docsNotSelected")}`, 14, 37);
    doc.text(`${t("docsPdfProgress")}: ${done} / ${total}`, 14, 44);

    let y = 56;
    for (const group of groups) {
      if (y > 265) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(12);
      doc.text(t(group.titleKey), 14, y);
      y += 7;
      doc.setFontSize(10);
      for (const item of group.items) {
        if (y > 275) {
          doc.addPage();
          y = 20;
        }
        doc.text(`${collected[item.id] ? "[x]" : "[ ]"} ${t(item.labelKey)}`, 18, y);
        y += 6;
      }
      y += 4;
    }

    doc.setFontSize(9);
    doc.text(t("docsPdfFooter"), 14, Math.min(y + 4, 285));
    doc.save("sahiti-document-checklist.pdf");
    toast.success(t("docsDownloaded"));
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Panel title={t("docsPrepareTitle")} className="h-fit">
          <div className="space-y-4">
            <div>
              <Label htmlFor="doc-sector">{t("docsBusinessCategory")}</Label>
              <Select value={sector} onValueChange={setSector}>
                <SelectTrigger id="doc-sector" className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SCHEME_SECTORS.map((item) => (
                    <SelectItem key={item} value={item}>
                      {t(`sector.${item}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="doc-scheme">{t("docsSchemeInMind")}</Label>
              <Select value={schemeId} onValueChange={setSchemeId}>
                <SelectTrigger id="doc-scheme" className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SCHEMES.map((scheme) => (
                    <SelectItem key={scheme.id} value={scheme.id}>
                      {scheme.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-md border bg-secondary p-4">
              <div className="flex items-baseline justify-between text-sm">
                <span className="font-medium">{t("docsOverall")}</span>
                <span className="tabular-nums text-muted-foreground">
                  {done} / {total}
                </span>
              </div>
              <div className="mt-2">
                <ShareBar
                  percent={total === 0 ? 0 : (done / total) * 100}
                  label={t("docsCollectedLabel")}
                />
              </div>
            </div>

            <Button className="w-full" onClick={download}>
              <Download aria-hidden="true" className="size-4" />
              {t("docsDownload")}
            </Button>
          </div>
        </Panel>

        <div className="space-y-4">
          {groups.map((group) => {
            const groupDone = group.items.filter((item) => collected[item.id]).length;
            const complete = groupDone === group.items.length;
            return (
              <section key={group.id} className="rounded-md border">
                <header className="flex flex-wrap items-center justify-between gap-2 border-b px-5 py-4">
                  <div>
                    <h2 className="text-base font-semibold">{t(group.titleKey)}</h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">{t(group.blurbKey)}</p>
                  </div>
                  <span
                    className={
                      complete
                        ? "text-xs font-medium text-success"
                        : "text-xs tabular-nums text-muted-foreground"
                    }
                  >
                    {groupDone}/{group.items.length}
                  </span>
                </header>
                <ul className="divide-y">
                  {group.items.map((item) => (
                    <li key={item.id} className="flex items-start gap-3 px-5 py-3">
                      <Checkbox
                        id={`doc-${item.id}`}
                        checked={Boolean(collected[item.id])}
                        onCheckedChange={(value) =>
                          setCollected((current) => ({ ...current, [item.id]: value === true }))
                        }
                      />
                      <Label
                        htmlFor={`doc-${item.id}`}
                        className="text-sm font-normal leading-6 text-foreground"
                      >
                        {t(item.labelKey)}
                      </Label>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
          <p className="text-xs leading-5 text-muted-foreground">{t("docsStartingList")}</p>
        </div>
      </div>
    </div>
  );
}
