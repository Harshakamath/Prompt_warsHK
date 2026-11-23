import { describe, it, expect } from "vitest";
import { resolveAllocationConflict, scoreRequest } from "../services/aiScheduler";
import { sanitizeInput, validateBookingPayload } from "../utils/security";
import { sampleConflictingRequests } from "../data/labData";

describe("AI Scheduler Scoring Criteria (50/30/20 MCDA Model)", () => {
  it("should calculate composite score correctly with 50/30/20 max weights", () => {
    const scored = scoreRequest({
      studentName: "Aarav Sharma",
      deadlineDaysRemaining: 2, // 50 pts
      urgencyLevel: "Critical",  // 30 pts
      priorMonthlyBookings: 0    // 20 pts
    });

    expect(scored.compositeScore).toBe(100);
    expect(scored.scoreBreakdown.deadlineScore).toBe(50);
    expect(scored.scoreBreakdown.urgencyScore).toBe(30);
    expect(scored.scoreBreakdown.fairnessScore).toBe(20);
  });

  it("should award deadline points according to proximity brackets", () => {
    expect(scoreRequest({ deadlineDaysRemaining: 1 }).scoreBreakdown.deadlineScore).toBe(50);
    expect(scoreRequest({ deadlineDaysRemaining: 2 }).scoreBreakdown.deadlineScore).toBe(50);
    expect(scoreRequest({ deadlineDaysRemaining: 4 }).scoreBreakdown.deadlineScore).toBe(42);
    expect(scoreRequest({ deadlineDaysRemaining: 7 }).scoreBreakdown.deadlineScore).toBe(34);
    expect(scoreRequest({ deadlineDaysRemaining: 10 }).scoreBreakdown.deadlineScore).toBe(26);
    expect(scoreRequest({ deadlineDaysRemaining: 14 }).scoreBreakdown.deadlineScore).toBe(18);
    expect(scoreRequest({ deadlineDaysRemaining: 20 }).scoreBreakdown.deadlineScore).toBe(10);
  });

  it("should award urgency points according to severity tiers", () => {
    expect(scoreRequest({ urgencyLevel: "Critical" }).scoreBreakdown.urgencyScore).toBe(30);
    expect(scoreRequest({ urgencyLevel: "High" }).scoreBreakdown.urgencyScore).toBe(20);
    expect(scoreRequest({ urgencyLevel: "Normal" }).scoreBreakdown.urgencyScore).toBe(10);
    expect(scoreRequest({ urgencyLevel: "other" }).scoreBreakdown.urgencyScore).toBe(10);
  });

  it("should penalize frequent prior bookings to preserve equity", () => {
    expect(scoreRequest({ priorMonthlyBookings: 0 }).scoreBreakdown.fairnessScore).toBe(20);
    expect(scoreRequest({ priorMonthlyBookings: 1 }).scoreBreakdown.fairnessScore).toBe(16);
    expect(scoreRequest({ priorMonthlyBookings: 2 }).scoreBreakdown.fairnessScore).toBe(12);
    expect(scoreRequest({ priorMonthlyBookings: 3 }).scoreBreakdown.fairnessScore).toBe(8);
    expect(scoreRequest({ priorMonthlyBookings: 5 }).scoreBreakdown.fairnessScore).toBe(4);
  });
});

describe("AI Conflict Resolver (resolveAllocationConflict)", () => {
  it("should select the optimal slot winner for sample conflicting requests", () => {
    const result = resolveAllocationConflict(sampleConflictingRequests);

    expect(result).toBeDefined();
    expect(result.winner).toBeDefined();
    // Aarav Sharma has 2 days deadline (50), Critical urgency (30), 1 prior booking (16) = 96
    expect(result.winner.id).toBe("REQ-2026-001");
    expect(result.winner.studentName).toBe("Aarav Sharma");
    expect(result.winner.compositeScore).toBe(96);
  });

  it("should break ties fairly by deadline proximity and usage equity", () => {
    // Exact score tie:
    // candidate X: 42 (day 4) + 20 (High) + 16 (prior 1) = 78
    // candidate Y: 50 (day 2) + 20 (High) + 8 (prior 3) = 78
    const tieX = {
      id: "TX",
      studentName: "Candidate X",
      deadlineDaysRemaining: 4,
      urgencyLevel: "High",
      priorMonthlyBookings: 1
    };
    const tieY = {
      id: "TY",
      studentName: "Candidate Y",
      deadlineDaysRemaining: 2,
      urgencyLevel: "High",
      priorMonthlyBookings: 3
    };

    const tieResult = resolveAllocationConflict([tieX, tieY]);
    expect(tieResult.winner.compositeScore).toBe(78);
    // tieY has fewer deadline days remaining (2 vs 4), so tieY wins the tie-break
    expect(tieResult.winner.id).toBe("TY");
  });

  it("should generate a reasoned explanation and slot details", () => {
    const result = resolveAllocationConflict(sampleConflictingRequests);

    expect(result.explanation).toContain("Aarav Sharma");
    expect(result.explanation).toContain("composite score of 96/100");
    expect(result.allocatedSlot).toContain("2026-11-24");
    expect(result.allocatedSlot).toContain("10:00 AM - 01:00 PM");
  });

  it("should provide alternative slot and workstation backup for deferred requests", () => {
    const result = resolveAllocationConflict(sampleConflictingRequests);

    expect(result.suggestedAlternative).toBeDefined();
    expect(result.suggestedAlternative.student).toContain("Priyanka Nair");
    expect(result.suggestedAlternative.suggestedDate).toBeDefined();
    expect(result.suggestedAlternative.suggestedSlot).toBeDefined();
    expect(result.suggestedAlternative.workstationBackup).toContain("Lab 501");
    expect(result.deferredRequests.length).toBe(2);
  });

  it("should handle single request edge cases gracefully without conflicts", () => {
    const single = [sampleConflictingRequests[0]];
    const result = resolveAllocationConflict(single);

    expect(result.winner.id).toBe("REQ-2026-001");
    expect(result.suggestedAlternative).toBeNull();
    expect(result.explanation).toContain("Direct allocation granted");
  });

  it("should handle empty or invalid request arrays safely", () => {
    const emptyResult = resolveAllocationConflict([]);
    expect(emptyResult.winner).toBeNull();
    expect(emptyResult.explanation).toContain("No competing requests");

    const nullResult = resolveAllocationConflict(null);
    expect(nullResult.winner).toBeNull();

    const undefinedResult = resolveAllocationConflict(undefined);
    expect(undefinedResult.winner).toBeNull();
  });
});

describe("Security Sanitization (sanitizeInput)", () => {
  it("should strip angle brackets and null bytes to prevent XSS", () => {
    const malicious = "<script>alert('pwned')\0</script>";
    const sanitized = sanitizeInput(malicious);
    expect(sanitized).toBe("scriptalert('pwned')/script");
    expect(sanitized).not.toContain("<");
    expect(sanitized).not.toContain(">");
    expect(sanitized).not.toContain("\0");
  });

  it("should trim surrounding whitespace", () => {
    const input = "   Aarav Sharma   ";
    expect(sanitizeInput(input)).toBe("Aarav Sharma");
  });

  it("should enforce maximum length limit", () => {
    const longString = "A".repeat(300);
    const sanitized = sanitizeInput(longString, 50);
    expect(sanitized.length).toBe(50);
  });

  it("should handle null, undefined, numbers, and booleans safely", () => {
    expect(sanitizeInput(null)).toBe("");
    expect(sanitizeInput(undefined)).toBe("");
    expect(sanitizeInput(12345)).toBe("12345");
    expect(sanitizeInput(true)).toBe("true");
  });
});

describe("Booking Payload Validation (validateBookingPayload)", () => {
  const getFutureDateStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  };

  it("should pass for a fully valid booking payload", () => {
    const payload = {
      studentName: "Aarav Sharma",
      usn: "1MS21CS004",
      projectTitle: "Edge TensorRT Autonomous Obstacle Avoidance",
      deadline: getFutureDateStr(),
      urgencyLevel: "Critical"
    };

    const result = validateBookingPayload(payload);
    expect(result.isValid).toBe(true);
    expect(Object.keys(result.errors).length).toBe(0);
  });

  it("should reject missing or too short student names", () => {
    const payload = {
      studentName: " ",
      usn: "1MS21CS004",
      projectTitle: "FPGA Acceleration",
      deadline: getFutureDateStr()
    };

    const result = validateBookingPayload(payload);
    expect(result.isValid).toBe(false);
    expect(result.errors.studentName).toBeDefined();
  });

  it("should reject invalid USN format", () => {
    const payload = {
      studentName: "Priyanka Nair",
      usn: "!!@@##",
      projectTitle: "Traffic Telemetry System",
      deadline: getFutureDateStr()
    };

    const result = validateBookingPayload(payload);
    expect(result.isValid).toBe(false);
    expect(result.errors.usn).toBeDefined();
  });

  it("should reject missing or short project titles", () => {
    const payload = {
      studentName: "Priyanka Nair",
      usn: "1MS21EC089",
      projectTitle: "AI",
      deadline: getFutureDateStr()
    };

    const result = validateBookingPayload(payload);
    expect(result.isValid).toBe(false);
    expect(result.errors.projectTitle).toBeDefined();
  });

  it("should reject past deadline dates", () => {
    const payload = {
      studentName: "Rohan Kulkarni",
      usn: "1MS22AI032",
      projectTitle: "Quadruped Robot Navigation",
      deadline: "2020-01-01"
    };

    const result = validateBookingPayload(payload);
    expect(result.isValid).toBe(false);
    expect(result.errors.deadline).toBe("Project deadline cannot be in the past.");
  });

  it("should reject invalid urgency levels if provided", () => {
    const payload = {
      studentName: "Rohan Kulkarni",
      usn: "1MS22AI032",
      projectTitle: "Quadruped Robot Navigation",
      deadline: getFutureDateStr(),
      urgencyLevel: "SuperUrgent"
    };

    const result = validateBookingPayload(payload);
    expect(result.isValid).toBe(false);
    expect(result.errors.urgencyLevel).toBeDefined();
  });

  it("should handle null or invalid payload objects", () => {
    const result = validateBookingPayload(null);
    expect(result.isValid).toBe(false);
    expect(result.errors.general).toBeDefined();
  });
});
