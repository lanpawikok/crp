<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminMiddleware
{
   public function handle(Request $request, Closure $next)
{
    if (!auth()->check() || auth()->user()->email !== 'admin@notracefi.test') {
        return redirect('/'); // Lempar balik ke halaman utama jika bukan admin
    }
    return $next($request);
}
}
