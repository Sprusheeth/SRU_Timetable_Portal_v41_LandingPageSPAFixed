const { postPage, ok, fail } = require('./_lib');
const { hasDB, setCache, getCache } = require('./_db');

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST' && req.method !== 'GET') return res.status(405).json({ success: false, error: 'GET or POST required' });
    
    const body = req.method === 'POST' ? req.body : req.query;
    const room = String(body?.room || '').trim();
    if (!room) return res.status(400).json({ success: false, error: 'room is required' });

    const cacheKey = `room:${room}`;
    let liveData;
    let liveError;

    try {
      liveData = await postPage('/room_report', '/searchRoomReportPublic', { room });
      if (hasDB()) await setCache(cacheKey, liveData);
    } catch (err) {
      liveError = err;
    }

    if (liveData) {
      return ok(res, liveData);
    } else {
      const cachedData = await getCache(cacheKey);
      if (cachedData) return ok(res, cachedData);
      throw liveError || new Error('Failed to fetch data and no cache available');
    }
  } catch (e) {
    return fail(res, e);
  }
};
