<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <!-- Logo / Favicon for the Browser Tab -->
    <link rel="icon" type="image/jpeg" href="{{ asset('img/notracefi.jpeg') }}">

    <title>No Trace</title>

    <!-- LOAD MATERIAL SYMBOLS HERE -->
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" />

    <!-- LOAD FONTS (Sora & Inter for the landing page) -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&family=Inter:wght@400;500&display=swap" />

    @viteReactRefresh
    @vite(['resources/js/app.jsx'])
</head>
<body class="bg-[#09090B] text-white">
    @inertia 
</body>
</html>