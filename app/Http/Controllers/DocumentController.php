<?php

namespace App\Http\Controllers;

use App\Models\Document;
use Illuminate\Http\Request;

class DocumentController extends Controller
{
    public function index(Request $request)
    {
        if (!$request->expectsJson()) {
            return view('welcome');
        }

        $documents = Document::where('is_active', true)->get();

        return response()->json([
            'documents' => $documents,
        ]);
    }
}
