import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const backendDirectory = process.env.E2E_BACKEND_DIR ?? resolve(process.cwd(), "..", "su-lms-backend");

export interface FinalStabilizationFixture {
  dependentLessonId: number;
  firstLessonId: number;
  lockedCourseId: number;
  staffCourseId: number;
  staffLessonId: number;
}

export async function restartBackend(): Promise<void> {
  if (!existsSync(resolve(backendDirectory, "docker-compose.yml"))) {
    throw new Error(`Backend repository was not found at ${backendDirectory}. Set E2E_BACKEND_DIR.`);
  }
  await execFileAsync("docker", ["compose", "restart", "backend"], {
    cwd: backendDirectory,
    maxBuffer: 2 * 1024 * 1024,
  });
}

async function runDjangoScript(script: string, environment: Record<string, string>): Promise<string> {
  if (!existsSync(resolve(backendDirectory, "docker-compose.yml"))) {
    throw new Error(`Backend repository was not found at ${backendDirectory}. Set E2E_BACKEND_DIR.`);
  }
  const environmentArgs = Object.entries(environment).flatMap(([key, value]) => ["-e", `${key}=${value}`]);
  const { stdout } = await execFileAsync(
    "docker",
    [
      "compose",
      "exec",
      "-T",
      ...environmentArgs,
      "backend",
      "python",
      "manage.py",
      "shell",
      "-c",
      `exec(${JSON.stringify(script)})`,
    ],
    { cwd: backendDirectory, maxBuffer: 2 * 1024 * 1024 },
  );
  return stdout;
}

export async function createFinalStabilizationFixture(prefix: string): Promise<FinalStabilizationFixture> {
  const script = [
    "import json, os",
    "from django.contrib.auth import get_user_model",
    "from django.utils import timezone",
    "from courses.models import Course, CourseStatus, CourseTeachingAssignment, CourseTeachingRole",
    "from enrollments.models import Enrollment",
    "from learning.models import CourseModule, CourseTopic, Lesson, ReleaseType",
    "from organization.models import Faculty, Department, Program, Semester",
    "prefix = os.environ['E2E_PREFIX']",
    "User = get_user_model()",
    "admin = User.objects.get(email='admin@su.edu.kg')",
    "teacher = User.objects.get(email='teacher@su.edu.kg')",
    "student = User.objects.get(email='student@su.edu.kg')",
    "faculty = Faculty.objects.filter(is_active=True).first()",
    "department = Department.objects.filter(faculty=faculty, is_active=True).first()",
    "program = Program.objects.filter(department=department, is_active=True).first()",
    "semester = Semester.objects.filter(is_active=True).first()",
    "common = dict(language='ru', credits=3, semester=semester, faculty=faculty, department=department, program=program, start_date=semester.start_date, end_date=semester.end_date, created_by=admin, updated_by=admin)",
    "locked = Course.objects.create(title=f'{prefix} locked course', code=f'{prefix}-LOCK', description='Dependent lesson browser fixture', status=CourseStatus.PUBLISHED, published_at=timezone.now(), published_by=admin, **common)",
    "CourseTeachingAssignment.objects.create(course=locked, user=teacher, role=CourseTeachingRole.TEACHER, is_primary=True, created_by=admin, updated_by=admin)",
    "locked_module = CourseModule.objects.create(course=locked, title='Unlock module', order=1, created_by=admin, updated_by=admin)",
    "locked_topic = CourseTopic.objects.create(module=locked_module, title='Unlock topic', order=1, created_by=admin, updated_by=admin)",
    "first = Lesson.objects.create(topic=locked_topic, title=f'{prefix} prerequisite', content='Complete this prerequisite.', estimated_duration_minutes=5, order=1, is_published=True, created_by=admin, updated_by=admin)",
    "dependent = Lesson.objects.create(topic=locked_topic, title=f'{prefix} dependent', content='Unlocked content.', estimated_duration_minutes=5, order=2, release_type=ReleaseType.AFTER_LESSON, required_lesson=first, is_published=True, created_by=admin, updated_by=admin)",
    "Enrollment.objects.create(student=student, course=locked, created_by=admin, updated_by=admin)",
    "staff = Course.objects.create(title=f'{prefix} source course', code=f'{prefix}-SRC', description='SCORM, copy and template fixture', status=CourseStatus.DRAFT, **common)",
    "CourseTeachingAssignment.objects.create(course=staff, user=teacher, role=CourseTeachingRole.TEACHER, is_primary=True, created_by=admin, updated_by=admin)",
    "staff_module = CourseModule.objects.create(course=staff, title='SCORM module', order=1, created_by=admin, updated_by=admin)",
    "staff_topic = CourseTopic.objects.create(module=staff_module, title='SCORM topic', order=1, created_by=admin, updated_by=admin)",
    "staff_lesson = Lesson.objects.create(topic=staff_topic, title=f'{prefix} SCORM lesson', content='Interactive package.', estimated_duration_minutes=10, order=1, is_published=True, created_by=admin, updated_by=admin)",
    "print('E2E_RESULT=' + json.dumps({'lockedCourseId': locked.id, 'firstLessonId': first.id, 'dependentLessonId': dependent.id, 'staffCourseId': staff.id, 'staffLessonId': staff_lesson.id}))",
  ].join("\n");
  const output = await runDjangoScript(script, { E2E_PREFIX: prefix });
  const match = output.match(/E2E_RESULT=(\{[^\r\n]+\})/);
  if (!match?.[1]) throw new Error(`Could not parse fixture result: ${output}`);
  return JSON.parse(match[1]) as FinalStabilizationFixture;
}

export async function cleanupFinalStabilizationFixture(prefix: string): Promise<void> {
  const script = [
    "import os",
    "from courses.models import Course, CourseTemplate",
    "from learning.models import Lesson",
    "prefix = os.environ['E2E_PREFIX']",
    "assert prefix.startswith('E2E-FINAL-')",
    "courses = list(Course.objects.filter(code__startswith=prefix))",
    "[package.file.delete(save=False) for course in courses for package in course.scorm_packages.all() if package.file]",
    "Lesson.objects.filter(topic__module__course__in=courses, required_lesson__isnull=False).update(release_type='always', required_lesson=None)",
    "[course.delete() for course in courses]",
    "CourseTemplate.objects.filter(title__startswith=prefix).delete()",
  ].join("\n");
  await runDjangoScript(script, { E2E_PREFIX: prefix });
}
