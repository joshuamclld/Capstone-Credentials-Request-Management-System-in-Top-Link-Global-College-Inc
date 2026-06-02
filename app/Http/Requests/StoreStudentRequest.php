<?php

namespace App\Http\Requests;

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
            'selectedDoc' => 'required|string|exists:documents,code',
            'selectedSemesters' => 'nullable|array',
            'selectedSemesters.*' => ['string', Rule::in(self::VALID_SEMESTER_COMBOS)],
            'purpose' => 'required|string|max:1000',
        ];
    }

    public function messages(): array
    {
        return [
            'selectedDoc.required' => 'Please select a document.',
            'selectedDoc.exists' => 'Invalid document type selected.',
            'selectedSemesters.*.in' => 'Invalid year-semester combination.',
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            if ($this->input('selectedDoc') === 'grades' && empty($this->input('selectedSemesters'))) {
                $validator->errors()->add('selectedSemesters', 'Please select at least one year-semester combination for Certificate of Grades.');
            }
        });
    }
}
