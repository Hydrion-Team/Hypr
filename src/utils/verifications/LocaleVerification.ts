import { z } from 'zod';
import { Locale } from 'discord-api-types/v10';

export const localeVerification = z.union([z.string(), z.enum(Locale)]).transform(arg => {
	if (typeof arg === 'string' && Object.keys(Locale).includes(arg)) {
		const localeValue = (Locale as Record<string, Locale>)[arg];
		if (localeValue !== undefined) return localeValue;
		throw new Error(`Invalid Locale string: ${arg}`);
	}
	if (Object.values(Locale).includes(arg as Locale)) {
		return arg as Locale;
	}
	throw new Error(`Invalid Locale value: ${arg}`);
});
