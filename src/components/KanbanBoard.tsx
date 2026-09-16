"use client";

import React, { useState } from "react";
import { Task, User } from "@/types";
import {
  Play,
  Pause,
  CheckCircle2,
  Clock,
  RotateCw,
  Flame,
  Check,
  Plus,
  Calendar,
  Building2,
  Code2,
  Bug,
  Sparkles,
  Layers,
  Terminal,
  Cpu,
  GripVertical,
} from "lucide-react";
import { formatDuration } from "@/lib/formatters";

interface KanbanBoardProps {
  tasks: Task[];
  currentUser: User | null;
  onSelectTask: (task: Task) => void;
  onTimerAction: (taskId: string, action: "start" | "hold" | "resume" | "stop" | "complete") => Promise<void>;
  onAdminApprove: (taskId: string) => Promise<void>;
  onOpenCreateModal: () => void;
  onTaskStatusChange?: (taskId: string, newEmployeeStatus: string, newAdminStatus?: string) => Promise<void>;
}

export default function KanbanBoard({
  tasks,
  currentUser,
  onSelectTask,
  onTimerAction,
  onAdminApprove,
  onOpenCreateModal,
  onTaskStatusChange,
}: KanbanBoardProps) {
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  // Filter tasks into 4 software engineering columns
  const todoTasks = tasks.filter(
    (t) => t.employeeStatus === "TODO" && t.adminStatus !== "FINAL_COMPLETED"
  );
  const inProgressTasks = tasks.filter(
    (t) => t.employeeStatus === "IN_PROGRESS" && t.adminStatus !== "FINAL_COMPLETED"
  );
  const onHoldTasks = tasks.filter(
    (t) => t.employeeStatus === "ON_HOLD" && t.adminStatus !== "FINAL_COMPLETED"
  );
  const completedTasks = tasks.filter(
    (t) => t.employeeStatus === "COMPLETED" || t.adminStatus === "FINAL_COMPLETED"
  );

  const columns = [
    {
      id: "TODO",
      title: "To Do / Backlog",
      count: todoTasks.length,
      tasks: todoTasks,
      columnBg: "bg-slate-100/70 border border-slate-200/90",
      headerBg: "bg-slate-200/50 border-b border-slate-200",
      cardStyle: "bg-white hover:bg-slate-50/90 border border-slate-200/90 shadow-2xs hover:shadow-md text-slate-900",
      bgBadge: "bg-slate-200 text-slate-700 border border-slate-300 font-extrabold",
      description: "Sprint backlog & upcoming features",
      symbol: <Terminal className="w-3.5 h-3.5 text-slate-600" />,
    },
    {
      id: "IN_PROGRESS",
      title: "In Progress / Dev",
      count: inProgressTasks.length,
      tasks: inProgressTasks,
      columnBg: "bg-blue-50/40 border border-blue-200/70",
      headerBg: "bg-blue-100/50 border-b border-blue-200/80",
      cardStyle: "bg-gradient-to-b from-blue-50/95 to-blue-100/60 hover:from-blue-100/80 hover:to-blue-100 border border-blue-300/80 shadow-2xs hover:shadow-md text-blue-950 ring-1 ring-blue-200/40",
      bgBadge: "bg-blue-200 text-blue-900 border border-blue-300 font-extrabold",
      description: "Active coding & sprint delivery",
      symbol: <Code2 className="w-3.5 h-3.5 text-blue-600" />,
    },
    {
      id: "ON_HOLD",
      title: "On Hold / Blocked",
      count: onHoldTasks.length,
      tasks: onHoldTasks,
      columnBg: "bg-amber-50/40 border border-amber-200/70",
      headerBg: "bg-amber-100/50 border-b border-amber-200/80",
      cardStyle: "bg-gradient-to-b from-amber-50/95 to-amber-100/60 hover:from-amber-100/80 hover:to-amber-100 border border-amber-300/80 shadow-2xs hover:shadow-md text-amber-950 ring-1 ring-amber-200/40",
      bgBadge: "bg-amber-200 text-amber-900 border border-amber-300 font-extrabold",
      description: "Awaiting PR review, assets or specs",
      symbol: <Cpu className="w-3.5 h-3.5 text-amber-600" />,
    },
    {
      id: "COMPLETED",
      title: "Completed / Shipped",
      count: completedTasks.length,
      tasks: completedTasks,
      columnBg: "bg-emerald-50/40 border border-emerald-200/70",
      headerBg: "bg-emerald-100/50 border-b border-emerald-200/80",
      cardStyle: "bg-gradient-to-b from-emerald-50/95 to-emerald-100/60 hover:from-emerald-100/80 hover:to-emerald-100 border border-emerald-300/80 shadow-2xs hover:shadow-md text-emerald-950 ring-1 ring-emerald-200/40",
      bgBadge: "bg-emerald-200 text-emerald-900 border border-emerald-300 font-extrabold",
      description: "Merged, tested & delivered",
      symbol: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
    },
  ];

  // Drag Handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("text/plain", taskId);
    e.dataTransfer.effectAllowed = "move";
    setDraggingTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverColumn !== columnId) {
      setDragOverColumn(columnId);
    }
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    setDragOverColumn(null);
    const taskId = e.dataTransfer.getData("text/plain");
    setDraggingTaskId(null);

    if (!taskId) return;

    if (onTaskStatusChange) {
      const adminStatus = targetColumnId === "COMPLETED" ? "FINAL_COMPLETED" : "NOT_SUBMITTED";
      await onTaskStatusChange(taskId, targetColumnId, adminStatus);
    } else {
      if (targetColumnId === "IN_PROGRESS") {
        await onTimerAction(taskId, "start");
      } else if (targetColumnId === "ON_HOLD") {
        await onTimerAction(taskId, "hold");
      } else if (targetColumnId === "COMPLETED") {
        await onTimerAction(taskId, "complete");
        await onAdminApprove(taskId);
      }
    }
  };

  return (
    <div className="w-full">
      {/* Drag & Drop Notice */}
      <div className="flex items-center justify-between text-xs text-slate-500 mb-3 px-1">
        <div className="flex items-center space-x-1.5 font-medium">
          <GripVertical className="w-3.5 h-3.5 text-slate-400" />
          <span>Drag &amp; drop cards between columns to update sprint status</span>
        </div>
        <div className="text-[11px] font-bold text-slate-400">
          Total Tasks: {tasks.length}
        </div>
      </div>

      {/* Horizontal Scrollable Container to prevent any cutoff */}
      <div className="w-full overflow-x-auto pb-4 scrollbar-thin">
        <div className="flex gap-4 min-w-[1240px] items-start">
          {columns.map((col) => {
            const isTargetOver = dragOverColumn === col.id;

            return (
              <div
                key={col.id}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, col.id)}
                className={`w-80 flex-shrink-0 ${col.columnBg} rounded-2xl shadow-xs flex flex-col min-h-[550px] transition-all duration-150 ${
                  isTargetOver
                    ? "ring-2 ring-blue-500 border-blue-400 bg-blue-100/40"
                    : ""
                }`}
              >
                {/* Column Header */}
                <div className={`p-4 rounded-t-2xl ${col.headerBg} flex items-center justify-between`}>
                  <div>
                    <div className="flex items-center space-x-2">
                      {col.symbol}
                      <h3 className="font-extrabold text-slate-900 text-sm">{col.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${col.bgBadge}`}>
                        {col.count}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{col.description}</p>
                  </div>

                  {col.id === "TODO" && (
                    <button
                      onClick={onOpenCreateModal}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Add task to backlog"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Task Cards List */}
                <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[740px]">
                  {col.tasks.length === 0 ? (
                    <div className="text-center py-12 px-4 border border-dashed border-slate-200 rounded-xl bg-slate-50/30">
                      <p className="text-xs font-semibold text-slate-400">
                        {isTargetOver ? "Drop task here" : `No tasks in ${col.title}`}
                      </p>
                    </div>
                  ) : (
                    col.tasks.map((task) => {
                      const isTimerRunning = task.isTimerRunning;
                      const clientName = task.client?.company || task.client?.name;
                      const isDragging = draggingTaskId === task.id;

                      return (
                        <div
                          key={task.id}
                          draggable={true}
                          onDragStart={(e) => handleDragStart(e, task.id)}
                          onClick={() => onSelectTask(task)}
                          className={`rounded-xl p-3.5 transition-all cursor-grab active:cursor-grabbing space-y-2.5 group relative ${col.cardStyle} ${
                            isDragging
                              ? "opacity-40 scale-95 border-dashed border-2 border-blue-500 shadow-xl"
                              : isTimerRunning
                              ? "ring-2 ring-blue-500 border-blue-500 bg-blue-100/90 shadow-md"
                              : ""
                          }`}
                        >
                          {/* Card Top: Drag Handle, Priority & Client */}
                          <div className="flex items-center justify-between gap-1.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
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

                              {task.recurrence !== "ONE_TIME" && (
                                <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                  <RotateCw className="w-2.5 h-2.5" />
                                  <span>{task.recurrence}</span>
                                </span>
                              )}
                            </div>

                            {clientName && (
                              <span className="text-[10px] font-bold text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200 flex items-center gap-1 truncate max-w-[120px]">
                                <Building2 className="w-2.5 h-2.5 flex-shrink-0" />
                                <span className="truncate">{clientName}</span>
                              </span>
                            )}
                          </div>

                          {/* Task Title */}
                          <h4 className="font-bold text-slate-900 text-xs leading-snug group-hover:text-blue-600 transition line-clamp-2">
                            {task.title}
                          </h4>

                          {/* Due Date & Duration */}
                          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span className="font-mono font-bold text-slate-700">
                                {formatDuration(task.totalDurationSeconds || 0)}
                              </span>
                            </div>

                            {task.dueDate && (
                              <div className="flex items-center space-x-1 text-slate-500">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>

                          {/* Footer Controls: Timer & Move */}
                          <div
                            className="pt-2 border-t border-black/5 flex items-center justify-between"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {/* Timer Button */}
                            {col.id !== "COMPLETED" && (
                              <div>
                                {isTimerRunning ? (
                                  <button
                                    onClick={() => onTimerAction(task.id, "hold")}
                                    className="bg-amber-500 hover:bg-amber-600 text-white px-2 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1 shadow-xs"
                                  >
                                    <Pause className="w-3 h-3" />
                                    <span>Pause</span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => onTimerAction(task.id, "start")}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1 shadow-xs"
                                  >
                                    <Play className="w-3 h-3 fill-current" />
                                    <span>Start</span>
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Quick Advance Button */}
                            <div className="flex items-center space-x-1 ml-auto">
                              {col.id === "TODO" && (
                                <button
                                  onClick={() => onTimerAction(task.id, "start")}
                                  className="text-xs text-blue-600 hover:underline font-bold"
                                >
                                  Start &rarr;
                                </button>
                              )}

                              {col.id === "IN_PROGRESS" && (
                                <button
                                  onClick={() => onTimerAction(task.id, "complete")}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Done</span>
                                </button>
                              )}

                              {col.id === "ON_HOLD" && (
                                <button
                                  onClick={() => onTimerAction(task.id, "resume")}
                                  className="text-xs text-blue-600 hover:underline font-bold"
                                >
                                  Resume &rarr;
                                </button>
                              )}

                              {col.id === "COMPLETED" && (
                                <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Shipped
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
