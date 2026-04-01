import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const DB_FILE = path.join(process.cwd(), 'data.json');

// Initialize DB file
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({ sessions: [] }, null, 2), 'utf-8');
}

export function readDB() {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading DB:', error);
    return { sessions: [] };
  }
}

export function writeDB(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing DB:', error);
  }
}

/*
  Session Schema:
  {
    id: string,
    name: string,
    type: 'video' | 'image' | 'text',
    sourcePath: string,          // The directory it scans
    matches: Array<{             // History of all matches for the decision tree
      id: string,
      item1: string,
      item2: string,
      winner: string | null
    }>,
    queue: Array<string>,        // Items waiting to be compared in THIS round
    nextRoundQueue: Array<string>, // Winners moving to the NEXT round
    winner: string | null,       // Absolute winner if finished
    createdAt: string
  }
*/

export function createSession(name, type, sourcePath, files) {
  const db = readDB();
  
  // Shuffle files to randomize the tournament
  const shuffledFiles = [...files].sort(() => Math.random() - 0.5);

  const newSession = {
    id: randomUUID(),
    name,
    type,
    sourcePath,
    initialQueue: [...shuffledFiles],
    matches: [],
    queue: [...shuffledFiles],
    nextRoundQueue: [],
    winner: null,
    createdAt: new Date().toISOString()
  };

  db.sessions.unshift(newSession); // Add at the top
  writeDB(db);

  return newSession;
}

export function getSession(id) {
  const db = readDB();
  return db.sessions.find(s => s.id === id);
}

export function updateSession(session) {
  const db = readDB();
  const index = db.sessions.findIndex(s => s.id === session.id);
  if (index !== -1) {
    db.sessions[index] = session;
    writeDB(db);
  }
}

// Logic to pull the next match
export function getNextMatch(session) {
  if (session.winner) return null;

  // Need exactly 2 items from the queue to form a match
  if (session.queue.length >= 2) {
    return {
      item1: session.queue[0],
      item2: session.queue[1]
    };
  }

  // If 1 item is left, it gets a "bye" (auto-advances to next round)
  if (session.queue.length === 1) {
    session.nextRoundQueue.push(session.queue.shift());
  }

  // Now queue is empty. Promote nextRoundQueue if possible
  if (session.queue.length === 0) {
    if (session.nextRoundQueue.length === 1) {
      // Tournament finished!
      session.winner = session.nextRoundQueue[0];
      updateSession(session);
      return null;
    } else if (session.nextRoundQueue.length > 1) {
      // Start next round
      session.queue = session.nextRoundQueue;
      session.nextRoundQueue = [];
      updateSession(session);
      return getNextMatch(session); // Recursive call
    }
  }

  return null;
}

// Logic to process a vote
export function processVote(sessionId, winnerItem) {
  const session = getSession(sessionId);
  if (!session) return null;

  // The match items were the first two in queue
  if (session.queue.length >= 2) {
    const item1 = session.queue.shift();
    const item2 = session.queue.shift();

    // The winner advances, the loser is dropped. Ensure winnerItem matches one of them
    if (winnerItem !== item1 && winnerItem !== item2) {
         // Should not happen, fallback safety
         session.queue.unshift(item2);
         session.queue.unshift(item1);
         return false;
    }

    // Record the match in history for the decision tree
    session.matches.push({
      id: randomUUID(),
      item1,
      item2,
      winner: winnerItem
    });

    // Winner gets placed into the next round
    session.nextRoundQueue.push(winnerItem);
    
    updateSession(session);
    return true;
  }

  return false;
}

// === NEW: Undo Logic ===
function replaySessionState(initialQueue, matches) {
  let queue = [...initialQueue];
  let nextRoundQueue = [];
  let winner = null;

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];

    // Fast-forward `getNextMatch` equivalents
    while (queue.length < 2 && winner === null) {
      if (queue.length === 1) {
        nextRoundQueue.push(queue.shift());
      }
      if (queue.length === 0) {
        if (nextRoundQueue.length === 1) {
          winner = nextRoundQueue[0];
          break;
        } else if (nextRoundQueue.length > 1) {
          queue = nextRoundQueue;
          nextRoundQueue = [];
        }
      }
    }

    if (queue.length >= 2) {
      queue.shift(); // discard item1
      queue.shift(); // discard item2
      nextRoundQueue.push(match.winner); // push actual winner
    }
  }

  return { queue, nextRoundQueue, winner };
}

export function undoLastMatch(sessionId) {
  const session = getSession(sessionId);
  if (!session || !session.initialQueue || session.matches.length === 0) {
    return false;
  }

  // Drop the last match
  session.matches.pop();

  // Rebuild the exact state without the last match
  const state = replaySessionState(session.initialQueue, session.matches);
  
  session.queue = state.queue;
  session.nextRoundQueue = state.nextRoundQueue;
  session.winner = state.winner;

  updateSession(session);
  return true;
}

// === NEW: Delete Session ===
export function deleteSession(sessionId) {
  const db = readDB();
  db.sessions = db.sessions.filter(s => s.id !== sessionId);
  writeDB(db);
}
