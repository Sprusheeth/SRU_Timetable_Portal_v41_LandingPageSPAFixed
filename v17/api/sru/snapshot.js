const { hasDB, getCache, getKeys } = require('./_db');
const { ok, fail } = require('./_lib');

module.exports = async (req, res) => {
  if (!hasDB()) {
    return fail(res, new Error('Database is not configured.'));
  }

  try {
    // Fetch all cached timetables
    const [studentKeys, facultyKeys, roomKeys] = await Promise.all([
      getKeys('student:'),
      getKeys('faculty:'),
      getKeys('room:')
    ]);
    
    const snapshot = {
      student: {},
      faculty: {},
      room: {}
    };
    
    // Helper to fetch keys in parallel
    const fetchToMap = async (keys, map, keyExtractor) => {
      const values = await Promise.all(keys.map(k => getCache(k)));
      keys.forEach((key, i) => {
        if (values[i]) {
          keyExtractor(key, values[i], map);
        }
      });
    };

    await Promise.all([
      fetchToMap(studentKeys, snapshot.student, (key, val, map) => {
        const parts = key.split(':');
        if (parts.length === 3) {
          if (!map[parts[1]]) map[parts[1]] = {};
          map[parts[1]][parts[2]] = val;
        }
      }),
      fetchToMap(facultyKeys, snapshot.faculty, (key, val, map) => {
        const parts = key.split(':');
        if (parts.length === 2) map[parts[1]] = val;
      }),
      fetchToMap(roomKeys, snapshot.room, (key, val, map) => {
        const parts = key.split(':');
        if (parts.length === 2) map[parts[1]] = val;
      })
    ]);

    return ok(res, {
      success: true,
      timestamp: Date.now(),
      data: snapshot
    });
  } catch (e) {
    return fail(res, e);
  }
};
