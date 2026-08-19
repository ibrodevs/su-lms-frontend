import { mkdir } from "node:fs/promises";
import { chromium } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:5173";
const demoPassword = process.env.E2E_DEMO_PASSWORD ?? "Demo123!";
const outputDirectory = "docs/screenshots/release1-e2e";

await mkdir(outputDirectory, { recursive: true });

const browser = await chromium.launch();

async function login(email, homePath) {
  const context = await browser.newContext({ viewport: { height: 900, width: 1440 } });
  const page = await context.newPage();
  await page.goto(`${baseURL}/#/login`);
  await page.getByLabel("Логин или email").fill(email);
  await page.locator("#password").fill(demoPassword);
  await page.getByRole("button", { name: "Войти" }).click();
  await page.waitForURL(`**/#${homePath}`);
  return { context, page };
}

async function capture(page, name) {
  await page.waitForLoadState("networkidle");
  await page.screenshot({
    animations: "disabled",
    fullPage: true,
    path: `${outputDirectory}/${name}.png`,
  });
}

try {
  const student = await login("student@su.edu.kg", "/student");
  await capture(student.page, "student-dashboard-real");
  await student.page.getByRole("link", { name: "Мои курсы" }).first().click();
  await student.page.getByRole("heading", { name: /^Мои курсы/ }).waitFor();
  await capture(student.page, "student-courses-real");
  await student.page.getByRole("link", { name: "Открыть курс" }).first().click();
  await student.page.getByRole("navigation", { name: "Разделы курса" }).waitFor();
  await capture(student.page, "student-course-real");
  await student.page.getByRole("link", { name: "Календарь" }).first().click();
  await student.page.getByRole("heading", { name: "Календарь", exact: true }).waitFor();
  await capture(student.page, "student-calendar-real");
  await student.context.close();

  const teacher = await login("teacher@su.edu.kg", "/teacher");
  await teacher.page.getByRole("heading", { name: /добрый день/i }).waitFor();
  await capture(teacher.page, "teacher-dashboard-real");
  await teacher.page.getByRole("link", { name: "Мои курсы" }).first().click();
  await teacher.page.getByRole("heading", { name: "Курсы", exact: true }).waitFor();
  await teacher.page.getByRole("link", { name: /Открыть курс/ }).first().waitFor();
  await capture(teacher.page, "teacher-courses-real");
  await teacher.page.getByRole("link", { name: /Открыть курс/ }).first().click();
  await teacher.page.getByRole("navigation", { name: "Разделы курса" }).waitFor();
  await teacher.page.getByRole("button", { name: "Готовность" }).click();
  await capture(teacher.page, "course-readiness-real");
  const builderLink = teacher.page.getByRole("link", { name: "Course Builder" });
  if (await builderLink.count()) {
    await builderLink.click();
    await teacher.page.getByRole("heading", { name: "Структура курса", exact: true }).waitFor();
    await capture(teacher.page, "course-builder-real");
  }
  await teacher.context.close();

  const content = await login("content@su.edu.kg", "/content");
  await content.page.goto(`${baseURL}/#/courses?status=under_review`);
  await content.page.getByRole("heading", { name: "Курсы", exact: true }).waitFor();
  await capture(content.page, "content-review-real");
  await content.page.getByRole("link", { name: "Календарь" }).click();
  await content.page.getByRole("heading", { name: "Календарь", exact: true }).waitFor();
  await capture(content.page, "staff-calendar-real");
  await content.context.close();

  const admin = await login("admin@su.edu.kg", "/admin");
  await admin.page.getByRole("link", { name: "Пользователи" }).click();
  await admin.page.getByRole("heading", { name: "Пользователи", exact: true }).waitFor();
  await admin.page.getByRole("button", { name: "Открыть" }).first().waitFor();
  await capture(admin.page, "admin-users-real");
  await admin.page.getByRole("link", { name: "Все курсы" }).click();
  await admin.page.getByRole("link", { name: /Открыть курс/ }).first().click();
  await admin.page.getByRole("button", { name: "Студенты" }).click();
  await admin.page.getByRole("heading", { name: "Студенты курса", exact: true }).waitFor();
  await capture(admin.page, "admin-enrollments-real");
  await admin.context.close();
} finally {
  await browser.close();
}

console.log(`Release 1 screenshots saved to ${outputDirectory}`);
