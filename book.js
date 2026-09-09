const SUPABASE_URL="https://pophcxrfrooqluwrujbl.supabase.co";
const SUPABASE_KEY="sb_publishable_cmZlKwLESb-jIWkkQAC7yg_KxNdkJfn";
const db=supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
const content=document.getElementById("content"),bookId=new URLSearchParams(location.search).get("id");
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
async function recordView(){if(!bookId)return;const {error}=await db.from("page_views").insert({book_id:bookId,page:"book"});if(error)console.error("ثبت بازدید کتاب انجام نشد:",error)}
async function loadBook(){
 if(!bookId){content.innerHTML="<p>شناسه کتاب نامعتبر است.</p>";return}
 const {data:b,error}=await db.from("books").select("*").eq("id",bookId).single();
 if(error||!b){console.error(error);content.innerHTML="<p>کتاب پیدا نشد.</p>";return}
 const c=b.cover_url||"https://via.placeholder.com/400x600?text=Book";
 content.innerHTML=`<div class="book-detail"><div><img class="book-cover-large" src="${esc(c)}" alt="${esc(b.title)}"></div><div class="book-info-large"><h1>${esc(b.title)}</h1><div class="book-author">نویسنده: ${esc(b.author||"نامشخص")}</div><div class="book-meta">${b.rating!=null?`<span>امتیاز ${esc(b.rating)}</span>`:""}<span>کتابخانه آنلاین</span></div><div class="book-description">${esc(b.description||"توضیحی ثبت نشده است.")}</div>${b.pdf_url?`<a class="read-button" href="${esc(b.pdf_url)}" target="_blank" rel="noopener">شروع مطالعه</a>`:`<span>فایل PDF هنوز اضافه نشده است.</span>`}</div></div>`;
}
const dm=document.getElementById("darkMode");if(localStorage.getItem("darkMode")==="1")document.body.classList.add("dark");dm?.addEventListener("click",()=>{document.body.classList.toggle("dark");localStorage.setItem("darkMode",document.body.classList.contains("dark")?"1":"0")});
loadBook().then(()=>recordView());
