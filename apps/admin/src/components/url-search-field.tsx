"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";

// Long enough that a typed word is one request, short enough to feel immediate.
const SEARCH_DEBOUNCE_MS = 300;

interface Props {
  id: string;
  label: string;
  placeholder?: string;
  /** The search term currently in the URL — the single source of truth. */
  urlValue: string;
  /** Where a given search term should navigate to. Callers reset the page number here. */
  hrefFor: (query: string) => string;
}

/**
 * A search box that keeps its term in the URL.
 *
 * The URL is the source of truth so results stay shareable and the back button means
 * something; this input only navigates.
 */
export function UrlSearchField({ id, label, placeholder, urlValue, hrefFor }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState(urlValue);
  const [syncedQuery, setSyncedQuery] = useState(urlValue);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // React's "adjust state when a prop changes" pattern, deliberately during render rather than
  // in an effect: when the URL's term changes from somewhere other than this input (a filter
  // chip, "clear all", the back button), adopt it. Typing never reaches here, because by the
  // time the URL catches up `urlValue` already equals what was typed.
  if (urlValue !== syncedQuery) {
    setSyncedQuery(urlValue);
    setQuery(urlValue);
  }

  useEffect(() => () => clearTimeout(debounceRef.current ?? undefined), []);

  function navigate(value: string) {
    // `replace`, unlike the select controls beside it which `push`. Typing is debounced, so a
    // push would leave one history entry per pause — pressing back ten times to undo one search.
    router.replace(hrefFor(value.trim()), { scroll: false });
  }

  function onChange(value: string) {
    setQuery(value);
    clearTimeout(debounceRef.current ?? undefined);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      navigate(value);
    }, SEARCH_DEBOUNCE_MS);
  }

  // Leaving the field applies the search immediately. Not just a convenience: a timer that
  // fired *after* the user clicked a row link would replace the URL mid-navigation and bounce
  // them back to the list. Flushing on blur puts this navigation before that click's.
  function flush() {
    if (debounceRef.current === null) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = null;
    navigate(query);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          id={id}
          type="search"
          className="pl-9"
          placeholder={placeholder}
          value={query}
          onChange={(event) => onChange(event.target.value)}
          onBlur={flush}
        />
      </div>
    </div>
  );
}
