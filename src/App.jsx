import React, { useState, useEffect } from "react";
import {
  Cpu,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Search,
  SlidersHorizontal,
  Building2,
  Sparkles,
  X,
  Clock,
  ShieldCheck,
  Check,
  RotateCcw
} from "lucide-react";
import { initialEquipment, sampleConflictingRequests } from "./data/labData";
import { resolveAllocationConflict } from "./services/aiScheduler";
import { sanitizeInput, validateBookingPayload } from "./utils/security";

export default function App() {
  const [equipmentList, setEquipmentList] = useState(initialEquipment);
  const [selectedDept, setSelectedDept] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("catalog");

  // Booking Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetEquipment, setTargetEquipment] = useState(null);
  const [formData, setFormData] = useState({
    studentName: "",
    usn: "",
    department: "Computer Science & ISE",
    projectTitle: "",
    deadline: "",
    urgencyLevel: "Normal",
    guideName: ""
  });
  const [formErrors, setFormErrors] = useState({});
  const [bookingSuccess, setBookingSuccess] = useState(null);

  // Conflicts & AI Scheduling State
  const [conflicts] = useState(sampleConflictingRequests);
  const [aiReport, setAiReport] = useState(null);
  const [isSolving, setIsSolving] = useState(false);

  // Faculty Approval Statuses
  const [facultyStatuses, setFacultyStatuses] = useState({
    "REQ-2026-001": "Pending",
    "REQ-2026-002": "Pending",
    "REQ-2026-003": "Pending"
  });

  const departments = [
    "All",
    "AI & Robotics",
    "ECE / VLSI",
    "Mechanical / Prototyping",
    "VLSI & Embedded",
    "Biotechnology",
    "Computer Science & ISE"
  ];

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isModalOpen) {
        setIsModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen]);

  const filteredEquipment = equipmentList.filter((item) => {
    const matchesDept =
      selectedDept === "All" ||
      item.department.toLowerCase().includes(selectedDept.toLowerCase());
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.specs.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.labRoom.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesSearch;
  });

  const handleOpenBooking = (equipment) => {
    setTargetEquipment(equipment);
    setBookingSuccess(null);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    const sanitized = sanitizeInput(value);
    setFormData((prev) => ({ ...prev, [name]: sanitized }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleBookingSubmit = (e) => {
    e.preventDefault();
    const validation = validateBookingPayload(formData);
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }

    setBookingSuccess(
      `Request successfully submitted for ${targetEquipment.name}. Routed to ${
        formData.guideName || "Department Faculty"
      } for slot verification and lab safety sign-off.`
    );

    // Update available units locally if available
    if (targetEquipment && targetEquipment.availableUnits > 0) {
      setEquipmentList((prev) =>
        prev.map((eq) =>
          eq.id === targetEquipment.id
            ? { ...eq, availableUnits: eq.availableUnits - 1 }
            : eq
        )
      );
    }

    setTimeout(() => {
      setIsModalOpen(false);
      setFormData({
        studentName: "",
        usn: "",
        department: "Computer Science & ISE",
        projectTitle: "",
        deadline: "",
        urgencyLevel: "Normal",
        guideName: ""
      });
      setBookingSuccess(null);
    }, 2500);
  };

  const handleRunAiSolver = () => {
    setIsSolving(true);
    setTimeout(() => {
      const report = resolveAllocationConflict(conflicts);
      setAiReport(report);
      setIsSolving(false);
    }, 400);
  };

  const handleApprove = (id) => {
    setFacultyStatuses((prev) => ({ ...prev, [id]: "Approved" }));
  };

  const handleReschedule = (id) => {
    setFacultyStatuses((prev) => ({ ...prev, [id]: "Rescheduled" }));
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* Skip to Main Content Accessibility Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-indigo-600 focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-white"
      >
        Skip to main content
      </a>

      {/* Header & Main Navigation */}
      <header className="border-b border-slate-800 bg-[#0c1222]/95 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Cpu className="w-6 h-6 text-white" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-white">
                  LabLink
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-indigo-950 text-indigo-300 border border-indigo-700/50 rounded-full">
                  Campus Lab Grid
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Making College Laboratories More Accessible
              </p>
            </div>
          </div>

          <nav className="flex space-x-1 sm:space-x-2" aria-label="Main Application Navigation">
            <button
              type="button"
              onClick={() => setActiveTab("catalog")}
              className={`px-3 sm:px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                activeTab === "catalog"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/80"
              }`}
            >
              Equipment Catalog
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("conflict-resolver")}
              className={`px-3 sm:px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                activeTab === "conflict-resolver"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/80"
              }`}
            >
              <Sparkles className="w-4 h-4 text-cyan-300" aria-hidden="true" />
              <span>AI Conflict Resolver</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("faculty-portal")}
              className={`px-3 sm:px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                activeTab === "faculty-portal"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/80"
              }`}
            >
              Faculty Portal
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Sections */}
      <main id="main-content" className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab 1: Equipment Catalog */}
        {activeTab === "catalog" && (
          <section aria-labelledby="catalog-heading" className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 id="catalog-heading" className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Cross-Department Laboratory Hardware
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  Discover specialized laboratory hardware, kits, and high-performance workstations across campus departments.
                </p>
              </div>
              <div className="flex items-center gap-4 bg-slate-900/90 border border-slate-800 px-4 py-2.5 rounded-xl text-xs shrink-0">
                <div>
                  <span className="block text-slate-400 text-[11px]">Active Systems</span>
                  <span className="font-semibold text-white text-sm">{equipmentList.length} Nodes</span>
                </div>
                <div className="h-7 w-px bg-slate-800" />
                <div>
                  <span className="block text-slate-400 text-[11px]">Campus Utilization</span>
                  <span className="font-semibold text-emerald-400 text-sm">88.4%</span>
                </div>
              </div>
            </div>

            {/* Search and Department Filter Controls */}
            <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
              <div className="relative w-full md:w-96">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
                <input
                  type="text"
                  placeholder="Search Jetson, FPGA, 3D printer, specs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search laboratory equipment by name, category, or specs"
                  className="w-full bg-[#070b14] border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0" role="toolbar" aria-label="Department filters">
                <SlidersHorizontal className="w-4 h-4 text-slate-400 shrink-0 mr-1" aria-hidden="true" />
                {departments.map((dept) => (
                  <button
                    key={dept}
                    type="button"
                    onClick={() => setSelectedDept(dept)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                      selectedDept === dept
                        ? "bg-indigo-600 text-white font-semibold shadow"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    {dept}
                  </button>
                ))}
              </div>
            </div>

            {/* Equipment Grid */}
            {filteredEquipment.length === 0 ? (
              <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-12 text-center">
                <Cpu className="w-12 h-12 text-slate-600 mx-auto mb-3" aria-hidden="true" />
                <h2 className="text-lg font-semibold text-slate-200">No equipment matches found</h2>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Try clearing your search query or selecting "All" departments to view available systems.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDept("All");
                    setSearchQuery("");
                  }}
                  className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEquipment.map((item) => (
                  <article
                    key={item.id}
                    className="bg-[#0f172a]/90 border border-slate-800 hover:border-slate-700/80 transition-all rounded-2xl p-5 flex flex-col justify-between shadow-lg shadow-black/20"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-300 bg-indigo-950/80 border border-indigo-800/60 px-2.5 py-0.5 rounded-full">
                          {item.department}
                        </span>
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                            item.availableUnits > 0
                              ? "bg-emerald-950/80 text-emerald-300 border border-emerald-700/50"
                              : "bg-rose-950/80 text-rose-300 border border-rose-700/50"
                          }`}
                        >
                          {item.availableUnits > 0
                            ? `${item.availableUnits} of ${item.totalUnits} Available`
                            : "Fully Allocated"}
                        </span>
                      </div>

                      <h2 className="text-lg font-semibold text-white mb-1">{item.name}</h2>
                      <p className="text-xs text-cyan-400 mb-3 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <span>{item.labRoom}</span>
                      </p>

                      <div className="space-y-2.5 text-xs text-slate-300 mb-5 bg-[#0a0f1d] p-3 rounded-xl border border-slate-800/80">
                        <div>
                          <strong className="text-slate-400 block mb-0.5 text-[11px] uppercase tracking-wide">
                            Specifications:
                          </strong>
                          <span className="text-slate-200">{item.specs}</span>
                        </div>
                        <div>
                          <strong className="text-slate-400 block mb-0.5 text-[11px] uppercase tracking-wide">
                            Prerequisites & Safety:
                          </strong>
                          <span className="text-slate-300">{item.prerequisites}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenBooking(item)}
                      className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium text-xs rounded-xl transition flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    >
                      <Calendar className="w-4 h-4" aria-hidden="true" />
                      <span>Request Project-Based Slot</span>
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Tab 2: AI Conflict Resolver */}
        {activeTab === "conflict-resolver" && (
          <section aria-labelledby="resolver-heading" className="space-y-6">
            <div className="bg-[#0f172a] border border-indigo-800/60 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1 id="resolver-heading" className="text-2xl font-bold text-white tracking-tight">
                    GenAI Scheduling & Conflict Resolver
                  </h1>
                  <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-indigo-950 text-indigo-300 border border-indigo-700/60 rounded-full">
                    Multi-Criteria AI
                  </span>
                </div>
                <p className="text-sm text-slate-400 mt-1">
                  Resolves overlapping laboratory requests by balancing project deadline proximity (40%), urgency level (35%), and prior usage equity (25%).
                </p>
              </div>
              <button
                type="button"
                onClick={handleRunAiSolver}
                disabled={isSolving}
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition flex items-center justify-center gap-2 shrink-0 shadow-lg shadow-indigo-600/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              >
                <Sparkles className="w-4 h-4 text-amber-300" aria-hidden="true" />
                <span>{isSolving ? "Analyzing Conflicts..." : "Run AI Conflict Solver"}</span>
              </button>
            </div>

            {/* Conflicting Requests Showcase */}
            <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-400" aria-hidden="true" />
                  <span>Conflicting Slot Requests: NVIDIA Jetson AGX Orin DevKit</span>
                </h2>
                <span className="text-xs text-amber-400 bg-amber-950/60 border border-amber-800/50 px-2.5 py-1 rounded-full font-medium">
                  3 Competing Requests • 1 Shared Slot
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {conflicts.map((req) => (
                  <div key={req.id} className="bg-[#0a0f1d] border border-slate-800 p-4 rounded-xl flex flex-col justify-between space-y-2">
                    <div>
                      <div className="flex justify-between items-start gap-1">
                        <span className="font-bold text-white text-sm">
                          {req.studentName}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            req.urgencyLevel === "Critical"
                              ? "bg-rose-950 text-rose-300 border border-rose-800"
                              : req.urgencyLevel === "High"
                              ? "bg-amber-950 text-amber-300 border border-amber-800"
                              : "bg-slate-800 text-slate-300"
                          }`}
                        >
                          {req.urgencyLevel}
                        </span>
                      </div>
                      <p className="text-slate-400 text-[11px] font-mono mt-0.5">
                        {req.usn} • {req.department}
                      </p>
                      <p className="text-slate-200 font-medium mt-2">
                        {req.projectTitle}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 space-y-1 text-slate-400">
                      <p className="text-amber-300 font-medium flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Deadline: {req.deadlineDaysRemaining} days remaining</span>
                      </p>
                      <p>Guide: {req.guideName}</p>
                      <p>Prior monthly bookings: <strong className="text-white">{req.priorMonthlyBookings}</strong></p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Decision Report */}
            {aiReport && (
              <div className="bg-[#0f172a] border border-emerald-500/50 rounded-2xl p-6 space-y-4 shadow-xl">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" aria-hidden="true" />
                  <h2 className="text-xl font-bold text-white">Recommended Fair Allocation Decision</h2>
                </div>

                <div className="text-sm text-emerald-200 bg-emerald-950/40 border border-emerald-800/50 p-4 rounded-xl leading-relaxed">
                  {aiReport.explanation}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Primary Winner Card */}
                  <div className="bg-[#070b14] border border-emerald-800/60 p-4 rounded-xl space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block">
                      Primary Slot Allocation (Winner)
                    </span>
                    <p className="text-base font-bold text-white">{aiReport.winner.studentName}</p>
                    <p className="text-slate-300 font-medium">{aiReport.winner.projectTitle}</p>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-slate-400">
                      <span>{aiReport.allocatedSlot}</span>
                      <span className="text-emerald-400 font-semibold text-sm">
                        Score: {aiReport.winner.compositeScore}/100
                      </span>
                    </div>
                  </div>

                  {/* Alternative Backup Card */}
                  {aiReport.suggestedAlternative && (
                    <div className="bg-[#070b14] border border-cyan-800/60 p-4 rounded-xl space-y-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 block">
                        Alternative Slot & Backup Allocation
                      </span>
                      <p className="text-base font-bold text-white">
                        {aiReport.suggestedAlternative.student}
                      </p>
                      <p className="text-slate-300 font-medium">
                        {aiReport.suggestedAlternative.suggestedDate} ({aiReport.suggestedAlternative.suggestedSlot})
                      </p>
                      <div className="pt-2 border-t border-slate-800 text-slate-400">
                        <span className="block text-[11px] uppercase tracking-wide text-cyan-500 font-semibold mb-0.5">
                          Workstation Backup:
                        </span>
                        <span>{aiReport.suggestedAlternative.workstationBackup}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Tab 3: Faculty Portal */}
        {activeTab === "faculty-portal" && (
          <section aria-labelledby="faculty-heading" className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 id="faculty-heading" className="text-2xl font-bold text-white tracking-tight">
                  Faculty Approval Queue & Lab Management
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  Review student project credentials, safety compliance, and approve cross-department lab slots.
                </p>
              </div>
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                <span>Authorized Faculty Console</span>
              </div>
            </div>

            <div className="bg-[#0f172a] border border-slate-800 rounded-2xl divide-y divide-slate-800 text-xs shadow-lg">
              {conflicts.map((item) => {
                const status = facultyStatuses[item.id] || "Pending";
                return (
                  <div
                    key={item.id}
                    className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-900/40 transition"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-sm">
                          {item.studentName}
                        </span>
                        <span className="font-mono text-slate-400 text-[11px]">
                          ({item.usn})
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800/60 font-semibold">
                          {item.department}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            status === "Approved"
                              ? "bg-emerald-950 text-emerald-300 border border-emerald-700/60"
                              : status === "Rescheduled"
                              ? "bg-cyan-950 text-cyan-300 border border-cyan-700/60"
                              : "bg-amber-950 text-amber-300 border border-amber-700/60"
                          }`}
                        >
                          Status: {status}
                        </span>
                      </div>

                      <p className="text-slate-300 font-medium">
                        <strong className="text-slate-400">Equipment:</strong> {item.equipmentName}
                      </p>
                      <p className="text-slate-300">
                        <strong className="text-slate-400">Project:</strong> {item.projectTitle}
                      </p>
                      <p className="text-slate-400 text-[11px]">
                        Deadline in {item.deadlineDaysRemaining} days • Faculty Guide: {item.guideName} • Prior Month: {item.priorMonthlyBookings} bookings
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleApprove(item.id)}
                        className={`px-3.5 py-2 rounded-lg font-medium transition flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                          status === "Approved"
                            ? "bg-emerald-700 text-white cursor-default"
                            : "bg-emerald-600 hover:bg-emerald-500 text-white"
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{status === "Approved" ? "Approved" : "Approve"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleReschedule(item.id)}
                        className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium transition flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                      >
                        <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Reschedule</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>

      {/* Project-Based Slot Request Modal */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <div className="bg-[#0f172a] border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              aria-label="Close modal dialog"
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>

            <h2 id="modal-title" className="text-xl font-bold text-white mb-1 pr-6">
              Request Slot: {targetEquipment?.name}
            </h2>
            <p className="text-xs text-indigo-400 mb-4">
              {targetEquipment?.department} • {targetEquipment?.labRoom}
            </p>

            {bookingSuccess ? (
              <div className="p-4 bg-emerald-950/60 border border-emerald-700 text-emerald-200 text-sm rounded-xl flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" aria-hidden="true" />
                <div>
                  <strong className="block font-semibold">Slot Request Logged</strong>
                  <span className="text-xs">{bookingSuccess}</span>
                </div>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="studentName" className="block text-slate-300 font-medium mb-1">
                      Student Name *
                    </label>
                    <input
                      id="studentName"
                      type="text"
                      name="studentName"
                      required
                      value={formData.studentName}
                      onChange={handleFormChange}
                      aria-invalid={!!formErrors.studentName}
                      aria-describedby={formErrors.studentName ? "studentName-error" : undefined}
                      className="w-full bg-[#070b14] border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g. Aarav Sharma"
                    />
                    {formErrors.studentName && (
                      <span id="studentName-error" className="text-rose-400 mt-1 block">
                        {formErrors.studentName}
                      </span>
                    )}
                  </div>

                  <div>
                    <label htmlFor="usn" className="block text-slate-300 font-medium mb-1">
                      College USN / ID *
                    </label>
                    <input
                      id="usn"
                      type="text"
                      name="usn"
                      required
                      value={formData.usn}
                      onChange={handleFormChange}
                      aria-invalid={!!formErrors.usn}
                      aria-describedby={formErrors.usn ? "usn-error" : undefined}
                      className="w-full bg-[#070b14] border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g. 1MS21CS004"
                    />
                    {formErrors.usn && (
                      <span id="usn-error" className="text-rose-400 mt-1 block">
                        {formErrors.usn}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="projectTitle" className="block text-slate-300 font-medium mb-1">
                    Project Title *
                  </label>
                  <input
                    id="projectTitle"
                    type="text"
                    name="projectTitle"
                    required
                    value={formData.projectTitle}
                    onChange={handleFormChange}
                    aria-invalid={!!formErrors.projectTitle}
                    aria-describedby={formErrors.projectTitle ? "projectTitle-error" : undefined}
                    className="w-full bg-[#070b14] border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g. Low-Latency Drone Obstacle Avoidance"
                  />
                  {formErrors.projectTitle && (
                    <span id="projectTitle-error" className="text-rose-400 mt-1 block">
                      {formErrors.projectTitle}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="deadline" className="block text-slate-300 font-medium mb-1">
                      Project Deadline *
                    </label>
                    <input
                      id="deadline"
                      type="date"
                      name="deadline"
                      required
                      value={formData.deadline}
                      onChange={handleFormChange}
                      aria-invalid={!!formErrors.deadline}
                      aria-describedby={formErrors.deadline ? "deadline-error" : undefined}
                      className="w-full bg-[#070b14] border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {formErrors.deadline && (
                      <span id="deadline-error" className="text-rose-400 mt-1 block">
                        {formErrors.deadline}
                      </span>
                    )}
                  </div>

                  <div>
                    <label htmlFor="urgencyLevel" className="block text-slate-300 font-medium mb-1">
                      Urgency Level
                    </label>
                    <select
                      id="urgencyLevel"
                      name="urgencyLevel"
                      value={formData.urgencyLevel}
                      onChange={handleFormChange}
                      className="w-full bg-[#070b14] border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Normal">Normal (Regular Coursework)</option>
                      <option value="High">High (Mini-Project Milestone)</option>
                      <option value="Critical">Critical (Capstone / Competition)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="guideName" className="block text-slate-300 font-medium mb-1">
                    Faculty Guide Name
                  </label>
                  <input
                    id="guideName"
                    type="text"
                    name="guideName"
                    value={formData.guideName}
                    onChange={handleFormChange}
                    className="w-full bg-[#070b14] border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g. Dr. Sudhir Rao"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition shadow-md shadow-indigo-600/30"
                  >
                    Confirm Request
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800 py-4 text-center text-xs text-slate-500">
        LabLink • Campus Laboratory Resource Grid • PromptWars Hackathon
      </footer>
    </div>
  );
}
