const SUPABASE_URL =
  "https://pophcxrfrooqluwrujbl.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_cmZlKwLESb-jIWkkQAC7yg_KxNdkJfn";

const db = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const content =
  document.getElementById("content");


function esc(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[char])
  );
}


const params =
  new URLSearchParams(location.search);

const bookId =
  params.get("id");


/* ثبت بازدید */

async function recordView() {

  if (!bookId) return;

  const { error } = await db
    .from("page_views")
    .insert({
      book_id: bookId,
      page: "book"
    });

  if (error) {
    console.log("View error:", error);
  }
}


/* دریافت کتاب */

async function loadBook() {

  if (!bookId) {

    content.innerHTML = `
      <div class="panel">

        <h2>کتاب پیدا نشد</h2>

        <p>
          شناسه کتاب در آدرس وجود ندارد.
        </p>

        <a
          class="read-button"
          href="index.html"
        >
          بازگشت به کتابخانه
        </a>

      </div>
    `;

    return;
  }


  const {
    data: book,
    error
  } = await db
    .from("books")
    .select("*")
    .eq("id", bookId)
    .single();


  if (error || !book) {

    content.innerHTML = `
      <div class="panel">

        <h2>کتاب پیدا نشد</h2>

        <p>
          این کتاب وجود ندارد یا حذف شده است.
        </p>

        <a
          class="read-button"
          href="index.html"
        >
          ← بازگشت به کتابخانه
        </a>

      </div>
    `;

    return;
  }


  document.title =
    `${book.title || "کتاب"} | کتابخانه`;


  const cover =
    book.cover_url ||
    "https://via.placeholder.com/500x750?text=Book";


  const rating =
    book.rating != null
      ? `⭐ ${esc(book.rating)}`
      : "بدون امتیاز";


  const category =
    book.category || "عمومی";


  const description =
    book.description ||
    "توضیحی برای این کتاب ثبت نشده است.";


  let readButton = "";


  if (book.pdf_url) {

    readButton = `
      <a
        class="read-button"
        href="${esc(book.pdf_url)}"
        target="_blank"
        rel="noopener noreferrer"
      >
        📖 مطالعه کتاب
      </a>
    `;

  } else {

    readButton = `
      <span class="no-pdf">
        📕 فایل PDF هنوز اضافه نشده است
      </span>
    `;

  }


  content.innerHTML = `

    <section class="book-detail">

      <div>

        <img
          class="book-cover-large"
          src="${esc(cover)}"
          alt="${esc(book.title)}"
        >

      </div>

      <div class="book-info">

        <span class="book-category">
          ${esc(category)}
        </span>

        <h1>
          ${esc(book.title)}
        </h1>

        <div class="book-author">
          ✍️ نویسنده:
          ${esc(book.author || "نامشخص")}
        </div>

        <div class="book-meta">

          <span>
            ${rating}
          </span>

          <span>
            📚 کتاب آنلاین
          </span>

          <span>
            📖 مطالعه دیجیتال
          </span>

        </div>

        <div class="book-description">
          ${esc(description)}
        </div>

        ${readButton}

      </div>

    </section>

  `;

}


/* حالت شب */

const darkMode =
  document.getElementById("darkMode");


if (
  localStorage.getItem("darkMode") === "1"
) {
  document.body.classList.add("dark");
}


if (darkMode) {

  darkMode.addEventListener(
    "click",
    () => {

      document.body.classList.toggle("dark");

      localStorage.setItem(
        "darkMode",
        document.body.classList.contains("dark")
          ? "1"
          : "0"
      );

    }
  );

}


/* اجرا */

recordView();

loadBook();
