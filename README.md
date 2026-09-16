# 💻 Task Analysis Studio

> **Personal Engineering & Consulting Workspace**  
> A sleek, high-performance web platform built for independent software engineers and technical consultants to manage sprint tasks, track client project scopes & estimations, incubate product ideas, and curate engineering learning.

---

## 🚀 Key Features

### 1. Dual-Mode Drag & Drop Kanban & Sprint Board
- **Interactive Drag-and-Drop**: Native HTML5 drag-and-drop between sprint status columns: `To Do`, `In Progress`, `On Hold`, and `Completed`.
- **Integrated Live Work Timers**: Automatically tracks billable engineering hours when dragging tasks to `In Progress`.
- **Dual View Modes**: Seamless 1-click toggle between **Kanban Board** and **Detailed List Table View**.

### 2. Client Project Pipeline & Scope of Work (SOW)
- **Deal Pipeline Kanban**: Drag projects across `Onboard & Scoping`, `Ongoing Delivery`, `On Hold`, and `Delivered & Shipped`.
- **Scope of Work (SOW) Viewer**: Present architecture, tech stacks, milestones, and deliverables cleanly to clients.
- **Rich Attachments**: Direct linking and uploads for **Figma prototypes**, **GitHub repositories/PRs**, **PDF specs**, and **UI mockups** with strict security URL sanitization.
- **Approved Estimations**: Track billable hours, client-approved milestone budgets, and agreed timeframe dates.
- **Meeting Discussions Drawer**: Log client meeting minutes, feedback, and action items directly on each project card.

### 3. Product Incubator & Multi-Phase Timeline
- **Roadmap Engine**: Track SaaS and mobile product ideas with category, priority, problem statements, and value propositions.
- **Visual Milestone Timeline**: Interactive Gantt-style progress ribbon showing multi-phase execution (Research ➔ MVP ➔ Beta ➔ Launch).

### 4. Curated Engineering Learning Hub
- **Subject-Based Filtering**: Organize learning resources across core domains:
  - 🤖 **AI & LLMs**
  - 📱 **Flutter & Mobile**
  - ⚙️ **Backend & Cloud Architecture**
  - 🌐 **Frontend & Web**
  - 🏛️ **System Design**
- **Resource Management**: Bookmark articles, documentation, videos, repositories, and courses with study progress tracking.

---

## 🔒 Security Architecture

Hardened against common web application vulnerabilities:
- **Timing-Safe PBKDF2 SHA-512**: Passwords are cryptographically hashed using 100,000 PBKDF2 iterations with unique random salt, verified using `crypto.timingSafeEqual` to prevent timing attacks.
- **Strict HTTP Security Headers**: Configured in `next.config.mjs` (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, `X-XSS-Protection`).
- **Input Sanitization & Protocol Validation**: Restricts attachment and external URLs strictly to `http:`, `https:`, and `mailto:` (blocking `javascript:` and protocol injection XSS).
- **File Upload Guards**: 5MB ceiling verification and executable file extension blocking.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, React 18, TypeScript)
- **Database ORM**: [Prisma ORM](https://www.prisma.io/) (SQLite for local zero-latency development, PostgreSQL for cloud deployment)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with custom status gradient themes
- **Icons**: [Lucide React](https://lucide.dev/)
- **Date Handling**: [date-fns](https://date-fns.org/)

---

## 💻 Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/harsuu942/Taskanalysis.git
   cd Taskanalysis
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up local environment**:
   ```bash
   cp .env.example .env
   ```

4. **Initialize local SQLite database**:
   ```bash
   npx prisma db push
   node scripts/set_owner_password.mjs
   ```

5. **Start the development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ☁️ Deploying to Vercel

The application is pre-configured for seamless zero-config deployment on **[Vercel](https://vercel.com/)**.

### Step 1: Import Project on Vercel
1. Log in to [Vercel Dashboard](https://vercel.com/).
2. Click **Add New...** ➔ **Project**.
3. Select the GitHub repository `harsuu942/Taskanalysis`.

### Step 2: Configure Supabase Database & Storage
In your [Supabase Dashboard](https://supabase.com/dashboard):

1. **Database Connection (Session Pooler & Direct)**:
   - Go to **Project Settings** ➔ **Database** ➔ **Connection string**.
   - Copy the **Session pooler** (Transaction Mode, Port `6543`) connection string and add it to Vercel **Environment Variables**:
     ```env
     DATABASE_URL="postgresql://postgres.[project-ref]:[your-db-password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
     ```
   - (Optional) Copy the **Direct connection** (Port `5432`) as `DIRECT_URL`:
     ```env
     DIRECT_URL="postgresql://postgres:[your-db-password]@db.[project-ref].supabase.co:5432/postgres"
     ```

2. **Storage Credentials (CDN Attachments & Deliverables)**:
   - Go to **Project Settings** ➔ **API**.
   - Add your Supabase URL and API keys to Vercel **Environment Variables**:
     ```env
     NEXT_PUBLIC_SUPABASE_URL="https://[project-ref].supabase.co"
     NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
     SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
     ```
   - Storage uploads in the Scope of Work modal will automatically create and use the `project-attachments` public bucket!

### Step 3: Deploy
- The build command will automatically run:
  ```bash
  npm run vercel-build
  ```
- `scripts/prepare-env.mjs` will auto-detect the Supabase connection, automatically switch the Prisma provider to `postgresql`, generate the Prisma client, and compile Next.js.
- Your studio will be live with a production HTTPS URL!

---

## 📜 License
MIT License. Built for personal consulting and engineering productivity.
