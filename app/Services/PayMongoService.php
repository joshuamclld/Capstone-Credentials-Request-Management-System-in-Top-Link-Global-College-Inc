<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class PayMongoService
{
    protected string $secretKey;
    protected string $baseUrl = 'https://api.paymongo.com/v1';

    public function __construct()
    {
        $this->secretKey = config('services.paymongo.secret_key');
    }

    public function createCheckoutSession(array $data): array
    {
        $response = Http::withBasicAuth($this->secretKey, '')
            ->post("{$this->baseUrl}/checkout_sessions", [
                'data' => [
                    'attributes' => [
                        'billing' => [
                            'name' => $data['name'],
                            'email' => $data['email'],
                        ],
                        'line_items' => [
                            [
                                'currency' => 'PHP',
                                'amount' => (int) round($data['amount'] * 100),
                                'name' => $data['description'],
                                'quantity' => 1,
                            ],
                        ],
                        'payment_method_types' => ['gcash', 'paymaya', 'card', 'grab_pay'],
                        'success_url' => $data['success_url'],
                        'cancel_url' => $data['cancel_url'],
                        'metadata' => [
                            'tracking_number' => $data['tracking_number'],
                        ],
                    ],
                ],
            ]);

        if (!$response->successful()) {
            throw new \RuntimeException(
                $response->json()['errors'][0]['detail'] ?? 'PayMongo: Failed to create checkout session'
            );
        }

        return $response->json()['data'];
    }

    public function retrieveCheckoutSession(string $sessionId): array
    {
        $response = Http::withBasicAuth($this->secretKey, '')
            ->get("{$this->baseUrl}/checkout_sessions/{$sessionId}");

        if (!$response->successful()) {
            throw new \RuntimeException('PayMongo: Failed to retrieve checkout session');
        }

        return $response->json()['data'];
    }
}
