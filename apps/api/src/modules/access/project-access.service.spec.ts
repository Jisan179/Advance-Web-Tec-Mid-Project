import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { ProjectRole } from "@prisma/client";
import { ProjectAccessService } from "./project-access.service";

describe("project membership access", () => {
  const findUnique = jest.fn();
  const service = new ProjectAccessService({ membership: { findUnique } } as any);

  beforeEach(() => findUnique.mockReset());

  it("allows a developer when membership alone is required", async () => {
    findUnique.mockResolvedValue({ role: ProjectRole.DEVELOPER });
    await expect(service.requireMember("user", "project")).resolves.toEqual({
      role: ProjectRole.DEVELOPER,
    });
  });

  it("rejects a developer when a route requires a tester", async () => {
    findUnique.mockResolvedValue({ role: ProjectRole.DEVELOPER });
    await expect(service.requireMember("user", "project", [ProjectRole.TESTER_CLIENT]))
      .rejects.toBeInstanceOf(ForbiddenException);
  });

  it("does not reveal a project to a non-member", async () => {
    findUnique.mockResolvedValue(null);
    await expect(service.requireMember("user", "project"))
      .rejects.toBeInstanceOf(NotFoundException);
  });
});
