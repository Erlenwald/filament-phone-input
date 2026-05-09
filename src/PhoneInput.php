<?php

namespace Erlenwald\FilamentPhoneInput;

use Closure;
use Collator;
use Erlenwald\FilamentPhoneInput\Enums\PhoneNumberFormat;
use Filament\Forms\Components\Field;

class PhoneInput extends Field
{
    protected const TRANSLATION_NAMESPACE = 'erlenwald-filament-phone-input';

    protected string $view = 'erlenwald-filament-phone-input::phone-input';

    protected string | Closure | null $phoneStatePath = null;

    protected string | Closure | null $countryStatePath = null;

    /** @var array<string> | Closure(): array<string> | null */
    protected array | Closure | null $countries = null;

    /** @var array<string> | Closure(): array<string> | null */
    protected array | Closure | null $favoriteCountries = null;

    protected string | Closure | null $defaultCountry = null;

    protected bool | Closure $displayCountryFlag = false;

    protected string | Closure $flagAspect = '4x3';

    protected PhoneNumberFormat | string | Closure $phoneNumberFormat = PhoneNumberFormat::E164;

    protected bool | Closure $ipLookupEnabled = false;

    protected string | Closure | null $ipLookupUrl = null;

    protected string | Closure | null $ipLookupCountryKey = 'country_code';

    public function phoneStatePath(string | Closure | null $path): static
    {
        $this->phoneStatePath = $path;

        return $this;
    }

    public function countryStatePath(string | Closure | null $path = 'phone_country'): static
    {
        $this->countryStatePath = $path;

        return $this;
    }

    public function withoutCountryStatePath(): static
    {
        $this->countryStatePath = null;

        return $this;
    }

    /**
     * @param  array<string> | Closure(): array<string> | null  $countries
     */
    public function countries(array | Closure | null $countries = null): static
    {
        $this->countries = $countries;

        return $this;
    }

    /**
     * @param  array<string> | Closure(): array<string> | null  $countries
     */
    public function favoriteCountries(array | Closure | null $countries = null): static
    {
        $this->favoriteCountries = $countries;

        return $this;
    }

    /**
     * @param  array<string> | Closure(): array<string> | null  $countries
     */
    public function preferredCountries(array | Closure | null $countries = null): static
    {
        return $this->favoriteCountries($countries);
    }

    public function defaultCountry(string | Closure | null $country): static
    {
        $this->defaultCountry = $country;

        return $this;
    }

    public function initialCountry(?string $country): static
    {
        return $this->defaultCountry($country);
    }

    public function displayCountryFlag(bool | Closure $condition = true): static
    {
        $this->displayCountryFlag = $condition;

        return $this;
    }

    public function flagAspect(string | Closure $aspect): static
    {
        $this->flagAspect = $aspect;

        return $this;
    }

    public function squareFlags(): static
    {
        return $this->flagAspect('1x1');
    }

    public function rectangularFlags(): static
    {
        return $this->flagAspect('4x3');
    }

    public function phoneNumberFormat(PhoneNumberFormat | string | Closure $format): static
    {
        $this->phoneNumberFormat = $format;

        return $this;
    }

    public function enableIpLookup(bool | Closure $condition = true): static
    {
        $this->ipLookupEnabled = $condition;

        return $this;
    }

    public function ipLookup(
        string | Closure | null $url = null,
        string | Closure | null $countryKey = 'country_code',
    ): static {
        $this->ipLookupUrl = $url;
        $this->ipLookupCountryKey = $countryKey;

        return $this->enableIpLookup();
    }

    public function getPhoneStatePath(): string
    {
        $path = $this->evaluateNullableString($this->phoneStatePath);

        if ($path === null) {
            return $this->getStatePath();
        }

        return $this->resolveStatePath($path);
    }

    public function getCountryStatePath(): ?string
    {
        $path = $this->evaluateNullableString($this->countryStatePath);

        if ($path === null) {
            return null;
        }

        return $this->resolveStatePath($path);
    }

    /**
     * @return array<string, mixed>
     */
    public function getStateToDehydrate(mixed $state): array
    {
        $stateToDehydrate = parent::getStateToDehydrate($state);

        $componentStatePath = $this->getStatePath();
        $phoneStatePath = $this->getPhoneStatePath();

        $phone = $this->getPhoneStateForDehydration($phoneStatePath);

        if ($phoneStatePath !== $componentStatePath) {
            unset($stateToDehydrate[$componentStatePath]);
        }

        if ($phone !== null) {
            $stateToDehydrate[$phoneStatePath] = $phone;
        }

        $countryStatePath = $this->getCountryStatePath();

        if ($countryStatePath === null) {
            return $stateToDehydrate;
        }

        $country = $this->getCountryStateForDehydration($countryStatePath);

        if ($country !== null) {
            $stateToDehydrate[$countryStatePath] = $country;
        }

        return $stateToDehydrate;
    }

    /**
     * @return array<string>
     */
    public function getCountries(): array
    {
        $countries = $this->countries instanceof Closure
            ? $this->evaluate($this->countries)
            : $this->countries;

        if ($countries === null) {
            return array_keys($this->getSupportedCountryDefinitions());
        }

        assert(is_array($countries));

        return $this->normalizeCountries($countries);
    }

    /**
     * @return array<string>
     */
    public function getFavoriteCountries(): array
    {
        $countries = $this->favoriteCountries instanceof Closure
            ? $this->evaluate($this->favoriteCountries)
            : $this->favoriteCountries;

        if ($countries === null) {
            return [];
        }

        assert(is_array($countries));

        $visibleCountries = $this->getCountries();

        return array_values(array_filter(
            $this->normalizeCountries($countries),
            static fn (string $country): bool => in_array($country, $visibleCountries, true),
        ));
    }

    public function getDefaultCountry(): ?string
    {
        $country = $this->evaluateNullableString($this->defaultCountry);

        if ($country === null) {
            return null;
        }

        $country = strtoupper($country);

        return in_array($country, $this->getCountries(), true)
            ? $country
            : null;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function getCountryDefinitions(): array
    {
        $supportedCountries = $this->getSupportedCountryDefinitions();
        $visibleCountries = $this->getCountries();
        $favoriteCountries = $this->getFavoriteCountries();

        $favoriteDefinitions = [];
        $regularDefinitions = [];

        foreach ($visibleCountries as $country) {
            $definition = $this->resolveCountryDefinition($supportedCountries[$country]);
            $definition['isFavorite'] = in_array($country, $favoriteCountries, true);

            if ($definition['isFavorite']) {
                $favoriteDefinitions[] = $definition;

                continue;
            }

            $regularDefinitions[] = $definition;
        }

        return [
            ...$this->sortCountryDefinitionsByName($favoriteDefinitions),
            ...$this->sortCountryDefinitionsByName($regularDefinitions),
        ];
    }

    /**
     * @return array<string, string>
     */
    public function getCountryGroupLabels(): array
    {
        return [
            'favorites' => __(self::TRANSLATION_NAMESPACE . '::phone-input.groups.favorites'),
            'allCountries' => __(self::TRANSLATION_NAMESPACE . '::phone-input.groups.all_countries'),
        ];
    }

    public function shouldDisplayCountryFlag(): bool
    {
        return (bool) $this->evaluate($this->displayCountryFlag);
    }

    public function getFlagAspect(): string
    {
        $aspect = $this->evaluate($this->flagAspect);

        return in_array($aspect, ['1x1', '4x3'], true) ? $aspect : '4x3';
    }

    public function getPhoneNumberFormat(): string
    {
        $format = $this->phoneNumberFormat instanceof Closure
            ? $this->evaluate($this->phoneNumberFormat)
            : $this->phoneNumberFormat;

        if ($format instanceof PhoneNumberFormat) {
            return $format->value;
        }

        if (! is_string($format)) {
            return PhoneNumberFormat::E164->value;
        }

        return PhoneNumberFormat::tryFrom($format)?->value ?? PhoneNumberFormat::E164->value;
    }

    public function isIpLookupEnabled(): bool
    {
        return (bool) $this->evaluate($this->ipLookupEnabled);
    }

    public function getIpLookupUrl(): ?string
    {
        return $this->evaluateNullableString($this->ipLookupUrl);
    }

    public function getIpLookupCountryKey(): ?string
    {
        return $this->evaluateNullableString($this->ipLookupCountryKey);
    }

    /**
     * @return array<string, array<string, mixed>>
     */
    protected function getSupportedCountryDefinitions(): array
    {
        return require __DIR__ . '/data/countries.php';
    }

    /**
     * @param  array<string, mixed>  $country
     * @return array<string, mixed>
     */
    protected function resolveCountryDefinition(array $country): array
    {
        $iso2 = strtoupper((string) $country['iso2']);

        return [
            ...$country,
            'iso2' => $iso2,
            'name' => __(self::TRANSLATION_NAMESPACE . "::phone-input.countries.{$iso2}"),
        ];
    }

    /**
     * @param  array<mixed>  $countries
     * @return array<string>
     */
    protected function normalizeCountries(array $countries): array
    {
        $supportedCountries = array_keys($this->getSupportedCountryDefinitions());

        $countries = array_values(array_unique(array_filter(array_map(
            static fn (mixed $country): ?string => is_string($country) ? strtoupper($country) : null,
            $countries,
        ))));

        $countries = array_values(array_filter(
            $countries,
            static fn (string $country): bool => in_array($country, $supportedCountries, true),
        ));

        return $countries === [] ? $supportedCountries : $countries;
    }

    /**
     * @param  array<int, array<string, mixed>>  $countries
     * @return array<int, array<string, mixed>>
     */
    protected function sortCountryDefinitionsByName(array $countries): array
    {
        if (class_exists(Collator::class)) {
            $collator = new Collator(app()->getLocale());

            usort(
                $countries,
                static function (array $first, array $second) use ($collator): int {
                    $result = $collator->compare(
                        (string) $first['name'],
                        (string) $second['name'],
                    );

                    return is_int($result)
                        ? $result
                        : strnatcasecmp((string) $first['name'], (string) $second['name']);
                },
            );

            return $countries;
        }

        usort(
            $countries,
            static fn (array $first, array $second): int => strnatcasecmp(
                mb_strtolower((string) $first['name']),
                mb_strtolower((string) $second['name']),
            ),
        );

        return $countries;
    }

    protected function getPhoneStateForDehydration(string $phoneStatePath): ?string
    {
        $phone = data_get($this->getLivewire(), $phoneStatePath);

        if (! is_string($phone) || $phone === '') {
            $phone = $this->getState();
        }

        if (! is_string($phone) || $phone === '') {
            return null;
        }

        return $phone;
    }

    protected function getCountryStateForDehydration(string $countryStatePath): ?string
    {
        $country = data_get($this->getLivewire(), $countryStatePath);

        if (! is_string($country) || $country === '') {
            $country = $this->getDefaultCountry();
        }

        if (! is_string($country) || $country === '') {
            $country = $this->detectCountryFromPhoneState();
        }

        if (! is_string($country) || $country === '') {
            return null;
        }

        $country = strtoupper($country);

        return in_array($country, $this->getCountries(), true)
            ? $country
            : null;
    }

    protected function detectCountryFromPhoneState(): ?string
    {
        $phone = $this->getPhoneStateForDehydration($this->getPhoneStatePath());

        if ($phone === null) {
            return null;
        }

        $digits = preg_replace('/\D+/', '', $phone);

        if (! is_string($digits) || $digits === '') {
            return null;
        }

        $countries = $this->getCountries();
        $definitions = $this->getSupportedCountryDefinitions();

        foreach ($countries as $country) {
            $definition = $definitions[$country] ?? null;

            if (! is_array($definition)) {
                continue;
            }

            $dialDigits = (string) ($definition['dialDigits'] ?? '');

            if ($dialDigits === '' || ! str_starts_with($digits, $dialDigits)) {
                continue;
            }

            $nationalNumber = substr($digits, strlen($dialDigits));

            if ($this->matchesCountryNationalNumber($definition, $nationalNumber)) {
                return $country;
            }
        }

        return null;
    }

    /**
     * @param  array<string, mixed>  $country
     */
    protected function matchesCountryNationalNumber(array $country, string $nationalNumber): bool
    {
        if ($nationalNumber === '') {
            return false;
        }

        $localLengths = $country['localLengths'] ?? null;

        if (is_array($localLengths) && ! in_array(strlen($nationalNumber), $localLengths, true)) {
            return false;
        }

        $leadingDigits = $country['leadingDigits'] ?? null;

        if (is_string($leadingDigits) && $leadingDigits !== '') {
            return str_starts_with($nationalNumber, $leadingDigits);
        }

        return true;
    }

    protected function resolveStatePath(string $path): string
    {
        $fieldStatePath = $this->getStatePath();

        if ($fieldStatePath === '' || ! str_contains($fieldStatePath, '.')) {
            return $path;
        }

        $parentStatePath = substr($fieldStatePath, 0, strrpos($fieldStatePath, '.'));

        if ($parentStatePath === '') {
            return $path;
        }

        if ($path === $parentStatePath || str_starts_with($path, "{$parentStatePath}.")) {
            return $path;
        }

        return "{$parentStatePath}.{$path}";
    }

    protected function evaluateNullableString(string | Closure | null $value): ?string
    {
        $value = $value instanceof Closure
            ? $this->evaluate($value)
            : $value;

        if ($value === null || $value === '') {
            return null;
        }

        assert(is_string($value));

        return $value;
    }
}