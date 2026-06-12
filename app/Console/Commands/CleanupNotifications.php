<?php

namespace App\Console\Commands;

use App\Models\Notification;
use Illuminate\Console\Command;

class CleanupNotifications extends Command
{
    protected $signature = 'notifications:cleanup {--days=90 : Delete notifications older than this many days}';
    protected $description = 'Delete read notifications older than the specified number of days';

    public function handle()
    {
        $days = (int) $this->option('days');
        $cutoff = now()->subDays($days);

        $deleted = Notification::where('is_read', true)
            ->where('created_at', '<', $cutoff)
            ->delete();

        $this->info("Deleted {$deleted} read notification(s) older than {$days} days.");

        return 0;
    }
}
