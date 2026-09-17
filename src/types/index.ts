export type Role = "ADMIN" | "EMPLOYEE";

export type RecurrenceType =
  | "ONE_TIME"
  | "DAILY"
  | "WEEKLY"
  | "MONTHLY"
  | "QUARTERLY"
  | "HALF_YEARLY"
  | "YEARLY";

export type PriorityType = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type EmployeeStatusType = "TODO" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED";

export type AdminStatusType =
  | "NOT_SUBMITTED"
  | "PENDING_REVIEW"
  | "FINAL_COMPLETED"
  | "REVISION_REQUESTED";

export type AttendanceStatusType = "PRESENT" | "ON_BREAK" | "CHECKED_OUT" | "ABSENT_LEAVE";

export interface User {
  id: string;
  userId?: string | null;
  name: string;
  email: string;
  role: Role;
  designation?: string | null;
  avatar?: string | null;
  createdAt: string;
}

export interface TimeLog {
  id: string;
  taskId: string;
  userId: string;
  startTime: string;
  endTime?: string | null;
  durationSeconds: number;
  isRunning: boolean;
  note?: string | null;
  user?: User;
}

export type ClientStatusType = "ACTIVE" | "PROSPECT" | "INACTIVE";

export interface Client {
  id: string;
  name: string;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
  status?: ClientStatusType;
  createdAt: string;
  updatedAt: string;
  projects?: {
    id: string;
    title: string;
    status: string;
    approvedAmount?: number | null;
  }[];
  _count?: {
    tasks: number;
    projects?: number;
  };
}

export interface TaskAssigneeItem {
  id: string;
  taskId: string;
  userId: string;
  user?: User;
}

export interface TaskClientItem {
  id: string;
  taskId: string;
  clientId: string;
  client?: Client;
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  recurrence: RecurrenceType;
  monthlyDay?: number | null;
  weeklyDay?: string | null;
  startDate?: string | null;
  dueDate?: string | null;
  priority: PriorityType;
  employeeStatus: EmployeeStatusType;
  adminStatus: AdminStatusType;
  totalDurationSeconds: number;
  isTimerRunning: boolean;
  currentTimerStartedAt?: string | null;
  billableHours?: number | null;
  isRecurringTemplate: boolean;
  parentRecurringId?: string | null;
  lastGeneratedDate?: string | null;
  assignedToId?: string | null;
  assignedTo?: User | null;
  assignees?: TaskAssigneeItem[];
  clientId?: string | null;
  client?: Client | null;
  taskClients?: TaskClientItem[];
  projectId?: string | null;
  project?: Project | null;
  createdById: string;
  createdBy?: User | null;
  timeLogs?: TimeLog[];
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceRecord {
  id?: string;
  userId: string;
  date: string;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  workDurationSeconds: number;
  breakDurationSeconds?: number;
  isOnBreak?: boolean;
  currentBreakStartedAt?: string | null;
  lastCheckInTime?: string | null;
  sessionBreakDurationSeconds?: number;
  status: AttendanceStatusType;
  notes?: string | null;
}

export interface AttendanceRosterItem {
  date?: string;
  employee: User;
  record: AttendanceRecord | null;
  status: AttendanceStatusType;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  workDurationSeconds: number;
  breakDurationSeconds?: number;
  isOnBreak?: boolean;
  currentBreakStartedAt?: string | null;
  lastCheckInTime?: string | null;
  sessionBreakDurationSeconds?: number;
}

export interface TaskReportItem {
  id: string;
  title: string;
  recurrence: string;
  priority: string;
  employeeStatus: string;
  adminStatus: string;
  durationSeconds: number;
  billableHours?: number | null;
}

export interface EmployeeDailyReportData {
  employee: {
    id: string;
    name: string;
    email: string;
    designation?: string | null;
  };
  date: string;
  attendance: {
    status: string;
    checkInTime?: string | null;
    checkOutTime?: string | null;
    workDurationSeconds: number;
    breakDurationSeconds?: number;
    isOnBreak?: boolean;
  };
  tasks: TaskReportItem[];
  shiftDurationSeconds: number;
  totalActiveSeconds: number;
  totalTasksCompleted: number;
  totalTasksPending: number;
}

export type LeaveType = "CASUAL" | "SICK" | "EARNED" | "UNPAID" | "HALF_DAY";
export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface LeaveRequest {
  id: string;
  userId: string;
  user?: User;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  daysCount: number;
  reason: string;
  status: LeaveStatus;
  reviewedById?: string | null;
  reviewedBy?: User | null;
  reviewNotes?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveStats {
  totalLeaves: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  onLeaveTodayCount: number;
}

export type ProjectStatusType = "INQUIRY" | "ONBOARD" | "ONGOING" | "HOLD" | "COMPLETED";

export interface ProjectDiscussion {
  id: string;
  projectId: string;
  title: string;
  meetingDate: string;
  discussionNotes: string;
  clientFeedback?: string | null;
  actionItems?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectAttachment {
  id: string;
  projectId: string;
  name: string;
  url: string;
  fileType: "figma" | "github" | "pdf" | "doc" | "image" | "link";
  fileSize?: string | null;
  createdAt: string;
}

export interface Project {
  id: string;
  title: string;
  clientId: string;
  client?: Client;
  status: ProjectStatusType;
  scopeOfWork?: string | null;
  initialEstimation?: string | null;
  approvedAmount?: number | null;
  currency: string;
  approvedTimeframe?: string | null;
  startDate?: string | null;
  targetDeliveryDate?: string | null;
  followUpDate?: string | null;
  followUpNote?: string | null;
  isApproved: boolean;
  approvedAt?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  discussions?: ProjectDiscussion[];
  attachments?: ProjectAttachment[];
  tasks?: Task[];
  _count?: {
    discussions: number;
    attachments?: number;
    tasks: number;
  };
}

export interface DailyProductivityStats {
  date: string; // YYYY-MM-DD
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  onHoldTasks: number;
  todoTasks: number;
  completionRate: number; // 0 - 100%
  totalHoursLogged: number; // e.g. 4.5
  totalSecondsLogged: number;
}

export type ProductIdeaStatus = "BRAINSTORMING" | "VALIDATING" | "PLANNING" | "IN_EXECUTION" | "LAUNCHED" | "ON_HOLD";
export type ExecutionPhaseStatus = "PLANNED" | "IN_PROGRESS" | "COMPLETED";

export interface ProductExecutionPhase {
  id: string;
  ideaId: string;
  title: string;
  description?: string | null;
  order: number;
  startDate?: string | null;
  endDate?: string | null;
  status: ExecutionPhaseStatus;
  deliverables?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductIdea {
  id: string;
  title: string;
  tagline?: string | null;
  category: string;
  problemStatement?: string | null;
  targetAudience?: string | null;
  valueProposition?: string | null;
  status: ProductIdeaStatus;
  priority: PriorityType;
  targetLaunchDate?: string | null;
  estimatedBudget?: number | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  phases?: ProductExecutionPhase[];
}

export type LearningResourceType = "ARTICLE" | "VIDEO" | "REPO" | "COURSE" | "DOCS" | "BOOK";
export type LearningStatus = "TO_LEARN" | "IN_PROGRESS" | "COMPLETED" | "BOOKMARKED";

export interface LearningItem {
  id: string;
  title: string;
  subject: string; // "AI" | "Flutter" | "Backend" | "Frontend" | "System Design" | "DevOps" etc.
  url?: string | null;
  resourceType: LearningResourceType;
  status: LearningStatus;
  notes?: string | null;
  isFavorite: boolean;
  tags?: string | null;
  createdAt: string;
  updatedAt: string;
}

