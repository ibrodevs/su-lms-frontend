import { describe, expect, it } from "vitest";
import {
  getHomePathForRoles,
  getPrimaryRole,
  getStaffRole,
  hasAnyRole,
} from "./roles";

describe("auth roles", () => {
  it.each([
    [["student"], "/student"],
    [["teacher"], "/teacher"],
    [["teaching_assistant"], "/teacher"],
    [["content_manager"], "/content"],
    [["lms_admin"], "/admin"],
    [["super_admin"], "/admin"],
  ] as const)("routes %j to %s", (roles, expectedPath) => {
    expect(getHomePathForRoles(roles)).toBe(expectedPath);
  });

  it("uses the highest privileged role for multi-role users", () => {
    expect(getPrimaryRole(["student", "teacher"])).toBe("teacher");
    expect(getStaffRole(["student", "content_manager"])).toBe("content-manager");
  });

  it("checks allowed backend roles", () => {
    expect(hasAnyRole(["teacher"], ["teacher", "lms_admin"])).toBe(true);
    expect(hasAnyRole(["student"], ["teacher", "lms_admin"])).toBe(false);
  });
});

