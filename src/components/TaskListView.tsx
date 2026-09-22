"use client";

import React, { useState } from "react";
import { Task, User, Client } from "@/types";
import KanbanBoard from "./KanbanBoard";
import {
  Clock,
  Play,
  Pause,
  CheckCircle2,
  Calendar,
  RotateCw,
  Search,
  Filter,
  Flame,
  Check,
  X,
  RotateCcw,
  Tag,
  Building2,
  Edit3,
  Trash2,
  AlertTriangle,
  Plus,
  Kanban,
  LayoutList,
  CalendarDays,
  TrendingUp,
  Zap,
} from "lucide-react";
import { formatDuration } from "@/lib/formatters";
import { TaskDateFilterOption, matchesTaskDateFilter } from "@/lib/productivity";

interface TaskListViewProps {
  tasks: Task[];
  currentUser: User | null;
  allUsers?: User[];
  clients?: Client[];
  onSelectTask: (task: Task) => void;
  onAddNewTask?: () => void;
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (taskId: string) => Promise<void>;
  onTimerAction: (taskId: string, action: "start" | "hold" | "resume" | "stop" | "complete") => Promise<void>;
  onAdminApprove: (taskId: string) => Promise<void>;
  onAdminRevision?: (taskId: string) => Promise<void>;
  onTaskStatusChange?: (taskId: string, newEmployeeStatus: string, newAdminStatus?: string) => Promise<void>;
}

export default function TaskListView({
  tasks,
  currentUser,
  clients = [],
  onSelectTask,
  onAddNewTask,
  onEditTask,
  onDeleteTask,
  onTimerAction,
  onAdminApprove,
  onTaskStatusChange,
}: TaskListViewProps) {
  const [viewStyle, setViewStyle] = useState<"kanban" | "list">("kanban");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterClient, setFilterClient] = useState("ALL");
  const [filterPriority, setFilterPriority] = useState("ALL");
  const [filterRecurrence, setFilterRecurrence] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterDate, setFilterDate] = useState<TaskDateFilterOption>("TODAY");
  const [customDate, setCustomDate] = useState<string>("");

  const isTaskOverdue = (task: Task) => {
    if (!task.dueDate) return false;
    if (task.adminStatus === "FINAL_COMPLETED" || task.employeeStatus === "COMPLETED") return false;
    return new Date(task.dueDate).getTime() < Date.now();
  };

  const overdueTasksCount = tasks.filter(isTaskOverdue).length;

  const isFiltered =
    searchTerm.trim() !== "" ||
    filterClient !== "ALL" ||
    filterPriority !== "ALL" ||
    filterRecurrence !== "ALL" ||
    filterStatus !== "ALL" ||
    filterDate !== "TODAY";

  const handleClearFilters = () => {
    setSearchTerm("");
    setFilterClient("ALL");
    setFilterPriority("ALL");
    setFilterRecurrence("ALL");
    setFilterStatus("ALL");
    setFilterDate("TODAY");
    setCustomDate("");
  };

  const filteredTasks = tasks.filter((t) => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchDesc = t.description?.toLowerCase().includes(q);
      const matchClient =
        t.client?.name?.toLowerCase().includes(q) ||
        t.client?.company?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchClient) return false;
    }

    if (filterClient !== "ALL") {
      if (t.clientId !== filterClient) return false;
    }

    if (filterPriority !== "ALL" && t.priority !== filterPriority) return false;
    if (filterRecurrence !== "ALL" && t.recurrence !== filterRecurrence) return false;
    if (filterStatus !== "ALL") {
      if (filterStatus === "OVERDUE") return isTaskOverdue(t);
      if (filterStatus === "COMPLETED" && t.employeeStatus !== "COMPLETED" && t.adminStatus !== "FINAL_COMPLETED") return false;
      if (filterStatus === "IN_PROGRESS" && t.employeeStatus !== "IN_PROGRESS") return false;
      if (filterStatus === "ON_HOLD" && t.employeeStatus !== "ON_HOLD") return false;
      if (filterStatus === "TODO" && t.employeeStatus !== "TODO") return false;
    }

    if (!matchesTaskDateFilter(t, filterDate, customDate)) return false;

    return true;
  });

  // Productivity metrics for the current filtered view / date selection
  const totalFiltered = filteredTasks.length;
  const completedFiltered = filteredTasks.filter(
    (t) => t.employeeStatus === "COMPLETED" || t.adminStatus === "FINAL_COMPLETED"
  ).length;
  const inProgressFiltered = filteredTasks.filter(
    (t) => t.employeeStatus === "IN_PROGRESS"
  ).length;
  const onHoldFiltered = filteredTasks.filter((t) => t.employeeStatus === "ON_HOLD").length;
  const todoFiltered = filteredTasks.filter((t) => t.employeeStatus === "TODO").length;
  const completionRate = totalFiltered > 0 ? Math.round((completedFiltered / totalFiltered) * 100) : 0;
  const totalDurationSeconds = filteredTasks.reduce(
    (acc, t) => acc + (t.totalDurationSeconds || 0),
    0
  );

  // For Kanban Board: When viewing multi-day ranges (e.g. ALL or THIS_WEEK), deduplicate daily recurring tasks by parentRecurringId so only the latest instance appears in sprint columns
  const kanbanTasks = React.useMemo(() => {
    if (filterDate === "TODAY" || filterDate === "YESTERDAY") {
      return filteredTasks;
    }

    const recurringSeen = new Map<string, Task>();
    const result: Task[] = [];

    // Sort by dueDate descending, then createdAt descending so today/latest instance comes first
    const sorted = [...filteredTasks].sort((a, b) => {
      const timeA = new Date(a.dueDate || a.createdAt).getTime();
      const timeB = new Date(b.dueDate || b.createdAt).getTime();
      return timeB - timeA;
    });

    for (const t of sorted) {
      if (t.parentRecurringId && t.recurrence === "DAILY") {
        if (!recurringSeen.has(t.parentRecurringId)) {
          recurringSeen.set(t.parentRecurringId, t);
          result.push(t);
        }
      } else {
        result.push(t);
      }
    }

    return result;
  }, [filteredTasks, filterDate]);

  const getRowStyle = (task: Task) => {
    if (task.adminStatus === "FINAL_COMPLETED" || task.employeeStatus === "COMPLETED") {
      return "bg-emerald-50/70 hover:bg-emerald-100/80 text-emerald-950 font-medium";
    }
    if (isTaskOverdue(task)) {
      return "bg-rose-50/70 hover:bg-rose-100/80 text-rose-950 font-medium";
    }
    switch (task.employeeStatus) {
      case "IN_PROGRESS":
        return "bg-blue-50/80 hover:bg-blue-100/80 text-blue-950 font-medium";
      case "ON_HOLD":
        return "bg-amber-50/80 hover:bg-amber-100/80 text-amber-950 font-medium";
      case "TODO":
      default:
        return "bg-white hover:bg-slate-50 text-slate-900 font-medium";
    }
  };

  const getDateFilterLabel = () => {
    switch (filterDate) {
      case "TODAY":
        return "Today's Tasks & Productivity";
      case "YESTERDAY":
        return "Yesterday's Performance";
      case "THIS_WEEK":
        return "This Week's Overview";
      case "THIS_MONTH":
        return "This Month's Overview";
      case "CUSTOM":
        return customDate ? `Date: ${customDate}` : "Custom Date Range";
      default:
        return "Overall Workspace Productivity";
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden w-full space-y-4">
      {/* Toolbar: Search, Filters, View Switcher */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search tasks by title, description, or client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Date Filter Dropdown */}
          <div className="flex items-center gap-1.5 bg-white border border-indigo-200 rounded-xl px-2 py-1 shadow-2xs">
            <CalendarDays className="w-3.5 h-3.5 text-indigo-600" />
            <select
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value as TaskDateFilterOption)}
              className="text-xs bg-transparent text-indigo-950 font-bold focus:outline-none cursor-pointer py-1"
            >
              <option value="TODAY">⚡ Today</option>
              <option value="YESTERDAY">⏳ Yesterday</option>
              <option value="THIS_WEEK">📆 This Week</option>
              <option value="THIS_MONTH">🗓️ This Month</option>
              <option value="ALL">📅 All Dates</option>
              <option value="CUSTOM">🎯 Custom Date...</option>
            </select>
          </div>

          {/* Custom Date Picker (when Custom is selected) */}
          {filterDate === "CUSTOM" && (
            <input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="text-xs bg-white border border-indigo-300 rounded-xl px-2.5 py-1.5 text-indigo-950 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          )}

          <select
            value={filterClient}
            onChange={(e) => setFilterClient(e.target.value)}
            className="text-xs bg-white border border-cyan-300 rounded-xl px-3 py-2 text-cyan-950 font-bold focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            <option value="ALL">All Clients ({clients.length})</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.company || c.name}
              </option>
            ))}
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-700 font-medium focus:outline-none"
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-700 font-medium focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="OVERDUE">⚠️ Overdue ({overdueTasksCount})</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="COMPLETED">Completed</option>
          </select>

          {isFiltered && (
            <button
              onClick={handleClearFilters}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 hover:bg-rose-200 transition flex items-center space-x-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}

          {/* View Mode Toggle: Kanban vs List */}
          <div className="flex items-center bg-slate-200/70 p-1 rounded-xl border border-slate-300">
            <button
              onClick={() => setViewStyle("kanban")}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewStyle === "kanban"
                  ? "bg-white text-blue-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewStyle("list")}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewStyle === "list"
                  ? "bg-white text-blue-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
          </div>

          {/* Add Task Button */}
          {onAddNewTask && (
            <button
              onClick={onAddNewTask}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition shadow-sm flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Task</span>
            </button>
          )}
        </div>
      </div>

      {/* Date Productivity Ribbon */}
      <div className="mx-4 p-3.5 rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50/70 via-blue-50/50 to-slate-50 flex flex-wrap items-center justify-between gap-4">
        {/* Left: Indicator & Quick Pills */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span>{getDateFilterLabel()}</span>
                {filterDate === "TODAY" && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse">
                    Live Today
                  </span>
                )}
                {filterDate === "YESTERDAY" && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                    Yesterday
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                {totalFiltered === 0 ? "No tasks matching current filter" : `${completedFiltered} of ${totalFiltered} tasks completed`}
              </div>
            </div>
          </div>

          {/* Quick Date Shortcuts */}
          <div className="flex items-center gap-1 bg-white/80 p-1 rounded-lg border border-slate-200 text-[11px]">
            <button
              onClick={() => setFilterDate("TODAY")}
              className={`px-2 py-0.5 rounded font-bold transition flex items-center gap-1 ${
                filterDate === "TODAY" ? "bg-indigo-600 text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>Today</span>
              {filterDate === "TODAY" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>}
            </button>
            <button
              onClick={() => setFilterDate("YESTERDAY")}
              className={`px-2 py-0.5 rounded font-bold transition ${
                filterDate === "YESTERDAY" ? "bg-indigo-600 text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Yesterday
            </button>
            <button
              onClick={() => setFilterDate("THIS_WEEK")}
              className={`px-2 py-0.5 rounded font-bold transition ${
                filterDate === "THIS_WEEK" ? "bg-indigo-600 text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setFilterDate("ALL")}
              className={`px-2 py-0.5 rounded font-bold transition ${
                filterDate === "ALL" ? "bg-indigo-600 text-white shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All
            </button>
          </div>
        </div>

        {/* Right: Productivity KPI Cards & Progress Bar */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* Progress Bar & Rate */}
          <div className="flex items-center gap-2.5 min-w-[150px]">
            <div className="flex-1 bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  completionRate >= 80
                    ? "bg-emerald-500"
                    : completionRate >= 50
                    ? "bg-blue-500"
                    : completionRate > 0
                    ? "bg-amber-500"
                    : "bg-slate-300"
                }`}
                style={{ width: `${completionRate}%` }}
              />
            </div>
            <div className="text-right">
              <span className="text-xs font-black text-slate-900">{completionRate}%</span>
              <span className="text-[10px] text-slate-400 block -mt-1">Rate</span>
            </div>
          </div>

          {/* Metric Chips */}
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            <div className="px-2.5 py-1 bg-white rounded-lg border border-slate-200 text-slate-700 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{completedFiltered} Done</span>
            </div>
            <div className="px-2.5 py-1 bg-white rounded-lg border border-slate-200 text-slate-700 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>{inProgressFiltered} In Progress</span>
            </div>
            <div className="px-2.5 py-1 bg-indigo-100/80 rounded-lg border border-indigo-200 text-indigo-900 flex items-center gap-1 font-bold">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-700" />
              <span>{formatDuration(totalDurationSeconds)} Logged</span>
            </div>
          </div>
        </div>
      </div>

      {/* Render based on selected View Mode */}
      {viewStyle === "kanban" ? (
        <div className="p-4 bg-slate-50/40">
          <KanbanBoard
            tasks={kanbanTasks}
            currentUser={currentUser}
            onSelectTask={onSelectTask}
            onTimerAction={onTimerAction}
            onAdminApprove={onAdminApprove}
            onOpenCreateModal={onAddNewTask || (() => {})}
            onTaskStatusChange={onTaskStatusChange}
          />
        </div>
      ) : (
        /* Detailed List Table View */
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Task Details</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Time Spent</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    No tasks match the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => {
                  const overdue = isTaskOverdue(task);
                  const isTimerRunning = task.isTimerRunning;

                  return (
                    <tr
                      key={task.id}
                      onClick={() => onSelectTask(task)}
                      className={`cursor-pointer transition ${getRowStyle(task)}`}
                    >
                      <td className="py-3 px-4 max-w-sm">
                        <div className="font-bold text-slate-900 text-xs line-clamp-1">
                          {task.title}
                        </div>
                        {task.description && (
                          <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                            {task.description}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {task.client ? (
                          <span className="inline-flex items-center gap-1 font-bold text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded-md border border-cyan-200 text-[11px]">
                            <Building2 className="w-3 h-3" />
                            <span>{task.client.company || task.client.name}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Personal</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                            task.priority === "URGENT"
                              ? "bg-rose-100 text-rose-800"
                              : task.priority === "HIGH"
                              ? "bg-amber-100 text-amber-800"
                              : task.priority === "MEDIUM"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {task.priority}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-700">
                          {formatDuration(task.totalDurationSeconds || 0)}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {task.dueDate ? (
                          <span
                            className={`font-medium ${overdue ? "text-rose-600 font-bold" : "text-slate-600"}`}
                          >
                            {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">-</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold text-[11px] uppercase">
                          {task.employeeStatus}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end space-x-1.5">
                          {isTimerRunning ? (
                            <button
                              onClick={() => onTimerAction(task.id, "hold")}
                              className="bg-amber-500 hover:bg-amber-600 text-white px-2 py-1 rounded-lg text-xs font-bold"
                            >
                              Pause
                            </button>
                          ) : (
                            <button
                              onClick={() => onTimerAction(task.id, "start")}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded-lg text-xs font-bold"
                            >
                              Start
                            </button>
                          )}
                          {onEditTask && (
                            <button
                              onClick={() => onEditTask(task)}
                              className="p-1 text-slate-400 hover:text-blue-600 rounded"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {onDeleteTask && (
                            <button
                              onClick={() => onDeleteTask(task.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
