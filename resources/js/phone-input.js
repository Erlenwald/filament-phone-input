import '../css/phone-input.css';

const PHONE_NUMBER_FORMATS = [
    'e164',
    'national',
    'international',
    'rfc3966',
    'digits',
    'national_digits',
];

const FLAG_ASPECTS = ['1x1', '4x3'];

const FILAMENT_THEME_VARIABLES = [
    '--gray-50',
    '--gray-100',
    '--gray-200',
    '--gray-300',
    '--gray-400',
    '--gray-500',
    '--gray-600',
    '--gray-700',
    '--gray-800',
    '--gray-900',
    '--gray-950',

    '--primary-50',
    '--primary-100',
    '--primary-200',
    '--primary-300',
    '--primary-400',
    '--primary-500',
    '--primary-600',
    '--primary-700',
    '--primary-800',
    '--primary-900',
    '--primary-950',
];

class PhoneInputComponent {
    constructor(configuration) {
        this.phoneStatePath = configuration.phoneStatePath;
        this.countryStatePath = configuration.countryStatePath;
        this.rawCountryDefinitions = configuration.countryDefinitions;
        this.countryGroupLabels = PhoneInputComponent.normalizeObject(configuration.countryGroupLabels);
        this.defaultCountry = PhoneInputComponent.normalizeIso2(configuration.defaultCountry);
        this.showCountryFlag = Boolean(configuration.showCountryFlag);
        this.flagAspect = PhoneInputComponent.normalizeFlagAspect(configuration.flagAspect);
        this.phoneNumberFormat = PhoneInputComponent.normalizePhoneNumberFormat(configuration.phoneNumberFormat);
        this.ipLookupEnabled = Boolean(configuration.ipLookupEnabled);
        this.ipLookupUrl = configuration.ipLookupUrl ? String(configuration.ipLookupUrl) : null;
        this.ipLookupCountryKey = configuration.ipLookupCountryKey ? String(configuration.ipLookupCountryKey) : null;

        this.open = false;
        this.search = '';
        this.dropdownStyle = '';
        this.countries = [];
        this.selectedIso2 = null;
        this.boundPositionDropdown = null;
        this.boundDocumentClick = null;
    }

    init() {
        this.countries = PhoneInputComponent.normalizeCountryDefinitions(this.rawCountryDefinitions);

        const stateValue = this.$wire.get(this.phoneStatePath);
        const stateCountry = this.countryStatePath ? this.$wire.get(this.countryStatePath) : null;
        const fallbackCountry = stateCountry || this.defaultCountry || null;

        this.selectedIso2 = PhoneInputComponent.detectCountryIso2(
            stateValue,
            this.countries,
            fallbackCountry,
        );

        this.refreshVisibleValue(stateValue);
        this.bindGlobalListeners();
        this.syncState();
        this.lookupCountryByIp();
    }

    destroy() {
        if (this.boundPositionDropdown) {
            window.removeEventListener('resize', this.boundPositionDropdown);
            window.removeEventListener('scroll', this.boundPositionDropdown, true);
        }

        if (this.boundDocumentClick) {
            document.removeEventListener('mousedown', this.boundDocumentClick, true);
        }
    }

    get selectedCountry() {
        return PhoneInputComponent.countryByIso2(this.countries, this.selectedIso2);
    }

    get favoriteCountries() {
        return this.countries.filter((country) => country.isFavorite);
    }

    get regularCountries() {
        return this.countries.filter((country) => ! country.isFavorite);
    }

    get filteredFavoriteCountries() {
        return this.filterCountries(this.favoriteCountries);
    }

    get filteredRegularCountries() {
        return this.filterCountries(this.regularCountries);
    }

    get filteredCountryGroups() {
        const groups = [];

        if (this.filteredFavoriteCountries.length > 0) {
            groups.push({
                key: 'favorites',
                label: this.countryGroupLabels.favorites ?? 'Favorites',
                countries: this.filteredFavoriteCountries,
            });
        }

        if (this.filteredRegularCountries.length > 0) {
            groups.push({
                key: 'countries',
                label: this.filteredFavoriteCountries.length > 0
                    ? this.countryGroupLabels.allCountries ?? 'All countries'
                    : '',
                countries: this.filteredRegularCountries,
            });
        }

        return groups;
    }

    get hasFilteredCountries() {
        return this.filteredFavoriteCountries.length > 0
            || this.filteredRegularCountries.length > 0;
    }

    bindGlobalListeners() {
        this.boundPositionDropdown = () => {
            if (this.open) {
                this.positionDropdown();
            }
        };

        this.boundDocumentClick = (event) => {
            if (! this.open) {
                return;
            }

            if (
                this.$refs.wrapper?.contains(event.target)
                || this.$refs.dropdown?.contains(event.target)
            ) {
                return;
            }

            this.closeDropdown();
        };

        window.addEventListener('resize', this.boundPositionDropdown);
        window.addEventListener('scroll', this.boundPositionDropdown, true);
        document.addEventListener('mousedown', this.boundDocumentClick, true);
    }

    filterCountries(countries) {
        const search = PhoneInputComponent.normalizeSearch(this.search);

        if (search === '') {
            return countries;
        }

        return countries.filter((country) => {
            return [
                country.iso2,
                country.name,
                country.dialCode,
                country.dialDigits,
            ].some((value) => PhoneInputComponent.normalizeSearch(value).includes(search));
        });
    }

    flagCssClasses(iso2) {
        const aspectClass = this.flagAspect === '1x1'
            ? 'fi-phone-input__flag-aspect-1x1 fi-phone-input__flag--square'
            : 'fi-phone-input__flag-aspect-4x3 fi-phone-input__flag--rectangle';

        return `${aspectClass} fi-phone-input__flag-country-${PhoneInputComponent.normalizeIso2(iso2).toLowerCase()}`;
    }

    toggleDropdown() {
        if (! this.$refs.input || this.$refs.input.disabled || ! this.selectedCountry) {
            return;
        }

        if (this.open) {
            this.closeDropdown();

            return;
        }

        this.openDropdown();
    }

    openDropdown() {
        this.open = true;
        this.search = '';

        this.$nextTick(() => {
            this.syncThemeVariables();
            this.positionDropdown();
            this.$refs.searchInput?.focus();
        });
    }

    closeDropdown() {
        this.open = false;
    }

    positionDropdown() {
        this.syncThemeVariables();

        const wrapper = this.$refs.wrapper;

        if (! wrapper) {
            return;
        }

        const rect = wrapper.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const padding = 8;
        const gap = 4;
        const width = Math.min(Math.max(rect.width, 320), viewportWidth - padding * 2);
        const left = Math.min(Math.max(rect.left, padding), viewportWidth - width - padding);
        const spaceBelow = viewportHeight - rect.bottom - gap - padding;
        const spaceAbove = rect.top - gap - padding;
        const shouldOpenBelow = spaceBelow >= 220 || spaceBelow >= spaceAbove;
        const availableSpace = Math.max(96, shouldOpenBelow ? spaceBelow : spaceAbove);
        const maxHeight = Math.min(320, availableSpace);
        let top = shouldOpenBelow
            ? rect.bottom + gap
            : rect.top - gap - maxHeight;

        top = Math.min(Math.max(top, padding), viewportHeight - maxHeight - padding);

        this.dropdownStyle = [
            `top: ${top}px`,
            `left: ${left}px`,
            `width: ${width}px`,
            `max-height: ${maxHeight}px`,
        ].join('; ');
    }

    syncThemeVariables() {
        const wrapper = this.$refs.wrapper;
        const dropdown = this.$refs.dropdown;

        if (! wrapper || ! dropdown) {
            return;
        }

        const styles = window.getComputedStyle(wrapper);

        FILAMENT_THEME_VARIABLES.forEach((variable) => {
            const value = styles.getPropertyValue(variable).trim();

            if (value !== '') {
                dropdown.style.setProperty(variable, value);
            }
        });

        const isDark = Boolean(
            wrapper.closest('.dark')
            || document.documentElement.classList.contains('dark')
            || document.body.classList.contains('dark'),
        );

        dropdown.classList.toggle('fi-phone-input__dropdown--dark', isDark);
    }

    selectCountry(iso2) {
        const previousCountry = this.selectedCountry;
        const nextCountry = PhoneInputComponent.countryByIso2(this.countries, iso2);

        if (! previousCountry || ! nextCountry || ! this.$refs.input) {
            return;
        }

        const localDigits = PhoneInputComponent.localDigitsForCountry(
            this.$refs.input.value,
            previousCountry,
        );

        this.selectedIso2 = nextCountry.iso2;
        this.closeDropdown();
        this.refreshVisibleValue(localDigits);
        this.syncState();

        this.$nextTick(() => {
            this.$refs.input.focus();
        });
    }

    handleFocus() {
        if (! this.selectedCountry || ! this.$refs.input) {
            return;
        }

        if (this.$refs.input.value === '') {
            this.$refs.input.value = `${this.selectedCountry.dialCode} `;
        }
    }

    handleInput() {
        if (! this.$refs.input) {
            return;
        }

        this.applyRawValue(this.$refs.input.value);
    }

    handlePaste(event) {
        const pastedValue = event.clipboardData?.getData('text');

        if (! pastedValue) {
            return;
        }

        event.preventDefault();
        this.applyRawValue(pastedValue);
    }

    handleBlur() {
        if (! this.selectedCountry || ! this.$refs.input) {
            return;
        }

        const localDigits = PhoneInputComponent.localDigitsForCountry(
            this.$refs.input.value,
            this.selectedCountry,
        );

        this.refreshVisibleValue(localDigits);
        this.syncState();
    }

    applyRawValue(value) {
        const detectedIso2 = PhoneInputComponent.detectCountryIso2(
            value,
            this.countries,
            this.selectedIso2,
        );

        if (detectedIso2) {
            this.selectedIso2 = detectedIso2;
        }

        this.refreshVisibleValue(value);
        this.syncState();
    }

    refreshVisibleValue(value) {
        if (! this.$refs.input || ! this.selectedCountry) {
            return;
        }

        const localDigits = PhoneInputComponent.localDigitsForCountry(value, this.selectedCountry);

        this.$refs.input.value = localDigits.length === 0
            ? ''
            : PhoneInputComponent.formatInternationalForCountry(localDigits, this.selectedCountry);
    }

    syncState() {
        if (! this.selectedCountry || ! this.$refs.input) {
            return;
        }

        this.$wire.set(
            this.phoneStatePath,
            PhoneInputComponent.phoneValueForCountry(
                this.$refs.input.value,
                this.selectedCountry,
                this.phoneNumberFormat,
            ),
            false,
        );

        if (this.countryStatePath) {
            this.$wire.set(this.countryStatePath, this.selectedCountry.iso2, false);
        }
    }

    async lookupCountryByIp() {
        if (! this.ipLookupEnabled || ! this.ipLookupUrl || ! this.selectedCountry) {
            return;
        }

        if (this.$refs.input?.value) {
            return;
        }

        try {
            const response = await fetch(this.ipLookupUrl, {
                headers: {
                    Accept: 'application/json, text/plain',
                },
                credentials: 'same-origin',
            });

            if (! response.ok) {
                return;
            }

            const contentType = response.headers.get('content-type') ?? '';
            const payload = contentType.includes('application/json')
                ? await response.json()
                : await response.text();
            const detectedIso2 = PhoneInputComponent.lookupCountryFromPayload(
                payload,
                this.ipLookupCountryKey,
            );
            const detectedCountry = PhoneInputComponent.countryByIso2(this.countries, detectedIso2);

            if (! detectedCountry || this.$refs.input?.value) {
                return;
            }

            this.selectedIso2 = detectedCountry.iso2;
            this.syncState();
        } catch {
            // IP lookup is optional and must not break the field.
        }
    }

    static phoneValueForCountry(value, country, format) {
        const localDigits = PhoneInputComponent.localDigitsForCountry(value, country);

        if (! country || ! country.localLengths.includes(localDigits.length)) {
            return null;
        }

        if (format === 'national') {
            return PhoneInputComponent.formatNationalForCountry(localDigits, country);
        }

        if (format === 'international') {
            return PhoneInputComponent.formatInternationalForCountry(localDigits, country);
        }

        if (format === 'rfc3966') {
            const e164 = PhoneInputComponent.e164ForCountry(localDigits, country);

            return e164 ? `tel:${e164}` : null;
        }

        if (format === 'digits') {
            const e164 = PhoneInputComponent.e164ForCountry(localDigits, country);

            return e164 ? PhoneInputComponent.onlyDigits(e164) : null;
        }

        if (format === 'national_digits') {
            return localDigits;
        }

        return PhoneInputComponent.e164ForCountry(localDigits, country);
    }

    static e164ForCountry(value, country) {
        if (! country) {
            return null;
        }

        const localDigits = PhoneInputComponent.localDigitsForCountry(value, country);

        if (! country.localLengths.includes(localDigits.length)) {
            return null;
        }

        return `${country.dialCode}${localDigits}`;
    }

    static formatInternationalForCountry(value, country) {
        if (! country) {
            return '';
        }

        return PhoneInputComponent.formatDigitsByMask(
            PhoneInputComponent.localDigitsForCountry(value, country),
            country.mask,
        );
    }

    static formatNationalForCountry(value, country) {
        if (! country) {
            return '';
        }

        const localDigits = PhoneInputComponent.localDigitsForCountry(value, country);
        const formattedLocalNumber = PhoneInputComponent.formatDigitsByMask(
            localDigits,
            PhoneInputComponent.localMaskForCountry(country),
        );
        const nationalPrefix = country.nationalPrefixes[0] ?? '';

        if (formattedLocalNumber === '') {
            return '';
        }

        return nationalPrefix
            ? `${nationalPrefix} ${formattedLocalNumber}`
            : formattedLocalNumber;
    }

    static formatDigitsByMask(digits, mask) {
        if (digits.length === 0) {
            return '';
        }

        let result = '';
        let digitIndex = 0;

        for (const character of mask) {
            if (character !== '#') {
                result += character;

                continue;
            }

            if (digitIndex >= digits.length) {
                break;
            }

            result += digits[digitIndex];
            digitIndex += 1;
        }

        return result;
    }

    static localDigitsForCountry(value, country) {
        const raw = String(value ?? '').trim();
        let digits = PhoneInputComponent.onlyDigits(raw);

        if (! country || digits.length === 0) {
            return '';
        }

        if (digits.startsWith(country.dialDigits)) {
            const localDigits = digits.slice(country.dialDigits.length);

            if (raw.includes('+') || country.localLengths.includes(localDigits.length)) {
                digits = localDigits;
            }
        } else {
            digits = PhoneInputComponent.stripNationalPrefix(digits, country);
        }

        return digits.slice(0, country.maxLocalLength);
    }

    static stripNationalPrefix(digits, country) {
        const prefixes = [...country.nationalPrefixes].sort((first, second) => {
            return second.length - first.length;
        });

        for (const prefix of prefixes) {
            if (
                digits.startsWith(prefix)
                && country.localLengths.includes(digits.length - prefix.length)
            ) {
                return digits.slice(prefix.length);
            }
        }

        return digits;
    }

    static localMaskForCountry(country) {
        const mask = String(country.mask ?? '').trim();

        if (mask.startsWith(country.dialCode)) {
            return mask.slice(country.dialCode.length).trim();
        }

        return mask;
    }

    static detectCountryIso2(value, countries, fallbackIso2 = null) {
        const raw = String(value ?? '').trim();
        const digits = PhoneInputComponent.onlyDigits(raw);
        const fallbackCountry = PhoneInputComponent.countryByIso2(countries, fallbackIso2);

        if (digits.length === 0) {
            return fallbackCountry?.iso2 ?? countries[0]?.iso2 ?? null;
        }

        const internationalMatch = PhoneInputComponent.chooseBestCandidate(
            PhoneInputComponent.detectInternationalCandidates(raw, digits, countries),
            fallbackCountry,
        );

        if (internationalMatch) {
            return internationalMatch.iso2;
        }

        const nationalMatch = PhoneInputComponent.chooseBestCandidate(
            PhoneInputComponent.detectNationalCandidates(digits, countries),
            fallbackCountry,
        );

        if (nationalMatch) {
            return nationalMatch.iso2;
        }

        if (fallbackCountry?.localLengths.includes(digits.length)) {
            return fallbackCountry.iso2;
        }

        const localLengthMatches = countries.filter((country) => {
            return country.localLengths.includes(digits.length);
        });
        const localLeadingMatches = localLengthMatches.filter((country) => {
            return PhoneInputComponent.matchesLeadingDigits(country, digits);
        });

        if (localLeadingMatches.length === 1) {
            return localLeadingMatches[0].iso2;
        }

        if (localLengthMatches.length === 1) {
            return localLengthMatches[0].iso2;
        }

        return fallbackCountry?.iso2 ?? countries[0]?.iso2 ?? null;
    }

    static detectInternationalCandidates(raw, digits, countries) {
        return [...countries]
            .sort((first, second) => second.dialDigits.length - first.dialDigits.length)
            .filter((country) => digits.startsWith(country.dialDigits))
            .map((country) => {
                return {
                    country,
                    localDigits: digits.slice(country.dialDigits.length),
                };
            })
            .filter(({ country, localDigits }) => {
                if (localDigits.length === 0 || localDigits.length > country.maxLocalLength) {
                    return false;
                }

                const minLocalLength = Math.min(...country.localLengths);

                return raw.includes('+')
                    || country.localLengths.includes(localDigits.length)
                    || digits.length >= country.dialDigits.length + minLocalLength;
            });
    }

    static detectNationalCandidates(digits, countries) {
        const candidates = [];

        countries.forEach((country) => {
            const prefixes = [...country.nationalPrefixes].sort((first, second) => {
                return second.length - first.length;
            });

            for (const prefix of prefixes) {
                if (! digits.startsWith(prefix)) {
                    continue;
                }

                const localDigits = digits.slice(prefix.length);

                if (! country.localLengths.includes(localDigits.length)) {
                    continue;
                }

                candidates.push({ country, localDigits });

                break;
            }
        });

        return candidates;
    }

    static chooseBestCandidate(candidates, fallbackCountry) {
        if (candidates.length === 0) {
            return null;
        }

        const leadingMatches = candidates.filter(({ country, localDigits }) => {
            return PhoneInputComponent.matchesLeadingDigits(country, localDigits);
        });

        if (leadingMatches.length === 1) {
            return leadingMatches[0].country;
        }

        if (leadingMatches.length > 1) {
            return PhoneInputComponent.candidateCountryByFallback(leadingMatches, fallbackCountry)
                ?? leadingMatches[0].country;
        }

        const exactLengthMatches = candidates.filter(({ country, localDigits }) => {
            return country.localLengths.includes(localDigits.length);
        });

        if (exactLengthMatches.length === 1) {
            return exactLengthMatches[0].country;
        }

        if (exactLengthMatches.length > 1) {
            return PhoneInputComponent.candidateCountryByFallback(exactLengthMatches, fallbackCountry)
                ?? exactLengthMatches.find(({ country }) => ! country.leadingDigits)?.country
                ?? exactLengthMatches[0].country;
        }

        return candidates[0].country;
    }

    static candidateCountryByFallback(candidates, fallbackCountry) {
        if (! fallbackCountry) {
            return null;
        }

        return candidates.find(({ country }) => country.iso2 === fallbackCountry.iso2)?.country ?? null;
    }

    static matchesLeadingDigits(country, localDigits) {
        if (! country.leadingDigits) {
            return false;
        }

        try {
            return new RegExp(`^(?:${country.leadingDigits})`).test(localDigits);
        } catch {
            return false;
        }
    }

    static lookupCountryFromPayload(payload, countryKey) {
        if (typeof payload === 'string') {
            const value = payload.trim();

            if (/^[a-z]{2}$/i.test(value)) {
                return PhoneInputComponent.normalizeIso2(value);
            }

            const match = value.match(/(?:^|\n)(?:loc|country|country_code)=([a-z]{2})(?:\n|$)/i);

            return match ? PhoneInputComponent.normalizeIso2(match[1]) : null;
        }

        const configuredValue = PhoneInputComponent.valueByPath(payload, countryKey);

        if (configuredValue) {
            return PhoneInputComponent.normalizeIso2(configuredValue);
        }

        for (const key of ['country_code', 'countryCode', 'country', 'loc']) {
            const value = PhoneInputComponent.valueByPath(payload, key);

            if (value) {
                return PhoneInputComponent.normalizeIso2(value);
            }
        }

        return null;
    }

    static valueByPath(payload, path) {
        if (! path || typeof payload !== 'object' || payload === null) {
            return null;
        }

        return String(path)
            .split('.')
            .reduce((value, key) => {
                if (value === null || typeof value !== 'object') {
                    return null;
                }

                return value[key] ?? null;
            }, payload);
    }

    static normalizeCountryDefinitions(countryDefinitions) {
        const countries = Array.isArray(countryDefinitions)
            ? countryDefinitions
            : Object.values(countryDefinitions ?? {});

        return countries
            .map((country) => {
                const iso2 = PhoneInputComponent.normalizeIso2(country.iso2);
                const dialCode = String(country.dialCode ?? '').trim();
                const dialDigits = PhoneInputComponent.onlyDigits(country.dialDigits ?? dialCode);
                const localLength = Number(country.localLength ?? 0);
                const localLengths = PhoneInputComponent.normalizeLocalLengths(country, localLength);
                const maxLocalLength = localLengths.length > 0 ? Math.max(...localLengths) : 0;

                return {
                    iso2,
                    name: String(country.name ?? iso2),
                    dialCode,
                    dialDigits,
                    localLength,
                    localLengths,
                    maxLocalLength,
                    mask: String(country.mask ?? ''),
                    placeholder: String(country.placeholder ?? ''),
                    nationalPrefixes: Array.isArray(country.nationalPrefixes)
                        ? country.nationalPrefixes
                            .map((prefix) => PhoneInputComponent.onlyDigits(prefix))
                            .filter(Boolean)
                        : [],
                    leadingDigits: country.leadingDigits ? String(country.leadingDigits) : null,
                    isFavorite: Boolean(country.isFavorite),
                };
            })
            .filter((country) => {
                return country.iso2 !== ''
                    && country.dialCode !== ''
                    && country.dialDigits !== ''
                    && country.localLength > 0
                    && country.maxLocalLength > 0
                    && country.mask.includes('#');
            });
    }

    static normalizeLocalLengths(country, localLength) {
        if (! Array.isArray(country.localLengths)) {
            return localLength > 0 ? [localLength] : [];
        }

        return [
            ...new Set(
                country.localLengths
                    .map((length) => Number(length))
                    .filter((length) => length > 0),
            ),
        ].sort((first, second) => first - second);
    }

    static countryByIso2(countries, iso2) {
        const normalizedIso2 = PhoneInputComponent.normalizeIso2(iso2);

        return countries.find((country) => country.iso2 === normalizedIso2) ?? countries[0] ?? null;
    }

    static normalizeObject(value) {
        return value && typeof value === 'object' ? value : {};
    }

    static normalizeSearch(value) {
        return String(value ?? '').trim().toLowerCase();
    }

    static normalizeIso2(value) {
        return String(value ?? '').trim().toUpperCase();
    }

    static normalizeFlagAspect(value) {
        return FLAG_ASPECTS.includes(value) ? value : '4x3';
    }

    static normalizePhoneNumberFormat(value) {
        return PHONE_NUMBER_FORMATS.includes(value) ? value : 'e164';
    }

    static onlyDigits(value) {
        return String(value ?? '').replace(/\D/g, '');
    }
}

window.phoneInputComponent = (configuration) => new PhoneInputComponent(configuration);