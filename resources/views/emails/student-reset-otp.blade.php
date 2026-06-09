<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; padding: 24px; background: #f5f5f5;">
  <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; padding: 32px;">
    <h2 style="margin-top: 0; color: #1a6e38;">Password Reset Verification</h2>
    <p style="color: #333;">Hi {{ $studentName }},</p>
    <p style="color: #555;">Use the verification code below to reset your password. This code expires in 10 minutes.</p>
    <div style="text-align: center; margin: 32px 0;">
      <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1a6e38; background: #f0fdf4; padding: 12px 24px; border-radius: 8px;">{{ $otp }}</span>
    </div>
    <p style="color: #888; font-size: 12px;">If you did not request a password reset, please ignore this email.</p>
  </div>
</body>
</html>
