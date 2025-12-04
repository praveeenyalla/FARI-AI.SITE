import { useState, useCallback } from 'react';

const USAGE_KEY = 'chatnlp-usage-tracker';
const VIDEO_LIMIT = 3;

interface UsageData {
  date: string; // YYYY-MM-DD
  videoCount: number;
}

const getToday = (): string => {
  const today = new Date();
  // Use UTC date to ensure the reset happens consistently for all users
  return today.toISOString().split('T')[0];
};

const getUsageData = (): UsageData => {
  try {
    const data = localStorage.getItem(USAGE_KEY);
    if (!data) {
      return { date: getToday(), videoCount: 0 };
    }
    const parsed = JSON.parse(data) as UsageData;
    // Reset if the date stored is not today's date
    if (parsed.date !== getToday()) {
      return { date: getToday(), videoCount: 0 };
    }
    return parsed;
  } catch (error) {
    console.error("Failed to read usage data from localStorage:", error);
    // On failure, default to a fresh start
    return { date: getToday(), videoCount: 0 };
  }
};

const saveUsageData = (data: UsageData) => {
  try {
    localStorage.setItem(USAGE_KEY, JSON.stringify(data));
  } catch (error)
    {
    console.error("Failed to save usage data to localStorage:", error);
  }
};

export const useUsageTracker = () => {
  // Initialize state from localStorage
  const [usage, setUsage] = useState<UsageData>(getUsageData);

  /**
   * Checks if the user is allowed to generate another video based on the daily limit.
   * @returns {boolean} True if the user is under the limit, false otherwise.
   */
  const canGenerateVideo = useCallback((): boolean => {
    const currentUsage = getUsageData();
    setUsage(currentUsage); // Sync state with the latest from storage
    return currentUsage.videoCount < VIDEO_LIMIT;
  }, []);

  /**
   * Increments the video count for the current day and saves it to localStorage.
   */
  const incrementVideoCount = useCallback(() => {
    const currentUsage = getUsageData();
    const newUsage: UsageData = {
      ...currentUsage,
      videoCount: currentUsage.videoCount + 1,
    };
    saveUsageData(newUsage);
    setUsage(newUsage);
  }, []);

  return { 
    canGenerateVideo, 
    incrementVideoCount, 
    currentVideoCount: usage.videoCount, 
    videoLimit: VIDEO_LIMIT 
  };
};