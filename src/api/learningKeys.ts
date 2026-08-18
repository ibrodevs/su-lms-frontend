export const learningKeys = {
  all: ["learning"] as const,
  structures: () => [...learningKeys.all, "structure"] as const,
  structure: (courseId: number) => [...learningKeys.structures(), courseId] as const,
};
