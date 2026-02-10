import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    try {
        const profiles = await prisma.profile.count();
        const sites = await prisma.site.count();
        const vendors = await prisma.vendor.count();
        const expenses = await prisma.expense.count();
        const credits = await prisma.credit.count();
        const transfers = await prisma.fundTransfer.count();
        const accounts = await prisma.bankAccount.count();

        console.log('--- Migration Verification ---');
        console.log(`Profiles: ${profiles}`);
        console.log(`Sites: ${sites}`);
        console.log(`Vendors: ${vendors}`);
        console.log(`Bank Accounts: ${accounts}`);
        console.log(`Expenses: ${expenses}`);
        console.log(`Credits: ${credits}`);
        console.log(`Fund Transfers: ${transfers}`);
        console.log('------------------------------');
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
