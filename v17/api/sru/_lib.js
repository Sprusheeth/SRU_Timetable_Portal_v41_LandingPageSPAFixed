const cheerio = require('cheerio');
const SRU = 'https://timetable.sruniv.com';

function cookiesFrom(response){
  if(typeof response.headers.getSetCookie==='function'){
    const a=response.headers.getSetCookie();
    if(a && a.length) return a.map(x=>x.split(';')[0]).join('; ');
  }
  const raw=response.headers.get('set-cookie')||'';
  if(!raw) return '';
  return raw.split(/,(?=[^;]+=[^;]+)/).map(x=>x.split(';')[0].trim()).filter(Boolean).join('; ');
}

async function pageSession(path){
  const r=await fetch(SRU+path,{redirect:'follow',headers:{Accept:'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8','User-Agent':'Mozilla/5.0'}});
  const html=await r.text();
  if(!r.ok) throw new Error(`SRU ${path}: HTTP ${r.status} ${html.slice(0,500)}`);
  const $=cheerio.load(html);
  const token=$('input[name="_token"]').first().attr('value')||$('meta[name="csrf-token"]').attr('content')||'';
  const cookie=cookiesFrom(r);
  if(!token) throw new Error(`SRU ${path}: CSRF token not found`);
  if(!cookie) throw new Error(`SRU ${path}: session cookie not found`);
  return {token,cookie};
}

async function getJSON(path){
  const r=await fetch(SRU+path,{redirect:'follow',headers:{Accept:'application/json, text/plain, */*','User-Agent':'Mozilla/5.0'}});
  const text=await r.text();
  if(!r.ok) throw new Error(`SRU GET ${path}: HTTP ${r.status} ${text.slice(0,500)}`);
  try{return JSON.parse(text)}catch{throw new Error(`SRU GET ${path}: non-JSON ${text.slice(0,500)}`)}
}

async function postPage(page,endpoint,fields){
  const {token,cookie}=await pageSession(page);
  const form=new URLSearchParams({_token:token,...fields});
  const r=await fetch(SRU+endpoint,{method:'POST',redirect:'follow',headers:{Accept:'application/json, text/plain, */*','Content-Type':'application/x-www-form-urlencoded; charset=UTF-8','X-Requested-With':'XMLHttpRequest','X-CSRF-TOKEN':token,Referer:SRU+page,Origin:SRU,Cookie:cookie,'User-Agent':'Mozilla/5.0'},body:form.toString()});
  const text=await r.text();
  if(!r.ok) throw new Error(`SRU POST ${endpoint}: HTTP ${r.status} ${text.slice(0,700)}`);
  try{return JSON.parse(text)}catch{throw new Error(`SRU POST ${endpoint}: non-JSON ${text.slice(0,700)}`)}
}

function ok(res,data){res.setHeader('Cache-Control','no-store');return res.status(200).json(data)}
function fail(res,e){console.error(e);return res.status(502).json({success:false,error:e.message||String(e)})}
module.exports={SRU,pageSession,getJSON,postPage,ok,fail};
