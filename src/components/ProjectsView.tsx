"use client";

import React, { useState } from "react";
import { Project, Client, ProjectStatusType, ProjectDiscussion, ProjectAttachment } from "@/types";
import ProjectKanbanBoard from "./ProjectKanbanBoard";
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  Kanban,
  LayoutGrid,
  Building2,
  DollarSign,
  Clock,
  CheckCircle2,
  FileText,
  MessageSquare,
  AlertCircle,
  X,
  Send,
  Calendar,
  Sparkles,
  Edit3,
  Trash2,
  Check,
  TrendingUp,
  Paperclip,
  Upload,
  Link as LinkIcon,
  ExternalLink,
  Code2,
  Layers,
  FileCode,
} from "lucide-react";

interface ProjectsViewProps {
  projects: Project[];
  clients: Client[];
  onRefresh: () => void;
  onOpenCreateClient?: () => void;
}

export default function ProjectsView({
  projects,
  clients,
  onRefresh,
}: ProjectsViewProps) {
  const [viewMode, setViewMode] = useState<"kanban" | "grid">("kanban");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [clientFilter, setClientFilter] = useState("ALL");

  // Project Modal State
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Form fields
  const [formTitle, setFormTitle] = useState("");
  const [formClientId, setFormClientId] = useState("");
  const [formStatus, setFormStatus] = useState<ProjectStatusType>("ONBOARD");
  const [formScopeOfWork, setFormScopeOfWork] = useState("");
  const [formInitialEstimation, setFormInitialEstimation] = useState("");
  const [formIsApproved, setFormIsApproved] = useState(false);
  const [formApprovedAmount, setFormApprovedAmount] = useState("");
  const [formCurrency, setFormCurrency] = useState("$");
  const [formApprovedTimeframe, setFormApprovedTimeframe] = useState("");
  const [formStartDate, setFormStartDate] = useState("");
  const [formTargetDeliveryDate, setFormTargetDeliveryDate] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [savingProject, setSavingProject] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // SOW Viewer & Attachments Modal State
  const [sowModalProject, setSowModalProject] = useState<Project | null>(null);
  const [sowAttachments, setSowAttachments] = useState<ProjectAttachment[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [attName, setAttName] = useState("");
  const [attUrl, setAttUrl] = useState("");
  const [attType, setAttType] = useState<"figma" | "github" | "pdf" | "doc" | "image" | "link">("figma");
  const [savingAtt, setSavingAtt] = useState(false);

  // Discussions Drawer State
  const [discussionDrawerProject, setDiscussionDrawerProject] = useState<Project | null>(null);
  const [discussions, setDiscussions] = useState<ProjectDiscussion[]>([]);
  const [loadingDiscussions, setLoadingDiscussions] = useState(false);

  // Add Discussion Form fields
  const [discTitle, setDiscTitle] = useState("");
  const [discDate, setDiscDate] = useState(new Date().toISOString().split("T")[0]);
  const [discNotes, setDiscNotes] = useState("");
  const [discFeedback, setDiscFeedback] = useState("");
  const [discActionItems, setDiscActionItems] = useState("");
  const [savingDisc, setSavingDisc] = useState(false);

  // Open Create Project Modal
  const handleOpenCreateModal = () => {
    setEditingProject(null);
    setFormTitle("");
    setFormClientId(clients[0]?.id || "");
    setFormStatus("ONBOARD");
    setFormScopeOfWork("");
    setFormInitialEstimation("");
    setFormIsApproved(false);
    setFormApprovedAmount("");
    setFormCurrency("$");
    setFormApprovedTimeframe("");
    setFormStartDate("");
    setFormTargetDeliveryDate("");
    setFormNotes("");
    setFormError(null);
    setIsProjectModalOpen(true);
  };

  // Open Edit Project Modal
  const handleOpenEditModal = (proj: Project) => {
    setEditingProject(proj);
    setFormTitle(proj.title || "");
    setFormClientId(proj.clientId || "");
    setFormStatus(proj.status || "ONBOARD");
    setFormScopeOfWork(proj.scopeOfWork || "");
    setFormInitialEstimation(proj.initialEstimation || "");
    setFormIsApproved(Boolean(proj.isApproved));
    setFormApprovedAmount(
      proj.approvedAmount !== null && proj.approvedAmount !== undefined
        ? String(proj.approvedAmount)
        : ""
    );
    setFormCurrency(proj.currency || "$");
    setFormApprovedTimeframe(proj.approvedTimeframe || "");
    setFormStartDate(proj.startDate ? proj.startDate.split("T")[0] : "");
    setFormTargetDeliveryDate(proj.targetDeliveryDate ? proj.targetDeliveryDate.split("T")[0] : "");
    setFormNotes(proj.notes || "");
    setFormError(null);
    setIsProjectModalOpen(true);
  };

  // Save Project Handler
  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError("Project title is required.");
      return;
    }
    if (!formClientId) {
      setFormError("Please select a client.");
      return;
    }

    setSavingProject(true);
    setFormError(null);

    try {
      const payload: any = {
        title: formTitle.trim(),
        clientId: formClientId,
        status: formStatus,
        scopeOfWork: formScopeOfWork.trim() || null,
        initialEstimation: formInitialEstimation.trim() || null,
        isApproved: formIsApproved,
        approvedAmount: formApprovedAmount ? Number(formApprovedAmount) : null,
        currency: formCurrency,
        approvedTimeframe: formApprovedTimeframe.trim() || null,
        startDate: formStartDate || null,
        targetDeliveryDate: formTargetDeliveryDate || null,
        notes: formNotes.trim() || null,
      };

      const url = "/api/projects";
      const method = editingProject ? "PUT" : "POST";
      if (editingProject) {
        payload.id = editingProject.id;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save project.");
      }

      setIsProjectModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSavingProject(false);
    }
  };

  // Status Change directly from card or drag-drop
  const handleStatusChange = async (projectId: string, newStatus: ProjectStatusType) => {
    try {
      const res = await fetch("/api/projects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: projectId, status: newStatus }),
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Delete Project Handler
  const handleDeleteProject = async (projectId: string) => {
    if (!confirm("Are you sure you want to delete this project? All associated discussion logs and attachments will also be removed.")) {
      return;
    }

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Open SOW & Attachments Modal
  const handleOpenSowModal = async (proj: Project) => {
    setSowModalProject(proj);
    setSowAttachments(proj.attachments || []);
    setAttName("");
    setAttUrl("");
    setAttType("figma");
    setLoadingAttachments(true);

    try {
      const res = await fetch(`/api/projects/${proj.id}/attachments`);
      const data = await res.json();
      if (res.ok && data.attachments) {
        setSowAttachments(data.attachments);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAttachments(false);
    }
  };

  // Add Attachment Handler
  const handleAddAttachment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sowModalProject) return;
    if (!attName.trim() || !attUrl.trim()) {
      alert("Please provide both an attachment name and URL/file.");
      return;
    }

    setSavingAtt(true);
    try {
      const res = await fetch(`/api/projects/${sowModalProject.id}/attachments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: attName.trim(),
          url: attUrl.trim(),
          fileType: attType,
        }),
      });

      const data = await res.json();
      if (res.ok && data.attachment) {
        setSowAttachments([data.attachment, ...sowAttachments]);
        setAttName("");
        setAttUrl("");
        onRefresh();
      } else {
        alert(data.error || "Failed to add attachment.");
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSavingAtt(false);
    }
  };

  // Handle Local File Selection for Attachment
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAttName(file.name);
    // Determine file type
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (["png", "jpg", "jpeg", "svg", "webp"].includes(ext)) {
      setAttType("image");
    } else if (["pdf"].includes(ext)) {
      setAttType("pdf");
    } else if (["doc", "docx", "txt", "md"].includes(ext)) {
      setAttType("doc");
    } else {
      setAttType("link");
    }

    // Convert to local data URL
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAttUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Delete Attachment
  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!confirm("Delete this attachment?")) return;
    try {
      const res = await fetch(`/api/projects/attachments?attachmentId=${attachmentId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSowAttachments(sowAttachments.filter((a) => a.id !== attachmentId));
        onRefresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Open Discussions Drawer
  const handleOpenDiscussions = async (proj: Project) => {
    setDiscussionDrawerProject(proj);
    setLoadingDiscussions(true);
    setDiscTitle("");
    setDiscNotes("");
    setDiscFeedback("");
    setDiscActionItems("");
    setDiscDate(new Date().toISOString().split("T")[0]);

    try {
      const res = await fetch(`/api/projects/${proj.id}/discussions`);
      const data = await res.json();
      if (res.ok) {
        setDiscussions(data.discussions || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDiscussions(false);
    }
  };

  // Add Discussion
  const handleAddDiscussion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discussionDrawerProject) return;
    if (!discTitle.trim()) {
      alert("Please provide a discussion topic.");
      return;
    }
    if (!discNotes.trim()) {
      alert("Please enter discussion notes.");
      return;
    }

    setSavingDisc(true);
    try {
      const res = await fetch(`/api/projects/${discussionDrawerProject.id}/discussions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: discTitle.trim(),
          meetingDate: discDate,
          discussionNotes: discNotes.trim(),
          clientFeedback: discFeedback.trim() || null,
          actionItems: discActionItems.trim() || null,
        }),
      });

      const data = await res.json();
      if (res.ok && data.discussion) {
        setDiscussions([data.discussion, ...discussions]);
        setDiscTitle("");
        setDiscNotes("");
        setDiscFeedback("");
        setDiscActionItems("");
        onRefresh();
      } else {
        alert(data.error || "Failed to add discussion.");
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSavingDisc(false);
    }
  };

  // Delete Discussion
  const handleDeleteDiscussion = async (discussionId: string) => {
    if (!confirm("Delete this discussion record?")) return;
    try {
      const res = await fetch(`/api/projects/discussions?discussionId=${discussionId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDiscussions(discussions.filter((d) => d.id !== discussionId));
        onRefresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Attachment Symbol Helper
  const getAttachmentIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "figma":
        return <span className="p-1.5 bg-purple-100 text-purple-700 rounded-lg font-black text-xs">🎨 Figma</span>;
      case "github":
        return <span className="p-1.5 bg-slate-900 text-white rounded-lg font-black text-xs">🐙 GitHub</span>;
      case "pdf":
        return <span className="p-1.5 bg-rose-100 text-rose-700 rounded-lg font-black text-xs">📄 PDF</span>;
      case "doc":
        return <span className="p-1.5 bg-blue-100 text-blue-700 rounded-lg font-black text-xs">📝 Spec</span>;
      case "image":
        return <span className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg font-black text-xs">🖼️ Mockup</span>;
      default:
        return <span className="p-1.5 bg-slate-100 text-slate-700 rounded-lg font-black text-xs">🔗 Link</span>;
    }
  };

  // Filter Logic
  const filteredProjects = projects.filter((p) => {
    if (statusFilter !== "ALL" && p.status !== statusFilter) return false;
    if (clientFilter !== "ALL" && p.clientId !== clientFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchClient =
        p.client?.name?.toLowerCase().includes(q) ||
        p.client?.company?.toLowerCase().includes(q);
      const matchSow = p.scopeOfWork?.toLowerCase().includes(q);
      if (!matchTitle && !matchClient && !matchSow) return false;
    }
    return true;
  });

  const totalApprovedRevenue = projects
    .filter((p) => p.isApproved && p.approvedAmount)
    .reduce((acc, p) => acc + (p.approvedAmount || 0), 0);

  const onboardCount = projects.filter((p) => p.status === "ONBOARD").length;
  const ongoingCount = projects.filter((p) => p.status === "ONGOING").length;
  const holdCount = projects.filter((p) => p.status === "HOLD").length;
  const completedCount = projects.filter((p) => p.status === "COMPLETED").length;

  return (
    <div className="space-y-6 w-full max-w-full">
      {/* Top Banner with Stats */}
      <div className="bg-gradient-to-r from-indigo-700 via-purple-700 to-blue-700 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-xs">
              <Briefcase className="w-6 h-6 text-indigo-200" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight">Software Projects, SOW &amp; Deal Pipeline</h2>
              <p className="text-xs text-indigo-100 mt-0.5">
                Manage client scopes of work, drag &amp; drop Kanban stages, approved estimations, and meeting discussions
              </p>
            </div>
          </div>
        </div>

        {/* Quick KPI Badges */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-white/15 backdrop-blur-xs px-4 py-2.5 rounded-xl border border-white/20 text-center min-w-[100px]">
            <div className="text-[10px] uppercase font-bold text-indigo-200 tracking-wider">Approved Value</div>
            <div className="text-xl font-black text-white mt-0.5">
              {"$"}{totalApprovedRevenue.toLocaleString()}
            </div>
          </div>

          <div className="bg-white/15 backdrop-blur-xs px-4 py-2.5 rounded-xl border border-white/20 text-center">
            <div className="text-[10px] uppercase font-bold text-blue-200 tracking-wider">Ongoing</div>
            <div className="text-xl font-black text-white mt-0.5">{ongoingCount}</div>
          </div>

          <div className="bg-white/15 backdrop-blur-xs px-4 py-2.5 rounded-xl border border-white/20 text-center">
            <div className="text-[10px] uppercase font-bold text-purple-200 tracking-wider">Onboard</div>
            <div className="text-xl font-black text-white mt-0.5">{onboardCount}</div>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="bg-white hover:bg-indigo-50 text-indigo-900 px-4 py-2.5 rounded-xl text-xs font-black shadow-md transition flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-indigo-700" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* Toolbar: Search, Filters, View Switcher */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search projects by title, client, or SOW keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          />
        </div>

        {/* Filter by Status */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="ALL">All Stages ({projects.length})</option>
          <option value="ONBOARD">Onboard ({onboardCount})</option>
          <option value="ONGOING">Ongoing ({ongoingCount})</option>
          <option value="HOLD">On Hold ({holdCount})</option>
          <option value="COMPLETED">Delivered ({completedCount})</option>
        </select>

        {/* Filter by Client */}
        <select
          value={clientFilter}
          onChange={(e) => setClientFilter(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="ALL">All Clients ({clients.length})</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.company || c.name}
            </option>
          ))}
        </select>

        {/* View Mode Switcher: Kanban vs Grid */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setViewMode("kanban")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              viewMode === "kanban"
                ? "bg-white text-indigo-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>Kanban Board</span>
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              viewMode === "grid"
                ? "bg-white text-indigo-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Grid Cards</span>
          </button>
        </div>
      </div>

      {/* Main View Area */}
      {viewMode === "kanban" ? (
        <ProjectKanbanBoard
          projects={filteredProjects}
          onOpenEdit={handleOpenEditModal}
          onOpenDiscussions={handleOpenDiscussions}
          onOpenSowModal={handleOpenSowModal}
          onStatusChange={handleStatusChange}
          onDeleteProject={handleDeleteProject}
        />
      ) : (
        /* Grid Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProjects.length === 0 ? (
            <div className="col-span-full text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
              <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-500">No projects match the criteria</p>
            </div>
          ) : (
            filteredProjects.map((project) => {
              const hasApproved =
                project.isApproved &&
                project.approvedAmount !== null &&
                project.approvedAmount !== undefined;
              const discCount =
                project.discussions?.length || project._count?.discussions || 0;
              const attCount =
                project.attachments?.length || project._count?.attachments || 0;

              return (
                <div
                  key={project.id}
                  className={`rounded-2xl p-5 shadow-xs hover:shadow-md transition space-y-4 flex flex-col justify-between border ${project.status === "ONGOING" ? "bg-gradient-to-b from-blue-50/90 to-blue-100/50 border-blue-300/80 text-blue-950" : project.status === "ONBOARD" ? "bg-gradient-to-b from-purple-50/90 to-purple-100/50 border-purple-300/80 text-purple-950" : project.status === "HOLD" ? "bg-gradient-to-b from-amber-50/90 to-amber-100/50 border-amber-300/80 text-amber-950" : "bg-gradient-to-b from-emerald-50/90 to-emerald-100/50 border-emerald-300/80 text-emerald-950"}`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-cyan-800 bg-cyan-50 px-2.5 py-1 rounded-lg border border-cyan-200">
                        <Building2 className="w-3.5 h-3.5 text-cyan-600" />
                        <span>{project.client?.company || project.client?.name}</span>
                      </span>

                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider ${
                          project.status === "ONGOING"
                            ? "bg-blue-100 text-blue-800 border border-blue-300"
                            : project.status === "ONBOARD"
                            ? "bg-purple-100 text-purple-800 border border-purple-300"
                            : project.status === "HOLD"
                            ? "bg-amber-100 text-amber-800 border border-amber-300"
                            : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        }`}
                      >
                        {project.status}
                      </span>
                    </div>

                    <h3 className="font-extrabold text-slate-900 text-base leading-snug">
                      {project.title}
                    </h3>

                    {/* Scope of Work with Attachments Indicator */}
                    {project.scopeOfWork ? (
                      <div
                        onClick={() => handleOpenSowModal(project)}
                        className="bg-slate-50 hover:bg-slate-100 p-3 rounded-xl border border-slate-200 cursor-pointer text-xs text-slate-600 transition"
                      >
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-400 mb-1">
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3 text-indigo-600" /> SOW Spec &amp; Attachments
                          </span>
                          <span className="text-indigo-600 font-bold hover:underline">View ({attCount} files)</span>
                        </div>
                        <p className="line-clamp-3 text-slate-700">{project.scopeOfWork}</p>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleOpenEditModal(project)}
                        className="w-full text-left p-2.5 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400 hover:text-indigo-600 transition"
                      >
                        + Add Scope of Work &amp; Attachments
                      </button>
                    )}

                    {/* Financial Estimations */}
                    <div className="space-y-2">
                      {hasApproved ? (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                          <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                            <span className="flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Client Approved
                            </span>
                            <span className="text-base font-black text-emerald-700">
                              {project.currency}
                              {Number(project.approvedAmount).toLocaleString()}
                            </span>
                          </div>
                          {project.approvedTimeframe && (
                            <div className="text-xs text-emerald-800 mt-1 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{project.approvedTimeframe}</span>
                            </div>
                          )}
                        </div>
                      ) : project.initialEstimation ? (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-center justify-between">
                          <span className="font-bold flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-amber-600" /> Initial Estimation:
                          </span>
                          <span className="font-extrabold">{project.initialEstimation}</span>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <button
                      onClick={() => handleOpenDiscussions(project)}
                      className="flex items-center space-x-1.5 text-indigo-600 hover:text-indigo-800 font-bold bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Discussions ({discCount})</span>
                    </button>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleOpenEditModal(project)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Edit Project"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProject(project.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Delete Project"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* SOW Full View Modal with Attachments */}
      {sowModalProject && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Scope of Work (SOW) &amp; Architecture Specs</span>
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-0.5">
                  {sowModalProject.title}
                </h3>
              </div>
              <button
                onClick={() => setSowModalProject(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* SOW Document Content */}
            <div className="overflow-y-auto space-y-4 flex-1">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-slate-800 text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
                {sowModalProject.scopeOfWork || "No detailed SOW written yet."}
              </div>

              {/* Attachments Section */}
              <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Project Attachments &amp; Design Specs ({sowAttachments.length})</span>
                  </h4>
                </div>

                {/* Add Attachment Form */}
                <form onSubmit={handleAddAttachment} className="space-y-2 bg-white p-3 rounded-xl border border-indigo-100">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="Attachment title (e.g. Figma Prototype)"
                      value={attName}
                      onChange={(e) => setAttName(e.target.value)}
                      className="text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                    />
                    <select
                      value={attType}
                      onChange={(e: any) => setAttType(e.target.value)}
                      className="text-xs px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none font-semibold"
                    >
                      <option value="figma">🎨 Figma Design</option>
                      <option value="github">🐙 GitHub Repo/PR</option>
                      <option value="pdf">📄 PDF Document</option>
                      <option value="doc">📝 Architecture Spec</option>
                      <option value="image">🖼️ UI Mockup</option>
                      <option value="link">🔗 Web Link</option>
                    </select>
                    <input
                      type="text"
                      placeholder="URL or file link..."
                      value={attUrl}
                      onChange={(e) => setAttUrl(e.target.value)}
                      className="text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer">
                      <Upload className="w-3 h-3" />
                      <span>Upload local file</span>
                      <input type="file" onChange={handleFileUpload} className="hidden" />
                    </label>

                    <button
                      type="submit"
                      disabled={savingAtt}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{savingAtt ? "Adding..." : "Add Attachment"}</span>
                    </button>
                  </div>
                </form>

                {/* Attachments List */}
                <div className="space-y-1.5">
                  {loadingAttachments ? (
                    <div className="text-center py-4 text-xs text-slate-400">Loading attachments...</div>
                  ) : sowAttachments.length === 0 ? (
                    <div className="text-center py-4 text-xs text-slate-400 italic">
                      No attachments added yet. Attach Figma, GitHub, or PDF specs above.
                    </div>
                  ) : (
                    sowAttachments.map((att) => (
                      <div
                        key={att.id}
                        className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center space-x-2 min-w-0 flex-1">
                          {getAttachmentIcon(att.fileType)}
                          <span className="font-bold text-slate-900 truncate">{att.name}</span>
                        </div>

                        <div className="flex items-center space-x-1.5 flex-shrink-0">
                          <a
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg font-bold flex items-center space-x-1"
                          >
                            <span>Open</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                          <button
                            onClick={() => handleDeleteAttachment(att.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <div className="text-xs text-slate-500">
                Client: <strong>{sowModalProject.client?.company || sowModalProject.client?.name}</strong>
              </div>
              <button
                onClick={() => {
                  const p = sowModalProject;
                  setSowModalProject(null);
                  handleOpenEditModal(p);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Project</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Project Modal */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {editingProject ? "Edit Software Project" : "Create Software Project"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Define architecture scope of work, estimation &amp; client approved budget
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsProjectModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProject} className="flex-1 overflow-y-auto space-y-4 py-4">
              {/* Project Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AI Customer Support Copilot, Mobile App MVP, FinTech High-Throughput Engine"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                />
              </div>

              {/* Client & Status Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Client *
                  </label>
                  <select
                    required
                    value={formClientId}
                    onChange={(e) => setFormClientId(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                  >
                    <option value="">Select client...</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.company ? `${c.company} (${c.name})` : c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Project Stage *
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as ProjectStatusType)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                  >
                    <option value="ONBOARD">🟣 Onboard (Scoping / Proposal)</option>
                    <option value="ONGOING">🔵 Ongoing (Active Delivery)</option>
                    <option value="HOLD">🟡 On Hold (Blocked / Awaiting Review)</option>
                    <option value="COMPLETED">🟢 Completed (Shipped / Signed off)</option>
                  </select>
                </div>
              </div>

              {/* Scope of Work (SOW) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Scope of Work (SOW) / Architecture Deliverables
                </label>
                <textarea
                  rows={4}
                  placeholder="Define technical deliverables, architectural blueprint, milestones, API endpoints, and sprint commitments..."
                  value={formScopeOfWork}
                  onChange={(e) => setFormScopeOfWork(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium leading-relaxed"
                />
              </div>

              {/* Initial Estimation */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Initial Estimation
                </label>
                <input
                  type="text"
                  placeholder="e.g. 120 Hours, 3 Sprints, 4-6 Weeks estimated"
                  value={formInitialEstimation}
                  onChange={(e) => setFormInitialEstimation(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              {/* Client Approved Estimation Box */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 space-y-3.5">
                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsApproved}
                      onChange={(e) => setFormIsApproved(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                    />
                    <span className="text-xs font-extrabold text-emerald-950">
                      Client Approved Estimation &amp; Budget
                    </span>
                  </label>
                  {formIsApproved && (
                    <span className="text-[10px] uppercase font-black bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">
                      Signed Off
                    </span>
                  )}
                </div>

                {formIsApproved && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div className="sm:col-span-1">
                      <label className="block text-[11px] font-bold text-emerald-900 mb-1">
                        Approved Amount
                      </label>
                      <div className="flex">
                        <select
                          value={formCurrency}
                          onChange={(e) => setFormCurrency(e.target.value)}
                          className="bg-white border border-emerald-300 rounded-l-xl px-2 text-xs font-bold text-emerald-900"
                        >
                          <option value="$">$ (USD)</option>
                          <option value="₹">₹ (INR)</option>
                          <option value="€">€ (EUR)</option>
                          <option value="£">£ (GBP)</option>
                        </select>
                        <input
                          type="number"
                          step="any"
                          placeholder="e.g. 6500"
                          value={formApprovedAmount}
                          onChange={(e) => setFormApprovedAmount(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-white border border-l-0 border-emerald-300 rounded-r-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 font-black text-emerald-950"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-emerald-900 mb-1">
                        Approved Timeframe
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 4 Weeks (Oct 1 - Oct 28)"
                        value={formApprovedTimeframe}
                        onChange={(e) => setFormApprovedTimeframe(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-emerald-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Start & Delivery Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Target Delivery Date
                  </label>
                  <input
                    type="date"
                    value={formTargetDeliveryDate}
                    onChange={(e) => setFormTargetDeliveryDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none font-medium"
                  />
                </div>
              </div>

              {/* Internal Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tech Notes &amp; Infrastructure
                </label>
                <textarea
                  rows={2}
                  placeholder="Staging cluster URLs, API keys, client Slack channels..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none font-medium"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsProjectModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProject}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-5 py-2.5 rounded-xl text-xs transition shadow-md flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {savingProject ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{editingProject ? "Update Project" : "Create Project"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Client Discussions Slide-over Drawer */}
      {discussionDrawerProject && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
            <div className="p-5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                  Client Discussion Timeline
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  {discussionDrawerProject.title}
                </h3>
                <p className="text-xs text-slate-500">
                  Client: {discussionDrawerProject.client?.company || discussionDrawerProject.client?.name}
                </p>
              </div>
              <button
                onClick={() => setDiscussionDrawerProject(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/40">
              {/* Form to log discussion */}
              <div className="bg-white rounded-2xl border border-indigo-100 shadow-xs p-4 space-y-3">
                <div className="flex items-center space-x-2 text-indigo-900 font-extrabold text-xs">
                  <MessageSquare className="w-4 h-4 text-indigo-600" />
                  <span>Log Client Discussion / Sprint Sync</span>
                </div>

                <form onSubmit={handleAddDiscussion} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        required
                        placeholder="Discussion Topic (e.g. SOW Milestone 1 Review)"
                        value={discTitle}
                        onChange={(e) => setDiscTitle(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                      />
                    </div>
                    <div>
                      <input
                        type="date"
                        required
                        value={discDate}
                        onChange={(e) => setDiscDate(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                      />
                    </div>
                  </div>

                  <textarea
                    rows={3}
                    required
                    placeholder="Discussion summary, architectural decisions made, feedback notes..."
                    value={discNotes}
                    onChange={(e) => setDiscNotes(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <input
                      type="text"
                      placeholder="Client Feedback (e.g. Approved sprint 1 demo)"
                      value={discFeedback}
                      onChange={(e) => setDiscFeedback(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white font-medium"
                    />
                    <input
                      type="text"
                      placeholder="Action Items (e.g. Deploy API to staging)"
                      value={discActionItems}
                      onChange={(e) => setDiscActionItems(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white font-medium"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={savingDisc}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-xs transition flex items-center space-x-1"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{savingDisc ? "Logging..." : "Log Discussion"}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Past Discussions */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Past Discussions ({discussions.length})
                </h4>

                {loadingDiscussions ? (
                  <div className="text-center py-6 text-slate-400 text-xs">Loading logs...</div>
                ) : discussions.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl">
                    No discussions logged for this project yet.
                  </div>
                ) : (
                  discussions.map((disc) => (
                    <div
                      key={disc.id}
                      className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-2 relative group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1 w-fit">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {new Date(disc.meetingDate).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                          <h5 className="font-extrabold text-slate-900 text-sm mt-1">
                            {disc.title}
                          </h5>
                        </div>

                        <button
                          onClick={() => handleDeleteDiscussion(disc.id)}
                          className="text-slate-300 hover:text-rose-600 p-1 opacity-0 group-hover:opacity-100 transition"
                          title="Delete discussion log"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                        {disc.discussionNotes}
                      </p>

                      {disc.clientFeedback && (
                        <div className="bg-blue-50/70 border border-blue-100 rounded-lg p-2 text-[11px] text-blue-900">
                          <strong>Client Feedback:</strong> {disc.clientFeedback}
                        </div>
                      )}

                      {disc.actionItems && (
                        <div className="bg-amber-50/70 border border-amber-100 rounded-lg p-2 text-[11px] text-amber-900">
                          <strong>Action Items:</strong> {disc.actionItems}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
