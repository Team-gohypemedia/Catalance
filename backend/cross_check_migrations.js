import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const rows = await prisma.$queryRawUnsafe(
    `SELECT migration_name FROM "_prisma_migrations" ORDER BY migration_name ASC`
);

const applied = new Set(rows.map(r => r.migration_name));
console.log("Applied in DB:");
applied.forEach(m => console.log(" APPLIED:", m));

// All migration folders on filesystem (from find results)
const allFolders = [
    "20251113090640_add_password_hash",
    "20251128054719_add_chat_models",
    "20251128060126_add_sender_name",
    "20251208051440_add_project_progress",
    "20251208093332_add_task_fields",
    "20251217104157_add_user_status",
    "20251224064800_add_otp_fields",
    "20251224065701_add_pending_approval_status",
    "20251224071724_add_user_social_fields",
    "20251224072503_add_portfolio_projects_json",
    "20260209120000_add_service_catalog",
    "20260218170000_add_freelancer_projects_table",
    "20260219103000_add_onboarding_fields_to_projects_table",
    "20260219114000_rename_projects_table_to_ongoingprojects",
    "20260219115500_rename_project_table_to_ongoingprojects_and_restore_projects_table",
    "20260219122000_rename_ongoingprojects_to_projects_and_add_completedprojects",
    "20260219124500_revert_projects_and_completedprojects",
    "20260219130500_rename_freelancer_projects_table_to_Projects",
    "20260219133500_create_completed_project_table",
    "20260219135000_rename_completedproject_to_completedprojects",
    "20260220170000_add_marketplace_table",
    "20260220173000_add_marketplace_service_details",
    "20260224182000_marketplace_services_text_string",
    "20260224194000_marketplace_rows_per_service_string",
    "20260224211500_add_marketplace_service_key",
    "20260224214500_marketplace_web_dev_key_kebab",
    "20260224223000_normalize_web_development_key",
    "20260225120000_add_freelancer_profile_table",
    "20260225150000_move_profile_columns_to_freelancer_profile",
    "20260225190000_remove_hourly_rate_from_freelancer_profile",
    "20260225200000_add_client_profile_table",
    "20260225213000_drop_profile_table",
    "20260225220000_rename_projects_to_matchingprojects",
    "20260303153000_add_proposal_rejection_reason",
    "20260305121800_marketplace_reviews",
];

console.log("\nPENDING (in filesystem but NOT in DB):");
let pendingCount = 0;
for (const folder of allFolders) {
    if (!applied.has(folder)) {
        console.log(" PENDING:", folder);
        pendingCount++;
    }
}
if (pendingCount === 0) console.log("  (none — all up to date)");

await prisma.$disconnect();
