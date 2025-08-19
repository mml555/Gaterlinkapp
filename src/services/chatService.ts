export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  read: boolean;
  type: 'text' | 'image' | 'file';
  metadata?: any;
}

export interface Conversation {
  id: string;
  participants: string[];
  participantNames: string[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

class ChatService {
  private conversations: Conversation[] = [
    {
      id: '1',
      participants: ['user1', 'admin1'],
      participantNames: ['John Doe', 'Admin'],
      unreadCount: 1,
      createdAt: new Date(Date.now() - 86400000),
      updatedAt: new Date(Date.now() - 120000),
    },
    {
      id: '2',
      participants: ['user2', 'admin1'],
      participantNames: ['Jane Smith', 'Admin'],
      unreadCount: 0,
      createdAt: new Date(Date.now() - 172800000),
      updatedAt: new Date(Date.now() - 3600000),
    },
    {
      id: '3',
      participants: ['user3', 'admin1'],
      participantNames: ['Mike Johnson', 'Admin'],
      unreadCount: 2,
      createdAt: new Date(Date.now() - 259200000),
      updatedAt: new Date(Date.now() - 10800000),
    },
  ];

  private messages: Message[] = [
    {
      id: '1',
      conversationId: '1',
      senderId: 'user1',
      senderName: 'John Doe',
      content: 'Can you unlock the front door?',
      timestamp: new Date(Date.now() - 120000),
      read: false,
      type: 'text',
    },
    {
      id: '2',
      conversationId: '1',
      senderId: 'admin1',
      senderName: 'Admin',
      content: 'Sure, I\'ll unlock it now.',
      timestamp: new Date(Date.now() - 60000),
      read: true,
      type: 'text',
    },
    {
      id: '3',
      conversationId: '1',
      senderId: 'user1',
      senderName: 'John Doe',
      content: 'Thanks!',
      timestamp: new Date(Date.now() - 30000),
      read: true,
      type: 'text',
    },
    {
      id: '4',
      conversationId: '2',
      senderId: 'user2',
      senderName: 'Jane Smith',
      content: 'Thanks for the access!',
      timestamp: new Date(Date.now() - 3600000),
      read: true,
      type: 'text',
    },
    {
      id: '5',
      conversationId: '3',
      senderId: 'user3',
      senderName: 'Mike Johnson',
      content: 'When will the maintenance be done?',
      timestamp: new Date(Date.now() - 10800000),
      read: false,
      type: 'text',
    },
  ];

  async getConversations(userId: string): Promise<Conversation[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return this.conversations
      .filter(conv => conv.participants.includes(userId))
      .map(conv => ({
        ...conv,
        lastMessage: this.messages
          .filter(msg => msg.conversationId === conv.id)
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0],
      }))
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async getMessages(conversationId: string, limit: number = 50): Promise<Message[]> {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    return this.messages
      .filter(msg => msg.conversationId === conversationId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async sendMessage(
    conversationId: string,
    senderId: string,
    senderName: string,
    content: string,
    type: 'text' | 'image' | 'file' = 'text',
    metadata?: any
  ): Promise<Message> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const message: Message = {
      id: Date.now().toString(),
      conversationId,
      senderId,
      senderName,
      content,
      timestamp: new Date(),
      read: false,
      type,
      metadata,
    };
    
    this.messages.push(message);
    
    // Update conversation
    const conversationIndex = this.conversations.findIndex(conv => conv.id === conversationId);
    if (conversationIndex !== -1) {
      this.conversations[conversationIndex].updatedAt = new Date();
      if (senderId !== 'admin1') {
        this.conversations[conversationIndex].unreadCount++;
      }
    }
    
    return message;
  }

  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    this.messages.forEach(msg => {
      if (msg.conversationId === conversationId && msg.senderId !== userId && !msg.read) {
        msg.read = true;
      }
    });
    
    // Reset unread count
    const conversationIndex = this.conversations.findIndex(conv => conv.id === conversationId);
    if (conversationIndex !== -1) {
      this.conversations[conversationIndex].unreadCount = 0;
    }
  }

  async createConversation(participants: string[], participantNames: string[]): Promise<Conversation> {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const conversation: Conversation = {
      id: Date.now().toString(),
      participants,
      participantNames,
      unreadCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.conversations.push(conversation);
    return conversation;
  }

  async getConversationById(id: string): Promise<Conversation | null> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return this.conversations.find(conv => conv.id === id) || null;
  }

  async deleteConversation(id: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const conversationIndex = this.conversations.findIndex(conv => conv.id === id);
    if (conversationIndex !== -1) {
      this.conversations.splice(conversationIndex, 1);
      
      // Remove associated messages
      this.messages = this.messages.filter(msg => msg.conversationId !== id);
      return true;
    }
    return false;
  }

  async getUnreadCount(userId: string): Promise<number> {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return this.conversations
      .filter(conv => conv.participants.includes(userId))
      .reduce((total, conv) => total + conv.unreadCount, 0);
  }
}

export const chatService = new ChatService();
