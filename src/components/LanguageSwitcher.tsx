import { Check, ChevronDown, Languages } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { languageOptions, useLanguage } from "@/lib/i18n";

/**
 * Header language picker. Language is the primary accessibility control for a
 * rural, multilingual audience, so it sits in the header rather than only in
 * Settings (BUG-02 / BUG-07).
 */
export function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();
  const [open, setOpen] = useState(false);
  const current = languageOptions.find((option) => option.value === locale) ?? languageOptions[0]!;

  function choose(next: (typeof languageOptions)[number]["value"]) {
    setLocale(next);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="min-w-0 gap-1.5 px-2 text-white hover:bg-white/10 hover:text-white sm:px-3"
          aria-label={`App language: ${current.label}. Change language`}
        >
          <Languages aria-hidden="true" className="size-4 shrink-0 text-saffron" />
          <span className="truncate text-xs font-semibold sm:text-sm">{current.label}</span>
          <ChevronDown aria-hidden="true" className="size-3.5 shrink-0 text-white/70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="center" className="w-56 p-2">
        <p className="px-2 pb-2 pt-1 text-xs font-medium text-muted-foreground">App language</p>
        <div className="space-y-1">
          {languageOptions.map((language) => (
            <Button
              key={language.value}
              type="button"
              variant="ghost"
              className="h-auto w-full justify-between px-2 py-2.5 text-left"
              onClick={() => choose(language.value)}
            >
              <span className="text-sm font-medium">{language.label}</span>
              {locale === language.value && (
                <Check aria-hidden="true" className="size-4 text-primary" />
              )}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
