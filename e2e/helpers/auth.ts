import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";

export interface DemoAccount {
  email: string;
  homePath: "/admin" | "/content" | "/student" | "/teacher";
  role: "admin" | "content" | "student" | "teacher";
}

export const demoAccounts: DemoAccount[] = [
  { email: "student@su.edu.kg", homePath: "/student", role: "student" },
  { email: "teacher@su.edu.kg", homePath: "/teacher", role: "teacher" },
  { email: "content@su.edu.kg", homePath: "/content", role: "content" },
  { email: "admin@su.edu.kg", homePath: "/admin", role: "admin" },
];

const demoPassword = process.env.E2E_DEMO_PASSWORD ?? "Demo123!";

export async function loginAs(page: Page, account: DemoAccount): Promise<void> {
  await page.goto("/#/login");
  await page.getByLabel("Логин или email").fill(account.email);
  await page.locator("#password").fill(demoPassword);
  await page.getByRole("button", { name: "Войти" }).click();
  await expect(page).toHaveURL(new RegExp(`#${account.homePath}$`), { timeout: 30_000 });
}

export function collectRuntimeFailures(page: Page): {
  apiFailures: string[];
  consoleErrors: string[];
  mockRequests: string[];
} {
  const apiFailures: string[] = [];
  const consoleErrors: string[] = [];
  const mockRequests: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));
  page.on("response", (response) => {
    const url = response.url();
    if (url.includes("/api/v1/") && response.status() >= 400) {
      apiFailures.push(`${response.status()} ${url}`);
    }
  });
  page.on("request", (request) => {
    const url = request.url().toLowerCase();
    if (url.includes("/mock") || url.includes("mock.json")) mockRequests.push(url);
  });

  return { apiFailures, consoleErrors, mockRequests };
}
