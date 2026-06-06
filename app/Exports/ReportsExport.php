<?php

namespace App\Exports;

use App\Models\Document;
use App\Models\StudentRequest;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Style\Font;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ReportsExport implements FromCollection, WithHeadings, WithMapping, WithColumnWidths, WithStyles
{
    protected string $month;
    protected string $year;
    protected ?string $status;
    protected ?string $paymentStatus;

    public function __construct(string $month, string $year, ?string $status = null, ?string $paymentStatus = null)
    {
        $this->month = $month;
        $this->year = $year;
        $this->status = $status;
        $this->paymentStatus = $paymentStatus;
    }

    public function collection(): Collection
    {
        $query = StudentRequest::query();

        if ($this->month && $this->month !== 'all') {
            $query->whereMonth('created_at', $this->month);
        }

        if ($this->year && $this->year !== 'all') {
            $query->whereYear('created_at', $this->year);
        }

        if ($this->status && $this->status !== 'all') {
            $query->where('status', $this->status);
        }

        if ($this->paymentStatus && $this->paymentStatus !== 'all') {
            $query->where('payment_status', $this->paymentStatus);
        }

        return $query->latest()->get();
    }

    public function headings(): array
    {
        return [
            'Request ID',
            'Tracking Number',
            'Student Name',
            'Student Number',
            'Course',
            'Requested Documents',
            'Payment Method',
            'Payment Status',
            'Request Status',
            'Total Fee',
            'Verified By',
            'Verified At',
            'Created Date',
        ];
    }

    public function map($request): array
    {
        $documents = Document::whereIn('code', $request->document_ids ?? [])->get()->keyBy('code');
        $documentNames = collect($request->document_ids ?? [])
            ->map(fn ($code) => $documents->get($code)?->name ?? $code)
            ->implode(', ');

        return [
            $request->id,
            $request->tracking_number,
            $request->full_name,
            $request->student_number,
            $request->course,
            $documentNames,
            ucfirst(str_replace('_', ' ', $request->payment_method)),
            ucfirst(str_replace('_', ' ', $request->payment_status)),
            $request->status,
            number_format((float) $request->total_fee, 2),
            $request->verified_by ?? 'N/A',
            $request->verified_at ? $request->verified_at->format('Y-m-d H:i:s') : 'N/A',
            $request->created_at->format('Y-m-d'),
        ];
    }

    public function columnWidths(): array
    {
        return [
            'A' => 12,
            'B' => 24,
            'C' => 30,
            'D' => 18,
            'E' => 24,
            'F' => 40,
            'G' => 18,
            'H' => 20,
            'I' => 20,
            'J' => 14,
            'K' => 24,
            'L' => 22,
            'M' => 14,
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => ['font' => ['bold' => true, 'size' => 11]],
        ];
    }
}
