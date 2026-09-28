import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CalendarClock,
  ChevronDown,
  Landmark,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SCHEMES } from "@/data/schemes";
import { supabase } from "@/integrations/supabase/client";
import { addMonths, daysUntil, formatDate, todayIso } from "@/lib/dates";
import { formatINR } from "@/lib/format";
import { useLanguage } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { Field, MoneyField, Panel } from "./shared";

const SUBSIDY_STATES = ["Not applicable", "Pending", "Approved", "Credited"] as const;

/** Database value → i18n key for the subsidy badge and select options. */
const SUBSIDY_KEYS: Record<string, string> = {
  "Not applicable": "subsidyNotApplicable",
  Pending: "subsidyPending",
  Approved: "subsidyApproved",
  Credited: "subsidyCredited",
};

/** Only the upcoming instalments show by default; the button below expands. */
const UPCOMING_ROWS = 3;
/** Safety cap so a repayment that never clears the interest cannot loop forever. */
const MAX_PROJECTED_MONTHS = 480;

type RepaymentRow = {
  installment: number;
  dueDate: Date;
  emi: number;
  interest: number;
  principal: number;
  balance: number;
};

/**
 * Amortises a loan properly: each instalment covers the interest on the
 * remaining balance first, and only the remainder reduces principal.
 */
function projectRepayments(
  outstanding: number,
  annualRate: number,
  emi: number,
  nextDue: string,
): { rows: RepaymentRow[]; clears: boolean } {
  const monthlyRate = annualRate / 100 / 12;
  let balance = outstanding;
  const rows: RepaymentRow[] = [];

  for (let index = 0; index < MAX_PROJECTED_MONTHS && balance > 0.5; index++) {
    const interest = balance * monthlyRate;
    // An EMI that cannot cover the interest will never clear the loan.
    if (emi <= interest) return { rows, clears: false };
    const principal = Math.min(emi - interest, balance);
    balance = Math.max(0, balance - principal);
    rows.push({
      installment: index + 1,
      dueDate: addMonths(nextDue, index),
      emi,
      interest,
      principal,
      balance,
    });
  }

  return { rows, clears: balance <= 0.5 };
}

type Translator = (key: string, vars?: Record<string, string | number>) => string;

function dueLabel(days: number, t: Translator): string {
  if (days < 0) {
    const n = Math.abs(days);
    return t("overdueBy", { n, s: n === 1 ? "" : "s" });
  }
  if (days === 0) return t("dueToday");
  return t("daysToGo", { n: days, s: days === 1 ? "" : "s" });
}

export function LoanMonitorTab() {
  const { user } = useSession();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  // AI explainer, per loan: which loan is streaming, its answer, and failures.
  const [aiBusyFor, setAiBusyFor] = useState<string | null>(null);
  const [aiAnswers, setAiAnswers] = useState<Record<string, string>>({});
  const [aiErrorFor, setAiErrorFor] = useState<string | null>(null);
  const [form, setForm] = useState({
    lender_name: "",
    scheme_id: "pmmy-mudra",
    sanctioned_amount: "",
    outstanding_principal: "",
    annual_interest_rate: "9",
    monthly_emi: "",
    tenure_months: "36",
    start_date: todayIso(),
    next_due_date: todayIso(),
    subsidy_status: "Pending",
  });

  const { data: loans = [] } = useQuery({
    queryKey: ["loan-accounts", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      if (!user) return [];
      const { data, error: queryError } = await supabase
        .from("loan_accounts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (queryError) throw queryError;
      return data;
    },
  });

  const portfolio = useMemo(() => {
    const sanctioned = loans.reduce((sum, loan) => sum + Number(loan.sanctioned_amount), 0);
    const outstanding = loans.reduce((sum, loan) => sum + Number(loan.outstanding_principal), 0);
    const monthlyEmi = loans.reduce((sum, loan) => sum + Number(loan.monthly_emi), 0);
    const dueDates = loans.map((loan) => loan.next_due_date).sort();
    const nearest = dueDates[0];
    return { sanctioned, outstanding, monthlyEmi, nearest };
  }, [loans]);

  async function saveLoan() {
    if (!user) return;
    setError("");

    const sanctioned = Number(form.sanctioned_amount);
    const outstanding = Number(form.outstanding_principal);
    const rate = Number(form.annual_interest_rate);
    const emi = Number(form.monthly_emi);
    const tenure = Number(form.tenure_months);

    if (!form.lender_name.trim()) return setError(t("errLender"));
    if (!(sanctioned > 0)) return setError(t("errSanctioned"));
    if (!(outstanding >= 0) || outstanding > sanctioned) {
      return setError(t("errOutstanding"));
    }
    if (!(rate >= 0 && rate <= 100)) return setError(t("errRate"));
    if (!(emi > 0)) return setError(t("errEmi"));
    if (!(tenure > 0)) return setError(t("errTenure"));
    if (form.next_due_date < form.start_date) {
      return setError(t("errDueBeforeStart"));
    }

    const scheme = SCHEMES.find((item) => item.id === form.scheme_id);
    const { error: insertError } = await supabase.from("loan_accounts").insert({
      user_id: user.id,
      lender_name: form.lender_name.trim(),
      scheme_name: scheme?.name ?? form.scheme_id,
      sanctioned_amount: sanctioned,
      outstanding_principal: outstanding,
      annual_interest_rate: rate,
      monthly_emi: emi,
      tenure_months: tenure,
      start_date: form.start_date,
      next_due_date: form.next_due_date,
      subsidy_status: form.subsidy_status,
    });
    if (insertError) return setError(insertError.message);

    setShowForm(false);
    await queryClient.invalidateQueries({ queryKey: ["loan-accounts", user.id] });
    toast.success(t("loanAdded"));
  }

  async function removeLoan(id: string) {
    await supabase.from("loan_accounts").delete().eq("id", id);
    await queryClient.invalidateQueries({ queryKey: ["loan-accounts", user?.id] });
    toast.success(t("loanRemoved"));
  }

  /**
   * "Explain this loan with AI": send the loan's facts with the translated
   * question to the same chat endpoint the feed uses, and stream the answer
   * under the table.
   */
  async function explainLoan(input: {
    id: string;
    lender: string;
    outstanding: number;
    rate: number;
    emi: number;
    nextDue: string;
    clears: boolean;
    months: number;
  }) {
    setAiBusyFor(input.id);
    setAiErrorFor(null);
    setAiAnswers((prev) => ({ ...prev, [input.id]: "" }));

    const facts = [
      `Lender: ${input.lender}`,
      `Outstanding: ${formatINR(input.outstanding)}`,
      `Interest: ${input.rate}% a year`,
      `Monthly EMI: ${formatINR(input.emi)}`,
      `Next due: ${input.nextDue}`,
      input.clears
        ? `Clears in about ${input.months} instalments.`
        : "The EMI does not cover the monthly interest yet.",
    ].join("; ");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: `${t("loanQuestion")}\n\n${facts}` }],
        }),
      });

      if (!response.ok || !response.body) throw new Error("no answer");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let answer = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        answer += decoder.decode(value, { stream: true });
        setAiAnswers((prev) => ({ ...prev, [input.id]: answer }));
      }
      if (!answer.trim()) throw new Error("empty answer");
    } catch {
      setAiErrorFor(input.id);
    } finally {
      setAiBusyFor(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{t("loansRepaying")}</h2>
          <p className="text-sm text-muted-foreground">{t("loansRepayingSub")}</p>
        </div>
        <Button onClick={() => setShowForm((value) => !value)}>
          <Plus aria-hidden="true" className="size-4" />
          {t("addLoan")}
        </Button>
      </div>

      {loans.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <PortfolioTile label={t("sanctioned")} value={formatINR(portfolio.sanctioned)} />
          <PortfolioTile label={t("stillOwed")} value={formatINR(portfolio.outstanding)} />
          <PortfolioTile label={t("monthlyLeave")} value={formatINR(portfolio.monthlyEmi)} />
          <PortfolioTile
            label={t("nearestDue")}
            value={portfolio.nearest ? formatDate(portfolio.nearest) : "—"}
            hint={portfolio.nearest ? dueLabel(daysUntil(portfolio.nearest), t) : undefined}
            urgent={portfolio.nearest ? daysUntil(portfolio.nearest) <= 7 : false}
          />
        </div>
      )}

      {showForm && (
        <Panel
          title={t("loanDetails")}
          description={t("loanDetailsSub")}
          action={
            <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>
              {t("cancel")}
            </Button>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field id="lender" label={t("bankLender")}>
              <Input
                id="lender"
                className="bg-muted"
                value={form.lender_name}
                onChange={(event) => setForm({ ...form, lender_name: event.target.value })}
              />
            </Field>

            <div>
              <Label htmlFor="monitor-scheme">{t("scheme")}</Label>
              <Select
                value={form.scheme_id}
                onValueChange={(value) => setForm({ ...form, scheme_id: value })}
              >
                <SelectTrigger id="monitor-scheme" className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SCHEMES.map((scheme) => (
                    <SelectItem key={scheme.id} value={scheme.id}>
                      {scheme.shortName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <MoneyField
              id="sanctioned"
              label={t("sanctionedAmount")}
              value={form.sanctioned_amount}
              onChange={(value) => setForm({ ...form, sanctioned_amount: value })}
            />
            <MoneyField
              id="outstanding"
              label={t("remainingPrincipal")}
              value={form.outstanding_principal}
              onChange={(value) => setForm({ ...form, outstanding_principal: value })}
            />
            <MoneyField
              id="emi"
              label={t("monthlyEmi")}
              value={form.monthly_emi}
              onChange={(value) => setForm({ ...form, monthly_emi: value })}
            />

            <Field id="rate" label={t("interestRateYear")}>
              <Input
                id="rate"
                className="bg-muted tabular-nums"
                inputMode="decimal"
                value={form.annual_interest_rate}
                onChange={(event) =>
                  setForm({
                    ...form,
                    annual_interest_rate: event.target.value.replace(/[^\d.]/g, ""),
                  })
                }
              />
            </Field>

            <Field id="tenure" label={t("tenureMonths")}>
              <Input
                id="tenure"
                className="bg-muted tabular-nums"
                inputMode="numeric"
                value={form.tenure_months}
                onChange={(event) =>
                  setForm({ ...form, tenure_months: event.target.value.replace(/[^\d]/g, "") })
                }
              />
            </Field>

            <Field id="start-date" label={t("loanStartDate")}>
              <Input
                id="start-date"
                type="date"
                className="bg-muted"
                value={form.start_date}
                onChange={(event) => setForm({ ...form, start_date: event.target.value })}
              />
            </Field>

            <Field id="due-date" label={t("nextDueDate")}>
              <Input
                id="due-date"
                type="date"
                className="bg-muted"
                value={form.next_due_date}
                onChange={(event) => setForm({ ...form, next_due_date: event.target.value })}
              />
            </Field>

            <div>
              <Label htmlFor="subsidy">{t("subsidyStatus")}</Label>
              <Select
                value={form.subsidy_status}
                onValueChange={(value) => setForm({ ...form, subsidy_status: value })}
              >
                <SelectTrigger id="subsidy" className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUBSIDY_STATES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {t(SUBSIDY_KEYS[status] ?? status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <p role="alert" className="mt-4 text-sm font-medium text-destructive">
              {error}
            </p>
          )}

          <Button className="mt-5" onClick={() => void saveLoan()}>
            {t("saveLoan")}
          </Button>
        </Panel>
      )}

      {loans.length === 0 && !showForm ? (
        <div className="rounded-md border border-dashed py-14 text-center">
          <Landmark aria-hidden="true" className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 font-medium">{t("nothingMonitored")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("nothingMonitoredSub")}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t("aiLoanUnavailable")}</p>
        </div>
      ) : (
        <div className="space-y-5">
          {loans.map((loan) => {
            const sanctioned = Number(loan.sanctioned_amount);
            const outstanding = Number(loan.outstanding_principal);
            const emi = Number(loan.monthly_emi);
            const rate = Number(loan.annual_interest_rate);

            const repaidPercent =
              sanctioned > 0
                ? Math.max(0, Math.min(100, ((sanctioned - outstanding) / sanctioned) * 100))
                : 0;

            const { rows, clears } = projectRepayments(outstanding, rate, emi, loan.next_due_date);
            const nextInterest = outstanding * (rate / 100 / 12);
            const dueDays = daysUntil(loan.next_due_date);
            const isOpen = expanded === loan.id;
            const visible = isOpen ? rows : rows.slice(0, UPCOMING_ROWS);
            const aiAnswer = aiAnswers[loan.id];

            return (
              <article key={loan.id} className="rounded-md border">
                <header className="flex flex-wrap items-start justify-between gap-3 border-b px-5 py-4">
                  <div>
                    <h3 className="font-semibold">{loan.lender_name}</h3>
                    <p className="text-sm text-muted-foreground">{loan.scheme_name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {t("subsidy")} {t(SUBSIDY_KEYS[loan.subsidy_status] ?? loan.subsidy_status)}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={t("removeLoanAria", { lender: loan.lender_name })}
                      onClick={() => void removeLoan(loan.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </header>

                <div className="space-y-5 p-5">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Readout label={t("sanctioned")} value={formatINR(sanctioned)} />
                    <Readout label={t("remainingPrincipal")} value={formatINR(outstanding)} />
                    <Readout
                      label={t("interestNextMonth")}
                      value={formatINR(nextInterest)}
                      hint={t("perYear", { rate })}
                    />
                    <Readout label={t("monthlyEmi")} value={formatINR(emi)} />
                  </div>

                  <div>
                    <div className="mb-2 flex justify-between text-sm">
                      <span>{t("repaidSoFar")}</span>
                      <span className="font-medium tabular-nums">{repaidPercent.toFixed(0)}%</span>
                    </div>
                    <Progress value={repaidPercent} />
                  </div>

                  {!clears && (
                    <div className="flex items-start gap-2 rounded-md border border-destructive p-3 text-sm text-destructive">
                      <AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                      <span>
                        {t("emiWarning", {
                          emi: formatINR(emi),
                          interest: formatINR(nextInterest),
                        })}
                      </span>
                    </div>
                  )}

                  <div
                    className={
                      dueDays <= 7
                        ? "flex items-center gap-2 rounded-md border border-destructive p-3 text-sm text-destructive"
                        : "flex items-center gap-2 rounded-md border bg-secondary p-3 text-sm"
                    }
                  >
                    <CalendarClock aria-hidden="true" className="size-4 shrink-0" />
                    <span>
                      <strong>{t("nextEmi")}</strong> {formatDate(loan.next_due_date)} ·{" "}
                      {dueLabel(dueDays, t)}
                    </span>
                  </div>

                  {rows.length > 0 && (
                    <div>
                      <h4 className="mb-2 text-sm font-semibold">{t("upcomingEmis")}</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <caption className="sr-only">{t("instalmentTableCaption")}</caption>
                          <thead className="bg-muted text-left">
                            <tr>
                              <th scope="col" className="p-3 font-medium">
                                #
                              </th>
                              <th scope="col" className="p-3 font-medium">
                                {t("colDue")}
                              </th>
                              <th scope="col" className="p-3 font-medium">
                                {t("colEmi")}
                              </th>
                              <th scope="col" className="p-3 font-medium">
                                {t("colInterest")}
                              </th>
                              <th scope="col" className="p-3 font-medium">
                                {t("colPrincipal")}
                              </th>
                              <th scope="col" className="p-3 font-medium">
                                {t("colBalance")}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {visible.map((row) => (
                              <tr key={row.installment} className="border-t">
                                <td className="p-3 tabular-nums">{row.installment}</td>
                                <td className="p-3 whitespace-nowrap">{formatDate(row.dueDate)}</td>
                                <td className="p-3 tabular-nums">{formatINR(row.emi)}</td>
                                <td className="p-3 tabular-nums">{formatINR(row.interest)}</td>
                                <td className="p-3 tabular-nums">{formatINR(row.principal)}</td>
                                <td className="p-3 tabular-nums">{formatINR(row.balance)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs text-muted-foreground">
                          {clears
                            ? t("clearsIn", {
                                n: rows.length,
                                s: rows.length === 1 ? "" : "s",
                              })
                            : null}
                        </p>
                        {rows.length > UPCOMING_ROWS && (
                          <Button
                            variant="outline"
                            size="sm"
                            aria-expanded={isOpen}
                            onClick={() => setExpanded(isOpen ? null : loan.id)}
                          >
                            <ChevronDown
                              aria-hidden="true"
                              className={isOpen ? "size-4 rotate-180" : "size-4"}
                            />
                            {isOpen ? t("showFewer") : t("showAllEmis", { n: rows.length })}
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Explain this loan with AI: streamed, in the chosen language. */}
                  <div className="rounded-md border bg-secondary/60 p-4">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={aiBusyFor === loan.id}
                      onClick={() =>
                        void explainLoan({
                          id: loan.id,
                          lender: loan.lender_name,
                          outstanding,
                          rate,
                          emi,
                          nextDue: formatDate(loan.next_due_date),
                          clears,
                          months: rows.length,
                        })
                      }
                    >
                      <Sparkles aria-hidden="true" className="size-4" />
                      {t("aiExplainLoan")}
                    </Button>

                    {aiBusyFor === loan.id && (
                      <p className="mt-2 text-xs text-muted-foreground">{t("aiExplaining")}</p>
                    )}

                    {aiAnswer ? (
                      <div className="mt-3 rounded-md border bg-background p-3">
                        <p className="text-sm font-medium">{t("aiLoanIntro")}</p>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{aiAnswer}</p>
                      </div>
                    ) : null}

                    {aiErrorFor === loan.id && (
                      <p role="alert" className="mt-2 text-xs font-medium text-destructive">
                        {t("aiLoanFailed")}
                      </p>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <p className="text-xs leading-5 text-muted-foreground">{t("projectionNote")}</p>
    </div>
  );
}

function PortfolioTile({
  label,
  value,
  hint,
  urgent,
}: {
  label: string;
  value: string;
  hint?: string | undefined;
  urgent?: boolean | undefined;
}) {
  return (
    <div className={urgent ? "rounded-md border border-destructive p-4" : "rounded-md border p-4"}>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p
        className={
          urgent ? "mt-1 text-lg font-semibold text-destructive" : "mt-1 text-lg font-semibold"
        }
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Readout({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string | undefined;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold tabular-nums">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
