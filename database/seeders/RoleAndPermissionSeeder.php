<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleAndPermissionSeeder extends Seeder
{
    public function run(): void
    {
        app()->make(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();

        // Registrar permissions
        Permission::firstOrCreate(['name' => 'view_requests', 'guard_name' => 'web']);
        Permission::firstOrCreate(['name' => 'process_requests', 'guard_name' => 'web']);
        Permission::firstOrCreate(['name' => 'release_credentials', 'guard_name' => 'web']);
        Permission::firstOrCreate(['name' => 'update_request_status', 'guard_name' => 'web']);

        // Cashier permissions
        Permission::firstOrCreate(['name' => 'view_payments', 'guard_name' => 'web']);
        Permission::firstOrCreate(['name' => 'verify_payments', 'guard_name' => 'web']);
        Permission::firstOrCreate(['name' => 'update_payment_status', 'guard_name' => 'web']);

        // System Admin permissions
        Permission::firstOrCreate(['name' => 'manage_users', 'guard_name' => 'web']);
        Permission::firstOrCreate(['name' => 'manage_documents', 'guard_name' => 'web']);
        Permission::firstOrCreate(['name' => 'view_reports', 'guard_name' => 'web']);
        Permission::firstOrCreate(['name' => 'manage_settings', 'guard_name' => 'web']);
        Permission::firstOrCreate(['name' => 'view_audit_logs', 'guard_name' => 'web']);

        // Registrar role
        $registrar = Role::firstOrCreate(['name' => 'registrar', 'guard_name' => 'web']);
        $registrar->syncPermissions([
            'view_requests',
            'process_requests',
            'release_credentials',
            'update_request_status',
        ]);

        // Cashier role
        $cashier = Role::firstOrCreate(['name' => 'cashier', 'guard_name' => 'web']);
        $cashier->syncPermissions([
            'view_payments',
            'verify_payments',
            'update_payment_status',
        ]);

        // System Admin role
        $systemAdmin = Role::firstOrCreate(['name' => 'system_admin', 'guard_name' => 'web']);
        $systemAdmin->syncPermissions([
            'manage_users',
            'manage_documents',
            'view_reports',
            'manage_settings',
            'view_audit_logs',
        ]);

        $this->command->info('Roles and permissions seeded successfully.');
    }
}
