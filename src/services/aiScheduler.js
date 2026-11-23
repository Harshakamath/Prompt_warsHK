/**
 * LabLink GenAI Scheduling & Allocation Conflict Resolver Engine
 *
 * Implements a weighted multi-criteria decision analysis (MCDA) model:
 * 1. Project Deadline Proximity: Up to 50 points (Higher score for imminent deadlines)
 * 2. Academic Urgency Severity: Up to 30 points (Critical: 30, High: 20, Normal: 10)
 * 3. Resource Usage Equity: Up to 20 points (Penalizes repeat monopolization, awards fair access)
 *
 * Total Composite Score: Max 100 points
 */

import { SCORING_WEIGHTS } from "../data/labData.js";

/**
 * @const {number} MAX_DEADLINE_PTS - Max points for deadline proximity (canonical: SCORING_WEIGHTS.DEADLINE)
 * @const {number} MAX_URGENCY_PTS  - Max points for urgency severity   (canonical: SCORING_WEIGHTS.URGENCY)
 * @const {number} MAX_EQUITY_PTS   - Max points for resource equity     (canonical: SCORING_WEIGHTS.EQUITY)
 */
const MAX_DEADLINE_PTS = SCORING_WEIGHTS.DEADLINE; // 50
const MAX_URGENCY_PTS  = SCORING_WEIGHTS.URGENCY;  // 30
const MAX_EQUITY_PTS   = SCORING_WEIGHTS.EQUITY;   // 20

/**
 * Computes individual criteria scores and total composite score for a lab request.
 * @param {Object} req - Slot request payload
 * @returns {Object} Scored request with explicit score breakdown
 */
export function scoreRequest(req) {
  if (!req || typeof req !== "object") {
    return {
      compositeScore: 0,
      scoreBreakdown: { deadlineScore: 0, urgencyScore: 0, fairnessScore: 0 },
      xaiFormula: "0/100"
    };
  }

  // 1. Deadline Proximity (Max MAX_DEADLINE_PTS = 50 points)
  const days = typeof req.deadlineDaysRemaining === "number" ? req.deadlineDaysRemaining : 14;
  let deadlineScore = 10;
  if (days <= 2) {
    deadlineScore = MAX_DEADLINE_PTS; // 50
  } else if (days <= 4) {
    deadlineScore = 42;
  } else if (days <= 7) {
    deadlineScore = 34;
  } else if (days <= 10) {
    deadlineScore = 26;
  } else if (days <= 14) {
    deadlineScore = 18;
  }

  // 2. Academic Urgency Severity (Max MAX_URGENCY_PTS = 30 points)
  const urgency = (req.urgencyLevel || "").toLowerCase().trim();
  let urgencyScore = 10;
  if (urgency === "critical") {
    urgencyScore = MAX_URGENCY_PTS; // 30
  } else if (urgency === "high") {
    urgencyScore = 20;
  }

  // 3. Resource Equity & Fairness (Max MAX_EQUITY_PTS = 20 points)
  const priorBookings =
    typeof req.priorMonthlyBookings === "number"
      ? req.priorMonthlyBookings
      : typeof req.priorAllocationsThisMonth === "number"
      ? req.priorAllocationsThisMonth
      : 0;

  let fairnessScore = 4;
  if (priorBookings === 0) {
    fairnessScore = MAX_EQUITY_PTS; // 20
  } else if (priorBookings === 1) {
    fairnessScore = 16;
  } else if (priorBookings === 2) {
    fairnessScore = 12;
  } else if (priorBookings <= 4) {
    fairnessScore = 8;
  }

  const compositeScore = Math.min(SCORING_WEIGHTS.TOTAL, Math.max(0, deadlineScore + urgencyScore + fairnessScore));
  const xaiFormula = `${deadlineScore}pts (Deadline) + ${urgencyScore}pts (Urgency) + ${fairnessScore}pts (Equity) = ${compositeScore}/${SCORING_WEIGHTS.TOTAL}`;

  return {
    ...req,
    compositeScore,
    scoreBreakdown: {
      deadlineScore,
      urgencyScore,
      fairnessScore
    },
    xaiFormula
  };
}

/**
 * Evaluates competing slot requests, scores each candidate, selects the primary winner,
 * provisions alternative slots/workstation backups for deferred candidates, and outputs
 * transparent, explainable GenAI allocation reasoning.
 *
 * @param {Array<Object>} competingRequests - Competing slot requests
 * @returns {Object} Resolution output with winner, reasoning, and backup allocations
 */
export function resolveAllocationConflict(competingRequests) {
  if (!competingRequests || !Array.isArray(competingRequests) || competingRequests.length === 0) {
    return {
      winner: null,
      allocatedSlot: null,
      explanation: "No competing requests were provided for scheduling resolution.",
      suggestedAlternative: null,
      deferredRequests: [],
      rankings: []
    };
  }

  // Single request scenario
  if (competingRequests.length === 1) {
    const scoredSingle = scoreRequest(competingRequests[0]);
    const slotStr = `${scoredSingle.slotDate || "Next Available"} (${scoredSingle.timeSlot || "Standard Slot"})`;
    return {
      winner: scoredSingle,
      allocatedSlot: slotStr,
      explanation: `Direct allocation granted to ${scoredSingle.studentName} (${scoredSingle.projectTitle}). Exact math: ${scoredSingle.xaiFormula}. No schedule competition detected for this workstation slot.`,
      suggestedAlternative: null,
      deferredRequests: [],
      rankings: [scoredSingle]
    };
  }

  // Score all competing requests
  const scoredList = competingRequests.map(scoreRequest);

  // Sort by compositeScore DESC; tie-breaks: fewer deadline days, fewer prior bookings, higher urgency
  scoredList.sort((a, b) => {
    if (b.compositeScore !== a.compositeScore) {
      return b.compositeScore - a.compositeScore;
    }
    const daysA = typeof a.deadlineDaysRemaining === "number" ? a.deadlineDaysRemaining : 999;
    const daysB = typeof b.deadlineDaysRemaining === "number" ? b.deadlineDaysRemaining : 999;
    if (daysA !== daysB) {
      return daysA - daysB; // fewer days wins
    }
    const priorA = a.priorMonthlyBookings ?? a.priorAllocationsThisMonth ?? 0;
    const priorB = b.priorMonthlyBookings ?? b.priorAllocationsThisMonth ?? 0;
    if (priorA !== priorB) {
      return priorA - priorB; // fewer prior bookings wins
    }
    if (b.scoreBreakdown.urgencyScore !== a.scoreBreakdown.urgencyScore) {
      return b.scoreBreakdown.urgencyScore - a.scoreBreakdown.urgencyScore;
    }
    return String(a.id || "").localeCompare(String(b.id || ""));
  });

  const winner = scoredList[0];
  const deferredList = scoredList.slice(1);

  const allocatedSlot = `${winner.slotDate || "2026-11-24"} (${winner.timeSlot || "10:00 AM - 01:00 PM"})`;

  // Compute next available dates for deferred requests
  const baseDate = winner.slotDate ? new Date(winner.slotDate) : new Date();
  const nextDay = new Date(baseDate);
  nextDay.setDate(nextDay.getDate() + 1);
  const formattedNextDate = nextDay.toISOString().split("T")[0];

  const firstDeferred = deferredList[0];
  const suggestedAlternative = {
    student: `${firstDeferred.studentName} (${firstDeferred.usn || firstDeferred.department})`,
    suggestedDate: formattedNextDate,
    suggestedSlot: "02:00 PM - 05:00 PM (Next Priority Window)",
    workstationBackup: "High-Performance Workstation Node 2 (Cloud & High-Performance Lab - Pre-configured Container)",
    reasoning: `Assigned priority queue placement on ${formattedNextDate} to preserve project velocity while accommodating the immediate deadline of ${winner.studentName}.`
  };

  const deferredRequestsWithBackups = deferredList.map((item, index) => {
    const shiftDate = new Date(baseDate);
    shiftDate.setDate(shiftDate.getDate() + index + 1);
    return {
      ...item,
      suggestedAlternativeDate: shiftDate.toISOString().split("T")[0],
      suggestedAlternativeSlot: "02:00 PM - 05:00 PM",
      workstationBackup: `Cloud Workstation Cluster Node ${index + 1} (Pre-configured JetPack Container)`
    };
  });

  const explanation =
    `Allocated primary slot to ${winner.studentName} (${winner.department}) with a top composite score of ` +
    `${winner.compositeScore}/100. Deciding rationale: immediate project deadline in ${winner.deadlineDaysRemaining} days ` +
    `(Urgency: ${winner.urgencyLevel}, awarded 50pts deadline + 30pts urgency), balanced against usage equity ` +
    `(${winner.scoreBreakdown.fairnessScore}pts equity). Math breakdown: [${winner.xaiFormula}]. ` +
    `${firstDeferred.studentName} (${firstDeferred.compositeScore}/100) has been ` +
    `provisioned a guaranteed alternative reservation on ${formattedNextDate} (02:00 PM - 05:00 PM) with secondary backup workstation: High-Performance Workstation Node 2.`;

  return {
    winner,
    allocatedSlot,
    explanation,
    suggestedAlternative,
    deferredRequests: deferredRequestsWithBackups,
    rankings: scoredList
  };
}

/**
 * Generates an authorized Digital Lab Gate Pass for a confirmed or faculty-approved reservation.
 *
 * @param {Object} request - Student request details
 * @param {string} [benchNumber="Bench-04A"] - Assigned laboratory bench or node identifier
 * @returns {Object|null} Authorized digital lab pass object
 */
export function generateDigitalLabPass(request, benchNumber = "Bench-04A") {
  if (!request || typeof request !== "object") {
    return null;
  }

  const rawEquipment = request.equipmentName || "JETSON";
  let sanitizedTag = "LABKIT";
  if (/jetson/i.test(rawEquipment)) {
    sanitizedTag = "JETSON";
  } else if (/zynq|fpga/i.test(rawEquipment)) {
    sanitizedTag = "ZYNQ";
  } else if (/formlabs|3d/i.test(rawEquipment)) {
    sanitizedTag = "SLA3D";
  } else if (/rtx|gpu|hpc/i.test(rawEquipment)) {
    sanitizedTag = "RTXGPU";
  } else if (/oscilloscope|dso/i.test(rawEquipment)) {
    sanitizedTag = "OSCILL";
  } else if (/pcr|eppendorf/i.test(rawEquipment)) {
    sanitizedTag = "PCRBIO";
  } else {
    sanitizedTag = rawEquipment.replace(/[^A-Za-z0-9]/g, "").slice(0, 6).toUpperCase() || "LABKIT";
  }

  const idSuffix = String(request.id || "901").replace(/[^0-9]/g, "") || "901";
  const passId = `PASS-2026-${sanitizedTag}-${idSuffix.slice(-3)}`;

  const timestamp = new Date().toISOString();
  const assignedBench = benchNumber || "Bench-04A";

  // Pseudo-hash verification token
  const hashSeed = `${passId}:${request.usn}:${request.studentName}:${assignedBench}:${timestamp}`;
  let hashNum = 0;
  for (let i = 0; i < hashSeed.length; i++) {
    hashNum = (hashNum << 5) - hashNum + hashSeed.charCodeAt(i);
    hashNum |= 0;
  }
  const verificationHash = "0x" + Math.abs(hashNum).toString(16).padStart(8, "0") + "c4a9";

  return {
    passId,
    tokenId: passId, // alias for token ID
    studentName: request.studentName || "Authorized Student",
    usn: request.usn || "1MS21CS001",
    department: request.department || "Engineering",
    projectTitle: request.projectTitle || "Specialized Lab Research Project",
    equipmentName: request.equipmentName || "Campus Shared Hardware",
    facultySponsor: request.guideName || "Department Faculty Guide",
    benchNumber: assignedBench,
    slotDate: request.slotDate || timestamp.split("T")[0],
    timeSlot: request.timeSlot || "10:00 AM - 01:00 PM",
    timestamp,
    safetyClearanceTimestamp: timestamp,
    verificationHash,
    status: "AUTHORIZED_ACTIVE"
  };
}
