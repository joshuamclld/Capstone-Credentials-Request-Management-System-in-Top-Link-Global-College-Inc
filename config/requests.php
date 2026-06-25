<?php

return [
    // All valid lifecycle statuses a request can be in (Cancelled is handled separately in code)
    'statuses' => ['Pending', 'Processing', 'Release', 'Claimed'],

    // Forward direction: the normal order a request progresses through
    'transitions' => [
        'Pending' => 'Processing',
        'Processing' => 'Release',
        'Release' => 'Claimed',
    ],

    // Reverse direction: allows reverting to the previous step if a mistake was made
    'reverse_transitions' => [
        'Processing' => 'Pending',
        'Release' => 'Processing',
        'Claimed' => 'Release',
    ],

    // Number of items per page for all paginated request tables
    'per_page' => env('REQUESTS_PER_PAGE', 10),

    // The payment status value that means the payment was successfully verified
    'paid_status' => 'paid',
];
