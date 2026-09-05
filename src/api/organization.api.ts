import { apiClient } from "./client";
import type { PaginatedResponse } from "./types";

export interface FacultyDto {
  id: number;
  name: string;
  code: string;
  is_active: boolean;
}

export interface DepartmentDto {
  id: number;
  faculty: number;
  name: string;
  code: string;
  is_active: boolean;
}

export interface ProgramDto {
  id: number;
  department: number;
  name: string;
  code: string;
  degree_level: "associate" | "bachelor" | "master" | "doctorate";
  is_active: boolean;
}

export interface SemesterDto {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export interface GroupDto {
  id: number;
  program: number;
  name: string;
  admission_year: number;
  is_active: boolean;
}

type ReferenceCollection<T> = T[] | PaginatedResponse<T>;

function normalizeReferenceCollection<T>(response: ReferenceCollection<T>): T[] {
  return Array.isArray(response) ? response : response.results;
}

export const organizationApi = {
  faculties(): Promise<FacultyDto[]> {
    return apiClient
      .get<ReferenceCollection<FacultyDto>>("/organization/faculties/")
      .then(normalizeReferenceCollection);
  },

  departments(facultyId?: number): Promise<DepartmentDto[]> {
    const query = facultyId ? `?faculty=${facultyId}` : "";
    return apiClient
      .get<ReferenceCollection<DepartmentDto>>(`/organization/departments/${query}`)
      .then(normalizeReferenceCollection);
  },

  programs(departmentId?: number): Promise<ProgramDto[]> {
    const query = departmentId ? `?department=${departmentId}` : "";
    return apiClient
      .get<ReferenceCollection<ProgramDto>>(`/organization/programs/${query}`)
      .then(normalizeReferenceCollection);
  },

  groups(programId?: number): Promise<GroupDto[]> {
    const query = programId ? `?program=${programId}` : "";
    return apiClient
      .get<ReferenceCollection<GroupDto>>(`/organization/groups/${query}`)
      .then(normalizeReferenceCollection);
  },

  semesters(): Promise<SemesterDto[]> {
    return apiClient
      .get<ReferenceCollection<SemesterDto>>("/organization/semesters/")
      .then(normalizeReferenceCollection);
  },
};

