import { copyFile, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn, spawnSync } from "node:child_process";
import { chromium } from "@playwright/test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const artifactsDir = path.join(root, "artifacts");
const temporaryVideoDir = path.join(artifactsDir, ".cashpilot-project-video");
const outputPath = path.join(artifactsDir, "cashpilot-complete-project-demo.webm");
const databasePath = path.join(root, "prisma", "e2e.db");
const baseURL = "http://127.0.0.1:3000";
const node = process.execPath;
const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");
const env = {
  ...process.env,
  DATABASE_URL: "file:./e2e.db",
  GROQ_API_KEY: "demo-key-not-used",
  GROQ_MODEL: "demo-model-not-used",
  CASH_PILOT_E2E: "1",
};

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, env, stdio: "inherit", shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${path.basename(command)} exited with status ${result.status ?? 1}`);
  }
}

async function waitForServer() {
  for (let attempt = 0; attempt < 90; attempt += 1) {
    try {
      const response = await fetch(`${baseURL}/api/assistant/status`);
      if (response.ok) return;
    } catch {
      // Server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("CashPilot project demo server did not become ready");
}

function demoAnswer(message) {
  if (/working capital/i.test(message)) {
    return {
      agent: "direct",
      answer:
        "Working capital is the difference between current assets and current liabilities. It indicates whether a business can cover its near-term obligations.",
      factsUsed: [],
    };
  }
  if (/enough cash|next 30 days/i.test(message)) {
    return {
      agent: "forecast",
      answer:
        "The current 30-day forecast shows a potential cash gap. Recorded cash is ₹75,500, projected cash is ₹99,300, and scheduled bills total ₹1,92,700. Review expected collection dates before adding more spending.",
      factsUsed: [
        "Current receivables",
        "Upcoming bills",
        "Deterministic 30-day cash forecast",
      ],
    };
  }
  return {
    agent: "direct",
    answer: "CashPilot routed this request to the appropriate specialist agent.",
    factsUsed: [],
  };
}

async function installDemoCursor(page) {
  await page.addInitScript(() => {
    document.addEventListener("DOMContentLoaded", () => {
      const cursor = document.createElement("div");
      cursor.id = "cashpilot-project-cursor";
      Object.assign(cursor.style, {
        position: "fixed",
        zIndex: "2147483647",
        width: "18px",
        height: "18px",
        borderRadius: "9999px",
        border: "3px solid white",
        background: "rgba(79, 70, 229, 0.92)",
        boxShadow: "0 2px 12px rgba(15, 23, 42, 0.45)",
        pointerEvents: "none",
        transform: "translate(-50%, -50%)",
        left: "50%",
        top: "50%",
        transition: "width 120ms ease, height 120ms ease",
      });
      document.body.appendChild(cursor);
      document.addEventListener("mousemove", (event) => {
        cursor.style.left = `${event.clientX}px`;
        cursor.style.top = `${event.clientY}px`;
      });
      document.addEventListener("mousedown", () => {
        cursor.style.width = "28px";
        cursor.style.height = "28px";
      });
      document.addEventListener("mouseup", () => {
        cursor.style.width = "18px";
        cursor.style.height = "18px";
      });
    });
  });
}

async function showCaption(page, title, subtitle = "", duration = 2100) {
  await page.evaluate(({ title, subtitle }) => {
    document.getElementById("cashpilot-project-caption")?.remove();
    const caption = document.createElement("div");
    caption.id = "cashpilot-project-caption";
    caption.innerHTML = `
      <div style="font-size:28px;font-weight:760;letter-spacing:-0.02em">${title}</div>
      ${subtitle ? `<div style="margin-top:7px;font-size:16px;color:#cbd5e1">${subtitle}</div>` : ""}
    `;
    Object.assign(caption.style, {
      position: "fixed",
      zIndex: "2147483646",
      left: "50%",
      bottom: "26px",
      transform: "translateX(-50%)",
      minWidth: "560px",
      maxWidth: "940px",
      padding: "17px 25px",
      borderRadius: "18px",
      color: "white",
      textAlign: "center",
      fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
      background: "rgba(15, 23, 42, 0.94)",
      boxShadow: "0 18px 60px rgba(15, 23, 42, 0.35)",
      border: "1px solid rgba(255,255,255,0.18)",
      backdropFilter: "blur(12px)",
    });
    document.body.appendChild(caption);
  }, { title, subtitle });
  await page.waitForTimeout(duration);
  await page.evaluate(() => document.getElementById("cashpilot-project-caption")?.remove());
  await page.waitForTimeout(300);
}

async function clickDemo(page, locator) {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  if (!box) throw new Error("Project demo target is not visible");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 14 });
  await page.waitForTimeout(300);
  await locator.click();
}

async function typeDemo(locator, text, delay = 24) {
  await locator.fill("");
  await locator.pressSequentially(text, { delay });
}

async function askAssistant(page, message, agentLabel, answerText) {
  const input = page.getByLabel("Message CashPilot");
  await typeDemo(input, message, 20);
  await page.waitForTimeout(350);
  await input.press("Enter");
  if (agentLabel) {
    await page.getByText(agentLabel, { exact: true }).last().waitFor({ state: "visible" });
  }
  await page.getByText(answerText, { exact: false }).last().waitFor({ state: "visible" });
  await page.waitForTimeout(1700);
}

await mkdir(artifactsDir, { recursive: true });
await rm(temporaryVideoDir, {
  recursive: true,
  force: true,
  maxRetries: 10,
  retryDelay: 250,
});
await mkdir(temporaryVideoDir, { recursive: true });

let server;
let browser;
try {
  run(node, ["scripts/prepare-e2e.mjs", "--confirm-reset=CashPilotE2E"]);
  run(node, ["prisma/seed.mjs", "--confirm-reset=CashPilotE2E"]);
  run(node, [nextBin, "build"]);

  server = spawn(node, [nextBin, "start", "--hostname", "127.0.0.1", "--port", "3000"], {
    cwd: root,
    env,
    stdio: ["ignore", "pipe", "pipe"],
    shell: false,
  });
  server.stdout.on("data", (chunk) => process.stdout.write(chunk));
  server.stderr.on("data", (chunk) => process.stderr.write(chunk));
  await waitForServer();

  browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({
    baseURL,
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: temporaryVideoDir, size: { width: 1440, height: 900 } },
    colorScheme: "light",
  });
  await context.request.put("/api/assistant/consent", { data: { consent: true } });
  const page = await context.newPage();
  await installDemoCursor(page);
  await page.route("**/api/assistant/query", async (route) => {
    const body = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: demoAnswer(String(body?.message ?? "")) }),
    });
  });

  // Dashboard and action center.
  await page.goto("/dashboard", { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Dashboard" }).waitFor();
  await showCaption(
    page,
    "CashPilot AI — Complete Product Demo",
    "Invoices, collections, bills, forecasting, actions, and a routed AI assistant",
    3200,
  );
  await showCaption(
    page,
    "Financial dashboard",
    "Recorded cash, receivables, upcoming bills, projections, and an action center",
    2500,
  );
  await page.mouse.wheel(0, 520);
  await page.waitForTimeout(1300);
  await page.mouse.wheel(0, -520);

  // Customers and customer-level receivables.
  await clickDemo(page, page.getByRole("link", { name: "Customers" }));
  await page.getByRole("heading", { name: "Customers" }).waitFor();
  await showCaption(page, "Customer management", "Customer profiles with balances and invoice history");
  await clickDemo(page, page.getByRole("link", { name: "Aurora Brands" }).first());
  await page.getByRole("heading", { name: "Aurora Brands" }).waitFor();
  await showCaption(page, "Customer detail", "Contact information, outstanding balance, and related invoices");

  // Invoice list, creation, issuance, payment, and reminder.
  await clickDemo(page, page.getByRole("link", { name: "Invoices" }).first());
  await page.getByRole("heading", { name: "Invoices" }).waitFor();
  await showCaption(page, "Invoice workspace", "Search and filter every draft, issued, paid, or overdue invoice");
  await clickDemo(page, page.getByRole("link", { name: "New invoice" }));
  await page.getByRole("heading", { name: "New invoice" }).waitFor();
  await showCaption(page, "Create an invoice", "Structured line items, due dates, and collection expectations", 1800);

  await page.getByLabel("Customer *").selectOption({ label: "Bluebird Foods" });
  await page.getByLabel("Issue date *").fill("2026-11-22");
  await page.getByLabel("Due date *").fill("2026-12-15");
  await page.getByLabel("Expected collection date").fill("2026-12-05");
  await typeDemo(page.getByLabel("Invoice number"), "DEMO-INV-001", 45);
  await typeDemo(page.getByLabel("Item 1 description"), "Brand strategy package", 28);
  await page.getByLabel("Quantity").fill("1");
  await typeDemo(page.getByLabel("Unit price ₹"), "12500", 60);
  await page.getByText("Invoice total: ₹12,500").waitFor();
  await clickDemo(page, page.getByRole("button", { name: "Save draft" }));
  await page.getByRole("heading", { name: "DEMO-INV-001" }).waitFor();
  await showCaption(page, "Draft saved", "Review the complete invoice before issuing it", 1900);

  page.once("dialog", (dialog) => dialog.accept());
  await clickDemo(page, page.getByRole("button", { name: "Issue invoice" }));
  await page.getByRole("button", { name: "Record payment" }).waitFor();
  await showCaption(page, "Invoice issued", "Issued invoices are locked while payments remain recordable", 1800);

  await clickDemo(page, page.getByRole("button", { name: "Record payment" }));
  await typeDemo(page.getByLabel("Amount in ₹ *"), "5000", 55);
  await page.getByLabel("Payment date *").fill("2026-11-22");
  await page.getByLabel("Method *").selectOption("UPI");
  await typeDemo(page.getByLabel("Reference"), "DEMO-UPI-001", 40);
  await clickDemo(page, page.getByRole("button", { name: "Record payment" }));
  await page.getByLabel("Reminder text").waitFor();
  await showCaption(
    page,
    "Payment recorded",
    "Balances, customer totals, reminders, and forecasts update from the same saved record",
    2600,
  );
  await page.getByLabel("Reminder text").waitFor();
  await page.getByLabel("Reminder text").scrollIntoViewIfNeeded();
  await showCaption(page, "Copy-only payment reminder", "CashPilot prepares the message but never sends it automatically");

  // Bills and expenses.
  await clickDemo(page, page.getByRole("link", { name: "Expenses & Bills" }));
  await page.getByRole("heading", { name: "Expenses & Bills" }).waitFor();
  await showCaption(page, "Expenses & Bills", "Track upcoming, overdue, and paid obligations");
  // The new-page action shares its label with dynamic list content in some browsers.
  // Navigate explicitly so the demo remains deterministic across the redesigned layout.
  await page.goto("/bills/new", { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "New bill" }).waitFor();
  await typeDemo(page.getByLabel("Title *"), "Demo software subscription", 32);
  await page.getByLabel("Category *").selectOption("Software");
  await typeDemo(page.getByLabel("Amount in ₹ *"), "2500", 55);
  await page.getByLabel("First due date *").fill("2026-12-12");
  await page.getByLabel("Repeats *").selectOption("NONE");
  await clickDemo(page, page.getByRole("button", { name: "Save bill" }));
  await page.getByText("Demo software subscription").waitFor();
  await showCaption(page, "Bill saved", "The new outflow is now included in cash planning", 2200);

  // Forecast horizons and read-only what-if simulation.
  await clickDemo(page, page.getByRole("link", { name: "Cash Forecast" }));
  await page.getByRole("heading", { name: "Cash Forecast" }).waitFor();
  await showCaption(page, "Cash Forecast", "Explore 30, 60, and 90-day projections from recorded data");
  await clickDemo(page, page.getByRole("link", { name: "60 days" }));
  await page.waitForTimeout(1400);
  const simulationInvoiceId = await page
    .locator("#simulate-invoice option")
    .filter({ hasText: "DEMO-INV-001" })
    .getAttribute("value");
  if (!simulationInvoiceId) throw new Error("Demo invoice was not available for simulation");
  await page.locator("#simulate-invoice").selectOption(simulationInvoiceId);
  await clickDemo(page, page.getByRole("button", { name: "15 days" }));
  await clickDemo(page, page.getByRole("button", { name: "Run simulation" }));
  await page.getByRole("heading", { name: /Simulation result: DEMO-INV-001/ }).waitFor();
  await showCaption(
    page,
    "Read-only delay simulation",
    "See the cash impact of a late payment without changing the invoice",
    2600,
  );

  // Routed AI assistant and confirmation-gated assistant actions.
  await clickDemo(page, page.getByRole("link", { name: "AI Assistant" }));
  await page.getByRole("heading", { name: "CashPilot Assistant" }).waitFor();
  await showCaption(page, "Routed AI assistant", "Direct AI for general help; specialist agents for business-record functions");
  await askAssistant(page, "What is working capital?", "Direct AI", "Working capital is");
  await showCaption(page, "Direct AI", "General answers receive no business-record snapshot", 1700);
  await clickDemo(page, page.getByRole("button", { name: "New chat" }));
  await askAssistant(
    page,
    "Will I have enough cash for bills in the next 30 days?",
    "Forecast agent",
    "potential cash gap",
  );
  await showCaption(page, "Forecast agent", "A cash question is routed to the scoped forecast function", 1900);
  await clickDemo(page, page.getByRole("button", { name: "New chat" }));
  await askAssistant(
    page,
    "Create an invoice of 5000 for Aurora Brands due 2026-12-20",
    null,
    "Invoice for Aurora Brands",
  );
  await showCaption(page, "Confirmation-gated action", "The Invoice agent previews the write and waits for approval", 2300);
  await clickDemo(page, page.getByRole("button", { name: "Cancel" }));
  await page.getByText("Cancelled. Nothing was saved.", { exact: true }).waitFor();

  // Settings and closing dashboard.
  await clickDemo(page, page.getByRole("link", { name: "Settings" }));
  await page.getByRole("heading", { name: "Settings" }).waitFor();
  await showCaption(page, "Business settings", "Manage business identity, opening cash, contact details, and payment instructions");
  await clickDemo(page, page.getByRole("link", { name: "Dashboard" }));
  await page.getByRole("heading", { name: "Dashboard" }).waitFor();
  await showCaption(
    page,
    "CashPilot AI",
    "A complete local-first workflow from records to decisions and confirmed actions",
    3600,
  );

  const video = page.video();
  await context.close();
  if (!video) throw new Error("Playwright did not create the complete-project video");
  await copyFile(await video.path(), outputPath);
  console.log(`Complete project demo video created: ${outputPath}`);
} finally {
  if (browser) await browser.close().catch(() => undefined);
  if (server && !server.killed) server.kill();
  await new Promise((resolve) => setTimeout(resolve, 1200));
  await rm(temporaryVideoDir, {
    recursive: true,
    force: true,
    maxRetries: 10,
    retryDelay: 250,
  });
  for (const suffix of ["", "-journal", "-wal", "-shm"]) {
    await rm(`${databasePath}${suffix}`, { force: true });
  }
}
