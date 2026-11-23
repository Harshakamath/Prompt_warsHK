import { describe, it, expect } from "vitest";
import {
  resolveAllocationConflict,
  scoreRequest,
  generateDigitalLabPass
} from "../services/aiScheduler";
import {
  sanitizeInput,
  validateBookingPayload,
  validateEquipmentPayload
} from "../utils/security";
import { sampleConflictingRequests } from "../data/labData";

describe("LabLink Production AI Scheduler, Security & Verification Suite", () => {
  // Test 1: Deadline priority scoring
  it("1. should prioritize closer project deadlines with higher proximity score", () => {
    const imminentReq = scoreRequest({
      studentName: "Student A",
      deadlineDaysRemaining: 2,
      urgencyLevel: "High",
      priorMonthlyBookings: 1
    });
    const distantReq = scoreRequest({
      studentName: "Student B",
      deadlineDaysRemaining: 18,
      urgencyLevel: "High",
      priorMonthlyBookings: 1
    });

    expect(imminentReq.scoreBreakdown.deadlineScore).toBe(50);
    expect(distantReq.scoreBreakdown.deadlineScore).toBe(10);
    expect(imminentReq.compositeScore).toBeGreaterThan(distantReq.compositeScore);
  });

  // Test 2: Urgency severity weighting
  it("2. should weight project urgency severity accurately (Critical: 30pts vs Normal: 10pts)", () => {
    const criticalReq = scoreRequest({ urgencyLevel: "Critical" });
    const highReq = scoreRequest({ urgencyLevel: "High" });
    const normalReq = scoreRequest({ urgencyLevel: "Normal" });

    expect(criticalReq.scoreBreakdown.urgencyScore).toBe(30);
    expect(highReq.scoreBreakdown.urgencyScore).toBe(20);
    expect(normalReq.scoreBreakdown.urgencyScore).toBe(10);
  });

  // Test 3: Usage equity penalty
  it("3. should penalize heavy repeat monthly bookings to foster usage equity", () => {
    const firstTimeUser = scoreRequest({ priorMonthlyBookings: 0 });
    const repeatUser = scoreRequest({ priorMonthlyBookings: 5 });

    expect(firstTimeUser.scoreBreakdown.fairnessScore).toBe(20);
    expect(repeatUser.scoreBreakdown.fairnessScore).toBe(4);
    expect(firstTimeUser.compositeScore).toBeGreaterThan(repeatUser.compositeScore);
  });

  // Test 4: Alternative slot recommendation generation
  it("4. should generate guaranteed alternative slot recommendations and workstation backups for deferred students", () => {
    const result = resolveAllocationConflict(sampleConflictingRequests);

    expect(result.suggestedAlternative).toBeDefined();
    expect(result.suggestedAlternative.student).toContain("Priyanka Nair");
    expect(result.suggestedAlternative.suggestedDate).toBeDefined();
    expect(result.suggestedAlternative.suggestedSlot).toContain("02:00 PM - 05:00 PM");
    expect(result.suggestedAlternative.workstationBackup).toContain("High-Performance Workstation Node 2");
    expect(result.deferredRequests.length).toBeGreaterThanOrEqual(1);
  });

  // Test 5: Complete composite score calculation
  it("5. should calculate complete composite score out of 100 with explainable math breakdown", () => {
    const scored = scoreRequest({
      deadlineDaysRemaining: 2, // 50 pts
      urgencyLevel: "Critical",  // 30 pts
      priorMonthlyBookings: 1    // 16 pts
    });

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

  // Test 6: Digital gate pass token generation
  it("6. should generate an authorized digital lab entry pass with unique Token ID, timestamp, and bench assignment", () => {
    const request = {
      id: "REQ-2026-001",
      studentName: "Aarav Sharma",
      usn: "1MS21CS004",
      department: "CSE / ISE",
      equipmentName: "NVIDIA Jetson Edge-AI Dev Kit",
      guideName: "Dr. Sudhir Rao",
      slotDate: "2026-11-24",
      timeSlot: "10:00 AM - 01:00 PM"
    };

    const pass = generateDigitalLabPass(request, "Bench-04A");

    expect(pass).toBeDefined();
    expect(pass.passId).toMatch(/^PASS-2026-JETSON-\d+/);
    expect(pass.tokenId).toBe(pass.passId);
    expect(pass.benchNumber).toBe("Bench-04A");
    expect(pass.studentName).toBe("Aarav Sharma");
    expect(pass.usn).toBe("1MS21CS004");
    expect(pass.facultySponsor).toBe("Dr. Sudhir Rao");
    expect(pass.timestamp).toBeDefined();
    expect(pass.verificationHash).toMatch(/^0x[a-f0-9]+/);
    expect(pass.status).toBe("AUTHORIZED_ACTIVE");
  });

  // Test 7: XSS sanitization of script tags
  it("7. should neutralize <script> XSS injection vectors from user input strings", () => {
    const xssPayload = "<script>alert('pwned')</script>";
    const sanitized = sanitizeInput(xssPayload);

    expect(sanitized).toBe("scriptalert('pwned')/script");
    expect(sanitized).not.toContain("<script>");
    expect(sanitized).not.toContain("<");
    expect(sanitized).not.toContain(">");
  });

  // Test 8: HTML tag stripping
  it("8. should strip HTML tags and bound excessive character lengths", () => {
    const htmlPayload = "<h1>Edge AI Prototyping</h1><img src=x onerror=alert(1)>";
    const sanitized = sanitizeInput(htmlPayload, 20);

    expect(sanitized).not.toContain("<");
    expect(sanitized).not.toContain(">");
    expect(sanitized.length).toBeLessThanOrEqual(20);
  });

  // Test 9: Form payload rejection on missing required fields
  it("9. should reject booking payloads on missing required fields or invalid USN formats", () => {
    const invalidPayloads = [
      {
        studentName: "",
        usn: "1MS21CS004",
        projectTitle: "Autonomous UAV",
        deadline: "2026-12-01"
      },
      {
        studentName: "Aarav Sharma",
        usn: "1M", // too short, min 5 chars required
        projectTitle: "Autonomous UAV",
        deadline: "2026-12-01"
      },
      {
        studentName: "Aarav Sharma",
        usn: "1MS21CS004",
        projectTitle: "", // missing title
        deadline: "2026-12-01"
      },
      {
        studentName: "Aarav Sharma",
        usn: "1MS21CS004",
        projectTitle: "Autonomous UAV",
        deadline: "2020-01-01" // past deadline
      }
    ];

    invalidPayloads.forEach((payload) => {
      const result = validateBookingPayload(payload);
      expect(result.isValid).toBe(false);
      expect(Object.keys(result.errors).length).toBeGreaterThan(0);
    });
  });

  // Test 10: Form payload acceptance on valid submission
  it("10. should accept and validate compliant project booking submissions", () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);

    const validSubmission = {
      studentName: "Aarav Sharma",
      usn: "1MS21CS004",
      projectTitle: "Autonomous Search & Rescue Drone Navigation",
      deadline: futureDate.toISOString().split("T")[0],
      urgencyLevel: "Critical"
    };

    const result = validateBookingPayload(validSubmission);

    expect(result.isValid).toBe(true);
    expect(Object.keys(result.errors).length).toBe(0);
  });

  // Test 11: Equipment payload validation acceptance
  it("11. should accept and validate legitimate equipment registration submissions", () => {
    const validEquipment = {
      name: "Rohde & Schwarz Spectrum Analyzer",
      department: "ECE / VLSI",
      labRoom: "Room 204 - RF Lab",
      totalUnits: 3
    };

    const result = validateEquipmentPayload(validEquipment);
    expect(result.isValid).toBe(true);
    expect(Object.keys(result.errors).length).toBe(0);
  });

  // Test 12: Equipment payload validation rejection
  it("12. should reject equipment payloads with missing name, invalid department, or out-of-range units", () => {
    const invalidEquipment1 = {
      name: "AB", // too short, min 3 chars
      department: "ECE / VLSI",
      labRoom: "Room 204",
      totalUnits: 2
    };
    const invalidEquipment2 = {
      name: "Digital Multimeter",
      department: "", // missing department
      labRoom: "Room 204",
      totalUnits: 2
    };
    const invalidEquipment3 = {
      name: "Digital Multimeter",
      department: "ECE / VLSI",
      labRoom: "Room 204",
      totalUnits: 0 // < 1 unit
    };
    const invalidEquipment4 = {
      name: "Digital Multimeter",
      department: "ECE / VLSI",
      labRoom: "Room 204",
      totalUnits: 99 // > 50 units
    };

    expect(validateEquipmentPayload(invalidEquipment1).isValid).toBe(false);
    expect(validateEquipmentPayload(invalidEquipment2).isValid).toBe(false);
    expect(validateEquipmentPayload(invalidEquipment3).isValid).toBe(false);
    expect(validateEquipmentPayload(invalidEquipment4).isValid).toBe(false);
  });
});
