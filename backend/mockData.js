// backend/mockData.js
// This mimics the data Member 3 will eventually fetch from Canvas/Outlook
const assignments = [
  {
    id: "101",
    title: "Artificial Intelligence Assignment 1",
    course: "CS 401",
    platform: "Canvas",
    dueDate: "2025-12-05T23:59:00Z", // ISO format for easy sorting
    priority: "Medium",
    isRead: false
  },
  {
    id: "102",
    title: "Advisor Meeting",
    course: "N/A",
    platform: "Outlook",
    dueDate: "2025-12-01T14:00:00Z",
    priority: "High",
    isRead: true
  }
];

module.exports = assignments;