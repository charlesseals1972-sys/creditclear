// In-memory session store — avoids localStorage which is blocked in sandbox iframes
// State persists within a single browser session (page reload clears it)

interface SessionState {
  sessionId: string | null;
  email: string | null;
  name: string | null;
}

const state: SessionState = {
  sessionId: null,
  email: null,
  name: null,
};

export function setSession(id: string, email: string, name: string) {
  state.sessionId = id;
  state.email = email;
  state.name = name;
}

export function getSessionId(): string | null {
  return state.sessionId;
}

export function getSessionName(): string | null {
  return state.name;
}

export function getSessionEmail(): string | null {
  return state.email;
}
