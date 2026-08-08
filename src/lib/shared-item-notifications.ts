import { prisma } from './db.ts';
import { sendTaggedMemoryEmail } from './email.ts';
import { sendPushNotification } from './push-notifications.ts';

type SharedItemType = 'memory' | 'note';

type SharedItemNotificationInput = {
  sharedItemId: string;
  sharedByUserId: string;
  sharedWithUserId: string;
  itemType: SharedItemType;
  itemId: string;
  itemTitle?: string | null;
  itemContent?: string | null;
  message?: string | null;
};

type NotificationUser = {
  id: string;
  name: string;
  email: string;
};

type SharedItemNotificationDependencies = {
  findUser: (userId: string) => Promise<NotificationUser | null>;
  sendPush: typeof sendPushNotification;
  sendMemoryEmail: typeof sendTaggedMemoryEmail;
};

const defaultDependencies: SharedItemNotificationDependencies = {
  findUser: prisma.user.findById,
  sendPush: sendPushNotification,
  sendMemoryEmail: sendTaggedMemoryEmail,
};

function preview(value: string | null | undefined, maxLength = 180) {
  const normalized = value?.replace(/\s+/g, ' ').trim() || '';
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 1)}…` : normalized;
}

export async function sendSharedItemNotification(
  input: SharedItemNotificationInput,
  dependencies: SharedItemNotificationDependencies = defaultDependencies,
) {
  const [author, recipient] = await Promise.all([
    dependencies.findUser(input.sharedByUserId),
    dependencies.findUser(input.sharedWithUserId),
  ]);
  if (!recipient) return;

  const authorName = author?.name || 'A friend';
  const fallbackBody = input.itemType === 'memory'
    ? 'Open Amika to see the memory.'
    : 'Open Amika to read the journal note.';
  const body = preview(input.message || input.itemTitle || input.itemContent) || fallbackBody;
  const data: Record<string, string | number | boolean | null> = input.itemType === 'memory'
    ? { type: 'memory_tagged', sharedItemId: input.sharedItemId, itemId: input.itemId, memoryId: input.itemId }
    : { type: 'note_shared', sharedItemId: input.sharedItemId, itemId: input.itemId, noteId: input.itemId };
  const tasks: Promise<unknown>[] = [dependencies.sendPush(
    input.sharedWithUserId,
    input.itemType === 'memory'
      ? `${authorName} added a memory with you`
      : `${authorName} shared a journal note with you`,
    body,
    data,
  )];

  if (input.itemType === 'memory' && recipient.email && input.itemContent) {
    tasks.push(dependencies.sendMemoryEmail({
      recipientEmail: recipient.email,
      recipientName: recipient.name,
      authorName,
      memoryId: input.itemId,
      memoryText: input.itemContent,
      idempotencyKey: `memory-tag-${input.itemId}-${input.sharedWithUserId}`,
    }));
  }

  const results = await Promise.allSettled(tasks);
  const failures = results.flatMap((result) => result.status === 'rejected' ? [result.reason] : []);
  if (failures.length) throw new AggregateError(failures, 'One or more shared-item notifications failed.');
}
