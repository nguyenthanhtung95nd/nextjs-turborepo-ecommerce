import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UrlSearchField } from "@/components/url-search-field";

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));

// Matches SEARCH_DEBOUNCE_MS in the component. Real timers rather than fake ones: user-event
// drives its own timers internally, and the two fight each other far more than 300ms is worth.
const DEBOUNCE_MS = 300;
const AFTER_DEBOUNCE_MS = DEBOUNCE_MS + 150;

const settle = () => new Promise((resolve) => setTimeout(resolve, AFTER_DEBOUNCE_MS));

function renderField(urlValue = "") {
  const hrefFor = (query: string) => (query ? `/things?q=${query}` : "/things");
  const view = render(
    <UrlSearchField id="search" label="Search by name" urlValue={urlValue} hrefFor={hrefFor} />,
  );
  return { ...view, input: screen.getByLabelText("Search by name") };
}

describe("UrlSearchField", () => {
  beforeEach(() => replace.mockClear());

  it("does not navigate on every keystroke", async () => {
    const { input } = renderField();
    await userEvent.type(input, "key");
    expect(replace).not.toHaveBeenCalled();
  });

  it("navigates once, with the trimmed term, after the user stops typing", async () => {
    const { input } = renderField();
    await userEvent.type(input, "  key  ");

    await waitFor(() => expect(replace).toHaveBeenCalledTimes(1));
    expect(replace).toHaveBeenCalledWith("/things?q=key", { scroll: false });
  });

  /**
   * The bug this guards: a timer firing *after* the user clicked a row link replaced the URL
   * mid-navigation and bounced them back to the list. Flushing on blur puts this navigation
   * before the click's, so the click wins.
   */
  it("applies the search immediately when the field loses focus", async () => {
    const { input } = renderField();
    await userEvent.type(input, "key");
    expect(replace).not.toHaveBeenCalled();

    await userEvent.tab();
    expect(replace).toHaveBeenCalledWith("/things?q=key", { scroll: false });

    // The pending timer was cancelled, not merely beaten to it.
    await settle();
    expect(replace).toHaveBeenCalledTimes(1);
  });

  it("does nothing on blur when there is no pending change", async () => {
    const { input } = renderField("key");
    input.focus();
    await userEvent.tab();
    await settle();
    expect(replace).not.toHaveBeenCalled();
  });

  it("adopts a term that changed in the URL somewhere else", () => {
    const { rerender, input } = renderField("key");
    expect(input).toHaveValue("key");

    // What a filter chip or "clear all" does.
    rerender(
      <UrlSearchField id="search" label="Search by name" urlValue="" hrefFor={() => "/things"} />,
    );
    expect(screen.getByLabelText("Search by name")).toHaveValue("");
  });

  it("is a search input, so browsers offer the clear affordance", () => {
    const { input } = renderField();
    expect(input).toHaveAttribute("type", "search");
  });
});
