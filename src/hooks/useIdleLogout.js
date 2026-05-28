import { useEffect, useRef, useCallback } from 'react';

const IDLE_TIMEOUT = 10 * 60 * 1000; // 10 minutes
const EVENTS = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];

export default function useIdleLogout(isAuthenticated, logout) {
  const timerRef = useRef(null);

  const resetTimer = useCallback(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      logout(true);
    }, IDLE_TIMEOUT);
  }, [logout]);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Start timer
    resetTimer();

    // Reset on any user activity
    EVENTS.forEach(event => window.addEventListener(event, resetTimer, { passive: true }));

    // Also logout when tab is closed / hidden for too long
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Store the time when page was hidden
        sessionStorage.setItem('_hiddenAt', Date.now().toString());
      } else {
        const hiddenAt = sessionStorage.getItem('_hiddenAt');
        if (hiddenAt && Date.now() - parseInt(hiddenAt) >= IDLE_TIMEOUT) {
          logout(true);
        } else {
          sessionStorage.removeItem('_hiddenAt');
          resetTimer();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(timerRef.current);
      EVENTS.forEach(event => window.removeEventListener(event, resetTimer));
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, resetTimer, logout]);
}