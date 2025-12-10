/**
 * Message Service
 * Handles all message-related API calls for the chat system
 * Supports both regular and paid messages with media uploads
 */

import api from './api';

const MESSAGE_ENDPOINTS = {
  CONVERSATIONS: '/messages/conversations',
  MESSAGES: '/messages',
  SEND: '/messages/send',
  SEND_PAID: '/messages/send-paid',
  UPLOAD_MEDIA: '/messages/upload',
  MARK_READ: '/messages/mark-read',
};

/**
 * Get all conversations for the current user
 * @returns {Promise<Array>} List of conversations with last message and unread count
 */
export const getConversations = async () => {
  try {
    const response = await api.get(MESSAGE_ENDPOINTS.CONVERSATIONS);
    return response.data;
  } catch (error) {
    console.error('Error fetching conversations:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch conversations');
  }
};

/**
 * Get all messages in a conversation
 * @param {string} conversationId - The conversation ID
 * @param {number} page - Page number for pagination (default: 1)
 * @param {number} limit - Number of messages per page (default: 50)
 * @returns {Promise<Object>} Messages with pagination info
 */
export const getMessages = async (conversationId, page = 1, limit = 50) => {
  try {
    const response = await api.get(`${MESSAGE_ENDPOINTS.MESSAGES}/${conversationId}`, {
      params: { page, limit }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch messages');
  }
};

/**
 * Send a regular message
 * @param {string} recipientId - The recipient's user ID
 * @param {string} content - Message content
 * @param {Array<string>} mediaUrls - Optional array of media URLs
 * @returns {Promise<Object>} Sent message object
 */
export const sendMessage = async (recipientId, content, mediaUrls = []) => {
  try {
    const response = await api.post(MESSAGE_ENDPOINTS.SEND, {
      recipientId,
      content,
      mediaUrls
    });
    return response.data;
  } catch (error) {
    console.error('Error sending message:', error);
    throw new Error(error.response?.data?.message || 'Failed to send message');
  }
};

/**
 * Send a paid message (creator to subscriber)
 * @param {string} recipientId - The recipient's user ID
 * @param {string} content - Message content
 * @param {number} price - Price for unlocking the message
 * @param {string} currency - Currency type (USD, EUR, BTC, ETH, etc.)
 * @param {Array<string>} mediaUrls - Optional array of media URLs
 * @returns {Promise<Object>} Sent paid message object
 */
export const sendPaidMessage = async (recipientId, content, price, currency, mediaUrls = []) => {
  try {
    const response = await api.post(MESSAGE_ENDPOINTS.SEND_PAID, {
      recipientId,
      content,
      price,
      currency,
      mediaUrls
    });
    return response.data;
  } catch (error) {
    console.error('Error sending paid message:', error);
    throw new Error(error.response?.data?.message || 'Failed to send paid message');
  }
};

/**
 * Upload media files for messages
 * @param {File|Array<File>} files - Single file or array of files to upload
 * @param {Function} onProgress - Optional callback for upload progress
 * @returns {Promise<Array<string>>} Array of uploaded media URLs
 */
export const uploadMedia = async (files, onProgress) => {
  try {
    const formData = new FormData();
    const fileArray = Array.isArray(files) ? files : [files];
    
    fileArray.forEach((file, index) => {
      formData.append(`media`, file);
    });

    const response = await api.post(MESSAGE_ENDPOINTS.UPLOAD_MEDIA, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    });

    return response.data.urls || [];
  } catch (error) {
    console.error('Error uploading media:', error);
    throw new Error(error.response?.data?.message || 'Failed to upload media');
  }
};

/**
 * Mark messages as read in a conversation
 * @param {string} conversationId - The conversation ID
 * @returns {Promise<Object>} Updated conversation object
 */
export const markAsRead = async (conversationId) => {
  try {
    const response = await api.post(MESSAGE_ENDPOINTS.MARK_READ, {
      conversationId
    });
    return response.data;
  } catch (error) {
    console.error('Error marking messages as read:', error);
    throw new Error(error.response?.data?.message || 'Failed to mark messages as read');
  }
};

/**
 * Unlock a paid message
 * @param {string} messageId - The message ID to unlock
 * @param {string} paymentMethod - Payment method (card, crypto, etc.)
 * @param {Object} paymentDetails - Payment details specific to the method
 * @returns {Promise<Object>} Unlocked message object
 */
export const unlockPaidMessage = async (messageId, paymentMethod, paymentDetails) => {
  try {
    const response = await api.post(`${MESSAGE_ENDPOINTS.MESSAGES}/${messageId}/unlock`, {
      paymentMethod,
      paymentDetails
    });
    return response.data;
  } catch (error) {
    console.error('Error unlocking paid message:', error);
    throw new Error(error.response?.data?.message || 'Failed to unlock message');
  }
};

/**
 * Delete a message
 * @param {string} messageId - The message ID to delete
 * @returns {Promise<Object>} Deletion confirmation
 */
export const deleteMessage = async (messageId) => {
  try {
    const response = await api.delete(`${MESSAGE_ENDPOINTS.MESSAGES}/${messageId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting message:', error);
    throw new Error(error.response?.data?.message || 'Failed to delete message');
  }
};

/**
 * Search messages in a conversation
 * @param {string} conversationId - The conversation ID
 * @param {string} query - Search query
 * @returns {Promise<Array>} Matching messages
 */
export const searchMessages = async (conversationId, query) => {
  try {
    const response = await api.get(`${MESSAGE_ENDPOINTS.MESSAGES}/${conversationId}/search`, {
      params: { q: query }
    });
    return response.data;
  } catch (error) {
    console.error('Error searching messages:', error);
    throw new Error(error.response?.data?.message || 'Failed to search messages');
  }
};

export default {
  getConversations,
  getMessages,
  sendMessage,
  sendPaidMessage,
  uploadMedia,
  markAsRead,
  unlockPaidMessage,
  deleteMessage,
  searchMessages,
};
