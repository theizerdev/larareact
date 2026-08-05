<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetPermissionsTeam
{
    /**
     * Handle an incoming request and set Spatie permissions team_id to user's empresa_id.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($user = $request->user()) {
            setPermissionsTeamId($user->empresa_id);
        }

        return $next($request);
    }
}
