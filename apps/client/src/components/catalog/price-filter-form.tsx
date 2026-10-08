import { type CatalogListParams, MAX_PRICE } from "@repo/contracts";
import type { ListingRoute } from "@/lib/catalog/url";

/** Which params the price form must carry forward, and how they are named in the URL. */
const CARRIED: readonly (keyof CatalogListParams)[] = ["q", "category", "brand", "inStock", "sort"];

const DEFAULTS: Partial<Record<keyof CatalogListParams, string>> = {
  q: "",
  category: "",
  brand: "",
  inStock: "0",
  sort: "newest",
};

/**
 * The price range, as a plain GET form.
 *
 * Submitting navigates natively, so the range works with no JavaScript and produces a real,
 * shareable URL — the same contract as the filter links beside it.
 *
 * A GET form replaces the whole query string, so the filters that are not part of this form are
 * resubmitted as hidden fields. Only non-default values are carried: an empty hidden input would
 * otherwise put `?category=&brand=` into every URL the form produces. Anything the route already
 * implies is skipped too, because the form posts back to that same path.
 *
 * `page` is deliberately not carried — a new price range invalidates the page number.
 */
export function PriceFilterForm({
  route,
  params,
}: {
  route: ListingRoute;
  params: CatalogListParams;
}) {
  const carried = CARRIED.filter(
    (key) => String(params[key]) !== DEFAULTS[key] && route.implied[key] === undefined,
  );

  return (
    <form action={route.path} className="flex flex-col gap-2">
      {carried.map((key) => (
        <input key={key} type="hidden" name={key} value={String(params[key])} />
      ))}

      <div className="flex items-center gap-2">
        <PriceInput id="price-min" name="priceMin" label="Minimum price" value={params.priceMin} />
        <span aria-hidden="true" className="text-muted-foreground">
          –
        </span>
        <PriceInput id="price-max" name="priceMax" label="Maximum price" value={params.priceMax} />
      </div>

      <button
        type="submit"
        className="h-9 rounded-lg border border-border px-3 text-sm font-semibold hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Apply price
      </button>
    </form>
  );
}

interface PriceInputProps {
  id: string;
  name: string;
  label: string;
  value: number;
}

function PriceInput({ id, name, label, value }: PriceInputProps) {
  return (
    <div className="relative flex-1">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
      >
        $
      </span>
      <input
        id={id}
        name={name}
        type="number"
        inputMode="decimal"
        min={0}
        max={MAX_PRICE}
        // An unset bound is 0, which is shown as an empty field rather than a literal "0" — the
        // placeholder is what tells the shopper the bound is open.
        defaultValue={value > 0 ? value : ""}
        placeholder={name === "priceMin" ? "Min" : "Max"}
        className="h-9 w-full rounded-lg border border-border bg-card pl-5 pr-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </div>
  );
}
