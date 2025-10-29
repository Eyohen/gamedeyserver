// Script to create conversations for existing confirmed bookings
const { Booking, Conversation } = require('../models');
const ChatController = require('../controllers/ChatController');

async function createMissingConversations() {
  try {
    console.log('🔍 Finding confirmed bookings without conversations...');

    // Find all confirmed bookings that don't have conversations
    const confirmedBookings = await Booking.findAll({
      where: { status: 'confirmed' },
      include: [{
        model: Conversation,
        as: 'conversation',
        required: false
      }]
    });

    const bookingsWithoutConversations = confirmedBookings.filter(
      booking => !booking.conversation
    );

    console.log(`📊 Found ${bookingsWithoutConversations.length} confirmed bookings without conversations`);

    if (bookingsWithoutConversations.length === 0) {
      console.log('✅ All confirmed bookings already have conversations!');
      return;
    }

    // Create conversations for each booking
    let successCount = 0;
    let failCount = 0;

    for (const booking of bookingsWithoutConversations) {
      try {
        console.log(`💬 Creating conversation for booking ${booking.id}...`);
        await ChatController.createConversationForBooking(booking.id);
        successCount++;
        console.log(`✅ Conversation created for booking ${booking.id}`);
      } catch (error) {
        failCount++;
        console.error(`❌ Failed to create conversation for booking ${booking.id}:`, error.message);
      }
    }

    console.log('\n📈 Summary:');
    console.log(`✅ Successfully created: ${successCount} conversations`);
    console.log(`❌ Failed: ${failCount} conversations`);
    console.log('🎉 Done!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
createMissingConversations();
