import { describe, expect, it } from "vitest";
import { routeAssistantMessage } from "@/lib/assistant/router";

describe("routeAssistantMessage", () => {
  it.each([
    ["Create an invoice of 5000 for ABC", "invoice"],
    ["add bill 800 for Hosting", "bills"],
    ["Will I have enough cash for bills in the next 30 days?", "forecast"],
    ["What-if INV-0017 is paid 15 days late?", "forecast"],
    ["Which invoices are overdue?", "receivables"],
    ["How much money do customers owe me?", "receivables"],
    ["Which bills are due this month?", "bills"],
    ["Draft a reminder for INV-0017", "reminder"],
    ["Draft a reminder for invoice INV-0017", "reminder"],
    ["What does cash flow mean?", "direct"],
    ["Explain invoice payment terms", "direct"],
    ["How do I use CashPilot?", "direct"],
    ["Tell me a productivity tip", "direct"],
  ])("routes '%s' to the %s agent", (message, expectedAgent) => {
    expect(routeAssistantMessage(message).agent).toBe(expectedAgent);
  });

  it("marks only invoice creation as a confirmation-gated action", () => {
    expect(routeAssistantMessage("Create invoice 5000 for ABC")).toMatchObject({
      mode: "action",
      requiresConfirmation: true,
    });
    expect(routeAssistantMessage("Which invoices are overdue?")).toMatchObject({
      mode: "read",
      requiresConfirmation: false,
    });
    expect(routeAssistantMessage("What is working capital?")).toMatchObject({
      mode: "direct",
      requiresConfirmation: false,
    });
  });

  it("uses forecast rather than bills when a cash forecast question mentions bills", () => {
    expect(routeAssistantMessage("Will cash cover my bills next month?").agent).toBe("forecast");
  });
});
