# 🐝 HIVE: Unified Academic Hub

### Your academic workflow, unified.
Students often suffer from "tab fatigue," switching between Canvas, Outlook, and Google Calendar to manage their coursework. **Hive** brings these systems together into a single, high-performance dashboard, centralizing assignments, events, and deadlines.

---

## 🏗 Architecture Overview
Hive follows a modular **three-service architecture** designed for separation of concerns and computational efficiency:

* **Frontend (React 18 + TypeScript):** A type-safe, responsive interface built with Vite and Tailwind CSS.
* **Backend (Node.js + Express + PostgreSQL):** Our central API handling authentication (JWT), data persistence, and third-party integration.
* **Logic Engine (Python + Flask):** A dedicated service responsible for the custom task-prioritization algorithms.

## 👥 My Role & Collaboration
This was a collaborative team project where system design was shared. My primary focus was on **Front-End Engineering and Integration**, specifically:
* **OAuth 2.0 Integration:** Engineered the secure handshake flows for Canvas and Google Calendar.
* **Submission Resilience:** Designed frontend logic to handle API timeouts and ensure data persistence during high-traffic periods.
* **UI Architecture:** Built a modular, reusable component library using Tailwind CSS and TypeScript.

## ⚡ Technical Stack
* **Languages:** TypeScript (72%), JavaScript, Python, CSS.
* **Frameworks:** React 18, Node.js, Flask.
* **Database:** PostgreSQL.
* **Security:** JWT, Bcrypt, OAuth 2.0.
* **Testing:** Jest, Vitest, React Testing Library.

## 🏃 Local Development
To run the full Hive ecosystem, you must initialize the three services:

1. **Backend:** `cd backend && npm run dev` (Port 5000)
2. **Frontend:** `cd frontend && npm run dev` (Port 5173)
3. **Logic Engine:** `cd logic-engine && python app.py` (Port 5001)

*Note: A `.env` file is required in the backend directory for local configuration (omitted for security).*
