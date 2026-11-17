
import {
  BuildStatus,
  PrismaClient,
  ProjectRole,
  TicketSeverity,
  TicketStatus,
} from "@prisma/client";
import * as bcrypt from "bcrypt";
import { sha256 } from "../src/common/utils/crypto";
import "../src/config";

const prisma = new PrismaClient();
const email = "tester@inspectflow.demo";
const key = "if_pk_demo_acme_staging_key_0001";
const stagingUrl = "http://localhost:4001";

async function seed() {
  const [target] = await prisma.$queryRaw<{ name: string }[]>`SELECT current_database() AS name`;
  if (!target || !/^inspectflow_actor(?:_[a-z0-9]+)*$/.test(target.name)) {
    throw new Error("Use a separate inspectflow_actor database for the reviewer demo.");
  }
  const passwordHash = await bcrypt.hash(process.env.DEMO_PASSWORD ?? "Demo@12345", 12);
  await prisma.$transaction(async (tx) => {
    const user = await tx.user.upsert({
      where: { email },
      update: {},
      create: { email, name: "Tara Tester", passwordHash },
    });
    const project = await tx.project.upsert({
      where: { apiKeyPrefix: key.slice(0, 14) },
      update: {},
      create: {
        name: "Acme Shop Reviewer Demo",
        description: "Report defects, verify fixes and review staging builds.",
        stagingUrl,
        apiKeyPrefix: key.slice(0, 14),
        apiKeyHash: sha256(key),
        allowedOrigins: [stagingUrl, "http://127.0.0.1:4001"],
        nextTicketNo: 3,
      },
    });
    await tx.membership.upsert({
      where: { userId_projectId: { userId: user.id, projectId: project.id } },
      update: {},
      create: { userId: user.id, projectId: project.id, role: ProjectRole.TESTER_CLIENT },
    });

    const checkout = await tx.build.upsert({
      where: { id: "e15a3e6c-c24c-4d1a-96c5-b72ad32519a2" },
      update: {},
      create: {
        id: "e15a3e6c-c24c-4d1a-96c5-b72ad32519a2",
        projectId: project.id,
        name: "Checkout build",
        branch: "release/checkout",
        commitSha: "9f8e7d6c5b4a39281706f5e4d3c2b1a098765432",
        previewUrl: stagingUrl,
        status: BuildStatus.IN_REVIEW,
      },
    });
    await tx.build.upsert({
      where: { id: "b06330aa-902a-491c-9897-4760a15c95da" },
      update: {},
      create: {
        id: "b06330aa-902a-491c-9897-4760a15c95da",
        projectId: project.id,
        name: "Catalogue build",
        branch: "release/catalogue",
        commitSha: "a1b2c3d4e5f60718293a4b5c6d7e8f9012345678",
        previewUrl: stagingUrl,
        status: BuildStatus.IN_REVIEW,
      },
    });

    await tx.ticket.upsert({
      where: { projectId_number: { projectId: project.id, number: 1 } },
      update: {},
      create: {
        projectId: project.id,
        buildId: checkout.id,
        reporterId: user.id,
        number: 1,
        title: "Checkout button fix ready for verification",
        description: "This pre-resolved blocking report demonstrates verification before sign-off.",
        status: TicketStatus.RESOLVED,
        severity: TicketSeverity.HIGH,
        resolvedAt: new Date(),
        pageUrl: stagingUrl,
      },
    });
    await tx.ticket.upsert({
      where: { projectId_number: { projectId: project.id, number: 2 } },
      update: {},
      create: {
        projectId: project.id,
        reporterId: user.id,
        number: 2,
        title: "Footer typo still visible",
        description: "Reopen this previously verified report to demonstrate the alternative flow.",
        status: TicketStatus.VERIFIED,
        severity: TicketSeverity.LOW,
        resolvedAt: new Date(),
        pageUrl: stagingUrl,
      },
    });
  });
  console.log("Reviewer demo data ready.");
}

seed().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
