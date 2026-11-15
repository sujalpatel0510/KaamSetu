import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        preferredLanguage: user.preferredLanguage,
        workerProfile: user.workerProfile,
        business: user.businesses?.[0] || null,
        businesses: user.businesses,
      },
    });
  } catch (err: unknown) {
    console.error('Error fetching current user:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
