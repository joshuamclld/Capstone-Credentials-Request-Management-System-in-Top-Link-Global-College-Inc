<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class DatabaseBackup extends Command
{
    protected $signature = 'db:backup {--keep=7 : Number of recent backups to keep}';

    protected $description = 'Dump the MySQL database to a backup file and restore into a replica database';

    public function handle(): int
    {
        $db = config('database.connections.mysql');
        $filename = 'backup-' . now()->format('Y-m-d-His') . '.sql';
        $disk = 'local';

        Storage::disk($disk)->makeDirectory('backups');

        $path = Storage::disk($disk)->path('backups/' . $filename);

        $this->info('Dumping primary database...');

        $dumpCommand = sprintf(
            'mysqldump --user=%s --password=%s --host=%s --port=%s %s > %s 2>/dev/null',
            escapeshellarg($db['username']),
            escapeshellarg($db['password']),
            escapeshellarg($db['host']),
            escapeshellarg($db['port'] ?? '3306'),
            escapeshellarg($db['database']),
            escapeshellarg($path)
        );

        $output = null;
        $resultCode = null;
        exec($dumpCommand, $output, $resultCode);

        if ($resultCode !== 0) {
            $this->error('Backup dump failed.');
            return self::FAILURE;
        }

        $this->info("Dumped to: storage/app/private/backups/{$filename}");

        $backupDb = env('DB_BACKUP_DATABASE', $db['database'] . '_backup');

        $this->info("Restoring into replica database: {$backupDb}...");

        $restoreCommand = sprintf(
            'mysql --user=%s --password=%s --host=%s --port=%s %s < %s 2>/dev/null',
            escapeshellarg($db['username']),
            escapeshellarg($db['password']),
            escapeshellarg($db['host']),
            escapeshellarg($db['port'] ?? '3306'),
            escapeshellarg($backupDb),
            escapeshellarg($path)
        );

        $output = null;
        $resultCode = null;
        exec($restoreCommand, $output, $resultCode);

        if ($resultCode !== 0) {
            $this->error('Replica restore failed.');
            return self::FAILURE;
        }

        $this->info("Replica database {$backupDb} updated successfully.");

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
