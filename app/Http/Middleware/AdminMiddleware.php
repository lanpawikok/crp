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
        return redirect('/'); // Redirect back to the main page if not an admin
    }
    return $next($request);
}
}
