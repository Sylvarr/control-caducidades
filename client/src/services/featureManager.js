class FeatureManager {
  static features = {
    OFFLINE_MODE: true, // Por defecto habilitamos el modo offline
  };

  static isEnabled(featureName) {
    return this.features[featureName] || false;
  }

  static enable(featureName) {
    this.features[featureName] = true;
  }

  static disable(featureName) {
    this.features[featureName] = false;
  }

  static toggle(featureName) {
    this.features[featureName] = !this.features[featureName];
    return this.features[featureName];
  }
}

export default FeatureManager;
