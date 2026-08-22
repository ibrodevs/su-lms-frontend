import { afterEach, describe, expect, it, vi } from "vitest";
import { organizationApi } from "./organization.api";
import { referencesApi } from "./references.api";
import { rolesApi } from "./roles.api";
import { usersApi } from "./users.api";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("reference APIs", () => {
  it("loads the compact teacher reference endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([{ id: 4, full_name: "Teacher Demo", email: "teacher@su.edu.kg" }]), {
        status: 200,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(referencesApi.teachers()).resolves.toHaveLength(1);
    expect(String(fetchMock.mock.calls[0]?.[0])).toMatch(/\/api\/v1\/references\/teachers\/$/);
  });

  it("builds the server-side user filters expected by the backend", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ count: 0, next: null, previous: null, results: [] }), {
        status: 200,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await usersApi.list({
      page: 2,
      pageSize: 50,
      search: "Teacher Demo",
      role: "teacher",
      isActive: true,
    });

    const requestUrl = new URL(String(fetchMock.mock.calls[0]?.[0]), "http://localhost");
    expect(requestUrl.pathname).toBe("/api/v1/users/");
    expect(Object.fromEntries(requestUrl.searchParams)).toEqual({
      page: "2",
      page_size: "50",
      search: "Teacher Demo",
      role: "teacher",
      is_active: "true",
    });
  });

  it("uses the canonical roles endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([{ code: "teacher", name: "Teacher", description: "" }]), {
        status: 200,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(rolesApi.list()).resolves.toHaveLength(1);
    expect(String(fetchMock.mock.calls[0]?.[0])).toMatch(/\/api\/v1\/roles\/$/);
  });

  it("keeps organization requests on the documented canonical paths", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("[]", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await organizationApi.departments(3);

    const requestUrl = new URL(String(fetchMock.mock.calls[0]?.[0]), "http://localhost");
    expect(requestUrl.pathname).toBe("/api/v1/organization/departments/");
    expect(requestUrl.searchParams.get("faculty")).toBe("3");
  });
});
