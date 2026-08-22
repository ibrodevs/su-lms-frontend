import { apiClient } from "./client";

export interface TeacherReferenceDto {
  id: number;
  full_name: string;
  email: string | null;
}

export const referencesApi = {
  teachers(): Promise<TeacherReferenceDto[]> {
    return apiClient.get<TeacherReferenceDto[]>("/references/teachers/");
  },
};
