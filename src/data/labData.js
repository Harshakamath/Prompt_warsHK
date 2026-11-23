/**
 * LabLink - Campus Laboratory Resource Grid
 * Production dataset of specialized equipment, workstations,
 * conflicting slot requests, and resource utilization metrics.
 */

/**
 * Specialized cross-departmental laboratory equipment and workstations.
 */
export const initialEquipment = [
  {
    id: "EQ-AI-01",
    name: "NVIDIA Jetson Edge-AI Dev Kit",
    category: "Edge AI & Autonomous Systems",
    department: "Robotics & AI",
    labRoom: "Room 304 - Autonomous Systems Lab",
    leadFaculty: "Dr. Ananya Sen",
    specs: "NVIDIA Ampere GPU, 64GB Unified RAM, 275 TOPS AI compute for real-time vision & autonomous navigation",
    prerequisites: "Python & CUDA basics, Lab Safety Induction Level 1",
    totalUnits: 3,
    availableUnits: 1,
    dutyCycle: "94%",
    hourlyUtilization: 94
  },
  {
    id: "EQ-RF-02",
    name: "Keysight DSO 4-Channel Mixed Signal Oscilloscope",
    category: "RF & High-Speed Signal Analysis",
    department: "ECE / VLSI",
    labRoom: "Room 204 - Signal Processing Lab",
    leadFaculty: "Dr. M. S. Suresh",
    specs: "2.5 GHz Bandwidth, 16-channel digital logic MSO, high-speed waveform capture & FFT analysis",
    prerequisites: "Digital Circuit Theory, RF Probe Calibration Clearance",
    totalUnits: 2,
    availableUnits: 1,
    dutyCycle: "76%",
    hourlyUtilization: 76
  },
  {
    id: "EQ-MECH-03",
    name: "Formlabs SLA 3D Prototyping Printer",
    category: "Additive Manufacturing & Prototyping",
    department: "Mechanical",
    labRoom: "FabLab Workshop B",
    leadFaculty: "Dr. B. R. Patil",
    specs: "Precision Stereolithography (SLA), 25µm resolution, Tough & Engineering resin support",
    prerequisites: "CAD clearance (Fusion 360 / SolidWorks), PreForm slicer training",
    totalUnits: 2,
    availableUnits: 0,
    dutyCycle: "98%",
    hourlyUtilization: 98
  },
  {
    id: "EQ-VLSI-04",
    name: "Xilinx Zynq FPGA Development Kit",
    category: "Embedded & FPGA Acceleration",
    department: "VLSI & Embedded",
    labRoom: "Room 310 - Digital Systems Lab",
    leadFaculty: "Prof. K. Venkatesh",
    specs: "Dual ARM Cortex-A9 core, 85K programmable logic cells, PCIe Gen2 & gigabit Ethernet interfaces",
    prerequisites: "Verilog / VHDL fundamentals, Vivado design flow basics",
    totalUnits: 4,
    availableUnits: 2,
    dutyCycle: "82%",
    hourlyUtilization: 82
  },
  {
    id: "EQ-CS-05",
    name: "Dual RTX 4090 Deep Learning Workstation",
    category: "Deep Learning & Parallel Computing",
    department: "CSE / ISE",
    labRoom: "Cloud & High-Performance Lab",
    leadFaculty: "Dr. Sudhir Rao",
    specs: "Dual 24GB RTX 4090 GPUs (48GB VRAM), 128GB DDR5 RAM, NVMe RAID scratch disk",
    prerequisites: "Linux CLI proficiency, PyTorch / Docker container basics",
    totalUnits: 5,
    availableUnits: 3,
    dutyCycle: "96%",
    hourlyUtilization: 96
  },
  {
    id: "EQ-BIO-06",
    name: "Eppendorf Mastercycler PCR Workstation",
    category: "Molecular Diagnostics & Genomics",
    department: "Biotechnology",
    labRoom: "Genomics Research Lab 105",
    leadFaculty: "Dr. Kavita Hegde",
    specs: "Gradient thermal cycler, 96-well format, optical reaction monitoring, vapo.protect lid",
    prerequisites: "Biosafety Level 1 (BSL-1) induction, micropipetting protocol certified",
    totalUnits: 2,
    availableUnits: 1,
    dutyCycle: "85%",
    hourlyUtilization: 85
  }
];

/**
 * Realistic conflicting requests clashing for the Jetson Dev Kit:
 * - Student A: Capstone presentation in 2 days (Critical urgency)
 * - Student B: Mini-project due in 18 days (Normal urgency)
 */
export const sampleConflictingRequests = [
  {
    id: "REQ-2026-001",
    studentName: "Aarav Sharma",
    usn: "1MS21CS004",
    department: "CSE / ISE",
    projectTitle: "Autonomous Search & Rescue Drone Navigation",
    projectScope: "Deploying quantized YOLOv11 & DeepSORT on Jetson Orin before Final Year Capstone presentation in 2 days.",
    deadlineDaysRemaining: 2,
    urgencyLevel: "Critical",
    priorMonthlyBookings: 1,
    priorAllocationsThisMonth: 1,
    guideName: "Dr. Sudhir Rao",
    equipmentId: "EQ-AI-01",
    equipmentName: "NVIDIA Jetson Edge-AI Dev Kit",
    slotDate: "2026-11-24",
    timeSlot: "10:00 AM - 01:00 PM"
  },
  {
    id: "REQ-2026-002",
    studentName: "Priyanka Nair",
    usn: "1MS21EC089",
    department: "ECE / VLSI",
    projectTitle: "FPGA-Accelerated Edge Telemetry Vision Engine",
    projectScope: "Hardware profiling of live video compression for 5th semester mini-project due in 18 days.",
    deadlineDaysRemaining: 18,
    urgencyLevel: "Normal",
    priorMonthlyBookings: 5,
    priorAllocationsThisMonth: 5,
    guideName: "Prof. K. Venkatesh",
    equipmentId: "EQ-AI-01",
    equipmentName: "NVIDIA Jetson Edge-AI Dev Kit",
    slotDate: "2026-11-24",
    timeSlot: "10:00 AM - 01:00 PM"
  }
];

/**
 * Campus laboratory sharing and resource utilization metrics.
 */
export const campusMetrics = {
  reclaimedIdleHours: 148,
  capexSavedINR: "₹6.8 Lakhs",
  crossDeptSharingIndex: "91.4%",
  overallUtilization: 88.4,
  idleReductionPercentage: "+34.2%",
  activeSharedNodes: 20,
  crossDeptCollaborations: 142,
  departmentSharingMatrix: [
    {
      sourceDept: "CSE / ISE",
      targetLab: "ECE Signal Processing Lab",
      hoursShared: 42,
      equipmentUsed: "Keysight DSO 4-Channel Oscilloscope"
    },
    {
      sourceDept: "ECE / VLSI",
      targetLab: "Robotics Autonomous Systems Lab",
      hoursShared: 38,
      equipmentUsed: "NVIDIA Jetson Edge-AI Dev Kit"
    },
    {
      sourceDept: "Biotechnology",
      targetLab: "FabLab Workshop B",
      hoursShared: 26,
      equipmentUsed: "Formlabs SLA 3D Prototyping Printer"
    },
    {
      sourceDept: "Mechanical",
      targetLab: "Robotics Autonomous Systems Lab",
      hoursShared: 24,
      equipmentUsed: "NVIDIA Jetson Edge-AI Dev Kit"
    },
    {
      sourceDept: "VLSI & Embedded",
      targetLab: "Cloud & High-Performance Lab",
      hoursShared: 18,
      equipmentUsed: "Dual RTX 4090 Deep Learning Workstation"
    }
  ],
  hourlyLoadDistribution: [
    { hour: "09:00", occupancy: 45, status: "Off-Peak" },
    { hour: "10:00", occupancy: 78, status: "Moderate" },
    { hour: "11:00", occupancy: 96, status: "Peak Contention" },
    { hour: "12:00", occupancy: 92, status: "Peak Contention" },
    { hour: "13:00", occupancy: 60, status: "Lunch Shift" },
    { hour: "14:00", occupancy: 88, status: "High Utilization" },
    { hour: "15:00", occupancy: 94, status: "Peak Contention" },
    { hour: "16:00", occupancy: 85, status: "High Utilization" },
    { hour: "17:00", occupancy: 68, status: "Evening Shift" },
    { hour: "18:00", occupancy: 42, status: "Off-Peak" }
  ],
  departmentBreakdown: [
    { department: "Robotics & AI", utilization: 94, activeNodes: 3, sharedProjects: 46 },
    { department: "ECE / VLSI", utilization: 76, activeNodes: 2, sharedProjects: 38 },
    { department: "Mechanical", utilization: 98, activeNodes: 2, sharedProjects: 22 },
    { department: "VLSI & Embedded", utilization: 82, activeNodes: 4, sharedProjects: 29 },
    { department: "CSE / ISE", utilization: 96, activeNodes: 5, sharedProjects: 64 },
    { department: "Biotechnology", utilization: 85, activeNodes: 2, sharedProjects: 18 }
  ],
  aiOptimizationTips: [
    "Shifting non-critical coursework requests from 11:00 AM - 01:00 PM to 05:00 PM - 07:00 PM unlocks 28 additional weekly hours.",
    "Prototyping SLA 3D print overnight batches in FabLab frees peak daylight hours for calibration.",
    "Cloud workstation remote queuing reduced idle physical lab hours by 34.2% this semester."
  ]
};

export const initialCampusMetrics = campusMetrics;

/**
 * Canonical department list shared across the application.
 * Import this instead of re-declaring locally in components.
 */
export const DEPARTMENTS = [
  "All",
  "Robotics & AI",
  "ECE / VLSI",
  "Mechanical",
  "VLSI & Embedded",
  "CSE / ISE",
  "Biotechnology"
];

/**
 * MCDA scoring weights used by the GenAI conflict resolver.
 * Exported here so tests and UI can reference canonical values.
 */
export const SCORING_WEIGHTS = {
  DEADLINE: 50,
  URGENCY: 30,
  EQUITY: 20,
  TOTAL: 100
};
