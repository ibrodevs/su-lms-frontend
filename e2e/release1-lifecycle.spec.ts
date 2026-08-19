import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { promisify } from "node:util";
import { expect, test } from "@playwright/test";
import type { BrowserContext, Page } from "@playwright/test";
import { collectRuntimeFailures, demoAccounts, loginAs } from "./helpers/auth";

const execFileAsync = promisify(execFile);
const backendDirectory = process.env.E2E_BACKEND_DIR ?? resolve(process.cwd(), "..", "su-lms-backend");
const captureScreenshots = process.env.E2E_CAPTURE_SCREENSHOTS === "1";
const screenshotDirectory = resolve(process.cwd(), "docs", "screenshots", "release1-lifecycle");
const studentEmail = "student@su.edu.kg";

interface RuntimeFailures {
  apiFailures: string[];
  consoleErrors: string[];
  mockRequests: string[];
}

interface RolePage {
  context: BrowserContext;
  failures: RuntimeFailures;
  page: Page;
}

async function capture(page: Page, filename: string): Promise<void> {
  if (!captureScreenshots) return;
  await mkdir(screenshotDirectory, { recursive: true });
  await page.screenshot({ fullPage: true, path: resolve(screenshotDirectory, filename) });
}

async function cleanupLifecycleCourse(courseCode: string): Promise<void> {
  if (!existsSync(resolve(backendDirectory, "docker-compose.yml"))) {
    throw new Error(`Backend repository was not found at ${backendDirectory}. Set E2E_BACKEND_DIR for lifecycle cleanup.`);
  }

  const cleanupScript = [
    "import os",
    "from courses.models import Course",
    "code = os.environ['E2E_COURSE_CODE']",
    "assert code.startswith('E2E-LC-')",
    "course = Course.objects.filter(code=code).first()",
    "materials = list(course.learning_materials.all()) if course else []",
    "packages = list(course.scorm_packages.all()) if course else []",
    "[material.file.delete(save=False) for material in materials if material.file]",
    "[package.file.delete(save=False) for package in packages if package.file]",
    "course.cover.delete(save=False) if course and course.cover else None",
    "course.syllabus.delete(save=False) if course and course.syllabus else None",
    "course.delete() if course else None",
  ].join("; ");

  await execFileAsync(
    "docker",
    [
      "compose",
      "exec",
      "-T",
      "-e",
      `E2E_COURSE_CODE=${courseCode}`,
      "backend",
      "python",
      "manage.py",
      "shell",
      "-c",
      cleanupScript,
    ],
    { cwd: backendDirectory },
  );
}

async function assertNoRuntimeFailures(rolePages: RolePage[]): Promise<void> {
  for (const { failures } of rolePages) {
    await expect.poll(() => failures.mockRequests).toEqual([]);
    await expect.poll(() => failures.apiFailures).toEqual([]);
    await expect.poll(() => failures.consoleErrors).toEqual([]);
  }
}

test.beforeAll(async ({ request }) => {
  const health = await request.get("http://127.0.0.1:8001/api/v1/health/");
  expect(health.ok(), "Release 1 backend must be running on port 8001").toBe(true);
});

test("Release 1 lifecycle works from teacher creation to student completion", async ({ browser }) => {
  test.setTimeout(120_000);
  const uniquePart = Date.now().toString().slice(-10);
  const courseCode = `E2E-LC-${uniquePart}`;
  const courseTitle = `Release lifecycle ${uniquePart}`;
  const moduleTitle = `Основы ${uniquePart}`;
  const topicTitle = `Введение ${uniquePart}`;
  const lessonTitle = `Первый урок ${uniquePart}`;
  const materialTitle = `Памятка ${uniquePart}`;
  const revisionComment = `Добавить практический вывод ${uniquePart}`;
  const eventTitle = `Практическая встреча ${uniquePart}`;
  const rolePages: RolePage[] = [];
  let teacherPage: Page | null = null;
  let courseId: number | null = null;

  const createRolePage = async (role: "admin" | "content" | "student" | "teacher"): Promise<Page> => {
    const account = demoAccounts.find((candidate) => candidate.role === role);
    expect(account).toBeDefined();
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, account!);
    rolePages.push({ context, failures: collectRuntimeFailures(page), page });
    return page;
  };

  try {
    teacherPage = await createRolePage("teacher");
    await teacherPage.goto("/#/courses/create");
    await expect(teacherPage.getByRole("heading", { name: "Создание курса" })).toBeVisible();
    await teacherPage.getByLabel("Название курса").fill(courseTitle);
    await teacherPage.getByLabel("Code").fill(courseCode);
    await teacherPage.getByLabel("Описание").fill("Полный Release 1 lifecycle через реальный backend.");
    await teacherPage.getByLabel("Факультет").selectOption({ index: 1 });
    await expect.poll(() => teacherPage!.getByLabel("Кафедра").locator("option").count()).toBeGreaterThan(1);
    await teacherPage.getByLabel("Кафедра").selectOption({ index: 1 });
    await expect.poll(() => teacherPage!.getByLabel("Программа").locator("option").count()).toBeGreaterThan(1);
    await teacherPage.getByLabel("Программа").selectOption({ index: 1 });
    await teacherPage.locator('input[type="file"][accept=".pdf,.doc,.docx"]').setInputFiles({
      buffer: Buffer.from("%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF"),
      mimeType: "application/pdf",
      name: `${courseCode}-syllabus.pdf`,
    });
    await teacherPage.getByRole("button", { name: "Сохранить и продолжить" }).click();

    await expect(teacherPage).toHaveURL(/#\/courses\/\d+\/builder$/);
    courseId = Number(teacherPage.url().match(/#\/courses\/(\d+)\/builder$/)?.[1]);
    expect(courseId).toBeGreaterThan(0);

    await teacherPage.getByRole("button", { name: "Добавить модуль" }).click();
    let dialog = teacherPage.getByRole("dialog", { name: "Добавить модуль" });
    await dialog.getByLabel("Название").fill(moduleTitle);
    await dialog.getByRole("button", { name: "Сохранить" }).click();
    await expect(dialog).toBeHidden();

    await teacherPage.getByRole("button", { name: "Добавить тему" }).click();
    dialog = teacherPage.getByRole("dialog", { name: "Добавить тему" });
    await dialog.getByLabel("Название").fill(topicTitle);
    await dialog.getByRole("button", { name: "Сохранить" }).click();
    await expect(dialog).toBeHidden();

    await teacherPage.getByRole("button", { name: "Добавить урок" }).click();
    dialog = teacherPage.getByRole("dialog", { name: "Добавить урок" });
    await dialog.getByLabel("Название").fill(lessonTitle);
    await dialog.getByLabel("Длительность, мин").fill("15");
    await dialog.getByText("Опубликован в структуре").click();
    await dialog.getByRole("button", { name: "Сохранить" }).click();
    await expect(dialog).toBeHidden();

    await teacherPage.getByRole("link", { name: lessonTitle }).click();
    await teacherPage.getByLabel("Контент урока").fill("# Введение\n\nИзучите материал и завершите урок.");
    await teacherPage.getByRole("button", { name: "Сохранить урок" }).click();
    await expect(teacherPage.getByRole("status").filter({ hasText: "Урок сохранён" })).toBeVisible();

    await teacherPage.getByRole("button", { name: "Добавить материал" }).click();
    dialog = teacherPage.getByRole("dialog", { name: "Новый материал" });
    await dialog.getByLabel("Название").fill(materialTitle);
    await dialog.locator('input[type="file"]').setInputFiles({
      buffer: Buffer.from("%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF"),
      mimeType: "application/pdf",
      name: `${courseCode}-material.pdf`,
    });
    await dialog.getByRole("button", { name: "Сохранить" }).click();
    await expect(dialog).toBeHidden();
    await expect(teacherPage.getByRole("heading", { name: materialTitle })).toBeVisible();
    await capture(teacherPage, "01-teacher-builder.png");

    await teacherPage.goto(`/#/courses/${courseId}`);
    const submitButton = teacherPage.getByRole("button", { name: "На проверку" });
    await expect(submitButton).toBeEnabled();
    await submitButton.click();
    dialog = teacherPage.getByRole("dialog", { name: "Отправить курс на проверку?" });
    await dialog.getByRole("button", { name: "Отправить" }).click();
    await expect(teacherPage.getByText("На проверке", { exact: true })).toBeVisible();
    await capture(teacherPage, "02-teacher-submitted-review.png");

    const contentPage = await createRolePage("content");
    await contentPage.goto(`/#/courses/${courseId}`);
    await expect(contentPage.getByRole("heading", { name: courseTitle })).toBeVisible();
    await contentPage.getByRole("button", { name: "Вернуть" }).click();
    dialog = contentPage.getByRole("dialog", { name: "Вернуть курс на доработку" });
    await dialog.getByLabel("Причина возврата").fill(revisionComment);
    await dialog.getByRole("button", { name: "Вернуть", exact: true }).click();
    await expect(contentPage.getByText("Нужна доработка", { exact: true })).toBeVisible();
    await capture(contentPage, "03-content-manager-returned.png");

    await teacherPage.reload();
    await expect(teacherPage.getByText("Нужна доработка", { exact: true })).toBeVisible();
    await expect(teacherPage.getByText(revisionComment, { exact: true })).toBeVisible();
    await teacherPage.goto(`/#/courses/${courseId}/builder`);
    await teacherPage.getByRole("link", { name: lessonTitle }).click();
    await teacherPage.getByLabel("Контент урока").fill("# Введение\n\nИзучите материал, выполните практический вывод и завершите урок.");
    await teacherPage.getByRole("button", { name: "Сохранить урок" }).click();
    await expect(teacherPage.getByRole("status").filter({ hasText: "Урок сохранён" })).toBeVisible();
    await teacherPage.goto(`/#/courses/${courseId}`);
    await teacherPage.getByRole("button", { name: "На проверку" }).click();
    dialog = teacherPage.getByRole("dialog", { name: "Отправить курс на проверку?" });
    await dialog.getByRole("button", { name: "Отправить" }).click();
    await expect(teacherPage.getByText("На проверке", { exact: true })).toBeVisible();
    await capture(teacherPage, "04-teacher-resubmitted.png");

    const adminPage = await createRolePage("admin");
    await adminPage.goto(`/#/courses/${courseId}`);
    await adminPage.getByRole("button", { name: "Опубликовать" }).click();
    dialog = adminPage.getByRole("dialog", { name: "Опубликовать курс?" });
    await dialog.getByRole("button", { name: "Опубликовать" }).click();
    await expect(adminPage.getByText("Опубликован", { exact: true })).toBeVisible();

    await adminPage.getByRole("button", { name: "Студенты" }).click();
    await adminPage.getByRole("button", { name: "Добавить студента" }).click();
    dialog = adminPage.getByRole("dialog", { name: "Добавить студента" });
    await dialog.getByPlaceholder("Имя или email студента").fill(studentEmail);
    await expect(dialog.getByText(studentEmail, { exact: false })).toBeVisible();
    await dialog.getByText(studentEmail, { exact: false }).click();
    await dialog.getByRole("button", { name: "Добавить", exact: true }).click();
    await expect(adminPage.getByRole("status").filter({ hasText: "Студент добавлен" })).toBeVisible();
    await expect(adminPage.getByText("Всего записей: 1", { exact: true })).toBeVisible();
    await expect(adminPage.getByRole("cell", { name: studentEmail })).toBeVisible();
    await capture(adminPage, "05-admin-published-enrollment.png");

    const startsAt = new Date(Date.now() + 24 * 60 * 60 * 1_000);
    const localStartsAt = new Date(startsAt.getTime() - startsAt.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
    await adminPage.goto("/#/calendar");
    await adminPage.getByRole("button", { name: "Добавить событие" }).click();
    dialog = adminPage.getByRole("dialog", { name: "Новое событие" });
    await dialog.getByLabel("Курс").selectOption({ label: `${courseCode} · ${courseTitle}` });
    await dialog.getByLabel("Название").fill(eventTitle);
    await dialog.getByLabel("Начало").fill(localStartsAt);
    await dialog.getByLabel("Описание").fill("Публичное событие опубликованного курса для enrolled student.");
    await dialog.getByRole("button", { name: "Сохранить" }).click();
    await expect(adminPage.getByRole("heading", { name: eventTitle, exact: true })).toBeVisible();
    await capture(adminPage, "06-admin-calendar.png");

    const studentPage = await createRolePage("student");
    await studentPage.goto("/#/student/calendar");
    await expect(studentPage.getByRole("heading", { name: "Календарь", exact: true })).toBeVisible();
    await expect(studentPage.getByText(eventTitle, { exact: true }).first()).toBeVisible();
    await capture(studentPage, "07-student-calendar.png");

    await studentPage.goto(`/#/student/courses/${courseId}`);
    await expect(studentPage.getByRole("heading", { name: courseTitle })).toBeVisible();
    await expect(studentPage.getByText("Завершено 0 из 1 доступных уроков.")).toBeVisible();
    await studentPage.getByRole("button", { name: "Содержание" }).click();
    await studentPage.getByRole("link", { name: new RegExp(lessonTitle) }).click();
    await studentPage.getByRole("button", { name: "Начать урок" }).click();
    await expect(studentPage.getByRole("button", { name: "Завершить урок" })).toBeEnabled();
    await studentPage.getByRole("button", { name: "Завершить урок" }).click();
    dialog = studentPage.getByRole("dialog", { name: "Завершить урок?" });
    await dialog.getByRole("button", { name: "Завершить", exact: true }).click();
    await expect(studentPage.getByRole("status").filter({ hasText: "Урок завершён" })).toBeVisible();
    await capture(studentPage, "08-student-lesson-completed.png");
    await studentPage.goto(`/#/student/courses/${courseId}`);
    await expect(studentPage.getByText("Завершено 1 из 1 доступных уроков.")).toBeVisible();
    await expect(studentPage.getByText("Курс завершён")).toBeVisible();
    await capture(studentPage, "09-student-progress.png");

    await assertNoRuntimeFailures(rolePages);
  } finally {
    await Promise.all(rolePages.map(({ context }) => context.close()));
    await cleanupLifecycleCourse(courseCode);
  }
});
