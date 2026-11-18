import { BadRequestException } from "@nestjs/common";
import { ProjectRole } from "@prisma/client";
import { toPublicProject } from "./projects.service";

describe("ProjectsService helpers & serialization", () => {
  it("toPublicProject strips apiKeyHash and replaces webhookSecret with boolean flag", () => {
    const rawProject = {
      id: "proj-123",
      name: "Test Project",
      description: "Sample project",
      stagingUrl: "https://staging.test.com",
      apiKeyPrefix: "if_pk_12345678",
      apiKeyHash: "super-secret-hash",
      allowedOrigins: ["https://staging.test.com"],
      githubRepo: "test/repo",
      webhookSecret: "secret-hmac-key",
      nextTicketNo: 1,
      createdAt: new Date(),
    } as any;

    const pub = toPublicProject(rawProject);
    expect(pub.id).toBe("proj-123");
    expect(pub.name).toBe("Test Project");
    expect(pub.apiKeyPrefix).toBe("if_pk_12345678");
    expect(pub.allowedOrigins).toEqual(["https://staging.test.com"]);
    expect((pub as any).apiKeyHash).toBeUndefined();
    expect((pub as any).webhookSecret).toBeUndefined();
    expect(pub.hasWebhookSecret).toBe(true);
  });

  it("toPublicProject reports hasWebhookSecret as false when secret is null", () => {
    const rawProject = {
      id: "proj-456",
      name: "Open Project",
      description: null,
      stagingUrl: null,
      apiKeyPrefix: "if_pk_87654321",
      apiKeyHash: "hash-value",
      allowedOrigins: [],
      githubRepo: null,
      webhookSecret: null,
      nextTicketNo: 1,
      createdAt: new Date(),
    } as any;

    const pub = toPublicProject(rawProject);
    expect(pub.hasWebhookSecret).toBe(false);
  });
});
