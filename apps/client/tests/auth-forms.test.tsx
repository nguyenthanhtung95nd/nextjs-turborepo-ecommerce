import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoginForm } from "@/components/auth/login-form";
import { RegisterForm } from "@/components/auth/register-form";

// The server actions cannot run in jsdom; these tests are about the markup the browser posts and
// the state the form renders, not about what the action does with it.
vi.mock("@/lib/auth/actions", () => ({
  authenticate: vi.fn(),
  register: vi.fn(),
}));

describe("LoginForm", () => {
  it("labels both fields so they are reachable by name", () => {
    render(<LoginForm next="/account" />);
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  /**
   * The autocomplete tokens are what let a password manager fill and, more importantly, *save*
   * the credentials. Getting `current-password` vs `new-password` wrong means saved passwords
   * silently stop being offered.
   */
  it("uses the autocomplete tokens a password manager expects", () => {
    render(<LoginForm next="/account" />);
    expect(screen.getByLabelText("Email")).toHaveAttribute("autocomplete", "email");
    expect(screen.getByLabelText("Password")).toHaveAttribute("autocomplete", "current-password");
  });

  it("carries the post-sign-in destination through the form", () => {
    const { container } = render(<LoginForm next="/products?category=audio" />);
    expect(container.querySelector('input[name="next"]')).toHaveValue("/products?category=audio");
  });

  it("marks both fields required, so the form validates without JavaScript", () => {
    render(<LoginForm next="/account" />);
    expect(screen.getByLabelText("Email")).toBeRequired();
    expect(screen.getByLabelText("Password")).toBeRequired();
  });

  it("submits with a button, not a div", () => {
    render(<LoginForm next="/account" />);
    expect(screen.getByRole("button", { name: "Sign in" })).toHaveAttribute("type", "submit");
  });

  /**
   * React 19 resets an uncontrolled form after a form action runs, so the value has to come back
   * from the server for the field to survive a failed submit. The password fields deliberately
   * have no `defaultValue` at all — echoing one would write it into the page source.
   */
  it("leaves the password with nothing to refill from", () => {
    const { container } = render(<LoginForm next="/account" />);
    expect(container.querySelector('input[type="password"]')).not.toHaveAttribute("value");
  });
});

describe("RegisterForm", () => {
  it("asks for the four fields it needs", () => {
    render(<RegisterForm />);
    expect(screen.getByLabelText(/^Name/)).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm password")).toBeInTheDocument();
  });

  it("marks the name optional, because it is", () => {
    render(<RegisterForm />);
    expect(screen.getByLabelText(/^Name/)).not.toBeRequired();
    expect(screen.getByText("(optional)")).toBeInTheDocument();
  });

  it("asks a password manager to generate rather than fill", () => {
    render(<RegisterForm />);
    expect(screen.getByLabelText("Password")).toHaveAttribute("autocomplete", "new-password");
    expect(screen.getByLabelText("Confirm password")).toHaveAttribute(
      "autocomplete",
      "new-password",
    );
  });

  /** A length rule a shopper only discovers by failing the form is a rule stated too late. */
  it("states the password rule before it can be broken", () => {
    render(<RegisterForm />);
    expect(screen.getByLabelText("Password")).toHaveAccessibleDescription(/at least 8 characters/i);
  });
});
