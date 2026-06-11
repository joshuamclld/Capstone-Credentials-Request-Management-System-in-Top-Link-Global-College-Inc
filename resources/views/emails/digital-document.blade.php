@extends('emails.layout')

@section('preview', 'Your requested document from TLGC CRMS')

@section('content')

    {{-- Title --}}
    <h1 class="header-title" style="font-size:20px;font-weight:700;color:#0f172a;text-align:center;margin:0 0 6px;">
        Your Requested Document is Ready
    </h1>

    {{-- Greeting --}}
    <p style="font-size:14px;color:#64748b;text-align:center;line-height:1.6;margin:0 0 28px;">
        Dear <strong style="color:#0f172a;">{{ $studentName }}</strong>, your requested document is now available for download.
    </p>

    {{-- Request Summary Card --}}
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:24px;">
        <tr>
            <td style="padding:20px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                        <td style="padding-bottom:14px;">
                            <div style="font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Document</div>
                            <div style="font-size:15px;font-weight:600;color:#0f172a;">{{ $documentName }}</div>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:14px 0;border-top:1px solid #e2e8f0;">
                            <div style="font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Tracking Number</div>
                            <div style="font-size:14px;font-weight:600;color:#065f46;font-family:'Courier New',Courier,monospace;">{{ $trackingNumber }}</div>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding-top:14px;border-top:1px solid #e2e8f0;">
                            <div style="font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Date Requested</div>
                            <div style="font-size:14px;font-weight:500;color:#334155;">{{ $dateRequested }}</div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    {{-- Attachment Notice --}}
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:18px 20px;text-align:center;margin-bottom:24px;">
        <div style="font-size:13px;color:#065f46;font-weight:700;margin-bottom:4px;">Document Attached</div>
        <p style="font-size:13px;color:#166534;margin:0;line-height:1.5;">
            Your requested document is attached to this email. Please keep a copy for your records.
        </p>
    </div>

    {{-- Official Registrar Seal --}}
    <div style="text-align:center;margin-bottom:28px;">
        <div style="width:36px;height:2px;background:#065f46;margin:0 auto 8px;"></div>
        <p style="font-size:12px;color:#64748b;margin:0;line-height:1.5;">
            Official document issued by <strong style="color:#0f172a;">TLGC Registrar Office</strong>
        </p>
    </div>

    {{-- Contact note --}}
    <p style="font-size:13px;color:#94a3b8;text-align:center;margin:0;line-height:1.5;">
        If you have any concerns, please contact the TLGC Registrar Office directly.
    </p>

@endsection