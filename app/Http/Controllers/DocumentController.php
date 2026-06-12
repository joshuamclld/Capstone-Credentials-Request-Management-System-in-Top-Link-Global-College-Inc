<?php

namespace App\Http\Controllers;

use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class DocumentController extends Controller
{
    public function index(Request $request)
    {
        if (!$request->expectsJson()) {
            return view('welcome');
        }

        $documents = Document::where('is_active', true)->get();
        $onlinePaymentEnabled = Cache::get('enable_online_payment', true);

        return response()->json([
            'documents' => $documents,
            'online_payment_enabled' => $onlinePaymentEnabled,
        ]);
    }
}
