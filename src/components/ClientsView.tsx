"use client";

import React, { useState } from "react";
import { Client, User } from "@/types";
import {
  Building2,
  Mail,
  Phone,
  Plus,
  Search,
  Users,
  Briefcase,
  FileText,
  X,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  Edit3,
} from "lucide-react";

interface ClientsViewProps {
  clients: Client[];
  currentUser: User | null;
  onClientCreated: () => void;
  onOpenCreateTaskForClient?: (clientId: string) => void;
}

export default function ClientsView({
  clients,
  currentUser,
  onClientCreated,
  onOpenCreateTaskForClient,
}: ClientsViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ACTIVE" | "ALL" | "PROSPECT">("ACTIVE");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "PROSPECT" | "INACTIVE">("ACTIVE");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isClientActive = (c: Client) => {
    if (c.status === "PROSPECT" || c.status === "INACTIVE") return false;
    return true;
  };

  const activeClientsCount = clients.filter(isClientActive).length;
  const prospectsCount = clients.filter((c) => c.status === "PROSPECT").length;

  const handleOpenAddModal = () => {
    setEditingClient(null);
    setName("");
    setCompany("");
    setEmail("");
    setPhone("");
    setNotes("");
    setStatus("ACTIVE");
    setError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (client: Client) => {
    setEditingClient(client);
    setName(client.name || "");
    setCompany(client.company || "");
    setEmail(client.email || "");
    setPhone(client.phone || "");
    setNotes(client.notes || "");
    setStatus(client.status || "ACTIVE");
    setError(null);
    setIsModalOpen(true);
  };

  const filteredClients = clients.filter((c) => {
    if (statusFilter === "ACTIVE" && !isClientActive(c)) return false;
    if (statusFilter === "PROSPECT" && c.status !== "PROSPECT") return false;
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      (c.company && c.company.toLowerCase().includes(term)) ||
      (c.email && c.email.toLowerCase().includes(term)) ||
      (c.phone && c.phone.includes(term))
    );
  });

  const totalClientTasks = clients.reduce(
    (acc, c) => acc + (c._count?.tasks || 0),
    0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Client contact person name is required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const isEditing = !!editingClient;
      const url = "/api/clients";
      const method = isEditing ? "PUT" : "POST";
      const payload: any = {
        name: name.trim(),
        company: company.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        notes: notes.trim() || null,
        status,
      };

      if (isEditing) {
        payload.id = editingClient.id;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || (isEditing ? "Failed to update client" : "Failed to create client"));
      }

      onClientCreated();
      setIsModalOpen(false);
      setEditingClient(null);
      // Reset form
      setName("");
      setCompany("");
      setEmail("");
      setPhone("");
      setNotes("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* Top Banner with Stats */}
      <div className="bg-gradient-to-r from-cyan-700 via-blue-700 to-indigo-700 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-xs">
              <Building2 className="w-6 h-6 text-cyan-200" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight">Client Directory &amp; Tech Accounts</h2>
              <p className="text-xs text-cyan-100 mt-0.5">
                Manage tech startups, SaaS founders, and software engineering consulting accounts
              </p>
            </div>
          </div>
        </div>

        {/* Quick KPI Cards & Add Client button */}
        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
          <div className="bg-white/15 backdrop-blur-xs px-4 py-2.5 rounded-xl border border-white/20 text-center">
            <div className="text-[10px] uppercase font-bold text-emerald-200 tracking-wider">Active Clients</div>
            <div className="text-xl font-extrabold text-white mt-0.5">{activeClientsCount}</div>
          </div>

          <div className="bg-white/15 backdrop-blur-xs px-4 py-2.5 rounded-xl border border-white/20 text-center">
            <div className="text-[10px] uppercase font-bold text-indigo-200 tracking-wider">Prospects</div>
            <div className="text-xl font-extrabold text-white mt-0.5">{prospectsCount}</div>
          </div>

          <div className="bg-white/15 backdrop-blur-xs px-4 py-2.5 rounded-xl border border-white/20 text-center">
            <div className="text-[10px] uppercase font-bold text-cyan-200 tracking-wider">Total Clients</div>
            <div className="text-xl font-extrabold text-white mt-0.5">{clients.length}</div>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="bg-white hover:bg-cyan-50 text-cyan-900 px-4 py-2.5 rounded-xl text-xs font-extrabold shadow-md transition flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-cyan-700" />
            <span>Add Client</span>
          </button>
        </div>
      </div>

      {/* Toolbar: Search Bar & Active / All / Prospects Tabs */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search clients by name, company, email, or phone number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-medium"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setStatusFilter("ACTIVE")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
              statusFilter === "ACTIVE"
                ? "bg-white text-emerald-800 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Active Clients ({activeClientsCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              statusFilter === "ALL"
                ? "bg-white text-cyan-800 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All Clients ({clients.length})
          </button>

          <button
            onClick={() => setStatusFilter("PROSPECT")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
              statusFilter === "PROSPECT"
                ? "bg-white text-indigo-800 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
            <span>Prospects ({prospectsCount})</span>
          </button>
        </div>

        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
          >
            Clear
          </button>
        )}
      </div>

      {/* Clients List / Table View */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h4 className="text-sm font-bold text-slate-800">
              {statusFilter === "ACTIVE"
                ? "Active Client Accounts"
                : statusFilter === "PROSPECT"
                ? "Prospects & Inquiries"
                : "All Client Directory"} ({filteredClients.length})
            </h4>
            {statusFilter === "ACTIVE" && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Live Consulting Clients
              </span>
            )}
          </div>
          <span className="text-xs text-slate-500 font-medium">
            List Format
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Client / Company</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4">Contact Person</th>
                <th className="py-3 px-4">Email & Phone</th>
                <th className="py-3 px-4">Projects & Scope</th>
                <th className="py-3 px-4 text-center">Associated Tasks</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <div className="text-sm font-bold text-slate-700">No clients found</div>
                    <p className="text-xs text-slate-400 mt-1">
                      {statusFilter === "ACTIVE"
                        ? "No currently active clients. Onboard an inquiry project to automatically add them here!"
                        : searchTerm
                        ? "No client matches your search filter."
                        : "Get started by adding your first client account."}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-slate-50 transition">
                    {/* Company */}
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-2xs flex-shrink-0">
                          {client.company ? client.company.slice(0, 2).toUpperCase() : client.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-900 text-xs">
                            {client.company || client.name}
                          </div>
                          {client.company && (
                            <div className="text-[10px] text-slate-400 font-normal">
                              Enterprise Account
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Account Status Badge */}
                    <td className="py-3.5 px-4">
                      {isClientActive(client) ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          Active Client
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                          Prospect / Lead
                        </span>
                      )}
                    </td>

                    {/* Contact Person */}
                    <td className="py-3.5 px-4 text-slate-800 font-semibold">
                      {client.name}
                    </td>

                    {/* Email & Phone */}
                    <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                      <div className="space-y-0.5">
                        {client.email && (
                          <div className="flex items-center space-x-1.5">
                            <Mail className="w-3 h-3 text-slate-400 flex-shrink-0" />
                            <span>{client.email}</span>
                          </div>
                        )}
                        {client.phone && (
                          <div className="flex items-center space-x-1.5 text-slate-500">
                            <Phone className="w-3 h-3 text-slate-400 flex-shrink-0" />
                            <span>{client.phone}</span>
                          </div>
                        )}
                        {!client.email && !client.phone && (
                          <span className="text-slate-400 italic">No contact details</span>
                        )}
                      </div>
                    </td>

                    {/* Projects & Scope / Notes */}
                    <td className="py-3.5 px-4 text-slate-600 text-[11px] max-w-xs">
                      {client.projects && client.projects.length > 0 && (
                        <div className="flex items-center gap-1 mb-1 flex-wrap">
                          {client.projects.map((p) => (
                            <span
                              key={p.id}
                              className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border truncate max-w-[130px] ${
                                p.status === "ONGOING"
                                  ? "bg-blue-50 text-blue-800 border-blue-200"
                                  : p.status === "ONBOARD"
                                  ? "bg-purple-50 text-purple-800 border-purple-200"
                                  : p.status === "COMPLETED"
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                  : "bg-slate-50 text-slate-700 border-slate-200"
                              }`}
                              title={`${p.title} (${p.status})`}
                            >
                              {p.title}
                            </span>
                          ))}
                        </div>
                      )}
                      {client.notes ? (
                        <span className="line-clamp-2 italic text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                          "{client.notes}"
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">General consulting</span>
                      )}
                    </td>

                    {/* Tasks Count */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="bg-cyan-50 text-cyan-800 text-[11px] font-bold px-2.5 py-1 rounded-full border border-cyan-200">
                        {client._count?.tasks || 0} Tasks
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => handleOpenEditModal(client)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition"
                          title="Edit Client Information"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                          <span>Edit</span>
                        </button>

                        {onOpenCreateTaskForClient && (
                          <button
                            onClick={() => onOpenCreateTaskForClient(client.id)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1.5 text-xs font-bold text-cyan-700 bg-cyan-50 hover:bg-cyan-100 rounded-lg border border-cyan-200 transition"
                          >
                            <Plus className="w-3.5 h-3.5 text-cyan-600" />
                            <span>Add Task</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Client Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-cyan-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  {editingClient ? `Edit Client: ${editingClient.name}` : "Add New Client Account"}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingClient(null);
                }}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Contact Person Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rajesh Mehta / Ananya Deshmukh"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Company / Organization Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Navkar Enterprise Solutions / Zenith Logistics"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="client@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Phone / Mobile
                  </label>
                  <input
                    type="text"
                    placeholder="+91 98200 12345"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Account Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none font-bold bg-white"
                >
                  <option value="ACTIVE">🟢 Active Client (Live Consulting / Active Projects)</option>
                  <option value="PROSPECT">🔮 Prospect / Inquiry Lead</option>
                  <option value="INACTIVE">⚪ Inactive Client Account</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Engagement Notes / Tech Scope
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Flutter mobile app, Next.js frontend, Python FastAPI backend, PostgreSQL architecture, AWS cloud setup..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingClient(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg transition shadow-xs disabled:opacity-50"
                >
                  {loading ? (editingClient ? "Updating Client..." : "Saving Client...") : (editingClient ? "Update Client" : "Save Client")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
