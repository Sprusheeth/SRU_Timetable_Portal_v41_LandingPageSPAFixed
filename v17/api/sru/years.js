const {getJSON,ok,fail}=require('./_lib');
module.exports=async(req,res)=>{try{const degree=String(req.query.degree||'').trim();if(!degree)return res.status(400).json({success:false,error:'degree is required'});return ok(res,await getJSON('/get-yearbpublic?degree='+encodeURIComponent(degree)))}catch(e){return fail(res,e)}};
