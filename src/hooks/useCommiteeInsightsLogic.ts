// hooks/useCommitteeInsightsLogic.ts

import { useEffect, useState } from 'react';
import type { CommitteInsightsInfo } from '../types/committee';

interface Notification {
  status: 'error' | 'success';
  title: string;
  message: string;
}

export function useCommitteeInsightsLogic() {
  const [insightsData, setInsightsData] = useState<CommitteInsightsInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notification, setNotification] = useState<Notification | null>(null);

  useEffect(() => {
    const fetchInsights = async () => {
      setIsLoading(true);
      setNotification(null);

      const token = localStorage.getItem('token');
      if (!token) {
        setNotification({ status: 'error', title: 'Authentication Error', message: 'Please log in to continue.' });
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('https://arraiaware-backend.onrender.com/api/committee/insights', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch committee insights data.');
        }

        const data: CommitteInsightsInfo = await response.json();
        setInsightsData(data);

      } catch (err) {
        if (err instanceof Error) {
          setNotification({ status: 'error', title: 'Network Error', message: err.message });
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchInsights();
  }, []); 

  return {
    insightsData,
    isLoading,
    notification,
  };
}