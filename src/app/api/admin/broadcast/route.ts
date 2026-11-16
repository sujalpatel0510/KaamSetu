import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { Role } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAuth();
    if (admin.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { targetGroup, specificUserId, title, message } = body;

    if (!title || !message || typeof title !== 'string' || typeof message !== 'string') {
      return NextResponse.json({ error: 'Title and message are required' }, { status: 400 });
    }

    const safeTitle = title.slice(0, 120);
    const safeMessage = message.slice(0, 500);

    let recipientIds: string[] = [];

    if (specificUserId) {
      recipientIds = [specificUserId];
    } else if (targetGroup === 'WORKERS') {
      const workers = await prisma.user.findMany({
        where: { role: Role.WORKER, isActive: true },
        select: { id: true },
      });
      recipientIds = workers.map((w) => w.id);
    } else if (targetGroup === 'BUSINESSES') {
      const merchants = await prisma.user.findMany({
        where: { role: Role.BUSINESS_OWNER, isActive: true },
        select: { id: true },
      });
      recipientIds = merchants.map((m) => m.id);
    } else {
      // Broadcast to all active users
      const allUsers = await prisma.user.findMany({
        where: { isActive: true },
        select: { id: true },
      });
      recipientIds = allUsers.map((u) => u.id);
    }

    if (recipientIds.length === 0) {
      return NextResponse.json({ error: 'No matching recipients found' }, { status: 404 });
    }

    const notificationsData = recipientIds.map((userId) => ({
      userId,
      title: safeTitle,
      message: safeMessage,
      type: 'BROADCAST',
      isRead: false,
    }));

    await prisma.notification.createMany({
      data: notificationsData,
    });

    return NextResponse.json({
      message: `Broadcast successfully delivered to ${recipientIds.length} users`,
      recipientCount: recipientIds.length,
    });
  } catch (err: unknown) {
    console.error('Error broadcasting notification:', err);
    return NextResponse.json({ error: 'Failed to broadcast notification' }, { status: 500 });
  }
}
