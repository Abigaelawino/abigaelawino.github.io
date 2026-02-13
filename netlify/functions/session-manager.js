// Environment configuration for parallel deployment sessions
class SessionManager {
  constructor() {
    this.sessions = new Map();
    this.sessionTimeout = parseInt(process.env.SESSION_TIMEOUT) || 300000; // 5 minutes default
    this.maxSessions = parseInt(process.env.MAX_PARALLEL_SESSIONS) || 5;
  }

  // Create a new session
  createSession(sessionData = {}) {
    const sessionId = this.generateSessionId();
    const session = {
      id: sessionId,
      startTime: new Date().toISOString(),
      status: 'active',
      ...sessionData,
      lastActivity: new Date().toISOString()
    };

    this.sessions.set(sessionId, session);
    
    // Set timeout for session cleanup
    setTimeout(() => this.cleanupSession(sessionId), this.sessionTimeout);

    return session;
  }

  // Get session by ID
  getSession(sessionId) {
    return this.sessions.get(sessionId) || null;
  }

  // Update session activity
  updateSession(sessionId, updates = {}) {
    const session = this.sessions.get(sessionId);
    if (session) {
      Object.assign(session, updates);
      session.lastActivity = new Date().toISOString();
      this.sessions.set(sessionId, session);
      return session;
    }
    return null;
  }

  // Complete session
  completeSession(sessionId, result = {}) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = 'completed';
      session.endTime = new Date().toISOString();
      session.result = result;
      this.sessions.set(sessionId, session);
      return session;
    }
    return null;
  }

  // Fail session
  failSession(sessionId, error) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = 'failed';
      session.endTime = new Date().toISOString();
      session.error = error;
      this.sessions.set(sessionId, session);
      return session;
    }
    return null;
  }

  // List active sessions
  getActiveSessions() {
    return Array.from(this.sessions.values()).filter(session => session.status === 'active');
  }

  // Get all sessions
  getAllSessions() {
    return Array.from(this.sessions.values());
  }

  // Check if new sessions can be created
  canCreateSession() {
    const activeSessions = this.getActiveSessions();
    return activeSessions.length < this.maxSessions;
  }

  // Cleanup expired sessions
  cleanupSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session && session.status === 'active') {
      const now = new Date();
      const lastActivity = new Date(session.lastActivity);
      const timeDiff = now - lastActivity;

      if (timeDiff > this.sessionTimeout) {
        this.failSession(sessionId, 'Session timed out');
        console.log(`Session ${sessionId} timed out and was cleaned up`);
      } else {
        // Reschedule cleanup
        setTimeout(() => this.cleanupSession(sessionId), this.sessionTimeout - timeDiff);
      }
    }
  }

  // Generate unique session ID
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get session statistics
  getStats() {
    const allSessions = this.getAllSessions();
    const activeSessions = this.getActiveSessions();
    
    return {
      total: allSessions.length,
      active: activeSessions.length,
      completed: allSessions.filter(s => s.status === 'completed').length,
      failed: allSessions.filter(s => s.status === 'failed').length,
      maxAllowed: this.maxSessions
    };
  }
}

// Export singleton instance
const sessionManager = new SessionManager();

// Netlify function for session management
exports.handler = async function(event, context) {
  const { httpMethod, path } = event;
  const pathSegments = path.split('/').filter(Boolean);
  
  try {
    switch (httpMethod) {
      case 'GET':
        if (pathSegments.length === 1 && pathSegments[0] === 'sessions') {
          return await handleGetSessions();
        } else if (pathSegments.length === 2 && pathSegments[0] === 'sessions') {
          return await handleGetSession(pathSegments[1]);
        }
        break;
        
      case 'POST':
        if (pathSegments.length === 1 && pathSegments[0] === 'sessions') {
          return await handleCreateSession(event);
        }
        break;
        
      case 'PUT':
        if (pathSegments.length === 2 && pathSegments[0] === 'sessions') {
          return await handleUpdateSession(pathSegments[1], event);
        }
        break;
        
      case 'DELETE':
        if (pathSegments.length === 2 && pathSegments[0] === 'sessions') {
          return await handleDeleteSession(pathSegments[1]);
        }
        break;
    }

    return {
      statusCode: 404,
      body: JSON.stringify({ error: 'Endpoint not found' })
    };
  } catch (error) {
    console.error('Session management error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

// Handle GET /sessions
async function handleGetSessions() {
  const sessions = sessionManager.getAllSessions();
  const stats = sessionManager.getStats();
  
  return {
    statusCode: 200,
    body: JSON.stringify({
      sessions,
      stats,
      timestamp: new Date().toISOString()
    })
  };
}

// Handle GET /sessions/{id}
async function handleGetSession(sessionId) {
  const session = sessionManager.getSession(sessionId);
  
  if (!session) {
    return {
      statusCode: 404,
      body: JSON.stringify({ error: 'Session not found' })
    };
  }
  
  return {
    statusCode: 200,
    body: JSON.stringify(session)
  };
}

// Handle POST /sessions
async function handleCreateSession(event) {
  const { body } = event;
  let sessionData = {};
  
  if (body) {
    try {
      sessionData = JSON.parse(body);
    } catch (error) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid JSON body' })
      };
    }
  }

  if (!sessionManager.canCreateSession()) {
    return {
      statusCode: 429,
      body: JSON.stringify({ 
        error: 'Maximum parallel sessions reached',
        stats: sessionManager.getStats()
      })
    };
  }

  const session = sessionManager.createSession(sessionData);
  
  return {
    statusCode: 201,
    body: JSON.stringify({
      message: 'Session created successfully',
      session
    })
  };
}

// Handle PUT /sessions/{id}
async function handleUpdateSession(sessionId, event) {
  const { body } = event;
  let updates = {};
  
  if (body) {
    try {
      updates = JSON.parse(body);
    } catch (error) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid JSON body' })
      };
    }
  }

  const session = sessionManager.updateSession(sessionId, updates);
  
  if (!session) {
    return {
      statusCode: 404,
      body: JSON.stringify({ error: 'Session not found' })
    };
  }
  
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Session updated successfully',
      session
    })
  };
}

// Handle DELETE /sessions/{id}
async function handleDeleteSession(sessionId) {
  const session = sessionManager.getSession(sessionId);
  
  if (!session) {
    return {
      statusCode: 404,
      body: JSON.stringify({ error: 'Session not found' })
    };
  }

  sessionManager.sessions.delete(sessionId);
  
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Session deleted successfully',
      sessionId
    })
  };
}

// Export session manager for use in other functions
exports.sessionManager = sessionManager;