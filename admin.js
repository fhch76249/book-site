const SUPABASE_URL="https://pophcxrfrooqluwrujbl.supabase.co";
const SUPABASE_KEY="sb_publishable_cmZlKwLESb-jIWkkQAC7yg_KxNdkJfn";
const ADMIN_ID="71ed2c13-04cc-41a3-8042-7b7a1791000a";
const db=supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
const $=id=>document.getElementById(id);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
function showMsg(text,error=false){const m=$("msg");if(!m)return;m.textContent=text;m.style.display="block";m.className=error?"msg error":"msg";setTimeout(()=>m.style.display="none",7000)}
async function requireAdmin(){
 const {data,error}=await db.auth.getUser();
 if(error||!data?.user){location.href="login.html";return null}
 if(data.user.id!==ADMIN_ID){await db.auth.signOut();alert("این حساب دسترسی مدیر ندارد.");location.href="login.html";return null}
 $("adminEmail").textContent=data.user.email||"مدیر";
 return data.user;
}
async function uploadFile(file,bucket){
 if(!file)return null;
 const {data,error:userError}=await db.auth.getUser();
 if(userError||!data?.user)throw new Error("نشست مدیر منقضی شده است. دوباره وارد شوید.");
 if(data.user.id!==ADMIN_ID)throw new Error("این حساب مدیر نیست.");
 if(bucket==="books"&&!/\.pdf$/i.test(file.name))throw new Error("فایل کتاب باید PDF باشد.");
 if(bucket==="covers"&&!/^image\//i.test(file.type))throw new Error("فایل جلد باید تصویر باشد.");
 const max=bucket==="books"?100*1024*1024:10*1024*1024;
 if(file.size>max)throw new Error(`حجم فایل بیشتر از ${bucket==="books"?"100":"10"}MB است.`);
 const ext=(file.name.match(/\.([^.]+)$/)||["","bin"])[1].toLowerCase();
 const safe=file.name.replace(/\.[^.]+$/,"").replace(/[^a-zA-Z0-9_-]/g,"_").slice(0,60)||"file";
 const path=`${Date.now()}_${Math.random().toString(36).slice(2,10)}_${safe}.${ext}`;
 const storage=db.storage.from(bucket);
 const result=await storage.upload(path,file,{upsert:false,cacheControl:"3600",contentType:file.type||"application/octet-stream"});
 if(result.error)throw new Error(`آپلود ${bucket==="books"?"کتاب":"جلد"} انجام نشد: ${result.error.message}`);
 return storage.getPublicUrl(path).data.publicUrl;
}
async function loadAdminBooks(){
 const l=$("booksList");const {data,error}=await db.from("books").select("*").order("created_at",{ascending:false});
 if(error){l.textContent="خطا: "+error.message;return}
 const rows=(data||[]).filter(b=>String(b.category||"").trim()!=="عاشقانه");
 l.innerHTML=rows.map(b=>`<div class="book-row"><img class="thumb" src="${esc(b.cover_url||"")}" alt=""><div><h3>${esc(b.title)}</h3><p>نویسنده: ${esc(b.author||"نامشخص")}</p><p>دسته: ${esc(b.category||"بدون دسته")}</p></div><div class="row-actions"><button class="primary" onclick="startEdit('${b.id}')">ویرایش</button><button class="danger" onclick="deleteBook('${b.id}')">حذف</button></div></div>`).join("")||"<p>هنوز کتابی اضافه نشده است.</p>";
}
async function startEdit(id){
 const {data:b,error}=await db.from("books").select("*").eq("id",id).single();
 if(error){showMsg(error.message,true);return}
 $("bookId").value=b.id;$("title").value=b.title||"";$("author").value=b.author||"";$("category").value=b.category||"";$("rating").value=b.rating??"";$("description").value=b.description||"";
 $("formTitle").textContent="ویرایش کتاب";$("saveBtn").textContent="ذخیره تغییرات";$("cancelEdit").style.display="inline-block";scrollTo({top:0,behavior:"smooth"});
}
function resetForm(){$("bookForm").reset();$("bookId").value="";$("formTitle").textContent="افزودن کتاب";$("saveBtn").textContent="ذخیره کتاب";$("cancelEdit").style.display="none"}
async function saveBook(e){
 e.preventDefault();const btn=$("saveBtn");btn.disabled=true;
 try{
  const title=$("title").value.trim();if(!title)throw new Error("عنوان کتاب را وارد کنید.");
  const cover=$("cover").files[0],pdf=$("pdf").files[0];
  if(!pdf && !$("bookId").value)throw new Error("فایل PDF کتاب را انتخاب کنید.");
  btn.textContent="در حال بررسی و آپلود...";
  const payload={title,author:$("author").value.trim(),category:$("category").value.trim()==="عاشقانه"?"":$("category").value.trim(),description:$("description").value.trim(),rating:$("rating").value.trim()===""?null:Number($("rating").value)};
  if(cover)payload.cover_url=await uploadFile(cover,"covers");
  if(pdf)payload.pdf_url=await uploadFile(pdf,"books");
  const id=$("bookId").value.trim();
  const r=id?await db.from("books").update(payload).eq("id",id):await db.from("books").insert(payload);
  if(r.error)throw new Error("فایل‌ها آپلود شدند ولی ذخیره اطلاعات کتاب انجام نشد: "+r.error.message);
  showMsg(id?"کتاب ویرایش شد.":"کتاب با موفقیت اضافه شد.");resetForm();await loadAdminBooks();await loadViewStats();
 }catch(err){console.error(err);showMsg(err.message||"خطای نامشخص",true)}
 finally{btn.disabled=false;if(!$("bookId").value)btn.textContent="ذخیره کتاب"}
}
async function deleteBook(id){if(!confirm("آیا کتاب حذف شود؟"))return;const {error}=await db.from("books").delete().eq("id",id);if(error)showMsg(error.message,true);else{showMsg("کتاب حذف شد.");loadAdminBooks();loadViewStats()}}
async function loadViewStats(){
 const all=await db.from("page_views").select("id",{count:"exact",head:true});$("totalViews").textContent=all.error?"خطا":(all.count||0);
 const s=new Date();s.setHours(0,0,0,0);
 const {data,error}=await db.from("page_views").select("book_id,page,created_at").gte("created_at",s.toISOString());
 if(error){console.error(error);$("todayViews").textContent="خطا";$("homeViews").textContent="خطا";$("bookViews").textContent="خطا";return}
 const t=data||[];$("todayViews").textContent=t.length;$("homeViews").textContent=t.filter(x=>x.page==="home").length;$("bookViews").textContent=t.filter(x=>x.page==="book").length;
 const counts={};t.filter(x=>x.page==="book"&&x.book_id).forEach(x=>counts[x.book_id]=(counts[x.book_id]||0)+1);
 const ids=Object.keys(counts);
 if(!ids.length)$("popularViews").innerHTML='<p class="muted">امروز هنوز بازدید کتابی ثبت نشده است.</p>';
 else{const {data:bs}=await db.from("books").select("id,title").in("id",ids);const m={};(bs||[]).forEach(x=>m[x.id]=x);$("popularViews").innerHTML=ids.sort((a,b)=>counts[b]-counts[a]).slice(0,10).map((id,i)=>m[id]?`<div class="view-row"><b>${i+1}</b><span>${esc(m[id].title)}</span><b>${counts[id]}</b></div>`:"").join("")}
 await loadWeeklyViews();
}
async function loadWeeklyViews(){
 const ch=$("viewsChart");const s=new Date();s.setHours(0,0,0,0);s.setDate(s.getDate()-6);
 const {data,error}=await db.from("page_views").select("created_at").gte("created_at",s.toISOString());if(error){ch.textContent="خطا در نمودار";return}
 const rows=[];for(let i=0;i<7;i++){const d=new Date(s);d.setDate(s.getDate()+i);rows.push({key:d.toLocaleDateString("en-CA"),label:d.toLocaleDateString("fa-IR",{month:"numeric",day:"numeric"}),count:0})}
 (data||[]).forEach(v=>{const r=rows.find(x=>x.key===new Date(v.created_at).toLocaleDateString("en-CA"));if(r)r.count++});
 const max=Math.max(1,...rows.map(x=>x.count));ch.innerHTML=rows.map(r=>`<div class="chart-row"><span>${r.label}</span><div><div class="chart-bar" style="width:${Math.max(3,r.count/max*100)}%"></div></div><b>${r.count}</b></div>`).join("");
}
function toISO(v){return v?new Date(v).toISOString():null}
function fromISO(v){if(!v)return"";const d=new Date(v),p=n=>String(n).padStart(2,"0");return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`}
async function loadAds(){const {data,error}=await db.from("ads").select("*").order("created_at",{ascending:false});const el=$("adsList");if(error){el.textContent="خطا: "+error.message;return}el.innerHTML=(data||[]).map(a=>`<div class="ad-item"><strong>${esc(a.title)}</strong><div class="muted">${a.active?"فعال":"غیرفعال"}</div><div class="row-actions"><button class="primary" onclick="editAd('${a.id}')">ویرایش</button><button class="danger" onclick="deleteAd('${a.id}')">حذف</button></div></div>`).join("")||"<p>تبلیغی ثبت نشده است.</p>"}
async function editAd(id){const {data:a,error}=await db.from("ads").select("*").eq("id",id).single();if(error){showMsg(error.message,true);return}$("adId").value=a.id;$("adTitle").value=a.title||"";$("adContent").value=a.content||"";$("adImage").value=a.image_url||"";$("adLink").value=a.link_url||"";$("adStart").value=fromISO(a.start_at);$("adEnd").value=fromISO(a.end_at);$("adActive").value=String(a.active);$("adSave").textContent="ذخیره تغییرات";$("adCancel").style.display="inline-block"}
function resetAd(){$("adForm").reset();$("adId").value="";$("adSave").textContent="ذخیره تبلیغ";$("adCancel").style.display="none"}
async function saveAd(e){e.preventDefault();const p={title:$("adTitle").value.trim(),content:$("adContent").value.trim(),image_url:$("adImage").value.trim()||null,link_url:$("adLink").value.trim()||null,active:$("adActive").value==="true",start_at:toISO($("adStart").value),end_at:toISO($("adEnd").value)};if(!p.title){showMsg("عنوان تبلیغ را وارد کنید.",true);return}const id=$("adId").value.trim();const r=id?await db.from("ads").update(p).eq("id",id):await db.from("ads").insert(p);if(r.error)showMsg(r.error.message,true);else{showMsg(id?"تبلیغ ویرایش شد.":"تبلیغ اضافه شد.");resetAd();loadAds()}}
async function deleteAd(id){if(!confirm("تبلیغ حذف شود؟"))return;const {error}=await db.from("ads").delete().eq("id",id);if(error)showMsg(error.message,true);else{showMsg("تبلیغ حذف شد.");loadAds()}}
$("bookForm").addEventListener("submit",saveBook);$("cancelEdit").addEventListener("click",resetForm);$("adForm").addEventListener("submit",saveAd);$("adCancel").addEventListener("click",resetAd);$("logoutBtn").addEventListener("click",async()=>{await db.auth.signOut();location.href="login.html"});
requireAdmin().then(u=>{if(u){loadAdminBooks();loadViewStats();loadAds()}});
