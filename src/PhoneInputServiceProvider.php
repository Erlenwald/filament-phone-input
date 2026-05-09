<?php

namespace Erlenwald\FilamentPhoneInput;

use Filament\Support\Assets\Css;
use Filament\Support\Assets\Js;
use Filament\Support\Facades\FilamentAsset;
use Illuminate\Support\ServiceProvider;

class PhoneInputServiceProvider extends ServiceProvider
{
    protected const PACKAGE = 'erlenwald/filament-phone-input';

    protected const NAMESPACE = 'erlenwald-filament-phone-input';

    protected const PUBLIC_VENDOR_PATH = 'vendor/erlenwald/filament-phone-input';

    protected const CUSTOM_CSS_PATH = 'css/vendor/erlenwald/filament-phone-input/phone-input.css';

    public function boot(): void
    {
        $this->loadViewsFrom(__DIR__ . '/../resources/views', self::NAMESPACE);
        $this->loadTranslationsFrom(__DIR__ . '/lang', self::NAMESPACE);

        $this->registerPublishing();
        $this->registerAssets();
    }

    protected function registerPublishing(): void
    {
        $flags = [
            __DIR__ . '/../resources/flags' => public_path(self::PUBLIC_VENDOR_PATH . '/flags'),
        ];

        $translations = [
            __DIR__ . '/lang' => lang_path('vendor/' . self::NAMESPACE),
        ];

        $styles = [
            __DIR__ . '/../resources/css/phone-input.custom.css' => resource_path(self::CUSTOM_CSS_PATH),
        ];

        $this->publishes($flags, 'filament-phone-input-assets');
        $this->publishes($translations, 'filament-phone-input-translations');
        $this->publishes($styles, 'filament-phone-input-styles');

        $this->publishes([
            ...$translations,
            ...$styles,
        ], 'filament-phone-input-customization');

        $this->publishes([
            ...$flags,
            ...$translations,
            ...$styles,
        ], 'filament-phone-input-full');
    }

    protected function registerAssets(): void
    {
        $assets = [
            Js::make('phone-input', __DIR__ . '/../dist/phone-input.js')->module(),
            Css::make('phone-input', __DIR__ . '/../dist/phone-input.css'),
        ];

        $customCssPath = resource_path(self::CUSTOM_CSS_PATH);

        if (is_file($customCssPath)) {
            $assets[] = Css::make('phone-input-custom', $customCssPath);
        }

        FilamentAsset::register(
            assets: $assets,
            package: self::PACKAGE,
        );
    }
}