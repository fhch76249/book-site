const SUPABASE_URL = "https://pophcxrfrooqluwrujbl.supabase.co";
const SUPABASE_KEY = "sb_publishable_cmZlKwLESb-jIWkkQAC7yg_KxNdkJfn";

const db = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

// حالت تاریک
const themeBtn = document.querySelector(".theme-toggle");

if (themeBtn) {
  themeBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark");

    localStorage.setItem(
      "theme",
      document.body.classList.contains("dark") ? "dark" : "light"
    );
  });
}

if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
}


// فرار دادن متن برای جلوگیری از مشکل HTML
function escapeHTML(text) {
  if (!text) return "";

  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


// دریافت کتاب‌ها
async function loadBooks() {

  const { data: books, error } = await db
    .from("books")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("خطا در دریافت کتاب‌ها:", error);
    return;
  }

  const container =
    document.querySelector("#books-grid") ||
    document.querySelector(".books-grid");

  if (!container) {
    console.error("محل نمایش کتاب‌ها پیدا نشد.");
    return;
  }

  if (!books || books.length === 0) {
    container.innerHTML = `
      <div class="empty-books">
        هنوز کتابی اضافه نشده است.
      </div>
    `;
    return;
  }

  container.innerHTML = books.map(book => {

    const title = escapeHTML(book.title || "بدون عنوان");
    const author = escapeHTML(book.author || "ناشناس");
    const category = escapeHTML(book.category || "عمومی");
    const description = escapeHTML(book.description || "");

    const cover = book.cover_url
      ? escapeHTML(book.cover_url)
      : "https://placehold.co/600x800/5b4bdb/ffffff?text=BOOK";

    const pdfUrl = book.pdf_url || "";

    let readButton = "";

    if (pdfUrl) {
      readButton = `
        <a
          class="read-btn"
          href="${escapeHTML(pdfUrl)}"
          target="_blank"
          rel="noopener noreferrer"
        >
          📖 مطالعه کتاب
        </a>
      `;
    }

    return `
      <article class="book-card">

        <img
          class="book-cover"
          src="${cover}"
          alt="${title}"
          loading="lazy"
        >

        <div class="book-info">

          <h3>${title}</h3>

          <p class="author">
            نویسنده: ${author}
          </p>

          <span class="category">
            ${category}
          </span>

          <div class="book-bottom">

            <span class="rating">
              ⭐ ${book.rating || 0}
            </span>

            ${readButton}

          </div>

        </div>

      </article>
    `;

  }).join("");
}


// جستجوی کتاب‌ها
const searchInput = document.querySelector("#search");

if (searchInput) {

  searchInput.addEventListener("input", async (event) => {

    const text = event.target.value.trim();

    const { data, error } = await db
      .from("books")
      .select("*")
      .ilike("title", `%${text}%`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    const container =
      document.querySelector("#books-grid") ||
      document.querySelector(".books-grid");

    if (!container) return;

    container.innerHTML = data.map(book => {

      const title = escapeHTML(book.title || "بدون عنوان");
      const author = escapeHTML(book.author || "ناشناس");

      const cover = book.cover_url
        ? escapeHTML(book.cover_url)
        : "https://placehold.co/600x800/5b4bdb/ffffff?text=BOOK";

      return `
        <article class="book-card">

          <img
            class="book-cover"
            src="${cover}"
            alt="${title}"
          >

          <div class="book-info">

            <h3>${title}</h3>

            <p class="author">
              نویسنده: ${author}
            </p>

            <div class="book-bottom">

              <span class="rating">
                ⭐ ${book.rating || 0}
              </span>

              ${
                book.pdf_url
                ? `
                  <a
                    class="read-btn"
                    href="${escapeHTML(book.pdf_url)}"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    📖 مطالعه کتاب
                  </a>
                `
                : ""
              }

            </div>

          </div>

        </article>
      `;

    }).join("");
  });
}


// اجرای اولیه
loadBooks();
