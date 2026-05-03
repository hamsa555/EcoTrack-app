import { useState, useEffect, useCallback } from 'react';
import { notificationService } from '../services/notificationService';

export function useStepTracker() {
  const [isTracking, setIsTracking] = useState(false);
  const [steps, setSteps] = useState(0);

  const startTracking = async () => {
    // Basic web check - in a real app would use navigator.permissions or specific motion APIs if needed
    // But standard web browsers dont have a simple "Pedometer" API like mobile sensors.
    // We simulate it for the web refactor to maintain the UX flow.
    
    setIsTracking(true);
    setSteps(0);
    notificationService.send("Tracking Started", "We're simulating motion detection for the web version.", "impact");
  };

  const stopTracking = useCallback(() => {
    setIsTracking(false);
    notificationService.send("Tracking Stopped", `You completed ${steps} steps!`, "impact");
  }, [steps]);

  useEffect(() => {
    let interval: any;
    if (isTracking) {
      interval = setInterval(() => {
        setSteps(prev => prev + Math.floor(Math.random() * 2) + 1); // Random steps increment
      }, 2000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTracking]);

  return { isTracking, steps, startTracking, stopTracking };
}
