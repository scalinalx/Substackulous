export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  context?: string;
}

export const MAX_CONTEXT_LENGTH = 8192; // Groq's context window

export function manageContextHistory(messages: ChatMessage[]): ChatMessage[] {
  let tokenCount = 0;
  const reversedMessages = [...messages].reverse();
  
  return reversedMessages.filter(msg => {
    tokenCount += msg.content.split(/\s+/).length;
    return tokenCount <= MAX_CONTEXT_LENGTH;
  }).reverse();
} 
