import { readFile } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";

function kolkataToday(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

function addDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function watchForPageFailures(page: Page): string[] {
  const failures: string[] = [];
  page.on("pageerror", (error) => failures.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" && !message.text().includes("favicon")) {
      failures.push(message.text());
    }
  });
  return failures;
}

test("complete invoice-to-action journey uses persistent application data", async ({ page, context }) => {
  const failures = watchForPageFailures(page);
  const today = kolkataToday();
  const dueDate = addDays(today, 30);
  const expectedDate = addDays(today, 5);

  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByText("Recorded cash", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Action Center" })).toBeVisible();

  await page.goto("/settings");
  await expect(page.getByLabel("Business name *")).toHaveValue("Creative Studio Demo");
  await page.getByLabel("Owner name *").fill("Demo Owner E2E");
  await page.getByRole("button", { name: "Save business details" }).click();
  await expect(page.getByText("Business details saved.")).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Owner name *")).toHaveValue("Demo Owner E2E");

  await page.goto("/customers/new");
  await page.getByLabel("Customer name *").fill("E2E Studio Client");
  await page.getByLabel("Company").fill("E2E Studio Client Pvt Ltd");
  await page.getByLabel("Email").fill("e2e@example.test");
  await page.getByRole("button", { name: "Create customer" }).click();
  await expect(page.getByRole("heading", { name: "E2E Studio Client" })).toBeVisible();

  await page.goto("/invoices/new");
  await page.getByLabel("Customer *").selectOption({ label: "E2E Studio Client" });
  await page.getByLabel("Issue date *").fill(today);
  await page.getByLabel("Due date *").fill(dueDate);
  await page.getByLabel("Expected collection date").fill(expectedDate);
  await page.getByLabel("Invoice number").fill("E2E-INV-001");
  await page.getByLabel("Item 1 description").fill("Brand identity package");
  await page.getByLabel("Quantity").fill("1");
  await page.getByLabel("Unit price ₹").fill("40000");
  await expect(page.getByText("Invoice total: ₹40,000")).toBeVisible();
  await page.getByRole("button", { name: "Save draft" }).click();

  await expect(page.getByRole("heading", { name: "E2E-INV-001" })).toBeVisible();
  await expect(page.getByText("Draft", { exact: true })).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Issue invoice" }).click();
  await expect(page.getByText("Unpaid", { exact: true })).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download PDF" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("E2E-INV-001.pdf");
  const pdfPath = await download.path();
  expect(pdfPath).not.toBeNull();
  const pdf = await readFile(pdfPath!);
  expect(pdf.subarray(0, 4).toString("ascii")).toBe("%PDF");

  await page.getByRole("button", { name: "Record payment" }).click();
  await page.getByLabel("Amount in ₹ *").fill("15000");
  await page.getByLabel("Payment date *").fill(today);
  await page.getByLabel("Method *").selectOption("UPI");
  await page.getByLabel("Reference").fill("E2E-UPI-001");
  await page.getByRole("button", { name: "Record payment" }).click();
  await expect(page.getByText("₹25,000", { exact: true }).first()).toBeVisible();
  await expect(page.getByLabel("Reminder text")).toHaveValue(/₹25,000 outstanding/);

  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.getByRole("button", { name: "Copy" }).click();
  await expect(page.getByText("Copied to clipboard.")).toBeVisible();
  const clipboard = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboard).toContain("E2E-INV-001");
  expect(clipboard).toContain("₹25,000");

  const revisedCollection = addDays(today, 8);
  await page.getByLabel("Expected collection date").last().fill(revisedCollection);
  await page.getByRole("button", { name: "Save expectation" }).click();
  await expect(page.getByText("Forecast expectation updated.")).toBeVisible();

  await page.goto(`/invoices?dueFrom=${dueDate}&dueTo=${dueDate}`);
  await expect(page.getByRole("link", { name: "E2E-INV-001" })).toBeVisible();

  await page.goto("/bills/new");
  await page.getByLabel("Title *").fill("E2E Supplier Bill");
  await page.getByLabel("Category *").selectOption("Suppliers");
  await page.getByLabel("Amount in ₹ *").fill("12000");
  await page.getByLabel("First due date *").fill(addDays(today, 12));
  await page.getByLabel("Repeats *").selectOption("NONE");
  await page.getByRole("button", { name: "Save bill" }).click();
  await expect(page.getByText("E2E Supplier Bill")).toBeVisible();

  await page.goto("/forecast?horizon=30");
  await expect(page.getByRole("heading", { name: "Cash Forecast" })).toBeVisible();
  const simulationInvoiceId = await page
    .locator("#simulate-invoice option")
    .filter({ hasText: "E2E-INV-001" })
    .getAttribute("value");
  expect(simulationInvoiceId).toBeTruthy();
  await page.locator("#simulate-invoice").selectOption(simulationInvoiceId!);
  await page.getByRole("button", { name: "15 days" }).click();
  await page.getByRole("button", { name: "Run simulation" }).click();
  await expect(page.getByRole("heading", { name: /Simulation result: E2E-INV-001/ })).toBeVisible();
  await expect(page.getByText("This simulation does not change any invoice or payment.")).toBeVisible();

  await page.goto("/dashboard");
  await expect(page.getByRole("link", { name: "E2E-INV-001" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Action Center" })).toBeVisible();

  await page.goto("/assistant");
  await expect(page.getByText("Groq is not configured.", { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: "Ask CashPilot" })).toBeDisabled();
  await expect(page.locator("body")).not.toContainText("This section is not built yet");
  expect(failures).toEqual([]);
});

test("mobile layout and keyboard entry points remain usable", async ({ page }) => {
  const failures = watchForPageFailures(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dashboard");

  await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Cash Forecast" })).toBeVisible();
  const hasHorizontalPageOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasHorizontalPageOverflow).toBe(false);

  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to main content" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();

  await page.goto("/invoices");
  await expect(page.getByLabel("Due from")).toBeVisible();
  await expect(page.getByLabel("Due to")).toBeVisible();
  await page.goto("/bills?status=OVERDUE");
  await expect(page.getByLabel("Status")).toHaveValue("OVERDUE");
  expect(failures).toEqual([]);
});
