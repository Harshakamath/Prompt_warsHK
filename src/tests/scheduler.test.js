import { describe, it, expect } from "vitest";
import { resolveAllocationConflict, scoreRequest } from "../services/aiScheduler";
import { sanitizeInput, validateBookingPayload } from "../utils/security";
import { sampleConflictingRequests } from "../data/labData";

describe("AI Conflict Resolver (resolveAllocationConflict)", () => {
  it("should select the optimal slot winner based on deadline, urgency, and fairness", () => {
    const result = resolveAllocationConflict(sampleConflictingRequests);

    expect(result).toBeDefined();
    expect(result.winner).toBeDefined();
    // REQ-2026-001 has 2 days deadline, Critical urgency, and 1 prior booking
    expect(result.winner.id).toBe("REQ-2026-001");
    expect(result.winner.studentName).toBe("Aarav Sharma");
    expect(result.winner.compositeScore).toBeGreaterThanOrEqual(90);
  });

  it("should penalize frequent prior bookings to ensure equity across students", () => {
    const scoredHighUsage = scoreRequest({
      studentName: "Frequent User",
      deadlineDaysRemaining: 5,
      urgencyLevel: "High",
      priorMonthlyBookings: 6
    });

    const scoredLowUsage = scoreRequest({
      studentName: "First-Time User",
      deadlineDaysRemaining: 5,
      urgencyLevel: "High",
      priorMonthlyBookings: 0
    });

    expect(scoredLowUsage.compositeScore).toBeGreaterThan(scoredHighUsage.compositeScore);
    expect(scoredLowUsage.scoreBreakdown.fairnessScore).toBe(25);
    expect(scoredHighUsage.scoreBreakdown.fairnessScore).toBe(5);
  });

  it("should generate a reasoned explanation and slot details", () => {
    const result = resolveAllocationConflict(sampleConflictingRequests);

    expect(result.explanation).toContain("Aarav Sharma");
    expect(result.explanation).toContain("composite score");
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
  });
});

describe("Security Sanitization (sanitizeInput)", () => {
  it("should strip angle brackets to prevent XSS", () => {
    const malicious = "<script>alert('pwned')</script>";
    const sanitized = sanitizeInput(malicious);
    expect(sanitized).toBe("scriptalert('pwned')/script");
    expect(sanitized).not.toContain("<");
    expect(sanitized).not.toContain(">");
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

  it("should handle null, undefined, and non-string values safely", () => {
    expect(sanitizeInput(null)).toBe("");
    expect(sanitizeInput(undefined)).toBe("");
    expect(sanitizeInput(12345)).toBe("12345");
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
      projectTitle: "Low-Latency Autonomous Drone Obstacle Avoidance",
      deadline: getFutureDateStr()
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

  it("should handle null or invalid payload objects", () => {
    const result = validateBookingPayload(null);
    expect(result.isValid).toBe(false);
    expect(result.errors.general).toBeDefined();
  });
});
