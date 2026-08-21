const { hasDB, getCache, updateCacheBulk, getKeys } = require('./_db');
const { postPage, ok, fail } = require('./_lib');

module.exports = async (req, res) => {
  if (!hasDB()) {
    return fail(res, new Error('Database is not configured.'));
  }

  try {
    const [studentKeys, facultyKeys, roomKeys] = await Promise.all([
      getKeys('student:'),
      getKeys('faculty:'),
      getKeys('room:')
    ]);
    
    let updatedCount = 0;
    const updates = {};
    
    // Refresh student
    for (const key of studentKeys) {
      const parts = key.split(':');
      if (parts.length === 3) {
        const year = parts[1];
        const batch = parts[2];
        try {
          const freshData = await postPage('/batchReport', '/searchBatchReportPublic', { batch, year });
          const oldData = await getCache(key);
          if (JSON.stringify(freshData) !== JSON.stringify(oldData)) {
            updates[key] = freshData;
            updatedCount++;
          }
        } catch (err) { }
      }
    }

    // Refresh faculty
    for (const key of facultyKeys) {
      const parts = key.split(':');
      if (parts.length === 2) {
        const faculty = parts[1];
        try {
          const freshData = await postPage('/report', '/searchDueReportPublic', { faculty, room: '' });
          const oldData = await getCache(key);
          if (JSON.stringify(freshData) !== JSON.stringify(oldData)) {
            updates[key] = freshData;
            updatedCount++;
          }
        } catch (err) { }
      }
    }

    // Refresh room
    for (const key of roomKeys) {
      const parts = key.split(':');
      if (parts.length === 2) {
        const room = parts[1];
        try {
          const freshData = await postPage('/room_report', '/searchRoomReportPublic', { room });
          const oldData = await getCache(key);
          if (JSON.stringify(freshData) !== JSON.stringify(oldData)) {
            updates[key] = freshData;
            updatedCount++;
          }
        } catch (err) { }
      }
    }
    
    if (updatedCount > 0) {
      await updateCacheBulk(updates);
    }

    return ok(res, {
      success: true,
      message: 'Background sync completed',
      updatedCount
    });

  } catch (e) {
    return fail(res, e);
  }
};
