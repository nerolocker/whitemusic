'use strict';const electron=require('electron'),uuid=require('uuid'),Store=require('electron-store'),node_crypto=require('node:crypto'),node_os=require('node:os');const appConfig={appHostname:"desktop"};const buildInfo={VERSION:"5.91.1",BRANCH:"76bac4f2845e69147ab26858aeececaaed032131"};const config = {
  app: appConfig,
  buildInfo};var StorageKeys = /* @__PURE__ */ ((StorageKeys2) => {
  StorageKeys2["Theme"] = "theme";
  return StorageKeys2;
})(StorageKeys || {});var Theme = /* @__PURE__ */ ((Theme2) => {
  Theme2["Dark"] = "dark";
  Theme2["Light"] = "light";
  return Theme2;
})(Theme || {});const getLocalStorageTheme = () => {
  const item = window.localStorage.getItem(StorageKeys.Theme);
  if (!item) {
    return null;
  }
  try {
    const value = JSON.parse(item)?.value;
    if (value && typeof value === "string" && Object.values(Theme).includes(value)) {
      return value;
    }
  } catch {
  }
  return null;
};
const getSystemTheme = () => {
  const media = window.matchMedia(`(prefers-color-scheme: light)`);
  return media.matches ? Theme.Light : Theme.Dark;
};
const getInitialTheme = () => {
  const theme = getLocalStorageTheme();
  switch (theme) {
    case Theme.Dark:
    case Theme.Light:
      return theme;
    default:
      return getSystemTheme();
  }
};const UNIVERSAL_DIGIT_REGEX = /[014589cd]/;
const ZERO_MAC_REGEX = /(?:[0]{1,2}[:-]){5}[0]{1,2}/;
const isGloballyUniqueMacAddress = (mac) => {
  const digit = mac[1];
  if (!digit) {
    return false;
  }
  return UNIVERSAL_DIGIT_REGEX.test(digit.toLowerCase());
};
const getMac = () => {
  for (const config of Object.values(node_os.networkInterfaces())) {
    if (!config) {
      continue;
    }
    for (const iface of config) {
      if (ZERO_MAC_REGEX.test(iface.mac)) {
        continue;
      }
      if (isGloballyUniqueMacAddress(iface.mac)) {
        return iface.mac;
      }
    }
  }
  return;
};
const generateDeviceId = () => {
  const data = [node_os.hostname(), node_os.platform(), node_os.machine(), node_os.totalmem(), getMac()].join();
  return node_crypto.createHash("sha256").update(data).digest("hex");
};var StoreKeys = /* @__PURE__ */ ((StoreKeys2) => {
  StoreKeys2["VERSION"] = "version";
  StoreKeys2["HAS_RECENTLY_LAUNCHED"] = "hasRecentlyLaunched";
  StoreKeys2["UUID"] = "uuid";
  StoreKeys2["DEVICE_ID"] = "deviceId";
  StoreKeys2["DEVICE_SOFTWARE_REVISION"] = "deviceSoftwareRevision";
  StoreKeys2["DEVICE_CPU_REVISION"] = "deviceCpuRevision";
  StoreKeys2["TRACKS_AVAILABILITY_UPDATED_AT"] = "tracksAvailabilityUpdatedAt";
  StoreKeys2["REPOSITORY_META_UPDATED_AT"] = "repositoryMetaUpdatedAt";
  return StoreKeys2;
})(StoreKeys || {});const store = new Store();
const useCachedValue = (key) => {
  let cachedValue = null;
  const get = () => {
    if (cachedValue) {
      return cachedValue;
    }
    cachedValue = store.get(key);
    return cachedValue;
  };
  const set = (value) => {
    cachedValue = value;
    store.set(key, value);
  };
  return [get, set];
};
const getUuid = () => {
  let uuid$1 = store.get(StoreKeys.UUID);
  if (!uuid$1) {
    uuid$1 = uuid.v4();
    store.set(StoreKeys.UUID, uuid$1);
  }
  return uuid$1;
};
const deviceId = useCachedValue(StoreKeys.DEVICE_ID);
const getDeviceId = () => {
  const [get, set] = deviceId;
  let deviceIdValue = get();
  if (deviceIdValue) {
    return String(deviceIdValue);
  }
  deviceIdValue = generateDeviceId();
  set(deviceIdValue);
  return String(deviceIdValue);
};const devicePlatform = node_os.platform();const getDeviceInfo = () => {
  return {
    manufacturer: "",
    model: "",
    uuid: getUuid(),
    os: devicePlatform,
    os_version: "",
    device_id: getDeviceId(),
    clid: 0
  };
};const getDeviceHostname = () => {
  return node_os.hostname().slice(0, 50).trim();
};const applicationHostnamePattern = new RegExp(`^${config.app.appHostname}$`);const deviceInfo = getDeviceInfo();
electron.contextBridge.exposeInMainWorld("VERSION", String(config.buildInfo.VERSION));
electron.contextBridge.exposeInMainWorld("BRANCH", String(config.buildInfo.BRANCH));
electron.contextBridge.exposeInMainWorld("PLATFORM", deviceInfo.os);
electron.contextBridge.exposeInMainWorld("DEVICE_INFO", deviceInfo);
electron.contextBridge.exposeInMainWorld("DEVICE_HOSTNAME", getDeviceHostname());
electron.contextBridge.exposeInMainWorld("desktopEvents", {
  send(name, ...args) {
    electron.ipcRenderer.send(name, ...args);
  },
  on(name, listener) {
    electron.ipcRenderer.on(name, listener);
  },
  off(name, listener) {
    electron.ipcRenderer.off(name, listener);
  },
  invoke(name, ...args) {
    return electron.ipcRenderer.invoke(name, ...args);
  }
});
window.document.addEventListener("DOMContentLoaded", () => {
  const theme = getInitialTheme();
  if (applicationHostnamePattern.test(window.location.hostname)) {
    window.document.documentElement.style.backgroundColor = theme === Theme.Light ? "#FFFFFF" : "#000000";
  }
});