import React, { useState, useEffect, useMemo } from "react";
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
  RotateCcw,
  BarChart3,
  TrendingUp,
  Layers,
  Activity,
  BookOpen,
  QrCode,
  Award,
  FileText,
  Plus,
  Trash2,
  PlusCircle
} from "lucide-react";
import {
  initialEquipment,
  sampleConflictingRequests,
  campusMetrics
} from "./data/labData";
import {
  resolveAllocationConflict,
  generateDigitalLabPass
} from "./services/aiScheduler";
import {
  sanitizeInput,
  validateBookingPayload,
  validateEquipmentPayload
} from "./utils/security";

export default function App() {
  const [equipmentList, setEquipmentList] = useState(initialEquipment);
  const [selectedDept, setSelectedDept] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("catalog"); // 'catalog' | 'conflict-resolver' | 'faculty-portal' | 'utilization'

  // Booking Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetEquipment, setTargetEquipment] = useState(null);
  const [formData, setFormData] = useState({
    studentName: "",
    usn: "",
    department: "CSE / ISE",
    projectTitle: "",
    projectScope: "",
    deadline: "",
    urgencyLevel: "Normal",
    guideName: ""
  });
  const [formErrors, setFormErrors] = useState({});
  const [bookingSuccess, setBookingSuccess] = useState(null);

  // New Equipment Registration Modal State
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [newEquipmentData, setNewEquipmentData] = useState({
    name: "",
    department: "Robotics & AI",
    labRoom: "",
    leadFaculty: "",
    specs: "",
    prerequisites: "",
    totalUnits: 2
  });
  const [registerErrors, setRegisterErrors] = useState({});

  // Dynamic Conflicts State
  const [conflictsList, setConflictsList] = useState(sampleConflictingRequests);
  const [isAddConflictModalOpen, setIsAddConflictModalOpen] = useState(false);
  const [newConflictData, setNewConflictData] = useState({
    studentName: "",
    usn: "",
    department: "CSE / ISE",
    projectTitle: "",
    projectScope: "",
    deadlineDaysRemaining: 5,
    urgencyLevel: "High",
    priorMonthlyBookings: 1,
    guideName: "Dr. Sudhir Rao"
  });
  const [conflictFormErrors, setConflictFormErrors] = useState({});
  const [aiReport, setAiReport] = useState(() => resolveAllocationConflict(sampleConflictingRequests));
  const [isSolving, setIsSolving] = useState(false);
  const [showXaiModal, setShowXaiModal] = useState(false);

  // Dynamic Faculty Approval Queue State
  const [facultyQueue, setFacultyQueue] = useState(sampleConflictingRequests);
  const [facultyStatuses, setFacultyStatuses] = useState({
    "REQ-2026-001": "Pending",
    "REQ-2026-002": "Pending"
  });
  const [activeDigitalPass, setActiveDigitalPass] = useState(null);
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [liveAnnouncement, setLiveAnnouncement] = useState("");

  const departments = [
    "All",
    "Robotics & AI",
    "ECE / VLSI",
    "Mechanical",
    "VLSI & Embedded",
    "CSE / ISE",
    "Biotechnology"
  ];

  // Dynamic Live Utilization Calculation
  const liveUtilization = useMemo(() => {
    if (!equipmentList.length) return 0;
    const totalUtil = equipmentList.reduce(
      (sum, item) => sum + (item.hourlyUtilization || 85),
      0
    );
    return Math.round(totalUtil / equipmentList.length);
  }, [equipmentList]);

  // Close modals on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (isModalOpen) setIsModalOpen(false);
        if (isPassModalOpen) setIsPassModalOpen(false);
        if (showXaiModal) setShowXaiModal(false);
        if (isRegisterModalOpen) setIsRegisterModalOpen(false);
        if (isAddConflictModalOpen) setIsAddConflictModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isModalOpen,
    isPassModalOpen,
    showXaiModal,
    isRegisterModalOpen,
    isAddConflictModalOpen
  ]);

  // Memoized filter for performance and efficiency
  const filteredEquipment = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return equipmentList.filter((item) => {
      const matchesDept =
        selectedDept === "All" ||
        item.department.toLowerCase().includes(selectedDept.toLowerCase());
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.specs.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.labRoom.toLowerCase().includes(q);
      return matchesDept && matchesSearch;
    });
  }, [equipmentList, selectedDept, searchQuery]);

  // ----------------------------------------------------
  // Dynamic Equipment Registration Handlers
  // ----------------------------------------------------
  const handleOpenRegisterModal = () => {
    setNewEquipmentData({
      name: "",
      department: "Robotics & AI",
      labRoom: "",
      leadFaculty: "",
      specs: "",
      prerequisites: "",
      totalUnits: 2
    });
    setRegisterErrors({});
    setIsRegisterModalOpen(true);
  };

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setNewEquipmentData((prev) => ({
      ...prev,
      [name]: name === "totalUnits" ? value : sanitizeInput(value)
    }));
    if (registerErrors[name]) {
      setRegisterErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    const validation = validateEquipmentPayload(newEquipmentData);
    if (!validation.isValid) {
      setRegisterErrors(validation.errors);
      return;
    }

    const units = parseInt(newEquipmentData.totalUnits, 10) || 1;
    const newId = `EQ-CUSTOM-${Date.now().toString().slice(-4)}`;
    const newResource = {
      id: newId,
      name: newEquipmentData.name,
      category: `${newEquipmentData.department} Workstation`,
      department: newEquipmentData.department,
      labRoom: newEquipmentData.labRoom,
      leadFaculty: newEquipmentData.leadFaculty || "Lab In-Charge",
      specs: newEquipmentData.specs || "Standard lab configuration and testbench",
      prerequisites: newEquipmentData.prerequisites || "Standard Lab Safety Clearance",
      totalUnits: units,
      availableUnits: units,
      dutyCycle: "88%",
      hourlyUtilization: 88
    };

    setEquipmentList((prev) => [newResource, ...prev]);
    setIsRegisterModalOpen(false);
    const msg = `Successfully registered ${newResource.name} into the Campus Grid.`;
    setLiveAnnouncement(msg);
  };

  const handleRemoveEquipment = (id, name) => {
    setEquipmentList((prev) => prev.filter((item) => item.id !== id));
    const msg = `Decommissioned ${name} from active campus inventory.`;
    setLiveAnnouncement(msg);
  };

  // ----------------------------------------------------
  // Dynamic Slot Booking Handlers
  // ----------------------------------------------------
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

    const successMsg = `Project slot request logged for ${targetEquipment.name}. Routed to ${
      formData.guideName || "Department Faculty"
    } for safety clearance and schedule reservation.`;
    setBookingSuccess(successMsg);
    setLiveAnnouncement(successMsg);

    // Optimistically update available unit inventory if available
    if (targetEquipment && targetEquipment.availableUnits > 0) {
      setEquipmentList((prev) =>
        prev.map((eq) =>
          eq.id === targetEquipment.id
            ? { ...eq, availableUnits: eq.availableUnits - 1 }
            : eq
        )
      );
    }

    // Also add to Faculty Approval Queue
    const newReqItem = {
      id: `REQ-${Date.now().toString().slice(-4)}`,
      studentName: formData.studentName,
      usn: formData.usn,
      department: formData.department,
      projectTitle: formData.projectTitle,
      projectScope: formData.projectScope || "Laboratory research slot reservation",
      deadlineDaysRemaining: 7,
      urgencyLevel: formData.urgencyLevel,
      priorMonthlyBookings: 0,
      priorAllocationsThisMonth: 0,
      guideName: formData.guideName || "Department Faculty",
      equipmentId: targetEquipment.id,
      equipmentName: targetEquipment.name,
      slotDate: formData.deadline || "2026-11-26",
      timeSlot: "10:00 AM - 01:00 PM"
    };
    setFacultyQueue((prev) => [newReqItem, ...prev]);

    setTimeout(() => {
      setIsModalOpen(false);
      setFormData({
        studentName: "",
        usn: "",
        department: "CSE / ISE",
        projectTitle: "",
        projectScope: "",
        deadline: "",
        urgencyLevel: "Normal",
        guideName: ""
      });
      setBookingSuccess(null);
    }, 2500);
  };

  // ----------------------------------------------------
  // Dynamic AI Conflict Simulator Handlers
  // ----------------------------------------------------
  const handleRunAiSolver = () => {
    setIsSolving(true);
    setTimeout(() => {
      const report = resolveAllocationConflict(conflictsList);
      setAiReport(report);
      setIsSolving(false);
      if (report.winner) {
        setLiveAnnouncement(
          `AI conflict resolution finished. Optimal allocation granted to ${report.winner.studentName}.`
        );
      }
    }, 300);
  };

  const handleOpenAddConflictModal = () => {
    setNewConflictData({
      studentName: "",
      usn: "",
      department: "CSE / ISE",
      projectTitle: "",
      projectScope: "",
      deadlineDaysRemaining: 5,
      urgencyLevel: "High",
      priorMonthlyBookings: 1,
      guideName: "Dr. Sudhir Rao"
    });
    setConflictFormErrors({});
    setIsAddConflictModalOpen(true);
  };

  const handleConflictChange = (e) => {
    const { name, value } = e.target;
    setNewConflictData((prev) => ({
      ...prev,
      [name]:
        name === "deadlineDaysRemaining" || name === "priorMonthlyBookings"
          ? parseInt(value, 10) || 0
          : sanitizeInput(value)
    }));
    if (conflictFormErrors[name]) {
      setConflictFormErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleAddConflictSubmit = (e) => {
    e.preventDefault();
    const errors = {};
    if (!newConflictData.studentName.trim()) {
      errors.studentName = "Student name is required.";
    }
    if (!newConflictData.usn.trim()) {
      errors.usn = "College USN is required.";
    }
    if (!newConflictData.projectTitle.trim()) {
      errors.projectTitle = "Project title is required.";
    }

    if (Object.keys(errors).length > 0) {
      setConflictFormErrors(errors);
      return;
    }

    const newConflictItem = {
      id: `REQ-${Date.now().toString().slice(-4)}`,
      studentName: newConflictData.studentName,
      usn: newConflictData.usn,
      department: newConflictData.department,
      projectTitle: newConflictData.projectTitle,
      projectScope: newConflictData.projectScope || "Hardware acceleration tests",
      deadlineDaysRemaining: newConflictData.deadlineDaysRemaining,
      urgencyLevel: newConflictData.urgencyLevel,
      priorMonthlyBookings: newConflictData.priorMonthlyBookings,
      priorAllocationsThisMonth: newConflictData.priorMonthlyBookings,
      guideName: newConflictData.guideName || "Department Faculty",
      equipmentId: "EQ-AI-01",
      equipmentName: "NVIDIA Jetson Edge-AI Dev Kit",
      slotDate: "2026-11-24",
      timeSlot: "10:00 AM - 01:00 PM"
    };

    const updated = [...conflictsList, newConflictItem];
    setConflictsList(updated);
    setAiReport(resolveAllocationConflict(updated));
    setIsAddConflictModalOpen(false);
    setLiveAnnouncement(
      `Added competing request for ${newConflictItem.studentName}. AI conflict resolution recalculated.`
    );
  };

  const handleRemoveConflict = (id) => {
    const updated = conflictsList.filter((c) => c.id !== id);
    setConflictsList(updated);
    setAiReport(resolveAllocationConflict(updated));
    setLiveAnnouncement(`Removed conflicting request ${id}.`);
  };

  const handleResetConflicts = () => {
    setConflictsList(sampleConflictingRequests);
    setAiReport(resolveAllocationConflict(sampleConflictingRequests));
    setLiveAnnouncement("Reset to default sample conflicting requests.");
  };

  // ----------------------------------------------------
  // Dynamic Faculty Approval Handlers
  // ----------------------------------------------------
  const handleApproveAndIssuePass = (item, benchNumber = "Bench-04A") => {
    setFacultyStatuses((prev) => ({ ...prev, [item.id]: "Approved" }));
    const pass = generateDigitalLabPass(item, benchNumber);
    setActiveDigitalPass(pass);
    setIsPassModalOpen(true);
    setLiveAnnouncement(
      `Approved and issued digital gate pass for ${item.studentName}.`
    );
  };

  const handleRejectOrRevoke = (id, studentName) => {
    setFacultyQueue((prev) => prev.filter((r) => r.id !== id));
    setLiveAnnouncement(
      `Revoked slot access request for ${studentName || id}.`
    );
  };

  const handleReschedule = (id) => {
    setFacultyStatuses((prev) => ({ ...prev, [id]: "Rescheduled" }));
    setLiveAnnouncement(`Request ${id} marked for rescheduling.`);
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* WCAG 2.1 AA Skip to Content Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-indigo-600 focus:text-white focus:rounded-lg focus:shadow-xl focus:outline-none focus:ring-2 focus:ring-white"
      >
        Skip to main content
      </a>

      {/* Screen Reader Live Region for Announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {liveAnnouncement}
      </div>

      {/* Main Accessible Header */}
      <header className="border-b border-slate-800 bg-[#0c1222]/95 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/25 shrink-0">
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

          <nav className="flex flex-wrap gap-1.5" aria-label="Main Application Navigation">
            <button
              type="button"
              onClick={() => setActiveTab("catalog")}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
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
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
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
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                activeTab === "faculty-portal"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/80"
              }`}
            >
              Faculty Portal
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("utilization")}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                activeTab === "utilization"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/80"
              }`}
            >
              <BarChart3 className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              <span>Utilization Dashboard</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main id="main-content" className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab 1: Equipment Catalog & Discovery */}
        {activeTab === "catalog" && (
          <section aria-labelledby="catalog-heading" className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 id="catalog-heading" className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  University Laboratory Research & Resource Grid
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  Discover specialized engineering kits, development boards, and laboratory workstations across departments.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 bg-slate-900/90 border border-slate-800 px-4 py-2 rounded-xl text-xs shrink-0">
                <div>
                  <span className="block text-slate-400 text-[11px]">Active Shared Nodes</span>
                  <span className="font-semibold text-white text-sm">{equipmentList.length} Systems</span>
                </div>
                <div className="h-6 w-px bg-slate-800" />
                <div>
                  <span className="block text-slate-400 text-[11px]">Reclaimed Idle Hours</span>
                  <span className="font-semibold text-cyan-400 text-sm">{campusMetrics.reclaimedIdleHours} hrs</span>
                </div>
                <div className="h-6 w-px bg-slate-800" />
                <div>
                  <span className="block text-slate-400 text-[11px]">Live Grid Utilization</span>
                  <span className="font-semibold text-emerald-400 text-sm">{liveUtilization}%</span>
                </div>
              </div>
            </div>

            {/* Search, Department Filter, and Register Lab Resource Controls */}
            <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
              <div className="relative w-full md:w-80 shrink-0">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
                <input
                  type="text"
                  placeholder="Search Jetson, FPGA, 3D printer, specs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search laboratory equipment by name, category, specs, or location"
                  className="w-full bg-[#070b14] border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto" role="toolbar" aria-label="Department filters">
                <SlidersHorizontal className="w-4 h-4 text-slate-400 shrink-0 mr-1" aria-hidden="true" />
                {departments.map((dept) => (
                  <button
                    key={dept}
                    type="button"
                    onClick={() => setSelectedDept(dept)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                      selectedDept === dept
                        ? "bg-indigo-600 text-white font-semibold shadow"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    {dept}
                  </button>
                ))}
              </div>

              {/* Dynamic Add Equipment Button */}
              <button
                type="button"
                onClick={handleOpenRegisterModal}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 shadow-md shadow-indigo-600/25 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span>Register Lab Resource</span>
              </button>
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
                    className="bg-[#0f172a]/90 border border-slate-800 hover:border-slate-700/80 transition-all rounded-2xl p-5 flex flex-col justify-between shadow-lg shadow-black/20 relative group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-300 bg-indigo-950/80 border border-indigo-800/60 px-2.5 py-0.5 rounded-full">
                          {item.department}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                              item.availableUnits > 0
                                ? "bg-emerald-950/80 text-emerald-300 border border-emerald-700/50"
                                : "bg-rose-950/80 text-rose-300 border border-rose-700/50"
                            }`}
                          >
                            {item.availableUnits > 0
                              ? `${item.availableUnits} of ${item.totalUnits} Available`
                              : "Booked (In Use)"}
                          </span>
                          {/* Subtle Decommission / Remove Button */}
                          <button
                            type="button"
                            onClick={() => handleRemoveEquipment(item.id, item.name)}
                            title="Decommission / Remove equipment node"
                            aria-label={`Decommission ${item.name}`}
                            className="p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition opacity-70 group-hover:opacity-100"
                          >
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      </div>

                      <h2 className="text-lg font-semibold text-white mb-1">{item.name}</h2>
                      <p className="text-xs text-cyan-400 mb-3 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <span>{item.labRoom}</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-400">Lead: {item.leadFaculty}</span>
                      </p>

                      <div className="space-y-2.5 text-xs text-slate-300 mb-5 bg-[#0a0f1d] p-3 rounded-xl border border-slate-800/80">
                        <div>
                          <strong className="text-slate-400 block mb-0.5 text-[11px] uppercase tracking-wide">
                            Key Specifications:
                          </strong>
                          <span className="text-slate-200">{item.specs}</span>
                        </div>
                        <div>
                          <strong className="text-slate-400 block mb-0.5 text-[11px] uppercase tracking-wide">
                            Prerequisites & Safety:
                          </strong>
                          <span className="text-slate-300">{item.prerequisites}</span>
                        </div>
                        <div className="pt-2 border-t border-slate-800/60 space-y-1">
                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span>Duty Utilization:</span>
                            <span className="font-semibold text-emerald-400">{item.dutyCycle || `${item.hourlyUtilization}%`}</span>
                          </div>
                          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-indigo-500 h-full rounded-full"
                              style={{ width: `${item.hourlyUtilization || 85}%` }}
                            />
                          </div>
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

        {/* Tab 2: AI Conflict Resolver with Dynamic Conflict Simulator */}
        {activeTab === "conflict-resolver" && (
          <section aria-labelledby="resolver-heading" className="space-y-6">
            <div className="bg-[#0f172a] border border-indigo-800/60 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1 id="resolver-heading" className="text-2xl font-bold text-white tracking-tight">
                    GenAI Scheduling & Conflict Resolver
                  </h1>
                  <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-indigo-950 text-indigo-300 border border-indigo-700/60 rounded-full">
                    Explainable AI (XAI)
                  </span>
                </div>
                <p className="text-sm text-slate-400 mt-1 max-w-2xl">
                  Intelligent arbitration resolving overlapping slot requests by balancing <strong className="text-slate-200">Deadline Proximity (50pts)</strong>,{" "}
                  <strong className="text-slate-200">Urgency Severity (30pts)</strong>, and{" "}
                  <strong className="text-slate-200">Resource Usage Equity (20pts)</strong>.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleOpenAddConflictModal}
                  className="px-3.5 py-2.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-medium text-xs sm:text-sm rounded-xl transition flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                >
                  <PlusCircle className="w-4 h-4" aria-hidden="true" />
                  <span>Add Competing Request</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowXaiModal(true)}
                  className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs sm:text-sm rounded-xl transition flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                >
                  <FileText className="w-4 h-4 text-cyan-300" aria-hidden="true" />
                  <span>XAI Model Specs</span>
                </button>
                <button
                  type="button"
                  onClick={handleRunAiSolver}
                  disabled={isSolving}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm rounded-xl transition flex items-center justify-center gap-2 shrink-0 shadow-lg shadow-indigo-600/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" aria-hidden="true" />
                  <span>{isSolving ? "Evaluating Conflicts..." : "Run AI Conflict Solver"}</span>
                </button>
              </div>
            </div>

            {/* Dynamic Competing Requests Grid */}
            <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-400" aria-hidden="true" />
                  <h2 className="text-lg font-semibold text-white">
                    Contested Hardware: NVIDIA Jetson Edge-AI Dev Kit
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-amber-400 bg-amber-950/60 border border-amber-800/50 px-2.5 py-1 rounded-full font-medium">
                    {conflictsList.length} Competing Requests for Slot: 10:00 AM - 01:00 PM
                  </span>
                  {conflictsList.length === 0 && (
                    <button
                      type="button"
                      onClick={handleResetConflicts}
                      className="text-xs text-indigo-400 hover:text-indigo-300 underline"
                    >
                      Restore Sample Conflicts
                    </button>
                  )}
                </div>
              </div>

              {conflictsList.length === 0 ? (
                <div className="p-8 text-center bg-[#0a0f1d] border border-slate-800 rounded-xl">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" aria-hidden="true" />
                  <p className="text-sm text-slate-300 font-medium">No competing requests in the conflict queue.</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Click "Add Competing Request" or "Restore Sample Conflicts" to simulate AI scheduling arbitration.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                  {conflictsList.map((req) => (
                    <div
                      key={req.id}
                      className="bg-[#0a0f1d] border border-slate-800 p-4 rounded-xl flex flex-col justify-between space-y-3 relative group"
                    >
                      <div>
                        <div className="flex justify-between items-start gap-1">
                          <span className="font-bold text-white text-sm">
                            {req.studentName}
                          </span>
                          <div className="flex items-center gap-1">
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
                            <button
                              type="button"
                              onClick={() => handleRemoveConflict(req.id)}
                              title="Remove request from simulation"
                              aria-label={`Remove conflict request for ${req.studentName}`}
                              className="text-slate-500 hover:text-rose-400 p-0.5 rounded transition"
                            >
                              <X className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                        <p className="text-slate-400 text-[11px] font-mono mt-0.5">
                          {req.usn} • {req.department}
                        </p>
                        <p className="text-slate-200 font-medium mt-2">
                          {req.projectTitle}
                        </p>
                        <p className="text-slate-400 text-[11px] mt-1 line-clamp-2">
                          {req.projectScope}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-800/80 space-y-1 text-slate-400">
                        <p className="text-amber-300 font-medium flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Deadline: {req.deadlineDaysRemaining} days remaining</span>
                        </p>
                        <p>Faculty Guide: {req.guideName}</p>
                        <p>Prior monthly allocations: <strong className="text-white">{req.priorMonthlyBookings}</strong></p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AI Decision Report with Explainable AI Card */}
            {aiReport && aiReport.winner && (
              <div className="bg-[#0f172a] border border-emerald-500/50 rounded-2xl p-6 space-y-5 shadow-xl">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" aria-hidden="true" />
                    <h2 className="text-xl font-bold text-white">Recommended Fair Allocation Decision</h2>
                  </div>
                  <span className="text-xs bg-emerald-950 text-emerald-300 border border-emerald-800 px-3 py-1 rounded-full font-semibold">
                    Winner Score: {aiReport.winner.compositeScore}/100
                  </span>
                </div>

                <div className="text-sm text-emerald-200 bg-emerald-950/40 border border-emerald-800/50 p-4 rounded-xl leading-relaxed">
                  {aiReport.explanation}
                </div>

                {/* Score Breakdown Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Primary Winner Card */}
                  <div className="bg-[#070b14] border border-emerald-800/60 p-4 rounded-xl space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block">
                      Primary Slot Allocation (Winner)
                    </span>
                    <p className="text-base font-bold text-white">{aiReport.winner.studentName}</p>
                    <p className="text-slate-300 font-medium">{aiReport.winner.projectTitle}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-300 pt-1 flex-wrap">
                      <span className="bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800">
                        Deadline: {aiReport.winner.scoreBreakdown?.deadlineScore}/50 pts
                      </span>
                      <span className="bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded border border-indigo-800">
                        Urgency: {aiReport.winner.scoreBreakdown?.urgencyScore}/30 pts
                      </span>
                      <span className="bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800">
                        Equity: {aiReport.winner.scoreBreakdown?.fairnessScore}/20 pts
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-slate-400">
                      <span>{aiReport.allocatedSlot}</span>
                      <span className="text-emerald-400 font-semibold text-sm">
                        Total: {aiReport.winner.compositeScore}/100
                      </span>
                    </div>
                  </div>

                  {/* Alternative Backup Card */}
                  {aiReport.suggestedAlternative && (
                    <div className="bg-[#070b14] border border-cyan-800/60 p-4 rounded-xl space-y-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 block">
                        Guaranteed Alternative Slot & Workstation Backup
                      </span>
                      <p className="text-base font-bold text-white">
                        {aiReport.suggestedAlternative.student}
                      </p>
                      <p className="text-slate-300 font-medium">
                        {aiReport.suggestedAlternative.suggestedDate} ({aiReport.suggestedAlternative.suggestedSlot})
                      </p>
                      <div className="pt-2 border-t border-slate-800 text-slate-400 space-y-1">
                        <div>
                          <span className="block text-[11px] uppercase tracking-wide text-cyan-500 font-semibold mb-0.5">
                            Workstation Backup:
                          </span>
                          <span>{aiReport.suggestedAlternative.workstationBackup}</span>
                        </div>
                        {aiReport.suggestedAlternative.reasoning && (
                          <p className="text-slate-500 text-[11px]">
                            {aiReport.suggestedAlternative.reasoning}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Tab 3: Faculty Portal & Gate Pass Generation */}
        {activeTab === "faculty-portal" && (
          <section aria-labelledby="faculty-heading" className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 id="faculty-heading" className="text-2xl font-bold text-white tracking-tight">
                  Faculty Approval Queue & Lab Pass Issuance
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  Authorize student research reservations, assign lab benches, and issue cryptographically verifiable Digital Lab Entry Passes.
                </p>
              </div>
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                <span>Faculty Authorization Station</span>
              </div>
            </div>

            {facultyQueue.length === 0 ? (
              <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-12 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" aria-hidden="true" />
                <h2 className="text-lg font-semibold text-slate-200">No Pending Requests in Faculty Queue</h2>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  All student laboratory slot requests have been approved or processed.
                </p>
                <button
                  type="button"
                  onClick={() => setFacultyQueue(sampleConflictingRequests)}
                  className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg"
                >
                  Reload Sample Queue
                </button>
              </div>
            ) : (
              <div className="bg-[#0f172a] border border-slate-800 rounded-2xl divide-y divide-slate-800 text-xs shadow-lg">
                {facultyQueue.map((item, idx) => {
                  const status = facultyStatuses[item.id] || "Pending";
                  const benchAssign = `Bench-0${idx + 2}B (Autonomous Systems Bay)`;
                  return (
                    <div
                      key={item.id}
                      className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-900/40 transition"
                    >
                      <div className="space-y-1.5">
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
                          <strong className="text-slate-400">Target Hardware:</strong> {item.equipmentName}
                        </p>
                        <p className="text-slate-300">
                          <strong className="text-slate-400">Project Scope:</strong> {item.projectTitle} — {item.projectScope}
                        </p>
                        <p className="text-slate-400 text-[11px]">
                          Deadline in {item.deadlineDaysRemaining} days • Faculty Guide: {item.guideName} • Prior Month Bookings: {item.priorMonthlyBookings}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleApproveAndIssuePass(item, benchAssign)}
                          className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                            status === "Approved"
                              ? "bg-emerald-700 hover:bg-emerald-600 text-white"
                              : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30"
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>{status === "Approved" ? "View Lab Pass" : "Approve & Issue Pass"}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleReschedule(item.id)}
                          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium transition flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                        >
                          <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Reschedule</span>
                        </button>

                        {/* Dynamic Reject / Revoke Request Button */}
                        <button
                          type="button"
                          onClick={() => handleRejectOrRevoke(item.id, item.studentName)}
                          className="px-3 py-2 bg-rose-950/70 hover:bg-rose-900 border border-rose-800/60 text-rose-300 rounded-lg font-medium transition flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                          aria-label={`Reject request for ${item.studentName}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Reject / Revoke</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Tab 4: Comprehensive Campus Resource Utilization Dashboard */}
        {activeTab === "utilization" && (
          <section aria-labelledby="metrics-heading" className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 id="metrics-heading" className="text-2xl font-bold text-white tracking-tight">
                  Campus Laboratory Resource Utilization Dashboard
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  Cross-departmental sharing analytics, CapEx savings, idle workstation reclamation, and hourly load bottlenecks.
                </p>
              </div>
              <div className="flex items-center gap-2 bg-emerald-950/80 border border-emerald-700/50 px-3 py-1.5 rounded-lg text-xs text-emerald-300">
                <TrendingUp className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                <span>Inter-Departmental Optimization Active</span>
              </div>
            </div>

            {/* Top KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs uppercase tracking-wide">Reclaimed Idle Hours</span>
                  <Clock className="w-4 h-4 text-cyan-400" aria-hidden="true" />
                </div>
                <div className="text-3xl font-bold text-cyan-400">{campusMetrics.reclaimedIdleHours} hrs</div>
                <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" aria-hidden="true" />
                  <span>+34.2% reduction in downtime</span>
                </p>
              </div>

              <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs uppercase tracking-wide">CapEx Saved</span>
                  <Award className="w-4 h-4 text-amber-400" aria-hidden="true" />
                </div>
                <div className="text-3xl font-bold text-amber-300">{campusMetrics.capexSavedINR}</div>
                <p className="text-[11px] text-slate-400 mt-1">Avoided duplicate procurement</p>
              </div>

              <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs uppercase tracking-wide">Cross-Dept Sharing Index</span>
                  <Layers className="w-4 h-4 text-indigo-400" aria-hidden="true" />
                </div>
                <div className="text-3xl font-bold text-white">{campusMetrics.crossDeptSharingIndex}</div>
                <p className="text-[11px] text-indigo-300 mt-1">142 cross-department projects</p>
              </div>

              <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs uppercase tracking-wide">Grid Utilization</span>
                  <Activity className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                </div>
                <div className="text-3xl font-bold text-emerald-400">{liveUtilization}%</div>
                <p className="text-[11px] text-slate-400 mt-1">Live computed across active nodes</p>
              </div>
            </div>

            {/* Department Sharing Matrix & Hourly Load Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Cross-Department Sharing Matrix */}
              <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6">
                <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-purple-400" aria-hidden="true" />
                  <span>Cross-Department Sharing Matrix</span>
                </h2>
                <div className="space-y-3 text-xs">
                  {campusMetrics.departmentSharingMatrix.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-[#0a0f1d] border border-slate-800 rounded-xl flex items-center justify-between gap-3"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 font-medium text-white">
                          <span className="text-indigo-400">{item.sourceDept}</span>
                          <span className="text-slate-500">→</span>
                          <span className="text-cyan-400">{item.targetLab}</span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Hardware: {item.equipmentUsed}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-bold text-emerald-400 text-sm">{item.hoursShared} hrs</span>
                        <span className="block text-[10px] text-slate-500 uppercase">Shared</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hourly Load Distribution (09:00 - 18:00) */}
              <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6">
                <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-400" aria-hidden="true" />
                  <span>Peak vs. Off-Peak Hourly Occupancy Distribution (09:00 - 18:00)</span>
                </h2>
                <div className="space-y-2.5">
                  {campusMetrics.hourlyLoadDistribution.map((slot) => (
                    <div key={slot.hour} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-300 font-mono">{slot.hour}:00</span>
                        <span className="text-slate-400 font-mono">
                          {slot.occupancy}% • {slot.status}
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            slot.occupancy >= 90
                              ? "bg-rose-500"
                              : slot.occupancy >= 75
                              ? "bg-amber-400"
                              : slot.occupancy >= 60
                              ? "bg-indigo-500"
                              : "bg-emerald-500"
                          }`}
                          style={{ width: `${slot.occupancy}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* GenAI Resource Optimization Insights */}
            <div className="bg-[#0f172a] border border-indigo-800/60 rounded-2xl p-6">
              <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-300" aria-hidden="true" />
                <span>GenAI Workstation Optimization Directives</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {campusMetrics.aiOptimizationTips.map((tip, idx) => (
                  <div key={idx} className="bg-[#0a0f1d] border border-slate-800 p-4 rounded-xl flex gap-3 items-start">
                    <span className="w-5 h-5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 flex items-center justify-center shrink-0 font-bold text-[10px]">
                      {idx + 1}
                    </span>
                    <p className="text-slate-300 leading-relaxed">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Register New Lab Resource Modal */}
      {isRegisterModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="register-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <div className="bg-[#0f172a] border border-indigo-500/60 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setIsRegisterModalOpen(false)}
              aria-label="Close register equipment modal"
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>

            <h2 id="register-modal-title" className="text-xl font-bold text-white mb-1">
              Register New Laboratory Resource
            </h2>
            <p className="text-xs text-indigo-400 mb-4">
              Add engineering kits, workstations, and high-value research gear to the Campus Sharing Grid.
            </p>

            <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs">
              <div>
                <label htmlFor="regName" className="block text-slate-300 font-medium mb-1">
                  Equipment / Workstation Name *
                </label>
                <input
                  id="regName"
                  type="text"
                  name="name"
                  required
                  value={newEquipmentData.name}
                  onChange={handleRegisterChange}
                  className="w-full bg-[#070b14] border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. Rohde & Schwarz Spectrum Analyzer"
                />
                {registerErrors.name && (
                  <span className="text-rose-400 mt-1 block">{registerErrors.name}</span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="regDept" className="block text-slate-300 font-medium mb-1">
                    Department *
                  </label>
                  <select
                    id="regDept"
                    name="department"
                    value={newEquipmentData.department}
                    onChange={handleRegisterChange}
                    className="w-full bg-[#070b14] border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {departments.filter((d) => d !== "All").map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="regUnits" className="block text-slate-300 font-medium mb-1">
                    Total Units Available (1-50) *
                  </label>
                  <input
                    id="regUnits"
                    type="number"
                    name="totalUnits"
                    min="1"
                    max="50"
                    required
                    value={newEquipmentData.totalUnits}
                    onChange={handleRegisterChange}
                    className="w-full bg-[#070b14] border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {registerErrors.totalUnits && (
                    <span className="text-rose-400 mt-1 block">{registerErrors.totalUnits}</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="regRoom" className="block text-slate-300 font-medium mb-1">
                    Lab Room & Location *
                  </label>
                  <input
                    id="regRoom"
                    type="text"
                    name="labRoom"
                    required
                    value={newEquipmentData.labRoom}
                    onChange={handleRegisterChange}
                    className="w-full bg-[#070b14] border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g. Room 204 - RF Lab"
                  />
                  {registerErrors.labRoom && (
                    <span className="text-rose-400 mt-1 block">{registerErrors.labRoom}</span>
                  )}
                </div>

                <div>
                  <label htmlFor="regFaculty" className="block text-slate-300 font-medium mb-1">
                    Faculty Lead / Custodian
                  </label>
                  <input
                    id="regFaculty"
                    type="text"
                    name="leadFaculty"
                    value={newEquipmentData.leadFaculty}
                    onChange={handleRegisterChange}
                    className="w-full bg-[#070b14] border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g. Dr. K. M. Rao"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="regSpecs" className="block text-slate-300 font-medium mb-1">
                  Key Technical Specifications
                </label>
                <input
                  id="regSpecs"
                  type="text"
                  name="specs"
                  value={newEquipmentData.specs}
                  onChange={handleRegisterChange}
                  className="w-full bg-[#070b14] border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. 6 GHz frequency sweep, 10-bit vertical resolution, Ethernet/USB interface"
                />
              </div>

              <div>
                <label htmlFor="regPrereq" className="block text-slate-300 font-medium mb-1">
                  Prerequisites & Safety Clearance
                </label>
                <input
                  id="regPrereq"
                  type="text"
                  name="prerequisites"
                  value={newEquipmentData.prerequisites}
                  onChange={handleRegisterChange}
                  className="w-full bg-[#070b14] border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. RF Circuit Theory, Basic Instrument Calibration Induction"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition shadow-md shadow-indigo-600/30"
                >
                  Confirm & Register Resource
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Competing Request Modal (AI Conflict Simulator) */}
      {isAddConflictModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-conflict-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <div className="bg-[#0f172a] border border-cyan-500/60 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setIsAddConflictModalOpen(false)}
              aria-label="Close add conflict modal"
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>

            <h2 id="add-conflict-modal-title" className="text-xl font-bold text-white mb-1">
              Add Competing Slot Request
            </h2>
            <p className="text-xs text-cyan-400 mb-4">
              Simulate high-competition slot scenarios for the NVIDIA Jetson Edge-AI Dev Kit.
            </p>

            <form onSubmit={handleAddConflictSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="confName" className="block text-slate-300 font-medium mb-1">
                    Student Name *
                  </label>
                  <input
                    id="confName"
                    type="text"
                    name="studentName"
                    required
                    value={newConflictData.studentName}
                    onChange={handleConflictChange}
                    className="w-full bg-[#070b14] border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="e.g. Tanvi Deshmukh"
                  />
                  {conflictFormErrors.studentName && (
                    <span className="text-rose-400 mt-1 block">{conflictFormErrors.studentName}</span>
                  )}
                </div>

                <div>
                  <label htmlFor="confUsn" className="block text-slate-300 font-medium mb-1">
                    College USN / ID *
                  </label>
                  <input
                    id="confUsn"
                    type="text"
                    name="usn"
                    required
                    value={newConflictData.usn}
                    onChange={handleConflictChange}
                    className="w-full bg-[#070b14] border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="e.g. 1MS22CS112"
                  />
                  {conflictFormErrors.usn && (
                    <span className="text-rose-400 mt-1 block">{conflictFormErrors.usn}</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="confDept" className="block text-slate-300 font-medium mb-1">
                    Department
                  </label>
                  <select
                    id="confDept"
                    name="department"
                    value={newConflictData.department}
                    onChange={handleConflictChange}
                    className="w-full bg-[#070b14] border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    {departments.filter((d) => d !== "All").map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="confUrgency" className="block text-slate-300 font-medium mb-1">
                    Urgency Tier
                  </label>
                  <select
                    id="confUrgency"
                    name="urgencyLevel"
                    value={newConflictData.urgencyLevel}
                    onChange={handleConflictChange}
                    className="w-full bg-[#070b14] border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="Critical">Critical (Capstone / Competition)</option>
                    <option value="High">High (Mini-Project Milestone)</option>
                    <option value="Normal">Normal (Coursework Lab)</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="confTitle" className="block text-slate-300 font-medium mb-1">
                  Project Title *
                </label>
                <input
                  id="confTitle"
                  type="text"
                  name="projectTitle"
                  required
                  value={newConflictData.projectTitle}
                  onChange={handleConflictChange}
                  className="w-full bg-[#070b14] border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="e.g. Micro-UAV Optical Flow Stabilization"
                />
                {conflictFormErrors.projectTitle && (
                  <span className="text-rose-400 mt-1 block">{conflictFormErrors.projectTitle}</span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="confDays" className="block text-slate-300 font-medium mb-1">
                    Deadline (Days Remaining: 1-30)
                  </label>
                  <input
                    id="confDays"
                    type="number"
                    name="deadlineDaysRemaining"
                    min="1"
                    max="30"
                    required
                    value={newConflictData.deadlineDaysRemaining}
                    onChange={handleConflictChange}
                    className="w-full bg-[#070b14] border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label htmlFor="confPrior" className="block text-slate-300 font-medium mb-1">
                    Past Monthly Bookings (0-20)
                  </label>
                  <input
                    id="confPrior"
                    type="number"
                    name="priorMonthlyBookings"
                    min="0"
                    max="20"
                    required
                    value={newConflictData.priorMonthlyBookings}
                    onChange={handleConflictChange}
                    className="w-full bg-[#070b14] border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddConflictModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-medium transition shadow-md shadow-cyan-600/30"
                >
                  Simulate Competing Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Digital Lab Entry Pass Modal */}
      {isPassModalOpen && activeDigitalPass && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pass-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <div className="bg-[#0f172a] border border-indigo-500/60 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setIsPassModalOpen(false)}
              aria-label="Close digital lab pass modal"
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-700 flex items-center justify-center">
                <QrCode className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <h2 id="pass-modal-title" className="text-lg font-bold text-white">
                  Digital Lab Entry Pass
                </h2>
                <span className="text-[10px] uppercase font-mono text-emerald-400">
                  Status: {activeDigitalPass.status}
                </span>
              </div>
            </div>

            {/* SVG QR Code Simulation Vector */}
            <div className="bg-white p-4 rounded-xl flex flex-col items-center justify-center mb-4">
              <svg
                width="140"
                height="140"
                viewBox="0 0 140 140"
                className="mx-auto"
                aria-label={`QR Code for pass ID ${activeDigitalPass.passId}`}
                role="img"
              >
                {/* QR Code Corner Markers */}
                <rect x="10" y="10" width="36" height="36" fill="#000" rx="4" />
                <rect x="16" y="16" width="24" height="24" fill="#fff" rx="2" />
                <rect x="22" y="22" width="12" height="12" fill="#000" rx="2" />

                <rect x="94" y="10" width="36" height="36" fill="#000" rx="4" />
                <rect x="100" y="16" width="24" height="24" fill="#fff" rx="2" />
                <rect x="106" y="22" width="12" height="12" fill="#000" rx="2" />

                <rect x="10" y="94" width="36" height="36" fill="#000" rx="4" />
                <rect x="16" y="100" width="24" height="24" fill="#fff" rx="2" />
                <rect x="22" y="106" width="12" height="12" fill="#000" rx="2" />

                {/* Simulated Data Matrix Bits */}
                <rect x="54" y="14" width="8" height="8" fill="#000" />
                <rect x="66" y="26" width="8" height="8" fill="#000" />
                <rect x="78" y="14" width="8" height="8" fill="#000" />
                <rect x="54" y="38" width="8" height="8" fill="#000" />
                <rect x="14" y="54" width="8" height="8" fill="#000" />
                <rect x="26" y="66" width="8" height="8" fill="#000" />
                <rect x="38" y="54" width="8" height="8" fill="#000" />
                <rect x="54" y="54" width="32" height="32" fill="#000" rx="3" />
                <rect x="62" y="62" width="16" height="16" fill="#fff" rx="2" />
                <rect x="94" y="54" width="8" height="8" fill="#000" />
                <rect x="106" y="66" width="8" height="8" fill="#000" />
                <rect x="118" y="54" width="8" height="8" fill="#000" />
                <rect x="54" y="94" width="8" height="8" fill="#000" />
                <rect x="66" y="106" width="8" height="8" fill="#000" />
                <rect x="78" y="94" width="8" height="8" fill="#000" />
                <rect x="94" y="94" width="8" height="8" fill="#000" />
                <rect x="106" y="106" width="8" height="8" fill="#000" />
                <rect x="118" y="118" width="8" height="8" fill="#000" />
              </svg>
              <span className="text-[11px] font-mono text-slate-800 font-bold mt-2">
                {activeDigitalPass.passId}
              </span>
            </div>

            {/* Pass Metadata List */}
            <div className="bg-[#0a0f1d] border border-slate-800 p-3.5 rounded-xl space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Student:</span>
                <span className="font-bold text-white">{activeDigitalPass.studentName} ({activeDigitalPass.usn})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Department:</span>
                <span className="text-indigo-300 font-medium">{activeDigitalPass.department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Assigned Bench:</span>
                <span className="text-cyan-400 font-semibold">{activeDigitalPass.benchNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Allocated Slot:</span>
                <span className="text-white">{activeDigitalPass.slotDate} ({activeDigitalPass.timeSlot})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Faculty Sponsor:</span>
                <span className="text-slate-200">{activeDigitalPass.facultySponsor}</span>
              </div>
              <div className="pt-2 border-t border-slate-800/80 flex justify-between text-[11px]">
                <span className="text-slate-400">Verification Hash:</span>
                <span className="font-mono text-emerald-400">{activeDigitalPass.verificationHash}</span>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setIsPassModalOpen(false)}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
              >
                Close Pass Viewer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Explainable AI (XAI) Model Specs Modal */}
      {showXaiModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="xai-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <div className="bg-[#0f172a] border border-indigo-500/60 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setShowXaiModal(false)}
              aria-label="Close XAI modal"
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>

            <h2 id="xai-modal-title" className="text-xl font-bold text-white mb-2">
              Explainable AI (XAI) Conflict Resolution Model
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Transparent multi-criteria decision formula guaranteeing verifiable fairness across departments.
            </p>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#0a0f1d] border border-slate-800 rounded-xl">
                <span className="font-bold text-emerald-400 block mb-1">
                  1. Project Deadline Proximity (Weight: 50%)
                </span>
                <p className="text-slate-300 leading-relaxed">
                  Awards up to 50 points based on imminent submission windows (e.g. ≤2 days: 50pts, ≤4 days: 42pts, ≤7 days: 34pts) to prevent catastrophic student milestone failures.
                </p>
              </div>

              <div className="p-3 bg-[#0a0f1d] border border-slate-800 rounded-xl">
                <span className="font-bold text-indigo-400 block mb-1">
                  2. Academic Urgency Severity (Weight: 30%)
                </span>
                <p className="text-slate-300 leading-relaxed">
                  Evaluates project tier: Critical (Capstone / National Competition = 30pts), High (Mini-Project Milestone = 20pts), Normal (Standard Coursework = 10pts).
                </p>
              </div>

              <div className="p-3 bg-[#0a0f1d] border border-slate-800 rounded-xl">
                <span className="font-bold text-cyan-400 block mb-1">
                  3. Resource Equity & Fairness (Weight: 20%)
                </span>
                <p className="text-slate-300 leading-relaxed">
                  Penalizes heavy repeat usage to prevent hardware monopolization (0 prior bookings = 20pts full equity bonus, 5+ prior bookings = 4pts penalty).
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowXaiModal(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
              >
                Close Specifications
              </button>
            </div>
          </div>
        </div>
      )}

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
                    placeholder="e.g. Autonomous Search & Rescue Drone Navigation"
                  />
                  {formErrors.projectTitle && (
                    <span id="projectTitle-error" className="text-rose-400 mt-1 block">
                      {formErrors.projectTitle}
                    </span>
                  )}
                </div>

                <div>
                  <label htmlFor="projectScope" className="block text-slate-300 font-medium mb-1">
                    Project Scope & Workstation Needs
                  </label>
                  <textarea
                    id="projectScope"
                    name="projectScope"
                    rows={2}
                    value={formData.projectScope}
                    onChange={handleFormChange}
                    className="w-full bg-[#070b14] border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Describe specific models, sensors, libraries, and hardware interfaces required..."
                  />
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

      {/* Accessible Footer */}
      <footer className="border-t border-slate-800 py-4 text-center text-xs text-slate-500">
        LabLink • Campus Laboratory Resource Grid • PromptWars Hackathon
      </footer>
    </div>
  );
}
