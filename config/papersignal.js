// config/papersignal.js
const axios = require('axios');

class PapersignalClient {
  constructor() {
    this.apiKey = process.env.PAPERSIGNAL_API_KEY;
    this.baseURL = process.env.PAPERSIGNAL_API_URL || 'http://localhost:3001';

    if (!this.apiKey) {
      throw new Error('PAPERSIGNAL_API_KEY is required in environment variables');
    }

    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey
      }
    });
  }

  /**
   * Create a new chat room
   * @param {Object} params - Room parameters
   * @param {string} params.name - Room name
   * @param {string} params.type - Room type (direct, group, channel)
   * @param {Array} params.participants - Array of participant objects
   * @param {Object} params.metadata - Custom metadata
   * @returns {Promise<Object>} Created room object
   */
  async createRoom({ name, type = 'direct', participants, metadata = {} }) {
    try {
      const response = await this.client.post('/api/external-chat/rooms', {
        name,
        type,
        participants,
        metadata
      });
      return response.data;
    } catch (error) {
      console.error('Error creating Papersignal room:', error.response?.data || error.message);
      throw new Error(error.response?.data?.msg || 'Failed to create chat room');
    }
  }

  /**
   * Get all rooms or filter by user
   * @param {Object} params - Query parameters
   * @param {string} params.type - Filter by room type
   * @param {string} params.userId - Filter by participant userId
   * @param {number} params.page - Page number
   * @param {number} params.limit - Results per page
   * @returns {Promise<Object>} Rooms list with pagination
   */
  async getRooms({ type, userId, page = 1, limit = 20 } = {}) {
    try {
      const params = new URLSearchParams();
      if (type) params.append('type', type);
      if (userId) params.append('userId', userId);
      params.append('page', page);
      params.append('limit', limit);

      const response = await this.client.get(`/api/external-chat/rooms?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching Papersignal rooms:', error.response?.data || error.message);
      throw new Error(error.response?.data?.msg || 'Failed to fetch chat rooms');
    }
  }

  /**
   * Get a specific room by ID with message history
   * @param {string} roomId - Room ID
   * @param {Object} params - Query parameters
   * @param {number} params.limit - Number of messages to return
   * @param {string} params.before - Load messages before this timestamp
   * @returns {Promise<Object>} Room object with messages
   */
  async getRoom(roomId, { limit = 50, before } = {}) {
    try {
      const params = new URLSearchParams();
      params.append('limit', limit);
      if (before) params.append('before', before);

      const response = await this.client.get(`/api/external-chat/rooms/${roomId}?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching Papersignal room:', error.response?.data || error.message);
      throw new Error(error.response?.data?.msg || 'Failed to fetch chat room');
    }
  }

  /**
   * Send a message to a room
   * @param {string} roomId - Room ID
   * @param {Object} message - Message object
   * @param {string} message.userId - Sender's user ID
   * @param {string} message.userName - Sender's display name
   * @param {string} message.content - Message content
   * @param {string} message.messageType - Message type (text, image, file)
   * @param {string} message.userAvatar - URL to sender's avatar
   * @param {Object} message.metadata - Custom metadata
   * @returns {Promise<Object>} Sent message object
   */
  async sendMessage(roomId, message) {
    try {
      const response = await this.client.post(`/api/external-chat/rooms/${roomId}/messages`, message);
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error.response?.data || error.message);
      throw new Error(error.response?.data?.msg || 'Failed to send message');
    }
  }

  /**
   * Add a participant to a room
   * @param {string} roomId - Room ID
   * @param {Object} participant - Participant object
   * @param {string} participant.userId - User ID
   * @param {string} participant.userName - User display name
   * @param {string} participant.userAvatar - URL to user's avatar
   * @param {string} participant.role - User role (member, admin)
   * @returns {Promise<Object>} Updated room object
   */
  async addParticipant(roomId, participant) {
    try {
      const response = await this.client.post(`/api/external-chat/rooms/${roomId}/participants`, participant);
      return response.data;
    } catch (error) {
      console.error('Error adding participant:', error.response?.data || error.message);
      throw new Error(error.response?.data?.msg || 'Failed to add participant');
    }
  }

  /**
   * Remove a participant from a room
   * @param {string} roomId - Room ID
   * @param {string} userId - User ID to remove
   * @returns {Promise<Object>} Result object
   */
  async removeParticipant(roomId, userId) {
    try {
      const response = await this.client.delete(`/api/external-chat/rooms/${roomId}/participants/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error removing participant:', error.response?.data || error.message);
      throw new Error(error.response?.data?.msg || 'Failed to remove participant');
    }
  }

  /**
   * Delete a chat room
   * @param {string} roomId - Room ID
   * @returns {Promise<Object>} Result object
   */
  async deleteRoom(roomId) {
    try {
      const response = await this.client.delete(`/api/external-chat/rooms/${roomId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting room:', error.response?.data || error.message);
      throw new Error(error.response?.data?.msg || 'Failed to delete chat room');
    }
  }
}

// Export singleton instance
module.exports = new PapersignalClient();
