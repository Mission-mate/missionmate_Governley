import { createClientFromRequest, serve } from '../_shared/base44.ts';

// ─── SAMPLE DATA TEMPLATES ────────────────────────────────────────────────────

// Lookup records seeded first, so each sample grant can carry provider_id / activity_id.
const SAMPLE_PROVIDERS = [
  "Foundation for Rural & Regional Renewal",
  "State Department of Environment",
  "Department of Social Services",
];

const SAMPLE_ACTIVITIES = [
  "Small Grants Program",
  "Innovation Lifecycle",
  "Community Wellbeing Initiative",
];

function getSampleGrants(providerIds, activityIds) {
  return [
    {
      name: "Community Development Grant 2026",
      provider: "Foundation for Rural & Regional Renewal",
      provider_id: providerIds["Foundation for Rural & Regional Renewal"],
      status: "active",
      program: "Small Grants Program",
      activity_id: activityIds["Small Grants Program"],
      total_amount: 15000,
      start_date: "2026-01-01",
      end_date: "2026-12-31",
      description: "Funds to support local community infrastructure and event coordination.",
      internal_owner: "Sarah Jenkins",
    },
    {
      name: "Sustainability Innovation Fund",
      provider: "State Department of Environment",
      provider_id: providerIds["State Department of Environment"],
      status: "active",
      program: "Innovation Lifecycle",
      activity_id: activityIds["Innovation Lifecycle"],
      total_amount: 50000,
      start_date: "2026-03-01",
      end_date: "2027-06-30",
      description: "Seed funding for green technology pilot projects and sustainability initiatives.",
      internal_owner: "Marcus Tan",
    },
    {
      name: "Youth Engagement & Wellbeing Program",
      provider: "Department of Social Services",
      provider_id: providerIds["Department of Social Services"],
      status: "active",
      program: "Community Wellbeing Initiative",
      activity_id: activityIds["Community Wellbeing Initiative"],
      total_amount: 32000,
      start_date: "2026-07-01",
      end_date: "2027-06-30",
      description: "Support for youth programs focusing on mental health, sport, and social connection.",
      internal_owner: "Elena Rodriguez",
    },
  ];
}

function getSampleContacts() {
  return [
    {
      first_name: "Sarah", last_name: "Jenkins",
      type: "donor", company: "Global Giving Co",
      email: "sarah.jenkins@example.com", phone: "+61 400 111 222", status: "active",
    },
    {
      first_name: "Marcus", last_name: "Tan",
      type: "partner", company: "City Council",
      email: "marcus.tan@example.com", phone: "+61 400 333 444", status: "active",
    },
    {
      first_name: "Elena", last_name: "Rodriguez",
      type: "board_member", company: "Independent",
      email: "elena.rodriguez@example.com", status: "active",
    },
    {
      first_name: "James", last_name: "Okafor",
      type: "volunteer", company: "Community Hub",
      email: "james.okafor@example.com", status: "active",
    },
    {
      first_name: "Priya", last_name: "Nair",
      type: "stakeholder", company: "State Government",
      email: "priya.nair@example.com", status: "active",
    },
  ];
}

function getSampleReportingObligations(grant1Id, grant2Id) {
  return [
    {
      grant_id: grant1Id,
      title: "Mid-term Acquittal Report",
      reporting_type: "Acquittal",
      status: "in_progress",
      due_date: "2026-07-01",
      responsible_person: "Sarah Jenkins",
      notes: "Financial acquittal due at the mid-point of the grant period.",
    },
    {
      grant_id: grant1Id,
      title: "Final Milestone Report",
      reporting_type: "Report",
      status: "not_started",
      due_date: "2026-12-15",
      responsible_person: "Sarah Jenkins",
      notes: "Final project outcomes and expenditure report.",
    },
    {
      grant_id: grant2Id,
      title: "Year 1 Progress Report",
      reporting_type: "Report",
      status: "not_started",
      due_date: "2027-03-01",
      responsible_person: "Marcus Tan",
      notes: "Annual progress report for sustainability fund activities.",
    },
  ];
}

function getSampleNotes(grant1Id, grant2Id) {
  return [
    {
      object_type: "grant", object_id: grant1Id,
      title: "Kick-off Meeting Notes",
      content: "<p>Discussed project scope and key milestones with stakeholders. Key actions: confirm budget breakdown, schedule first community consultation by end of March.</p>",
      owner_name: "System Administrator", order_index: 0,
    },
    {
      object_type: "grant", object_id: grant2Id,
      title: "Initial Strategy Meeting",
      content: "<p>Reviewed sustainability fund requirements. Provider confirmed reporting is annual. Need to engage environmental consultant for pilot program design.</p>",
      owner_name: "System Administrator", order_index: 0,
    },
  ];
}

function getSampleDocumentFolders(grant1Id, grant2Id) {
  return [
    { object_type: "grant", object_id: grant1Id, name: "Funding Agreement", color: "blue" },
    { object_type: "grant", object_id: grant1Id, name: "Reports & Acquittals", color: "orange" },
    { object_type: "grant", object_id: grant2Id, name: "Project Plans", color: "green" },
  ];
}

// ─── HANDLER ──────────────────────────────────────────────────────────────────

serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // 1a. Create lookup records first so grants can reference them by id
    const [providers, activities] = await Promise.all([
      base44.asServiceRole.entities.GrantProvider.bulkCreate(SAMPLE_PROVIDERS.map((name) => ({ name }))),
      base44.asServiceRole.entities.GrantActivity.bulkCreate(SAMPLE_ACTIVITIES.map((name) => ({ name }))),
    ]);
    const providerIds = Object.fromEntries(providers.map((p) => [p.name, p.id]));
    const activityIds = Object.fromEntries(activities.map((a) => [a.name, a.id]));

    // 1b. Create Grants with both the cached names and the lookup ids
    const sampleGrants = getSampleGrants(providerIds, activityIds);
    const createdGrants = await Promise.all(
      sampleGrants.map((g) => base44.asServiceRole.entities.Grant.create(g))
    );
    const [grant1, grant2] = createdGrants;

    // 2. Create Contacts, Reporting Obligations and the Funding Breakdown rows.
    // Funding Breakdown is the authoritative source for Total Awarded, so every
    // seeded grant needs a row matching its total.
    await Promise.all([
      base44.asServiceRole.entities.Contact.bulkCreate(getSampleContacts()),
      base44.asServiceRole.entities.ReportingObligation.bulkCreate(getSampleReportingObligations(grant1.id, grant2.id)),
      base44.asServiceRole.entities.FinancialEntry.bulkCreate(createdGrants.map((g) => ({
        parent_type: 'grant',
        parent_id: g.id,
        type: 'funding',
        label: 'Year 1',
        amount: g.total_amount,
        amount_secondary: 0,
        status: 'scheduled',
        sort_order: 0,
      }))),
    ]);

    // 3. Create Notes and Document Folders in parallel
    await Promise.all([
      base44.asServiceRole.entities.NotePage.bulkCreate(getSampleNotes(grant1.id, grant2.id)),
      base44.asServiceRole.entities.DocumentFolder.bulkCreate(getSampleDocumentFolders(grant1.id, grant2.id)),
    ]);

    return Response.json({
      success: true,
      message: 'Sample data seeded successfully.',
      created: { grant_providers: 3, grant_activities: 3, grants: 3, contacts: 5, reporting_obligations: 3, notes: 2, document_folders: 3 }
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});