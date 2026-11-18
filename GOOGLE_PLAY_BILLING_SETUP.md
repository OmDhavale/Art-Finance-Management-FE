# Google Play Billing setup (frontend)

This frontend integration uses `expo-iap` and the subscription product ID `artist_finance_pro_yearly`.

## 1. Install and build

```bash
npm install
npx expo install expo-iap
npx expo-doctor
```

In-app purchases require native code; Expo Go will not work. Create a development build:

```bash
 eas build --profile development --platform android
```

Install that development build on a physical Android device with Google Play Store. Do not test purchases in Expo Go.

## 2. Play Console product setup

1. Create the app using the exact package name in `app.json`: `com.omdhavale15.ArtFinanceManagementFE`.
2. Upload an AAB containing Google Play Billing to an internal testing track.
3. In Monetize > Products > Subscriptions, create subscription product ID `artist_finance_pro_yearly`.
4. Create and activate an annual base plan (12-month billing period).
5. Set the India price to INR 999. Google Play returns the localized price; the app displays `displayPrice` from the store rather than hard-coding the checkout amount.
6. Add your tester Gmail under License testing and add it to the internal testing track.

Product ID and package name must match the backend environment variables exactly. The subscription/base plan must be active and available in the tester's country.

## 3. Frontend behavior

- `UpgradePlanScreen` loads the subscription from Google Play.
- Purchase results are sent to the authenticated backend for verification.
- The transaction is finished only after backend verification succeeds.
- Available purchases are queried when the screen opens and can be restored manually.
- Cancellation/renewal management opens the Google Play subscriptions page.

## 4. Important

The UI is only a client. Never restore the old `/users/update-plan` endpoint or grant PRO from local state. The server owns the entitlement. Test with a Play-installed build and a license tester; a local Expo Go session cannot exercise the billing native module.
