/** Client-side Google Maps API key (must be NEXT_PUBLIC_ in .env.local) */
export function getGoogleMapsApiKey(): string {
  return (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '').trim();
}

export function isGoogleMapsKeyConfigured(): boolean {
  return getGoogleMapsApiKey().length > 10;
}

/** Human-readable hints for errors shown in the browser console */
export const GOOGLE_MAPS_ERROR_HINTS: Record<string, string> = {
  RefererNotAllowedMapError:
    'Your API key does not allow this site. In Google Cloud → Credentials → your key → Application restrictions, choose "HTTP referrers" and add: http://localhost:3000/* and http://127.0.0.1:3000/* (then Save and wait a few minutes).',
  ApiNotActivatedMapError:
    'Enable "Maps JavaScript API" for your Google Cloud project (APIs & Services → Library).',
  InvalidKeyMapError:
    'The API key is invalid or was deleted. Create a new browser key and update NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env.local.',
  MissingKeyMapError:
    'No API key was sent to Google. Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env.local and restart npm run dev.',
  BillingNotEnabledMapError:
    'Billing must be enabled on your Google Cloud project (free tier still requires a billing account).',
  ApiTargetBlockedMapError:
    'Under API restrictions on your key, allow "Maps JavaScript API" (or temporarily set API restrictions to None to test).',
};

export function hintForGoogleMapsConsoleMessage(message: string): string | null {
  for (const [code, hint] of Object.entries(GOOGLE_MAPS_ERROR_HINTS)) {
    if (message.includes(code)) return hint;
  }
  if (message.includes('Google Maps JavaScript API error')) {
    return 'Open the browser console (F12) for the exact error code, then check API key restrictions and that Maps JavaScript API is enabled.';
  }
  return null;
}
