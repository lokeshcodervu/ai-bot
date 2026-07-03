# Phase 2: Leads CRM Visual Kanban Board & Status Toggle

- **Estimated Duration:** 1.0 Week
- **Phase Index:** 2

---

## 🎯 Target Features to Implement
- [ ] List View vs Kanban CRM Board view toggle controller in the Leads dashboard page.
- [ ] Horizontal multi-column layout showing categorized leads according to pipeline stage.
- [ ] Inline lead calling button inside each Kanban card to initiate automated AI dials instantly.
- [ ] Inline status selector dropdown on each card to change and update stages directly from the board.
- [ ] Integration with backend `PATCH /leads/{id}/status` to persist stage updates dynamically.
- [ ] Single lead information dialog card when clicking "View Details" on the card.

---

## 📦 Key Deliverables
- [ ] Interactive toggle button (`List View` / `Kanban Board`) with Lucide icons.
- [ ] 5 columns mapping to states:
  - **New**: `Imported`
  - **Contacting**: `Pending Queue` or `Connected`
  - **Qualified / Demo**: `Needs Follow-up`
  - **Converted**: `Converted`
  - **Lost**: `Not Interested`
- [ ] Safe, layout-preserving leads mapping that keeps existing search, CSV import, CSV export, and template downloads functional.

---

## 🗄️ Components & Files Involved
This phase will directly work on, modify, or interact with:
* **Leads dashboard page:** `frontend/src/app/dashboard/leads/page.tsx`
* **Leads backend routes:** `/leads`, `/leads/{id}/status`, `/telephony/call-lead/{id}`

---

## 💻 Developer Working Instructions
1. Maintain existing state hooks (`leadsList`, `displayedLeads`, `isLoading`, `showImportModal`, `selectedLead`) to prevent regression.
2. Introduce a new state `viewMode: 'list' | 'kanban'` defaulting to `'list'`.
3. Build the Kanban UI as a flex container with horizontal scrolling (`overflow-x-auto min-w-[1200px]`).
4. Style the board columns with borders matching the mockup colors (e.g. emerald for Converted, indigo for New, red for Contacting).
5. Render clean card snippets showing the prospect name, phone, source, an option to trigger calls via `handleCallLead`, and a select element for stage updates.
