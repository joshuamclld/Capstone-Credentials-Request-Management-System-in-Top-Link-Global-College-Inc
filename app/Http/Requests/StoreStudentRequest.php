<?php

namespace App\Http\Requests;

use App\Models\Document;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreStudentRequest extends FormRequest
{
    private const VALID_SEMESTER_COMBOS = [
        '1st Year - 1st Semester',
        '1st Year - 2nd Semester',
        '2nd Year - 1st Semester',
        '2nd Year - 2nd Semester',
        '3rd Year - 1st Semester',
        '3rd Year - 2nd Semester',
    ];

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'fullName' => 'required|string|max:255',
            'studentId' => 'required|string|max:50',
            'contactNo' => 'required|string|max:20',
            'email' => 'required|email|max:255',
            'course' => 'required|string|max:255',
            'selectedDocs' => 'required|array|min:1',
            'selectedDocs.*' => 'required|string|exists:documents,code,is_active,1',
            'selectedSemesters' => 'nullable|array',
            'selectedSemesters.*' => ['string', Rule::in(self::VALID_SEMESTER_COMBOS)],
            'pages' => 'nullable|integer|min:1',
            'paymentMethod' => 'required|string|in:cash,online',
            'deliveryType' => 'sometimes|string|in:pickup',
            'wantDigitalCopy' => 'sometimes|boolean',
            'purpose' => 'required|string|max:1000',
            'yearLevel' => 'required|string|in:1st Year,2nd Year,3rd Year',
            'section' => 'required|string|in:A,B,C,D,E,F,G,H',
        ];
    }

    public function messages(): array
    {
        return [
            'selectedDocs.required' => 'Please select at least one document.',
            'selectedDocs.min' => 'Please select at least one document.',
            'selectedDocs.*.exists' => 'Invalid document type selected.',
            'selectedSemesters.*.in' => 'Invalid year-semester combination.',
            'paymentMethod.required' => 'Please select a payment method.',
            'paymentMethod.in' => 'Invalid payment method selected.',
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $codes = $this->input('selectedDocs');
            if (!$codes) return;

            $docs = Document::whereIn('code', $codes)->get();

            $hasSemesterDoc = $docs->contains('is_per_semester', true);
            $hasPerPageDoc = $docs->contains('is_per_page', true);

            if ($hasSemesterDoc && empty($this->input('selectedSemesters'))) {
                $validator->errors()->add('selectedSemesters', 'Please select at least one year-semester combination for the selected document.');
            }

            if ($hasPerPageDoc && !$this->input('pages')) {
                $validator->errors()->add('pages', 'Please specify the number of pages for this document.');
            }

        });
    }
}
