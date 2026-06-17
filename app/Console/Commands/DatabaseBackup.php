<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class DatabaseBackup extends Command
{
    protected $signature = 'db:backup {--keep=7 : Number of recent backups to keep}';

    protected $description = 'Dump the MySQL database to a backup file in storage/app/backups';

    public function handle(): int
    {
        $db = config('database.connections.mysql');
        $filename = 'backup-' . now()->format('Y-m-d-His') . '.sql';
        $disk = 'local';

        Storage::disk($disk)->makeDirectory('backups');

        $path = Storage::disk($disk)->path('backups/' . $filename);

        $command = sprintf(
            'mysqldump --user=%s --password=%s --host=%s --port=%s %s > %s 2>&1',
            escapeshellarg($db['username']),
            escapeshellarg($db['password']),
            escapeshellarg($db['host']),
            escapeshellarg($db['port'] ?? '3306'),
            escapeshellarg($db['database']),
            escapeshellarg($path)
        );

        $output = null;
        $resultCode = null;
        exec($command, $output, $resultCode);

        if ($resultCode !== 0) {
            $this->error('Backup failed: ' . implode("\n", $output));
            return self::FAILURE;
        }

        $this->info("Database dumped to: storage/app/private/backups/{$filename}");

        $keep = (int) $this->option('keep');
        $files = collect(Storage::disk($disk)->files('backups'))
            ->filter(fn ($f) => str_starts_with(basename($f), 'backup-'))
            ->sort()
            ->values();

        if ($files->count() > $keep) {
            $toDelete = $files->slice(0, $files->count() - $keep);
            Storage::disk($disk)->delete($toDelete->toArray());
            $this->info('Cleaned up ' . $toDelete->count() . ' old backup(s).');
        }

        return self::SUCCESS;
    }
}
