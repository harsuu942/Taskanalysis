"use client";

import React, { useState } from "react";
import { Project, ProjectStatusType } from "@/types";
import {
  Briefcase,
  Building2,
  Calendar,
  DollarSign,
  MessageSquare,
  FileText,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  PauseCircle,
  Sparkles,
  Edit3,
  Trash2,
  Paperclip,
  GripVertical,
  ExternalLink,
  Layers,
  Code2,
  Terminal,
  Send,
  Plus,
  Phone,
  Mail,
  TrendingUp,
  Check,
  ChevronRight,
  CalendarClock,
  Trophy,
  Tag,
  Zap,
} from "lucide-react";

interface ProjectKanbanBoardProps {
  projects: Project[];
  onOpenEdit: (project: Project) => void;
  onOpenDiscussions: (project: Project) => void;
  onOpenSowModal: (project: Project) => void;
  onStatusChange: (projectId: string, newStatus: ProjectStatusType) => Promise<void>;
  onDeleteProject: (projectId: string) => Promise<void>;
  onOpenCreateInStage?: (status: ProjectStatusType) => void;
  onQuickFollowUp?: (projectId: string, newDate: string | null, note?: string | null) => Promise<void>;
}

export default function ProjectKanbanBoard({
  projects,
  onOpenEdit,
  onOpenDiscussions,
  onOpenSowModal,
  onStatusChange,
  onDeleteProject,
  onOpenCreateInStage,
  onQuickFollowUp,
}: ProjectKanbanBoardProps) {
  const [draggingProjectId, setDraggingProjectId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  // Six dedicated stages for the Inquire -> Estimation -> SOW -> Onboarding -> Delivery lifecycle
  const columns: {
    id: ProjectStatusType;
    title: string;
    description: string;
    columnBg: string;
    headerBg: string;
    accentColor: string;
    cardStyle: string;
    badgeBg: string;
    symbol: React.ReactNode;
    nextStageLabel?: string;
    nextStageId?: ProjectStatusType;
  }[] = [
    {
      id: "INQUIRY",
      title: "New Inquiries",
      description: "Leads & requirements gathering",
      columnBg: "bg-slate-50/70 border border-slate-200/90",
      headerBg: "bg-gradient-to-r from-indigo-100/70 to-blue-100/50 border-b border-indigo-200/80",
      accentColor: "text-indigo-700",
      cardStyle: "bg-white hover:bg-slate-50/90 border border-slate-200 shadow-2xs hover:shadow-md text-slate-900",
      badgeBg: "bg-indigo-100 text-indigo-900 border border-indigo-200 font-extrabold",
      symbol: <Sparkles className="w-3.5 h-3.5 text-indigo-600" />,
      nextStageLabel: "Send Estimation",
      nextStageId: "ESTIMATION_SENT",
    },
    {
      id: "ESTIMATION_SENT",
      title: "Estimation & SOW Provided",
      description: "Quote & SOW shared with client",
      columnBg: "bg-blue-50/30 border border-blue-200/70",
      headerBg: "bg-gradient-to-r from-blue-100/70 to-cyan-100/50 border-b border-blue-200/80",
      accentColor: "text-blue-700",
      cardStyle: "bg-white hover:bg-blue-50/40 border border-blue-200/80 shadow-2xs hover:shadow-md text-slate-900",
      badgeBg: "bg-blue-100 text-blue-900 border border-blue-200 font-extrabold",
      symbol: <FileText className="w-3.5 h-3.5 text-blue-600" />,
      nextStageLabel: "Schedule Follow-Up",
      nextStageId: "FOLLOW_UP",
    },
    {
      id: "FOLLOW_UP",
      title: "Follow-Up & Negotiation",
      description: "Active reminders & discussions",
      columnBg: "bg-amber-50/30 border border-amber-200/70",
      headerBg: "bg-gradient-to-r from-amber-100/70 to-orange-100/50 border-b border-amber-200/80",
      accentColor: "text-amber-700",
      cardStyle: "bg-white hover:bg-amber-50/40 border border-amber-200/90 shadow-2xs hover:shadow-md text-slate-900",
      badgeBg: "bg-amber-100 text-amber-900 border border-amber-200 font-extrabold",
      symbol: <Clock className="w-3.5 h-3.5 text-amber-600" />,
      nextStageLabel: "🎉 Onboard Client",
      nextStageId: "ONBOARD",
    },
    {
      id: "ONBOARD",
      title: "Client Onboarded",
      description: "Deal won • Auto-added to Active Clients",
      columnBg: "bg-emerald-50/30 border border-emerald-200/70",
      headerBg: "bg-gradient-to-r from-emerald-100/70 to-teal-100/50 border-b border-emerald-200/80",
      accentColor: "text-emerald-700",
      cardStyle: "bg-white hover:bg-emerald-50/40 border border-emerald-200/90 shadow-2xs hover:shadow-md text-slate-900",
      badgeBg: "bg-emerald-100 text-emerald-900 border border-emerald-200 font-extrabold",
      symbol: <Trophy className="w-3.5 h-3.5 text-emerald-600" />,
      nextStageLabel: "Start Delivery",
      nextStageId: "ONGOING",
    },
    {
      id: "ONGOING",
      title: "In Delivery",
      description: "Active sprint execution",
      columnBg: "bg-purple-50/30 border border-purple-200/70",
      headerBg: "bg-gradient-to-r from-purple-100/70 to-indigo-100/50 border-b border-purple-200/80",
      accentColor: "text-purple-700",
      cardStyle: "bg-white hover:bg-purple-50/40 border border-purple-200/80 shadow-2xs hover:shadow-md text-slate-900",
      badgeBg: "bg-purple-100 text-purple-900 border border-purple-200 font-extrabold",
      symbol: <Code2 className="w-3.5 h-3.5 text-purple-600" />,
      nextStageLabel: "Mark Delivered",
      nextStageId: "COMPLETED",
    },
    {
      id: "HOLD",
      title: "On Hold / Stalled",
      description: "Client paused, delayed, or lost",
      columnBg: "bg-slate-50/50 border border-slate-200/70",
      headerBg: "bg-slate-100 border-b border-slate-200",
      accentColor: "text-slate-700",
      cardStyle: "bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs hover:shadow-md text-slate-900",
      badgeBg: "bg-slate-200 text-slate-800 border border-slate-300 font-extrabold",
      symbol: <PauseCircle className="w-3.5 h-3.5 text-slate-600" />,
      nextStageLabel: "Reactivate Inquiry",
      nextStageId: "INQUIRY",
    },
  ];

  // Helper: map project to column (e.g. COMPLETED maps into ONGOING or HOLD)
  const getColumnProjects = (colId: ProjectStatusType) => {
    return projects.filter((p) => {
      if (p.status === colId) return true;
      // Handle legacy or completion mappings gracefully
      if (colId === "ONGOING" && p.status === "COMPLETED") return true;
      return false;
    });
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, projId: string) => {
    e.dataTransfer.setData("text/plain", projId);
    e.dataTransfer.effectAllowed = "move";
    setDraggingProjectId(projId);
  };

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverColumn !== colId) {
      setDragOverColumn(colId);
    }
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, targetColId: ProjectStatusType) => {
    e.preventDefault();
    setDragOverColumn(null);
    const projId = e.dataTransfer.getData("text/plain");
    setDraggingProjectId(null);

    if (!projId) return;
    await onStatusChange(projId, targetColId);
  };

  // Quick snooze or reschedule follow-up
  const handleReschedule = async (projId: string, daysToAdd: number | "clear") => {
    if (!onQuickFollowUp) return;
    if (daysToAdd === "clear") {
      await onQuickFollowUp(projId, null);
      return;
    }
    const d = new Date();
    d.setDate(d.getDate() + daysToAdd);
    await onQuickFollowUp(projId, d.toISOString());
  };

  return (
    <div className="w-full space-y-3">
      {/* Drag & Drop Hint & Summary Ribbon */}
      <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 px-1 gap-2">
        <div className="flex items-center space-x-1.5 font-medium">
          <GripVertical className="w-3.5 h-3.5 text-slate-400" />
          <span>Drag inquiry cards across stages or use one-click action buttons</span>
        </div>
        <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-2">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Moving to "Client Onboarded" automatically promotes client to Active</span>
          </span>
        </div>
      </div>

      {/* Horizontal Scrollable Container */}
      <div className="w-full overflow-x-auto pb-4 scrollbar-thin">
        <div className="flex gap-4 min-w-[1550px] items-start">
          {columns.map((col) => {
            const colProjects = getColumnProjects(col.id);
            const isTargetOver = dragOverColumn === col.id;

            // Calculate total pipeline value in this column
            const columnValue = colProjects.reduce((sum, p) => {
              if (p.approvedAmount) return sum + Number(p.approvedAmount);
              if (p.initialEstimation) {
                const match = p.initialEstimation.replace(/[^0-9.]/g, "");
                const parsed = parseFloat(match);
                if (!isNaN(parsed)) return sum + parsed;
              }
              return sum;
            }, 0);

            // Count follow-ups due today in this column
            const dueTodayCount = colProjects.filter((p) => {
              if (!p.followUpDate) return false;
              const fDate = new Date(p.followUpDate).toISOString().split("T")[0];
              const tDate = new Date().toISOString().split("T")[0];
              return fDate === tDate;
            }).length;

            return (
              <div
                key={col.id}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, col.id)}
                className={`w-72 flex-shrink-0 ${col.columnBg} rounded-2xl shadow-xs flex flex-col min-h-[500px] transition-all duration-150 ${
                  isTargetOver
                    ? "ring-2 ring-indigo-500 border-indigo-400 bg-indigo-50/60"
                    : ""
                }`}
              >
                {/* Column Header */}
                <div className={`p-3.5 rounded-t-2xl ${col.headerBg}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {col.symbol}
                      <h3 className="font-extrabold text-slate-900 text-xs tracking-tight">
                        {col.title}
                      </h3>
                      <span className={`px-2 py-0.2 rounded-full text-[11px] font-extrabold ${col.badgeBg}`}>
                        {colProjects.length}
                      </span>
                    </div>

                    {/* Quick Add Button in this stage */}
                    {onOpenCreateInStage && (
                      <button
                        onClick={() => onOpenCreateInStage(col.id)}
                        className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-white/80 transition"
                        title={`Create new inquiry in ${col.title}`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Subtitle & Estimated Value */}
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                    <span className="truncate">{col.description}</span>
                    {columnValue > 0 && (
                      <span className="font-mono font-bold text-slate-700 bg-white/70 px-1.5 py-0.2 rounded border border-slate-200">
                        ${columnValue.toLocaleString()}
                      </span>
                    )}
                  </div>

                  {/* Due Today Badge in Column Header */}
                  {dueTodayCount > 0 && (
                    <div className="mt-1.5 bg-amber-200/80 text-amber-950 px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 animate-pulse">
                      <Clock className="w-3 h-3 text-amber-700" />
                      <span>{dueTodayCount} follow-up{dueTodayCount > 1 ? "s" : ""} due today!</span>
                    </div>
                  )}
                </div>

                {/* Project Cards List */}
                <div className="p-2.5 space-y-2.5 flex-1 overflow-y-auto max-h-[750px]">
                  {colProjects.length === 0 ? (
                    <div
                      onClick={() => onOpenCreateInStage && onOpenCreateInStage(col.id)}
                      className="text-center py-10 px-3 border border-dashed border-slate-300/80 rounded-xl bg-white/50 hover:bg-white cursor-pointer transition group"
                    >
                      <Briefcase className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 mx-auto mb-1 transition" />
                      <p className="text-[11px] font-semibold text-slate-400 group-hover:text-slate-700">
                        {isTargetOver ? "Drop inquiry here" : "+ Add Inquiry"}
                      </p>
                    </div>
                  ) : (
                    colProjects.map((project) => {
                      const discussionCount =
                        project.discussions?.length || project._count?.discussions || 0;
                      const attachmentCount =
                        project.attachments?.length || project._count?.attachments || 0;
                      const hasApprovedEstimate =
                        project.isApproved &&
                        project.approvedAmount !== null &&
                        project.approvedAmount !== undefined;

                      const isDragging = draggingProjectId === project.id;

                      // Follow-up status determination
                      const isFollowUpOverdue =
                        project.followUpDate &&
                        new Date(project.followUpDate).getTime() < Date.now() - 86400000;
                      const isFollowUpToday =
                        project.followUpDate &&
                        new Date(project.followUpDate).toISOString().split("T")[0] ===
                          new Date().toISOString().split("T")[0];

                      return (
                        <div
                          key={project.id}
                          draggable={true}
                          onDragStart={(e) => handleDragStart(e, project.id)}
                          className={`rounded-xl p-3 transition-all space-y-2.5 group relative cursor-grab active:cursor-grabbing ${col.cardStyle} ${
                            isDragging
                              ? "opacity-40 scale-95 border-dashed border-2 border-indigo-500 shadow-xl"
                              : ""
                          }`}
                        >
                          {/* Top: Client Badge, Company & Edit/Delete */}
                          <div className="flex items-start justify-between gap-1.5">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200 truncate max-w-full">
                                  <Building2 className="w-3 h-3 text-indigo-600 flex-shrink-0" />
                                  <span className="truncate">
                                    {project.client?.company || project.client?.name || "Client"}
                                  </span>
                                </span>
                                {project.client?.company && project.client?.name && (
                                  <span className="text-[10px] text-slate-500 font-medium truncate">
                                    ({project.client.name})
                                  </span>
                                )}
                              </div>

                              <h4 className="font-extrabold text-slate-900 text-xs mt-1 leading-snug line-clamp-2">
                                {project.title}
                              </h4>
                            </div>

                            {/* Card Actions */}
                            <div className="flex items-center space-x-1 flex-shrink-0 opacity-70 group-hover:opacity-100 transition">
                              <button
                                onClick={() => onOpenEdit(project)}
                                className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                                title="Edit Inquiry & SOW"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onDeleteProject(project.id)}
                                className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                title="Delete Inquiry"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Estimation & Financial Highlight (Crucial for Inquiries!) */}
                          <div className="bg-slate-50 rounded-lg p-2 border border-slate-200/80">
                            {hasApprovedEstimate ? (
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="text-[9px] uppercase font-black text-emerald-700 tracking-wider block">
                                    Approved Deal Value
                                  </span>
                                  <span className="text-xs font-black text-emerald-700 flex items-center gap-0.5">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600 inline" />
                                    {project.currency}{Number(project.approvedAmount).toLocaleString()}
                                  </span>
                                </div>
                                {project.approvedTimeframe && (
                                  <span className="text-[10px] text-slate-600 font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                    {project.approvedTimeframe}
                                  </span>
                                )}
                              </div>
                            ) : project.initialEstimation ? (
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="text-[9px] uppercase font-bold text-blue-600 tracking-wider block">
                                    Quoted Estimate
                                  </span>
                                  <span className="text-xs font-black text-blue-950">
                                    {project.currency} {project.initialEstimation}
                                  </span>
                                </div>
                                {project.approvedTimeframe && (
                                  <span className="text-[10px] text-slate-600 font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                    {project.approvedTimeframe}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <button
                                onClick={() => onOpenEdit(project)}
                                className="w-full text-left flex items-center justify-between text-[11px] font-bold text-indigo-700 hover:text-indigo-900"
                              >
                                <span>+ Add Price &amp; Timeframe Estimate</span>
                                <Plus className="w-3 h-3" />
                              </button>
                            )}
                          </div>

                          {/* Follow-Up Reminder Box (Interactive & Actionable) */}
                          {project.followUpDate ? (
                            <div
                              className={`p-2.5 rounded-lg border text-[11px] space-y-1.5 transition ${
                                isFollowUpOverdue
                                  ? "bg-rose-50/90 text-rose-950 border-rose-300"
                                  : isFollowUpToday
                                  ? "bg-amber-50 text-amber-950 border-amber-300 shadow-xs ring-1 ring-amber-300"
                                  : "bg-indigo-50/70 text-indigo-950 border-indigo-200"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <div className="flex items-center gap-1 font-bold">
                                  <Clock className={`w-3.5 h-3.5 ${isFollowUpOverdue ? "text-rose-600" : isFollowUpToday ? "text-amber-600 animate-bounce" : "text-indigo-600"}`} />
                                  <span>
                                    {isFollowUpToday
                                      ? "🔔 Follow-up Today!"
                                      : isFollowUpOverdue
                                      ? "⚠️ Follow-up Overdue"
                                      : `📅 Follow-up: ${new Date(project.followUpDate).toLocaleDateString()}`}
                                  </span>
                                </div>

                                {isFollowUpOverdue && (
                                  <span className="text-[9px] uppercase font-black px-1.5 py-0.2 bg-rose-200 text-rose-900 rounded">
                                    Call Now
                                  </span>
                                )}
                                {isFollowUpToday && (
                                  <span className="text-[9px] uppercase font-black px-1.5 py-0.2 bg-amber-200 text-amber-900 rounded animate-pulse">
                                    Today
                                  </span>
                                )}
                              </div>

                              {/* Follow-up Note Text */}
                              {project.followUpNote && (
                                <p className="text-[10px] font-medium italic text-slate-700 bg-white/70 p-1 rounded border border-black/5">
                                  "{project.followUpNote}"
                                </p>
                              )}

                              {/* Quick Follow-Up Reschedule Buttons */}
                              {onQuickFollowUp && (
                                <div className="flex items-center gap-1 pt-1 border-t border-black/5 text-[9px] font-bold">
                                  <span className="text-slate-400">Snooze:</span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleReschedule(project.id, 1);
                                    }}
                                    className="px-1.5 py-0.5 bg-white rounded border border-slate-200 hover:bg-slate-100 text-slate-700"
                                    title="Snooze to tomorrow"
                                  >
                                    +1d Tomorrow
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleReschedule(project.id, 3);
                                    }}
                                    className="px-1.5 py-0.5 bg-white rounded border border-slate-200 hover:bg-slate-100 text-slate-700"
                                    title="Snooze 3 days"
                                  >
                                    +3d
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleReschedule(project.id, "clear");
                                    }}
                                    className="px-1.5 py-0.5 bg-white rounded border border-slate-200 hover:bg-rose-50 text-slate-500 hover:text-rose-700"
                                    title="Mark follow-up completed"
                                  >
                                    ✓ Done
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <button
                              onClick={() => onOpenEdit(project)}
                              className="w-full text-left p-1.5 rounded-lg border border-dashed border-amber-300/80 bg-amber-50/40 text-[10px] text-amber-800 hover:bg-amber-100/60 font-bold transition flex items-center justify-between"
                            >
                              <span>⏰ + Schedule Follow-Up Reminder</span>
                              <Plus className="w-3 h-3 text-amber-600" />
                            </button>
                          )}

                          {/* Scope of Work (SOW) & Files Snippet */}
                          {project.scopeOfWork ? (
                            <div
                              onClick={() => onOpenSowModal(project)}
                              className="bg-slate-50 hover:bg-white p-2 rounded-lg border border-slate-200 cursor-pointer text-[11px] text-slate-700 transition"
                              title="Click to view Scope of Work & Attachments"
                            >
                              <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">
                                <span className="flex items-center gap-1 text-indigo-700 font-bold">
                                  <FileText className="w-3 h-3" /> SOW Spec
                                </span>
                                <span className="text-indigo-600 hover:underline">View</span>
                              </div>
                              <p className="line-clamp-2 italic text-[10px] text-slate-600">
                                "{project.scopeOfWork}"
                              </p>
                            </div>
                          ) : (
                            <button
                              onClick={() => onOpenEdit(project)}
                              className="w-full text-left p-1.5 rounded-lg border border-dashed border-slate-200 text-[10px] text-slate-400 hover:text-indigo-600 hover:border-indigo-300 transition"
                            >
                              + Add Scope of Work (SOW)
                            </button>
                          )}

                          {/* Card Footer: Discussions, Files & Advance Stage Button */}
                          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                            <div className="flex items-center justify-between text-xs">
                              <button
                                onClick={() => onOpenDiscussions(project)}
                                className="flex items-center space-x-1 text-indigo-600 hover:text-indigo-800 font-bold hover:bg-indigo-50 px-1.5 py-0.5 rounded transition text-[11px]"
                              >
                                <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                                <span>Logs ({discussionCount})</span>
                              </button>

                              <button
                                onClick={() => onOpenSowModal(project)}
                                className="flex items-center space-x-1 text-slate-500 hover:text-slate-800 font-semibold px-1.5 py-0.5 rounded hover:bg-slate-100 transition text-[11px]"
                              >
                                <Paperclip className="w-3 h-3 text-slate-400" />
                                <span>{attachmentCount} files</span>
                              </button>
                            </div>

                            {/* One-Click Advance Button & Stage Dropdown */}
                            <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100">
                              {col.nextStageId && (
                                <button
                                  onClick={() => onStatusChange(project.id, col.nextStageId!)}
                                  className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 shadow-2xs ${
                                    col.id === "FOLLOW_UP"
                                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                      : "bg-slate-900 hover:bg-indigo-900 text-white"
                                  }`}
                                  title={`Advance to ${col.nextStageLabel}`}
                                >
                                  <span>{col.nextStageLabel}</span>
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              )}

                              {/* Direct Stage Jump Select */}
                              <select
                                value={project.status}
                                onChange={(e) =>
                                  onStatusChange(project.id, e.target.value as ProjectStatusType)
                                }
                                className="text-[10px] font-bold bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg px-1.5 py-1 text-slate-700 focus:outline-none cursor-pointer"
                                title="Move to stage"
                              >
                                <option value="INQUIRY">Move: Inquiry</option>
                                <option value="ESTIMATION_SENT">Move: Est. Sent</option>
                                <option value="FOLLOW_UP">Move: Follow-Up</option>
                                <option value="ONBOARD">Move: Onboarded 🎉</option>
                                <option value="ONGOING">Move: In Delivery</option>
                                <option value="HOLD">Move: On Hold</option>
                              </select>
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
