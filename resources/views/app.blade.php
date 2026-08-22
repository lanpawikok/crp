<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <!-- Logo / Favicon untuk Tab Browser -->
    <link rel="icon" type="image/jpeg" href="{{ asset('img/notracefi.jpeg') }}">

    <title>No Trace</title>

    <!-- PANGGIL MATERIAL SYMBOLS DI SINI -->
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" />

    @viteReactRefresh
    @vite(['resources/js/app.jsx'])
</head>
<body class="bg-[#09090B] text-white">
    @inertia 
</body>
</html>