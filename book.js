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


/* جلوگیری از خراب شدن HTML */

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


/* دریافت شناسه کتاب از آدرس */

const params =
  new URLSearchParams(location.search);

const bookId = params.get("id");


/* اگر شناسه وجود نداشت */

if (!bookId) {

  content.innerHTML = `
    <div class="panel">
      <h2>کتاب پیدا نشد</h2>
      <p>
        شناسه کتاب در آدرس وجود ندارد.
      </p>
      <a class="read-button" href="index.html">
        بازگشت به کتابخانه
      </a>
    </div>
  `;

}


/* دریافت اطلاعات کتاب */

async function loadBook() {

  if (!bookId) return;

  const {
    data: book,
    error
  } = await db
    .from("books")
    .select("*")
    .eq("id", bookId)
    .single();


  /* خطا */

  if (error || !book) {

    console.error(error);

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


  /* عنوان صفحه */

  document.title =
    `${book.title || "کتاب"} | کتابخانه`;


  /* جلد */

  const cover =
    book.cover_url ||
    "https://via.placeholder.com/500x750?text=Book";


  /* امتیاز */

  const rating =
    book.rating != null
      ? `⭐ ${esc(book.rating)}`
      : "بدون امتیاز";


  /* دسته بندی */

  const category =
    book.category || "عمومی";


  /* توضیحات */

  const description =
    book.description ||
    "توضیحی برای این کتاب ثبت نشده است.";


  /* دکمه مطالعه */

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


  /* نمایش صفحه */

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


/* شروع */

loadBook();
