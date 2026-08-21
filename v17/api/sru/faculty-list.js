const faculty=require('./_data/faculty.json');
module.exports=async(_req,res)=>res.status(200).json({success:true,facultyList:faculty,source:'SRU faculty selector snapshot'});
