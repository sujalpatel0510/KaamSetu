import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { Role } from '@prisma/client';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateUserSchema = z.object({
  userId: z.string().uuid('Valid userId required'),
  isActive: z.boolean().optional(),
  role: z.enum(['WORKER', 'BUSINESS_OWNER', 'ADMIN']).optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAuth();
    if (admin.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid user update' },
        { status: 400 }
      );
    }

    const { userId, isActive, role } = parsed.data;

    // Prevent admin from deactivating self
    if (userId === admin.id && isActive === false) {
      return NextResponse.json({ error: 'Cannot deactivate your own admin account' }, { status: 400 });
    }

    const data: { isActive?: boolean; role?: Role } = {};
    if (isActive !== undefined) data.isActive = isActive;
    if (role !== undefined) data.role = role as Role;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
      },
    });

    // Notify user if account was updated
    await prisma.notification.create({
      data: {
        userId,
        title: 'Account Status Update',
        message: isActive !== undefined
          ? `Your account status has been updated to: ${isActive ? 'Active' : 'Suspended'}.`
          : `Your account role has been updated to: ${role}.`,
        type: 'SYSTEM',
      },
    }).catch(() => {});

    return NextResponse.json({
      message: 'User updated successfully',
      user: updatedUser,
    });
  } catch (err: unknown) {
    if (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as { code?: string }).code === 'P2025'
    ) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    console.error('Error updating user:', err);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
