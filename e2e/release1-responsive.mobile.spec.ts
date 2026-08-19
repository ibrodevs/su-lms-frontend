import { expect, test } from "@playwright/test";
import { collectRuntimeFailures, demoAccounts, loginAs } from "./helpers/auth";

test("student portal fits a mobile viewport", async ({ page }) => {
  const student = demoAccounts.find((account) => account.role === "student");
  expect(student).toBeDefined();
  await loginAs(page, student!);
  const failures = collectRuntimeFailures(page);

  await expect(page.getByRole("button", { name: "Открыть меню" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Мобильная навигация" })).toBeVisible();
  await page.getByRole("link", { name: "Мои курсы" }).last().click();
  await expect(page.getByRole("heading", { name: /^Мои курсы/ })).toBeVisible();
  await expect.poll(async () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);

  await expect.poll(() => failures.mockRequests).toEqual([]);
  await expect.poll(() => failures.apiFailures).toEqual([]);
  await expect.poll(() => failures.consoleErrors).toEqual([]);
});

test("staff portal fits a mobile viewport and opens navigation", async ({ page }) => {
  const teacher = demoAccounts.find((account) => account.role === "teacher");
  expect(teacher).toBeDefined();
  await loginAs(page, teacher!);
  const failures = collectRuntimeFailures(page);

  await page.getByRole("button", { name: "Открыть меню" }).click();
  await expect(page.getByRole("navigation", { name: "Навигация кабинета сотрудника" })).toBeVisible();
  await page.getByRole("link", { name: "Мои курсы" }).click();
  await expect(page.getByRole("heading", { name: "Курсы", exact: true })).toBeVisible();
  await expect.poll(async () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  await page.getByRole("button", { name: "Открыть меню" }).click();
  await page.getByRole("link", { name: "Календарь" }).click();
  await expect(page.getByRole("heading", { name: "Календарь", exact: true })).toBeVisible();
  await expect.poll(async () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);

  await expect.poll(() => failures.mockRequests).toEqual([]);
  await expect.poll(() => failures.apiFailures).toEqual([]);
  await expect.poll(() => failures.consoleErrors).toEqual([]);
});
