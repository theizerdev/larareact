<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Visit;
use App\Models\Message;
use App\Models\Project;
use App\Models\Skill;
use App\Models\Experience;
use App\Models\Client;

class DashboardController extends Controller
{
    public function index()
    {
        // 30 Days Visit Metrics
        $last30DaysVisits = Visit::where('created_at', '>=', now()->subDays(30))->count();
        $prev30DaysVisits = Visit::whereBetween('created_at', [now()->subDays(60), now()->subDays(30)])->count();
        
        if ($prev30DaysVisits > 0) {
            $visitsChange = round((($last30DaysVisits - $prev30DaysVisits) / $prev30DaysVisits) * 100, 1);
            $visitsTrendSign = $visitsChange >= 0 ? '+' : '';
            $visitsChangeFormatted = $visitsTrendSign . $visitsChange . '%';
            $trendDirection = $visitsChange >= 0 ? 'up' : 'down';
        } else {
            $visitsChangeFormatted = $last30DaysVisits > 0 ? '+100%' : '0%';
            $trendDirection = 'up';
        }

        // Daily Visits for Last 30 Days Chart
        $visitsTrendData = Visit::where('created_at', '>=', now()->subDays(30))
            ->selectRaw('DATE(created_at) as date, COUNT(*) as count')
            ->groupBy('date')
            ->orderBy('date', 'asc')
            ->get();

        $visitsTrendMap = [];
        foreach ($visitsTrendData as $row) {
            $dateKey = date('Y-m-d', strtotime($row->date));
            $visitsTrendMap[$dateKey] = $row->count;
        }

        $chartData = [];
        for ($i = 29; $i >= 0; $i--) {
            $dateObj = now()->subDays($i);
            $dateKey = $dateObj->format('Y-m-d');
            $chartData[] = [
                'date' => $dateObj->format('d M'),
                'count' => $visitsTrendMap[$dateKey] ?? 0,
            ];
        }

        // Compilation of stats
        $stats = [
            'visits_total' => Visit::count(),
            'visits_last_30_days' => $last30DaysVisits,
            'visits_change' => $visitsChangeFormatted,
            'visits_trend' => $trendDirection,
            'projects_count' => Project::count(),
            'skills_count' => Skill::count(),
            'experiences_count' => Experience::count(),
            'clients_count' => Client::count(),
            'messages_total' => Message::count(),
            'messages_unread' => Message::where('is_read', false)->count(),
        ];

        // Fetch recent messages
        $recentMessages = Message::orderBy('created_at', 'desc')->take(5)->get();

        return inertia('Admin/dashboard', [
            'stats' => $stats,
            'chartData' => $chartData,
            'recentMessages' => $recentMessages,
        ]);
    }
}

