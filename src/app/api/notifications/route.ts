import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { Prisma, Role } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter') || 'all';
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const where: Prisma.NotificationWhereInput = {
      userId: user.id, // Strictly scoped to current authenticated user
    };

    if (filter === 'unread') {
      where.isRead = false;
    } else if (filter === 'jobs') {
      where.type = {
        in: ['JOB_APPLICATION', 'APPLICATION_ACCEPTED', 'APPLICATION_STATUS_UPDATE', 'JOB_MATCH'],
      };
    } else if (filter === 'shop') {
      where.type = {
        in: ['INVENTORY_LOW', 'SALE_COMPLETED', 'CREDIT_REMINDER', 'UDHAAR_OVERDUE'],
      };
    } else if (filter === 'system') {
      where.type = {
        in: ['SYSTEM', 'WELCOME', 'BROADCAST', 'ACCOUNT_VERIFIED'],
      };
    }

    const [notifications, unreadCount, totalCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: Math.min(limit, 100),
      }),
      prisma.notification.count({
        where: { userId: user.id, isRead: false },
      }),
      prisma.notification.count({
        where: { userId: user.id },
      }),
    ]);

    return NextResponse.json({
      notifications,
      unreadCount,
      totalCount,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err: unknown) {
    console.error('Error fetching notifications:', err);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const { notificationId, markAllRead, isRead = true } = body;

    if (markAllRead) {
      const result = await prisma.notification.updateMany({
        where: { userId: user.id, isRead: false },
        data: { isRead: true },
      });
      return NextResponse.json({
        message: 'All notifications marked as read',
        updatedCount: result.count,
      });
    }

    if (notificationId) {
      const updated = await prisma.notification.update({
        where: { id: notificationId, userId: user.id },
        data: { isRead: Boolean(isRead) },
      });
      return NextResponse.json({
        message: isRead ? 'Notification marked as read' : 'Notification marked as unread',
        notification: updated,
      });
    }

    return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 });
  } catch (err: unknown) {
    console.error('Error updating notifications:', err);
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const notificationId = searchParams.get('id');
    const clearRead = searchParams.get('clearRead') === 'true';
    const clearAll = searchParams.get('clearAll') === 'true';

    if (notificationId) {
      await prisma.notification.delete({
        where: { id: notificationId, userId: user.id },
      });
      return NextResponse.json({ message: 'Notification deleted successfully' });
    }

    if (clearRead) {
      const result = await prisma.notification.deleteMany({
        where: { userId: user.id, isRead: true },
      });
      return NextResponse.json({
        message: 'All read notifications cleared',
        deletedCount: result.count,
      });
    }

    if (clearAll) {
      const result = await prisma.notification.deleteMany({
        where: { userId: user.id },
      });
      return NextResponse.json({
        message: 'All notifications cleared',
        deletedCount: result.count,
      });
    }

    return NextResponse.json({ error: 'Missing notificationId or clear parameter' }, { status: 400 });
  } catch (err: unknown) {
    console.error('Error deleting notification:', err);
    return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const { targetUserId, title, message, type = 'SYSTEM', relatedEntityId } = body;

    if (!title || !message || typeof title !== 'string' || typeof message !== 'string') {
      return NextResponse.json({ error: 'Title and message are required' }, { status: 400 });
    }

    // Only Admins can send arbitrary notifications to other users
    if (targetUserId && targetUserId !== user.id && user.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Admin permission required' }, { status: 403 });
    }

    const recipientId = targetUserId || user.id;

    const notif = await prisma.notification.create({
      data: {
        userId: recipientId,
        title: title.slice(0, 120),
        message: message.slice(0, 500),
        type: String(type).slice(0, 40),
        relatedEntityId,
        isRead: false,
      },
    });

    return NextResponse.json({ message: 'Notification created', notification: notif }, { status: 201 });
  } catch (err: unknown) {
    console.error('Error creating notification:', err);
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
  }
}
