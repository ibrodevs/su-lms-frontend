import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";
import type { APIRequestContext, Page } from "@playwright/test";
import type { FinalStabilizationFixture } from "./helpers/backend";
import {
  cleanupFinalStabilizationFixture,
  createFinalStabilizationFixture,
  restartBackend,
} from "./helpers/backend";
import { collectRuntimeFailures, demoAccounts, loginAs } from "./helpers/auth";

const uniquePart = Date.now().toString().slice(-8);
const prefix = `E2E-FINAL-${uniquePart}`;
let fixture: FinalStabilizationFixture;
const captureScreenshots = process.env.E2E_CAPTURE_SCREENSHOTS === "1";
const screenshotDirectory = resolve(process.cwd(), "docs", "screenshots", "release1-final-stabilization");

async function capture(page: Page, filename: string): Promise<void> {
  if (!captureScreenshots) return;
  await mkdir(screenshotDirectory, { recursive: true });
  await page.screenshot({ fullPage: true, path: resolve(screenshotDirectory, filename) });
}

async function waitForBackend(request: APIRequestContext): Promise<void> {
  await expect
    .poll(
      async () => {
        try {
          const response = await request.get("http://127.0.0.1:8001/api/v1/health/", { timeout: 2_000 });
          return response.ok();
        } catch {
          return false;
        }
      },
      { intervals: [1_000, 2_000, 3_000], timeout: 60_000 },
    )
    .toBe(true);
}

test.describe.serial("Release 1 final stabilization", () => {
  test.beforeAll(async ({ request }) => {
    const health = await request.get("http://127.0.0.1:8001/api/v1/health/");
    expect(health.ok(), "Release 1 backend must be running on port 8001").toBe(true);
    fixture = await createFinalStabilizationFixture(prefix);
  });

  test.afterAll(async () => {
    await cleanupFinalStabilizationFixture(prefix);
  });

  test("student unlocks a dependent lesson after completing its prerequisite", async ({ page }) => {
    const student = demoAccounts.find((account) => account.role === "student");
    expect(student).toBeDefined();
    await loginAs(page, student!);
    const failures = collectRuntimeFailures(page);

    await page.goto(`/#/student/courses/${fixture.lockedCourseId}`);
    await page.getByRole("button", { name: "Содержание" }).click();
    await expect(page.getByText(`${prefix} dependent`, { exact: true })).toBeVisible();
    await expect(page.getByText("Сначала завершите обязательный урок.", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: new RegExp(`${prefix} dependent`) })).toHaveCount(0);
    await capture(page, "01-student-lesson-locked.png");

    await page.getByRole("link", { name: new RegExp(`${prefix} prerequisite`) }).click();
    await page.getByRole("button", { name: "Начать урок" }).click();
    await page.getByRole("button", { name: "Завершить урок" }).click();
    await page.getByRole("dialog", { name: "Завершить урок?" }).getByRole("button", { name: "Завершить", exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: "Урок завершён" })).toBeVisible();

    await page.goto(`/#/student/courses/${fixture.lockedCourseId}`);
    await page.getByRole("button", { name: "Содержание" }).click();
    await page.getByRole("link", { name: new RegExp(`${prefix} dependent`) }).click();
    await expect(page.getByRole("heading", { name: `${prefix} dependent` })).toBeVisible();
    await expect(page.getByText("Unlocked content.", { exact: true })).toBeVisible();
    await capture(page, "02-student-lesson-unlocked.png");
    await expect.poll(() => failures.mockRequests).toEqual([]);
    await expect.poll(() => failures.apiFailures).toEqual([]);
    await expect.poll(() => failures.consoleErrors).toEqual([]);
  });

  test("teacher uploads a valid SCORM package and opens its launch page", async ({ page }) => {
    const teacher = demoAccounts.find((account) => account.role === "teacher");
    expect(teacher).toBeDefined();
    await loginAs(page, teacher!);
    const failures = collectRuntimeFailures(page);
    const packageTitle = `${prefix} interactive package`;

    await page.goto(`/#/courses/${fixture.staffCourseId}/lessons/${fixture.staffLessonId}/edit`);
    const scormSection = page.getByRole("heading", { name: "SCORM-пакеты" }).locator("..", { has: page.getByText("SCORM 1.2 / 2004") }).locator("..");
    await scormSection.getByPlaceholder("Например, Интерактивный модуль").fill(packageTitle);
    await scormSection.locator('input[type="file"]').setInputFiles(resolve(process.cwd(), "e2e", "fixtures", "minimal-scorm.zip"));
    await scormSection.getByRole("button", { name: "Загрузить" }).click();
    await expect(page.getByRole("status").filter({ hasText: "SCORM-пакет загружен" })).toBeVisible();
    await expect(page.getByRole("heading", { name: packageTitle })).toBeVisible();
    await capture(page, "03-teacher-scorm-package.png");

    const popupPromise = page.waitForEvent("popup");
    await page.getByRole("link", { name: "Запустить" }).click();
    const launchPage = await popupPromise;
    await expect(launchPage.getByRole("heading", { name: "SCORM fixture ready" })).toBeVisible();
    await launchPage.close();
    await expect.poll(() => failures.mockRequests).toEqual([]);
    await expect.poll(() => failures.apiFailures).toEqual([]);
    await expect.poll(() => failures.consoleErrors).toEqual([]);
  });

  test("content manager copies a course and creates a draft from its template", async ({ page }) => {
    const contentManager = demoAccounts.find((account) => account.role === "content");
    expect(contentManager).toBeDefined();
    await loginAs(page, contentManager!);
    const failures = collectRuntimeFailures(page);
    const copyTitle = `${prefix} copied course`;
    const copyCode = `${prefix}-COPY`;
    const templateTitle = `${prefix} reusable template`;
    const templateCourseTitle = `${prefix} template course`;
    const templateCourseCode = `${prefix}-TPL`;

    await page.goto(`/#/courses/${fixture.staffCourseId}`);
    await page.getByRole("button", { name: "Копировать" }).click();
    let dialog = page.getByRole("dialog", { name: "Копировать курс" });
    await dialog.getByLabel("Название курса").fill(copyTitle);
    await dialog.getByLabel("Код курса").fill(copyCode);
    await dialog.getByRole("button", { name: "Скопировать" }).click();
    await expect(page.getByRole("heading", { name: copyTitle })).toBeVisible();
    await expect(page.getByText(copyCode, { exact: true }).first()).toBeVisible();
    await capture(page, "04-content-manager-course-copy.png");

    await page.goto("/#/templates");
    await page.getByRole("button", { name: "Создать шаблон" }).click();
    dialog = page.getByRole("dialog", { name: "Создать шаблон" });
    await dialog.getByLabel("Исходный курс").selectOption(String(fixture.staffCourseId));
    await dialog.getByLabel("Название").fill(templateTitle);
    await dialog.getByLabel("Описание").fill("Reusable Release 1 structure.");
    await dialog.getByRole("button", { name: "Создать шаблон" }).click();
    const templateCard = page.getByRole("article").filter({ has: page.getByRole("heading", { name: templateTitle }) });
    await expect(templateCard).toBeVisible();
    await capture(page, "05-content-manager-template.png");
    await templateCard.getByRole("button", { name: "Использовать шаблон" }).click();
    dialog = page.getByRole("dialog", { name: new RegExp(`Новый курс из`) });
    await dialog.getByLabel("Название курса").fill(templateCourseTitle);
    await dialog.getByLabel("Код курса").fill(templateCourseCode);
    await dialog.getByRole("button", { name: "Создать курс" }).click();
    await expect(page.getByRole("heading", { name: templateCourseTitle })).toBeVisible();
    await expect(page.getByText(templateCourseCode, { exact: true }).first()).toBeVisible();
    await capture(page, "06-content-manager-template-course.png");
    await expect.poll(() => failures.mockRequests).toEqual([]);
    await expect.poll(() => failures.apiFailures).toEqual([]);
    await expect.poll(() => failures.consoleErrors).toEqual([]);
  });

  test("course structure and student progress survive a backend restart", async ({ page, request }) => {
    test.setTimeout(90_000);
    const student = demoAccounts.find((account) => account.role === "student");
    expect(student).toBeDefined();
    await loginAs(page, student!);

    await page.goto(`/#/student/courses/${fixture.lockedCourseId}`);
    await page.getByRole("button", { name: "Содержание" }).click();
    await expect(page.getByRole("link", { name: new RegExp(`${prefix} dependent`) })).toBeVisible();

    await restartBackend();
    await waitForBackend(request);

    const failures = collectRuntimeFailures(page);
    await page.reload();
    await page.getByRole("button", { name: "Содержание" }).click();
    await page.getByRole("link", { name: new RegExp(`${prefix} dependent`) }).click();
    await expect(page.getByRole("heading", { name: `${prefix} dependent` })).toBeVisible();
    await expect(page.getByText("Unlocked content.", { exact: true })).toBeVisible();
    await capture(page, "07-student-progress-after-backend-restart.png");
    await expect.poll(() => failures.mockRequests).toEqual([]);
    await expect.poll(() => failures.apiFailures).toEqual([]);
    await expect.poll(() => failures.consoleErrors).toEqual([]);
  });
});
