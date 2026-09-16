"use client";

import React, { useState } from "react";
import {
  ProductIdea,
  ProductExecutionPhase,
  ProductIdeaStatus,
  ExecutionPhaseStatus,
  PriorityType,
} from "@/types";
import {
  Lightbulb,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  TrendingUp,
  Target,
  Layers,
  ArrowRight,
  Edit3,
  Trash2,
  Check,
  CheckSquare,
  Square,
  Milestone,
} from "lucide-react";

interface ProductIdeasViewProps {
  ideas: ProductIdea[];
  onRefresh: () => void;
}

export default function ProductIdeasView({
  ideas,
  onRefresh,
}: ProductIdeasViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIdea, setEditingIdea] = useState<ProductIdea | null>(null);

  // Form Fields
  const [formTitle, setFormTitle] = useState("");
  const [formTagline, setFormTagline] = useState("");
  const [formCategory, setFormCategory] = useState("SaaS");
  const [formStatus, setFormStatus] = useState<ProductIdeaStatus>("BRAINSTORMING");
  const [formPriority, setFormPriority] = useState<PriorityType>("MEDIUM");
  const [formProblemStatement, setFormProblemStatement] = useState("");
  const [formTargetAudience, setFormTargetAudience] = useState("");
  const [formValueProposition, setFormValueProposition] = useState("");
  const [formTargetLaunchDate, setFormTargetLaunchDate] = useState("");
  const [formEstimatedBudget, setFormEstimatedBudget] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formPhases, setFormPhases] = useState<
    {
      title: string;
      description?: string;
      order: number;
      startDate?: string;
      endDate?: string;
      status: ExecutionPhaseStatus;
      deliverables?: string;
    }[]
  >([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenCreateModal = () => {
    setEditingIdea(null);
    setFormTitle("");
    setFormTagline("");
    setFormCategory("SaaS");
    setFormStatus("BRAINSTORMING");
    setFormPriority("MEDIUM");
    setFormProblemStatement("");
    setFormTargetAudience("");
    setFormValueProposition("");
    setFormTargetLaunchDate("");
    setFormEstimatedBudget("");
    setFormNotes("");
    setFormPhases([
      {
        title: "Phase 1: Research & Tech Stack Definition",
        order: 0,
        status: "COMPLETED",
        deliverables: "Market research, user persona analysis, architecture blueprint",
      },
      {
        title: "Phase 2: MVP Development",
        order: 1,
        status: "IN_PROGRESS",
        deliverables: "Core workflow implementation, database schema, functional prototype",
      },
      {
        title: "Phase 3: Beta Launch & User Feedback",
        order: 2,
        status: "PLANNED",
        deliverables: "Onboarding first 10 pilot users, telemetry setup, feature refinements",
      },
    ]);
    setError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (idea: ProductIdea) => {
    setEditingIdea(idea);
    setFormTitle(idea.title || "");
    setFormTagline(idea.tagline || "");
    setFormCategory(idea.category || "SaaS");
    setFormStatus(idea.status || "BRAINSTORMING");
    setFormPriority(idea.priority || "MEDIUM");
    setFormProblemStatement(idea.problemStatement || "");
    setFormTargetAudience(idea.targetAudience || "");
    setFormValueProposition(idea.valueProposition || "");
    setFormTargetLaunchDate(
      idea.targetLaunchDate ? idea.targetLaunchDate.split("T")[0] : ""
    );
    setFormEstimatedBudget(idea.estimatedBudget ? String(idea.estimatedBudget) : "");
    setFormNotes(idea.notes || "");
    setFormPhases(
      idea.phases && idea.phases.length > 0
        ? idea.phases.map((p, idx) => ({
            title: p.title,
            description: p.description || "",
            order: p.order !== undefined ? p.order : idx,
            startDate: p.startDate ? p.startDate.split("T")[0] : "",
            endDate: p.endDate ? p.endDate.split("T")[0] : "",
            status: p.status,
            deliverables: p.deliverables || "",
          }))
        : []
    );
    setError(null);
    setIsModalOpen(true);
  };

  const handleAddPhase = () => {
    setFormPhases([
      ...formPhases,
      {
        title: `Phase ${formPhases.length + 1}: `,
        order: formPhases.length,
        status: "PLANNED",
        deliverables: "",
      },
    ]);
  };

  const handleRemovePhase = (index: number) => {
    setFormPhases(formPhases.filter((_, idx) => idx !== index));
  };

  const handlePhaseChange = (index: number, field: string, value: any) => {
    const updated = [...formPhases];
    updated[index] = { ...updated[index], [field]: value };
    setFormPhases(updated);
  };

  const handleSaveIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setError("Idea title is required.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload: any = {
        title: formTitle.trim(),
        tagline: formTagline.trim() || null,
        category: formCategory,
        status: formStatus,
        priority: formPriority,
        problemStatement: formProblemStatement.trim() || null,
        targetAudience: formTargetAudience.trim() || null,
        valueProposition: formValueProposition.trim() || null,
        targetLaunchDate: formTargetLaunchDate || null,
        estimatedBudget: formEstimatedBudget ? Number(formEstimatedBudget) : null,
        notes: formNotes.trim() || null,
        phases: formPhases.map((p, idx) => ({
          title: p.title.trim() || `Phase ${idx + 1}`,
          description: p.description?.trim() || null,
          order: idx,
          startDate: p.startDate || null,
          endDate: p.endDate || null,
          status: p.status,
          deliverables: p.deliverables?.trim() || null,
        })),
      };

      const url = "/api/ideas";
      const method = editingIdea ? "PUT" : "POST";
      if (editingIdea) {
        payload.id = editingIdea.id;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save product idea.");
      }

      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteIdea = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product idea and its roadmap?")) {
      return;
    }
    try {
      const res = await fetch(`/api/ideas/${id}`, { method: "DELETE" });
      if (res.ok) onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  // Filter Logic
  const filteredIdeas = ideas.filter((idea) => {
    if (categoryFilter !== "ALL" && idea.category !== categoryFilter) return false;
    if (statusFilter !== "ALL" && idea.status !== statusFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchTitle = idea.title.toLowerCase().includes(q);
      const matchTag = idea.tagline?.toLowerCase().includes(q);
      const matchProb = idea.problemStatement?.toLowerCase().includes(q);
      const matchVal = idea.valueProposition?.toLowerCase().includes(q);
      if (!matchTitle && !matchTag && !matchProb && !matchVal) return false;
    }
    return true;
  });

  const categories = [
    "ALL",
    "SaaS",
    "Mobile App",
    "AI Product",
    "Developer Tool",
    "Platform",
    "Internal System",
  ];

  return (
    <div className="space-y-6 w-full">
      {/* Top Banner with Stats */}
      <div className="bg-gradient-to-r from-violet-900 via-purple-900 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-purple-800">
        <div>
          <div className="inline-flex items-center space-x-2 bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-xs font-bold border border-purple-400/30 mb-2">
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Product Incubator &amp; Strategic Roadmap</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Product Ideas &amp; Execution Timeline
          </h2>
          <p className="text-xs sm:text-sm text-purple-200 mt-1 max-w-xl">
            Incubate proprietary products, map out execution phases, visualize milestones
            on a Gantt-style timeline, and track launch deliverables.
          </p>
        </div>

        {/* Quick KPI Badges */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 text-center min-w-[90px]">
            <div className="text-[10px] uppercase font-bold text-purple-200 tracking-wider">Total Ideas</div>
            <div className="text-xl font-black text-white mt-0.5">{ideas.length}</div>
          </div>

          <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 text-center min-w-[90px]">
            <div className="text-[10px] uppercase font-bold text-emerald-300 tracking-wider">In Execution</div>
            <div className="text-xl font-black text-emerald-400 mt-0.5">
              {ideas.filter((i) => i.status === "IN_EXECUTION").length}
            </div>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white px-4 py-2.5 rounded-2xl text-xs font-black shadow-lg transition flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Product Idea</span>
          </button>
        </div>
      </div>

      {/* Toolbar: Filters & Search */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search ideas by title, problem, or value proposition..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
          />
        </div>

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat === "ALL" ? "All Categories" : cat}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="ALL">All Lifecycle Statuses</option>
          <option value="BRAINSTORMING">Brainstorming</option>
          <option value="VALIDATING">Validating</option>
          <option value="PLANNING">Planning</option>
          <option value="IN_EXECUTION">In Execution</option>
          <option value="LAUNCHED">Launched</option>
          <option value="ON_HOLD">On Hold</option>
        </select>
      </div>

      {/* Ideas List with Timelines */}
      <div className="space-y-6">
        {filteredIdeas.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200">
            <Lightbulb className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-500">No product ideas match the filters</p>
            <button
              onClick={handleOpenCreateModal}
              className="mt-3 text-xs text-purple-600 hover:underline font-bold"
            >
              + Create your first product idea
            </button>
          </div>
        ) : (
          filteredIdeas.map((idea) => {
            const phases = idea.phases || [];
            const completedPhases = phases.filter((p) => p.status === "COMPLETED").length;
            const progressPercent =
              phases.length > 0 ? Math.round((completedPhases / phases.length) * 100) : 0;

            return (
              <div
                key={idea.id}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition space-y-6"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                        {idea.category}
                      </span>

                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                          idea.status === "IN_EXECUTION"
                            ? "bg-blue-100 text-blue-800 border border-blue-200"
                            : idea.status === "LAUNCHED"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : idea.status === "VALIDATING"
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}
                      >
                        {idea.status.replace("_", " ")}
                      </span>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          idea.priority === "URGENT" || idea.priority === "HIGH"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-slate-50 text-slate-600"
                        }`}
                      >
                        Priority: {idea.priority}
                      </span>
                    </div>

                    <h3 className="text-xl font-black text-slate-900 leading-tight">
                      {idea.title}
                    </h3>
                    {idea.tagline && (
                      <p className="text-xs text-slate-500 font-medium">{idea.tagline}</p>
                    )}
                  </div>

                  {/* Actions & Target Launch */}
                  <div className="flex sm:flex-col items-end justify-between sm:justify-start gap-2 flex-shrink-0">
                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => handleOpenEditModal(idea)}
                        className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition"
                        title="Edit Idea & Phases"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteIdea(idea.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                        title="Delete Idea"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {idea.targetLaunchDate && (
                      <div className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg flex items-center gap-1">
                        <Target className="w-3.5 h-3.5 text-purple-600" />
                        <span>
                          Launch:{" "}
                          {new Date(idea.targetLaunchDate).toLocaleDateString("en-US", {
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Problem Statement & Value Proposition Snippets */}
                {(idea.problemStatement || idea.valueProposition) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                    {idea.problemStatement && (
                      <div>
                        <span className="font-extrabold uppercase text-[10px] text-slate-400 tracking-wider block mb-1">
                          Problem Solved
                        </span>
                        <p className="text-slate-700 leading-relaxed">{idea.problemStatement}</p>
                      </div>
                    )}
                    {idea.valueProposition && (
                      <div>
                        <span className="font-extrabold uppercase text-[10px] text-slate-400 tracking-wider block mb-1">
                          Value Proposition &amp; Advantage
                        </span>
                        <p className="text-slate-700 leading-relaxed">{idea.valueProposition}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Execution Plan & Visual Timeline Section */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Milestone className="w-4 h-4 text-purple-600" />
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                        Execution Plan &amp; Timeline Phases ({phases.length})
                      </h4>
                    </div>
                    <div className="text-xs font-bold text-slate-500 flex items-center space-x-2">
                      <span>Progress:</span>
                      <div className="w-24 bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-purple-600 h-full rounded-full transition-all"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <span className="text-purple-700 font-extrabold text-[11px]">
                        {progressPercent}%
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Timeline Ribbon */}
                  {phases.length === 0 ? (
                    <div className="text-xs text-slate-400 italic py-2">
                      No execution phases mapped yet. Click Edit to add roadmap milestones.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pt-1">
                      {phases.map((phase, idx) => {
                        const isCompleted = phase.status === "COMPLETED";
                        const isInProgress = phase.status === "IN_PROGRESS";

                        return (
                          <div
                            key={phase.id || idx}
                            className={`p-3.5 rounded-2xl border text-xs flex flex-col justify-between space-y-2.5 transition ${
                              isCompleted
                                ? "bg-emerald-50/70 border-emerald-200 text-emerald-950"
                                : isInProgress
                                ? "bg-blue-50/80 border-blue-300 text-blue-950 shadow-2xs"
                                : "bg-slate-50/80 border-slate-200 text-slate-800"
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase text-slate-400">
                                  Phase {idx + 1}
                                </span>
                                <span
                                  className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                                    isCompleted
                                      ? "bg-emerald-200 text-emerald-900"
                                      : isInProgress
                                      ? "bg-blue-200 text-blue-900 animate-pulse"
                                      : "bg-slate-200 text-slate-700"
                                  }`}
                                >
                                  {phase.status.replace("_", " ")}
                                </span>
                              </div>

                              <h5 className="font-bold text-xs leading-snug">{phase.title}</h5>

                              {(phase.startDate || phase.endDate) && (
                                <div className="text-[10px] text-slate-500 flex items-center gap-1 pt-0.5">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  <span>
                                    {phase.startDate ? phase.startDate.split("T")[0] : "Start"} →{" "}
                                    {phase.endDate ? phase.endDate.split("T")[0] : "TBD"}
                                  </span>
                                </div>
                              )}
                            </div>

                            {phase.deliverables && (
                              <div className="pt-2 border-t border-slate-200/60 text-[11px] text-slate-600 leading-snug">
                                <span className="font-bold text-slate-400 block text-[9px] uppercase">
                                  Deliverables:
                                </span>
                                <span className="italic">{phase.deliverables}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Idea Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                  <Lightbulb className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {editingIdea ? "Edit Product Idea & Timeline" : "New Product Idea & Timeline"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Map concept, validation, and multi-phase execution milestones
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mt-3 bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSaveIdea} className="flex-1 overflow-y-auto space-y-5 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PromptForge, FlutterKit Pro, AI Audit Copilot"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold"
                  >
                    <option value="SaaS">SaaS Platform</option>
                    <option value="Mobile App">Mobile App</option>
                    <option value="AI Product">AI / LLM Product</option>
                    <option value="Developer Tool">Developer Tool</option>
                    <option value="Platform">Platform / Marketplace</option>
                    <option value="Internal System">Internal System</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tagline / One-liner
                </label>
                <input
                  type="text"
                  placeholder="e.g. AI-driven test case generator for Flutter and Next.js teams"
                  value={formTagline}
                  onChange={(e) => setFormTagline(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Lifecycle Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as ProductIdeaStatus)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold"
                  >
                    <option value="BRAINSTORMING">💡 Brainstorming</option>
                    <option value="VALIDATING">🔍 Validating</option>
                    <option value="PLANNING">📐 Planning</option>
                    <option value="IN_EXECUTION">⚡ In Execution</option>
                    <option value="LAUNCHED">🚀 Launched</option>
                    <option value="ON_HOLD">⏸️ On Hold</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Priority
                  </label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as PriorityType)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Target Launch Date
                  </label>
                  <input
                    type="date"
                    value={formTargetLaunchDate}
                    onChange={(e) => setFormTargetLaunchDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                  />
                </div>
              </div>

              {/* Problem & Value Proposition */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Problem Solved
                  </label>
                  <textarea
                    rows={2}
                    placeholder="What friction or gap does this solve?"
                    value={formProblemStatement}
                    onChange={(e) => setFormProblemStatement(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Value Proposition
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Why will customers choose this over alternatives?"
                    value={formValueProposition}
                    onChange={(e) => setFormValueProposition(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                  />
                </div>
              </div>

              {/* Execution Phases Builder */}
              <div className="border-t border-slate-200 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Milestone className="w-4 h-4 text-purple-600" />
                    <label className="text-xs font-black text-slate-800 uppercase tracking-wider">
                      Execution Phases &amp; Timeline Roadmap
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddPhase}
                    className="text-xs font-extrabold text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-xl transition flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Phase</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {formPhases.map((phase, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2.5 relative"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-black uppercase text-slate-400">
                          Phase {idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemovePhase(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div className="sm:col-span-2">
                          <input
                            type="text"
                            placeholder="Phase Title (e.g. Architecture & Wireframing)"
                            value={phase.title}
                            onChange={(e) => handlePhaseChange(idx, "title", e.target.value)}
                            className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 font-bold"
                          />
                        </div>
                        <div>
                          <select
                            value={phase.status}
                            onChange={(e) => handlePhaseChange(idx, "status", e.target.value)}
                            className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 font-semibold"
                          >
                            <option value="PLANNED">Planned</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="COMPLETED">Completed</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <input
                          type="date"
                          placeholder="Start Date"
                          value={phase.startDate || ""}
                          onChange={(e) => handlePhaseChange(idx, "startDate", e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-medium"
                        />
                        <input
                          type="date"
                          placeholder="End Date"
                          value={phase.endDate || ""}
                          onChange={(e) => handlePhaseChange(idx, "endDate", e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-medium"
                        />
                      </div>

                      <input
                        type="text"
                        placeholder="Deliverables checklist (e.g. Landing page live, DB setup, beta API)"
                        value={phase.deliverables || ""}
                        onChange={(e) => handlePhaseChange(idx, "deliverables", e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-medium"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-black px-5 py-2.5 rounded-xl text-xs transition shadow-md flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {saving ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{editingIdea ? "Update Idea" : "Create Idea"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
