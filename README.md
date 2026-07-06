# LaraReact

![LaraReact Logo](public/image/logo/larareact_full_logo.jpg)

Base interface package for Laravel + React + shadcn/ui admin systems.

## Installation

Install the package via Composer:

```bash
composer require theizerdev/larareact
```

After installing the package, run the install command:

```bash
php artisan larareact:install
```

This command will:

- Publish the LaraReact configuration file
- Publish the React components and CSS assets
- Install Node.js dependencies
- Build the production assets

## Manual Setup

If you prefer to set up manually, publish the assets:

```bash
php artisan vendor:publish --tag=larareact-config
php artisan vendor:publish --tag=larareact-assets
php artisan vendor:publish --tag=larareact-css
```

Then install and build the frontend assets:

```bash
npm install
npm run build
```

## Features

- Authentication pages (login, forgot password, reset password)
- Dark sidebar admin layout with collapsible navigation
- Header navbar with notifications, theme toggle and user menu
- shadcn/ui components (Card, Input, Label, Button, DatePicker, etc.)
- Notification mixin using Sonner
- Profile, security and appearance settings pages

## Requirements

- PHP ^8.3
- Laravel ^11.0
- Node.js ^20.0

## License

MIT
