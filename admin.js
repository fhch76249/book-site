const SUPABASE_URL="https://pophcxrfrooqluwrujbl.supabase.co";
const SUPABASE_KEY="sb_publishable_cmZlKwLESb-jIWkkQAC7yg_KxNdkJfn";
const db=supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
const $=id=>document.getElementById(id);

function showMsg(text,type="ok"){
 const box=$("msg"); if(!box)return;
 box.textContent=text; box.className="msg "+type; box.style.display="block";
}

async function requireLogin(){
 const {data:{session}}=await db.auth.getSession();
 if(!session){location.href="login.html";return null}
 if($("adminEmail"))$("adminEmail").textContent="وارد شده با: "+(session.user.email||"");
 return session;
}

async function login(){
 const email=$("email").value.trim(), password=$("password").value;
 const {error}=await db.auth.signInWithPassword({email,password});
 if(error){showMsg("ورود ناموفق: "+error.message,"error");return}
 location.href="admin.html";
}

async function logout(){await db.auth.signOut();location.href="login.html"}

async function uploadFile(bucket,file){
 if(!file)return null;
 const ext=file.name.includes(".")?file.name.split(".").pop():"bin";
 const path=Date.now()+"-"+Math.random().toString(36).slice(2)+"."+ext.replace(/[^a-zA-Z0-9]/g,"");
 const {error}=await db.storage.from(bucket).upload(path,file,{upsert:false,contentType:file.type||undefined});
 if(error)throw new Error("خطا در آپلود فایل: "+error.message);
 return db.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

async function loadAdminBooks(){
 const list=$("booksList"); if(!list)return;
 const {data,error}=await db.from("books").select("*").order("created_at",{ascending:false});
 if(error){list.innerHTML="<p>خطا: "+error.message+"</p>";return}
 if(!data||!data.length){list.innerHTML="<p>هنوز کتابی اضافه نشده است.</p>";return}
 list.innerHTML=data.map(b=>`
 <div class="book-row">
 ${b.cover_url?`<img class="thumb" src="${b.cover_url}" alt="">`:`<div class="thumb">📚</div>`}
 <div><h3>${esc(b.title||"بدون عنوان")}</h3><p>نویسنده: ${esc(b.author||"—")}</p><p>دسته: ${esc(b.category||"—")} | امتیاز: ${b.rating??"—"}</p></div>
 <div class="row-actions actions"><button class="primary edit-btn" data-id="${b.id}">ویرایش</button><button class="danger delete-btn" data-id="${b.id}">حذف</button></div>
 </div>`).join("");
 document.querySelectorAll(".edit-btn").forEach(x=>x.onclick=()=>startEdit(x.dataset.id,data));
 document.querySelectorAll(".delete-btn").forEach(x=>x.onclick=()=>deleteBook(x.dataset.id));
}

function esc(v){return String(v).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}

function startEdit(id,books){
 const b=books.find(x=>x.id===id);if(!b)return;
 $("bookId").value=b.id;$("title").value=b.title||"";$("author").value=b.author||"";
 $("category").value=b.category||"";$("rating").value=b.rating??"";$("description").value=b.description||"";
 $("formTitle").textContent="✏️ ویرایش کتاب";$("saveBtn").textContent="ذخیره تغییرات";$("cancelEdit").style.display="inline-block";
 scrollTo({top:0,behavior:"smooth"});
}

function resetForm(){
 $("bookForm").reset();$("bookId").value="";$("formTitle").textContent="➕ افزودن کتاب";
 $("saveBtn").textContent="ذخیره کتاب";$("cancelEdit").style.display="none";
}

async function saveBook(e){
 e.preventDefault();if(!await requireLogin())return;
 const id=$("bookId").value,title=$("title").value.trim(),author=$("author").value.trim(),
 category=$("category").value.trim(),description=$("description").value.trim(),
 rv=$("rating").value.trim(),rating=rv===""?null:Number(rv),cover=$("cover").files[0],pdf=$("pdf").files[0];
 if(!title){showMsg("عنوان کتاب را وارد کن.","error");return}
 $("saveBtn").disabled=true;showMsg("در حال ذخیره و آپلود فایل‌ها...");
 try{
  const coverUrl=await uploadFile("covers",cover),pdfUrl=await uploadFile("books",pdf);
  const payload={title,author,category,description,rating};
  if(coverUrl)payload.cover_url=coverUrl;if(pdfUrl)payload.pdf_url=pdfUrl;
  const result=id?await db.from("books").update(payload).eq("id",id):await db.from("books").insert(payload);
  if(result.error)throw result.error;
  showMsg(id?"کتاب ویرایش شد.":"کتاب با موفقیت اضافه شد.");resetForm();await loadAdminBooks();
 }catch(err){showMsg(err.message||"خطای ناشناخته","error")}
 finally{$("saveBtn").disabled=false}
}

async function deleteBook(id){
 if(!confirm("این کتاب حذف شود؟"))return;
 const {error}=await db.from("books").delete().eq("id",id);
 if(error){showMsg("حذف ناموفق: "+error.message,"error");return}
 showMsg("کتاب حذف شد.");await loadAdminBooks();
}

document.addEventListener("DOMContentLoaded",async()=>{
 if($("loginForm")){$("loginForm").onsubmit=e=>{e.preventDefault();login()};return}
 if($("bookForm")){
  if(!await requireLogin())return;
  $("bookForm").onsubmit=saveBook;$("cancelEdit").onclick=resetForm;$("logoutBtn").onclick=logout;
  await loadAdminBooks();
 }
});