const webPush = require('web-push');
const User = require('../models/User');

// Configure web-push with VAPID keys
webPush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:admin@chatapp.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Save a user's push subscription
const saveSubscription = async (userId, subscription) => {
  await User.findByIdAndUpdate(userId, { pushSubscription: subscription });
};

// Remove a user's push subscription
const removeSubscription = async (userId) => {
  await User.findByIdAndUpdate(userId, { pushSubscription: null });
};

// Send push notification to a specific user
const sendPushToUser = async (userId, payload) => {
  try {
    const user = await User.findById(userId).select('pushSubscription');
    if (!user?.pushSubscription) return;

    await webPush.sendNotification(
      user.pushSubscription,
      JSON.stringify(payload)
    );
  } catch (err) {
    // If subscription is no longer valid, remove it
    if (err.statusCode === 410 || err.statusCode === 404) {
      await removeSubscription(userId);
    } else {
      console.error('Push notification error:', err);
    }
  }
};

// Send push to multiple users (e.g., conversation members except sender)
const sendPushToUsers = async (userIds, payload) => {
  const promises = userIds.map((id) => sendPushToUser(id, payload));
  await Promise.allSettled(promises);
};

module.exports = {
  saveSubscription,
  removeSubscription,
  sendPushToUser,
  sendPushToUsers,
};
