import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "@repo/ui/button";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

type Outcome = { ok: true } | { ok: false; error: string };

function renderDialog(action: () => Promise<Outcome>, redirectTo?: string) {
  render(
    <ConfirmDeleteDialog
      title="Delete “Keyboard”?"
      description="This cannot be undone."
      confirmLabel="Delete product"
      action={action}
      redirectTo={redirectTo}
      trigger={<Button>Delete</Button>}
    />,
  );
}

async function openDialog() {
  await userEvent.click(screen.getByRole("button", { name: "Delete" }));
  return screen.getByRole("dialog");
}

describe("ConfirmDeleteDialog", () => {
  it("does nothing until the destructive action is confirmed", async () => {
    const action = vi.fn().mockResolvedValue({ ok: true });
    renderDialog(action);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    const dialog = await openDialog();

    expect(dialog).toHaveAccessibleName("Delete “Keyboard”?");
    expect(action).not.toHaveBeenCalled();
  });

  it("closes without calling the action when cancelled", async () => {
    const action = vi.fn().mockResolvedValue({ ok: true });
    renderDialog(action);
    await openDialog();

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(action).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("runs the action and closes on success", async () => {
    const action = vi.fn().mockResolvedValue({ ok: true });
    renderDialog(action);
    await openDialog();

    await userEvent.click(screen.getByRole("button", { name: "Delete product" }));
    expect(action).toHaveBeenCalledOnce();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  /**
   * The point of the component: the server is the only thing that knows whether a delete is
   * allowed, so its refusal has to stay on screen rather than the dialog closing as if it worked.
   */
  it("stays open and shows why when the server refuses", async () => {
    const action = vi.fn().mockResolvedValue({ ok: false, error: "3 people hold this role." });
    renderDialog(action);
    await openDialog();

    await userEvent.click(screen.getByRole("button", { name: "Delete product" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("3 people hold this role.");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("drops a previous error when the dialog is reopened", async () => {
    const action = vi.fn().mockResolvedValue({ ok: false, error: "Still in use." });
    renderDialog(action);
    await openDialog();
    await userEvent.click(screen.getByRole("button", { name: "Delete product" }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await openDialog();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("navigates away afterwards when the record's own page was deleted", async () => {
    push.mockClear();
    renderDialog(vi.fn().mockResolvedValue({ ok: true }), "/products");
    await openDialog();

    await userEvent.click(screen.getByRole("button", { name: "Delete product" }));
    expect(push).toHaveBeenCalledWith("/products");
  });
});
