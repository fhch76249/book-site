const CONTENT_URL="https://pophcxrfrooqluwrujbl.supabase.co";
const CONTENT_KEY="sb_publishable_cmZlKwLESb-jIWkkQAC7yg_KxNdkJfn";
const contentDb=supabase.createClient(CONTENT_URL,CONTENT_KEY);
const ce=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
async function loadCustomContent(){
 const box=document.getElementById("customContent"); if(!box)return;
 const {data,error}=await contentDb.from("site_content").select("id,title,text,image_url,active,created_at").eq("active",true).order("created_at",{ascending:false}).limit(1);
 if(error||!data?.length)return;
 const x=data[0];
 box.innerHTML=`<div class="custom-content-inner">${x.image_url?`<img src="${ce(x.image_url)}" alt="${ce(x.title||"محتوا")}" loading="lazy">`:""}<div>${x.title?`<h2>${ce(x.title)}</h2>`:""}${x.text?`<p>${ce(x.text).replace(/\n/g,"<br>")}</p>`:""}</div></div>`;
 box.hidden=false;
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",loadCustomContent);else loadCustomContent();
