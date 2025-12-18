<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Job;
use App\Models\Report;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;

class FinalizeReportTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create roles
        Role::create(['name' => 'admin']);
        Role::create(['name' => 'user']);
    }

    public function test_admin_can_finalize_report()
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        
        $user = User::factory()->create();
        $job = Job::factory()->create(['user_id' => $user->id]);
        $report = Report::factory()->create([
            'job_id' => $job->id,
            'user_id' => $user->id,
            'status' => 'draft'
        ]);

        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/finalize-report', [
            'report_id' => $report->id
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'message' => 'Report byl úspěšně finalizován',
            'job_id' => $job->id
        ]);

        $this->assertDatabaseHas('reports', [
            'id' => $report->id,
            'status' => 'finalized'
        ]);
    }

    public function test_job_owner_can_finalize_report()
    {
        $user = User::factory()->create();
        $job = Job::factory()->create(['user_id' => $user->id]);
        $report = Report::factory()->create([
            'job_id' => $job->id,
            'user_id' => $user->id,
            'status' => 'draft'
        ]);

        Sanctum::actingAs($user);

        $response = $this->postJson('/api/finalize-report', [
            'report_id' => $report->id
        ]);

        $response->assertStatus(200);
    }

    public function test_assigned_user_can_finalize_report()
    {
        $owner = User::factory()->create();
        $assigned = User::factory()->create();
        $job = Job::factory()->create([
            'user_id' => $owner->id,
            'assigned_user_id' => $assigned->id
        ]);
        $report = Report::factory()->create([
            'job_id' => $job->id,
            'user_id' => $assigned->id,
            'status' => 'draft'
        ]);

        Sanctum::actingAs($assigned);

        $response = $this->postJson('/api/finalize-report', [
            'report_id' => $report->id
        ]);

        $response->assertStatus(200);
    }

    public function test_unauthorized_user_cannot_finalize_report()
    {
        $owner = User::factory()->create();
        $unauthorized = User::factory()->create();
        $job = Job::factory()->create(['user_id' => $owner->id]);
        $report = Report::factory()->create([
            'job_id' => $job->id,
            'user_id' => $owner->id,
            'status' => 'draft'
        ]);

        Sanctum::actingAs($unauthorized);

        $response = $this->postJson('/api/finalize-report', [
            'report_id' => $report->id
        ]);

        $response->assertStatus(403);
        $response->assertJson([
            'error' => 'Nemáte oprávnění k finalizaci tohoto reportu'
        ]);
    }

    public function test_finalize_report_requires_valid_report_id()
    {
        $user = User::factory()->create();
        
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/finalize-report', [
            'report_id' => 999999
        ]);

        $response->assertStatus(422);
    }
}