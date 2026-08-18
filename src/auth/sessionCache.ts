import type { QueryClient } from "@tanstack/react-query";
import { authQueryKeys } from "./queryKeys";

export async function clearAuthenticatedCache(client: QueryClient): Promise<void> {
  await client.cancelQueries();
  client.removeQueries({
    predicate: (query) => query.queryKey[0] !== authQueryKeys.all[0],
  });
  client.setQueryData(authQueryKeys.me, null);
}

