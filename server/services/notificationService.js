import webpush from "web-push";
import PushSubscription from "../models/PushSubscription.js";

let vapidConfigured = false;
function ensureVapid() {
  if (vapidConfigured) return;
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
  vapidConfigured = true;
}

class NotificationService {
  /**
   * Save or update a push subscription for a user.
   */
  static async saveSubscription(userId, subscription) {
    const { endpoint, keys } = subscription;
    await PushSubscription.findOneAndUpdate(
      { endpoint },
      { userId, endpoint, keys },
      { upsert: true, new: true }
    );
  }

  /**
   * Remove a push subscription (user unsubscribed).
   */
  static async removeSubscription(endpoint) {
    await PushSubscription.deleteOne({ endpoint });
  }

  /**
   * Send a push notification to all subscriptions of a user.
   */
  static async sendToUser(userId, payload) {
    const subs = await PushSubscription.find({ userId });
    if (!subs.length) return;

    ensureVapid();
    const message = JSON.stringify(payload);
    const results = await Promise.allSettled(
      subs.map((sub) =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          message
        )
      )
    );

    // Clean up expired/invalid subscriptions
    const staleEndpoints = [];
    results.forEach((result, i) => {
      if (result.status === "rejected") {
        const statusCode = result.reason?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          staleEndpoints.push(subs[i].endpoint);
        }
      }
    });
    if (staleEndpoints.length) {
      await PushSubscription.deleteMany({ endpoint: { $in: staleEndpoints } });
    }
  }

  /**
   * Send appointment reminder notification to a user.
   */
  static async sendAppointmentReminder(userId, doctorName, appointmentDate) {
    const dateStr = new Date(appointmentDate).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    await this.sendToUser(userId, {
      title: "Appointment Reminder",
      body: `You have an appointment with Dr. ${doctorName} today — ${dateStr}.`,
      icon: "/favicon.ico",
      tag: "appointment-reminder",
      requireInteraction: true,
    });
  }

  /**
   * Send a mood alert notification to a user.
   */
  static async sendMoodAlert(userId, alertType, message) {
    const title =
      alertType === "HIGH_STRESS_ALERT" ? "High Stress Detected" : "Low Mood Detected";
    await this.sendToUser(userId, {
      title,
      body: message + " Please consider reaching out for support.",
      icon: "/favicon.ico",
      tag: alertType.toLowerCase(),
      requireInteraction: true,
    });
  }
}

export default NotificationService;
