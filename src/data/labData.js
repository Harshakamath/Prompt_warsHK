/**
 * LabLink - Campus Laboratory Resource Grid
 * Initial dataset for lab equipment, workstations, and conflicting slot requests.
 */

export const initialEquipment = [
  {
    id: "EQ-AI-01",
    name: "NVIDIA Jetson AGX Orin DevKit (64GB)",
    category: "Edge AI & Autonomous Systems",
    department: "AI & Robotics",
    labRoom: "Room 304, Autonomous Systems Lab",
    specs: "64GB 256-bit LPDDR5, 275 TOPS AI compute, TensorRT 8.6, Dual GbE, USB 3.2 Gen 2",
    prerequisites: "Python 3.10, CUDA/TensorRT basics, Lab Safety Induction Level 1",
    totalUnits: 3,
    availableUnits: 1
  },
  {
    id: "EQ-VLSI-02",
    name: "Xilinx Zynq UltraScale+ ZCU102 MPSoC",
    category: "Embedded & FPGA Acceleration",
    department: "ECE / VLSI",
    labRoom: "Room 202, Embedded Systems Center",
    specs: "Quad ARM Cortex-A53, Dual Cortex-R5F, 500k+ System Logic Cells, DDR4 SODIMM",
    prerequisites: "Verilog/VHDL, Vivado 2023.2 tooling, FPGA Architecture I",
    totalUnits: 4,
    availableUnits: 2
  },
  {
    id: "EQ-MECH-03",
    name: "Stratasys F170 Industrial 3D Printer",
    category: "Additive Manufacturing & Prototyping",
    department: "Mechanical / Prototyping",
    labRoom: "Room 101, Additive Prototyping Facility",
    specs: "Build size 254 x 254 x 254 mm, PLA/ABS/TPU 92A, 0.127 mm layer resolution",
    prerequisites: "CAD modeling (SolidWorks / Fusion 360), GrabCAD Print certified",
    totalUnits: 2,
    availableUnits: 0
  },
  {
    id: "EQ-RF-04",
    name: "Keysight Infiniium MXR-Series 4-Channel Oscilloscope",
    category: "RF & High-Speed Signal Analysis",
    department: "ECE / VLSI",
    labRoom: "Room 208, Microwave & RF Lab",
    specs: "2.5 GHz Bandwidth, 16 GSa/s real-time sample rate, 16-channel digital logic MSO",
    prerequisites: "Signals & Systems, RF Lab Safety, Probe Calibration Guide",
    totalUnits: 2,
    availableUnits: 1
  },
  {
    id: "EQ-BIO-05",
    name: "Bio-Rad CFX96 Touch Real-Time PCR System",
    category: "Molecular Diagnostics & Genomics",
    department: "Biotechnology",
    labRoom: "Room 402, Molecular Bio & Genomics Lab",
    specs: "6-channel optical detection, 96-well format, thermal gradient 30-100°C",
    prerequisites: "Biosafety Level 2 (BSL-2) certified, Pipetting Protocol clearance",
    totalUnits: 1,
    availableUnits: 1
  },
  {
    id: "EQ-CS-06",
    name: "Dual NVIDIA RTX 4090 Workstation (128GB RAM)",
    category: "Deep Learning & Parallel Computing",
    department: "Computer Science & ISE",
    labRoom: "Room 501, High Performance Cloud Lab",
    specs: "Dual 24GB RTX 4090 GPUs (48GB VRAM), AMD Threadripper 5965WX, 128GB DDR5",
    prerequisites: "Linux CLI proficiency, Docker / Slurm cluster basics",
    totalUnits: 5,
    availableUnits: 3
  },
  {
    id: "EQ-ROB-07",
    name: "Universal Robots UR5e Collaborative Robot Arm",
    category: "Robotics & Cobot Automation",
    department: "AI & Robotics",
    labRoom: "Room 302, Robotics & Mechatronics Lab",
    specs: "6-axis articulated arm, 5kg payload, 850mm reach, force-torque sensing",
    prerequisites: "ROS 2 Humble, Cobot E-Stop Safety training, Kinematics & Control",
    totalUnits: 2,
    availableUnits: 0
  },
  {
    id: "EQ-EDA-08",
    name: "Cadence Virtuoso IC Design Workstation",
    category: "Microelectronic Design Automation",
    department: "VLSI & Embedded",
    labRoom: "Room 205, Advanced VLSI Clean Lab",
    specs: "Spectre RF simulator, 28nm/16nm PDKs, Dual 4K color-accurate displays",
    prerequisites: "CMOS Analog Circuit Design, Virtuoso Schematic Editor clearance",
    totalUnits: 3,
    availableUnits: 2
  }
];

export const sampleConflictingRequests = [
  {
    id: "REQ-2026-001",
    studentName: "Aarav Sharma",
    usn: "1MS21CS004",
    department: "Computer Science & ISE",
    projectTitle: "Low-Latency Autonomous Drone Obstacle Avoidance using TensorRT",
    deadlineDaysRemaining: 2,
    urgencyLevel: "Critical",
    priorMonthlyBookings: 1,
    priorAllocationsThisMonth: 1,
    guideName: "Dr. Sudhir Rao",
    equipmentId: "EQ-AI-01",
    equipmentName: "NVIDIA Jetson AGX Orin DevKit (64GB)",
    slotDate: "2026-11-24",
    timeSlot: "10:00 AM - 01:00 PM"
  },
  {
    id: "REQ-2026-002",
    studentName: "Priyanka Nair",
    usn: "1MS21EC089",
    department: "ECE / VLSI",
    projectTitle: "Edge Vision Sensor Processing for Real-time Traffic Telemetry",
    deadlineDaysRemaining: 8,
    urgencyLevel: "High",
    priorMonthlyBookings: 5,
    priorAllocationsThisMonth: 5,
    guideName: "Prof. K. Venkatesh",
    equipmentId: "EQ-AI-01",
    equipmentName: "NVIDIA Jetson AGX Orin DevKit (64GB)",
    slotDate: "2026-11-24",
    timeSlot: "10:00 AM - 01:00 PM"
  },
  {
    id: "REQ-2026-003",
    studentName: "Rohan Kulkarni",
    usn: "1MS22AI032",
    department: "AI & Robotics",
    projectTitle: "Multi-modal Perception Network for Quadruped Robot Navigation",
    deadlineDaysRemaining: 15,
    urgencyLevel: "Normal",
    priorMonthlyBookings: 0,
    priorAllocationsThisMonth: 0,
    guideName: "Dr. Ananya Sen",
    equipmentId: "EQ-AI-01",
    equipmentName: "NVIDIA Jetson AGX Orin DevKit (64GB)",
    slotDate: "2026-11-24",
    timeSlot: "10:00 AM - 01:00 PM"
  }
];
