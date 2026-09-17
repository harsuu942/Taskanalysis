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
} from "lucide-react";

interface ProjectKanbanBoardProps {
  projects: Project[];
  onOpenEdit: (project: Project) => void;
  onOpenDiscussions: (project: Project) => void;
  onOpenSowModal: (project: Project) => void;
  onStatusChange: (projectId: string, newStatus: ProjectStatusType) => Promise<void>;
  onDeleteProject: (projectId: string) => Promise<void>;
}

export default function ProjectKanbanBoard({
  projects,
  onOpenEdit,
  onOpenDiscussions,
  onOpenSowModal,
  onStatusChange,
  onDeleteProject,
}: ProjectKanbanBoardProps) {
  const [draggingProjectId, setDraggingProjectId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const columns: {
    id: ProjectStatusType;
    title: string;
    description: string;
    columnBg: string;
    headerBg: string;
    cardStyle: string;
    badgeBg: string;
    symbol: React.ReactNode;
  }[] = [
    {
      id: "INQUIRY",
      title: "Inquiry & Estimation",
      description: "Leads, estimation provided & follow-ups",
      columnBg: "bg-indigo-50/40 border border-indigo-200/70",
      headerBg: "bg-indigo-100/50 border-b border-indigo-200/80",
      cardStyle: "bg-gradient-to-b from-indigo-50/95 to-indigo-100/60 hover:from-indigo-100/80 hover:to-indigo-100 border border-indigo-300/80 shadow-2xs hover:shadow-md text-indigo-950 ring-1 ring-indigo-200/40",
      badgeBg: "bg-indigo-200 text-indigo-900 border border-indigo-300 font-extrabold",
      symbol: <Sparkles className="w-3.5 h-3.5 text-indigo-600" />,
    },
    {
      id: "ONBOARD",
      title: "Onboard & Scoping",
      description: "Architecture discovery & SOW estimation",
      columnBg: "bg-purple-50/40 border border-purple-200/70",
      headerBg: "bg-purple-100/50 border-b border-purple-200/80",
      cardStyle: "bg-gradient-to-b from-purple-50/95 to-purple-100/60 hover:from-purple-100/80 hover:to-purple-100 border border-purple-300/80 shadow-2xs hover:shadow-md text-purple-950 ring-1 ring-purple-200/40",
      badgeBg: "bg-purple-200 text-purple-900 border border-purple-300 font-extrabold",
      symbol: <Layers className="w-3.5 h-3.5 text-purple-600" />,
    },
    {
      id: "ONGOING",
      title: "Ongoing Delivery",
      description: "Active sprint execution & code delivery",
      columnBg: "bg-blue-50/40 border border-blue-200/70",
      headerBg: "bg-blue-100/50 border-b border-blue-200/80",
      cardStyle: "bg-gradient-to-b from-blue-50/95 to-blue-100/60 hover:from-blue-100/80 hover:to-blue-100 border border-blue-300/80 shadow-2xs hover:shadow-md text-blue-950 ring-1 ring-blue-200/40",
      badgeBg: "bg-blue-200 text-blue-900 border border-blue-300 font-extrabold",
      symbol: <Code2 className="w-3.5 h-3.5 text-blue-600" />,
    },
    {
      id: "HOLD",
      title: "On Hold",
      description: "Awaiting client specs, assets or payment",
      columnBg: "bg-amber-50/40 border border-amber-200/70",
      headerBg: "bg-amber-100/50 border-b border-amber-200/80",
      cardStyle: "bg-gradient-to-b from-amber-50/95 to-amber-100/60 hover:from-amber-100/80 hover:to-amber-100 border border-amber-300/80 shadow-2xs hover:shadow-md text-amber-950 ring-1 ring-amber-200/40",
      badgeBg: "bg-amber-200 text-amber-900 border border-amber-300 font-extrabold",
      symbol: <PauseCircle className="w-3.5 h-3.5 text-amber-600" />,
    },
    {
      id: "COMPLETED",
      title: "Delivered & Shipped",
      description: "Final client sign-off & production deploy",
      columnBg: "bg-emerald-50/40 border border-emerald-200/70",
      headerBg: "bg-emerald-100/50 border-b border-emerald-200/80",
      cardStyle: "bg-gradient-to-b from-emerald-50/95 to-emerald-100/60 hover:from-emerald-100/80 hover:to-emerald-100 border border-emerald-300/80 shadow-2xs hover:shadow-md text-emerald-950 ring-1 ring-emerald-200/40",
      badgeBg: "bg-emerald-200 text-emerald-900 border border-emerald-300 font-extrabold",
      symbol: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
    },
  ];

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

  return (
    <div className="w-full">
      {/* Drag & Drop Hint */}
      <div className="flex items-center justify-between text-xs text-slate-500 mb-3 px-1">
        <div className="flex items-center space-x-1.5 font-medium">
          <GripVertical className="w-3.5 h-3.5 text-slate-400" />
          <span>Drag projects across columns to update deal pipeline status</span>
        </div>
      </div>

      {/* Horizontal Scrollable Container */}
      <div className="w-full overflow-x-auto pb-4 scrollbar-thin">
        <div className="flex gap-4 min-w-[1240px] items-start">
          {columns.map((col) => {
            const colProjects = projects.filter((p) => p.status === col.id);
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
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${col.badgeBg}`}>
                        {colProjects.length}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{col.description}</p>
                  </div>
                </div>

                {/* Project Cards List */}
                <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[740px]">
                  {colProjects.length === 0 ? (
                    <div className="text-center py-12 px-4 border border-dashed border-slate-200 rounded-xl bg-slate-50/30">
                      <Briefcase className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
                      <p className="text-xs font-semibold text-slate-400">
                        {isTargetOver ? "Drop project here" : "No projects in this stage"}
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

                      return (
                        <div
                          key={project.id}
                          draggable={true}
                          onDragStart={(e) => handleDragStart(e, project.id)}
                          className={`rounded-xl p-3.5 transition-all space-y-2.5 group relative cursor-grab active:cursor-grabbing ${col.cardStyle} ${
                            isDragging
                              ? "opacity-40 scale-95 border-dashed border-2 border-indigo-500 shadow-xl"
                              : ""
                          }`}
                        >
                          {/* Top: Client & Quick Actions */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded-md border border-cyan-200 truncate max-w-full">
                                <Building2 className="w-3 h-3 text-cyan-600 flex-shrink-0" />
                                <span className="truncate">
                                  {project.client?.company || project.client?.name || "Client"}
                                </span>
                              </span>
                              <h4 className="font-bold text-slate-900 text-xs mt-1.5 line-clamp-2 leading-snug">
                                {project.title}
                              </h4>
                            </div>

                            <div className="flex items-center space-x-1 flex-shrink-0 opacity-80 group-hover:opacity-100 transition">
                              <button
                                onClick={() => onOpenEdit(project)}
                                className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                                title="Edit Project & SOW"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onDeleteProject(project.id)}
                                className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                title="Delete Project"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Follow-Up Reminder Chip */}
                          {project.followUpDate && (
                            <div
                              className={`p-2 rounded-lg border text-[11px] font-bold flex items-center justify-between gap-1.5 shadow-2xs ${
                                new Date(project.followUpDate).getTime() < Date.now() - 86400000
                                  ? "bg-rose-50 text-rose-800 border-rose-300"
                                  : new Date(project.followUpDate).toISOString().split("T")[0] ===
                                    new Date().toISOString().split("T")[0]
                                  ? "bg-amber-50 text-amber-900 border-amber-300 animate-pulse"
                                  : "bg-indigo-50 text-indigo-800 border-indigo-200"
                              }`}
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                <Clock className="w-3.5 h-3.5 flex-shrink-0 text-indigo-600" />
                                <span className="truncate">
                                  Follow-up: {new Date(project.followUpDate).toLocaleDateString()}
                                  {project.followUpNote ? ` • "${project.followUpNote}"` : ""}
                                </span>
                              </div>
                              {new Date(project.followUpDate).getTime() < Date.now() - 86400000 && (
                                <span className="text-[9px] uppercase font-black px-1.5 py-0.5 bg-rose-200 text-rose-900 rounded flex-shrink-0">
                                  Overdue
                                </span>
                              )}
                              {new Date(project.followUpDate).toISOString().split("T")[0] ===
                                new Date().toISOString().split("T")[0] && (
                                <span className="text-[9px] uppercase font-black px-1.5 py-0.5 bg-amber-200 text-amber-900 rounded flex-shrink-0">
                                  Today
                                </span>
                              )}
                            </div>
                          )}

                          {/* Scope of Work Snippet */}
                          {project.scopeOfWork ? (
                            <div
                              onClick={() => onOpenSowModal(project)}
                              className="bg-white/80 hover:bg-white p-2.5 rounded-lg border border-black/5 cursor-pointer text-[11px] text-slate-700 transition shadow-2xs"
                              title="Click to view Scope of Work & Attachments"
                            >
                              <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                                <span className="flex items-center gap-1">
                                  <FileText className="w-3 h-3 text-indigo-500" /> SOW Spec
                                </span>
                                <span className="text-indigo-600 hover:underline">View Spec</span>
                              </div>
                              <p className="line-clamp-2 italic text-slate-700">
                                "{project.scopeOfWork}"
                              </p>
                            </div>
                          ) : (
                            <button
                              onClick={() => onOpenEdit(project)}
                              className="w-full text-left p-2 rounded-lg border border-dashed border-slate-200 text-[11px] text-slate-400 hover:text-indigo-600 hover:border-indigo-300 transition"
                            >
                              + Add Scope of Work (SOW)
                            </button>
                          )}

                          {/* Financial & Timeframe Approved Badges */}
                          <div className="space-y-1.5 pt-0.5">
                            {hasApprovedEstimate ? (
                              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2 text-xs">
                                <div className="flex items-center justify-between font-extrabold text-emerald-900">
                                  <span className="flex items-center gap-1 text-[11px]">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Approved
                                  </span>
                                  <span className="text-sm font-black text-emerald-700">
                                    {project.currency}
                                    {Number(project.approvedAmount).toLocaleString()}
                                  </span>
                                </div>
                                {project.approvedTimeframe && (
                                  <div className="text-[11px] text-emerald-800 font-medium mt-0.5 flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                                    <span className="truncate">{project.approvedTimeframe}</span>
                                  </div>
                                )}
                              </div>
                            ) : project.initialEstimation ? (
                              <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs text-amber-900 flex items-center justify-between">
                                <span className="font-bold flex items-center gap-1 text-[11px]">
                                  <Clock className="w-3 h-3 text-amber-600" /> Initial Est:
                                </span>
                                <span className="font-bold">{project.initialEstimation}</span>
                              </div>
                            ) : null}
                          </div>

                          {/* Footer: Discussions & Attachments counts */}
                          <div className="pt-2 border-t border-black/5 flex items-center justify-between text-xs">
                            <button
                              onClick={() => onOpenDiscussions(project)}
                              className="flex items-center space-x-1.5 text-indigo-600 hover:text-indigo-800 font-bold hover:bg-indigo-50 px-2 py-1 rounded-md transition"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                              <span>Logs ({discussionCount})</span>
                            </button>

                            {/* Attachments preview button */}
                            <button
                              onClick={() => onOpenSowModal(project)}
                              className="flex items-center space-x-1 text-slate-500 hover:text-slate-800 font-semibold px-2 py-1 rounded-md hover:bg-slate-100 transition text-[11px]"
                              title="Attachments / Specs"
                            >
                              <Paperclip className="w-3 h-3 text-slate-400" />
                              <span>{attachmentCount} files</span>
                            </button>
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
