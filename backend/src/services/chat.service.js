import prisma from '../config/database.js';
import logger from '../utils/logger.js';
import TipService from './tip.service.js'; // placeholder if you implement payments

const ChatService = {
  async getOrCreateDM(creatorId, userId) {
    // try find existing DM between user and creator
    let chat = await prisma.chat.findFirst({
      where: {
        type: 'DM',
        OR: [
          { creatorId, participants: { some: { userId } } },
          { creatorId, participants: { some: { userId } } }
        ]
      },
      include: { participants: true }
    });

    if (!chat) {
      chat = await prisma.chat.create({
        data: {
          type: 'DM',
          creatorId,
          policy: (await prisma.creator.findUnique({ where: { userId: creatorId } }))?.dmPolicy || 'ANY',
          participants: { create: [{ userId }, { userId: creatorId }] }
        },
        include: { participants: true }
      });
    }
    return chat;
  },

  async handleChatMessage(userId, payload) {
    const { chatId, type, content, meta } = payload;
    const chat = await prisma.chat.findUnique({ where: { id: chatId }, include: { participants: true } });
    if (!chat) throw new Error('Chat not found');

    // if DM check policy
    if (chat.type === 'DM' && chat.creatorId) {
      const policy = chat.policy;
      if (policy === 'NONE') throw new Error('DMs are closed');
      if (policy === 'SUBSCRIBERS') {
        const isSubscriber = await this.isSubscriber(userId, chat.creatorId);
        if (!isSubscriber) throw new Error('Only subscribers can DM');
      }
      if (policy === 'TIPPERS') {
        const hasTipped = await this.hasEverTipped(userId, chat.creatorId);
        if (!hasTipped) throw new Error('Only tippers can DM');
      }
    }

    // persist message
    const saved = await prisma.message.create({
      data: {
        chatId,
        fromUserId: userId,
        type: type?.toUpperCase() || 'TEXT',
        content,
        meta: meta || null
      }
    });

    return saved;
  },

  async handleLiveMessage(userId, payload) {
    // payload: { liveId, type, content, meta }
    const { liveId, type, content, meta } = payload;
    const live = await prisma.live.findUnique({ where: { id: liveId } });
    if (!live) throw new Error('Live not found');

    // enforce live config: mode / slow mode / tippers-only etc.
    const cfg = live.config || {};
    // example check: mode premium-only
    if (cfg.mode === 'premium-only') {
      const isSubscriber = await this.isSubscriber(userId, live.creatorId);
      if (!isSubscriber) throw new Error('Only premium subscribers can chat');
    }
    // TODO: implement slow-mode checks (store last message timestamps)
    const saved = await prisma.message.create({
      data: {
        chatId: '', // live chats use special chat id convention, but store liveId in meta
        fromUserId: userId,
        type: type?.toUpperCase() || 'TEXT',
        content,
        meta: { ...(meta || {}), liveId }
      }
    });
    return saved;
  },

  async handleTip(userId, payload) {
    // payload: { liveId, amount, content }
    const { liveId, amount, content } = payload;
    const live = await prisma.live.findUnique({ where: { id: liveId } });
    if (!live) throw new Error('Live not found');

    // process payment here (omitted) -> use TipService
    const tip = await TipService.createTip({
      fromUserId: userId,
      toCreatorId: live.creatorId,
      amount,
      meta: { liveId }
    });

    // create message with highlight
    const now = new Date();
    const durationSeconds = Math.min(60, Math.max(5, Math.floor(amount))); // example: seconds proportional to amount
    const highlightUntil = new Date(now.getTime() + durationSeconds * 1000);

    const msg = await prisma.message.create({
      data: {
        chatId: '', // live chat messages can have empty chatId and carry liveId in meta
        fromUserId: userId,
        type: 'TIP',
        content,
        amount,
        isHighlighted: true,
        highlightUntil,
        meta: { liveId, creatorId: live.creatorId }
      }
    });

    return msg;
  },

  // stubbed helper functions - integrate with your subscription & tips DB
  async isSubscriber(userId, creatorId) {
    // implement real check
    const sub = await prisma.subscription.findFirst({ where: { userId, creatorId, status: 'ACTIVE' } }).catch(()=>null);
    return !!sub;
  },

  async hasEverTipped(userId, creatorId) {
    const t = await prisma.tip.findFirst({ where: { fromUserId: userId, toCreatorId: creatorId } }).catch(()=>null);
    return !!t;
  }
};

export default ChatService;