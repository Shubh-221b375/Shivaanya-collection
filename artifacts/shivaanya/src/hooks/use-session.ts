import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

const SESSION_KEY = 'shivaanya_session_id';

export function useSessionId() {
  const [sessionId, setSessionId] = useState<string>('');

  useEffect(() => {
    let storedId = sessionStorage.getItem(SESSION_KEY);
    if (!storedId) {
      storedId = uuidv4();
      sessionStorage.setItem(SESSION_KEY, storedId);
    }
    setSessionId(storedId);
  }, []);

  return sessionId;
}
