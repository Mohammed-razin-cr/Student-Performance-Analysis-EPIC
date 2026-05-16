/**
 * Custom React Hooks for Firestore Data
 */

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  getUserDocument,
  getStudentProfile,
  getAnalytics,
  getUserPredictions,
  getUserNotifications,
  getUserSettings,
} from '@/lib/firestore';
import type {
  User,
  StudentProfile,
  Analytics,
  Prediction,
  Notification,
  UserSettings,
} from '@/types/firestore';

// Hook to get current user's Firestore document
export const useUserData = () => {
  const { user } = useAuth();
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => setRefreshKey(prev => prev + 1);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) {
        setUserData(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getUserDocument(user.uid);
        setUserData(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch user data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user, refreshKey]);

  return { userData, loading, error, refresh };
};

// Hook to get student profile
export const useStudentProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getStudentProfile(user.uid);
        setProfile(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  return { profile, loading, error };
};

// Hook to get analytics data
export const useAnalytics = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user) {
        setAnalytics(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getAnalytics(user.uid);
        setAnalytics(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [user]);

  return { analytics, loading, error };
};

// Hook to get user's predictions
export const usePredictions = (limitCount: number = 10) => {
  const { user } = useAuth();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPredictions = async () => {
      if (!user) {
        setPredictions([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getUserPredictions(user.uid, limitCount);
        setPredictions(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch predictions');
      } finally {
        setLoading(false);
      }
    };

    fetchPredictions();
  }, [user, limitCount]);

  return { predictions, loading, error };
};

// Hook to get user's notifications
export const useNotifications = (unreadOnly: boolean = false) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getUserNotifications(user.uid, unreadOnly);
        setNotifications(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [user, unreadOnly]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return { notifications, unreadCount, loading, error };
};

// Hook to get user settings
export const useUserSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!user) {
        setSettings(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getUserSettings(user.uid);
        setSettings(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch settings');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [user]);

  return { settings, loading, error };
};
