const hasDB = () => process.env.GIST_ID && process.env.GITHUB_TOKEN;

let cachedGist = null;
let lastFetch = 0;

async function fetchGist() {
  if (!hasDB()) return {};
  
  // Cache for 10 seconds in memory to avoid rapid identical fetches
  if (cachedGist && (Date.now() - lastFetch < 10000)) {
    return cachedGist;
  }
  
  try {
    const res = await fetch(`https://api.github.com/gists/${process.env.GIST_ID}`, {
      headers: {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'SRU-Timetable-App'
      }
    });
    
    if (!res.ok) {
      console.error('GitHub API error:', await res.text());
      return {};
    }

    const gist = await res.json();
    if (gist.files && gist.files['database.json']) {
      cachedGist = JSON.parse(gist.files['database.json'].content || '{}');
      lastFetch = Date.now();
      return cachedGist;
    }
  } catch (e) {
    console.error('Failed to fetch Gist DB:', e);
  }
  return {};
}

async function getCache(key) {
  const db = await fetchGist();
  return db[key] || null;
}

async function setCache(key, value) {
  return updateCacheBulk({ [key]: value });
}

async function updateCacheBulk(updates) {
  if (!hasDB()) return false;
  try {
    const db = await fetchGist();
    
    let changed = false;
    for (const [key, value] of Object.entries(updates)) {
      if (JSON.stringify(db[key]) !== JSON.stringify(value)) {
        db[key] = value;
        changed = true;
      }
    }

    if (!changed) return true; // Nothing to update
    
    const res = await fetch(`https://api.github.com/gists/${process.env.GIST_ID}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'SRU-Timetable-App'
      },
      body: JSON.stringify({
        files: {
          'database.json': {
            content: JSON.stringify(db, null, 2)
          }
        }
      })
    });
    
    if (res.ok) {
      cachedGist = db;
      lastFetch = Date.now();
      return true;
    } else {
      console.error('GitHub API Patch error:', await res.text());
    }
  } catch (e) {
    console.error('Failed to update Gist DB:', e);
  }
  return false;
}

async function getKeys(prefix) {
  const db = await fetchGist();
  return Object.keys(db).filter(k => k.startsWith(prefix));
}

module.exports = {
  hasDB,
  getCache,
  setCache,
  updateCacheBulk,
  getKeys
};
