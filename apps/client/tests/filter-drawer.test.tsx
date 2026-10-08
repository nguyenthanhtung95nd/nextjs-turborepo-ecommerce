import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FilterDrawer } from "@/components/catalog/filter-drawer";

/**
 * Stands in for `FilterPanel`: a link before a form control is the whole shape that matters here,
 * because it is what Radix's open-focus gets wrong. The href is a fragment rather than a route —
 * the drawer never navigates in these tests, and a real path would make this a Next page link.
 */
function renderDrawer(activeCount = 0) {
  render(
    <FilterDrawer activeCount={activeCount}>
      <a href="#audio">Audio</a>
      <input aria-label="Minimum price" type="number" />
    </FilterDrawer>,
  );
}

describe("FilterDrawer", () => {
  it("keeps the filters out of the document until it is opened", () => {
    renderDrawer();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens on the trigger", async () => {
    renderDrawer();
    await userEvent.click(screen.getByRole("button", { name: /filters/i }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  /**
   * Radix's own open-focus skips links and lands on the first form control, which in the real
   * panel is the price input — halfway down, past the category and brand lists. Focusing the
   * panel itself is what puts a keyboard user at the top of the filters they just asked for.
   */
  it("puts focus on the panel, not on a control in the middle of it", async () => {
    renderDrawer();
    await userEvent.click(screen.getByRole("button", { name: /filters/i }));

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveFocus();
    expect(screen.getByLabelText("Minimum price")).not.toHaveFocus();
  });

  it("returns focus to the trigger when dismissed", async () => {
    renderDrawer();
    const trigger = screen.getByRole("button", { name: /filters/i });

    await userEvent.click(trigger);
    await screen.findByRole("dialog");
    await userEvent.keyboard("{Escape}");

    expect(trigger).toHaveFocus();
  });

  it("shows no badge when nothing is filtered", () => {
    renderDrawer(0);
    expect(screen.getByRole("button", { name: "Filters" })).toBeInTheDocument();
  });

  /**
   * The badge is the only sign on a phone that the grid is narrowed — the panel itself is
   * hidden. Left as part of the name it reads "Filters3", a number with no noun.
   */
  it("says what the count means rather than appending a bare number", () => {
    renderDrawer(3);
    expect(screen.getByRole("button", { name: "Filters, 3 active" })).toBeInTheDocument();
    expect(screen.getByText("3")).toHaveAttribute("aria-hidden", "true");
  });
});
