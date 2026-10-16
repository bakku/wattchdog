import type { ConfigContext, ExpoConfig } from 'expo/config';

// CI passes the release tag (v1.2.3 → 1.2.3) and a monotonically increasing
// build number, so every APK installs as an update over the previous one.
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...(config as ExpoConfig),
  version: process.env.APP_VERSION ?? config.version,
  android: {
    ...config.android,
    versionCode: process.env.ANDROID_VERSION_CODE ? Number(process.env.ANDROID_VERSION_CODE) : 1,
  },
});
