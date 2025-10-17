// controllers/TeamController.js
const { Team, Sport, Booking, User } = require('../models');
const ResponseUtil = require('../utils/response');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

class TeamController {
  // Get available sports (sports user has booked)
  static async getAvailableSports(req, res) {
    try {
      const userId = req.user.id;

      // Get all sports from user's confirmed bookings
      const bookings = await Booking.findAll({
        where: {
          userId,
          sportId: { [Op.ne]: null },
          status: { [Op.in]: ['confirmed', 'completed'] }
        },
        include: [{
          model: Sport,
          as: 'Sport',
          attributes: ['id', 'name', 'icon', 'category']
        }],
        attributes: ['sportId'],
        group: ['sportId', 'Sport.id']
      });

      // Extract unique sports
      const sportsMap = new Map();
      bookings.forEach(booking => {
        if (booking.Sport && !sportsMap.has(booking.Sport.id)) {
          sportsMap.set(booking.Sport.id, booking.Sport);
        }
      });

      const sports = Array.from(sportsMap.values());

      return ResponseUtil.success(res, sports, 'Available sports retrieved successfully');

    } catch (error) {
      console.error('Get available sports error:', error);
      return ResponseUtil.error(res, 'Failed to get available sports', 500);
    }
  }

  // Create team
  static async createTeam(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseUtil.error(res, 'Validation failed', 400, errors.array());
      }

      const userId = req.user.id;
      const { sportId, name, formation, coach, venue, members } = req.body;

      // Check if user has booked this sport
      const hasBooking = await Booking.findOne({
        where: {
          userId,
          sportId,
          status: { [Op.in]: ['confirmed', 'completed'] }
        }
      });

      if (!hasBooking) {
        return ResponseUtil.error(res, 'You must have a confirmed booking for this sport to create a team', 403);
      }

      // Check if sport exists
      const sport = await Sport.findByPk(sportId);
      if (!sport) {
        return ResponseUtil.error(res, 'Sport not found', 404);
      }

      // Create team
      const team = await Team.create({
        userId,
        sportId,
        name,
        formation: formation || null,
        coach: coach || null,
        venue: venue || null,
        members: members || [],
        wins: 0,
        losses: 0,
        draws: 0
      });

      // Fetch team with associations
      const teamWithSport = await Team.findByPk(team.id, {
        include: [{
          model: Sport,
          as: 'Sport',
          attributes: ['id', 'name', 'icon', 'category']
        }]
      });

      console.log(`✅ Team created: ${team.name} for sport: ${sport.name}`);

      return ResponseUtil.success(res, teamWithSport, 'Team created successfully', 201);

    } catch (error) {
      console.error('Create team error:', error);
      return ResponseUtil.error(res, 'Failed to create team', 500);
    }
  }

  // Get all user's teams
  static async getTeams(req, res) {
    try {
      const userId = req.user.id;
      const { sport } = req.query;

      const whereClause = { userId };

      // Filter by sport if provided
      if (sport) {
        whereClause.sportId = sport;
      }

      const teams = await Team.findAll({
        where: whereClause,
        include: [{
          model: Sport,
          as: 'Sport',
          attributes: ['id', 'name', 'icon', 'category']
        }],
        order: [['createdAt', 'DESC']]
      });

      return ResponseUtil.success(res, teams, 'Teams retrieved successfully');

    } catch (error) {
      console.error('Get teams error:', error);
      return ResponseUtil.error(res, 'Failed to get teams', 500);
    }
  }

  // Get single team
  static async getTeam(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const team = await Team.findOne({
        where: { id, userId },
        include: [{
          model: Sport,
          as: 'Sport',
          attributes: ['id', 'name', 'icon', 'category']
        }]
      });

      if (!team) {
        return ResponseUtil.error(res, 'Team not found', 404);
      }

      return ResponseUtil.success(res, team, 'Team retrieved successfully');

    } catch (error) {
      console.error('Get team error:', error);
      return ResponseUtil.error(res, 'Failed to get team', 500);
    }
  }

  // Update team
  static async updateTeam(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseUtil.error(res, 'Validation failed', 400, errors.array());
      }

      const { id } = req.params;
      const userId = req.user.id;
      const { name, formation, coach, venue, members, wins, losses, draws, status } = req.body;

      // Find team
      const team = await Team.findOne({
        where: { id, userId }
      });

      if (!team) {
        return ResponseUtil.error(res, 'Team not found', 404);
      }

      // Update team
      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (formation !== undefined) updateData.formation = formation;
      if (coach !== undefined) updateData.coach = coach;
      if (venue !== undefined) updateData.venue = venue;
      if (members !== undefined) updateData.members = members;
      if (wins !== undefined) updateData.wins = wins;
      if (losses !== undefined) updateData.losses = losses;
      if (draws !== undefined) updateData.draws = draws;
      if (status !== undefined) updateData.status = status;

      await team.update(updateData);

      // Fetch updated team with associations
      const updatedTeam = await Team.findByPk(team.id, {
        include: [{
          model: Sport,
          as: 'Sport',
          attributes: ['id', 'name', 'icon', 'category']
        }]
      });

      console.log(`✅ Team updated: ${team.name}`);

      return ResponseUtil.success(res, updatedTeam, 'Team updated successfully');

    } catch (error) {
      console.error('Update team error:', error);
      return ResponseUtil.error(res, 'Failed to update team', 500);
    }
  }

  // Delete team
  static async deleteTeam(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Find team
      const team = await Team.findOne({
        where: { id, userId }
      });

      if (!team) {
        return ResponseUtil.error(res, 'Team not found', 404);
      }

      const teamName = team.name;

      // Delete team
      await team.destroy();

      console.log(`✅ Team deleted: ${teamName}`);

      return ResponseUtil.success(res, null, 'Team deleted successfully');

    } catch (error) {
      console.error('Delete team error:', error);
      return ResponseUtil.error(res, 'Failed to delete team', 500);
    }
  }

  // Get team statistics
  static async getTeamStats(req, res) {
    try {
      const userId = req.user.id;

      // Get all teams count by sport
      const teams = await Team.findAll({
        where: { userId },
        include: [{
          model: Sport,
          as: 'Sport',
          attributes: ['id', 'name']
        }],
        attributes: ['id', 'sportId', 'wins', 'losses', 'draws', 'members']
      });

      // Calculate statistics
      const totalTeams = teams.length;
      const totalMembers = teams.reduce((sum, team) => sum + (team.members?.length || 0), 0);
      const totalWins = teams.reduce((sum, team) => sum + (team.wins || 0), 0);
      const totalLosses = teams.reduce((sum, team) => sum + (team.losses || 0), 0);
      const totalDraws = teams.reduce((sum, team) => sum + (team.draws || 0), 0);
      const totalGames = totalWins + totalLosses + totalDraws;
      const winRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;

      // Group by sport
      const sportStats = {};
      teams.forEach(team => {
        const sportName = team.Sport?.name || 'Unknown';
        if (!sportStats[sportName]) {
          sportStats[sportName] = {
            count: 0,
            wins: 0,
            losses: 0,
            draws: 0
          };
        }
        sportStats[sportName].count++;
        sportStats[sportName].wins += team.wins || 0;
        sportStats[sportName].losses += team.losses || 0;
        sportStats[sportName].draws += team.draws || 0;
      });

      const stats = {
        totalTeams,
        totalMembers,
        totalWins,
        totalLosses,
        totalDraws,
        totalGames,
        winRate,
        bySport: sportStats
      };

      return ResponseUtil.success(res, stats, 'Team statistics retrieved successfully');

    } catch (error) {
      console.error('Get team stats error:', error);
      return ResponseUtil.error(res, 'Failed to get team statistics', 500);
    }
  }
}

module.exports = TeamController;
