import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { FormField } from "@/components/auth/form-field";

describe("FormField", () => {
  it("labels the input, so it is reachable by its name", () => {
    render(<FormField id="email" name="email" label="Email" required />);
    expect(screen.getByLabelText("Email")).toHaveAttribute("name", "email");
  });

  /** A placeholder disappears the moment someone types — exactly when they need it most. */
  it("uses a real label rather than a placeholder", () => {
    render(<FormField id="email" name="email" label="Email" required />);
    expect(screen.getByLabelText("Email")).not.toHaveAttribute("placeholder");
  });

  it("marks an optional field optional, in the label itself", () => {
    render(<FormField id="name" name="name" label="Name" />);
    expect(screen.getByLabelText(/Name.*optional/)).toBeInTheDocument();
  });

  /**
   * The value comes back from the server after a failed submit, because React 19 resets an
   * uncontrolled form once its action has run.
   */
  it("refills from a default value", () => {
    render(<FormField id="email" name="email" label="Email" defaultValue="sam@example.com" />);
    expect(screen.getByLabelText(/Email/)).toHaveValue("sam@example.com");
  });

  it("announces an error through the input, not just beside it", () => {
    render(<FormField id="email" name="email" label="Email" error="That address is taken." />);
    const input = screen.getByLabelText(/Email/);
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("That address is taken.");
  });

  it("describes the field with its hint when there is no error", () => {
    render(<FormField id="pw" name="pw" label="Password" hint="At least 8 characters." />);
    expect(screen.getByLabelText(/Password/)).toHaveAccessibleDescription("At least 8 characters.");
  });

  /** Both matter at once: the rule still applies while the error is on screen. */
  it("describes the field with the hint and the error together", () => {
    render(
      <FormField
        id="pw"
        name="pw"
        label="Password"
        hint="At least 8 characters."
        error="Too short."
      />,
    );
    expect(screen.getByLabelText(/Password/)).toHaveAccessibleDescription(
      "At least 8 characters. Too short.",
    );
  });

  it("claims nothing is wrong when nothing is", () => {
    render(<FormField id="email" name="email" label="Email" />);
    expect(screen.getByLabelText(/Email/)).not.toHaveAttribute("aria-invalid");
  });
});
