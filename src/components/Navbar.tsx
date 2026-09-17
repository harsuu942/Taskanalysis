"use client";

import React, { useState } from "react";
import { User, Task, DailyProductivityStats } from "@/types";
import {
  ListTodo,
  Building2,
  Briefcase,
  Calendar,
  Lightbulb,
  BookOpen,
  Play,
  Settings,
  Plus,
  Sparkles,
  TrendingUp,
  Code2,
  LogOut,
  Terminal,
  Zap,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
} from "lucide-react";

interface NavbarProps {
  currentUser: User | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeRunningTask?: Task | null;
  onOpenTaskModal: () => void;
  onOpenSettingsModal: () => void;
  projectsCount?: number;
  pipelineValue?: number;
  pendingTasksCount?: number;
  learningMasteredCount?: number;
  todayProductivity?: DailyProductivityStats | null;
  yesterdayProductivity?: DailyProductivityStats | null;
  onLogout?: () => void;
}

export default function Navbar({
  currentUser,
  activeTab,
  setActiveTab,
  activeRunningTask,
  onOpenTaskModal,
  onOpenSettingsModal,
  projectsCount = 0,
  pipelineValue = 0,
  pendingTasksCount = 0,
  learningMasteredCount = 0,
  todayProductivity,
  yesterdayProductivity,
  onLogout,
}: NavbarProps) {
  const [showProductivityPopover, setShowProductivityPopover] = useState(false);
  // Navigation tabs matching the exact previous theme color gradients
  const navItems = [
    {
      id: "tasks",
      label: "Tasks & Kanban",
      icon: ListTodo,
      badge: pendingTasksCount > 0 ? pendingTasksCount : undefined,
      activeColor:
        "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 border-blue-600",
      inactiveColor: "text-slate-600 hover:text-blue-700 hover:bg-blue-50/80",
    },
    {
      id: "clients",
      label: "Clients",
      icon: Building2,
      activeColor:
        "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-500/20 border-cyan-600",
      inactiveColor: "text-slate-600 hover:text-cyan-700 hover:bg-cyan-50/80",
    },
    {
      id: "projects",
      label: "Ongoing Projects & SOW",
      icon: Briefcase,
      badge: projectsCount > 0 ? projectsCount : undefined,
      activeColor:
        "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20 border-indigo-600",
      inactiveColor: "text-slate-600 hover:text-indigo-700 hover:bg-indigo-50/80",
    },
    {
      id: "recurring",
      label: "Recurring Tasks",
      icon: Calendar,
      activeColor:
        "bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-md shadow-teal-500/20 border-teal-600",
      inactiveColor: "text-slate-600 hover:text-teal-700 hover:bg-teal-50/80",
    },
    {
      id: "ideas",
      label: "Product Roadmap & Timeline",
      icon: Lightbulb,
      activeColor:
        "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-500/20 border-purple-600",
      inactiveColor: "text-slate-600 hover:text-purple-700 hover:bg-purple-50/80",
    },
    {
      id: "learning",
      label: "Learning Hub & Misc",
      icon: BookOpen,
      badge: learningMasteredCount > 0 ? `${learningMasteredCount} done` : undefined,
      activeColor:
        "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/20 border-amber-500",
      inactiveColor: "text-slate-600 hover:text-amber-700 hover:bg-amber-50/80",
    },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs w-full">
      {/* Top Header Bar */}
      <div className="w-full px-4 sm:px-6 lg:px-8 border-b border-slate-100">
        <div className="flex items-center justify-between h-16 py-2 gap-3">
          {/* Brand Header - Modern Minimalist Text, No Image Logo */}
          <div className="flex items-center space-x-2.5 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Code2 className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center space-x-1.5">
                <span className="font-black text-sm tracking-tight text-slate-900">
                  Task Analysis
                </span>
                <span className="text-[10px] uppercase font-black px-1.5 py-0.2 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                  Studio
                </span>
              </div>
              <span className="text-[10px] font-semibold text-slate-400 -mt-0.5">
                Personal Engineering Workspace
              </span>
            </div>
          </div>

          {/* Right Section: Productivity Widget, Active Timer, Pipeline KPI, Quick Add, Settings, Profile */}
          <div className="flex items-center space-x-2.5 flex-shrink-0">
            {/* Animated Today's Productivity Widget */}
            {(() => {
              const todayRate = todayProductivity?.completionRate ?? 0;
              const radius = 10;
              const circumference = 2 * Math.PI * radius; // ~62.83
              const strokeDashoffset = circumference - (todayRate / 100) * circumference;

              const strokeColor =
                todayRate >= 80
                  ? "stroke-emerald-400"
                  : todayRate >= 50
                  ? "stroke-blue-400"
                  : todayRate > 0
                  ? "stroke-amber-400"
                  : "stroke-slate-600";

              const yesterdayRate = yesterdayProductivity?.completionRate ?? 0;
              const rateDelta = todayRate - yesterdayRate;

              return (
                <div className="relative">
                  <button
                    onClick={() => setShowProductivityPopover((prev) => !prev)}
                    className="relative flex items-center space-x-2 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition group border border-indigo-700/50 cursor-pointer overflow-hidden"
                    title="Click to view daily productivity details"
                  >
                    {/* Animated background subtle glow shimmer */}
                    <span className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-xl blur-xs opacity-20 group-hover:opacity-40 transition animate-pulse"></span>

                    {/* SVG Animated Circular Progress Ring */}
                    <div className="relative flex items-center justify-center w-6 h-6 flex-shrink-0">
                      <svg className="w-6 h-6 transform -rotate-90" viewBox="0 0 24 24">
                        <circle
                          cx="12"
                          cy="12"
                          r={radius}
                          stroke="currentColor"
                          strokeWidth="2.5"
                          className="stroke-slate-700/60"
                          fill="transparent"
                        />
                        <circle
                          cx="12"
                          cy="12"
                          r={radius}
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeDashoffset}
                          strokeLinecap="round"
                          className={`${strokeColor} transition-all duration-1000 ease-out`}
                          fill="transparent"
                        />
                      </svg>
                      <Zap className="w-2.5 h-2.5 text-amber-400 fill-amber-400 absolute animate-pulse" />
                    </div>

                    {/* Text Info */}
                    <div className="flex flex-col text-left leading-none">
                      <div className="flex items-center space-x-1">
                        <span className="text-[10px] uppercase tracking-wider text-indigo-300 font-extrabold">
                          Today
                        </span>
                        <span className="text-xs font-black text-white">
                          {todayRate}%
                        </span>
                      </div>
                      <span className="text-[9px] text-slate-300 font-semibold mt-0.5">
                        {todayProductivity ? `${todayProductivity.completedTasks}/${todayProductivity.totalTasks} Done` : "0 Done"}
                      </span>
                    </div>

                    <ChevronDown
                      className={`w-3 h-3 text-indigo-300 transition-transform ${
                        showProductivityPopover ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Dropdown Popover */}
                  {showProductivityPopover && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowProductivityPopover(false)}
                      />
                      <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 p-4 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                          <div className="flex items-center space-x-2">
                            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                              <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                            </div>
                            <div>
                              <h4 className="text-xs font-black text-slate-900">
                                Daily Productivity Pulse
                              </h4>
                              <p className="text-[10px] text-slate-400 font-medium">
                                Live performance tracking
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
                            {todayProductivity?.date || "Today"}
                          </span>
                        </div>

                        {/* Today's breakdown */}
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-700">Today's Completion</span>
                            <span className="text-sm font-black text-indigo-600">{todayRate}%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-700 ${
                                todayRate >= 80
                                  ? "bg-emerald-500"
                                  : todayRate >= 50
                                  ? "bg-blue-500"
                                  : "bg-amber-500"
                              }`}
                              style={{ width: `${todayRate}%` }}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                              <span className="text-slate-400 block text-[10px]">Completed</span>
                              <span className="font-black text-emerald-600 flex items-center gap-1 mt-0.5">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {todayProductivity?.completedTasks ?? 0} / {todayProductivity?.totalTasks ?? 0}
                              </span>
                            </div>
                            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                              <span className="text-slate-400 block text-[10px]">Logged Hours</span>
                              <span className="font-black text-blue-600 flex items-center gap-1 mt-0.5">
                                <Clock className="w-3.5 h-3.5" />
                                {todayProductivity?.totalHoursLogged ?? 0} hrs
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Yesterday Comparison */}
                        <div className="mt-3 pt-3 border-t border-slate-100">
                          <div className="flex items-center justify-between text-[11px] mb-1.5">
                            <span className="font-bold text-slate-500">Yesterday Benchmark</span>
                            <span className="font-black text-slate-700">{yesterdayRate}%</span>
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-100">
                            <span>{yesterdayProductivity?.completedTasks ?? 0} of {yesterdayProductivity?.totalTasks ?? 0} tasks</span>
                            <span>{yesterdayProductivity?.totalHoursLogged ?? 0} hrs logged</span>
                          </div>

                          {/* Delta Pill */}
                          <div className="mt-2 flex items-center justify-between text-[10px] font-bold">
                            <span className="text-slate-400">Day-over-day Delta:</span>
                            {rateDelta > 0 ? (
                              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-0.5">
                                <ArrowUpRight className="w-3 h-3" />
                                +{rateDelta}% vs Yesterday
                              </span>
                            ) : rateDelta < 0 ? (
                              <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 flex items-center gap-0.5">
                                <ArrowDownRight className="w-3 h-3" />
                                {rateDelta}% vs Yesterday
                              </span>
                            ) : (
                              <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                                Matched Yesterday
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })()}

            {/* Active Running Task Indicator */}
            {activeRunningTask && (
              <div className="hidden xl:flex items-center space-x-2 bg-amber-50 border border-amber-300 px-3 py-1.5 rounded-lg text-xs font-medium text-amber-900 shadow-xs animate-pulse">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                <Play className="w-3.5 h-3.5 text-amber-600 fill-current" />
                <span className="font-bold truncate max-w-[130px] text-slate-900">
                  {activeRunningTask.title}
                </span>
                <span className="font-mono text-amber-900 font-bold bg-amber-200 px-1.5 py-0.5 rounded text-[10px]">
                  TIMER ON
                </span>
              </div>
            )}

            {/* Approved Pipeline Revenue Badge */}
            {pipelineValue > 0 && (
              <div className="hidden sm:flex items-center space-x-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-900">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-[11px] text-emerald-700">Pipeline:</span>
                <span>{"$"}{pipelineValue.toLocaleString()}</span>
              </div>
            )}

            {/* Create Task Button */}
            <button
              onClick={onOpenTaskModal}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition shadow-xs flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Create Task</span>
            </button>

            {/* Settings button */}
            <button
              onClick={onOpenSettingsModal}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition border border-slate-200"
              title="Personal Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Developer User Profile */}
            <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                {currentUser?.name?.charAt(0) || "H"}
              </div>
              <div className="hidden md:block text-left leading-tight">
                <div className="text-xs font-black text-slate-900">
                  {currentUser?.name || "Harsh"}
                </div>
                <div className="text-[10px] text-slate-400 font-semibold">
                  Lead Developer
                </div>
              </div>
            </div>

            {/* Logout Button */}
            {onLogout && (
              <button
                onClick={onLogout}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition border border-slate-200 cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Role Context & Breadcrumb Bar (Matching previous theme) */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-2.5 w-full">
        <div className="w-full flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center space-x-2.5">
            <span className="font-bold text-slate-500">Active Workspace:</span>
            <span className="px-3 py-1 rounded-full font-bold uppercase tracking-wider text-[11px] bg-blue-100 text-blue-800 border border-blue-300">
              💻 Software Engineering Studio
            </span>
            <span className="text-slate-300 hidden sm:inline">&bull;</span>
            <span className="text-slate-600 hidden sm:inline font-medium">
              Consultant: <strong className="text-slate-900">{currentUser?.name || "Harsh"}</strong>
            </span>
            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-semibold border border-emerald-200">
              ⚡ Full-Stack &amp; AI Mode
            </span>
          </div>

          <div className="text-slate-400 text-[11px] font-medium hidden sm:block">
            Personal Usage &bull; SOW &bull; Pitch Ready
          </div>
        </div>
      </div>

      {/* TOP TABBING WITH COLOR CODING (Matching previous exact theme) */}
      <div className="w-full px-4 sm:px-6 lg:px-8 bg-slate-50 border-b border-slate-200 overflow-x-auto">
        <nav className="flex space-x-2 py-2 min-w-max">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2.5 border ${
                  isActive
                    ? item.activeColor
                    : `${item.inactiveColor} bg-white border-slate-200 shadow-2xs`
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : ""}`} />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                      isActive
                        ? "bg-white text-slate-900"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
