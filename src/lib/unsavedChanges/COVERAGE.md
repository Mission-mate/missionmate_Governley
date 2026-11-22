# Unsaved-changes guard — coverage checklist

Last audited: 30 Sep 2026.

Marking: **draft** = holds a draft · **read-only** = no edits · **instant** = writes through immediately (nothing to lose).
Status: [x] guarded · [~] in progress · [ ] pending · n/a = excluded by marking.

## Configuration panes (Stage 1–2)
- [x] Compliance · Asset Register "Customise Fields" (AssetCustomiserPane) — draft
- [x] Strategy · Level field customiser (StrategyFieldConfigPane) — draft
- [x] Board · Work Plan "Customise Fields" (WorkPlanFieldConfigPane) — draft, compares Category only
- [x] Risk · "Customise Fields" (RiskFieldConfigPane) — draft, compares Category only; colour picker is a child step
- [x] Compliance · Obligations "Customise Fields" (ComplianceFieldConfigPane) — draft, compares Category + Regulator
- n/a Board · Skills "Customise Composition" (CustomizerPane) — instant
- n/a Strategy · Level 5 "Manage Columns" (ManageTaskColumnsPane, parent Level5TaskPanel persists every change) — instant
- n/a Strategy · Level 6 "Manage Columns" (ManageColumnsPane, parent Level6ReportPanel persists every change) — instant
- [x] Strategy · Level 6 reporting settings (Level6SettingsPane) — draft, apply-on-save (toggle, layout, categories + row reconciliation on Save)
- [x] Risk · Edit criteria (EditCriteriaPane) — draft, compares criteria text
- [x] Settings · Custom field editor (CustomFieldEditor) — draft, compares name, type, options (create + edit)
- [x] Settings · Contact type field (EditContactTypeField) — draft, compares options only
- [x] Settings · Membership form question (FieldSettingsPane) — draft; Escape routed through guard
- [x] Settings · Membership page settings (FormSettingsPane) — shared page draft; Discard restores pane fields to open-time values
- [x] Strategy · Strategy Customizer (StrategyHierarchyModal) — draft, compares layers + foundations; Themes tab is instant
- [x] Strategy · Level 5 edit column (EditTaskColumnModal) — draft, compares title + options
- [x] Compliance · Add/edit custom field (AddComplianceFieldModal) — draft, compares name, type, options; blank open is silent
- [x] Shared · Add column builder (AddColumnModal) — draft vs empty defaults; nested in every customiser
- Discard prompt now layers above z-[130] child modals

## Notes
- [x] Shared · Note page drawer (NotePagePane) — draft (edit mode only)

## Record form drawers (Stage 3)
### Save-in-flight rule (all guarded surfaces)
- [x] Shared guard queues a close requested mid-save and runs it when the save lands; dropped if the draft still differs (failed save)
- [x] Every Stage 1–2 surface reports its save flag (FieldSettingsPane commits synchronously — nothing in flight)

### Board group — converted, awaiting sign-off
- [x] Board · Meeting create/edit (CreateMeetingModal) — draft, pane + modal variants
- [x] Board · Committee edit (EditCommitteePane) — draft, Details step only (Manage Members writes through)
- [x] Board · Log conflict (LogConflictPane) — draft, inert when read-only
- [x] Board · Conflict action (ConflictActionPane) — draft, title + rich text
- [x] Board · Board document edit (EditBoardDocumentPane) — draft
- [x] Board · Meeting action form (ActionFormPane) — draft, view→edit Cancel restores opened values
- [x] Board · Add meeting document (AddMeetingDocumentModal) — draft vs empty
- n/a Board · Manage participants (ManageParticipantsPane) — instant (each step writes through)
- [x] Board · Member skills (MemberSkillsPane) — draft, guarded only while editing, inert until loaded
- [x] Board · Work item form (WorkItemFormPane) — draft, view→edit Cancel restores opened values; library-page Close now guarded

### Compliance, contacts, documents, grants, risk, settings — converted, awaiting verification pass
- [x] Compliance · Obligation form (ObligationFormPane) — draft; Notes/Tasks lock removed, their unsaved edits feed the same prompt; library Close guarded
- [x] Compliance · Add asset (AddAssetPane) — draft vs empty
- [x] Compliance · Maintenance entry (MaintenancePane) — draft, guarded only while editing
- [x] Compliance · Register form (RegisterFormPane) — one draft across both wizard steps
- [x] Contacts · Add contact (AddContactPane) — draft vs empty, inert while type config loads
- [x] Documents · Add document (AddDocumentModal) — draft vs empty
- [x] Grants · Edit grant (EditGrantPane) — draft
- [x] Grants · Edit key contacts (EditKeyContactsPane) — draft
- [x] Grants · Reporting obligation (ReportingObligationPane) — draft, view→edit Cancel restores opened values
- [x] Grants · Financial entry (FinancialEntryPane) — draft
- [x] Grants · Add reporting (AddReportingModal) — draft, pane + modal variants
- [x] Risk · Log risk (LogRiskModal) — draft
- [x] Risk · Control (ControlPane) — draft, edit mode only
- [x] Risk · Log review (LogRiskReviewPane) — draft
- [x] Risk · Treatment action (EditTreatmentActionPane) — draft, edit mode only
- [x] Settings · Staff member (StaffMemberPane) — draft, inert in view mode

### Remaining record drawers
- [x] Programs · Create program (CreateProgramModal) — draft (includes a typed, un-added officer)
- [x] Programs · Create project (CreateProjectModal) — draft
- [x] Settings · Membership plan editor (MembershipPlanEditorPane) — draft
- [x] Tasks · Add task list (AddTaskListPane) — draft (includes a typed, un-added task)
- [x] Shared · Task side pane (TaskSidePane) — draft
- [x] Strategy · Level 5 task detail (TaskDetailPane) — draft
- [x] Strategy · Add/edit report period (AddReportPeriodPane) — draft
- [x] Help · Support ticket / idea forms — close + back guarded via HelpSupportPane
- [x] Strategy · Level 3, 4, 5, 7 detail panes (Level3/4/5/7DetailPane) — draft vs opened item, edit mode only; Cancel restores silently
- [x] Import wizards (ImportContactsModal, ImportMembersModal, RiskImportModal) — draft = column matching vs auto-suggested mapping; prompts only once matching has changed; silent after import runs

## Read-only views (excluded)
- n/a ViewConflictPane, ViewPersonPane, AttendanceViewPane,
  ContactViewPane, MemberViewPane, RiskDrilldownPane, SummaryGuidePane, ViewRiskReviewPane,
  CustomFieldViewPane, SubmissionDetailPane, ObligationSummaryPane, CanvasViewPane, MasterDrilldownPane,
  StrategyReportPane, MasterTaskPane — read-only
- n/a Level6DetailPane — read-only (editing hardcoded off; notes and documents read-only)
- n/a Library pickers (WorkPlanLibraryPane, WorkPlanTemplateLibraryModal, ComplianceLibraryPane,
  TemplateLibraryModal, LinkActionRegisterModal) — instant (selection applies immediately)

## Full-page editors & detail pages (Stage 4)
Mechanism: inline cards / page editors register an explicit dirty flag (useDirtyFlag; useEditMutex does it
automatically); page tabs and back links call usePageLeaveGuard().guard(action), which prompts whenever any
registered editor on screen is dirty. The browser refresh/close warning covers these pages too.
- [x] Membership · Plan editor page (MembershipPlanEditor) — draft; Back + Cancel guarded
- [x] Settings · Membership form builder (MembershipFormBuilderTab) — settings + builder + plans as one flag
- [x] Settings · Email templates (EmailTemplateEditor) — editing draft; accordion toggles guarded; pending autosave flushed on leave
- [x] Membership configuration tabs + Settings sidebar/Go Back — guarded
- [x] Detail pages: Contact, Asset, Member, Grant, Conflict — tab bar + back link guarded
- [x] Strategy register — Active/Archived tabs guarded (page has no back button of its own)
- [x] Work Plan detail — back button + All / Not Started / In Progress / Completed / On Hold / Cancelled tabs guarded

## Stage 5
- [x] Escape key — routed centrally through SlidePane + ModalOverlay; same guarded close path as X; defers to open dropdown, picker or nested dialog first
- [x] In-app navigation — app-level NavigationGuard holds same-origin link clicks + browser back; Keep Editing cancels the action (nothing left pending)

## Open
- [ ] Click-through verification pass for Stages 3, 4 and 5 — built but not yet exercised in the live app