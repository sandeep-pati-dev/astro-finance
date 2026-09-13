import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { App as CapApp } from "@capacitor/app";
import { StatusBar, Style } from "@capacitor/status-bar";

/**
 * Handles Android lifecycle integrations:
 * - Status bar styling
 * - Hardware back button navigation in React Router
 * 
 * Only activates when running on a native platform (Android/iOS).
 * No-op in web browsers.
 */
export const CapacitorLifecycle = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    // Apply dark status bar to match the application aesthetic
    StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
    StatusBar.setBackgroundColor({ color: "#05070e" }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const backListener = CapApp.addListener("backButton", () => {
      // If at root pages, exit the app
      if (
        location.pathname === "/dashboard" ||
        location.pathname === "/login" ||
        location.pathname === "/"
      ) {
        CapApp.exitApp();
      } else {
        // Otherwise step back in React Router history
        navigate(-1);
      }
    });

    return () => {
      backListener.then(handler => handler.remove());
    };
  }, [location.pathname, navigate]);

  return null;
};

export default CapacitorLifecycle;
