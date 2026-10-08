import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// Each test renders into a fresh document; without this, queries would see the previous test's
// markup and `getByRole` would start reporting duplicates.
afterEach(cleanup);
