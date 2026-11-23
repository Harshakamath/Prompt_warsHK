/**
 * LabLink Security & Input Validation Utilities
 * Defends against XSS, injection vectors, and malformed booking payloads.
 */

/**
 * Sanitizes input string by stripping angle brackets (< >), trimming whitespace,
 * and enforcing maximum string length.
 * @param {any} str - Input to sanitize
 * @param {number} [maxLength=200] - Maximum allowed length
 * @returns {string} Sanitized string
 */
export function sanitizeInput(str, maxLength = 200) {
  if (str === null || str === undefined) {
    return "";
  }
  const inputStr = typeof str === "string" ? str : String(str);
  // Strip angle brackets (< and >)
  const stripped = inputStr.replace(/[<>]/g, "");
  // Trim surrounding whitespace
  const trimmed = stripped.trim();
  // Enforce maximum length limit
  return trimmed.slice(0, maxLength);
}

/**
 * Validates a project-based lab slot booking payload.
 * Checks student name, college USN/ID, project title, and deadline date.
 * @param {Object} data - Booking payload
 * @returns {{ isValid: boolean, errors: Object<string, string> }}
 */
export function validateBookingPayload(data) {
  const errors = {};

  if (!data || typeof data !== "object") {
    return {
      isValid: false,
      errors: { general: "Invalid booking submission payload." }
    };
  }

  // Student Name
  const name = typeof data.studentName === "string" ? data.studentName.trim() : "";
  if (!name) {
    errors.studentName = "Student name is required.";
  } else if (name.length < 2) {
    errors.studentName = "Student name must be at least 2 characters.";
  } else if (name.length > 100) {
    errors.studentName = "Student name cannot exceed 100 characters.";
  } else if (!/^[a-zA-Z\s.'-]+$/.test(name)) {
    errors.studentName = "Student name contains invalid characters.";
  }

  // College USN / ID
  const usn = typeof data.usn === "string" ? data.usn.trim() : "";
  if (!usn) {
    errors.usn = "College USN / Student ID is required.";
  } else if (!/^[A-Za-z0-9/-]{3,25}$/.test(usn)) {
    errors.usn = "Enter a valid USN / Student ID (3-25 alphanumeric characters).";
  }

  // Project Title
  const title = typeof data.projectTitle === "string" ? data.projectTitle.trim() : "";
  if (!title) {
    errors.projectTitle = "Project title is required.";
  } else if (title.length < 3) {
    errors.projectTitle = "Project title must be at least 3 characters.";
  } else if (title.length > 150) {
    errors.projectTitle = "Project title cannot exceed 150 characters.";
  }

  // Deadline Date
  const deadlineStr = typeof data.deadline === "string" ? data.deadline.trim() : "";
  if (!deadlineStr) {
    errors.deadline = "Project deadline date is required.";
  } else {
    const parsedDate = new Date(deadlineStr);
    if (isNaN(parsedDate.getTime())) {
      errors.deadline = "Please provide a valid date for project deadline.";
    } else {
      // Check if deadline is before start of today (midnight local time)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const targetDate = new Date(deadlineStr + (deadlineStr.includes("T") ? "" : "T00:00:00"));
      if (targetDate < today) {
        errors.deadline = "Project deadline cannot be in the past.";
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}
