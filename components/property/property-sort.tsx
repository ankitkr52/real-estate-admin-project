"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SORT_OPTIONS } from "@/lib/constants";
import { usePropertyFilters } from "@/hooks/use-property-filters";

export function PropertySort() {
  const { filters, setFilter } = usePropertyFilters();
  const current = filters.sort ?? "newest";

  return (
    <Select value={current} onValueChange={(v) => setFilter("sort", v)}>
      <SelectTrigger className="w-[180px]" aria-label="Sort results">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {SORT_OPTIONS.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
