import { describe, it, expect } from "vitest";
import {
  resolveAllocationConflict,
  scoreRequest,
  generateDigitalLabPass
} from "../services/aiScheduler";
import { sanitizeInput, validateBookingPayload } from "../utils/security";
import { sampleConflictingRequests } from "../data/labData";

describe("LabLink Core AI Scheduling, Security & Verification Suite", () => {
  // Test 1: Prioritizing closer project deadlines
  it("1. should prioritize requests with closer project deadlines", () => {
    const urgentDeadline = scoreRequest({
      studentName: "Student Urgent",
      deadlineDaysRemaining: 2,
      urgencyLevel: "High",
      priorMonthlyBookings: 1
    });
    const distantDeadline = scoreRequest({
      studentName: "Student Distant",
      deadlineDaysRemaining: 12,
      urgencyLevel: "High",
      priorMonthlyBookings: 1
    });

    expect(urgentDeadline.scoreBreakdown.deadlineScore).toBe(50);
    expect(distantDeadline.scoreBreakdown.deadlineScore).toBe(18);
    expect(urgentDeadline.compositeScore).toBeGreaterThan(distantDeadline.compositeScore);
  });

  // Test 2: Urgency tier weighting (Critical vs Normal)
  it("2. should weight project urgency tiers correctly (Critical: 30pts vs Normal: 10pts)", () => {
    const criticalReq = scoreRequest({ urgencyLevel: "Critical" });
    const normalReq = scoreRequest({ urgencyLevel: "Normal" });

    expect(criticalReq.scoreBreakdown.urgencyScore).toBe(30);
    expect(normalReq.scoreBreakdown.urgencyScore).toBe(10);
  });

  // Test 3: Equity penalty for repeat bookings
  it("3. should penalize frequent prior bookings to foster usage equity and prevent resource hoarding", () => {
    const firstTimeUser = scoreRequest({ priorMonthlyBookings: 0 });
    const repeatUser = scoreRequest({ priorMonthlyBookings: 5 });

    expect(firstTimeUser.scoreBreakdown.fairnessScore).toBe(20);
    expect(repeatUser.scoreBreakdown.fairnessScore).toBe(4);
    expect(firstTimeUser.compositeScore).toBeGreaterThan(repeatUser.compositeScore);
  });

  // Test 4: Alternative slot recommendation for deferred requests
  it("4. should suggest an alternative slot and workstation backup for deferred requests", () => {
    const conflictResult = resolveAllocationConflict(sampleConflictingRequests);

    expect(conflictResult.suggestedAlternative).toBeDefined();
    expect(conflictResult.suggestedAlternative.student).toContain("Priyanka Nair");
    expect(conflictResult.suggestedAlternative.suggestedDate).toBeDefined();
    expect(conflictResult.suggestedAlternative.suggestedSlot).toContain("02:00 PM - 05:00 PM");
    expect(conflictResult.suggestedAlternative.workstationBackup).toContain("Lab 501");
  });

  // Test 5: Complete Explainable AI (XAI) score breakdown calculation
  it("5. should output a complete Explainable AI (XAI) score breakdown formula", () => {
    const scored = scoreRequest({
      deadlineDaysRemaining: 2,
      urgencyLevel: "Critical",
      priorMonthlyBookings: 1
    });

    // 50 (deadline) + 30 (urgency) + 16 (equity) = 96
    expect(scored.compositeScore).toBe(96);
    expect(scored.scoreBreakdown).toEqual({
      deadlineScore: 50,
      urgencyScore: 30,
      fairnessScore: 16
    });
    expect(scored.xaiFormula).toBe(
      "50pts (Deadline) + 30pts (Urgency) + 16pts (Equity) = 96/100"
    );
  });

  // Test 6: Digital lab pass token generation and bench allocation
  it("6. should generate an authorized digital lab gate pass with bench allocation and verification hash", () => {
    const request = {
      id: "REQ-2026-001",
      studentName: "Aarav Sharma",
      usn: "1MS21CS004",
      department: "Computer Science & ISE",
      equipmentName: "NVIDIA Jetson AGX Orin DevKit",
      guideName: "Dr. Sudhir Rao",
      slotDate: "2026-11-24",
      timeSlot: "10:00 AM - 01:00 PM"
    };

    const pass = generateDigitalLabPass(request, "Bench-04A");

    expect(pass).toBeDefined();
    expect(pass.passId).toMatch(/^PASS-2026-JETSON-\d+/);
    expect(pass.benchNumber).toBe("Bench-04A");
    expect(pass.status).toBe("AUTHORIZED_ACTIVE");
    expect(pass.verificationHash).toMatch(/^0x[a-f0-9]+/);
    expect(pass.studentName).toBe("Aarav Sharma");
  });

  // Test 7: Input sanitization against <script> XSS vectors
  it("7. should neutralize <script> XSS injection vectors from user inputs", () => {
    const maliciousInput = "<script>alert('pwned')</script>";
    const sanitized = sanitizeInput(maliciousInput);

    expect(sanitized).toBe("scriptalert('pwned')/script");
    expect(sanitized).not.toContain("<script>");
    expect(sanitized).not.toContain("<");
    expect(sanitized).not.toContain(">");
  });

  // Test 8: Input sanitization against HTML tag injection
  it("8. should strip HTML tags and bound excessive character length", () => {
    const htmlPayload = "<h1>Autonomous Navigation</h1><img src=x onerror=alert(1)>";
    const sanitized = sanitizeInput(htmlPayload, 25);

    expect(sanitized).not.toContain("<");
    expect(sanitized).not.toContain(">");
    expect(sanitized.length).toBeLessThanOrEqual(25);
  });

  // Test 9: Form payload rejection for missing USN/student name
  it("9. should reject booking payloads missing student name or USN", () => {
    const missingNamePayload = {
      studentName: "",
      usn: "1MS21CS004",
      projectTitle: "Robotics Sensor Fusion",
      deadline: "2026-12-01"
    };
    const missingUsnPayload = {
      studentName: "Aarav Sharma",
      usn: "",
      projectTitle: "Robotics Sensor Fusion",
      deadline: "2026-12-01"
    };

    const validation1 = validateBookingPayload(missingNamePayload);
    const validation2 = validateBookingPayload(missingUsnPayload);

    expect(validation1.isValid).toBe(false);
    expect(validation1.errors.studentName).toBeDefined();

    expect(validation2.isValid).toBe(false);
    expect(validation2.errors.usn).toBeDefined();
  });

  // Test 10: Form payload acceptance for valid project submissions
  it("10. should accept and validate legitimate project booking submissions", () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);

    const validPayload = {
      studentName: "Aarav Sharma",
      usn: "1MS21CS004",
      projectTitle: "Edge TensorRT UAV Obstacle Avoidance",
      deadline: futureDate.toISOString().split("T")[0],
      urgencyLevel: "Critical"
    };

    const result = validateBookingPayload(validPayload);

    expect(result.isValid).toBe(true);
    expect(Object.keys(result.errors).length).toBe(0);
  });
});
