<?php

return [
    'statuses' => ['Pending', 'Processing', 'Ready for Release', 'Claimed'],

    'transitions' => [
        'Pending' => 'Processing',
        'Processing' => 'Ready for Release',
        'Ready for Release' => 'Claimed',
    ],

    'reverse_transitions' => [
        'Processing' => 'Pending',
        'Ready for Release' => 'Processing',
        'Claimed' => 'Ready for Release',
    ],

    'per_page' => env('REQUESTS_PER_PAGE', 10),

    'paid_status' => 'paid',
];
