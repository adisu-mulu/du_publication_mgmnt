# Dilla University Publication Management System

An institutional web platform for organizing, verifying, and tracking academic research publications (articles, conference papers, books, etc.) produced by faculty and researchers across Dilla University colleges.

---

## 1. System Overview & Workflow

- **University Repository Role**: This system is not a journal publisher; it serves as Dilla University's central verified database of publications produced by its faculty.
- **Publication Lifecycle**:
  - **Submission**: A researcher enters the bibliographic details of their published article. It immediately enters the `pending` state.
  - **Officer Verification**: The Publication Officer verifies the authenticity and metadata of the record. The officer has 3 actions:
    1. **Approve**: Confirms the publication as verified.
    2. **Approve with Modification**: Fixes/adjusts any inaccurate fields (e.g., DOI, author order, title) directly and approves.
    3. **Reject**: Rejects the entry with mandatory remarks explaining why.
  - **Strict Visibility Boundary**:
    - Unapproved records (`pending`, `rejected`) and reviewer remarks are visible **only** to the researcher who submitted them and the Publication Officer.
    - Other university actors (Vice Deans and Supervisors) only see verified, **approved** publications.

---

## 2. Roles & Permissions

Every university account is a **Researcher** by default. An account can additionally hold one or more specialized roles:

1. **Researcher (`researcher`)** (Default):
   - Submit new publication records.
   - Track verification status (`pending`, `approved`, `rejected`).
   - Read reviewer remarks and delete or resubmit rejected records.
   - Isolated to their own submissions.

2. **Publication Officer (`publication_officer`)**:
   - Institutional verification queue across all colleges.
   - Direct Approve, Approve & Modify, or Reject with mandatory remarks.
   - University-wide statistics.
   - *Conflict of interest rule*: A publication officer cannot verify, approve, or reject their own publications.

3. **Vice Dean (`vice_dean`)**:
   - Manages researcher accounts within their own college (create account, reset password, activate/deactivate).
   - Views verified (approved) publications list and statistics scoped strictly to their college.

4. **Supervisor (`supervisor`)**:
   - Read-only institutional overview across all colleges, publication types, and years.
   - CSV export of approved publications for reporting.

### Dynamic Role Switcher
- If an account holds 2 or more roles, a role selector dropdown appears at the top of the sidebar.
- Switching roles calls `POST /api/auth/switch-role`, switches the active JWT role, and reloads the role-specific dashboard and navigation menu.

---

## 3. Seed Accounts & Credentials

The database has been seeded with the standard password for all test accounts: `Password123!`

| Role Profile | Email | Password | Assigned Roles |
|---|---|---|---|
| **Researcher Only** | `researcher@du.edu.et` | `Password123!` | Researcher |
| **Vice Dean** | `vicedean@du.edu.et` | `Password123!` | Researcher, Vice Dean |
| **Publication Officer** | `officer@du.edu.et` | `Password123!` | Researcher, Publication Officer |
| **Supervisor** | `supervisor@du.edu.et` | `Password123!` | Researcher, Supervisor |
| **All Roles (Switcher Test)** | `multi@du.edu.et` | `Password123!` | Researcher, Vice Dean, Publication Officer, Supervisor |

---

## 4. Setup & Running the Application

### Prerequisites
- Node.js (v18+)
- MySQL (v8.0+)

### Database & Environment Setup
1. Configure `backend/.env`:
   ```env
   PORT=5000
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=du_publication_db
   DB_HOST=localhost
   # Or DB_SOCKET=/tmp/mysql-du/mysql.sock if using Unix domain socket
   JWT_SECRET=du_publication_super_secret_jwt_key_2026
   ```

2. Run Database Migration & Seeding:
   ```bash
   cd backend
   node migrate.js
   node seed.js
   ```

3. Start the Backend API Server:
   ```bash
   cd backend
   npm start
   # Server listens on http://localhost:5000
   ```

4. Run the Frontend:
   ```bash
   cd frontend
   npm run dev
   # Accessible at http://localhost:5173
   ```

---

## 5. Backend Architecture

Module-based structure under `backend/src/`:
- `modules/auth/`: Login, role switching, user identity (`/api/auth`).
- `modules/researcher/`: Submissions and personal publication tracking (`/api/researcher`).
- `modules/publication_officer/`: Verification queue, approve/modify/reject (`/api/publication-officer`).
- `modules/vice_dean/`: College researcher account management & college statistics (`/api/vice-dean`).
- `modules/supervisor/`: Read-only university stats and CSV export (`/api/supervisor`).
- `modules/shared/`: Centralized publication query service with pagination and role-based filtering.
- `middleware/auth.js`: Token authentication, active role enforcement (`requireRole`), and centralized error handling.
- `utils/password.js`: Scrypt password hashing via Node.js built-in crypto module.
