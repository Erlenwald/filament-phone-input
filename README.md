# Filament Phone Input

A Filament form field for entering phone numbers with country selection, masks, country detection, configurable output formats, and optional flag icons.

## Features

- Country dropdown with search
- Favorite countries group
- Country-specific phone masks
- Automatic country detection while typing or pasting
- Optional selected country state field
- Configurable phone state path
- Configurable output format
- Optional default country
- Optional IP-based country lookup
- Optional SVG flags
- `1x1` and `4x3` flag aspect modes
- Publishable translations
- Publishable custom CSS
- English and Russian translations
- No dependency on `intl-tel-input`

## Requirements

- PHP 8.2+
- Laravel
- Filament 5

## Installation

Install the package via Composer:

```bash
composer require erlenwald/filament-phone-input
```

Publish the required flag assets:

```bash
php artisan vendor:publish --tag=filament-phone-input-assets
```

Publish Filament assets:

```bash
php artisan filament:assets
```

Clear the application cache if needed:

```bash
php artisan optimize:clear
```

## Optional publishing

You can publish only the files you need.

| Tag | Publishes |
| --- | --- |
| `filament-phone-input-assets` | Flag atlas files to `public/vendor/erlenwald/filament-phone-input/flags` |
| `filament-phone-input-translations` | Translation files to `lang/vendor/erlenwald-filament-phone-input` |
| `filament-phone-input-styles` | Custom CSS file to `resources/css/vendor/erlenwald/filament-phone-input/phone-input.css` |
| `filament-phone-input-customization` | Translations and custom CSS |
| `filament-phone-input-full` | Flags, translations, and custom CSS |

Publish everything:

```bash
php artisan vendor:publish --tag=filament-phone-input-full
```

Publish everything and overwrite existing files:

```bash
php artisan vendor:publish --tag=filament-phone-input-full --force
```

Use `--force` carefully because it overwrites already published translations and custom CSS.

After publishing or changing custom CSS, run:

```bash
php artisan filament:assets
php artisan optimize:clear
```

## Basic usage

```php
use Erlenwald\FilamentPhoneInput\PhoneInput;

PhoneInput::make('phone');
```

By default, the normalized phone number is written to the same state path as the field name:

```php
[
    'phone' => '+[country_code][national_number]',
]
```

To also store the selected country ISO2 code:

```php
PhoneInput::make('phone')
    ->countryStatePath();
```

Submitted state:

```php
[
    'phone' => '+[country_code][national_number]',
    'phone_country' => 'RU',
]
```

## Full example

```php
use Erlenwald\FilamentPhoneInput\Enums\PhoneNumberFormat;
use Erlenwald\FilamentPhoneInput\PhoneInput;

PhoneInput::make('phone')
    ->countryStatePath('phone_country')
    ->defaultCountry('RU')
    ->countries(['RU', 'BY', 'KZ'])
    ->favoriteCountries(['RU', 'BY'])
    ->displayCountryFlag()
    ->flagAspect('4x3')
    ->phoneNumberFormat(PhoneNumberFormat::E164);
```

## Configuration methods

| Method | Description |
| --- | --- |
| `phoneStatePath(string\|Closure\|null $path)` | Overrides the state path where the normalized phone number is written. If not set, the field state path is used. |
| `countryStatePath(string\|Closure\|null $path = 'phone_country')` | Enables writing the selected country ISO2 code to form state. If called without arguments, writes to `phone_country`. |
| `countries(array\|Closure\|null $countries = null)` | Restricts the visible country list. If not set, all supported countries are displayed. |
| `favoriteCountries(array\|Closure\|null $countries = null)` | Displays selected countries in a separate group at the top of the dropdown. |
| `defaultCountry(string\|Closure\|null $country)` | Sets the initial fallback country. Does not restrict the country list. |
| `displayCountryFlag(bool\|Closure $condition = true)` | Displays flag icons instead of ISO2 country codes. |
| `flagAspect(string\|Closure $aspect)` | Sets the flag aspect ratio. Supported values: `'4x3'`, `'1x1'`. |
| `phoneNumberFormat(PhoneNumberFormat\|string\|Closure $format)` | Sets the submitted phone number format. |
| `enableIpLookup(bool\|Closure $condition = true)` | Enables IP lookup without changing the configured endpoint. |
| `ipLookup(string\|Closure\|null $url = null, string\|Closure\|null $countryKey = 'country_code')` | Configures and enables IP lookup. |

All standard Filament field methods such as `required()`, `label()`, `helperText()`, `disabled()`, and `hidden()` are available because the component extends Filament's `Field`.

## Phone number formats

Use the `PhoneNumberFormat` enum:

```php
use Erlenwald\FilamentPhoneInput\Enums\PhoneNumberFormat;

PhoneInput::make('phone')
    ->phoneNumberFormat(PhoneNumberFormat::E164);
```

Available formats:

| Enum | Value | Example |
| --- | --- | --- |
| `PhoneNumberFormat::E164` | `e164` | `+[country_code][national_number]` |
| `PhoneNumberFormat::National` | `national` | `8 (XXX) XXX-XX-XX` |
| `PhoneNumberFormat::International` | `international` | `+[country_code] (XXX) XXX-XX-XX` |
| `PhoneNumberFormat::Rfc3966` | `rfc3966` | `tel:+[country_code][national_number]` |
| `PhoneNumberFormat::Digits` | `digits` | `[country_code][national_number]` |
| `PhoneNumberFormat::NationalDigits` | `national_digits` | `[national_number]` |

You can also pass a string:

```php
PhoneInput::make('phone')
    ->phoneNumberFormat('international');
```

## State paths

### Default phone state

```php
PhoneInput::make('phone');
```

Submitted state:

```php
[
    'phone' => '+[country_code][national_number]',
]
```

### Phone and country state

```php
PhoneInput::make('phone')
    ->countryStatePath();
```

Submitted state:

```php
[
    'phone' => '+[country_code][national_number]',
    'phone_country' => 'RU',
]
```

### Custom country state path

```php
PhoneInput::make('phone')
    ->countryStatePath('country');
```

Submitted state:

```php
[
    'phone' => '+[country_code][national_number]',
    'country' => 'RU',
]
```

### Custom phone state path

```php
PhoneInput::make('contact_phone_input')
    ->phoneStatePath('phone')
    ->countryStatePath('phone_country');
```

Submitted state:

```php
[
    'phone' => '+[country_code][national_number]',
    'phone_country' => 'RU',
]
```

## Countries

Restrict visible countries:

```php
PhoneInput::make('phone')
    ->countries(['RU', 'BY', 'KZ']);
```

Show favorite countries at the top:

```php
PhoneInput::make('phone')
    ->favoriteCountries(['RU', 'BY']);
```

Set an initial fallback country:

```php
PhoneInput::make('phone')
    ->defaultCountry('RU');
```

`defaultCountry()` does not restrict the list. It is only used as an initial fallback when the field is empty and no country state is available.

## Flags

By default, the component displays ISO2 country codes.

Enable flag icons:

```php
PhoneInput::make('phone')
    ->displayCountryFlag();
```

Use rectangular flags:

```php
PhoneInput::make('phone')
    ->displayCountryFlag()
    ->flagAspect('4x3');
```

Use square flags:

```php
PhoneInput::make('phone')
    ->displayCountryFlag()
    ->flagAspect('1x1');
```

Flag icons require published flag assets:

```bash
php artisan vendor:publish --tag=filament-phone-input-assets
```

The package ships both WebP and SVG flag atlases.

By default, WebP atlases are used because they are much smaller:

| Atlas | SVG size | WebP size |
| --- | ---: | ---: |
| `atlas-1x1` | ~1.5 MB | ~188 KB |
| `atlas-4x3` | ~1.5 MB | ~210 KB |

If you prefer SVG atlases, publish the custom CSS file:

```bash
php artisan vendor:publish --tag=filament-phone-input-styles
```

Then edit:

```text
resources/css/vendor/erlenwald/filament-phone-input/phone-input.css
```

and override the flag atlas variables:

```css
.fi-phone-input__flag-aspect-1x1 {
    --fi-phone-input-flag-atlas-1x1: url('/vendor/erlenwald/filament-phone-input/flags/atlas-1x1.svg');
}

.fi-phone-input__flag-aspect-4x3 {
    --fi-phone-input-flag-atlas-4x3: url('/vendor/erlenwald/filament-phone-input/flags/atlas-4x3.svg');
}
```

After changing custom CSS, run:

```bash
php artisan filament:assets
php artisan optimize:clear
```

## IP lookup

IP lookup is optional and does not override a value already typed by the user.

```php
PhoneInput::make('phone')
    ->defaultCountry('RU')
    ->ipLookup('/ip-country', 'country_code');
```

The endpoint may return JSON:

```json
{
    "country_code": "RU"
}
```

Nested keys are supported:

```php
PhoneInput::make('phone')
    ->ipLookup('/ip-country', 'location.country_code');
```

Expected JSON:

```json
{
    "location": {
        "country_code": "RU"
    }
}
```

Plain text is also supported:

```text
RU
```

Cloudflare-like trace text is supported too:

```text
loc=RU
```

## Customization

### Translations

Publish translations:

```bash
php artisan vendor:publish --tag=filament-phone-input-translations
```

Published files:

```text
lang/vendor/erlenwald-filament-phone-input/en/phone-input.php
lang/vendor/erlenwald-filament-phone-input/ru/phone-input.php
```

You can edit these files to override labels, country names, search placeholder, and group names.

### Styles

Publish custom CSS:

```bash
php artisan vendor:publish --tag=filament-phone-input-styles
```

Published file:

```text
resources/css/vendor/erlenwald/filament-phone-input/phone-input.css
```

This file is loaded after the package CSS, so you can override component styles and CSS variables there.

After changing the custom CSS, run:

```bash
php artisan filament:assets
php artisan optimize:clear
```

## Validation

This package focuses on input formatting and state normalization.

Server-side validation should still be handled by your application according to your own business rules:

```php
PhoneInput::make('phone')
    ->required();
```

## Assets

The component uses generated flag atlas files.

WebP atlases are used by default:

```text
atlas-1x1.webp
atlas-4x3.webp
```

SVG atlases are also included and can be enabled through custom CSS:

```text
atlas-1x1.svg
atlas-4x3.svg
```

All flag atlases are published to:

```text
public/vendor/erlenwald/filament-phone-input/flags
```

The base JavaScript and CSS assets are registered through Filament:

```bash
php artisan filament:assets
```

After package updates, refresh published assets:

```bash
php artisan vendor:publish --tag=filament-phone-input-assets --force
php artisan filament:assets
php artisan optimize:clear
```

If you also want to refresh translations and custom CSS, use:

```bash
php artisan vendor:publish --tag=filament-phone-input-full --force
```

Be careful: this overwrites customized translation and CSS files.

## Credits

Flag assets are based on the `flag-icons` project.

See `NOTICE.md` for third-party attribution.

## License

The MIT License.

See `LICENSE`.