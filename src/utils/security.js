/**
 * LabLink Security & Payload Validation Utilities
 * Enforces XSS defense, strict schema boundary validation, and payload integrity.
 */

/**
 * Sanitizes input text by neutralizing script vectors, stripping HTML tags (< >),
 * removing null bytes, trimming whitespace, and bounding length.
 *
 * @param {any} str - Input string to sanitize
 * @param {number} [maxLength=200] - Maximum allowed length
 * @returns {string} Sanitized clean string
 */
export function sanitizeInput(str, maxLength = 200) {
  if (str === null || str === undefined) {
    return "";
  }
  const inputStr = typeof str === "string" ? str : String(str);
  // Strip null bytes and angle brackets (< and >)
  const stripped = inputStr.replace(/\0/g, "").replace(/[<>]/g, "");
  // Trim surrounding whitespace
  const trimmed = stripped.trim();
  // Bound max length
  return trimmed.slice(0, maxLength);
}

/**
 * Validates laboratory slot booking submissions against schema constraints.
 *
 * @param {Object} data - Form submission payload
 * @returns {{ isValid: boolean, errors: Object<string, string> }}
 */
export function validateBookingPayload(data) {
  const errors = {};

  if (!data || typeof data !== "object") {
    return {
      isValid: false,
      errors: { general: "Invalid submission payload structure." }
    };
  }

  // 1. Student Name
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

  // 2. College USN / Student ID
  const usn = typeof data.usn === "string" ? data.usn.trim() : "";
  if (!usn) {
    errors.usn = "College USN / Student ID is required.";
  } else if (!/^[A-Za-z0-9/-]{3,25}$/.test(usn)) {
    errors.usn = "Enter a valid USN / Student ID (3-25 alphanumeric characters).";
  }

  // 3. Project Title
  const title = typeof data.projectTitle === "string" ? data.projectTitle.trim() : "";
  if (!title) {
    errors.projectTitle = "Project title is required.";
  } else if (title.length < 3) {
    errors.projectTitle = "Project title must be at least 3 characters.";
  } else if (title.length > 150) {
    errors.projectTitle = "Project title cannot exceed 150 characters.";
  }

  // 4. Project Deadline Date
  const deadlineStr = typeof data.deadline === "string" ? data.deadline.trim() : "";
  if (!deadlineStr) {
    errors.deadline = "Project deadline date is required.";
  } else {
    const parsedDate = new Date(deadlineStr);
    if (isNaN(parsedDate.getTime())) {
      errors.deadline = "Please provide a valid deadline date.";
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const targetDate = new Date(deadlineStr + (deadlineStr.includes("T") ? "" : "T00:00:00"));
      if (targetDate < today) {
        errors.deadline = "Project deadline cannot be in the past.";
      }
    }
  }

  // 5. Urgency Level
  if (data.urgencyLevel) {
    const validLevels = ["normal", "high", "critical"];
    if (!validLevels.includes(String(data.urgencyLevel).toLowerCase())) {
      errors.urgencyLevel = "Urgency level must be Normal, High, or Critical.";
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}
