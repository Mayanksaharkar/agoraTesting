import type { ChatMessage, Conversation } from '@/types/chat';

export function cacheConversation(id: string, conv: Conversation, messages: ChatMessage[] = []): void {}
export function getCachedConversation(id: string): Conversation | null { return null; }
export function cacheMessages(id: string, messages: ChatMessage[]): void {}
export function getCachedMessages(id: string): ChatMessage[] | null { return null; }
export function addPendingMessage(tempId: string, convId: string, content: string, attachments?: File[]): void {}
export function getPendingMessages(): any[] { return []; }
export function removePendingMessage(tempId: string): void {}
export function incrementPendingMessageRetry(tempId: string): void {}
export function clearPendingMessages(): void {}
export function clearCache(): void {}
export function cleanupExpiredCache(): void {}
export function getAllCachedConversations(): Conversation[] { return []; }
export function updateCachedConversation(id: string, updates: Partial<Conversation>): void {}
export function addMessageToCache(id: string, message: ChatMessage): void {}
export function updateCachedMessage(id: string, msgId: string, updates: Partial<ChatMessage>): void { }
export function mergeCachedMessages(id: string, fresh: ChatMessage[]): ChatMessage[] { return fresh; }
