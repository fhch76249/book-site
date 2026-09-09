const ADS_URL="https://pophcxrfrooqluwrujbl.supabase.co";
const ADS_KEY="sb_publishable_cmZlKwLESb-jIWkkQAC7yg_KxNdkJfn";
const adsDb=supabase.createClient(ADS_URL,ADS_KEY);
const adsEsc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
function adHtml(a){const body=`<div class="ad-label">تبلیغات</div>${a.image_url?`<img src="${adsEsc(a.image_url)}" alt="${adsEsc(a.title)}">`:""}<h3>${adsEsc(a.title)}</h3>${a.content?`<p>${adsEsc(a.content)}</p>`:""}`;return a.link_url?`<a class="ad-link" href="${adsEsc(a.link_url)}" target="_blank" rel="noopener noreferrer">${body}</a>`:body}
async function loadFixedAd(){const box=document.getElementById("fixedAd");if(!box)return;const now=new Date().toISOString();const {data,error}=await adsDb.from("ads").select("id,title,content,image_url,link_url,active,start_at,end_at,created_at").eq("active",true).or(`start_at.is.null,start_at.lte.${now}`).or(`end_at.is.null,end_at.gte.${now}`).order("created_at",{ascending:false}).limit(1);if(error){console.error("Ad error:",error);return}if(!data?.length)return;box.innerHTML=adHtml(data[0]);box.hidden=false}
loadFixedAd();
