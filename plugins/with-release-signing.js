// Signs Android release builds with the keystore named by WATTCHDOG_KEYSTORE.
// Without that variable (local builds) release falls back to the debug key.
const { withAppBuildGradle } = require('expo/config-plugins');

const RELEASE_SIGNING = `
        release {
            if (System.getenv('WATTCHDOG_KEYSTORE')) {
                storeFile file(System.getenv('WATTCHDOG_KEYSTORE'))
                storePassword System.getenv('WATTCHDOG_KEYSTORE_PASSWORD')
                keyAlias System.getenv('WATTCHDOG_KEY_ALIAS')
                keyPassword System.getenv('WATTCHDOG_KEY_PASSWORD')
            }
        }`;

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (mod) => {
    let gradle = mod.modResults.contents;
    if (gradle.includes('WATTCHDOG_KEYSTORE')) return mod;

    const signingConfigs = /signingConfigs\s*\{/;
    const releaseBuildType = /(buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?)signingConfig signingConfigs\.debug/;
    if (!signingConfigs.test(gradle) || !releaseBuildType.test(gradle)) {
      throw new Error('with-release-signing: unexpected android/app/build.gradle layout');
    }

    gradle = gradle.replace(signingConfigs, (match) => match + RELEASE_SIGNING);
    gradle = gradle.replace(
      releaseBuildType,
      "$1signingConfig System.getenv('WATTCHDOG_KEYSTORE') ? signingConfigs.release : signingConfigs.debug",
    );
    mod.modResults.contents = gradle;
    return mod;
  });
};
