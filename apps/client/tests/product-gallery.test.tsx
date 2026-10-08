import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductGallery } from "@/components/product-detail/product-gallery";

// next/image needs a Next runtime it will not get here; a plain <img> keeps the src and the alt,
// which is all these assertions are about.
vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element -- the stub stands in for next/image
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

const IMAGES = [
  { url: "https://cdn.example.com/front.jpg", alt: "The keyboard from the front" },
  { url: "https://cdn.example.com/side.jpg", alt: "The keyboard from the side" },
  { url: "https://cdn.example.com/keys.jpg", alt: "Close-up of the keycaps" },
];

const NAME = "Mechanical Keyboard K70";

function mainImage() {
  // The main image is the only one with a non-empty alt; thumbnails are labelled by their button.
  return screen.getAllByRole("img").find((image) => image.getAttribute("alt") !== "");
}

describe("ProductGallery", () => {
  it("shows the first image to begin with", () => {
    render(<ProductGallery images={IMAGES} name={NAME} />);
    expect(mainImage()).toHaveAttribute("src", "https://cdn.example.com/front.jpg");
  });

  it("switches the main image when a thumbnail is chosen", async () => {
    render(<ProductGallery images={IMAGES} name={NAME} />);

    await userEvent.click(screen.getByRole("button", { name: /photo 3 of 3/i }));

    expect(mainImage()).toHaveAttribute("src", "https://cdn.example.com/keys.jpg");
    expect(mainImage()).toHaveAccessibleName("Close-up of the keycaps");
  });

  /** Thumbnails are buttons so they are reachable by Tab and fire on Enter and Space. */
  it("is operable with the keyboard alone", async () => {
    render(<ProductGallery images={IMAGES} name={NAME} />);

    const second = screen.getByRole("button", { name: /photo 2 of 3/i });
    second.focus();
    await userEvent.keyboard("{Enter}");

    expect(mainImage()).toHaveAttribute("src", "https://cdn.example.com/side.jpg");
  });

  it("marks the chosen thumbnail as pressed and the others as not", async () => {
    render(<ProductGallery images={IMAGES} name={NAME} />);

    await userEvent.click(screen.getByRole("button", { name: /photo 2 of 3/i }));

    expect(screen.getByRole("button", { name: /photo 2 of 3/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: /photo 1 of 3/i })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("names each thumbnail by its position and its subject", () => {
    render(<ProductGallery images={IMAGES} name={NAME} />);
    expect(
      screen.getByRole("button", { name: "Show photo 2 of 3: The keyboard from the side" }),
    ).toBeInTheDocument();
  });

  /** One photo is not a gallery — a strip holding the image already on screen is just noise. */
  it("shows no thumbnail strip for a single image", () => {
    render(<ProductGallery images={[IMAGES[0]!]} name={NAME} />);
    expect(screen.queryAllByRole("button")).toHaveLength(0);
    expect(mainImage()).toHaveAttribute("src", "https://cdn.example.com/front.jpg");
  });

  it("renders a placeholder, not a broken image, when a product has no photos", () => {
    render(<ProductGallery images={[]} name={NAME} />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText(`No photo of ${NAME} is available`)).toBeInTheDocument();
  });
});
