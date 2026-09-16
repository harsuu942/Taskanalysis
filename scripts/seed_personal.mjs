import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

async function main() {
  console.log("🌱 Seeding Personal Task Analysis & Studio database...");

  // 1. Ensure Personal Owner User: Harsh
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
        password: hashPassword("harsh123"),
        role: "ADMIN",
        designation: "Consultant & Lead Engineer",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=harsh",
      },
    });
    console.log("✅ Created Personal User:", user.name);
  } else {
    console.log("ℹ️ Personal User already exists:", user.name);
  }

  // 2. Seed Pitch-Ready Clients
  const clientData = [
    {
      name: "Elena Rostova",
      company: "Nexus AI Technologies",
      email: "elena@nexusai.io",
      phone: "+1 (415) 890-4321",
      notes: "Series A AI startup focused on enterprise generative search & agentic copilots.",
    },
    {
      name: "Marcus Vance",
      company: "Apex FinTech Solutions",
      email: "marcus@apexfin.com",
      phone: "+1 (212) 555-8910",
      notes: "Institutional investment firm building low-latency algorithmic trade audit tools.",
    },
    {
      name: "Dr. Sarah Chen",
      company: "OmniMobile Health",
      email: "sarah@omnimobile.health",
      phone: "+1 (512) 777-1234",
      notes: "Digital health provider developing patient-facing mobile telemedicine suite.",
    },
  ];

  const clients = [];
  for (const cd of clientData) {
    let client = await prisma.client.findFirst({
      where: { email: cd.email },
    });
    if (!client) {
      client = await prisma.client.create({ data: cd });
    }
    clients.push(client);
  }
  console.log(`✅ Verified ${clients.length} Clients.`);

  // 3. Seed Projects with SOW, Estimations, Approvals, and Discussions
  const projectDefs = [
    {
      title: "AI Customer Support Copilot & RAG Pipeline",
      clientId: clients[0].id,
      status: "ONGOING",
      scopeOfWork: "• Architect and deploy multi-agent RAG pipeline using PostgreSQL pgvector\n• Build responsive streaming chat widget with sentiment classification\n• Implement executive analytics dashboard for resolution latency and deflection rates\n• Deliver automated evaluation test harness with synthetic ground truth",
      initialEstimation: "120 Hours (3 Sprints)",
      approvedAmount: 6500,
      currency: "$",
      approvedTimeframe: "4 Weeks (Oct 1 - Oct 28)",
      isApproved: true,
      approvedAt: new Date(),
      startDate: new Date("2026-10-01"),
      targetDeliveryDate: new Date("2026-10-28"),
      discussions: [
        {
          title: "SOW Scope Review & Tool Calling Alignment",
          meetingDate: new Date("2026-10-02"),
          discussionNotes: "Reviewed vector chunking strategy and database schemas. Elena confirmed tool calling requirements for querying customer CRM records.",
          clientFeedback: "Enthusiastic about sub-400ms TTFT streaming latency. Approved $6,500 milestone budget.",
          actionItems: "Deliver staging URL with streaming chat prototype by Friday.",
        },
        {
          title: "Sprint 1 Check-in: Streaming Latency Demo",
          meetingDate: new Date("2026-10-08"),
          discussionNotes: "Walked through live token streaming demo with Gemini 2.0 Flash. Benchmarked 280ms first token response.",
          clientFeedback: "Extremely pleased with responsiveness. Requested dark mode option for widget.",
          actionItems: "Add dark theme support to widget CSS.",
        },
      ],
    },
    {
      title: "Flutter Cross-Platform Telemedicine Suite",
      clientId: clients[2].id,
      status: "ONBOARD",
      scopeOfWork: "• Cross-platform iOS & Android apps built with Flutter 3.x and Riverpod 2\n• HIPAA-compliant end-to-end encrypted messaging and local SQLite cache\n• Live video consultation room integration with Agora RTC SDK\n• Vital stats charting with hardware-accelerated animations",
      initialEstimation: "90-100 Hours",
      approvedAmount: 4800,
      currency: "$",
      approvedTimeframe: "3 Weeks (Nov 1 - Nov 21)",
      isApproved: true,
      approvedAt: new Date(),
      startDate: new Date("2026-11-01"),
      targetDeliveryDate: new Date("2026-11-21"),
      discussions: [
        {
          title: "Initial Scoping Call with Clinical Team",
          meetingDate: new Date("2026-09-10"),
          discussionNotes: "Discussed HIPAA data handling and offline sync requirements when doctors lose hospital Wi-Fi connection.",
          clientFeedback: "Approved architecture proposal and $4,800 milestone pricing.",
          actionItems: "Finalize Drift SQLite schema and send prototype repo link.",
        },
      ],
    },
    {
      title: "High-Throughput Microservice API Gateway",
      clientId: clients[1].id,
      status: "HOLD",
      scopeOfWork: "• Reverse proxy with rate limiting and token bucket algorithm in Golang\n• Distributed tracing with OpenTelemetry and Jaeger\n• Kafka event bus integration for trade execution notifications",
      initialEstimation: "60 Hours",
      approvedAmount: 3500,
      currency: "$",
      approvedTimeframe: "2 Weeks",
      isApproved: false,
      discussions: [
        {
          title: "Security Review & Audit Pending",
          meetingDate: new Date("2026-09-08"),
          discussionNotes: "Apex InfoSec requested additional white-box penetration testing clause in contract.",
          clientFeedback: "Project placed on temporary hold pending infosec sign-off.",
          actionItems: "Follow up with Marcus once infosec committee meets next Tuesday.",
        },
      ],
    },
    {
      title: "Cloud Infrastructure & Zero-Downtime CI/CD",
      clientId: clients[1].id,
      status: "COMPLETED",
      scopeOfWork: "• Terraform Infrastructure as Code for multi-AZ Kubernetes cluster\n• GitHub Actions CI/CD with automated blue/green canary deployments\n• Prometheus & Grafana alerting for p99 latency spikes",
      initialEstimation: "40 Hours",
      approvedAmount: 2800,
      currency: "$",
      approvedTimeframe: "2 Weeks",
      isApproved: true,
      approvedAt: new Date("2026-08-20"),
      discussions: [],
    },
  ];

  for (const p of projectDefs) {
    const existing = await prisma.project.findFirst({
      where: { title: p.title },
    });

    if (!existing) {
      const proj = await prisma.project.create({
        data: {
          title: p.title,
          clientId: p.clientId,
          status: p.status,
          scopeOfWork: p.scopeOfWork,
          initialEstimation: p.initialEstimation,
          approvedAmount: p.approvedAmount,
          currency: p.currency,
          approvedTimeframe: p.approvedTimeframe,
          isApproved: p.isApproved,
          approvedAt: p.approvedAt || null,
          startDate: p.startDate || null,
          targetDeliveryDate: p.targetDeliveryDate || null,
          discussions: {
            create: p.discussions.map((d) => ({
              title: d.title,
              meetingDate: d.meetingDate,
              discussionNotes: d.discussionNotes,
              clientFeedback: d.clientFeedback,
              actionItems: d.actionItems,
            })),
          },
        },
      });
      console.log(`✅ Created Project: ${proj.title} (${proj.status})`);
    }
  }

  // 4. Seed Tasks with Client Links
  const taskData = [
    {
      title: "Implement RAG vector search retriever module",
      description: "Hook up pgvector similarity search with top-k=5 and reranking using Cohere API.",
      priority: "HIGH",
      employeeStatus: "IN_PROGRESS",
      adminStatus: "NOT_SUBMITTED",
      totalDurationSeconds: 14400,
      clientId: clients[0].id,
      dueDate: new Date(Date.now() + 86400000 * 2),
      createdById: user.id,
      assignedToId: user.id,
    },
    {
      title: "Design dark/light theme for customer support chat widget",
      description: "Support system auto-detection and embedded iframe custom color palettes.",
      priority: "MEDIUM",
      employeeStatus: "TODO",
      adminStatus: "NOT_SUBMITTED",
      clientId: clients[0].id,
      dueDate: new Date(Date.now() + 86400000 * 4),
      createdById: user.id,
      assignedToId: user.id,
    },
    {
      title: "Configure Drift SQLite offline encryption for Flutter telemedicine",
      description: "Enable SQLCipher with AES-256 for local medical records storage.",
      priority: "URGENT",
      employeeStatus: "TODO",
      adminStatus: "NOT_SUBMITTED",
      clientId: clients[2].id,
      dueDate: new Date(Date.now() + 86400000 * 1),
      createdById: user.id,
      assignedToId: user.id,
    },
    {
      title: "Completed Kubernetes Canary pipeline deployment",
      description: "Verified automated rollback on 5xx error rate > 1%.",
      priority: "HIGH",
      employeeStatus: "COMPLETED",
      adminStatus: "FINAL_COMPLETED",
      totalDurationSeconds: 28800,
      clientId: clients[1].id,
      createdById: user.id,
      assignedToId: user.id,
    },
  ];

  for (const td of taskData) {
    const existing = await prisma.task.findFirst({ where: { title: td.title } });
    if (!existing) {
      await prisma.task.create({ data: td });
    }
  }
  console.log("✅ Seeded sample tasks.");

  // 5. Seed Product Ideas & Multi-Phase Timelines
  const ideaData = [
    {
      title: "PromptForge - AI Developer Benchmark Playground",
      tagline: "Automated regression testing and latency benchmarking for production LLM prompts",
      category: "AI Product",
      status: "IN_EXECUTION",
      priority: "HIGH",
      problemStatement: "Engineers change LLM prompts and break edge cases without regression test suites.",
      valueProposition: "One-click benchmark comparison across Gemini, Claude, and GPT with cost per 1M token metrics.",
      targetLaunchDate: new Date("2026-11-15"),
      phases: [
        {
          title: "Phase 1: Competitive Landscape & Spec",
          order: 0,
          status: "COMPLETED",
          startDate: new Date("2026-09-01"),
          endDate: new Date("2026-09-12"),
          deliverables: "Analyzed LangSmith, Humanloop, and Promptfoo features and pricing models",
        },
        {
          title: "Phase 2: Multi-Model Evaluation Engine",
          order: 1,
          status: "IN_PROGRESS",
          startDate: new Date("2026-09-15"),
          endDate: new Date("2026-10-15"),
          deliverables: "Token streaming runner, JSON schema output validator, concurrency throttling",
        },
        {
          title: "Phase 3: Next.js Studio & Diff Viewer",
          order: 2,
          status: "PLANNED",
          startDate: new Date("2026-10-16"),
          endDate: new Date("2026-11-05"),
          deliverables: "Side-by-side prompt execution matrix, latency graphs, token cost calculator",
        },
        {
          title: "Phase 4: Public Beta & Developer Launch",
          order: 3,
          status: "PLANNED",
          startDate: new Date("2026-11-06"),
          endDate: new Date("2026-11-20"),
          deliverables: "ProductHunt launch, npm CLI tool, open-source sample repository",
        },
      ],
    },
    {
      title: "PulseDesk - Freelance Client Portal & SOW Tracker",
      tagline: "Lightweight client proposal, approval, and live milestone delivery tracker",
      category: "SaaS",
      status: "PLANNING",
      priority: "MEDIUM",
      problemStatement: "Freelancers struggle with scope creep, manual PDF invoices, and lost discussion notes.",
      valueProposition: "Interactive client link where clients approve SOW estimates, view milestone progress, and sign off.",
      targetLaunchDate: new Date("2026-12-01"),
      phases: [
        {
          title: "Phase 1: Wireframing & User Validation",
          order: 0,
          status: "COMPLETED",
          startDate: new Date("2026-09-05"),
          endDate: new Date("2026-09-14"),
          deliverables: "Interviewed 12 freelance agency founders; validated SOW approval friction",
        },
        {
          title: "Phase 2: Client Portal & Milestone Approvals",
          order: 1,
          status: "PLANNED",
          startDate: new Date("2026-10-01"),
          endDate: new Date("2026-11-01"),
          deliverables: "Sharable read-only client link, digital sign-off button, Stripe invoice trigger",
        },
      ],
    },
  ];

  for (const id of ideaData) {
    const existing = await prisma.productIdea.findFirst({ where: { title: id.title } });
    if (!existing) {
      await prisma.productIdea.create({
        data: {
          title: id.title,
          tagline: id.tagline,
          category: id.category,
          status: id.status,
          priority: id.priority,
          problemStatement: id.problemStatement,
          valueProposition: id.valueProposition,
          targetLaunchDate: id.targetLaunchDate,
          phases: {
            create: id.phases,
          },
        },
      });
      console.log(`✅ Seeded Product Idea: ${id.title}`);
    }
  }

  // 6. Seed Learning Hub Topics (AI, Flutter, Backend, System Design)
  const learningData = [
    {
      title: "Building Agentic Workflows with LangGraph & Gemini Tool Calling",
      subject: "AI",
      url: "https://github.com/google-gemini/gemini-agent-samples",
      resourceType: "REPO",
      status: "COMPLETED",
      isFavorite: true,
      tags: "gemini, langgraph, ai-agents, python",
      notes: "StateGraph pattern: Nodes represent tool functions or LLM planner steps. Cyclic routing enables auto-recovery when a tool produces invalid schema.",
    },
    {
      title: "Advanced CustomPainter & Shader Animations in Flutter 3.x",
      subject: "Flutter",
      url: "https://docs.flutter.dev/ui/design/animations",
      resourceType: "DOCS",
      status: "IN_PROGRESS",
      isFavorite: true,
      tags: "flutter, animations, shaders, glsl",
      notes: "FragmentProgram loads compiled SPIR-V shaders. Binding time uniforms inside TickerProvider gives smooth 120fps physics animations.",
    },
    {
      title: "High-Performance Concurrency & Distributed Locking in PostgreSQL",
      subject: "Backend",
      url: "https://www.postgresql.org/docs/current/explicit-locking.html",
      resourceType: "ARTICLE",
      status: "COMPLETED",
      isFavorite: false,
      tags: "backend, postgres, locking, concurrency",
      notes: "Advisory locks (pg_advisory_xact_lock) provide lightweight distributed synchronization without row locks or Redis dependencies.",
    },
    {
      title: "Designing Real-Time Collaborative Whiteboard with CRDTs",
      subject: "System Design",
      url: "https://martinfowler.com/articles/cr-dt.html",
      resourceType: "ARTICLE",
      status: "BOOKMARKED",
      isFavorite: true,
      tags: "system-design, crdt, yjs, real-time",
      notes: "State-based vs Operation-based CRDTs. Yjs uses fractional indexing for sequence CRDTs, avoiding tombstones bloat.",
    },
    {
      title: "Flutter State Management Comparison: Riverpod vs Bloc in 2026",
      subject: "Flutter",
      url: "https://riverpod.dev/",
      resourceType: "DOCS",
      status: "COMPLETED",
      isFavorite: false,
      tags: "flutter, riverpod, state-management",
      notes: "AsyncNotifierProvider with code generation replaces manual StateNotifier. AutoDispose cleans up memory when widgets unmount.",
    },
    {
      title: "Deploying Local LLMs with vLLM & PagedAttention on Apple Silicon & Linux",
      subject: "AI",
      url: "https://vllm.ai/",
      resourceType: "ARTICLE",
      status: "IN_PROGRESS",
      isFavorite: true,
      tags: "vllm, llm, inference, paged-attention",
      notes: "PagedAttention manages KV cache memory like virtual memory pages, achieving 2-4x higher throughput during batched inference.",
    },
  ];

  for (const ld of learningData) {
    const existing = await prisma.learningItem.findFirst({ where: { title: ld.title } });
    if (!existing) {
      await prisma.learningItem.create({ data: ld });
    }
  }
  console.log("✅ Seeded Learning Hub topics.");

  console.log("🎉 Seeding complete! Personal workspace ready.");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
