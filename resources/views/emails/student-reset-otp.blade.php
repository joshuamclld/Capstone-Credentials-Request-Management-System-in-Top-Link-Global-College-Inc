@extends('emails.layout')

@section('preview', 'Password reset verification code for TLGC CRMS')

@section('content')

    {{-- Hero Icon --}}
    <div style="text-align:center;margin-bottom:16px;">
        <div style="display:inline-block;width:52px;height:52px;background:#fefce8;border-radius:50%;">
            <div style="font-size:24px;line-height:52px;text-align:center;color:#92400e;">&#128273;</div>
        </div>
    </div>

    {{-- Title --}}
    <h1 class="header-title" style="font-size:20px;font-weight:700;color:#0f172a;text-align:center;margin:0 0 6px;">
        Password Reset Request
    </h1>

    {{-- Description --}}
    <p style="font-size:14px;color:#64748b;text-align:center;line-height:1.6;margin:0 0 24px;">
        Hi <strong style="color:#0f172a;">{{ $studentName }}</strong>, we received a request to reset your TLGC CRMS account password.
    </p>

    {{-- OTP Code Card --}}
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:24px 16px;text-align:center;margin-bottom:16px;">
        <div class="otp-code" style="font-size:34px;font-weight:700;letter-spacing:10px;color:#065f46;font-family:'Courier New',Courier,monospace;line-height:1.2;">
            {{ $otp }}
        </div>
        <div style="font-size:11px;color:#16a34a;margin-top:14px;font-weight:600;letter-spacing:0.3px;">
            &#9200; Expires in 10 minutes
        </div>
    </div>

    {{-- Security Notice --}}
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px 16px;margin-bottom:24px;">
        <p style="font-size:12px;color:#991b1b;margin:0;line-height:1.5;">
            <strong style="color:#7f1d1d;">&#9888; Security Notice:</strong> If you did not request a password reset, please ignore this email. Your account remains secure.
        </p>
    </div>

    {{-- Footer note --}}
    <p style="font-size:13px;color:#94a3b8;text-align:center;margin:0;line-height:1.5;">
        For security reasons, this code will expire after 10 minutes.
    </p>

@endsection
