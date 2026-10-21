<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Encryption\Encrypter;
use Illuminate\Support\Facades\DB;

$keys = [
    'brella' => 'base64:bya4u6Wpz5SmdqBa8TpsoOE/CFklWwTnbUpBcz8nf+4=',
    'canvdesign' => 'base64:At01OhvHUyBxCZQXCMJhBSYRvLArY1YRckpgZzbngbM=',
    'credimoto' => 'base64:4+eH2/el/WRb6uuxzx1ja19fX2MMTvXNOeWxh/Bxr4U=',
    'driscolls' => 'base64:hge9VyDRJUs6DeJQDS4GXq7R7yC3lQ5rylUO/LrHvzk=',
    'educore' => 'base64:7bU2H/4m5PbLWtvstVVNT3u3AdCQBxjO0QmA9CueD9I=',
    'educores' => 'base64:OxxGLiJcuEpPIFYUU41dTv9d1HfMrJ2+AF0I0ogRfiQ=',
    'fixsalePOS' => 'base64:YTcfYBt0HTdcepgjxxS4DGXDKLmTJg0WszLkncSvOnM=',
    'larabase' => 'base64:wnl02AuPYet5re/unwEksH0YuRpaaTsDKUkhM+8YpsM=',
    'mmmvenezuela' => 'base64:KVm6VPX6wqzJ1pdzVfNHGEnzBZuyD3eSAU7I2Kylz94=',
    'pupilainc' => 'base64:1cxe2OJu5Zv8V+x9JUWf98aTKo5KHAxRbOSLPtTj8Yw=',
    'quadralo' => 'base64:FRYZ7XRDFzNGs7h9AfPW43U/VfxixocRwvxxKrWNRlU=',
    'quotas' => 'base64:OVWI1nJnV4XnC+GL6cY/JAmUng4AR9JgB3010uQoYtM=',
    'shigoto' => 'base64:tIDjeQ9CqFDKsnwY4pJFEA4K0FIM7z+OaO+s78ZLdak=',
    'smurfit' => 'base64:wqkKZUdN6Ai98bC2UK+HtRKGbP+mdeJ2z8eqcrpQCmY=',
    'theizerdev' => 'base64:ylpgo4t5RXRJl3LM8jY3Dbe2C6p80z3HFI+lBNvGwNU=',
    'vargasCentro' => 'base64:ojeqKv3eS38lUxF8M4zUe7G3ooGhXpj/V2VfN6e7Lws=',
];

$raw = DB::table('empresas')->where('id', 1)->first();

foreach ($keys as $name => $key) {
    $rawKey = base64_decode(substr($key, 7));
    $encrypter = new Encrypter($rawKey, 'aes-256-cbc');
    try {
        $val = $encrypter->decryptString($raw->biotime_password);
        echo "MATCH FOUND with key '$name' ($key)!\n";
        echo "biotime_password: $val\n";
        exit(0);
    } catch (Throwable $e) {
        // failed
    }
}

echo "None of the keys matched.\n";

