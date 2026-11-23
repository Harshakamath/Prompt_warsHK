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
    name: "NVIDIA Jetson AGX Orin 64GB Developer Kit",
    category: "Edge AI & Autonomous Systems",
    department: "AI & Robotics",
    labRoom: "Room 304, Autonomous Systems Lab",
    leadFaculty: "Dr. Ananya Sen",
    specs: "64GB 256-bit LPDDR5, 275 TOPS INT8 AI compute, TensorRT 8.6, Dual GbE, Ampere GPU",
    prerequisites: "Python 3.10, PyTorch/TensorRT basics, Lab Safety Induction Level 1",
    totalUnits: 3,
    availableUnits: 1,
    dutyCycle: "94%",
    hourlyUtilization: 94
  },
  {
    id: "EQ-VLSI-02",
    name: "Xilinx Zynq UltraScale+ ZCU102 MPSoC",
    category: "Embedded & FPGA Acceleration",
    department: "ECE / VLSI",
    labRoom: "Room 202, Embedded Systems Center",
    leadFaculty: "Prof. K. Venkatesh",
    specs: "Quad ARM Cortex-A53, Dual Cortex-R5F, 500k+ System Logic Cells, DDR4 SODIMM",
    prerequisites: "Verilog/VHDL, Vivado 2023.2 tooling, FPGA Architecture I",
    totalUnits: 4,
    availableUnits: 2,
    dutyCycle: "82%",
    hourlyUtilization: 82
  },
  {
    id: "EQ-MECH-03",
    name: "Formlabs Form 4BL Medical & Engineering SLA 3D Printer",
    category: "Additive Manufacturing & Prototyping",
    department: "Mechanical / Prototyping",
    labRoom: "Room 101, Additive Prototyping Facility",
    leadFaculty: "Dr. B. R. Patil",
    specs: "Stereolithography (SLA), 335 x 200 x 300 mm build volume, Tough 2000 & BioMed resins, 25µm resolution",
    prerequisites: "CAD modeling (SolidWorks / Fusion 360), PreForm SLA slicer clearance",
    totalUnits: 2,
    availableUnits: 0,
    dutyCycle: "98%",
    hourlyUtilization: 98
  },
  {
    id: "EQ-RF-04",
    name: "Keysight Infiniium MXR-Series 4-Channel DSO Oscilloscope",
    category: "RF & High-Speed Signal Analysis",
    department: "ECE / VLSI",
    labRoom: "Room 208, Microwave & RF Lab",
    leadFaculty: "Dr. M. S. Suresh",
    specs: "2.5 GHz Bandwidth, 16 GSa/s real-time sample rate, 16-channel digital logic MSO, 10-bit ADC",
    prerequisites: "Signals & Systems, RF Lab Safety, Probe Calibration Guide",
    totalUnits: 2,
    availableUnits: 1,
    dutyCycle: "76%",
    hourlyUtilization: 76
  },
  {
    id: "EQ-BIO-05",
    name: "Bio-Rad CFX96 Deep Well Real-Time PCR Thermal Cycler",
    category: "Molecular Diagnostics & Genomics",
    department: "Biotechnology",
    labRoom: "Room 402, Molecular Bio & Genomics Lab",
    leadFaculty: "Dr. Kavita Hegde",
    specs: "6-channel optical detection, 96-well deep plate format, thermal gradient 30-100°C",
    prerequisites: "Biosafety Level 2 (BSL-2) certified, Pipetting Protocol clearance",
    totalUnits: 1,
    availableUnits: 1,
    dutyCycle: "85%",
    hourlyUtilization: 85
  },
  {
    id: "EQ-CS-06",
    name: "Dual NVIDIA RTX 4090 Deep Learning Node (128GB ECC RAM)",
    category: "Deep Learning & Parallel Computing",
    department: "Computer Science & ISE",
    labRoom: "Room 501, High Performance Cloud Lab",
    leadFaculty: "Dr. Sudhir Rao",
    specs: "Dual 24GB RTX 4090 GPUs (48GB VRAM), AMD Threadripper 5965WX, 128GB DDR5 ECC, 4TB NVMe RAID",
    prerequisites: "Linux CLI proficiency, Docker / Slurm cluster basics",
    totalUnits: 5,
    availableUnits: 3,
    dutyCycle: "96%",
    hourlyUtilization: 96
  },
  {
    id: "EQ-ROB-07",
    name: "Universal Robots UR5e 6-Axis Collaborative Robot Arm",
    category: "Robotics & Cobot Automation",
    department: "AI & Robotics",
    labRoom: "Room 302, Robotics & Mechatronics Lab",
    leadFaculty: "Prof. Arvind Shenoy",
    specs: "6-axis articulated arm, 5kg payload, 850mm reach, 0.03mm repeatability, force-torque sensing",
    prerequisites: "ROS 2 Humble, Cobot E-Stop Safety training, Kinematics & Control",
    totalUnits: 2,
    availableUnits: 0,
    dutyCycle: "91%",
    hourlyUtilization: 91
  },
  {
    id: "EQ-EDA-08",
    name: "Cadence Virtuoso & Spectre RF IC Design Workstation",
    category: "Microelectronic Design Automation",
    department: "VLSI & Embedded",
    labRoom: "Room 205, Advanced VLSI Clean Lab",
    leadFaculty: "Dr. Preethi Joshi",
    specs: "Spectre RF simulator, 28nm/16nm FinFET PDKs, Dual 4K color-calibrated displays, 64GB RAM",
    prerequisites: "CMOS Analog Circuit Design, Virtuoso Schematic Editor clearance",
    totalUnits: 3,
    availableUnits: 2,
    dutyCycle: "79%",
    hourlyUtilization: 79
  }
];

/**
 * Realistic overlapping slot requests demonstrating scheduling conflicts
 * across different student departments, deadlines, and urgency levels.
 */
export const sampleConflictingRequests = [
  {
    id: "REQ-2026-001",
    studentName: "Aarav Sharma",
    usn: "1MS21CS004",
    department: "Computer Science & ISE",
    projectTitle: "Edge TensorRT Autonomous Obstacle Avoidance for Search-and-Rescue UAVs",
    projectScope: "Deploying quantized INT8 YOLOv11 & DeepSORT pipelines on Jetson Orin with sub-15ms latency constraints before National Drone Expo.",
    deadlineDaysRemaining: 2,
    urgencyLevel: "Critical",
    priorMonthlyBookings: 1,
    priorAllocationsThisMonth: 1,
    guideName: "Dr. Sudhir Rao",
    equipmentId: "EQ-AI-01",
    equipmentName: "NVIDIA Jetson AGX Orin 64GB Developer Kit",
    slotDate: "2026-11-24",
    timeSlot: "10:00 AM - 01:00 PM"
  },
  {
    id: "REQ-2026-002",
    studentName: "Priyanka Nair",
    usn: "1MS21EC089",
    department: "ECE / VLSI",
    projectTitle: "FPGA-Accelerated Edge Telemetry Vision Engine",
    projectScope: "Hardware profiling and thermal monitoring of live camera feed compression.",
    deadlineDaysRemaining: 8,
    urgencyLevel: "High",
    priorMonthlyBookings: 5,
    priorAllocationsThisMonth: 5,
    guideName: "Prof. K. Venkatesh",
    equipmentId: "EQ-AI-01",
    equipmentName: "NVIDIA Jetson AGX Orin 64GB Developer Kit",
    slotDate: "2026-11-24",
    timeSlot: "10:00 AM - 01:00 PM"
  },
  {
    id: "REQ-2026-003",
    studentName: "Rohan Kulkarni",
    usn: "1MS22AI032",
    department: "AI & Robotics",
    projectTitle: "Quadruped Robot Dynamic Gaits via Multi-Modal Sensor Fusion",
    projectScope: "Reinforcement learning policy evaluation for rough terrain locomotion.",
    deadlineDaysRemaining: 14,
    urgencyLevel: "Normal",
    priorMonthlyBookings: 0,
    priorAllocationsThisMonth: 0,
    guideName: "Dr. Ananya Sen",
    equipmentId: "EQ-AI-01",
    equipmentName: "NVIDIA Jetson AGX Orin 64GB Developer Kit",
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
  activeSharedNodes: 24,
  crossDeptCollaborations: 142,
  departmentSharingMatrix: [
    {
      sourceDept: "Computer Science & ISE",
      targetLab: "ECE Microwave & Signal Center",
      hoursShared: 42,
      equipmentUsed: "Keysight Infiniium 4-Channel DSO"
    },
    {
      sourceDept: "ECE / VLSI",
      targetLab: "AI & Robotics Autonomous Center",
      hoursShared: 38,
      equipmentUsed: "NVIDIA Jetson AGX Orin DevKit"
    },
    {
      sourceDept: "Biotechnology",
      targetLab: "Mechanical Prototyping Facility",
      hoursShared: 26,
      equipmentUsed: "Formlabs Form 4BL SLA 3D Printer"
    },
    {
      sourceDept: "Mechanical / Prototyping",
      targetLab: "Robotics & Cobot Automation Lab",
      hoursShared: 24,
      equipmentUsed: "Universal Robots UR5e Cobot Arm"
    },
    {
      sourceDept: "VLSI & Embedded",
      targetLab: "HPC Cloud & Deep Learning Wing",
      hoursShared: 18,
      equipmentUsed: "Dual RTX 4090 Workstation Node"
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
    { department: "AI & Robotics", utilization: 92, activeNodes: 5, sharedProjects: 46 },
    { department: "ECE / VLSI", utilization: 86, activeNodes: 6, sharedProjects: 38 },
    { department: "Mechanical / Prototyping", utilization: 79, activeNodes: 3, sharedProjects: 22 },
    { department: "Computer Science & ISE", utilization: 95, activeNodes: 5, sharedProjects: 64 },
    { department: "Biotechnology", utilization: 82, activeNodes: 3, sharedProjects: 18 },
    { department: "VLSI & Embedded", utilization: 89, activeNodes: 2, sharedProjects: 29 }
  ],
  aiOptimizationTips: [
    "Shifting non-critical coursework requests from 10:00 AM - 01:00 PM to 05:00 PM - 08:00 PM unlocks 28 additional weekly hours.",
    "Prototyping SLA 3D print overnight batches frees peak daylight hours for live calibration.",
    "Cloud GPU node remote Slurm queuing reduced idle physical workstation hours by 34.2% this semester."
  ]
};

export const initialCampusMetrics = campusMetrics;
