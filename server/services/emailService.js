import nodemailer from "nodemailer";

let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;
  _transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return _transporter;
}

async function sendEmail(to, subject, html) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("[email] SMTP credentials not configured — skipping email to:", to);
    return;
  }
  if (!to) return;
  await getTransporter().sendMail({
    from: `"Aither Cognition" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
}

function baseLayout(bodyContent) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body { margin: 0; padding: 0; background: #f4f6f9; font-family: Arial, sans-serif; }
    .wrapper { max-width: 560px; margin: 32px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,.08); }
    .header { background: #4f46e5; padding: 24px 32px; }
    .header h1 { margin: 0; color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: .3px; }
    .body { padding: 28px 32px; }
    .body p { margin: 0 0 16px; color: #374151; font-size: 15px; line-height: 1.6; }
    .card { background: #f9fafb; border-left: 4px solid #4f46e5; border-radius: 4px; padding: 14px 18px; margin: 20px 0; }
    .card p { margin: 0; }
    .footer { background: #f9fafb; padding: 16px 32px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header"><h1>Aither Cognition</h1></div>
    <div class="body">${bodyContent}</div>
    <div class="footer">You received this message because you are registered on Aither Cognition.<br/>Please do not reply to this email.</div>
  </div>
</body>
</html>`;
}

export async function sendAppointmentBookedEmail(to, userName, doctorName, dateStr) {
  const subject = "Appointment Confirmed – Aither Cognition";
  const html = baseLayout(`
    <p>Hi <strong>${userName || "there"}</strong>,</p>
    <p>Your appointment has been successfully booked. Here are the details:</p>
    <div class="card">
      <p><strong>Doctor:</strong> Dr. ${doctorName}</p>
      <p style="margin-top:8px"><strong>Date:</strong> ${dateStr}</p>
      <p style="margin-top:8px"><strong>Status:</strong> Confirmed</p>
    </div>
    <p>Please make sure to be available at the scheduled time. If you need to cancel or reschedule, log in to Aither Cognition.</p>
    <p>Take care,<br/><strong>The Aither Cognition Team</strong></p>
  `);
  await sendEmail(to, subject, html);
}

export async function sendAppointmentReminderEmail(to, userName, doctorName, dateStr) {
  const subject = "Appointment Reminder – Aither Cognition";
  const html = baseLayout(`
    <p>Hi <strong>${userName || "there"}</strong>,</p>
    <p>This is a friendly reminder that you have an upcoming appointment today:</p>
    <div class="card">
      <p><strong>Doctor:</strong> Dr. ${doctorName}</p>
      <p style="margin-top:8px"><strong>Date:</strong> ${dateStr}</p>
    </div>
    <p>Please ensure you are prepared and available at the scheduled time.</p>
    <p>Take care,<br/><strong>The Aither Cognition Team</strong></p>
  `);
  await sendEmail(to, subject, html);
}

export async function sendRoutineReminderEmail(to, userName, taskTitle, taskType) {
  const subject = "Routine Reminder – Aither Cognition";
  const displayType = taskType === "custom" ? taskTitle : taskType.charAt(0).toUpperCase() + taskType.slice(1);
  const html = baseLayout(`
    <p>Hi <strong>${userName || "there"}</strong>,</p>
    <p>This is your scheduled routine reminder:</p>
    <div class="card">
      <p><strong>Task:</strong> ${taskTitle}</p>
      <p style="margin-top:8px"><strong>Type:</strong> ${displayType}</p>
    </div>
    <p>Stay consistent with your daily routine — it makes a big difference for your wellbeing.</p>
    <p>Take care,<br/><strong>The Aither Cognition Team</strong></p>
  `);
  await sendEmail(to, subject, html);
}

export async function sendMoodAlertEmail(to, userName, alertType, message) {
  const isStress = alertType === "HIGH_STRESS_ALERT";
  const subject = isStress
    ? "High Stress Detected – Aither Cognition"
    : "Low Mood Detected – Aither Cognition";
  const accentColor = isStress ? "#dc2626" : "#2563eb";
  const html = baseLayout(`
    <p>Hi <strong>${userName || "there"}</strong>,</p>
    <p>We noticed a pattern in your recent mood logs that we want to bring to your attention:</p>
    <div class="card" style="border-left-color:${accentColor}">
      <p><strong>${isStress ? "High Stress Detected" : "Low Mood Detected"}</strong></p>
      <p style="margin-top:8px">${message}</p>
    </div>
    <p>Please consider reaching out to a mental health professional or your assigned doctor for support. You are not alone.</p>
    <p>Take care,<br/><strong>The Aither Cognition Team</strong></p>
  `);
  await sendEmail(to, subject, html);
}

export async function sendCrisisAlertEmail(to, userName, riskLevel, detectedPatterns) {
  const subject = "🆘 Crisis Alert – Immediate Support Available – Aither Cognition";
  const riskColor = riskLevel === "critical" ? "#dc2626" : "#ea580c";
  const helplineInfo = `
    <p><strong>📞 National Suicide Prevention Lifeline (US):</strong> Call <strong>988</strong></p>
    <p><strong>📱 Text:</strong> Text HOME to 741741</p>
    <p><strong>🌐 Website:</strong> <a href="https://988lifeline.org/" style="color:#4f46e5">988lifeline.org</a></p>
  `;
  
  const html = baseLayout(`
    <p>Hi <strong>${userName || "there"}</strong>,</p>
    <p>We've detected a <strong style="color:${riskColor}">${riskLevel === "critical" ? "critical" : "high-risk"} situation</strong> in your recent conversation on Aither Cognition.</p>
    <div class="card" style="border-left-color:${riskColor}; background: #fef2f2;">
      <p><strong>🆘 Immediate Support Available</strong></p>
      <p style="margin-top:12px; color:#991b1b"><strong>Please reach out for professional help right now:</strong></p>
      ${helplineInfo}
    </div>
    <p style="margin-top:20px"><strong>Other resources:</strong></p>
    <p>
      🇨🇦 <strong>Canada:</strong> 1-833-456-4566<br/>
      🇬🇧 <strong>UK:</strong> 116 123 (Samaritans)<br/>
      🇦🇺 <strong>Australia:</strong> 13 11 14 (Lifeline)<br/>
      🇮🇳 <strong>India:</strong> iCall 9152987821
    </p>
    <p style="margin-top:20px">You matter. Your life matters. Help is available right now. Please reach out to someone you trust or contact a crisis helpline immediately.</p>
    <p style="margin-top:20px">If you're in immediate danger, please call <strong>911</strong> (or your local emergency number).</p>
    <p style="margin-top:20px">We care about your wellbeing.<br/><strong>The Aither Cognition Team</strong></p>
  `);
  
  await sendEmail(to, subject, html);
}
