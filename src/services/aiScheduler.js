/**
 * LabLink AI Conflict Resolver Service
 * Evaluates overlapping laboratory and equipment slot requests
 * using multi-criteria optimization:
 * 1. Project Deadline Proximity (40% weight)
 * 2. Academic Urgency Level (35% weight)
 * 3. Fairness & Prior Usage Equity (25% weight)
 */

/**
 * Calculates individual scoring metrics and composite score for a lab slot request.
 * @param {Object} req - Competing request object
 * @returns {Object} Scored request with score breakdown
 */
export function scoreRequest(req) {
  const days = typeof req.deadlineDaysRemaining === "number" ? req.deadlineDaysRemaining : 10;
  let deadlineScore = 8;
  if (days <= 2) {
    deadlineScore = 40;
  } else if (days <= 5) {
    deadlineScore = 32;
  } else if (days <= 10) {
    deadlineScore = 24;
  } else if (days <= 20) {
    deadlineScore = 16;
  }

  const urgency = (req.urgencyLevel || "").toLowerCase();
  let urgencyScore = 12;
  if (urgency === "critical") {
    urgencyScore = 35;
  } else if (urgency === "high") {
    urgencyScore = 25;
  }

  const priorCount =
    typeof req.priorMonthlyBookings === "number"
      ? req.priorMonthlyBookings
      : typeof req.priorAllocationsThisMonth === "number"
      ? req.priorAllocationsThisMonth
      : 0;

  let fairnessScore = 5;
  if (priorCount === 0) {
    fairnessScore = 25;
  } else if (priorCount === 1) {
    fairnessScore = 20;
  } else if (priorCount === 2) {
    fairnessScore = 15;
  } else if (priorCount <= 4) {
    fairnessScore = 10;
  }

  const compositeScore = Math.min(100, deadlineScore + urgencyScore + fairnessScore);

  return {
    ...req,
    compositeScore,
    scoreBreakdown: {
      deadlineScore,
      urgencyScore,
      fairnessScore
    }
  };
}

/**
 * Resolves scheduling conflicts among competing equipment/slot requests.
 * @param {Array<Object>} competingRequests - Array of competing lab slot requests
 * @returns {Object|null} Allocation decision with winner, reasoning, and suggested alternatives
 */
export function resolveAllocationConflict(competingRequests) {
  if (!competingRequests || !Array.isArray(competingRequests) || competingRequests.length === 0) {
    return {
      winner: null,
      allocatedSlot: null,
      explanation: "No competing requests were provided for conflict resolution.",
      suggestedAlternative: null,
      deferredRequests: []
    };
  }

  if (competingRequests.length === 1) {
    const single = scoreRequest(competingRequests[0]);
    return {
      winner: single,
      allocatedSlot: `${single.slotDate || "Selected Date"} (${single.timeSlot || "Scheduled Slot"})`,
      explanation: `Direct allocation granted to ${single.studentName} (${single.projectTitle}). No competing requests detected for this slot.`,
      suggestedAlternative: null,
      deferredRequests: []
    };
  }

  // Score all candidates
  const scored = competingRequests.map(scoreRequest);

  // Sort descending by compositeScore, then by days remaining ascending, then by prior count ascending
  scored.sort((a, b) => {
    if (b.compositeScore !== a.compositeScore) {
      return b.compositeScore - a.compositeScore;
    }
    const daysA = typeof a.deadlineDaysRemaining === "number" ? a.deadlineDaysRemaining : 999;
    const daysB = typeof b.deadlineDaysRemaining === "number" ? b.deadlineDaysRemaining : 999;
    if (daysA !== daysB) {
      return daysA - daysB;
    }
    const priorA = a.priorMonthlyBookings ?? a.priorAllocationsThisMonth ?? 0;
    const priorB = b.priorMonthlyBookings ?? b.priorAllocationsThisMonth ?? 0;
    return priorA - priorB;
  });

  const winner = scored[0];
  const deferredList = scored.slice(1);

  const slotStr = `${winner.slotDate || "2026-11-24"} (${winner.timeSlot || "10:00 AM - 01:00 PM"})`;

  // Determine alternative slot date and backup for first deferred candidate
  const firstDeferred = deferredList[0];
  const baseDate = winner.slotDate ? new Date(winner.slotDate) : new Date();
  const nextDate = new Date(baseDate);
  nextDate.setDate(nextDate.getDate() + 1);
  const formattedNextDate = nextDate.toISOString().split("T")[0];

  const suggestedAlternative = {
    student: `${firstDeferred.studentName} (${firstDeferred.usn || firstDeferred.department})`,
    suggestedDate: formattedNextDate,
    suggestedSlot: "02:00 PM - 05:00 PM (Next Priority Window)",
    workstationBackup: `High-Performance Workstation Node 2 (Lab 501 - Pre-configured Container & Remote Access)`
  };

  const deferredDetails = deferredList.map((d, index) => {
    const dDate = new Date(baseDate);
    dDate.setDate(dDate.getDate() + index + 1);
    return {
      ...d,
      alternativeSlot: `${dDate.toISOString().split("T")[0]} (02:00 PM - 05:00 PM)`,
      workstationBackup: `Lab 501 Cloud Instance Node ${index + 1}`
    };
  });

  const explanation =
    `Allocated primary slot to ${winner.studentName} (${winner.department}) with a top composite score of ` +
    `${winner.compositeScore}/100. Deciding rationale: immediate project deadline in ${winner.deadlineDaysRemaining} days ` +
    `(Urgency: ${winner.urgencyLevel}), balanced against usage equity (${winner.priorMonthlyBookings ?? winner.priorAllocationsThisMonth ?? 0} prior allocations). ` +
    `${firstDeferred.studentName} (${firstDeferred.compositeScore}/100) has been assigned an automated priority alternative on ${formattedNextDate} with remote workstation backup.`;

  return {
    winner,
    allocatedSlot: slotStr,
    explanation,
    suggestedAlternative,
    deferredRequests: deferredDetails
  };
}
