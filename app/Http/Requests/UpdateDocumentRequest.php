<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'code' => ['sometimes', 'string', 'max:50', Rule::unique('documents', 'code')->ignore($this->route('id'))],
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'price' => 'sometimes|numeric|min:0',
            'is_per_semester' => 'sometimes|boolean',
            'is_per_page' => 'sometimes|boolean',
            'processing_days' => 'sometimes|integer|min:1',
            'is_active' => 'sometimes|boolean',
        ];
    }
}
