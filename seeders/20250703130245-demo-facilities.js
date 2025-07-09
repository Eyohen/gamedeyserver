'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    // Get facility owner user IDs
    const users = await queryInterface.sequelize.query(
      `SELECT id, "firstName", "lastName" FROM users WHERE email IN ('david.wilson@example.com', 'sarah.davis@example.com')`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const facilities = [
      {
        id: uuidv4(),
        ownerId: users.find(u => u.firstName === 'David').id,
        name: 'Elite Sports Complex Lagos',
        description: 'Premier multi-sport facility in the heart of Lagos featuring state-of-the-art equipment, professional-grade courts, and modern amenities. Perfect for both recreational and competitive sports.',
        address: '15 Admiralty Way, Lekki Phase 1, Lagos State, Nigeria',
        location: JSON.stringify({
          city: 'Lagos',
          state: 'Lagos',
          country: 'Nigeria',
          coordinates: { lat: 6.4474, lng: 3.4548 },
          landmark: 'Near Lekki Toll Gate'
        }),
        amenities: JSON.stringify([
          'Parking Space',
          'Changing Rooms',
          'Showers',
          'Equipment Rental',
          'First Aid Station',
          'Refreshment Area',
          'Air Conditioning',
          'Sound System',
          'CCTV Security',
          'WiFi'
        ]),
        capacity: 50,
        pricePerHour: 25000.00,
        operatingHours: JSON.stringify({
          0: { open: 8, close: 20 },  // Sunday
          1: { open: 6, close: 22 },  // Monday
          2: { open: 6, close: 22 },  // Tuesday
          3: { open: 6, close: 22 },  // Wednesday
          4: { open: 6, close: 22 },  // Thursday
          5: { open: 6, close: 22 },  // Friday
          6: { open: 7, close: 21 }   // Saturday
        }),
        contactInfo: JSON.stringify({
          phone: '+2348012345679',
          email: 'info@elitesportslagos.com',
          website: 'www.elitesportslagos.com'
        }),
        verificationStatus: 'verified',
        verificationDocuments: JSON.stringify([
          'business_license.pdf',
          'facility_insurance.pdf',
          'safety_certificate.pdf'
        ]),
        status: 'active',
        averageRating: 4.6,
        totalReviews: 42,
        totalBookings: 234,
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800',
          'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800',
          'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800'
        ]),
        rules: JSON.stringify([
          'No smoking anywhere in the facility',
          'Proper sports attire required',
          'Clean up after use',
          'No outside food or drinks',
          'Follow booking time strictly',
          'Report any damages immediately'
        ]),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        ownerId: users.find(u => u.firstName === 'Sarah').id,
        name: 'Champions Arena Ibadan',
        description: 'Modern sports facility offering multiple courts and training areas. Ideal for football, basketball, tennis, and fitness training with professional coaching available.',
        address: '22 Ring Road, Ibadan, Oyo State, Nigeria',
        location: JSON.stringify({
          city: 'Ibadan',
          state: 'Oyo',
          country: 'Nigeria',
          coordinates: { lat: 7.3775, lng: 3.9470 },
          landmark: 'Near University of Ibadan'
        }),
        amenities: JSON.stringify([
          'Free Parking',
          'Locker Rooms',
          'Hot Showers',
          'Equipment Storage',
          'Medical Room',
          'Snack Bar',
          'Spectator Seating',
          'Outdoor Area',
          '24/7 Security',
          'Free WiFi'
        ]),
        capacity: 35,
        pricePerHour: 18000.00,
        operatingHours: JSON.stringify({
          0: { open: 9, close: 19 },  // Sunday
          1: { open: 6, close: 21 },  // Monday
          2: { open: 6, close: 21 },  // Tuesday
          3: { open: 6, close: 21 },  // Wednesday
          4: { open: 6, close: 21 },  // Thursday
          5: { open: 6, close: 21 },  // Friday
          6: { open: 8, close: 20 }   // Saturday
        }),
        contactInfo: JSON.stringify({
          phone: '+2348012345680',
          email: 'bookings@championsarena.ng',
          website: 'www.championsarena.ng'
        }),
        verificationStatus: 'verified',
        verificationDocuments: JSON.stringify([
          'cac_certificate.pdf',
          'facility_permit.pdf',
          'health_certificate.pdf'
        ]),
        status: 'active',
        averageRating: 4.4,
        totalReviews: 28,
        totalBookings: 167,
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800',
          'https://images.unsplash.com/photo-1544717684-8e9a532ea0f1?w=800',
          'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800'
        ]),
        rules: JSON.stringify([
          'Registration required for first-time users',
          'Maximum 2-hour continuous booking',
          'Cancellation 24 hours before booking',
          'No alcoholic beverages allowed',
          'Children must be supervised',
          'Equipment damage will be charged'
        ]),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        ownerId: users.find(u => u.firstName === 'David').id,
        name: 'Victory Sports Hub',
        description: 'Community-focused sports facility offering affordable rates for various sports activities. Great for casual games, training sessions, and community events.',
        address: '45 Allen Avenue, Ikeja, Lagos State, Nigeria',
        location: JSON.stringify({
          city: 'Lagos',
          state: 'Lagos',
          country: 'Nigeria',
          coordinates: { lat: 6.6018, lng: 3.3515 },
          landmark: 'Allen Avenue Roundabout'
        }),
        amenities: JSON.stringify([
          'Parking Available',
          'Basic Changing Rooms',
          'Showers',
          'Equipment Hire',
          'First Aid Kit',
          'Water Fountain',
          'Seating Area',
          'Basic Sound System'
        ]),
        capacity: 25,
        pricePerHour: 12000.00,
        operatingHours: JSON.stringify({
          0: { open: 10, close: 18 }, // Sunday
          1: { open: 7, close: 20 },  // Monday
          2: { open: 7, close: 20 },  // Tuesday
          3: { open: 7, close: 20 },  // Wednesday
          4: { open: 7, close: 20 },  // Thursday
          5: { open: 7, close: 20 },  // Friday
          6: { open: 8, close: 19 }   // Saturday
        }),
        contactInfo: JSON.stringify({
          phone: '+2348012345681',
          email: 'hello@victorysports.ng'
        }),
        verificationStatus: 'verified',
        verificationDocuments: JSON.stringify([
          'business_registration.pdf',
          'facility_inspection.pdf'
        ]),
        status: 'active',
        averageRating: 4.2,
        totalReviews: 15,
        totalBookings: 89,
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800',
          'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800'
        ]),
        rules: JSON.stringify([
          'Respect other users',
          'Clean equipment after use',
          'No loud music after 8 PM',
          'Proper footwear required',
          'Book in advance for peak hours'
        ]),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        ownerId: users.find(u => u.firstName === 'Sarah').id,
        name: 'Aqua Fitness Center',
        description: 'Specialized aquatic sports facility with Olympic-size swimming pool, diving areas, and aqua fitness programs. Perfect for swimming, water polo, and aqua aerobics.',
        address: '78 Murtala Mohammed Way, Kano State, Nigeria',
        location: JSON.stringify({
          city: 'Kano',
          state: 'Kano',
          country: 'Nigeria',
          coordinates: { lat: 12.0022, lng: 8.5920 },
          landmark: 'Near Kano Airport'
        }),
        amenities: JSON.stringify([
          'Olympic Pool',
          'Kids Pool',
          'Diving Board',
          'Pool Deck',
          'Changing Rooms',
          'Hot Showers',
          'Pool Equipment',
          'Towel Service',
          'Lifeguard on Duty',
          'Pool Bar'
        ]),
        capacity: 40,
        pricePerHour: 20000.00,
        operatingHours: JSON.stringify({
          0: { open: 9, close: 19 },  // Sunday
          1: { open: 6, close: 21 },  // Monday
          2: { open: 6, close: 21 },  // Tuesday
          3: { open: 6, close: 21 },  // Wednesday
          4: { open: 6, close: 21 },  // Thursday
          5: { open: 6, close: 21 },  // Friday
          6: { open: 8, close: 20 }   // Saturday
        }),
        contactInfo: JSON.stringify({
          phone: '+2348012345682',
          email: 'swim@aquafitness.ng',
          website: 'www.aquafitness.ng'
        }),
        verificationStatus: 'verified',
        verificationDocuments: JSON.stringify([
          'pool_safety_certificate.pdf',
          'lifeguard_certification.pdf',
          'water_quality_report.pdf'
        ]),
        status: 'active',
        averageRating: 4.8,
        totalReviews: 33,
        totalBookings: 145,
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800',
          'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800'
        ]),
        rules: JSON.stringify([
          'Swimming attire required',
          'Shower before entering pool',
          'No diving in shallow end',
          'Children must be accompanied',
          'No running on pool deck',
          'Follow lifeguard instructions'
        ]),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await queryInterface.bulkInsert('facilities', facilities, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('facilities', null, {});
  }
};