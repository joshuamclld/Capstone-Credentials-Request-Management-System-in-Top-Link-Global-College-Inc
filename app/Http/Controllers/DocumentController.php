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

        return response()->json(
            Document::where('is_active', true)->get()
        );
    }
}
