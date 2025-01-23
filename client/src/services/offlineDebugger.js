class OfflineDebugger {
  static log(action, data = {}) {
    console.log(`[OFFLINE] ${action}:`, data);
  }

  static error(action, error, data = {}) {
    console.error(`[OFFLINE ERROR] ${action}:`, {
      error: error.message || error,
      ...data,
    });
  }

  static warn(action, data = {}) {
    console.warn(`[OFFLINE WARNING] ${action}:`, data);
  }
}

export default OfflineDebugger;
