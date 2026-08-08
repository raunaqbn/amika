import { prisma } from './db.ts';

export async function respondToSharedItem({
  id,
  userId,
  status,
}: {
  id: string;
  userId: string;
  status: 'accepted' | 'rejected';
}) {
  const receivedItems = await prisma.sharedItem.findMany({
    userId,
    type: 'received',
  });
  const sharedItemDetails = receivedItems.find((item: { id: string }) => item.id === id);

  const sharedItem = await prisma.sharedItem.update({ id, userId, status });

  // Shared memories stay attributed to their original author in the timeline.
  // Notes retain the existing behavior of creating a private recipient copy.
  if (status === 'accepted' && sharedItemDetails?.itemType === 'note') {
    try {
      const friends = await prisma.friend.findMany({ userId });
      const sharerFriend = friends.find(
        (friend: { linkedUserId: string | null }) => friend.linkedUserId === sharedItemDetails.sharedByUserId,
      );

      if (sharerFriend && sharedItemDetails.item?.content) {
        await prisma.diaryNote.create({
          data: {
            userId,
            title: sharedItemDetails.item.title || null,
            content: sharedItemDetails.item.content,
            analysis: null,
            imageUrl: sharedItemDetails.item.imageUrl || null,
            friendIds: [sharerFriend.id],
            friendTags: [{ friendId: sharerFriend.id, sharedWithFriend: true }],
          },
        });
      }
    } catch (copyError) {
      console.error('Error copying shared note to recipient:', copyError);
      // Don't fail the acceptance if the optional note copy fails.
    }
  }

  return sharedItem;
}
