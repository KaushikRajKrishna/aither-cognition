import NotificationService from "../services/notificationService.js";

// POST /api/notifications/subscribe
export const subscribe = async (req, res) => {
  try {
    const { subscription } = req.body;
    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return res.status(400).json({ message: "Invalid subscription object" });
    }
    await NotificationService.saveSubscription(req.user._id, subscription);
    res.json({ message: "Subscribed successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/notifications/subscribe
export const unsubscribe = async (req, res) => {
  try {
    const { endpoint } = req.body;
    if (!endpoint) return res.status(400).json({ message: "endpoint required" });
    await NotificationService.removeSubscription(endpoint);
    res.json({ message: "Unsubscribed successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/notifications/vapid-public-key
export const getVapidPublicKey = (_req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
};
