<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title>{{ config('app.name', 'CRMS') }}</title>

        @fonts
        @vite(['resources/css/app.css', 'resources/js/app.jsx'])
    </head>
    <body>
        <div id="app"></div>
        <noscript>
            <div style="padding: 1rem; font-family: sans-serif;">
                JavaScript is required to use CRMS.
            </div>
        </noscript>
    </body>
</html>
