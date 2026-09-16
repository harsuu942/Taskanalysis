"use client";

import React, { useState } from "react";
import { LearningItem, LearningResourceType, LearningStatus } from "@/types";
import {
  BookOpen,
  Plus,
  Search,
  ExternalLink,
  Star,
  Tag,
  CheckCircle2,
  Clock,
  Bookmark,
  Sparkles,
  Code2,
  Cpu,
  Smartphone,
  Server,
  Layers,
  Globe,
  Edit3,
  Trash2,
  Check,
  Copy,
  AlertCircle,
  X,
} from "lucide-react";

interface LearningHubViewProps {
  items: LearningItem[];
  onRefresh: () => void;
}

export default function LearningHubView({
  items,
  onRefresh,
}: LearningHubViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LearningItem | null>(null);

  // Form Fields
  const [formTitle, setFormTitle] = useState("");
  const [formSubject, setFormSubject] = useState("AI");
  const [customSubject, setCustomSubject] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formResourceType, setFormResourceType] = useState<LearningResourceType>("ARTICLE");
  const [formStatus, setFormStatus] = useState<LearningStatus>("TO_LEARN");
  const [formNotes, setFormNotes] = useState("");
  const [formIsFavorite, setFormIsFavorite] = useState(false);
  const [formTags, setFormTags] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const predefinedSubjects = [
    "AI",
    "Flutter",
    "Backend",
    "Frontend",
    "System Design",
    "DevOps",
    "Cloud Architecture",
  ];

  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormTitle("");
    setFormSubject("AI");
    setCustomSubject("");
    setFormUrl("");
    setFormResourceType("ARTICLE");
    setFormStatus("TO_LEARN");
    setFormNotes("");
    setFormIsFavorite(false);
    setFormTags("");
    setError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: LearningItem) => {
    setEditingItem(item);
    setFormTitle(item.title || "");
    if (predefinedSubjects.includes(item.subject)) {
      setFormSubject(item.subject);
      setCustomSubject("");
    } else {
      setFormSubject("CUSTOM");
      setCustomSubject(item.subject);
    }
    setFormUrl(item.url || "");
    setFormResourceType(item.resourceType || "ARTICLE");
    setFormStatus(item.status || "TO_LEARN");
    setFormNotes(item.notes || "");
    setFormIsFavorite(Boolean(item.isFavorite));
    setFormTags(item.tags || "");
    setError(null);
    setIsModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setError("Title or topic name is required.");
      return;
    }

    const finalSubject =
      formSubject === "CUSTOM" ? customSubject.trim() || "General" : formSubject;

    setSaving(true);
    setError(null);

    try {
      const payload: any = {
        title: formTitle.trim(),
        subject: finalSubject,
        url: formUrl.trim() || null,
        resourceType: formResourceType,
        status: formStatus,
        notes: formNotes.trim() || null,
        isFavorite: formIsFavorite,
        tags: formTags.trim() || null,
      };

      const url = "/api/learning";
      const method = editingItem ? "PUT" : "POST";
      if (editingItem) {
        payload.id = editingItem.id;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save learning resource.");
      }

      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleFavorite = async (item: LearningItem) => {
    try {
      const res = await fetch("/api/learning", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, isFavorite: !item.isFavorite }),
      });
      if (res.ok) onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleStatusChange = async (item: LearningItem, newStatus: LearningStatus) => {
    try {
      const res = await fetch("/api/learning", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, status: newStatus }),
      });
      if (res.ok) onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm("Are you sure you want to delete this resource?")) return;
    try {
      const res = await fetch(`/api/learning/${id}`, { method: "DELETE" });
      if (res.ok) onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyUrl = (item: LearningItem) => {
    if (!item.url) return;
    navigator.clipboard.writeText(item.url);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Distinct Subject Styling
  const getSubjectBadgeStyle = (subject: string) => {
    switch (subject.toUpperCase()) {
      case "AI":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "FLUTTER":
        return "bg-cyan-100 text-cyan-800 border-cyan-300";
      case "BACKEND":
        return "bg-indigo-100 text-indigo-800 border-indigo-300";
      case "FRONTEND":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "SYSTEM DESIGN":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "DEVOPS":
        return "bg-rose-100 text-rose-800 border-rose-300";
      default:
        return "bg-purple-100 text-purple-800 border-purple-300";
    }
  };

  const getSubjectIcon = (subject: string) => {
    switch (subject.toUpperCase()) {
      case "AI":
        return <Cpu className="w-3.5 h-3.5" />;
      case "FLUTTER":
        return <Smartphone className="w-3.5 h-3.5" />;
      case "BACKEND":
        return <Server className="w-3.5 h-3.5" />;
      case "FRONTEND":
        return <Globe className="w-3.5 h-3.5" />;
      case "SYSTEM DESIGN":
        return <Layers className="w-3.5 h-3.5" />;
      default:
        return <BookOpen className="w-3.5 h-3.5" />;
    }
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    if (selectedSubject !== "ALL" && item.subject !== selectedSubject) return false;
    if (statusFilter !== "ALL" && item.status !== statusFilter) return false;
    if (onlyFavorites && !item.isFavorite) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchNotes = item.notes?.toLowerCase().includes(q);
      const matchTags = item.tags?.toLowerCase().includes(q);
      const matchUrl = item.url?.toLowerCase().includes(q);
      if (!matchTitle && !matchNotes && !matchTags && !matchUrl) return false;
    }
    return true;
  });

  // Extract all unique subjects
  const allSubjects = Array.from(new Set(items.map((i) => i.subject))).filter(Boolean);

  const masteredCount = items.filter((i) => i.status === "COMPLETED").length;
  const learningCount = items.filter((i) => i.status === "IN_PROGRESS").length;

  return (
    <div className="space-y-6 w-full">
      {/* Top Banner with Stats */}
      <div className="bg-gradient-to-r from-teal-900 via-emerald-950 to-cyan-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-emerald-800">
        <div>
          <div className="inline-flex items-center space-x-2 bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-xs font-bold border border-emerald-400/30 mb-2">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Curated Engineering Knowledge Hub &amp; Misc Topics</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Learning Links &amp; Subject Index
          </h2>
          <p className="text-xs sm:text-sm text-emerald-200 mt-1 max-w-xl">
            Bookmark top tutorials, architecture articles, repos, and research papers across
            AI, Flutter, Backend, and System Design with key takeaways.
          </p>
        </div>

        {/* Quick KPI Badges */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 text-center min-w-[90px]">
            <div className="text-[10px] uppercase font-bold text-emerald-200 tracking-wider">Mastered</div>
            <div className="text-xl font-black text-emerald-400 mt-0.5">{masteredCount}</div>
          </div>

          <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 text-center min-w-[90px]">
            <div className="text-[10px] uppercase font-bold text-cyan-200 tracking-wider">In Progress</div>
            <div className="text-xl font-black text-white mt-0.5">{learningCount}</div>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-4 py-2.5 rounded-2xl text-xs font-black shadow-lg transition flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Resource</span>
          </button>
        </div>
      </div>

      {/* Subject Filter Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedSubject("ALL")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            selectedSubject === "ALL"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          All Topics ({items.length})
        </button>

        {predefinedSubjects.map((sub) => {
          const count = items.filter((i) => i.subject === sub).length;
          return (
            <button
              key={sub}
              onClick={() => setSelectedSubject(sub)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 whitespace-nowrap ${
                selectedSubject === sub
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {getSubjectIcon(sub)}
              <span>{sub}</span>
              {count > 0 && (
                <span
                  className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    selectedSubject === sub ? "bg-white/25 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Toolbar: Search, Status, Favorites Toggle */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by topic, notes, tags, or link..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="ALL">All Statuses</option>
          <option value="TO_LEARN">To Learn / Backlog</option>
          <option value="IN_PROGRESS">Currently Learning</option>
          <option value="COMPLETED">Mastered / Completed</option>
          <option value="BOOKMARKED">Bookmarked for Reference</option>
        </select>

        {/* Only Favorites Toggle */}
        <button
          onClick={() => setOnlyFavorites(!onlyFavorites)}
          className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 border ${
            onlyFavorites
              ? "bg-amber-100 border-amber-300 text-amber-900"
              : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Star
            className={`w-3.5 h-3.5 ${onlyFavorites ? "text-amber-500 fill-amber-500" : "text-slate-400"}`}
          />
          <span>Favorites Only</span>
        </button>
      </div>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredItems.length === 0 ? (
          <div className="col-span-full text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-500">No learning resources match the filters</p>
            <button
              onClick={handleOpenCreateModal}
              className="mt-3 text-xs text-emerald-600 hover:underline font-bold"
            >
              + Add a topic or tutorial link
            </button>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header: Subject Badge & Favorite */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${getSubjectBadgeStyle(
                        item.subject
                      )}`}
                    >
                      {getSubjectIcon(item.subject)}
                      <span>{item.subject}</span>
                    </span>

                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md uppercase">
                      {item.resourceType}
                    </span>
                  </div>

                  <button
                    onClick={() => handleToggleFavorite(item)}
                    className="p-1 rounded-lg text-slate-300 hover:text-amber-400 transition"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        item.isFavorite ? "text-amber-400 fill-amber-400" : ""
                      }`}
                    />
                  </button>
                </div>

                {/* Title */}
                <h4 className="font-extrabold text-slate-900 text-sm leading-snug">
                  {item.title}
                </h4>

                {/* URL Link Bar */}
                {item.url && (
                  <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 text-xs">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 font-bold truncate flex-1 hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5 flex-shrink-0 text-blue-500" />
                      <span className="truncate">{item.url}</span>
                    </a>

                    <button
                      onClick={() => handleCopyUrl(item)}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded transition"
                      title="Copy URL"
                    >
                      {copiedId === item.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                )}

                {/* Notes */}
                {item.notes && (
                  <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/60 text-xs text-slate-700 leading-relaxed">
                    <span className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">
                      Key Takeaways &amp; Code:
                    </span>
                    <p className="line-clamp-3 whitespace-pre-wrap">{item.notes}</p>
                  </div>
                )}

                {/* Tags */}
                {item.tags && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {item.tags.split(",").map((t, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md"
                      >
                        #{t.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer Controls: Status Dropdown & Edit/Delete */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <select
                  value={item.status}
                  onChange={(e) => handleStatusChange(item, e.target.value as LearningStatus)}
                  className={`text-[11px] font-bold py-1 px-2 rounded-lg border focus:outline-none cursor-pointer ${
                    item.status === "COMPLETED"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : item.status === "IN_PROGRESS"
                      ? "bg-blue-50 text-blue-800 border-blue-200"
                      : "bg-slate-50 text-slate-700 border-slate-200"
                  }`}
                >
                  <option value="TO_LEARN">To Learn</option>
                  <option value="IN_PROGRESS">Learning</option>
                  <option value="COMPLETED">Mastered</option>
                  <option value="BOOKMARKED">Bookmarked</option>
                </select>

                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => handleOpenEditModal(item)}
                    className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                    title="Edit resource"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Delete resource"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Resource Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {editingItem ? "Edit Learning Resource" : "Add Learning Resource"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Bookmark tutorials, documentation, and architecture notes
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

            <form onSubmit={handleSaveItem} className="flex-1 overflow-y-auto space-y-4 py-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Topic / Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Building Multi-Agent RAG with LangGraph & Gemini"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                />
              </div>

              {/* Subject Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Subject / Domain *
                  </label>
                  <select
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                  >
                    {predefinedSubjects.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                    <option value="CUSTOM">+ Custom Subject...</option>
                  </select>
                </div>

                {formSubject === "CUSTOM" && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Specify Custom Subject *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rust, Microservices, WebAssembly"
                      value={customSubject}
                      onChange={(e) => setCustomSubject(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Resource Type
                  </label>
                  <select
                    value={formResourceType}
                    onChange={(e) => setFormResourceType(e.target.value as LearningResourceType)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                  >
                    <option value="ARTICLE">Article / Blog</option>
                    <option value="VIDEO">Video / Talk</option>
                    <option value="REPO">GitHub Repository</option>
                    <option value="DOCS">Official Documentation</option>
                    <option value="COURSE">Course / Workshop</option>
                    <option value="BOOK">Book / Paper</option>
                  </select>
                </div>
              </div>

              {/* URL */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Resource Link (URL)
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              {/* Status & Favorite */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Progress Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as LearningStatus)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                  >
                    <option value="TO_LEARN">To Learn / Backlog</option>
                    <option value="IN_PROGRESS">Currently Learning</option>
                    <option value="COMPLETED">Mastered / Completed</option>
                    <option value="BOOKMARKED">Bookmarked for Reference</option>
                  </select>
                </div>

                <div className="flex items-center pt-6">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsFavorite}
                      onChange={(e) => setFormIsFavorite(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                    />
                    <span className="text-xs font-bold text-slate-700">
                      Add to Favorites ⭐
                    </span>
                  </label>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. gemini, llm, agents, flutter3, concurrency"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              {/* Key Notes & Code Snippets */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Key Notes &amp; Insights
                </label>
                <textarea
                  rows={3}
                  placeholder="Write quick takeaways, command snippets, or key architectural patterns..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium leading-relaxed"
                />
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
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-5 py-2.5 rounded-xl text-xs transition shadow-md flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {saving ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{editingItem ? "Update Resource" : "Save Resource"}</span>
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
