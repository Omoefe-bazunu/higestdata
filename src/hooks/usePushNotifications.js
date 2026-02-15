"use client";

import { useState, useEffect } from "react";

const API = process.env.NEXT_PUBLIC_API_URL;

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function usePushNotifications(user) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window
    ) {
      setIsSupported(true);
      checkSubscription();
    }
  }, [user]);

  const checkSubscription = async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setIsSubscribed(!!sub);
    } catch {
      setIsSubscribed(false);
    }
  };

  const subscribe = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      // Register service worker
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      // Get VAPID key
      const keyRes = await fetch(`${API}/api/push/vapid-key`);
      const { publicKey } = await keyRes.json();

      // Request permission
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setIsLoading(false);
        return { error: "Permission denied" };
      }

      // Subscribe
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      // Save to backend
      const token = await user.getIdToken();
      await fetch(`${API}/api/push/subscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ subscription }),
      });

      setIsSubscribed(true);
      return { success: true };
    } catch (error) {
      console.error("Subscribe error:", error);
      return { error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribe = async () => {
    setIsLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch(`${API}/api/push/unsubscribe`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setIsSubscribed(false);
    } catch (error) {
      console.error("Unsubscribe error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return { isSubscribed, isLoading, isSupported, subscribe, unsubscribe };
}
