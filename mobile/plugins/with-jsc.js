const { withPodfileProperties, withXcodeProject } = require('@expo/config-plugins');

module.exports = function withJavaScriptCore(config) {
  const withProperties = withPodfileProperties(config, (nextConfig) => {
    nextConfig.modResults['expo.jsEngine'] = 'jsc';
    return nextConfig;
  });

  return withXcodeProject(withProperties, (nextConfig) => {
    nextConfig.modResults.addBuildProperty('USE_HERMES', 'false');
    return nextConfig;
  });
};
