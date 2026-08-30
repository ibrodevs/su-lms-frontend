import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { authQueryKeys } from "./queryKeys";
import { clearAuthenticatedCache } from "./sessionCache";

describe("clearAuthenticatedCache", () => {
  it("clears domain queries and marks the active auth query unauthenticated", async () => {
    const client = new QueryClient();
    client.setQueryData(authQueryKeys.me, { id: 6 });
    client.setQueryData(["courses", "list"], [{ id: 1 }]);

    await clearAuthenticatedCache(client);

    expect(client.getQueryData(authQueryKeys.me)).toBeNull();
    expect(client.getQueryData(["courses", "list"])).toBeUndefined();
  });
});

