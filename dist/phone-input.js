const p = [
  "e164",
  "national",
  "international",
  "rfc3966",
  "digits",
  "national_digits"
], w = ["1x1", "4x3"], D = [
  "--gray-50",
  "--gray-100",
  "--gray-200",
  "--gray-300",
  "--gray-400",
  "--gray-500",
  "--gray-600",
  "--gray-700",
  "--gray-800",
  "--gray-900",
  "--gray-950",
  "--primary-50",
  "--primary-100",
  "--primary-200",
  "--primary-300",
  "--primary-400",
  "--primary-500",
  "--primary-600",
  "--primary-700",
  "--primary-800",
  "--primary-900",
  "--primary-950"
];
class r {
  constructor(t) {
    this.phoneStatePath = t.phoneStatePath, this.countryStatePath = t.countryStatePath, this.rawCountryDefinitions = t.countryDefinitions, this.countryGroupLabels = r.normalizeObject(t.countryGroupLabels), this.defaultCountry = r.normalizeIso2(t.defaultCountry), this.showCountryFlag = !!t.showCountryFlag, this.flagAspect = r.normalizeFlagAspect(t.flagAspect), this.phoneNumberFormat = r.normalizePhoneNumberFormat(t.phoneNumberFormat), this.ipLookupEnabled = !!t.ipLookupEnabled, this.ipLookupUrl = t.ipLookupUrl ? String(t.ipLookupUrl) : null, this.ipLookupCountryKey = t.ipLookupCountryKey ? String(t.ipLookupCountryKey) : null, this.open = !1, this.search = "", this.dropdownStyle = "", this.countries = [], this.selectedIso2 = null, this.boundPositionDropdown = null, this.boundDocumentClick = null;
  }
  init() {
    this.countries = r.normalizeCountryDefinitions(this.rawCountryDefinitions);
    const t = this.$wire.get(this.phoneStatePath), i = (this.countryStatePath ? this.$wire.get(this.countryStatePath) : null) || this.defaultCountry || null;
    this.selectedIso2 = r.detectCountryIso2(
      t,
      this.countries,
      i
    ), this.refreshVisibleValue(t), this.bindGlobalListeners(), this.syncState(), this.lookupCountryByIp();
  }
  destroy() {
    this.boundPositionDropdown && (window.removeEventListener("resize", this.boundPositionDropdown), window.removeEventListener("scroll", this.boundPositionDropdown, !0)), this.boundDocumentClick && document.removeEventListener("mousedown", this.boundDocumentClick, !0);
  }
  get selectedCountry() {
    return r.countryByIso2(this.countries, this.selectedIso2);
  }
  get favoriteCountries() {
    return this.countries.filter((t) => t.isFavorite);
  }
  get regularCountries() {
    return this.countries.filter((t) => !t.isFavorite);
  }
  get filteredFavoriteCountries() {
    return this.filterCountries(this.favoriteCountries);
  }
  get filteredRegularCountries() {
    return this.filterCountries(this.regularCountries);
  }
  get filteredCountryGroups() {
    const t = [];
    return this.filteredFavoriteCountries.length > 0 && t.push({
      key: "favorites",
      label: this.countryGroupLabels.favorites ?? "Favorites",
      countries: this.filteredFavoriteCountries
    }), this.filteredRegularCountries.length > 0 && t.push({
      key: "countries",
      label: this.filteredFavoriteCountries.length > 0 ? this.countryGroupLabels.allCountries ?? "All countries" : "",
      countries: this.filteredRegularCountries
    }), t;
  }
  get hasFilteredCountries() {
    return this.filteredFavoriteCountries.length > 0 || this.filteredRegularCountries.length > 0;
  }
  bindGlobalListeners() {
    this.boundPositionDropdown = () => {
      this.open && this.positionDropdown();
    }, this.boundDocumentClick = (t) => {
      var e, i;
      this.open && ((e = this.$refs.wrapper) != null && e.contains(t.target) || (i = this.$refs.dropdown) != null && i.contains(t.target) || this.closeDropdown());
    }, window.addEventListener("resize", this.boundPositionDropdown), window.addEventListener("scroll", this.boundPositionDropdown, !0), document.addEventListener("mousedown", this.boundDocumentClick, !0);
  }
  filterCountries(t) {
    const e = r.normalizeSearch(this.search);
    return e === "" ? t : t.filter((i) => [
      i.iso2,
      i.name,
      i.dialCode,
      i.dialDigits
    ].some((s) => r.normalizeSearch(s).includes(e)));
  }
  flagCssClasses(t) {
    return `${this.flagAspect === "1x1" ? "fi-phone-input__flag-aspect-1x1 fi-phone-input__flag--square" : "fi-phone-input__flag-aspect-4x3 fi-phone-input__flag--rectangle"} fi-phone-input__flag-country-${r.normalizeIso2(t).toLowerCase()}`;
  }
  toggleDropdown() {
    if (!(!this.$refs.input || this.$refs.input.disabled || !this.selectedCountry)) {
      if (this.open) {
        this.closeDropdown();
        return;
      }
      this.openDropdown();
    }
  }
  openDropdown() {
    this.open = !0, this.search = "", this.$nextTick(() => {
      var t;
      this.syncThemeVariables(), this.positionDropdown(), (t = this.$refs.searchInput) == null || t.focus();
    });
  }
  closeDropdown() {
    this.open = !1;
  }
  positionDropdown() {
    this.syncThemeVariables();
    const t = this.$refs.wrapper;
    if (!t)
      return;
    const e = t.getBoundingClientRect(), i = window.innerWidth, s = window.innerHeight, a = 8, l = 4, n = Math.min(Math.max(e.width, 320), i - a * 2), c = Math.min(Math.max(e.left, a), i - n - a), o = s - e.bottom - l - a, u = e.top - l - a, d = o >= 220 || o >= u, g = Math.max(96, d ? o : u), h = Math.min(320, g);
    let f = d ? e.bottom + l : e.top - l - h;
    f = Math.min(Math.max(f, a), s - h - a), this.dropdownStyle = [
      `top: ${f}px`,
      `left: ${c}px`,
      `width: ${n}px`,
      `max-height: ${h}px`
    ].join("; ");
  }
  syncThemeVariables() {
    const t = this.$refs.wrapper, e = this.$refs.dropdown;
    if (!t || !e)
      return;
    const i = window.getComputedStyle(t);
    D.forEach((a) => {
      const l = i.getPropertyValue(a).trim();
      l !== "" && e.style.setProperty(a, l);
    });
    const s = !!(t.closest(".dark") || document.documentElement.classList.contains("dark") || document.body.classList.contains("dark"));
    e.classList.toggle("fi-phone-input__dropdown--dark", s);
  }
  selectCountry(t) {
    const e = this.selectedCountry, i = r.countryByIso2(this.countries, t);
    if (!e || !i || !this.$refs.input)
      return;
    const s = r.localDigitsForCountry(
      this.$refs.input.value,
      e
    );
    this.selectedIso2 = i.iso2, this.closeDropdown(), this.refreshVisibleValue(s), this.syncState(), this.$nextTick(() => {
      this.$refs.input.focus();
    });
  }
  handleFocus() {
    !this.selectedCountry || !this.$refs.input || this.$refs.input.value === "" && (this.$refs.input.value = `${this.selectedCountry.dialCode} `);
  }
  handleInput() {
    this.$refs.input && this.applyRawValue(this.$refs.input.value);
  }
  handlePaste(t) {
    var i;
    const e = (i = t.clipboardData) == null ? void 0 : i.getData("text");
    e && (t.preventDefault(), this.applyRawValue(e));
  }
  handleBlur() {
    if (!this.selectedCountry || !this.$refs.input)
      return;
    const t = r.localDigitsForCountry(
      this.$refs.input.value,
      this.selectedCountry
    );
    this.refreshVisibleValue(t), this.syncState();
  }
  applyRawValue(t) {
    const e = r.detectCountryIso2(
      t,
      this.countries,
      this.selectedIso2
    );
    e && (this.selectedIso2 = e), this.refreshVisibleValue(t), this.syncState();
  }
  refreshVisibleValue(t) {
    if (!this.$refs.input || !this.selectedCountry)
      return;
    const e = r.localDigitsForCountry(t, this.selectedCountry);
    this.$refs.input.value = e.length === 0 ? "" : r.formatInternationalForCountry(e, this.selectedCountry);
  }
  syncState() {
    !this.selectedCountry || !this.$refs.input || (this.$wire.set(
      this.phoneStatePath,
      r.phoneValueForCountry(
        this.$refs.input.value,
        this.selectedCountry,
        this.phoneNumberFormat
      ),
      !1
    ), this.countryStatePath && this.$wire.set(this.countryStatePath, this.selectedCountry.iso2, !1));
  }
  async lookupCountryByIp() {
    var t, e;
    if (!(!this.ipLookupEnabled || !this.ipLookupUrl || !this.selectedCountry) && !((t = this.$refs.input) != null && t.value))
      try {
        const i = await fetch(this.ipLookupUrl, {
          headers: {
            Accept: "application/json, text/plain"
          },
          credentials: "same-origin"
        });
        if (!i.ok)
          return;
        const a = (i.headers.get("content-type") ?? "").includes("application/json") ? await i.json() : await i.text(), l = r.lookupCountryFromPayload(
          a,
          this.ipLookupCountryKey
        ), n = r.countryByIso2(this.countries, l);
        if (!n || (e = this.$refs.input) != null && e.value)
          return;
        this.selectedIso2 = n.iso2, this.syncState();
      } catch {
      }
  }
  static phoneValueForCountry(t, e, i) {
    const s = r.localDigitsForCountry(t, e);
    if (!e || !e.localLengths.includes(s.length))
      return null;
    if (i === "national")
      return r.formatNationalForCountry(s, e);
    if (i === "international")
      return r.formatInternationalForCountry(s, e);
    if (i === "rfc3966") {
      const a = r.e164ForCountry(s, e);
      return a ? `tel:${a}` : null;
    }
    if (i === "digits") {
      const a = r.e164ForCountry(s, e);
      return a ? r.onlyDigits(a) : null;
    }
    return i === "national_digits" ? s : r.e164ForCountry(s, e);
  }
  static e164ForCountry(t, e) {
    if (!e)
      return null;
    const i = r.localDigitsForCountry(t, e);
    return e.localLengths.includes(i.length) ? `${e.dialCode}${i}` : null;
  }
  static formatInternationalForCountry(t, e) {
    return e ? r.formatDigitsByMask(
      r.localDigitsForCountry(t, e),
      e.mask
    ) : "";
  }
  static formatNationalForCountry(t, e) {
    if (!e)
      return "";
    const i = r.localDigitsForCountry(t, e), s = r.formatDigitsByMask(
      i,
      r.localMaskForCountry(e)
    ), a = e.nationalPrefixes[0] ?? "";
    return s === "" ? "" : a ? `${a} ${s}` : s;
  }
  static formatDigitsByMask(t, e) {
    if (t.length === 0)
      return "";
    let i = "", s = 0;
    for (const a of e) {
      if (a !== "#") {
        i += a;
        continue;
      }
      if (s >= t.length)
        break;
      i += t[s], s += 1;
    }
    return i;
  }
  static localDigitsForCountry(t, e) {
    const i = String(t ?? "").trim();
    let s = r.onlyDigits(i);
    if (!e || s.length === 0)
      return "";
    if (s.startsWith(e.dialDigits)) {
      const a = s.slice(e.dialDigits.length);
      (i.includes("+") || e.localLengths.includes(a.length)) && (s = a);
    } else
      s = r.stripNationalPrefix(s, e);
    return s.slice(0, e.maxLocalLength);
  }
  static stripNationalPrefix(t, e) {
    const i = [...e.nationalPrefixes].sort((s, a) => a.length - s.length);
    for (const s of i)
      if (t.startsWith(s) && e.localLengths.includes(t.length - s.length))
        return t.slice(s.length);
    return t;
  }
  static localMaskForCountry(t) {
    const e = String(t.mask ?? "").trim();
    return e.startsWith(t.dialCode) ? e.slice(t.dialCode.length).trim() : e;
  }
  static detectCountryIso2(t, e, i = null) {
    var d, g;
    const s = String(t ?? "").trim(), a = r.onlyDigits(s), l = r.countryByIso2(e, i);
    if (a.length === 0)
      return (l == null ? void 0 : l.iso2) ?? ((d = e[0]) == null ? void 0 : d.iso2) ?? null;
    const n = r.chooseBestCandidate(
      r.detectInternationalCandidates(s, a, e),
      l
    );
    if (n)
      return n.iso2;
    const c = r.chooseBestCandidate(
      r.detectNationalCandidates(a, e),
      l
    );
    if (c)
      return c.iso2;
    if (l != null && l.localLengths.includes(a.length))
      return l.iso2;
    const o = e.filter((h) => h.localLengths.includes(a.length)), u = o.filter((h) => r.matchesLeadingDigits(h, a));
    return u.length === 1 ? u[0].iso2 : o.length === 1 ? o[0].iso2 : (l == null ? void 0 : l.iso2) ?? ((g = e[0]) == null ? void 0 : g.iso2) ?? null;
  }
  static detectInternationalCandidates(t, e, i) {
    return [...i].sort((s, a) => a.dialDigits.length - s.dialDigits.length).filter((s) => e.startsWith(s.dialDigits)).map((s) => ({
      country: s,
      localDigits: e.slice(s.dialDigits.length)
    })).filter(({ country: s, localDigits: a }) => {
      if (a.length === 0 || a.length > s.maxLocalLength)
        return !1;
      const l = Math.min(...s.localLengths);
      return t.includes("+") || s.localLengths.includes(a.length) || e.length >= s.dialDigits.length + l;
    });
  }
  static detectNationalCandidates(t, e) {
    const i = [];
    return e.forEach((s) => {
      const a = [...s.nationalPrefixes].sort((l, n) => n.length - l.length);
      for (const l of a) {
        if (!t.startsWith(l))
          continue;
        const n = t.slice(l.length);
        if (s.localLengths.includes(n.length)) {
          i.push({ country: s, localDigits: n });
          break;
        }
      }
    }), i;
  }
  static chooseBestCandidate(t, e) {
    var a;
    if (t.length === 0)
      return null;
    const i = t.filter(({ country: l, localDigits: n }) => r.matchesLeadingDigits(l, n));
    if (i.length === 1)
      return i[0].country;
    if (i.length > 1)
      return r.candidateCountryByFallback(i, e) ?? i[0].country;
    const s = t.filter(({ country: l, localDigits: n }) => l.localLengths.includes(n.length));
    return s.length === 1 ? s[0].country : s.length > 1 ? r.candidateCountryByFallback(s, e) ?? ((a = s.find(({ country: l }) => !l.leadingDigits)) == null ? void 0 : a.country) ?? s[0].country : t[0].country;
  }
  static candidateCountryByFallback(t, e) {
    var i;
    return e ? ((i = t.find(({ country: s }) => s.iso2 === e.iso2)) == null ? void 0 : i.country) ?? null : null;
  }
  static matchesLeadingDigits(t, e) {
    if (!t.leadingDigits)
      return !1;
    try {
      return new RegExp(`^(?:${t.leadingDigits})`).test(e);
    } catch {
      return !1;
    }
  }
  static lookupCountryFromPayload(t, e) {
    if (typeof t == "string") {
      const s = t.trim();
      if (/^[a-z]{2}$/i.test(s))
        return r.normalizeIso2(s);
      const a = s.match(/(?:^|\n)(?:loc|country|country_code)=([a-z]{2})(?:\n|$)/i);
      return a ? r.normalizeIso2(a[1]) : null;
    }
    const i = r.valueByPath(t, e);
    if (i)
      return r.normalizeIso2(i);
    for (const s of ["country_code", "countryCode", "country", "loc"]) {
      const a = r.valueByPath(t, s);
      if (a)
        return r.normalizeIso2(a);
    }
    return null;
  }
  static valueByPath(t, e) {
    return !e || typeof t != "object" || t === null ? null : String(e).split(".").reduce((i, s) => i === null || typeof i != "object" ? null : i[s] ?? null, t);
  }
  static normalizeCountryDefinitions(t) {
    return (Array.isArray(t) ? t : Object.values(t ?? {})).map((i) => {
      const s = r.normalizeIso2(i.iso2), a = String(i.dialCode ?? "").trim(), l = r.onlyDigits(i.dialDigits ?? a), n = Number(i.localLength ?? 0), c = r.normalizeLocalLengths(i, n), o = c.length > 0 ? Math.max(...c) : 0;
      return {
        iso2: s,
        name: String(i.name ?? s),
        dialCode: a,
        dialDigits: l,
        localLength: n,
        localLengths: c,
        maxLocalLength: o,
        mask: String(i.mask ?? ""),
        placeholder: String(i.placeholder ?? ""),
        nationalPrefixes: Array.isArray(i.nationalPrefixes) ? i.nationalPrefixes.map((u) => r.onlyDigits(u)).filter(Boolean) : [],
        leadingDigits: i.leadingDigits ? String(i.leadingDigits) : null,
        isFavorite: !!i.isFavorite
      };
    }).filter((i) => i.iso2 !== "" && i.dialCode !== "" && i.dialDigits !== "" && i.localLength > 0 && i.maxLocalLength > 0 && i.mask.includes("#"));
  }
  static normalizeLocalLengths(t, e) {
    return Array.isArray(t.localLengths) ? [
      ...new Set(
        t.localLengths.map((i) => Number(i)).filter((i) => i > 0)
      )
    ].sort((i, s) => i - s) : e > 0 ? [e] : [];
  }
  static countryByIso2(t, e) {
    const i = r.normalizeIso2(e);
    return t.find((s) => s.iso2 === i) ?? t[0] ?? null;
  }
  static normalizeObject(t) {
    return t && typeof t == "object" ? t : {};
  }
  static normalizeSearch(t) {
    return String(t ?? "").trim().toLowerCase();
  }
  static normalizeIso2(t) {
    return String(t ?? "").trim().toUpperCase();
  }
  static normalizeFlagAspect(t) {
    return w.includes(t) ? t : "4x3";
  }
  static normalizePhoneNumberFormat(t) {
    return p.includes(t) ? t : "e164";
  }
  static onlyDigits(t) {
    return String(t ?? "").replace(/\D/g, "");
  }
}
window.phoneInputComponent = (y) => new r(y);
