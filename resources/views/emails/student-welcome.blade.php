@extends('emails.layout')

@section('preview', 'Your TLGC CRMS student account has been created')

@section('content')

    {{-- Title --}}
    <h1 class="header-title" style="font-size:20px;font-weight:700;color:#0f172a;text-align:center;margin:0 0 6px;">
        Welcome to TLGC CRMS
    </h1>

    {{-- Description --}}
    <p style="font-size:14px;color:#64748b;text-align:center;line-height:1.6;margin:0 0 24px;">
        Hi <strong style="color:#0f172a;">{{ $studentName }}</strong>, your student account has been created. Use the credentials below to sign in.
    </p>

    {{-- Credentials Card --}}
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:24px 16px;margin-bottom:16px;">
        <div style="text-align:center;margin-bottom:16px;">
            <div style="font-size:12px;color:#64748b;margin-bottom:4px;">Student Number</div>
            <div style="font-size:20px;font-weight:700;color:#065f46;font-family:'Courier New',Courier,monospace;">
                {{ $studentNumber }}
            </div>
        </div>
        <div style="text-align:center;">
            <div style="font-size:12px;color:#64748b;margin-bottom:4px;">Password</div>
            <div style="font-size:20px;font-weight:700;color:#065f46;font-family:'Courier New',Courier,monospace;">
                {{ $password }}
            </div>
        </div>
    </div>

    {{-- Instructions --}}
    <div style="background:#fefce8;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;margin-bottom:24px;">
        <p style="font-size:12px;color:#92400e;margin:0 0 6px;line-height:1.5;">
            <strong style="color:#78350f;">Important:</strong> For security reasons, please change your password after your first login through your student profile page.
        </p>
    </div>

    {{-- Footer note --}}
    <p style="font-size:13px;color:#94a3b8;text-align:center;margin:0;line-height:1.5;">
        If you did not expect this email, please contact the Registrar Office at TLGC.
    </p>

@endsection
