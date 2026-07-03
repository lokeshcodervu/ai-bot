# CoderVu SalesAI — Frontend Improvements Migration Guide

This directory contains upgraded Next.js components to bring the frontend into full compliance with the product specifications (BRD/PRD).

---

## Migration Steps

Follow these steps to safely copy the files into your active frontend project:

### Step 1: Upgraded Sidebar (RBAC Role Filtering)
1. **Backup existing layout**:
   Copy `frontend/src/app/dashboard/layout.tsx` to `frontend/src/app/dashboard/layout.tsx.bak`.
2. **Apply new layout**:
   Replace the contents of `frontend/src/app/dashboard/layout.tsx` with the contents of [layout.tsx](./layout.tsx).
3. **Verify**:
   Log in with a user whose role is `SALES_REP` (Sales Representative). Confirm that restricted menus like **Campaigns**, **User Management**, **Settings**, and **Compliance** are hidden from their sidebar.

### Step 2: Leads Pipeline (Kanban CRM Toggle)
1. **Backup existing page**:
   Copy `frontend/src/app/dashboard/leads/page.tsx` to `frontend/src/app/dashboard/leads/page.tsx.bak`.
2. **Apply new page**:
   Replace the contents of `frontend/src/app/dashboard/leads/page.tsx` with the contents of [leads_page_kanban.tsx](./leads_page_kanban.tsx).
3. **Verify**:
   Open the **Leads** page. Click the **Kanban Board** toggle to view the cards divided into pipeline columns (`New`, `Contacting`, `Qualified / Demo`, `Converted`, `Lost`). Try dragging or moving cards to check if the status updates dynamically.

### Step 3: User Management (Live API Integration)
1. **Backup existing page**:
   Copy `frontend/src/app/dashboard/user-management/page.tsx` to `frontend/src/app/dashboard/user-management/page.tsx.bak`.
2. **Apply new page**:
   Replace the contents of `frontend/src/app/dashboard/user-management/page.tsx` with the contents of [user_management_page.tsx](./user_management_page.tsx).
3. **Verify**:
   Open the **User Management** page. Verify it loads the actual active workspace team members. Try inviting a new user or editing/deleting a member and verify the changes persist to the backend database.
