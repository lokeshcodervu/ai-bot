# Phase 3: Team Members API Integration & CRUD Operations

- **Estimated Duration:** 0.5 Weeks
- **Phase Index:** 3

---

## 🎯 Target Features to Implement
- [ ] Connect team list retrieval to the live backend `GET /users` API.
- [ ] Replace local mock signup/invite state with the backend `POST /users` endpoint.
- [ ] Implement user details updates (Full Name, Phone Number, Role, and Active Status) utilizing `PATCH /users/{id}`.
- [ ] Connect account removals to the backend `DELETE /users/{id}` soft-delete endpoint.
- [ ] Protect against deleting the currently logged-in user or changing your own security role.

---

## 📦 Key Deliverables
- [ ] Fully operational team grid populated from the workspace database.
- [ ] Invite Member Dialog form validating inputs and posting payload structure matching backend schema `UserCreate`.
- [ ] Edit Profile Dialog communicating state updates via `PATCH`.
- [ ] Self-deletion checking alert.

---

## 🗄️ Components & Files Involved
This phase will directly work on, modify, or interact with:
* **User management page:** `frontend/src/app/dashboard/user-management/page.tsx`
* **User backend endpoints:** `/users`, `/users/{id}`

---

## 💻 Developer Working Instructions
1. Remove the static array `INITIAL_MEMBERS` completely.
2. Set up `members` state and fetch on mount inside `useEffect` by calling `GET ${API_BASE}/users` with proper headers:
   `Authorization: Bearer ${token}`.
3. Configure the role select tags to use backend values: `business_owner` (Owner), `campaign_manager` (Manager), and `sales_rep` (Rep).
4. Predict/generate a lowercase username prefix from the email input (e.g. `jane.doe@email.com` -> `janedoe`) as the user types, to ease the onboarding process.
5. Disable role edits and status checks for the current user's own card to avoid self-demotion or lockout.
