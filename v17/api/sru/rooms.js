const rooms=require('./_data/rooms.json');
module.exports=async(_req,res)=>res.status(200).json({success:true,rooms,source:'SRU room selector snapshot'});
