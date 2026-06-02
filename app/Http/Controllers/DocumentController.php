<?php

namespace App\Http\Controllers;

use App\Models\Document;

class DocumentController extends Controller
{
    public function index()
    {
        return response()->json(
            Document::where('is_active', true)->get()
        );
    }
}
