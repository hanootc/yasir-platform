import { useLocation } from "wouter";
import { useEffect, useState } from "react";

export const usePageTransition = () => {
  const [location] = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [prevLocation, setPrevLocation] = useState(location);

  useEffect(() => {
    if (location !== prevLocation) {
      setIsTransitioning(true);
      setPrevLocation(location);
      
      // Short transition delay for smooth effect
      const timer = setTimeout(() => {
        setIsTransitioning(false);
      }, 150);

      return () => clearTimeout(timer);
    }
  }, [location, prevLocation]);

  return { isTransitioning, location };
};