import { afterEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "./client";
import { ApiClientError } from "./errors";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("apiClient", () => {
  it("sends JSON requests with cookie credentials", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: 7 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiClient.post<{ id: number }>("/courses/", { title: "API course" }))
      .resolves.toEqual({ id: 7 });

    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(request.credentials).toBe("include");
    expect(new Headers(request.headers).get("Content-Type")).toBe("application/json");
    expect(request.body).toBe(JSON.stringify({ title: "API course" }));
  });

  it("refreshes once after a 401 and retries the original request", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 3 }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiClient.get<{ id: number }>("/auth/me/"))
      .resolves.toEqual({ id: 3 });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(String(fetchMock.mock.calls[1]?.[0])).toContain("/auth/refresh/");
  });

  it("does not enter a refresh loop when the retried request is unauthorized", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        error: { code: "authentication_failed", message: "Authentication failed." },
      }), { status: 401 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiClient.get("/courses/"))
      .rejects.toMatchObject({ code: "authentication_failed", status: 401 });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("parses the canonical backend validation error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response(JSON.stringify({
        error: {
          code: "validation_error",
          message: "Validation failed.",
          fields: { code: ["Course code already exists."] },
        },
      }), { status: 400 }),
    ));

    try {
      await apiClient.post("/courses/", { code: "CS101" }, { skipAuthRefresh: true });
      throw new Error("Expected API request to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiClientError);
      expect(error).toMatchObject({
        code: "validation_error",
        status: 400,
        fields: { code: ["Course code already exists."] },
      });
    }
  });
});

