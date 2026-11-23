import React, { useState } from "react";
import {
  Cpu,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Search,
  SlidersHorizontal,
  Building2,
  Sparkles
} from "lucide-react";
import { initialEquipment, sampleConflictingRequests } from "./data/labData";
import { resolveAllocationConflict } from "./services/aiScheduler";
import { sanitizeInput, validateBookingPayload } from "./utils/security";

export default function App() {
  const [equipmentList] = useState(initialEquipment);
  const [selectedDept, setSelectedDept] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("catalog");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetEquipment, setTargetEquipment] = useState(null);
  const [formData, setFormData] = useState({
    studentName: "",
    usn: "",
    department: "ISE",
    projectTitle: "",
    deadline: "",
    urgencyLevel: "Normal",
    guideName: ""
  });
  const [formErrors, setFormErrors] = useState({});
  const [bookingSuccess, setBookingSuccess] = useState(null);

  const [conflicts] = useState(sampleConflictingRequests);
  const [aiReport, setAiReport] = useState(null);

  const departments = [
    "All",
    "AI & Robotics",
    "ECE / VLSI",
    "Mechanical / Prototyping",
    "VLSI & Embedded",
    "Biotechnology",
    "Computer Science & ISE"
  ];

  const filteredEquipment = equipmentList.filter((item) => {
    const matchesDept =
      selectedDept === "All" ||
      item.department.toLowerCase().includes(selectedDept.toLowerCase());
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.specs.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
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
    setFormData((prev) => ({ ...prev, [name]: sanitizeInput(value) }));
  };

  const handleBookingSubmit = (e) => {
    e.preventDefault();
    const validation = validateBookingPayload(formData);
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }

    setBookingSuccess(
      `Request submitted for ${targetEquipment.name}. Routed to ${
        formData.guideName || "Department Faculty"
      } for approval.`
    );
    setTimeout(() => {
      setIsModalOpen(false);
      setFormData({
        studentName: "",
        usn: "",
        department: "ISE",
        projectTitle: "",
        deadline: "",
        urgencyLevel: "Normal",
        guideName: ""
      });
      setBookingSuccess(null);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:p-3 focus:bg-indigo-600 focus:text-white"
      >
        Skip to main content
      </a>

      <header className="border-b border-slate-800 bg-[#0c1222]/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Cpu className="w-6 h-6 text-white" aria-hidden="true" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white">
                LabLink
              </span>
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider bg-indigo-950 text-indigo-300 border border-indigo-700/50 rounded-full">
                GenAI Lab Grid
              </span>
            </div>
          </div>

          <nav className="flex space-x-2" aria-label="Main Navigation">
            <button
              type="button"
              onClick={() => setActiveTab("catalog")}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition ${
                activeTab === "catalog"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
            >
              Equipment Catalog
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("conflict-resolver")}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                activeTab === "conflict-resolver"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Sparkles className="w-4 h-4 text-cyan-300" aria-hidden="true" />
              AI Conflict Resolver
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("faculty-portal")}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition ${
                activeTab === "faculty-portal"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
            >
              Faculty Portal
            </button>
          </nav>
        </div>
      </header>

      <main id="main-content" className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "catalog" && (
          <section aria-labelledby="catalog-heading">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
              <div>
                <h1 id="catalog-heading" className="text-2xl sm:text-3xl font-bold text-white">
                  Campus Laboratory Resource Sharing
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  Discover equipment, book project slots, and share specialized lab hardware across departments.
                </p>
              </div>
              <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-xl text-xs">
                <div>
                  <span className="block text-slate-400">Shared Nodes</span>
                  <span className="font-semibold text-white text-sm">23 Systems</span>
                </div>
                <div className="h-7 w-px bg-slate-800" />
                <div>
                  <span className="block text-slate-400">Utilization</span>
                  <span className="font-semibold text-emerald-400 text-sm">88.4%</span>
                </div>
              </div>
            </div>

            <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-4 mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:w-96">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
                <input
                  type="text"
                  placeholder="Search Jetson, FPGA, 3D printer, specs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search laboratory equipment"
                  className="w-full bg-[#070b14] border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
                <SlidersHorizontal className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
                {departments.map((dept) => (
                  <button
                    key={dept}
                    type="button"
                    onClick={() => setSelectedDept(dept)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                      selectedDept === dept
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    {dept}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEquipment.map((item) => (
                <article
                  key={item.id}
                  className="bg-[#0f172a]/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-300 bg-indigo-950 border border-indigo-800/60 px-2.5 py-0.5 rounded-full">
                        {item.department}
                      </span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                          item.availableUnits > 0
                            ? "bg-emerald-950 text-emerald-300 border border-emerald-700/50"
                            : "bg-rose-950 text-rose-300 border border-rose-700/50"
                        }`}
                      >
                        {item.availableUnits > 0 ? `${item.availableUnits} Available` : "Booked"}
                      </span>
                    </div>

                    <h2 className="text-lg font-semibold text-white mb-1">{item.name}</h2>
                    <p className="text-xs text-cyan-400 mb-3 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5" aria-hidden="true" />
                      {item.labRoom}
                    </p>

                    <div className="space-y-2 text-xs text-slate-300 mb-4 bg-slate-900/70 p-3 rounded-xl border border-slate-800/60">
                      <div>
                        <strong className="text-slate-400 block mb-0.5">Specs:</strong>
                        {item.specs}
                      </div>
                      <div>
                        <strong className="text-slate-400 block mb-0.5">Prerequisites:</strong>
                        {item.prerequisites}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenBooking(item)}
                    className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl transition flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  >
                    <Calendar className="w-4 h-4" aria-hidden="true" />
                    Request Project-Based Slot
                  </button>
                </article>
              ))}
            </div>
          </section>
        )}

        {activeTab === "conflict-resolver" && (
          <section aria-labelledby="resolver-heading" className="space-y-6">
            <div className="bg-[#0f172a] border border-indigo-800/60 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 id="resolver-heading" className="text-2xl font-bold text-white">
                  GenAI Scheduling & Conflict Resolver
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  Resolves overlapping equipment requests using project deadlines, urgency, and fairness scores.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAiReport(resolveAllocationConflict(conflicts))}
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl transition flex items-center gap-2 shrink-0"
              >
                <Sparkles className="w-4 h-4 text-amber-300" aria-hidden="true" />
                Run AI Conflict Solver
              </button>
            </div>

            <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-400" aria-hidden="true" />
                Overlapping Requests: NVIDIA Jetson AGX Orin DevKit
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {conflicts.map((req) => (
                  <div key={req.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-white text-sm">
                        {req.studentName} ({req.usn})
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-indigo-300 font-medium">
                        {req.urgencyLevel}
                      </span>
                    </div>
                    <p className="text-slate-400">{req.department} • Guide: {req.guideName}</p>
                    <p className="text-slate-200">Project: {req.projectTitle}</p>
                    <p className="text-amber-300">Deadline: {req.deadlineDaysRemaining} days left</p>
                    <p className="text-slate-400">
                      Slot: {req.slotDate} ({req.timeSlot}) • Monthly bookings: {req.priorAllocationsThisMonth}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {aiReport && (
              <div className="bg-slate-900 border border-emerald-500/50 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" aria-hidden="true" />
                  <h2 className="text-xl font-bold text-white">Recommended Fair Allocation</h2>
                </div>
                <p className="text-sm text-emerald-200 bg-emerald-950/30 border border-emerald-800/40 p-4 rounded-xl">
                  {aiReport.explanation}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-[#070b14] border border-slate-800 p-4 rounded-xl">
                    <span className="text-[11px] font-bold uppercase text-emerald-400 block mb-1">
                      Primary Allocation
                    </span>
                    <p className="text-sm font-bold text-white">{aiReport.winner.studentName}</p>
                    <p className="text-slate-400 mt-1">
                      {aiReport.allocatedSlot} • Score: {aiReport.winner.compositeScore}/100
                    </p>
                  </div>
                  {aiReport.suggestedAlternative && (
                    <div className="bg-[#070b14] border border-slate-800 p-4 rounded-xl">
                      <span className="text-[11px] font-bold uppercase text-cyan-400 block mb-1">
                        Alternative Slot & Backup
                      </span>
                      <p className="text-sm font-bold text-white">
                        {aiReport.suggestedAlternative.student}
                      </p>
                      <p className="text-slate-400 mt-1">
                        {aiReport.suggestedAlternative.suggestedDate} ({aiReport.suggestedAlternative.suggestedSlot})
                      </p>
                      <p className="text-slate-400 mt-0.5">
                        {aiReport.suggestedAlternative.workstationBackup}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        )}

        {activeTab === "faculty-portal" && (
          <section aria-labelledby="faculty-heading" className="space-y-6">
            <div>
              <h1 id="faculty-heading" className="text-2xl font-bold text-white">
                Faculty Approval Queue
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Approve cross-department equipment requests or reassign time slots.
              </p>
            </div>
            <div className="bg-[#0f172a] border border-slate-800 rounded-2xl divide-y divide-slate-800 text-xs">
              {conflicts.map((item) => (
                <div
                  key={item.id}
                  className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div>
                    <p className="font-bold text-white text-sm">
                      {item.studentName} ({item.usn}) • {item.department}
                    </p>
                    <p className="text-slate-300 mt-0.5">
                      {item.equipmentName} — {item.projectTitle}
                    </p>
                    <p className="text-slate-400 mt-0.5">
                      Deadline in {item.deadlineDaysRemaining} days • Guide: {item.guideName}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => alert(`Approved ${item.id} for ${item.studentName}`)}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => alert(`Reassigned ${item.id}`)}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium"
                    >
                      Reschedule
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
        >
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h2 id="modal-title" className="text-xl font-bold text-white mb-1">
              Request Slot: {targetEquipment?.name}
            </h2>
            <p className="text-xs text-indigo-400 mb-4">
              {targetEquipment?.department} • {targetEquipment?.labRoom}
            </p>

            {bookingSuccess ? (
              <div className="p-4 bg-emerald-950/60 border border-emerald-700 text-emerald-200 text-sm rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" aria-hidden="true" />
                <span>{bookingSuccess}</span>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Student Name *</label>
                    <input
                      type="text"
                      name="studentName"
                      required
                      value={formData.studentName}
                      onChange={handleFormChange}
                      className="w-full bg-[#070b14] border border-slate-700 rounded-lg px-3 py-2 text-white"
                    />
                    {formErrors.studentName && (
                      <span className="text-rose-400 mt-1 block">{formErrors.studentName}</span>
                    )}
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">College USN / ID *</label>
                    <input
                      type="text"
                      name="usn"
                      required
                      value={formData.usn}
                      onChange={handleFormChange}
                      className="w-full bg-[#070b14] border border-slate-700 rounded-lg px-3 py-2 text-white"
                    />
                    {formErrors.usn && (
                      <span className="text-rose-400 mt-1 block">{formErrors.usn}</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Project Title *</label>
                  <input
                    type="text"
                    name="projectTitle"
                    required
                    value={formData.projectTitle}
                    onChange={handleFormChange}
                    className="w-full bg-[#070b14] border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                  {formErrors.projectTitle && (
                    <span className="text-rose-400 mt-1 block">{formErrors.projectTitle}</span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Project Deadline *</label>
                    <input
                      type="date"
                      name="deadline"
                      required
                      value={formData.deadline}
                      onChange={handleFormChange}
                      className="w-full bg-[#070b14] border border-slate-700 rounded-lg px-3 py-2 text-white"
                    />
                    {formErrors.deadline && (
                      <span className="text-rose-400 mt-1 block">{formErrors.deadline}</span>
                    )}
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Urgency Level</label>
                    <select
                      name="urgencyLevel"
                      value={formData.urgencyLevel}
                      onChange={handleFormChange}
                      className="w-full bg-[#070b14] border border-slate-700 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="Normal">Normal (Coursework)</option>
                      <option value="High">High (Mini-Project)</option>
                      <option value="Critical">Critical (Capstone / Competition)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Faculty Guide Name</label>
                  <input
                    type="text"
                    name="guideName"
                    value={formData.guideName}
                    onChange={handleFormChange}
                    className="w-full bg-[#070b14] border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium"
                  >
                    Confirm Request
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <footer className="border-t border-slate-800 py-4 text-center text-xs text-slate-500">
        LabLink • Campus Laboratory Resource Grid • PromptWars Hackathon
      </footer>
    </div>
  );
}