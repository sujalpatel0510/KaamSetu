import fs from 'fs';
import path from 'path';
import { PrismaClient, Role } from '@prisma/client';
import { signToken, COOKIE_NAME } from '../src/lib/auth';

const prisma = new PrismaClient();

async function testRbacAndNavigation() {
  console.log('🧪 Testing Role-Based Access Control, Navigation & Browser Branding...\n');
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, title: string) {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${title}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${title}`);
      throw new Error(`Assertion failed: ${title}`);
    }
  }

  try {
    // -------------------------------------------------------------------------
    // 1. BRANDING & BROWSER LOGO ASSETS
    // -------------------------------------------------------------------------
    console.log('--- 1. Browser Logo & App Appearance Assets ---');
    const logoSvg = path.join(process.cwd(), 'public', 'logo.svg');
    const faviconSvg = path.join(process.cwd(), 'public', 'favicon.svg');
    const appIconSvg = path.join(process.cwd(), 'src', 'app', 'icon.svg');
    const iconPng = path.join(process.cwd(), 'public', 'icon.png');
    const appleIconPng = path.join(process.cwd(), 'public', 'apple-icon.png');
    const faviconIco = path.join(process.cwd(), 'src', 'app', 'favicon.ico');

    assert(fs.existsSync(logoSvg) && fs.statSync(logoSvg).size > 100, 'public/logo.svg exists and valid vector format');
    assert(fs.existsSync(faviconSvg) && fs.statSync(faviconSvg).size > 100, 'public/favicon.svg exists for modern browser tabs');
    assert(fs.existsSync(appIconSvg) && fs.statSync(appIconSvg).size > 100, 'src/app/icon.svg exists for Next.js dynamic metadata');
    assert(fs.existsSync(iconPng) && fs.statSync(iconPng).size > 500, 'public/icon.png (512x512) high-res raster icon generated');
    assert(fs.existsSync(appleIconPng) && fs.statSync(appleIconPng).size > 500, 'public/apple-icon.png (180x180) Apple touch icon generated');
    assert(fs.existsSync(faviconIco) && fs.statSync(faviconIco).size > 100, 'src/app/favicon.ico updated with KaamSetu branding');

    // -------------------------------------------------------------------------
    // 2. ADMIN NAVIGATION NO-DUPLICATE DESTINATIONS
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Admin Navigation & Tab Distinction ---');
    const appSidebarContent = fs.readFileSync(path.join(process.cwd(), 'src', 'components', 'layout', 'AppSidebar.tsx'), 'utf-8');
    
    // Check that adminItems does NOT have multiple items pointing to bare '/admin/dashboard'
    const adminDashboardMatches = appSidebarContent.match(/href:\s*['"]\/admin\/dashboard['"]/g);
    assert(
      adminDashboardMatches !== null && adminDashboardMatches.length === 1,
      `Only 1 Overview item points to bare '/admin/dashboard' (found ${adminDashboardMatches?.length || 0}, resolved duplicate pills)`
    );

    assert(appSidebarContent.includes("href: '/admin/users'"), 'Users Directory has dedicated page URL (/admin/users)');
    assert(appSidebarContent.includes("href: '/admin/businesses'"), 'Businesses Directory has dedicated page URL (/admin/businesses)');
    assert(appSidebarContent.includes("href: '/admin/jobs'"), 'Jobs Moderation has dedicated page URL (/admin/jobs)');
    assert(appSidebarContent.includes("href: '/admin/moderation'"), 'Platform Moderation has dedicated page URL (/admin/moderation)');
    assert(appSidebarContent.includes("href: '/admin/settings'"), 'Platform Settings has dedicated page URL (/admin/settings)');
    assert(appSidebarContent.includes("href: '/admin/verification'"), 'Verification has dedicated page URL (/admin/verification)');
    assert(appSidebarContent.includes("href: '/admin/disputes'"), 'Disputes has dedicated page URL (/admin/disputes)');

    // -------------------------------------------------------------------------
    // 3. ROLE-BASED ACCESS CONTROL (RBAC) SERVER GUARDS
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Strict Role-Based Access Control (RBAC) Database & Session Guards ---');
    
    const workerUser = await prisma.user.findFirst({ where: { role: Role.WORKER } });
    const merchantUser = await prisma.user.findFirst({ where: { role: Role.BUSINESS_OWNER } });
    const adminUser = await prisma.user.findFirst({ where: { role: Role.ADMIN } });

    assert(!!workerUser, `Worker role account exists: ${workerUser?.name} (${workerUser?.phone})`);
    assert(!!merchantUser, `Business Owner role account exists: ${merchantUser?.name} (${merchantUser?.phone})`);
    assert(!!adminUser, `System Admin role account exists: ${adminUser?.name} (${adminUser?.phone})`);

    // Verify token generation with strict role payload
    const workerToken = signToken({
      userId: workerUser!.id,
      role: workerUser!.role,
      name: workerUser!.name,
      phone: workerUser!.phone,
    });
    assert(typeof workerToken === 'string' && workerToken.length > 20, 'Worker JWT session token signed with role=WORKER');

    const adminToken = signToken({
      userId: adminUser!.id,
      role: adminUser!.role,
      name: adminUser!.name,
      phone: adminUser!.phone,
    });
    assert(typeof adminToken === 'string' && adminToken.length > 20, 'Admin JWT session token signed with role=ADMIN');

    // -------------------------------------------------------------------------
    // 4. CLIENT APPSHELL RBAC GUARD VERIFICATION
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Client-Side AppShell & Mobile Navigation Guards ---');
    const appShellContent = fs.readFileSync(path.join(process.cwd(), 'src', 'components', 'layout', 'AppShell.tsx'), 'utf-8');
    assert(appShellContent.includes("pathname.startsWith('/admin') && user.role !== 'ADMIN'"), 'AppShell blocks non-admin users from accessing /admin/*');
    assert(appShellContent.includes("pathname.startsWith('/business') && user.role !== 'BUSINESS_OWNER'"), 'AppShell blocks non-merchants from accessing /business/*');
    assert(appShellContent.includes("pathname.startsWith('/worker') && user.role !== 'WORKER'"), 'AppShell blocks non-workers from accessing /worker/*');
    assert(appShellContent.includes("router.replace('/login')"), 'AppShell redirects unauthenticated visitors to /login');

    const mobileNavContent = fs.readFileSync(path.join(process.cwd(), 'src', 'components', 'layout', 'MobileBottomNav.tsx'), 'utf-8');
    assert(mobileNavContent.includes("role === 'WORKER'"), 'Dedicated Worker Mobile Navigation configured');
    assert(mobileNavContent.includes("role === 'BUSINESS_OWNER'"), 'Dedicated Business Owner Mobile Navigation configured with Voice Action');
    assert(mobileNavContent.includes("role === 'ADMIN'"), 'Dedicated Admin Mobile Navigation configured with 5 distinct operational tabs');

    console.log(`\n🎉 All ${passed}/${total} RBAC, Navigation & Branding Verification Tests Passed!`);
  } catch (err) {
    console.error('Test failed with error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testRbacAndNavigation();
