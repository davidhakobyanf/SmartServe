'use client';
import { useEffect, useState } from 'react';
import { createSocket } from '@/lib/ws/socket';
import { requestAuthScope } from '@/api/api';
import { subscribeBeforeRead } from '@/lib/requestPool';

// Subscribe before the initial HTTP snapshot: one first load, without a gap in
// which a menu change could be missed. HTTP still works if sockets are blocked.
export function useMenuConnection(enabled: boolean, sessionToken?: string) {
  const scope = JSON.stringify([enabled, sessionToken, requestAuthScope()]);
  const [readyScope, setReadyScope] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    const socket = createSocket('/menu', sessionToken ? {sessionToken} : undefined);
    return subscribeBeforeRead(socket, () => setReadyScope(scope), () => setRevision(value => value + 1));
  }, [enabled, sessionToken, scope]);
  return {ready: enabled && readyScope === scope, revision};
}
