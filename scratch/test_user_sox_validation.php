<?php
require dirname(__DIR__) . '/vendor/autoload.php';
$app = require_once dirname(__DIR__) . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$admin = App\Models\User::first();
auth()->login($admin);

// Try creating with compliant 16-character password
$req = Illuminate\Http\Request::create('/admin/usuarios', 'POST', [
    'name' => 'Test SOX Compliant User',
    'email' => 'sox_user@example.com',
    'password' => 'StrongP@ssw0rd!2026',
    'status' => 'activo',
]);
$req->setUserResolver(fn() => $admin);

$controller = new App\Http\Controllers\Admin\UserController();
try {
    $controller->store($req);
    $created = App\Models\User::where('email', 'sox_user@example.com')->first();
    echo "SUCCESS! Created user with SOX baseline:\n";
    echo "Password changed at: " . $created->password_changed_at . "\n";
    echo "History count: " . $created->passwordHistories()->count() . "\n";
    echo "Days until expires: " . $created->daysUntilPasswordExpires() . "\n";

    // Clean up test user
    $created->delete();
} catch (\Illuminate\Validation\ValidationException $e) {
    echo "FAILED: " . json_encode($e->errors()) . "\n";
}
