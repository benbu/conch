// Deprecated: read receipt repository removed per simplified read model. Left intentionally empty to avoid import errors during transition.

export async function getTotalUnreadCount(): Promise<number> {
  const user = auth.currentUser;
  if (!user) return 0;

  const conversationsRef = collection(db, 'conversations');
  const q = query(conversationsRef, where('participantIds', 'array-contains', user.uid));
  const conversationsSnapshot = await getDocs(q);

  let totalUnread = 0;
  for (const conversationDoc of conversationsSnapshot.docs) {
    totalUnread += await getUnreadCount(conversationDoc.id);
  }
  return totalUnread;
}


