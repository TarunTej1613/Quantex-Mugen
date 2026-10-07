"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface IntroContextType {
  introCompleted: boolean;
  logoAnimationCompleted: boolean;
  setIntroCompleted: (val: boolean) => void;
  setLogoAnimationCompleted: (val: boolean) => void;
  skipIntro: () => void;
  hasIntroStarted: boolean;
  setHasIntroStarted: (val: boolean) => void;
}

const IntroContext = createContext<IntroContextType>({
  introCompleted: false,
  logoAnimationCompleted: false,
  setIntroCompleted: () => {},
  setLogoAnimationCompleted: () => {},
  skipIntro: () => {},
  hasIntroStarted: false,
  setHasIntroStarted: () => {},
});

export const IntroProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [introCompleted, setIntroCompletedState] = useState<boolean>(true); // default true to avoid flash on SSR
  const [logoAnimationCompleted, setLogoAnimationCompletedState] =
    useState<boolean>(true);
  const [hasIntroStarted, setHasIntroStarted] = useState<boolean>(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Check sessionStorage
    try {
      const storedIntro = sessionStorage.getItem("qxm_intro_completed");
      const storedLogo = sessionStorage.getItem("qxm_logo_anim_completed");

      if (storedIntro === "true") {
        setIntroCompletedState(true);
      } else {
        setIntroCompletedState(false);
      }

      if (storedLogo === "true") {
        setLogoAnimationCompletedState(true);
      } else {
        setLogoAnimationCompletedState(false);
      }
    } catch {
      // fallback in case storage blocked
      setIntroCompletedState(true);
      setLogoAnimationCompletedState(true);
    }
  }, []);

  const setIntroCompleted = (val: boolean) => {
    setIntroCompletedState(val);
    try {
      if (val) {
        sessionStorage.setItem("qxm_intro_completed", "true");
      } else {
        sessionStorage.removeItem("qxm_intro_completed");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const setLogoAnimationCompleted = (val: boolean) => {
    setLogoAnimationCompletedState(val);
    try {
      if (val) {
        sessionStorage.setItem("qxm_logo_anim_completed", "true");
      } else {
        sessionStorage.removeItem("qxm_logo_anim_completed");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const skipIntro = () => {
    setIntroCompleted(true);
    setLogoAnimationCompleted(true);
  };

  if (!isClient) {
    return <>{children}</>;
  }

  return (
    <IntroContext.Provider
      value={{
        introCompleted,
        logoAnimationCompleted,
        setIntroCompleted,
        setLogoAnimationCompleted,
        skipIntro,
        hasIntroStarted,
        setHasIntroStarted,
      }}
    >
      {children}
    </IntroContext.Provider>
  );
};

export const useIntro = () => useContext(IntroContext);
