import { test, expect } from "@playwright/test";
/** Requires an isolated Supabase test workspace with verified Solo Pro entitlement. */
test("customer → completed job → expense → invoice → partial payment → CSV", async ({
  page,
}) => {
  test.skip(
    !process.env.E2E_EMAIL || !process.env.E2E_PASSWORD,
    "Requires configured Supabase test user and verified Pro workspace",
  );
  const suffix = Date.now();
  await page.goto("/login");
  await page.getByLabel("Email address").fill(process.env.E2E_EMAIL!);
  await page
    .getByLabel("Password · at least 10 characters")
    .fill(process.env.E2E_PASSWORD!);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/app/);
  await page.goto("/app/customers/new");
  await page.getByLabel("Full name or company").fill(`E2E Customer ${suffix}`);
  await page
    .getByRole("button", { name: "Create customer", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: `E2E Customer ${suffix}`, exact: true }),
  ).toBeVisible();
  await page.goto("/app/jobs/new");
  await page
    .getByLabel("Customer", { exact: true })
    .selectOption({ label: `E2E Customer ${suffix}` });
  await page.getByLabel("Job description").fill(`E2E Lawn ${suffix}`);
  await page.getByLabel("Scheduled date").fill("2031-06-15");
  await page.getByLabel("Agreed customer charge").fill("200");
  await page.getByLabel("Labor allowance per hour · snapshot").fill("20");
  await page.getByRole("button", { name: "Schedule job", exact: true }).click();
  await page.getByRole("button", { name: "Start job", exact: true }).click();
  await page.getByLabel("Actual time worked (minutes)").fill("60");
  await page
    .getByRole("button", { name: "Complete job & calculate profit" })
    .click();
  await expect(
    page.getByText("$180.00", { exact: true }).first(),
  ).toBeVisible();
  const jobUrl = page.url().split("?")[0];
  await page.goto("/app/expenses");
  await page.getByLabel("Vendor", { exact: true }).fill("E2E Fuel");
  await page.getByLabel("Amount", { exact: true }).fill("10");
  await page
    .getByLabel("Related job · optional")
    .selectOption({ label: `E2E Lawn ${suffix} · 2031-06-15` });
  await page.getByRole("button", { name: "Save expense", exact: true }).click();
  await page.goto(jobUrl);
  await expect(
    page.getByText("$170.00", { exact: true }).first(),
  ).toBeVisible();
  await page.getByRole("link", { name: "Create invoice", exact: true }).click();
  await page
    .getByRole("button", { name: "Create invoice", exact: true })
    .click();
  await page.getByLabel("Amount received").fill("50");
  await page
    .getByRole("button", { name: "Record payment", exact: true })
    .click();
  await expect(page.getByText("$150.00", { exact: true })).toBeVisible();
  await page.goto("/app/reports");
  const download = page.waitForEvent("download");
  await page.getByRole("link", { name: "Export job profit CSV · Pro" }).click();
  expect((await download).suggestedFilename()).toBe("routeledger-profit.csv");
});
