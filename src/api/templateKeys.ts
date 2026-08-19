export const templateKeys = {
  all: ["course-templates"] as const,
  lists: () => [...templateKeys.all, "list"] as const,
  list: () => [...templateKeys.lists()] as const,
  details: () => [...templateKeys.all, "detail"] as const,
  detail: (templateId: number) => [...templateKeys.details(), templateId] as const,
};
