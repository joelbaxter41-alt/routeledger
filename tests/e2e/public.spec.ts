import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("marketing, calculator and navigation", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: "Know exactly what every job earns you.",
    }),
  ).toBeVisible();
  await expect(page.getByText("Illustrative sample data")).toBeVisible();
  await page.getByRole("textbox", { name: "Customer charge ($)" }).fill("300");
  await page.getByRole("textbox", { name: "Total job cost ($)" }).fill("100");
  await expect(page.getByText("$200.00", { exact: true })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  const accessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(
    accessibility.violations.map(
      (v) => `${v.id}: ${v.nodes.map((n) => n.target).join(",")}`,
    ),
  ).toEqual([]);
  await page.getByRole("link", { name: "Explore features" }).click();
  await expect(
    page.getByRole("heading", { name: "Your business, working together." }),
  ).toBeVisible();
  await page.goto("/pricing");
  await expect(
    page.getByRole("heading", { name: "Simple plans for serious work." }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("unconfigured installation reports setup without fake workspace", async ({
  page,
}) => {
  test.skip(
    Boolean(process.env.E2E_EMAIL),
    "Configured environment has a different authentication flow",
  );
  await page.goto("/login");
  await expect(
    page.getByText("Authentication is awaiting Supabase configuration.", {
      exact: false,
    }),
  ).toBeVisible();
  await page.goto("/app");
  await expect(
    page.getByRole("heading", { name: "Your workspace is almost ready." }),
  ).toBeVisible();
});
test("keyboard can reach primary navigation", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByText("Skip to content")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main")).toBeInViewport();
});
