const SUPABASE_URL="https://pophcxrfrooqluwrujbl.supabase.co";
const SUPABASE_KEY="sb_publishable_cmZlKwLESb-jIWkkQAC7yg_KxNdkJfn";
const db=supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
const results=document.getElementById("results"),queryInput=document.getElementById("query"),countEl=document.getElementById("resultCount");

function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function card(b){
 const c=b.cover_url||"https://via.placeholder.com/300x450?text=Book";
 return `<article class="book-card"><a href="book.html?id=${encodeURIComponent(b.id)}"><img src="${esc(c)}" alt="${esc(b.title)}" loading="lazy"></a><div class="book-info"><h3>${esc(b.title)}</h3><p>${esc(b.author||"نامشخص")}</p><div class="rating">${b.rating!=null?" "+esc(b.rating):"بدون امتیاز"}</div><a class="book-btn" href="book.html?id=${encodeURIComponent(b.id)}">مشاهده کتاب</a></div></article>`;
}
function normalize(s){return String(s||"").trim().toLocaleLowerCase("fa-IR")}

async function searchBooks(q){
 queryInput.value=q;
 results.innerHTML='<div class="loading">در حال جستجوی کتاب‌ها...</div>';
 if(!q){
   results.innerHTML='<div class="empty">عبارت جستجو را وارد کنید.</div>';
   countEl.textContent="0 نتیجه";
   return;
 }
 const{data,error}=await db.from("books").select("*").order("created_at",{ascending:false});
 if(error){
   results.innerHTML='<div class="empty">خطا در دریافت نتایج.</div>';
   countEl.textContent="";
   return;
 }
 const nq=normalize(q);
 const found=(data||[]).filter(b=>
   normalize(b.title).includes(nq) ||
   normalize(b.author).includes(nq) ||
   normalize(b.category).includes(nq) ||
   normalize(b.description).includes(nq)
 );
 countEl.textContent=`${found.length} نتیجه`;
 results.innerHTML=found.length?found.map(card).join(""):`<div class="empty">برای «${esc(q)}» کتابی پیدا نشد.</div>`;
}

document.getElementById("searchForm").addEventListener("submit",e=>{
 e.preventDefault();
 const q=queryInput.value.trim();
 history.replaceState(null,"","search.html"+(q?"?q="+encodeURIComponent(q):""));
 searchBooks(q);
});

const dm=document.getElementById("darkMode");
if(localStorage.getItem("darkMode")==="1")document.body.classList.add("dark");
dm?.addEventListener("click",()=>{
 document.body.classList.toggle("dark");
 localStorage.setItem("darkMode",document.body.classList.contains("dark")?"1":"0");
});

const q=new URLSearchParams(location.search).get("q")||"";
searchBooks(q);