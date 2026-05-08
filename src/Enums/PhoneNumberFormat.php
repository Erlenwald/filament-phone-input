<?php

namespace Erlenwald\FilamentPhoneInput\Enums;

enum PhoneNumberFormat: string
{
    case E164 = 'e164';
    case National = 'national';
    case International = 'international';
    case Rfc3966 = 'rfc3966';
    case Digits = 'digits';
    case NationalDigits = 'national_digits';
}