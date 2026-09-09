const SUPABASE_URL="https://pophcxrfrooqluwrujbl.supabase.co";
const SUPABASE_KEY="sb_publishable_cmZlKwLESb-jIWkkQAC7yg_KxNdkJfn";
const db=supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
const grid=document.getElementById("booksGrid"),popular=document.getElementById("popularGrid"),best=document.getElementById("bestBooks");
let books=[];
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const normalize=s=>String(s??"").normalize("NFKC").replace(/ي/g,"ی").replace(/ك/g,"ک").replace(/\u200c/g," ").replace(/\s+/g," ").trim().toLocaleLowerCase("fa-IR");
function card(b){const c=b.cover_url||"https://via.placeholder.com/300x450?text=Book";return `<article class="book-card"><a href="book.html?id=${encodeURIComponent(b.id)}"><img src="${esc(c)}" alt="${esc(b.title)}" loading="lazy"></a><div class="book-info"><h3>${esc(b.title)}</h3><p>${esc(b.author||"نامشخص")}</p><div class="rating">${b.rating!=null?"امتیاز "+esc(b.rating):"بدون امتیاز"}</div><a class="book-btn" href="book.html?id=${encodeURIComponent(b.id)}">مشاهده کتاب</a></div></article>`}
function render(a){grid.innerHTML=a.length?a.map(card).join(""):"<div class='loading'>کتابی پیدا نشد.</div>"}
async function recordHomeView(){
  const {error}=await db.from("page_views").insert({page:"home"});
  if(error) console.error("ثبت بازدید صفحه اصلی انجام نشد:",error);
}
async function loadBooks(){
  const {data,error}=await db.from("books").select("*").order("created_at",{ascending:false});
  if(error){console.error(error);grid.innerHTML="<div class='loading'>خطا در دریافت کتاب‌ها. اتصال پایگاه داده را بررسی کنید.</div>";return}
  // دسته «عاشقانه» از رابط سایت حذف شده و دیگر به عنوان دسته نمایش داده نمی‌شود.
  books=(data||[]).filter(b=>normalize(b.category)!=="عاشقانه");
  render(books);
  const s=[...books].sort((a,b)=>(Number(b.rating)||0)-(Number(a.rating)||0));
  if(popular)popular.innerHTML=s.slice(0,6).map(card).join("")||"<div class='loading'>کتابی وجود ندارد.</div>";
  if(best)best.innerHTML=s.slice(0,5).map((b,i)=>`<div class="best"><div>${i+1}</div><div class="best-info"><b>${esc(b.title)}</b><span>امتیاز ${esc(b.rating??"-")}</span></div><img src="${esc(b.cover_url||"https://via.placeholder.com/100x140")}" alt=""></div>`).join("")||"<div class='loading'>کتابی وجود ندارد.</div>";
}
function goSearch(q){q=q.trim();location.href="search.html"+(q?"?q="+encodeURIComponent(q):"")}
document.getElementById("homeSearchForm")?.addEventListener("submit",e=>{e.preventDefault();goSearch(document.getElementById("searchInput").value)});
document.querySelectorAll("[data-category]").forEach(x=>x.addEventListener("click",()=>{const c=x.dataset.category;render(c==="همه"?books:books.filter(b=>normalize(b.category)===normalize(c)));document.querySelectorAll("[data-category]").forEach(y=>y.classList.remove("active"));x.classList.add("active")}));
const dm=document.getElementById("darkMode");
if(localStorage.getItem("darkMode")==="1")document.body.classList.add("dark");
dm?.addEventListener("click",()=>{document.body.classList.toggle("dark");localStorage.setItem("darkMode",document.body.classList.contains("dark")?"1":"0")});
document.getElementById("newsletterBtn")?.addEventListener("click",()=>alert("عضویت شما ثبت شد."));
recordHomeView();loadBooks();
