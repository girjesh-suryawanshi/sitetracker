import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const prisma = new PrismaClient();

// User must provide these in .env
const supabaseUrl = process.env.SUPABASE_URL;
// Try Service Role Key first (full access), then generic/Anon key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing SUPABASE_URL or SUPABASE_KEY in server/.env");
    console.error("Please add them to run the migration.");
    process.exit(1);
}

// Check if it's likely an Anon key
if (!process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_KEY) {
    console.warn("⚠️  Using SUPABASE_KEY (likely Anon Key).");
    console.warn("    If your tables have RLS (Row Level Security) enabled, you might not be able to fetch all data.");
    console.warn("    For full migration, please use the SUPABASE_SERVICE_ROLE_KEY from your Supabase Dashboard -> Project Settings -> API.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Helper to ensure profile exists
async function ensureProfile(userId: string) {
    if (!userId) return;
    const existing = await prisma.profile.findUnique({ where: { id: userId } });
    if (!existing) {
        // console.warn(`⚠️ Profile for ${userId} not found. Creating placeholder.`);
        await prisma.profile.create({
            data: {
                id: userId,
                name: 'Unknown User',
                email: `deleted_${userId}@example.com`,
                role: 'viewer',
                password: '$2a$10$PlaceholderHash', // User should change this
                createdAt: new Date(),
                updatedAt: new Date(),
            }
        });
    }
}

async function migrate() {
    console.log("🚀 Starting migration from Supabase...");

    // 1. Profiles
    console.log("Migrating Profiles...");
    const { data: profiles, error: profileError } = await supabase.from('profiles').select('*');
    if (profileError) {
        console.error("Error fetching profiles:", profileError);
    } else {
        console.log(`Found ${profiles?.length || 0} profiles.`);
        for (const p of profiles || []) {
            const existing = await prisma.profile.findUnique({ where: { id: p.id } });
            if (!existing) {
                try {
                    await prisma.profile.create({
                        data: {
                            id: p.id,
                            name: p.first_name ? `${p.first_name} ${p.last_name || ''}`.trim() : (p.full_name || 'Unknown'),
                            email: p.email || `user_${p.id}@example.com`,
                            role: p.role || 'viewer',
                            password: '$2a$10$YourDefaultHashHere', // Hash for '123456'
                            createdAt: p.created_at ? new Date(p.created_at) : new Date(),
                            updatedAt: p.updated_at ? new Date(p.updated_at) : new Date(),
                        }
                    });
                } catch (e) {
                    console.error(`Failed to create profile ${p.id}:`, e);
                }
            }
        }
    }

    // 2. Sites
    console.log("Migrating Sites...");
    const { data: sites, error: siteError } = await supabase.from('sites').select('*');
    if (siteError) console.error(siteError);
    else {
        console.log(`Found ${sites?.length || 0} sites.`);
        for (const s of sites || []) {
            const existing = await prisma.site.findUnique({ where: { id: s.id } });
            if (!existing) {
                if (s.manager_id) await ensureProfile(s.manager_id);
                try {
                    await prisma.site.create({
                        data: {
                            id: s.id,
                            site_name: s.site_name,
                            location: s.location,
                            manager_id: s.manager_id,
                            createdAt: s.created_at ? new Date(s.created_at) : new Date(),
                            updatedAt: s.updated_at ? new Date(s.updated_at) : new Date(),
                        }
                    });
                } catch (e) { console.error(`Failed to create site ${s.id}`, e); }
            }
        }
    }

    // 3. Vendors
    console.log("Migrating Vendors...");
    const { data: vendors, error: vendorError } = await supabase.from('vendors').select('*');
    if (vendorError) console.error(vendorError);
    else {
        console.log(`Found ${vendors?.length || 0} vendors.`);
        for (const v of vendors || []) {
            const existing = await prisma.vendor.findUnique({ where: { id: v.id } });
            if (!existing) {
                try {
                    await prisma.vendor.create({
                        data: {
                            id: v.id,
                            name: v.name,
                            contact: v.contact,
                            gst_number: v.gst_number,
                            createdAt: v.created_at ? new Date(v.created_at) : new Date(),
                            updatedAt: v.updated_at ? new Date(v.updated_at) : new Date(),
                        }
                    });
                } catch (e) { console.error(`Failed to create vendor ${v.id}`, e); }
            }
        }
    }

    // 4. Categories
    console.log("Migrating Categories...");
    const { data: categories, error: catError } = await supabase.from('categories').select('*');
    if (catError) console.error(catError);
    else {
        console.log(`Found ${categories?.length || 0} categories.`);
        for (const c of categories || []) {
            const existing = await prisma.category.findUnique({ where: { id: c.id } });
            if (!existing) {
                try {
                    await prisma.category.create({
                        data: {
                            id: c.id,
                            category_name: c.category_name,
                            createdAt: c.created_at ? new Date(c.created_at) : new Date(),
                        }
                    });
                } catch (e) { console.error(`Failed to create category ${c.id}`, e); }
            }
        }
    }

    // 5. Bank Accounts
    console.log("Migrating Bank Accounts...");
    const { data: accounts, error: accError } = await supabase.from('bank_accounts').select('*');
    if (accError) console.error(accError);
    else {
        console.log(`Found ${accounts?.length || 0} accounts.`);
        for (const a of accounts || []) {
            const existing = await prisma.bankAccount.findUnique({ where: { id: a.id } });
            if (!existing) {
                try {
                    await prisma.bankAccount.create({
                        data: {
                            id: a.id,
                            account_name: a.account_name,
                            account_number: a.account_number,
                            bank_name: a.bank_name,
                            ifsc_code: a.ifsc_code,
                            balance: a.balance,
                            createdAt: a.created_at ? new Date(a.created_at) : new Date(),
                            updatedAt: a.updated_at ? new Date(a.updated_at) : new Date(),
                        }
                    });
                } catch (e) { console.error(`Failed to create bank account ${a.id}`, e); }
            }
        }
    }

    // 6. Expenses
    console.log("Migrating Expenses...");
    const { data: expenses, error: expError } = await supabase.from('expenses').select('*');
    if (expError) console.error(expError);
    else {
        console.log(`Found ${expenses?.length || 0} expenses.`);
        for (const e of expenses || []) {
            const existing = await prisma.expense.findUnique({ where: { id: e.id } });
            if (!existing) {
                await ensureProfile(e.created_by);

                let bankAccountId = e.bank_account_id;
                if (bankAccountId) {
                    const bank = await prisma.bankAccount.findUnique({ where: { id: bankAccountId } });
                    if (!bank) {
                        // console.warn(`⚠️ Bank Account ${bankAccountId} not found for expense ${e.id}. Setting to null.`);
                        bankAccountId = null;
                    }
                }

                try {
                    await prisma.expense.create({
                        data: {
                            id: e.id,
                            site_id: e.site_id,
                            vendor_id: e.vendor_id,
                            category_id: e.category_id,
                            date: new Date(e.date),
                            description: e.description,
                            amount: e.amount,
                            payment_status: e.payment_status,
                            payment_method: e.payment_method,
                            created_by: e.created_by,
                            bank_account_id: bankAccountId,
                            createdAt: e.created_at ? new Date(e.created_at) : new Date(),
                            updatedAt: e.updated_at ? new Date(e.updated_at) : new Date(),
                        }
                    });
                } catch (error) { console.error(`Failed to create expense ${e.id}`, error); }
            }
        }
    }

    // 7. Credits
    console.log("Migrating Credits...");
    const { data: credits, error: credError } = await supabase.from('credits').select('*');
    if (credError) console.error(credError);
    else {
        console.log(`Found ${credits?.length || 0} credits.`);
        for (const c of credits || []) {
            const existing = await prisma.credit.findUnique({ where: { id: c.id } });
            if (!existing) {
                await ensureProfile(c.created_by);

                try {
                    await prisma.credit.create({
                        data: {
                            id: c.id,
                            date: new Date(c.date),
                            amount: c.amount,
                            payment_method: c.payment_method,
                            description: c.description,
                            category: c.category,
                            created_by: c.created_by,
                            bank_account_id: c.bank_account_id,
                            site_id: c.site_id,
                            createdAt: c.created_at ? new Date(c.created_at) : new Date(),
                            updatedAt: c.updated_at ? new Date(c.updated_at) : new Date(),
                        }
                    });
                } catch (e) { console.error(`Failed to create credit ${c.id}`, e); }
            }
        }
    }

    // 8. Fund Transfers
    console.log("Migrating Fund Transfers...");
    const { data: transfers, error: transError } = await supabase.from('fund_transfers').select('*');
    if (transError) console.error(transError);
    else {
        console.log(`Found ${transfers?.length || 0} transfers.`);
        for (const t of transfers || []) {
            const existing = await prisma.fundTransfer.findUnique({ where: { id: t.id } });
            if (!existing) {
                await ensureProfile(t.created_by);

                try {
                    await prisma.fundTransfer.create({
                        data: {
                            id: t.id,
                            from_account_id: t.from_account_id,
                            to_account_id: t.to_account_id,
                            amount: t.amount,
                            date: new Date(t.date),
                            description: t.description,
                            created_by: t.created_by,
                            createdAt: t.created_at ? new Date(t.created_at) : new Date(),
                            updatedAt: t.updated_at ? new Date(t.updated_at) : new Date(),
                        }
                    });
                } catch (e) { console.error(`Failed to create transfer ${t.id}`, e); }
            }
        }
    }

    console.log("✅ Migration completed successfully!");
}

migrate()
    .catch(async (e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
