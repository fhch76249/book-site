const ADS_URL="https://pophcxrfrooqluwrujbl.supabase.co";
const ADS_KEY="sb_publishable_cmZlKwLESb-jIWkkQAC7yg_KxNdkJfn";
const adsDb=supabase.createClient(ADS_URL,ADS_KEY);
const adsEsc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
function adHtml(a){const body=`<div class="ad-label">تبلیغات</div>${a.image_url?`<img src="${adsEsc(a.image_url)}" alt="${adsEsc(a.title)}">`:""}<h3>${adsEsc(a.title)}</h3>${a.content?`<p>${adsEsc(a.content)}</p>`:""}`;return a.link_url?`<a class="ad-link" href="${adsEsc(a.link_url)}" target="_blank" rel="noopener noreferrer">${body}</a>`:body}
async function loadFixedAd(){
 const box=document.getElementById("fixedAd");
 if(!box)return;
 box.hidden=true;
 try{
  // فقط تبلیغ فعال را از دیتابیس می‌گیریم؛ تاریخ را در مرورگر بررسی می‌کنیم تا مشکل فیلتر PostgREST ایجاد نشود.
  const {data,error}=await adsDb.from("ads").select("id,title,content,image_url,link_url,active,start_at,end_at,created_at").eq("active",true).order("created_at",{ascending:false}).limit(20);
  if(error){console.error("Ad error:",error);return}
  const now=Date.now();
  const valid=(data||[]).find(a=>{
   const start=a.start_at?new Date(a.start_at).getTime():-Infinity;
   const end=a.end_at?new Date(a.end_at).getTime():Infinity;
   return start<=now && now<=end;
  });
  if(!valid)return;
  box.innerHTML=adHtml(valid);
  box.hidden=false;
 }catch(e){console.error("Ad error:",e)}
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",loadFixedAd);else loadFixedAd();
