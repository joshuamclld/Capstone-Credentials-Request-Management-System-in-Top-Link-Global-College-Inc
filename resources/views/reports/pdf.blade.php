<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'DejaVu Sans', sans-serif; font-size: 9px; color: #1e293b; margin: 24px; }
        h1 { font-size: 18px; color: #065f46; margin: 0 0 2px 0; }
        .subtitle { font-size: 12px; color: #64748b; margin-bottom: 4px; }
        .meta { font-size: 9px; color: #94a3b8; margin-bottom: 16px; }
        .summary { display: flex; gap: 24px; margin-bottom: 16px; }
        .summary-item { background: #f1f5f9; padding: 8px 14px; border-radius: 6px; }
        .summary-item .label { font-size: 8px; color: #64748b; text-transform: uppercase; }
        .summary-item .value { font-size: 14px; font-weight: bold; color: #065f46; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #065f46; color: white; padding: 6px 8px; text-align: left; font-size: 8px; text-transform: uppercase; }
        td { padding: 5px 8px; border-bottom: 1px solid #e2e8f0; }
        tr:nth-child(even) td { background: #f8fafc; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .footer { margin-top: 20px; font-size: 8px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 8px; }
    </style>
</head>
<body>
    <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 8px;">
        @if($logoSrc)
            <img src="{{ $logoSrc }}" alt="Logo" style="width: 40px; height: 40px; object-fit: contain;">
        @endif
        <div>
            <h1>TLGC Credentials Request Management System</h1>
            <div class="subtitle">Reports &amp; Analytics</div>
        </div>
    </div>
    <div class="meta">Generated: {{ $generatedAt }}</div>

    <div class="summary">
        <div class="summary-item">
            <div class="label">Total Requests</div>
            <div class="value">{{ $totalRequests }}</div>
        </div>
        <div class="summary-item">
            <div class="label">Paid</div>
            <div class="value">{{ $totalPaid }}</div>
        </div>
        <div class="summary-item">
            <div class="label">Total Revenue</div>
            <div class="value">₱{{ number_format($totalRevenue, 2) }}</div>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>Tracking #</th>
                <th>Student Name</th>
                <th>Student #</th>
                <th>Course</th>
                <th>Documents</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Fee</th>
                <th>Verified By</th>
                <th>Date</th>
            </tr>
        </thead>
        <tbody>
            @forelse($requests as $i => $req)
            <tr>
                <td>{{ $req->id }}</td>
                <td>{{ $req->tracking_number }}</td>
                <td>{{ $req->full_name }}</td>
                <td>{{ $req->student_number }}</td>
                <td>{{ $req->course }}</td>
                <td>{{ $req->documents->pluck('name')->implode(', ') }}</td>
                <td>{{ ucfirst(str_replace('_', ' ', $req->payment_status)) }}</td>
                <td>{{ $req->status }}</td>
                <td class="text-right">₱{{ number_format((float) $req->total_fee, 2) }}</td>
                <td>{{ $req->verified_by ?? '—' }}</td>
                <td>{{ $req->created_at->format('Y-m-d') }}</td>
            </tr>
            @empty
            <tr><td colspan="11" class="text-center" style="color: #94a3b8; padding: 20px;">No data available.</td></tr>
            @endforelse
        </tbody>
    </table>

    <div class="footer">TLGC Credentials Request Management System &mdash; {{ $generatedAt }}</div>
</body>
</html>
