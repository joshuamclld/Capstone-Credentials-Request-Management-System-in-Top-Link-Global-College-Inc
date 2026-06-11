<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>TLGC CRMS</title>
    <style>
        body,table,td,p,a,li,blockquote{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
        table,td{mso-table-lspace:0pt;mso-table-rspace:0pt}
        img{-ms-interpolation-mode:bicubic;border:0;height:auto;line-height:100%;outline:none;text-decoration:none}
        body{margin:0;padding:0;width:100%!important;height:100%!important}
        @@media only screen and (max-width:620px){
            .email-container{width:100%!important;max-width:100%!important}
            .email-padding{padding:24px 20px!important}
            .otp-code{font-size:28px!important;letter-spacing:8px!important}
            .header-title{font-size:18px!important}
        }
    </style>
</head>
<body style="margin:0;padding:0;background-color:#f5f7f8;font-family:'Segoe UI',Arial,Helvetica,sans-serif;">

    <div style="display:none;max-height:0;overflow:hidden;">@yield('preview', 'TLGC CRMS Notification')</div>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f5f7f8;padding:24px 0;">
        <tr>
            <td align="center">
                <table class="email-container" role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;">

                    {{-- Brand Header --}}
                    <tr>
                        <td align="center" style="padding:0 0 24px 0;">
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                                <tr>
                                    <td align="center" style="padding:0 20px;">
                                        <div style="font-size:22px;font-weight:800;color:#065f46;letter-spacing:2px;">TLGC</div>
                                        <div style="font-size:11px;font-weight:600;color:#065f46;text-transform:uppercase;letter-spacing:1px;margin-top:2px;">Top Link Global College, Inc.</div>
                                        <div style="font-size:10px;color:#94a3b8;margin-top:1px;letter-spacing:0.3px;">Credentials Request Management System</div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    {{-- Main Card --}}
                    <tr>
                        <td align="center">
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#ffffff;border-radius:12px;border:1px solid #e2e8f0;">
                                <tr>
                                    <td class="email-padding" style="padding:36px 32px 28px;">
                                        @yield('content')
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    {{-- Footer --}}
                    <tr>
                        <td align="center" style="padding:20px 20px 0;">
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                                <tr>
                                    <td align="center" style="padding:0;">
                                        <div style="font-size:11px;color:#94a3b8;line-height:1.7;">
                                            <p style="margin:0 0 2px;">This is an automated message from TLGC CRMS.</p>
                                            <p style="margin:0 0 2px;">Please do not reply to this email.</p>
                                            <p style="margin:0;">&copy; {{ date('Y') }} Top Link Global College, Inc.</p>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>

</body>
</html>
