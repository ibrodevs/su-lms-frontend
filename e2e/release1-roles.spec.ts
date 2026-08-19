import { expect, test } from "@playwright/test";
import { collectRuntimeFailures, demoAccounts, loginAs } from "./helpers/auth";

test.beforeAll(async ({ request }) => {
  const health = await request.get("http://127.0.0.1:8001/api/v1/health/");
  expect(health.ok(), "Release 1 backend must be running on port 8001").toBe(true);
});

for (const account of demoAccounts) {
  test(`${account.role} keeps a real backend session after refresh`, async ({ page }) => {
    await loginAs(page, account);
    const failures = collectRuntimeFailures(page);

    if (account.role === "student") {
      await expect(page.getByRole("navigation", { name: "Навигация кабинета студента" })).toBeVisible();
      await expect(page.getByRole("link", { name: "Мои курсы" }).first()).toBeVisible();
      await expect(page.getByRole("link", { name: /Задания|Тесты|Уведомления|Расписание/ })).toHaveCount(0);
    } else {
      await expect(page.getByRole("navigation", { name: "Навигация кабинета сотрудника" })).toBeVisible();
      await expect(page.getByRole("heading", { name: /добрый день/i })).toBeVisible();
    }

    await page.reload();
    await expect(page).toHaveURL(new RegExp(`#${account.homePath}$`));

    if (account.role === "student") {
      await page.getByRole("link", { name: "Мои курсы" }).first().click();
      await expect(page).toHaveURL(/#\/student\/courses$/);
      await expect(page.getByRole("heading", { name: /^Мои курсы/ })).toBeVisible();
    } else {
      await page.getByRole("link", { name: /Мои курсы|Все курсы/ }).first().click();
      await expect(page).toHaveURL(/#\/courses$/);
      await expect(page.getByRole("heading", { name: "Курсы", exact: true })).toBeVisible();
      await expect(page.getByText("Данные backend с серверной фильтрацией и пагинацией.")).toBeVisible();
    }

    await expect.poll(() => failures.mockRequests).toEqual([]);
    await expect.poll(() => failures.apiFailures).toEqual([]);
    await expect.poll(() => failures.consoleErrors).toEqual([]);
  });
}

test("student opens a backend course and calendar after refresh", async ({ page }) => {
  const student = demoAccounts.find((account) => account.role === "student");
  expect(student).toBeDefined();
  await loginAs(page, student!);
  const failures = collectRuntimeFailures(page);

  await page.getByRole("link", { name: "Мои курсы" }).first().click();
  await page.getByRole("link", { name: "Открыть курс" }).first().click();
  await expect(page.getByRole("navigation", { name: "Разделы курса" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("navigation", { name: "Разделы курса" })).toBeVisible();

  await page.getByRole("link", { name: "Календарь" }).first().click();
  await expect(page).toHaveURL(/#\/student\/calendar$/);
  await expect(page.getByRole("heading", { name: "Календарь", exact: true })).toBeVisible();

  await expect.poll(() => failures.mockRequests).toEqual([]);
  await expect.poll(() => failures.apiFailures).toEqual([]);
  await expect.poll(() => failures.consoleErrors).toEqual([]);
});

test("admin creates, refreshes, updates, and deletes a calendar event", async ({ page }) => {
  const admin = demoAccounts.find((account) => account.role === "admin");
  expect(admin).toBeDefined();
  await loginAs(page, admin!);
  const failures = collectRuntimeFailures(page);
  const eventTitle = `E2E событие ${Date.now()}`;
  const updatedTitle = `${eventTitle} обновлено`;
  const startsAt = new Date(Date.now() + 24 * 60 * 60 * 1_000);
  const localStartsAt = new Date(startsAt.getTime() - startsAt.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
  let createdTitle: string | null = null;

  await page.getByRole("link", { name: "Календарь" }).click();
  await expect(page.getByRole("heading", { name: "Календарь", exact: true })).toBeVisible();

  try {
    await page.getByRole("button", { name: "Добавить событие" }).click();
    const createDialog = page.getByRole("dialog", { name: "Новое событие" });
    await createDialog.getByLabel("Курс").selectOption({ index: 1 });
    await createDialog.getByLabel("Название").fill(eventTitle);
    await createDialog.getByLabel("Начало").fill(localStartsAt);
    await createDialog.getByRole("button", { name: "Сохранить" }).click();
    await expect(page.getByRole("heading", { name: eventTitle, exact: true })).toBeVisible();
    createdTitle = eventTitle;

    await page.reload();
    await expect(page.getByRole("heading", { name: eventTitle, exact: true })).toBeVisible();
    await page.getByRole("button", { name: `Редактировать ${eventTitle}` }).click();
    const editDialog = page.getByRole("dialog", { name: "Редактировать событие" });
    await editDialog.getByLabel("Название").fill(updatedTitle);
    await editDialog.getByRole("button", { name: "Сохранить" }).click();
    await expect(page.getByRole("heading", { name: updatedTitle, exact: true })).toBeVisible();
    createdTitle = updatedTitle;

    await page.getByRole("button", { name: `Удалить ${updatedTitle}` }).click();
    const deleteDialog = page.getByRole("dialog", { name: "Удалить событие?" });
    await deleteDialog.getByRole("button", { name: "Удалить", exact: true }).click();
    await expect(page.getByRole("heading", { name: updatedTitle, exact: true })).toHaveCount(0);
    createdTitle = null;
  } finally {
    if (createdTitle) {
      await page.goto("/#/calendar");
      const cleanupButton = page.getByRole("button", { name: `Удалить ${createdTitle}` });
      if (await cleanupButton.count()) {
        await cleanupButton.click();
        await page.getByRole("dialog", { name: "Удалить событие?" }).getByRole("button", { name: "Удалить", exact: true }).click();
      }
    }
  }

  await expect.poll(() => failures.mockRequests).toEqual([]);
  await expect.poll(() => failures.apiFailures).toEqual([]);
  await expect.poll(() => failures.consoleErrors).toEqual([]);
});
