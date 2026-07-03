# Phase 1: Sidebar RBAC & Session Expiry Handling

- **Estimated Duration:** 0.5 Weeks
- **Phase Index:** 1

---

## 🎯 Target Features to Implement
- [ ] Role-Based Access Control (RBAC) filtering on the sidebar navigation links in `layout.tsx`.
- [ ] Hide/restrict the "Go to AI Setup" button in the header bar for `SALES_REP` users.
- [ ] Auto-redirect users to the login screen (`/`) and clear local storage if a `401 Unauthorized` response is returned during the wallet balance load in `layout.tsx`.

---

## 📦 Key Deliverables
- [ ] Dynamic sidebar navigation that checks `user.role` from the state store and hides forbidden tabs.
- [ ] Header bar that limits administrative shortcut buttons based on user permissions.
- [ ] Automatic log-out mechanism triggered by expired JWT access tokens on mount.

---

## 🗄️ Components & Files Involved
This phase will directly work on, modify, or interact with:
* **Frontend layout wrapper:** `frontend/src/app/dashboard/layout.tsx`
* **State Store:** `frontend/src/app/store/index.ts`

---

## 💻 Developer Working Instructions
1. Get the `user` object and `setToken`/`setUser` actions from the Zustand `useStore` hook.
2. Filter the `navItems` array using `user.role`:
   - `SALES_REP` should only see: Dashboard, Leads, Call Logs, Live Monitor.
   - `CAMPAIGN_MANAGER` should see: Dashboard, Campaigns, Leads, Live Monitor, Call Logs, Analytics, Compliance. (Hides Settings and User Management).
   - `BUSINESS_OWNER` / `SUPER_ADMIN` should see all tabs.
3. Check the status of `fetch(`${API_BASE}/tenant/wallet`)`. If `res.status === 401`, call `setToken(null)`, `setUser(null)`, and redirect to `/`.
4. Ensure no typescript compile errors occur when formatting role strings.
