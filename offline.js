let deferredInstallPrompt = null;

function safelyCall(callback, value) {
  try {
    if (typeof callback === 'function') {
      callback(value);
    }
  } catch (error) {
    console.warn('An online status callback failed', error);
  }
}

try {
  if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('beforeinstallprompt', (event) => {
      try {
        event.preventDefault();
        deferredInstallPrompt = event;
      } catch (error) {
        deferredInstallPrompt = null;
        console.warn('Could not capture the install prompt', error);
      }
    });

    window.addEventListener('appinstalled', () => {
      deferredInstallPrompt = null;
    });
  }
} catch (error) {
  deferredInstallPrompt = null;
  console.warn('Install prompt events are unavailable', error);
}

export async function registerSW() {
  try {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return null;
    }

    const protocol = window.location && window.location.protocol;
    if (protocol !== 'http:' && protocol !== 'https:') {
      return null;
    }

    if (!('serviceWorker' in navigator)) {
      return null;
    }

    return await navigator.serviceWorker.register('./sw.js');
  } catch (error) {
    console.warn('Service worker registration is unavailable', error);
    return null;
  }
}

export function onOnlineChange(callback) {
  try {
    if (typeof window === 'undefined' || !window.addEventListener) {
      return () => {};
    }

    const handleOnline = () => safelyCall(callback, true);
    const handleOffline = () => safelyCall(callback, false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      try {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      } catch (error) {
        console.warn('Could not remove online status listeners', error);
      }
    };
  } catch (error) {
    console.warn('Online status events are unavailable', error);
    return () => {};
  }
}

export function canInstall() {
  try {
    return Boolean(deferredInstallPrompt);
  } catch (error) {
    return false;
  }
}

export async function promptInstall() {
  try {
    if (!deferredInstallPrompt) {
      return false;
    }

    const promptEvent = deferredInstallPrompt;
    deferredInstallPrompt = null;
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    return Boolean(choice && choice.outcome === 'accepted');
  } catch (error) {
    deferredInstallPrompt = null;
    console.warn('The install prompt is unavailable', error);
    return false;
  }
}
