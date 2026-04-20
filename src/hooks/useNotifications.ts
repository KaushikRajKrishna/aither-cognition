import { useState, useEffect, useCallback } from "react";

const API_BASE = "/api";

function getToken() {
  return sessionStorage.getItem("token");
}

async function authFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export type NotificationState = "unsupported" | "denied" | "granted" | "default";

export function useNotifications() {
  const [state, setState] = useState<NotificationState>("default");
  const [loading, setLoading] = useState(false);

  // Reflect the current browser permission on mount
  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setState("unsupported");
      return;
    }
    setState(Notification.permission as NotificationState);
  }, []);

  const subscribe = useCallback(async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    setLoading(true);
    try {
      // Register service worker
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      // Get VAPID public key from server
      const keyRes = await fetch(`${API_BASE}/notifications/vapid-public-key`);
      const { publicKey } = await keyRes.json();

      // Request permission + subscribe
      const permission = await Notification.requestPermission();
      setState(permission as NotificationState);
      if (permission !== "granted") return;

      const pushSub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      // Save subscription on server
      await authFetch("/notifications/subscribe", {
        method: "POST",
        body: JSON.stringify({ subscription: pushSub.toJSON() }),
      });
    } catch (err) {
      console.error("Failed to subscribe to push notifications:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration("/sw.js");
      const pushSub = await reg?.pushManager.getSubscription();
      if (!pushSub) return;

      await authFetch("/notifications/subscribe", {
        method: "DELETE",
        body: JSON.stringify({ endpoint: pushSub.endpoint }),
      });
      await pushSub.unsubscribe();
      setState("default");
    } catch (err) {
      console.error("Failed to unsubscribe:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { state, loading, subscribe, unsubscribe };
}
