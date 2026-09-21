"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { User, Task, Client, Project, ProductIdea, LearningItem } from "@/types";
import { computeDailyProductivity } from "@/lib/productivity";
import Navbar from "@/components/Navbar";
import LoginView from "@/components/LoginView";
import TaskListView from "@/components/TaskListView";
import ClientsView from "@/components/ClientsView";
import ProjectsView from "@/components/ProjectsView";
import RecurringTasksView from "@/components/RecurringTasksView";
import ProductIdeasView from "@/components/ProductIdeasView";
import LearningHubView from "@/components/LearningHubView";
import TaskModal from "@/components/TaskModal";
import TaskDetailDrawer from "@/components/TaskDetailDrawer";
import SettingsModal from "@/components/SettingsModal";

export default function Home() {
  // Authenticated user session state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  // Check saved session on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("task_studio_user");
      if (stored) {
        const user = JSON.parse(stored);
        if (user && user.id) {
          setCurrentUser(user);
        }
      }
    } catch (e) {
      console.error("Session restore error:", e);
    } finally {
      setAuthChecking(false);
    }
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    try {
      localStorage.setItem("task_studio_user", JSON.stringify(user));
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    if (confirm("Are you sure you want to sign out?")) {
      setCurrentUser(null);
      try {
        localStorage.removeItem("task_studio_user");
      } catch (e) {
        console.error(e);
      }
    }
  };

  const [activeTab, setActiveTab] = useState<string>("tasks");
  const [loading, setLoading] = useState(true);

  // Data States
  const [tasks, setTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [ideas, setIdeas] = useState<ProductIdea[]>([]);
  const [learningItems, setLearningItems] = useState<LearningItem[]>([]);

  // Modals & Drawers
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [taskModalInitialClientId, setTaskModalInitialClientId] = useState<string>("");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const selectedTaskIdRef = useRef<string | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Task Selection Handlers
  const handleSelectTask = useCallback((task: Task) => {
    selectedTaskIdRef.current = task.id;
    setSelectedTask(task);
  }, []);

  const handleCloseTaskDrawer = useCallback(() => {
    selectedTaskIdRef.current = null;
    setSelectedTask(null);
  }, []);

  // Fetch Tasks
  const fetchTasks = useCallback(async () => {
    try {
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata";
      const res = await fetch("/api/tasks", {
        headers: { "x-timezone": userTimezone },
      });
      const data = await res.json();
      if (res.ok) {
        const list: Task[] = data.tasks || [];
        setTasks(list);
        if (selectedTaskIdRef.current) {
          const updated = list.find((t) => t.id === selectedTaskIdRef.current);
          if (updated) setSelectedTask(updated);
        }
      }
    } catch (e) {
      console.error("fetchTasks error:", e);
    }
  }, []);

  // Auto-refresh when tab gains focus, visibility changes, or day rolls over
  useEffect(() => {
    let lastDateStr = new Date().toDateString();

    const checkAndRefresh = () => {
      const currentDateStr = new Date().toDateString();
      if (document.visibilityState === "visible") {
        lastDateStr = currentDateStr;
        fetchTasks();
      }
    };

    window.addEventListener("focus", checkAndRefresh);
    document.addEventListener("visibilitychange", checkAndRefresh);

    // Periodic check every 5 minutes in case the tab is kept open overnight
    const interval = setInterval(() => {
      const currentDateStr = new Date().toDateString();
      if (currentDateStr !== lastDateStr) {
        lastDateStr = currentDateStr;
        fetchTasks();
      }
    }, 5 * 60 * 1000);

    return () => {
      window.removeEventListener("focus", checkAndRefresh);
      document.removeEventListener("visibilitychange", checkAndRefresh);
      clearInterval(interval);
    };
  }, [fetchTasks]);

  // Fetch Clients
  const fetchClients = useCallback(async () => {
    try {
      const res = await fetch("/api/clients");
      const data = await res.json();
      if (res.ok) setClients(data.clients || []);
    } catch (e) {
      console.error("fetchClients error:", e);
    }
  }, []);

  // Fetch Projects
  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      if (res.ok) setProjects(data.projects || []);
    } catch (e) {
      console.error("fetchProjects error:", e);
    }
  }, []);

  // Fetch Product Ideas
  const fetchIdeas = useCallback(async () => {
    try {
      const res = await fetch("/api/ideas");
      const data = await res.json();
      if (res.ok) setIdeas(data.ideas || []);
    } catch (e) {
      console.error("fetchIdeas error:", e);
    }
  }, []);

  // Fetch Learning Hub items
  const fetchLearning = useCallback(async () => {
    try {
      const res = await fetch("/api/learning");
      const data = await res.json();
      if (res.ok) setLearningItems(data.items || []);
    } catch (e) {
      console.error("fetchLearning error:", e);
    }
  }, []);

  // Initial Load
  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      await Promise.all([
        fetchTasks(),
        fetchClients(),
        fetchProjects(),
        fetchIdeas(),
        fetchLearning(),
      ]);
      setLoading(false);
    }
    loadAll();
  }, [fetchTasks, fetchClients, fetchProjects, fetchIdeas, fetchLearning]);

  // Timer Action handler
  const handleTimerAction = async (
    taskId: string,
    action: "start" | "hold" | "resume" | "stop" | "complete"
  ) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/tasks/${taskId}/timer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, userId: currentUser.id }),
      });
      if (res.ok) await fetchTasks();
    } catch (e) {
      console.error(e);
    }
  };

  // Task Status Change handler (for Drag and Drop Kanban & quick status toggles)
  const handleTaskStatusChange = async (
    taskId: string,
    newEmployeeStatus: string,
    newAdminStatus?: string
  ) => {
    if (!currentUser) return;
    try {
      // Optimistic update
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === taskId) {
            return {
              ...t,
              employeeStatus: newEmployeeStatus as any,
              adminStatus: (newAdminStatus || t.adminStatus) as any,
              isTimerRunning: newEmployeeStatus === "IN_PROGRESS" ? true : false,
            };
          }
          return t;
        })
      );

      const res = await fetch(`/api/tasks/${taskId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          role: currentUser.role,
          employeeStatus: newEmployeeStatus,
          adminStatus: newAdminStatus,
        }),
      });
      if (!res.ok) {
        console.error("handleTaskStatusChange failed:", await res.text());
      }
      await fetchTasks();
    } catch (e) {
      console.error("handleTaskStatusChange error:", e);
      await fetchTasks();
    }
  };

  // Admin Approve handler
  const handleAdminApprove = async (taskId: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/tasks/${taskId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          role: currentUser.role,
          adminStatus: "FINAL_COMPLETED",
        }),
      });
      if (res.ok) await fetchTasks();
    } catch (e) {
      console.error(e);
    }
  };

  // Delete Task
  const handleDeleteTask = async (taskId: string) => {
    if (!currentUser) return;
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      const res = await fetch(`/api/tasks/${taskId}?userId=${currentUser.id}&role=${currentUser.role}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSelectedTask(null);
        selectedTaskIdRef.current = null;
        await fetchTasks();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Delete Product Idea (Instant Optimistic UI Deletion <50ms)
  const handleDeleteIdea = async (ideaId: string) => {
    setIdeas((prev) => prev.filter((i) => i.id !== ideaId));
    try {
      const res = await fetch(`/api/ideas/${ideaId}`, { method: "DELETE" });
      if (!res.ok) {
        await fetchIdeas();
      }
    } catch (err) {
      console.error("Delete idea error:", err);
      await fetchIdeas();
    }
  };

  // Delete Learning Resource (Instant Optimistic UI Deletion <50ms)
  const handleDeleteLearningItem = async (itemId: string) => {
    setLearningItems((prev) => prev.filter((i) => i.id !== itemId));
    try {
      const res = await fetch(`/api/learning/${itemId}`, { method: "DELETE" });
      if (!res.ok) {
        await fetchLearning();
      }
    } catch (err) {
      console.error("Delete learning item error:", err);
      await fetchLearning();
    }
  };

  // Derived KPI Metrics
  const activeRunningTask = tasks.find((t) => t.isTimerRunning);
  const pendingTasksCount = tasks.filter(
    (t) => t.employeeStatus !== "COMPLETED" && t.adminStatus !== "FINAL_COMPLETED"
  ).length;

  const totalPipelineRevenue = projects
    .filter((p) => p.isApproved && p.approvedAmount)
    .reduce((acc, p) => acc + (p.approvedAmount || 0), 0);

  const learningMasteredCount = learningItems.filter((i) => i.status === "COMPLETED").length;

  // Daily Productivity computation (Today vs Yesterday)
  const todayProductivity = useMemo(() => {
    return computeDailyProductivity(tasks, new Date());
  }, [tasks]);

  const yesterdayProductivity = useMemo(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return computeDailyProductivity(tasks, yesterday);
  }, [tasks]);

  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-slate-400">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <span className="font-bold text-xs text-slate-300">
          Verifying security credentials...
        </span>
      </div>
    );
  }

  // If not authenticated -> Display Login Flow
  if (!currentUser) {
    return <LoginView onLogin={handleLogin} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-500">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <span className="font-extrabold text-sm text-slate-700">
          Loading Harsh Studio Personal Workspace...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col w-full">
      {/* Top Navbar with animated productivity & active metrics */}
      <Navbar
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeRunningTask={activeRunningTask}
        onOpenTaskModal={() => {
          setTaskToEdit(null);
          setTaskModalInitialClientId("");
          setIsTaskModalOpen(true);
        }}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        projectsCount={projects.length}
        pipelineValue={totalPipelineRevenue}
        pendingTasksCount={pendingTasksCount}
        learningMasteredCount={learningMasteredCount}
        todayProductivity={todayProductivity}
        yesterdayProductivity={yesterdayProductivity}
        onLogout={handleLogout}
      />

      {/* Main Workspace Area */}
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* 1. Tasks & Kanban Board */}
        {activeTab === "tasks" && (
          <TaskListView
            tasks={tasks}
            currentUser={currentUser}
            clients={clients}
            onSelectTask={handleSelectTask}
            onAddNewTask={() => {
              setTaskToEdit(null);
              setTaskModalInitialClientId("");
              setIsTaskModalOpen(true);
            }}
            onEditTask={(task) => {
              setTaskToEdit(task);
              setIsTaskModalOpen(true);
            }}
            onDeleteTask={handleDeleteTask}
            onTimerAction={handleTimerAction}
            onAdminApprove={handleAdminApprove}
            onTaskStatusChange={handleTaskStatusChange}
          />
        )}

        {/* 2. Client Accounts */}
        {activeTab === "clients" && (
          <ClientsView
            clients={clients}
            currentUser={currentUser}
            onClientCreated={() => {
              fetchClients();
              fetchProjects();
            }}
            onOpenCreateTaskForClient={(clientId) => {
              setTaskToEdit(null);
              setTaskModalInitialClientId(clientId);
              setIsTaskModalOpen(true);
            }}
          />
        )}

        {/* 3. Ongoing Projects & Client Discussions & SOW */}
        {activeTab === "projects" && (
          <ProjectsView
            projects={projects}
            clients={clients}
            onRefresh={() => {
              fetchProjects();
              fetchClients();
            }}
          />
        )}

        {/* 4. Recurring Tasks */}
        {activeTab === "recurring" && (
          <RecurringTasksView
            currentUser={currentUser}
            onOpenCreateModal={() => {
              setTaskToEdit(null);
              setTaskModalInitialClientId("");
              setIsTaskModalOpen(true);
            }}
            onRefreshTasks={fetchTasks}
          />
        )}

        {/* 5. Product Ideas & Execution Timeline */}
        {activeTab === "ideas" && (
          <ProductIdeasView
            ideas={ideas}
            onRefresh={() => fetchIdeas()}
            onDeleteIdea={handleDeleteIdea}
          />
        )}

        {/* 6. Learning Hub & Misc (AI, Flutter, Backend, etc.) */}
        {activeTab === "learning" && (
          <LearningHubView
            items={learningItems}
            onRefresh={() => fetchLearning()}
            onDeleteItem={handleDeleteLearningItem}
          />
        )}
      </main>

      {/* Task Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        taskToEdit={taskToEdit}
        onClose={() => {
          setIsTaskModalOpen(false);
          setTaskToEdit(null);
          setTaskModalInitialClientId("");
        }}
        currentUser={currentUser}
        allUsers={[currentUser]}
        clients={clients}
        initialClientId={taskModalInitialClientId}
        onTaskCreated={() => {
          setTaskToEdit(null);
          fetchTasks();
          fetchClients();
        }}
        onRefreshClients={() => fetchClients()}
      />

      {/* Task Detail Drawer */}
      <TaskDetailDrawer
        task={selectedTask}
        onClose={handleCloseTaskDrawer}
        currentUser={currentUser}
        allUsers={[currentUser]}
        clients={clients}
        onTimerAction={handleTimerAction}
        onAdminApprove={handleAdminApprove}
        onAdminRevision={() => Promise.resolve()}
        onTaskUpdated={() => {
          fetchTasks();
          fetchClients();
        }}
        onDeleteTask={handleDeleteTask}
        onEditTask={(task) => {
          setTaskToEdit(task);
          setIsTaskModalOpen(true);
        }}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        currentUser={currentUser}
      />
    </div>
  );
}
