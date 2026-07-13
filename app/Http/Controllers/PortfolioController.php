<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;
use App\Models\Skill;
use App\Models\Project;
use App\Models\About;
use App\Models\Experience;
use App\Models\Visit;
use App\Models\Client;
use Illuminate\Support\Facades\Route;

class PortfolioController extends Controller
{
    /**
     * Display the public portfolio page with dynamic database data.
     */
    public function index(): Response
    {
        // Record visit
        Visit::create([
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);

        $about = About::first();
        $projects = Project::orderBy('order', 'asc')->get();
        $skills = Skill::all()->groupBy('category');
        $experiences = Experience::orderBy('start_date', 'desc')->get();
        $clients = Client::orderBy('order', 'asc')->get();

        return Inertia::render('welcome', [
            'about' => $about,
            'projects' => $projects,
            'skills' => $skills,
            'experiences' => $experiences,
            'clients' => $clients,
            'canLogin' => Route::has('login'),
        ]);
    }
}
