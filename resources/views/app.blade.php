<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>No Trace</title>

    <!-- PANGGIL MATERIAL SYMBOLS DI SINI -->
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" />

    @viteReactRefresh
    @vite(['resources/js/app.jsx'])
</head>
<body class="bg-[#09090B]">
    @inertia <!-- atau <div id="app"></div> jika SPA murni -->
</body>
</html>