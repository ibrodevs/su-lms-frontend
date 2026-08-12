import type { Department, Faculty, Program, Semester } from "../../types/staff";

export const mockFaculties: Faculty[] = [
  { id: "faculty-digital", name: "Факультет цифровых технологий" },
  { id: "faculty-economics", name: "Факультет экономики и управления" },
  { id: "faculty-humanities", name: "Гуманитарный факультет" },
];

export const mockDepartments: Department[] = [
  { id: "department-software", facultyId: "faculty-digital", name: "Программная инженерия" },
  { id: "department-data", facultyId: "faculty-digital", name: "Data Science и ИИ" },
  { id: "department-management", facultyId: "faculty-economics", name: "Менеджмент" },
  { id: "department-finance", facultyId: "faculty-economics", name: "Финансы и аналитика" },
  { id: "department-languages", facultyId: "faculty-humanities", name: "Иностранные языки" },
  { id: "department-social", facultyId: "faculty-humanities", name: "Социальные науки" },
];

export const mockPrograms: Program[] = [
  { id: "program-software", departmentId: "department-software", name: "Программная инженерия" },
  { id: "program-cybersecurity", departmentId: "department-software", name: "Кибербезопасность" },
  { id: "program-data", departmentId: "department-data", name: "Анализ данных" },
  { id: "program-ai", departmentId: "department-data", name: "Искусственный интеллект" },
  { id: "program-business", departmentId: "department-management", name: "Бизнес-администрирование" },
  { id: "program-finance", departmentId: "department-finance", name: "Финансы" },
  { id: "program-translation", departmentId: "department-languages", name: "Перевод и межкультурная коммуникация" },
  { id: "program-psychology", departmentId: "department-social", name: "Психология" },
];

export const mockSemesters: Semester[] = [
  { id: "semester-fall-2026", name: "Осень 2026", startDate: "2026-09-01", endDate: "2026-12-24" },
  { id: "semester-spring-2027", name: "Весна 2027", startDate: "2027-01-18", endDate: "2027-05-28" },
  { id: "semester-summer-2027", name: "Лето 2027", startDate: "2027-06-07", endDate: "2027-08-13" },
  { id: "semester-fall-2027", name: "Осень 2027", startDate: "2027-09-01", endDate: "2027-12-24" },
];
