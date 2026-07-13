<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Visit;
use App\Models\Message;
use App\Models\Project;
use App\Models\Skill;
use App\Models\Experience;
use App\Models\Client;

use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $startDateStr = $request->query('start_date');
        $endDateStr = $request->query('end_date');

        if ($startDateStr && $endDateStr) {
            $startDate = \Carbon\Carbon::parse($startDateStr)->startOfDay();
            $endDate = \Carbon\Carbon::parse($endDateStr)->endOfDay();
        } else {
            $startDate = now()->subDays(30)->startOfDay();
            $endDate = now()->endOfDay();
        }

        // Calculate length of the range in days
        $days = $startDate->diffInDays($endDate) ?: 1;

        // Current range visits
        $currentVisits = Visit::whereBetween('created_at', [$startDate, $endDate])->count();

        // Previous range visits
        $prevStartDate = $startDate->copy()->subDays($days);
        $prevEndDate = $startDate->copy();
        $prevVisits = Visit::whereBetween('created_at', [$prevStartDate, $prevEndDate])->count();

        if ($prevVisits > 0) {
            $visitsChange = round((($currentVisits - $prevVisits) / $prevVisits) * 100, 1);
            $visitsTrendSign = $visitsChange >= 0 ? '+' : '';
            $visitsChangeFormatted = $visitsTrendSign . $visitsChange . '%';
            $trendDirection = $visitsChange >= 0 ? 'up' : 'down';
        } else {
            $visitsChangeFormatted = $currentVisits > 0 ? '+100%' : '0%';
            $trendDirection = 'up';
        }

        // Daily visits for chart in the selected range
        $visitsTrendData = Visit::whereBetween('created_at', [$startDate, $endDate])
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
        // Loop through each day from start_date to end_date
        $tempDate = $startDate->copy();
        while ($tempDate->lte($endDate)) {
            $dateKey = $tempDate->format('Y-m-d');
            $chartData[] = [
                'date' => $tempDate->format('d M'),
                'count' => $visitsTrendMap[$dateKey] ?? 0,
            ];
            $tempDate = $tempDate->addDay();
        }

        // Messages count in range
        $messagesTotal = Message::whereBetween('created_at', [$startDate, $endDate])->count();
        $messagesUnread = Message::where('is_read', false)->count(); // Keep general unread count

        // Other global portfolio counts
        $stats = [
            'visits_total' => Visit::count(), // keep total visits for context
            'visits_last_30_days' => $currentVisits, // current selected range visits
            'visits_change' => $visitsChangeFormatted,
            'visits_trend' => $trendDirection,
            'projects_count' => Project::count(),
            'skills_count' => Skill::count(),
            'experiences_count' => Experience::count(),
            'clients_count' => Client::count(),
            'messages_total' => $messagesTotal,
            'messages_unread' => $messagesUnread,
        ];

        // Fetch recent messages in range
        $recentMessages = Message::whereBetween('created_at', [$startDate, $endDate])
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();

        return inertia('Admin/dashboard', [
            'stats' => $stats,
            'chartData' => $chartData,
            'recentMessages' => $recentMessages,
            'filters' => [
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d'),
            ],
        ]);
    }
}

