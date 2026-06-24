<?php

return [
    'statuses' => ['Pending', 'Processing', 'Release', 'Claimed'],

    'transitions' => [
        'Pending' => 'Processing',
        'Processing' => 'Release',
        'Release' => 'Claimed',
    ],

    'reverse_transitions' => [
        'Processing' => 'Pending',
        'Release' => 'Processing',
        'Claimed' => 'Release',
    ],

    'per_page' => env('REQUESTS_PER_PAGE', 10),

    'paid_status' => 'paid',
];
