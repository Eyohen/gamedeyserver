// controllers/ChatController.js
const { Conversation, Booking, User, Coach, Facility } = require('../models');
const ResponseUtil = require('../utils/response');
const papersignalClient = require('../config/papersignal');
const { Op } = require('sequelize');

class ChatController {
  /**
   * Create a conversation for a confirmed booking
   * This is automatically called when a booking is confirmed
   * Creates separate conversations for coach and facility
   */
  static async createConversationForBooking(bookingId) {
    try {
      const results = { coach: null, facility: null };

      // Check if conversations already exist
      const existingConversations = await Conversation.findAll({
        where: { bookingId }
      });

      if (existingConversations.length > 0) {
        // Return existing conversations categorized by type
        existingConversations.forEach(conv => {
          if (conv.conversationType.includes('coach')) {
            results.coach = conv;
          }
          if (conv.conversationType.includes('facility')) {
            results.facility = conv;
          }
        });
        return results;
      }

      // Get booking with related data
      const booking = await Booking.findByPk(bookingId, {
        include: [
          {
            model: User,
            as: 'User',
            attributes: ['id', 'firstName', 'lastName', 'email', 'profileImage']
          },
          {
            model: Coach,
            as: 'Coach',
            attributes: ['id', 'profileImage'],
            include: [{
              model: User,
              as: 'User',
              attributes: ['id', 'firstName', 'lastName', 'email', 'profileImage']
            }],
            required: false
          },
          {
            model: Facility,
            as: 'Facility',
            attributes: ['id', 'name', 'images'],
            required: false
          }
        ]
      });

      if (!booking) {
        throw new Error('Booking not found');
      }

      // Create conversation for coach if exists
      if (booking.Coach) {
        const coachParticipants = [
          {
            userId: booking.User.id,
            userName: `${booking.User.firstName} ${booking.User.lastName}`.trim(),
            userAvatar: booking.User.profileImage || null,
            role: 'member',
            userType: 'user'
          },
          {
            userId: booking.Coach.id,
            userName: `${booking.Coach.User.firstName} ${booking.Coach.User.lastName}`.trim(),
            userAvatar: booking.Coach.User.profileImage || null,
            role: 'member',
            userType: 'coach'
          }
        ];

        const coachRoom = await papersignalClient.createRoom({
          name: `Chat with Coach ${booking.Coach.User.firstName}`,
          type: 'direct',
          participants: coachParticipants.map(p => ({
            userId: p.userId,
            userName: p.userName,
            userAvatar: p.userAvatar
          })),
          metadata: {
            bookingId: booking.id,
            chatWith: 'coach',
            startTime: booking.startTime,
            endTime: booking.endTime,
            platform: 'gamedey'
          }
        });

        results.coach = await Conversation.create({
          bookingId: booking.id,
          papersignalRoomId: coachRoom.room.id,
          conversationType: 'user_coach',
          userId: booking.userId,
          coachId: booking.coachId,
          facilityId: null,
          participants: coachParticipants,
          status: 'active',
          metadata: {
            chatWith: 'coach',
            startTime: booking.startTime,
            endTime: booking.endTime
          }
        });
      }

      // Create conversation for facility if exists
      if (booking.Facility) {
        const facilityParticipants = [
          {
            userId: booking.User.id,
            userName: `${booking.User.firstName} ${booking.User.lastName}`.trim(),
            userAvatar: booking.User.profileImage || null,
            role: 'member',
            userType: 'user'
          },
          {
            userId: booking.Facility.id,
            userName: booking.Facility.name,
            userAvatar: booking.Facility.images?.[0] || null,
            role: 'member',
            userType: 'facility'
          }
        ];

        const facilityRoom = await papersignalClient.createRoom({
          name: `Chat with ${booking.Facility.name}`,
          type: 'direct',
          participants: facilityParticipants.map(p => ({
            userId: p.userId,
            userName: p.userName,
            userAvatar: p.userAvatar
          })),
          metadata: {
            bookingId: booking.id,
            chatWith: 'facility',
            startTime: booking.startTime,
            endTime: booking.endTime,
            platform: 'gamedey'
          }
        });

        results.facility = await Conversation.create({
          bookingId: booking.id,
          papersignalRoomId: facilityRoom.room.id,
          conversationType: 'user_facility',
          userId: booking.userId,
          coachId: null,
          facilityId: booking.facilityId,
          participants: facilityParticipants,
          status: 'active',
          metadata: {
            chatWith: 'facility',
            startTime: booking.startTime,
            endTime: booking.endTime
          }
        });
      }

      return results;
    } catch (error) {
      console.error('Error creating conversation for booking:', error);
      throw error;
    }
  }

  /**
   * Get all conversations for the authenticated user
   */
  static async getMyConversations(req, res) {
    try {
      const userId = req.user.id;
      const { status = 'active', page = 1, limit = 20 } = req.query;

      // Determine user role
      const { role: userRole, entityId } = await ChatController.getUserRole(userId);

      let whereClause = { status };

      // Build where clause based on user role
      if (userRole === 'user') {
        whereClause.userId = entityId;
      } else if (userRole === 'coach') {
        whereClause.coachId = entityId;
      } else if (userRole === 'facility') {
        whereClause.facilityId = entityId;
      }

      const offset = (parseInt(page) - 1) * parseInt(limit);

      // Get conversations with related data
      const { count, rows: conversations } = await Conversation.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Booking,
            as: 'booking',
            attributes: ['id', 'bookingType', 'startTime', 'endTime', 'status']
          },
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'profileImage']
          },
          {
            model: Coach,
            as: 'coach',
            attributes: ['id', 'profileImage'],
            include: [{
              model: User,
              as: 'User',
              attributes: ['id', 'firstName', 'lastName', 'profileImage']
            }],
            required: false
          },
          {
            model: Facility,
            as: 'facility',
            attributes: ['id', 'name', 'images'],
            required: false
          }
        ],
        order: [['lastMessageAt', 'DESC NULLS LAST'], ['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset
      });

      return ResponseUtil.success(res, {
        conversations,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / parseInt(limit))
        }
      }, 'Conversations retrieved successfully');
    } catch (error) {
      console.error('Error getting conversations:', error);
      return ResponseUtil.error(res, 'Failed to retrieve conversations', 500);
    }
  }

  /**
   * Get a specific conversation with messages
   */
  static async getConversation(req, res) {
    try {
      const { conversationId } = req.params;
      const userId = req.user.id;
      const { limit = 50, before } = req.query;

      // Determine user role
      const { role: userRole, entityId } = await ChatController.getUserRole(userId);

      // Get conversation from database
      const conversation = await Conversation.findByPk(conversationId, {
        include: [
          {
            model: Booking,
            as: 'booking',
            attributes: ['id', 'bookingType', 'startTime', 'endTime', 'status']
          },
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'profileImage', 'email']
          },
          {
            model: Coach,
            as: 'coach',
            attributes: ['id', 'profileImage'],
            include: [{
              model: User,
              as: 'User',
              attributes: ['id', 'firstName', 'lastName', 'profileImage', 'email']
            }],
            required: false
          },
          {
            model: Facility,
            as: 'facility',
            attributes: ['id', 'name', 'images'],
            required: false
          }
        ]
      });

      if (!conversation) {
        return ResponseUtil.error(res, 'Conversation not found', 404);
      }

      // Check if user has access to this conversation
      let hasAccess = false;
      if (userRole === 'user' && conversation.userId === entityId) {
        hasAccess = true;
      } else if (userRole === 'coach' && conversation.coachId === entityId) {
        hasAccess = true;
      } else if (userRole === 'facility' && conversation.facilityId === entityId) {
        hasAccess = true;
      }

      if (!hasAccess) {
        return ResponseUtil.error(res, 'You do not have access to this conversation', 403);
      }

      // Get messages from Papersignal
      const roomData = await papersignalClient.getRoom(conversation.papersignalRoomId, {
        limit: parseInt(limit),
        before
      });

      return ResponseUtil.success(res, {
        conversation: {
          id: conversation.id,
          bookingId: conversation.bookingId,
          conversationType: conversation.conversationType,
          participants: conversation.participants,
          lastMessageAt: conversation.lastMessageAt,
          status: conversation.status,
          booking: conversation.booking,
          user: conversation.user,
          coach: conversation.coach,
          facility: conversation.facility,
          papersignalRoomId: conversation.papersignalRoomId
        },
        messages: roomData.room.messages || [],
        hasMore: roomData.room.messages?.length >= parseInt(limit)
      }, 'Conversation retrieved successfully');
    } catch (error) {
      console.error('Error getting conversation:', error);
      return ResponseUtil.error(res, 'Failed to retrieve conversation', 500);
    }
  }

  /**
   * Send a message to a conversation
   */
  static async sendMessage(req, res) {
    try {
      const { conversationId } = req.params;
      const { content, messageType = 'text' } = req.body;
      const userId = req.user.id;

      if (!content || content.trim() === '') {
        return ResponseUtil.error(res, 'Message content is required', 400);
      }

      // Determine user role
      const { role: userRole, entityId } = await ChatController.getUserRole(userId);

      // Get conversation
      const conversation = await Conversation.findByPk(conversationId, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'profileImage']
          },
          {
            model: Coach,
            as: 'coach',
            attributes: ['id', 'profileImage'],
            include: [{
              model: User,
              as: 'User',
              attributes: ['id', 'firstName', 'lastName', 'profileImage']
            }],
            required: false
          },
          {
            model: Facility,
            as: 'facility',
            attributes: ['id', 'name', 'images'],
            required: false
          }
        ]
      });

      if (!conversation) {
        return ResponseUtil.error(res, 'Conversation not found', 404);
      }

      // Check if user has access
      let hasAccess = false;
      let userName = '';
      let userAvatar = null;

      if (userRole === 'user' && conversation.userId === entityId) {
        hasAccess = true;
        userName = `${conversation.user.firstName} ${conversation.user.lastName}`.trim();
        userAvatar = conversation.user.profileImage;
      } else if (userRole === 'coach' && conversation.coachId === entityId) {
        hasAccess = true;
        userName = `${conversation.coach.User.firstName} ${conversation.coach.User.lastName}`.trim();
        userAvatar = conversation.coach.User.profileImage;
      } else if (userRole === 'facility' && conversation.facilityId === entityId) {
        hasAccess = true;
        userName = conversation.facility.name;
        userAvatar = conversation.facility.images?.[0] || null;
      }

      if (!hasAccess) {
        return ResponseUtil.error(res, 'You do not have access to this conversation', 403);
      }

      // Send message via Papersignal
      const messageData = await papersignalClient.sendMessage(conversation.papersignalRoomId, {
        userId,
        userName,
        content: content.trim(),
        messageType,
        userAvatar
      });

      // Update conversation with last message info
      await conversation.update({
        lastMessageAt: new Date(),
        lastMessagePreview: content.trim().substring(0, 100)
      });

      return ResponseUtil.success(res, {
        message: messageData.message
      }, 'Message sent successfully');
    } catch (error) {
      console.error('Error sending message:', error);
      return ResponseUtil.error(res, 'Failed to send message', 500);
    }
  }

  /**
   * Helper method to determine user role
   */
  static async getUserRole(userId) {
    // Check if user is a coach
    const coach = await Coach.findOne({ where: { userId } });
    if (coach) return { role: 'coach', entityId: coach.id };

    // Check if user owns a facility
    const facility = await Facility.findOne({ where: { ownerId: userId } });
    if (facility) return { role: 'facility', entityId: facility.id };

    // Default to regular user
    return { role: 'user', entityId: userId };
  }

  /**
   * Get conversation by booking ID
   */
  static async getConversationByBookingId(req, res) {
    try {
      const { bookingId } = req.params;
      const { chatWith } = req.query; // 'coach' or 'facility'
      const userId = req.user.id;

      // Determine user role
      const { role: userRole, entityId } = await ChatController.getUserRole(userId);

      // Build where clause
      const whereClause = { bookingId };

      // Filter by chatWith if provided
      if (chatWith === 'coach') {
        whereClause.conversationType = 'user_coach';
        whereClause.coachId = { [Op.not]: null };
      } else if (chatWith === 'facility') {
        whereClause.conversationType = 'user_facility';
        whereClause.facilityId = { [Op.not]: null };
      }

      // Find conversation
      const conversation = await Conversation.findOne({
        where: whereClause,
        include: [
          {
            model: Booking,
            as: 'booking',
            attributes: ['id', 'bookingType', 'startTime', 'endTime', 'status']
          },
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'profileImage']
          },
          {
            model: Coach,
            as: 'coach',
            attributes: ['id', 'profileImage'],
            include: [{
              model: User,
              as: 'User',
              attributes: ['id', 'firstName', 'lastName', 'profileImage']
            }],
            required: false
          },
          {
            model: Facility,
            as: 'facility',
            attributes: ['id', 'name', 'images'],
            required: false
          }
        ]
      });

      if (!conversation) {
        return ResponseUtil.error(res, 'Conversation not found for this booking', 404);
      }

      // Check access
      let hasAccess = false;
      if (userRole === 'user' && conversation.userId === entityId) {
        hasAccess = true;
      } else if (userRole === 'coach' && conversation.coachId === entityId) {
        hasAccess = true;
      } else if (userRole === 'facility' && conversation.facilityId === entityId) {
        hasAccess = true;
      }

      if (!hasAccess) {
        return ResponseUtil.error(res, 'You do not have access to this conversation', 403);
      }

      return ResponseUtil.success(res, { conversation }, 'Conversation found');
    } catch (error) {
      console.error('Error getting conversation by booking:', error);
      return ResponseUtil.error(res, 'Failed to retrieve conversation', 500);
    }
  }

  /**
   * Mark conversation as read (reset unread count)
   */
  static async markAsRead(req, res) {
    try {
      const { conversationId } = req.params;
      const userId = req.user.id;

      // Determine user role
      const { role: userRole, entityId } = await ChatController.getUserRole(userId);

      const conversation = await Conversation.findByPk(conversationId);

      if (!conversation) {
        return ResponseUtil.error(res, 'Conversation not found', 404);
      }

      // Check access
      let hasAccess = false;
      if (userRole === 'user' && conversation.userId === entityId) {
        hasAccess = true;
      } else if (userRole === 'coach' && conversation.coachId === entityId) {
        hasAccess = true;
      } else if (userRole === 'facility' && conversation.facilityId === entityId) {
        hasAccess = true;
      }

      if (!hasAccess) {
        return ResponseUtil.error(res, 'You do not have access to this conversation', 403);
      }

      // Reset unread count
      await conversation.update({ unreadCount: 0 });

      return ResponseUtil.success(res, null, 'Conversation marked as read');
    } catch (error) {
      console.error('Error marking conversation as read:', error);
      return ResponseUtil.error(res, 'Failed to mark conversation as read', 500);
    }
  }
}

module.exports = ChatController;
