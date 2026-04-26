import { sendEmail } from "../services/emailService.js";

// POST /api/feedback
export const submitFeedback = async (req, res) => {
  try {
    const { name, email, message, subject } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        message: "Name, email, and message are required",
      });
    }

    // Send feedback email to admin
    const adminEmail = process.env.ADMIN_EMAIL || "your-email@example.com"; // Replace with your email

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">New Feedback Received</h2>
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>From:</strong> ${name} (${email})</p>
          <p><strong>Subject:</strong> ${subject || 'General Feedback'}</p>
          <p><strong>Message:</strong></p>
          <p style="white-space: pre-wrap;">${message}</p>
        </div>
        <p style="color: #6b7280; font-size: 14px;">This feedback was submitted through the Aither Cognition website.</p>
      </div>
    `;

    await sendEmail(adminEmail, `Feedback from ${name}: ${subject || 'General'}`, emailHtml);

    res.status(200).json({ message: "Feedback sent successfully" });
  } catch (error) {
    console.error("Feedback submission error:", error);
    res.status(500).json({ message: "Failed to send feedback" });
  }
};