<x-dynamic-component :component="$getFieldWrapperView()" :field="$field">
    <div
        x-data="phoneInputComponent({
            phoneStatePath: @js($getPhoneStatePath()),
            countryStatePath: @js($getCountryStatePath()),
            countryDefinitions: @js($getCountryDefinitions()),
            countryGroupLabels: @js($getCountryGroupLabels()),
            defaultCountry: @js($getDefaultCountry()),
            showCountryFlag: @js($shouldDisplayCountryFlag()),
            flagAspect: @js($getFlagAspect()),
            phoneNumberFormat: @js($getPhoneNumberFormat()),
            ipLookupEnabled: @js($isIpLookupEnabled()),
            ipLookupUrl: @js($getIpLookupUrl()),
            ipLookupCountryKey: @js($getIpLookupCountryKey()),
        })"
        x-init="init()"
        wire:ignore
        class="fi-phone-input"
    >
        <div
            x-ref="wrapper"
            class="fi-input-wrp relative flex rounded-lg bg-white shadow-sm ring-1 ring-gray-950/10 transition duration-75 dark:bg-white/5 dark:ring-white/20 [&:has(input:focus)]:ring-2 [&:has(input:focus)]:ring-primary-600 dark:[&:has(input:focus)]:ring-primary-500"
        >
            <button
                type="button"
                x-ref="countryButton"
                class="fi-phone-input__country-button"
                aria-label="{{ __('filament-phone-input::phone-input.actions.select_country') }}"
                :aria-expanded="open.toString()"
                @click="toggleDropdown()"
                @keydown.escape.stop.prevent="closeDropdown()"
                @if ($isDisabled()) disabled @endif
            >
                <span
                    x-cloak
                    x-show="showCountryFlag && selectedCountry"
                    class="fi-phone-input__flag"
                    :class="selectedCountry ? flagCssClasses(selectedCountry.iso2) : ''"
                    aria-hidden="true"
                ></span>

                <span
                    x-show="! showCountryFlag && selectedCountry"
                    x-text="selectedCountry ? selectedCountry.iso2 : ''"
                    class="fi-phone-input__iso"
                ></span>

                <span class="fi-phone-input__arrow" aria-hidden="true"></span>
            </button>

            <input
                type="tel"
                id="{{ $getId() }}"
                x-ref="input"
                inputmode="tel"
                autocomplete="tel"
                :placeholder="selectedCountry ? selectedCountry.placeholder : ''"
                class="fi-input block w-full border-none bg-transparent py-1.5 pe-3 ps-3 text-base text-gray-950 outline-none transition duration-75 placeholder:text-gray-400 focus:ring-0 disabled:text-gray-500 dark:text-white dark:placeholder:text-gray-500 sm:text-sm sm:leading-6"
                @input="handleInput()"
                @paste="handlePaste($event)"
                @focus="handleFocus()"
                @blur="handleBlur()"
                @keydown.escape.stop="closeDropdown()"
                @if ($isDisabled()) disabled @endif
                @if ($isRequired()) required @endif
            />
        </div>

        <template x-teleport="body">
            <div
                x-cloak
                x-show="open"
                x-ref="dropdown"
                :style="dropdownStyle"
                class="fi-phone-input__dropdown"
                @keydown.escape.stop.prevent="closeDropdown()"
            >
                <div class="fi-phone-input__search">
                    <input
                        type="search"
                        x-ref="searchInput"
                        x-model="search"
                        placeholder="{{ __('filament-phone-input::phone-input.search.placeholder') }}"
                        class="fi-phone-input__search-input"
                    />
                </div>

                <div class="fi-phone-input__options">
                    <template x-for="group in filteredCountryGroups" :key="group.key">
                        <div class="fi-phone-input__group">
                            <div
                                x-show="group.label"
                                x-text="group.label"
                                class="fi-phone-input__group-label"
                            ></div>

                            <template x-for="country in group.countries" :key="country.iso2">
                                <button
                                    type="button"
                                    class="fi-phone-input__option"
                                    :class="{ 'fi-phone-input__option--selected': selectedCountry && selectedCountry.iso2 === country.iso2 }"
                                    @click="selectCountry(country.iso2)"
                                >
                                    <span
                                        x-cloak
                                        x-show="showCountryFlag"
                                        class="fi-phone-input__option-flag"
                                        :class="flagCssClasses(country.iso2)"
                                        aria-hidden="true"
                                    ></span>

                                    <span
                                        x-show="! showCountryFlag"
                                        x-text="country.iso2"
                                        class="fi-phone-input__option-iso"
                                    ></span>

                                    <span class="fi-phone-input__option-name" x-text="country.name"></span>
                                    <span class="fi-phone-input__option-code" x-text="country.dialCode"></span>
                                </button>
                            </template>
                        </div>
                    </template>

                    <div
                        x-show="! hasFilteredCountries"
                        class="fi-phone-input__no-results"
                    >
                        {{ __('filament-phone-input::phone-input.search.no_results') }}
                    </div>
                </div>
            </div>
        </template>
    </div>
</x-dynamic-component>