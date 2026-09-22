import type { Conversation } from "./types"

export type ConversationRole = "teacher" | "student" | "parent"

export function unreadForRole(conversation: Conversation, role: ConversationRole) {
  const stored = conversation.unreadByRole?.[role]
  if (stored !== undefined) return stored
  if (role !== "teacher") return 0
  // Older browser snapshots stored one shared count; a teacher reply already
  // visible at the end of a thread must not be presented as an unread reply.
  let trailingIncoming = 0
  for (let index = conversation.messages.length - 1; index >= 0; index--) {
    if (conversation.messages[index].senderRole === "teacher") break
    trailingIncoming++
  }
  return Math.min(conversation.unreadCount, trailingIncoming)
}

export function orderConversations(conversations: readonly Conversation[]) {
  return [...conversations].sort((left, right) => {
    const leftTime = Date.parse(left.messages.at(-1)?.sentAt ?? "") || 0
    const rightTime = Date.parse(right.messages.at(-1)?.sentAt ?? "") || 0
    return rightTime - leftTime || left.id.localeCompare(right.id)
  })
}
