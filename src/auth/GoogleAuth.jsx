import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { gapi } from "gapi-script";

const CLIENT_ID =
  "937228397336-i07jo81e4e8os777rel1594n369ohnuk.apps.googleusercontent.com";

const API_KEY = "AIzaSyDScP5GlWBV1kA8k0cfLK6r7JvRHRqqOJU";
export const SHEET_ID = "1L9LJEj43C54zbd5AJ3HW_ETt0KW1JK6sIh6-jkQSLWQ";
const DISCOVERY_DOC =
  "https://sheets.googleapis.com/$discovery/rest?version=v4";

const SCOPE = "https://www.googleapis.com/auth/spreadsheets";

const GoogleAuthContext = createContext(null);

export function GoogleAuthProvider({ children }) {
  const [isApiReady, setIsApiReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState("");

  const tokenClientRef = useRef(null);
  const accessTokenRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const loadScript = (src) =>
      new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[src="${src}"]`);

        if (existing) {
          if (existing.dataset.loaded === "true") {
            resolve();
            return;
          }

          existing.addEventListener("load", resolve, { once: true });
          existing.addEventListener(
            "error",
            () => reject(new Error("Google script load failed")),
            { once: true },
          );
          return;
        }

        const script = document.createElement("script");
        script.src = src;
        script.async = true;
        script.defer = true;
        script.onload = () => {
          script.dataset.loaded = "true";
          resolve();
        };
        script.onerror = () => reject(new Error("Google script load failed"));

        document.head.appendChild(script);
      });

    async function initialize() {
      try {
        await loadScript("https://accounts.google.com/gsi/client");

        await new Promise((resolve, reject) => {
          gapi.load("client", {
            callback: resolve,
            onerror: () => reject(new Error("Google API client load failed")),
            timeout: 15000,
            ontimeout: () => reject(new Error("Google API client timeout")),
          });
        });

        await gapi.client.init({
          apiKey: API_KEY,
          discoveryDocs: [DISCOVERY_DOC],
        });

        if (cancelled) return;

        tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPE,

          callback: (response) => {
            if (response.error) {
              setError(response.error_description || response.error);
              return;
            }

            const scopes = (response.scope || "").split(" ");

            if (!scopes.includes(SCOPE)) {
              setError("Google Sheets permission nahi mila.");
              return;
            }

            accessTokenRef.current = response.access_token;

            gapi.client.setToken({
              access_token: response.access_token,
            });

            setError("");
            setIsAuthenticated(true);
          },
        });

        setIsApiReady(true);
      } catch (err) {
        console.error("Google initialization error:", err);
        if (!cancelled) setError(err.message);
      }
    }

    initialize();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = () => {
    if (!tokenClientRef.current) {
      setError("Google API load ho rahi hai.");
      return;
    }

    setError("");

    tokenClientRef.current.requestAccessToken({
      prompt: "consent",
    });
  };

  const logout = () => {
    const token = accessTokenRef.current;

    accessTokenRef.current = null;
    gapi.client.setToken(null);
    setIsAuthenticated(false);

    if (token && window.google?.accounts?.oauth2) {
      window.google.accounts.oauth2.revoke(token, () => {});
    }
  };

  return (
    <GoogleAuthContext.Provider
      value={{
        isApiReady,
        isAuthenticated,
        login,
        logout,
        error,
        gapi,
      }}
    >
      {children}
    </GoogleAuthContext.Provider>
  );
}

export function useGoogleAuth() {
  const context = useContext(GoogleAuthContext);

  if (!context) {
    throw new Error("useGoogleAuth must be used inside GoogleAuthProvider");
  }

  return context;
}
