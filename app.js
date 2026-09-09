const SUPABASE_URL =
  "https://pophcxrfrooqluwrujbl.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_cmZlKwLESb-jIWkkQAC7yg_KxNdkJfn";

const db = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const grid = document.getElementById("booksGrid");
const popular = document.getElementById("popularGrid");
const best = document.getElementById("bestBooks");
const search = document.getElementById("searchInput");

let books = [];


/* جلوگیری از خراب شدن HTML */

function esc(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    function (char) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      }[char];
    }
  );
}


/* کارت کتاب */

function card(book) {

  const cover =
    book.cover_url ||
    "https://via.placeholder.com/300x450?text=Book";

  return `
    <article class="book-card">

      <a href="book.html?id=${encodeURIComponent(book.id)}">

        <img
          src="${esc(cover)}"
          alt="${esc(book.title)}"
          loading="lazy"
        >

      </a>

      <div class="book-info">

        <h3>
          ${esc(book.title)}
        </h3>

        <p>
          ${esc(book.author || "نامشخص")}
        </p>

        <div class="rating">
          ${
            book.rating != null
              ? "★ " + esc(book.rating)
              : "بدون امتیاز"
          }
        </div>

        <a
          class="book-btn"
          href="book.html?id=${encodeURIComponent(book.id)}"
        >
          مشاهده کتاب
        </a>

      </div>

    </article>
  `;
}


/* نمایش کتاب‌ها */

function renderBooks(list) {

  if (!list.length) {

    grid.innerHTML = `
      <div class="loading">
        کتابی پیدا نشد.
      </div>
    `;

    return;
  }

  grid.innerHTML =
    list.map(card).join("");
}


/* فیلتر دسته‌بندی */

function filterCategory(category) {

  if (category === "همه") {

    renderBooks(books);

    return;
  }

  const result = books.filter(book =>
    (book.category || "").trim() === category
  );

  renderBooks(result);
}


/* دریافت کتاب‌ها از Supabase */

async function loadBooks() {

  grid.innerHTML = `
    <div class="loading">
      در حال بارگذاری کتاب‌ها...
    </div>
  `;

  const {
    data,
    error
  } = await db
    .from("books")
    .select("*")
    .order("created_at", {
      ascending: false
    });

  if (error) {

    console.error(error);

    grid.innerHTML = `
      <div class="loading">
        خطا در دریافت کتاب‌ها.
      </div>
    `;

    return;
  }

  books = data || [];

  renderBooks(books);


  /* محبوب‌ترین */

  const popularBooks = [...books]
    .sort(
      (a, b) =>
        (Number(b.rating) || 0) -
        (Number(a.rating) || 0)
    );

  if (popular) {

    popular.innerHTML =
      popularBooks
        .slice(0, 6)
        .map(card)
        .join("");

  }


  /* پرفروش‌ترین */

  if (best) {

    best.innerHTML =
      popularBooks
        .slice(0, 5)
        .map((book, index) => {

          const cover =
            book.cover_url ||
            "https://via.placeholder.com/100x140";

          return `
            <div class="best">

              <div>
                ${index + 1}
              </div>

              <div class="best-info">

                <b>
                  ${esc(book.title)}
                </b>

                <span>
                  ★ ${esc(book.rating ?? "-")}
                </span>

              </div>

              <img
                src="${esc(cover)}"
                alt=""
                loading="lazy"
              >

            </div>
          `;

        })
        .join("");

  }
}


/* دسته‌بندی‌ها */

document
  .querySelectorAll("[data-category]")
  .forEach(button => {

    button.addEventListener("click", () => {

      document
        .querySelectorAll("[data-category]")
        .forEach(item => {
          item.classList.remove("active");
        });

      button.classList.add("active");

      filterCategory(
        button.dataset.category
      );

    });

  });


/* جستجو */

if (search) {

  search.addEventListener(
    "input",
    () => {

      const query =
        search.value
          .trim()
          .toLowerCase();

      if (!query) {

        renderBooks(books);

        return;
      }

      const result =
        books.filter(book => {

          const title =
            (book.title || "")
              .toLowerCase();

          const author =
            (book.author || "")
              .toLowerCase();

          const category =
            (book.category || "")
              .toLowerCase();

          return (
            title.includes(query) ||
            author.includes(query) ||
            category.includes(query)
          );

        });

      renderBooks(result);

    }
  );

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

loadBooks();
