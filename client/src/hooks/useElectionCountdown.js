import { useState, useEffect } from 'react';
import dayjs from 'dayjs';

export const useElectionCountdown = (startTime, endTime) => {
  const [timeLeft, setTimeLeft] = useState({ label: '', urgent: false });

  useEffect(() => {
    const updateCountdown = () => {
      if (!startTime || !endTime) return;
      
      const now = dayjs();
      const start = dayjs(startTime);
      const end = dayjs(endTime);

      if (now.isBefore(start)) {
        const diffDays = start.diff(now, 'day');
        if (diffDays > 0) {
          setTimeLeft({ label: `Starts in ${diffDays}d`, urgent: false });
        } else {
          const diffHrs = start.diff(now, 'hour');
          const diffMins = start.diff(now, 'minute') % 60;
          setTimeLeft({ label: `Starts in ${diffHrs}h ${diffMins}m`, urgent: false });
        }
      } else if (now.isAfter(end)) {
        setTimeLeft({ label: 'Closed', urgent: false });
      } else {
        const diffDays = end.diff(now, 'day');
        if (diffDays > 0) {
          setTimeLeft({ label: `Ends in ${diffDays}d`, urgent: false });
        } else {
          const diffHrs = end.diff(now, 'hour');
          const diffMins = end.diff(now, 'minute') % 60;
          const diffSecs = end.diff(now, 'second') % 60;
          
          let label = `Ends in ${diffHrs}h ${diffMins}m`;
          let urgent = diffHrs < 1;
          if (urgent && diffMins < 5) {
            label = `Ends in ${diffMins}m ${diffSecs}s`;
          }
          
          setTimeLeft({ label, urgent });
        }
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [startTime, endTime]);

  return timeLeft;
};
