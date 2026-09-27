import { Check, ChevronDown, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const CLUSTERS = [
  { name: "Lohegaon", detail: "Pune · 411047" },
  { name: "Wagholi", detail: "Pune · 412207" },
  { name: "Dhanori", detail: "Pune · 411015" },
  { name: "Hadapsar", detail: "Pune · 411028" },
  { name: "Baramati", detail: "Pune · 413102" },
] as const;

export function LocationSwitcher() {
  const [selected, setSelected] = useState<(typeof CLUSTERS)[number]>(CLUSTERS[0]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("sahiti-cluster");
    const match = CLUSTERS.find((cluster) => cluster.name === saved);
    if (match) setSelected(match);
  }, []);

  function choose(cluster: (typeof CLUSTERS)[number]) {
    setSelected(cluster);
    window.localStorage.setItem("sahiti-cluster", cluster.name);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="min-w-0 max-w-[190px] gap-1.5 px-2 text-white hover:bg-white/10 hover:text-white sm:max-w-none sm:px-3"
          aria-label={`Current business cluster: ${selected.name}, ${selected.detail}. Change cluster`}
        >
          <MapPin aria-hidden="true" className="size-4 shrink-0 text-saffron" />
          <span className="truncate text-xs font-semibold sm:text-sm">
            {selected.name}, {selected.detail}
          </span>
          <ChevronDown aria-hidden="true" className="size-3.5 shrink-0 text-white/70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="center" className="w-72 p-2">
        <p className="px-2 pb-2 pt-1 text-xs font-medium text-muted-foreground">
          Micro-business cluster
        </p>
        <div className="space-y-1">
          {CLUSTERS.map((cluster) => (
            <Button
              key={cluster.name}
              type="button"
              variant="ghost"
              className="h-auto w-full justify-between px-2 py-2.5 text-left"
              onClick={() => choose(cluster)}
            >
              <span>
                <span className="block text-sm font-medium">{cluster.name}</span>
                <span className="block text-xs font-normal text-muted-foreground">
                  {cluster.detail}
                </span>
              </span>
              {selected.name === cluster.name && (
                <Check aria-hidden="true" className="size-4 text-primary" />
              )}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
