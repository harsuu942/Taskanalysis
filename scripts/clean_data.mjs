import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Checking database counts before cleaning...");
  const usersBefore = await prisma.user.count();
  const clientsBefore = await prisma.client.count();
  const tasksBefore = await prisma.task.count();
  const projectsBefore = await prisma.project.count();
  const ideasBefore = await prisma.productIdea.count();
  const learningBefore = await prisma.learningItem.count();

  console.log({
    usersBefore,
    clientsBefore,
    tasksBefore,
    projectsBefore,
    ideasBefore,
    learningBefore,
  });

  console.log("🧹 Cleaning all dummy records...");

  // 1. Delete attachments and discussions
  if (prisma.projectAttachment) await prisma.projectAttachment.deleteMany({});
  if (prisma.projectDiscussion) await prisma.projectDiscussion.deleteMany({});

  // 2. Delete product execution phases and ideas
  if (prisma.productExecutionPhase) await prisma.productExecutionPhase.deleteMany({});
  if (prisma.productIdea) await prisma.productIdea.deleteMany({});

  // 3. Delete time logs and task relations
  if (prisma.timeLog) await prisma.timeLog.deleteMany({});
  if (prisma.taskAssignee) await prisma.taskAssignee.deleteMany({});
  if (prisma.taskClient) await prisma.taskClient.deleteMany({});

  // 4. Delete tasks and projects
  if (prisma.task) await prisma.task.deleteMany({});
  if (prisma.project) await prisma.project.deleteMany({});

  // 5. Delete learning items and clients
  if (prisma.learningItem) await prisma.learningItem.deleteMany({});
  if (prisma.client) await prisma.client.deleteMany({});

  // 6. Delete attendance, leaves, reports if any
  if (prisma.attendance) await prisma.attendance.deleteMany({});
  if (prisma.leaveRequest) await prisma.leaveRequest.deleteMany({});
  if (prisma.dailyReport) await prisma.dailyReport.deleteMany({});

  // 7. Ensure personal owner user Harsh exists and delete other users
  let user = await prisma.user.findFirst({
    where: { email: "harsh@personal.studio" },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        id: "user_personal_harsh",
        userId: "harsh",
        name: "Harsh",
        email: "harsh@personal.studio",
        password: "clean_setup_password",
        role: "ADMIN",
        designation: "Consultant & Lead Engineer",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=harsh",
      },
    });
    console.log("✅ Created fresh personal owner account: Harsh");
  } else {
    console.log("✅ Preserved personal owner account: Harsh");
  }

  const deletedExtraUsers = await prisma.user.deleteMany({
    where: {
      email: { not: "harsh@personal.studio" },
    },
  });
  console.log(`✅ Removed ${deletedExtraUsers.count} extra dummy users.`);

  // Verify counts after clean
  const usersAfter = await prisma.user.count();
  const clientsAfter = await prisma.client.count();
  const tasksAfter = await prisma.task.count();
  const projectsAfter = await prisma.project.count();
  const ideasAfter = await prisma.productIdea.count();
  const learningAfter = await prisma.learningItem.count();

  console.log("📊 Database status after clean:");
  console.log({
    users: usersAfter,
    clients: clientsAfter,
    tasks: tasksAfter,
    projects: projectsAfter,
    ideas: ideasAfter,
    learning: learningAfter,
  });

  console.log("✨ All tables cleaned successfully! Ready for your fresh personal data.");
}

main()
  .catch((e) => {
    console.error("Error cleaning data:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
