'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    // First, get the user IDs for coaches (you'll need to replace these with actual IDs from your users table)
    const users = await queryInterface.sequelize.query(
      `SELECT id, "firstName", "lastName" FROM users WHERE email IN ('robert.brown@example.com', 'lisa.anderson@example.com', 'chris.taylor@example.com')`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const coaches = [
      {
        id: uuidv4(),
        userId: users.find(u => u.firstName === 'Robert').id,
        bio: 'Professional football coach with over 10 years of experience. Former professional player with expertise in youth development and tactical training.',
        experience: 10,
        certifications: JSON.stringify([
          'UEFA B License',
          'CAF Coaching Certificate',
          'First Aid Certified',
          'Youth Development Specialist'
        ]),
        specialties: JSON.stringify([
          'Football',
          'Tactical Training',
          'Youth Development',
          'Fitness Training'
        ]),
        hourlyRate: 15000.00,
        availability: JSON.stringify({
          0: { open: 9, close: 17 }, // Sunday
          1: { open: 6, close: 20 }, // Monday
          2: { open: 6, close: 20 }, // Tuesday
          3: { open: 6, close: 20 }, // Wednesday
          4: { open: 6, close: 20 }, // Thursday
          5: { open: 6, close: 20 }, // Friday
          6: { open: 8, close: 18 }  // Saturday
        }),
        location: JSON.stringify({
          city: 'Lagos',
          state: 'Lagos',
          country: 'Nigeria',
          coordinates: { lat: 6.5244, lng: 3.3792 }
        }),
        verificationStatus: 'verified',
        verificationDocuments: JSON.stringify([
          'coaching_license.pdf',
          'identity_card.pdf',
          'certifications.pdf'
        ]),
        status: 'active',
        averageRating: 4.8,
        totalReviews: 23,
        totalBookings: 156,
        profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300',
        galleryImages: JSON.stringify([
          'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400',
          'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400'
        ]),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        userId: users.find(u => u.firstName === 'Lisa').id,
        bio: 'Certified tennis instructor and fitness coach. Specialized in helping players of all levels improve their game through proper technique and mental training.',
        experience: 8,
        certifications: JSON.stringify([
          'PTR Professional Tennis Registry',
          'ACSM Personal Trainer',
          'Mental Performance Coach',
          'Injury Prevention Specialist'
        ]),
        specialties: JSON.stringify([
          'Tennis',
          'Fitness Training',
          'Mental Coaching',
          'Injury Prevention'
        ]),
        hourlyRate: 12000.00,
        availability: JSON.stringify({
          0: { open: 10, close: 16 }, // Sunday
          1: { open: 7, close: 19 },  // Monday
          2: { open: 7, close: 19 },  // Tuesday
          3: { open: 7, close: 19 },  // Wednesday
          4: { open: 7, close: 19 },  // Thursday
          5: { open: 7, close: 19 },  // Friday
          6: { open: 9, close: 17 }   // Saturday
        }),
        location: JSON.stringify({
          city: 'Abuja',
          state: 'FCT',
          country: 'Nigeria',
          coordinates: { lat: 9.0579, lng: 7.4951 }
        }),
        verificationStatus: 'verified',
        verificationDocuments: JSON.stringify([
          'tennis_certification.pdf',
          'fitness_license.pdf',
          'identity_verification.pdf'
        ]),
        status: 'active',
        averageRating: 4.9,
        totalReviews: 31,
        totalBookings: 198,
        profileImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300',
        galleryImages: JSON.stringify([
          'https://images.unsplash.com/photo-1544717684-8e9a532ea0f1?w=400',
          'https://images.unsplash.com/photo-1622163642998-1ea32b0bbc68?w=400'
        ]),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        userId: users.find(u => u.firstName === 'Chris').id,
        bio: 'Multi-sport coach with expertise in basketball, volleyball, and general fitness. Passionate about helping athletes reach their full potential.',
        experience: 12,
        certifications: JSON.stringify([
          'FIBA Basketball Coach Level 2',
          'FIVB Volleyball Coach',
          'Strength & Conditioning Specialist',
          'Sports Psychology Certificate'
        ]),
        specialties: JSON.stringify([
          'Basketball',
          'Volleyball',
          'Strength Training',
          'Team Sports'
        ]),
        hourlyRate: 18000.00,
        availability: JSON.stringify({
          0: { open: 8, close: 18 },  // Sunday
          1: { open: 5, close: 21 },  // Monday
          2: { open: 5, close: 21 },  // Tuesday
          3: { open: 5, close: 21 },  // Wednesday
          4: { open: 5, close: 21 },  // Thursday
          5: { open: 5, close: 21 },  // Friday
          6: { open: 7, close: 19 }   // Saturday
        }),
        location: JSON.stringify({
          city: 'Kano',
          state: 'Kano',
          country: 'Nigeria',
          coordinates: { lat: 12.0022, lng: 8.5920 }
        }),
        verificationStatus: 'verified',
        verificationDocuments: JSON.stringify([
          'basketball_license.pdf',
          'volleyball_certification.pdf',
          'background_check.pdf'
        ]),
        status: 'active',
        averageRating: 4.7,
        totalReviews: 18,
        totalBookings: 89,
        profileImage: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300',
        galleryImages: JSON.stringify([
          'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400',
          'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=400'
        ]),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await queryInterface.bulkInsert('coaches', coaches, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('coaches', null, {});
  }
};