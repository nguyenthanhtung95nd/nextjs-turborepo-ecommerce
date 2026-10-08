import { describe, expect, it } from "vitest";
import { wouldOrphanRoleManage } from "../src/roles/lockout";

/**
 * Covered here rather than end-to-end on purpose: the rule only fires when the whole system is
 * down to a single grant of `role:manage`, and reducing a shared database to that state would
 * break every test running beside it. An earlier attempt to do so stripped the permission from
 * the seeded SUPER_ADMIN role and left it that way.
 */
describe("wouldOrphanRoleManage", () => {
  it("blocks the last grant from being dropped", () => {
    expect(
      wouldOrphanRoleManage({
        roleGrantsManage: true,
        changeKeepsManage: false,
        anotherRoleGrantsManage: false,
      }),
    ).toBe(true);
  });

  it("allows dropping it while another role still grants it", () => {
    expect(
      wouldOrphanRoleManage({
        roleGrantsManage: true,
        changeKeepsManage: false,
        anotherRoleGrantsManage: true,
      }),
    ).toBe(false);
  });

  it("allows a change that keeps the permission, even as the only grant", () => {
    expect(
      wouldOrphanRoleManage({
        roleGrantsManage: true,
        changeKeepsManage: true,
        anotherRoleGrantsManage: false,
      }),
    ).toBe(false);
  });

  it("ignores roles that never granted it", () => {
    for (const changeKeepsManage of [true, false]) {
      for (const anotherRoleGrantsManage of [true, false]) {
        expect(
          wouldOrphanRoleManage({
            roleGrantsManage: false,
            changeKeepsManage,
            anotherRoleGrantsManage,
          }),
        ).toBe(false);
      }
    }
  });

  // Deleting is "stop granting it", so it reaches the predicate with changeKeepsManage: false.
  it("blocks deleting the only role that grants it", () => {
    expect(
      wouldOrphanRoleManage({
        roleGrantsManage: true,
        changeKeepsManage: false,
        anotherRoleGrantsManage: false,
      }),
    ).toBe(true);
  });
});
