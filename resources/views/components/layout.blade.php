<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
    <title>{{ $title ?? 'Typing Dino' }}</title>
    <meta name="description" content="Typing Dino - Game typing test pixel art bergaya dino runner, uji kecepatan dan akurasi mengetikmu!">
    <link rel="icon" type="image/png" href="{{ asset('assets/images/icon.png') }}">
    @vite(['resources/css/app.css', 'resources/js/app.js', 'resources/js/game.js', 'resources/js/landing-demo.js'])
</head>
<body>
    {{ $slot }}
</body>
</html>
