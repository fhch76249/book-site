const SUPABASE_URL = "https://pophcxrfrooqluwrujbl.supabase.co";

const SUPABASE_KEY = "sb_publishable_cmZlKwLESb-jIWkkQAC7yg_KxNdkJfn";

const db = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);


// ===============================
// حالت تاریک
// ===============================

function toggleDarkMode() {
  document.body.classList.toggle("dark");

  localStorage.setItem(
    "darkMode",
    document.body.classList.contains("dark")
  );
}


// ===============================
// جستجوی کتاب
// ===============================

function searchBooks() {

  const input = document.getElementById("searchInput");

  if (!input) return;

  const search = input.value.toLowerCase().trim();

  document.querySelectorAll(".book-card").forEach(card => {

    const text = card.innerText.toLowerCase();

    card.style.display =
      text.includes(search) ? "" : "none";

  });

}


// ===============================
// فیلتر دسته‌بندی
// ===============================

function filterCategory(category) {

  document.querySelectorAll(".book-card").forEach(card => {

    const text = card.innerText.toLowerCase();

    if (
      category === "همه" ||
      text.includes(category.toLowerCase())
    ) {

      card.style.display = "";

    } else {

      card.style.display = "none";

    }

  });

  const books = document.getElementById("books");

  if (books) {

    books.scrollIntoView({
      behavior: "smooth"
    });

  }

}


// ===============================
// نمایش همه کتاب‌ها
// ===============================

function showAllBooks() {

  document.querySelectorAll(".book-card").forEach(card => {

    card.style.display = "";

  });

}


// ===============================
// دریافت کتاب‌ها از Supabase
// ===============================

async function loadBooks() {

  const container =
    document.querySelector(".books-grid");

  if (!container) return;


  const { data, error } = await db

    .from("books")

    .select("*")

    .order("created_at", {
      ascending: false
    });


  if (error) {

    console.error(
      "Supabase Error:",
      error
    );

    return;

  }


  // اگر هنوز کتابی اضافه نشده
  if (!data || data.length === 0) {

    return;

  }


  // پاک کردن کتاب‌های نمونه
  container.innerHTML = "";


  // ساخت کارت کتاب‌ها
  data.forEach(book => {

    const card =
      document.createElement("div");


    card.className = "book-card";


    const cover = book.cover_url

      ? `
        <img
          src="${book.cover_url}"
          alt="${book.title || "کتاب"}"
        >
      `

      : `
        <div class="fake-cover">
          📚
        </div>
      `;


    card.innerHTML = `

      <div class="book-cover">

        ${cover}

      </div>


      <div class="book-info">

        <span class="book-category">

          ${book.category || "عمومی"}

        </span>


        <h3>

          ${book.title || "بدون عنوان"}

        </h3>


        <p>

          ${book.author || "نویسنده نامشخص"}

        </p>


        <div class="book-bottom">

          <span>

            ⭐ ${book.rating || "—"}

          </span>


          ${
            book.pdf_url

              ? `
                <a
                  href="${book.pdf_url}"
                  target="_blank"
                  rel="noopener"
                >
                  مطالعه
                </a>
              `

              : `
                <span>
                  به‌زودی
                </span>
              `
          }

        </div>

      </div>

    `;


    container.appendChild(card);

  });

}


// ===============================
// اجرای سایت
// ===============================

document.addEventListener(
  "DOMContentLoaded",
  () => {


    // بازیابی حالت تاریک

    if (
      localStorage.getItem("darkMode") === "true"
    ) {

      document.body.classList.add("dark");

    }


    // دریافت کتاب‌ها

    loadBooks();

  }
);
