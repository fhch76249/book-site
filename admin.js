const SUPABASE_URL =
  "https://pophcxrfrooqluwrujbl.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_cmZlKwLESb-jIWkkQAC7yg_KxNdkJfn";

const db = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);


// =========================
// ابزارهای عمومی
// =========================

function $(id) {
  return document.getElementById(id);
}

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


// =========================
// پیام
// =========================

function showMsg(text, type = "ok") {

  const msg = $("msg");

  if (!msg) return;

  msg.textContent = text;

  msg.className = "msg " + type;

  msg.style.display = "block";

  setTimeout(() => {
    msg.style.display = "none";
  }, 4000);
}


// =========================
// بررسی ورود مدیر
// =========================

async function requireLogin() {

  const {
    data: {
      user
    }
  } = await db.auth.getUser();

  if (!user) {

    location.href = "login.html";

    return null;
  }

  if ($("adminEmail")) {
    $("adminEmail").textContent =
      user.email || "مدیر";
  }

  return user;
}


// =========================
// خروج
// =========================

async function logout() {

  await db.auth.signOut();

  location.href = "login.html";
}


// =========================
// آپلود فایل
// =========================

async function uploadFile(
  file,
  bucket,
  folder = ""
) {

  if (!file) return null;

  const safeName =
    file.name
      .replace(/[^a-zA-Z0-9._-]/g, "_");

  const fileName =
    Date.now() +
    "_" +
    Math.random()
      .toString(36)
      .substring(2, 8) +
    "_" +
    safeName;

  const path =
    folder
      ? folder + "/" + fileName
      : fileName;


  const {
    error
  } = await db.storage
    .from(bucket)
    .upload(
      path,
      file,
      {
        cacheControl: "3600",
        upsert: false
      }
    );


  if (error) {

    console.error(error);

    throw new Error(
      "خطا در آپلود فایل: " +
      error.message
    );
  }


  const {
    data
  } = db.storage
    .from(bucket)
    .getPublicUrl(path);


  return data.publicUrl;
}


// =========================
// دریافت کتاب‌ها
// =========================

async function loadAdminBooks() {

  const list = $("booksList");

  if (!list) return;

  list.innerHTML =
    "در حال بارگذاری...";


  const {
    data,
    error
  } = await db
    .from("books")
    .select("*")
    .order(
      "created_at",
      {
        ascending: false
      }
    );


  if (error) {

    console.error(error);

    list.innerHTML =
      "خطا در دریافت کتاب‌ها.";

    return;
  }


  if (!data || !data.length) {

    list.innerHTML =
      "هنوز کتابی اضافه نشده است.";

    return;
  }


  list.innerHTML =
    data.map(book => {

      const cover =
        book.cover_url || "";


      return `
        <div class="book-row">

          ${
            cover
              ? `
                <img
                  class="thumb"
                  src="${esc(cover)}"
                  alt="${esc(book.title)}"
                >
              `
              : `
                <div class="thumb">
                  📚
                </div>
              `
          }


          <div>

            <h3>
              ${esc(book.title)}
            </h3>

            <p>
              نویسنده:
              ${esc(book.author || "نامشخص")}
            </p>

            <p>
              دسته:
              ${esc(book.category || "بدون دسته")}
            </p>

            <p>
              امتیاز:
              ${
                book.rating != null
                  ? "★ " + esc(book.rating)
                  : "-"
              }
            </p>

          </div>


          <div class="row-actions">

            <button
              class="primary"
              onclick="startEdit('${book.id}')"
            >
              ویرایش
            </button>

            <button
              class="danger"
              onclick="deleteBook('${book.id}')"
            >
              حذف
            </button>

          </div>

        </div>
      `;

    }).join("");
}


// =========================
// ویرایش کتاب
// =========================

async function startEdit(id) {

  const {
    data: book,
    error
  } = await db
    .from("books")
    .select("*")
    .eq("id", id)
    .single();


  if (error || !book) {

    showMsg(
      "کتاب پیدا نشد.",
      "error"
    );

    return;
  }


  $("bookId").value =
    book.id;

  $("title").value =
    book.title || "";

  $("author").value =
    book.author || "";

  $("category").value =
    book.category || "";

  $("rating").value =
    book.rating ?? "";

  $("description").value =
    book.description || "";


  $("formTitle").textContent =
    "✏️ ویرایش کتاب";


  $("saveBtn").textContent =
    "ذخیره تغییرات";


  $("cancelEdit").style.display =
    "inline-block";


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


// =========================
// لغو ویرایش
// =========================

function resetForm() {

  const form = $("bookForm");

  if (form) {
    form.reset();
  }


  $("bookId").value =
    "";


  $("formTitle").textContent =
    "➕ افزودن کتاب";


  $("saveBtn").textContent =
    "ذخیره کتاب";


  $("cancelEdit").style.display =
    "none";
}


// =========================
// ذخیره کتاب
// =========================

async function saveBook(event) {

  event.preventDefault();


  const id =
    $("bookId").value.trim();


  const title =
    $("title").value.trim();


  const author =
    $("author").value.trim();


  const category =
    $("category").value.trim();


  const description =
    $("description").value.trim();


  const ratingValue =
    $("rating").value.trim();


  const rating =
    ratingValue === ""
      ? null
      : Number(ratingValue);


  const coverFile =
    $("cover").files[0];


  const pdfFile =
    $("pdf").files[0];


  if (!title) {

    showMsg(
      "عنوان کتاب را وارد کنید.",
      "error"
    );

    return;
  }


  const saveBtn =
    $("saveBtn");


  saveBtn.disabled = true;

  saveBtn.textContent =
    "در حال ذخیره...";


  try {

    let coverUrl = null;

    let pdfUrl = null;


    // =====================
    // آپلود جلد
    // =====================

    if (coverFile) {

      coverUrl =
        await uploadFile(
          coverFile,
          "covers"
        );
    }


    // =====================
    // آپلود PDF
    // =====================

    if (pdfFile) {

      pdfUrl =
        await uploadFile(
          pdfFile,
          "books"
        );
    }


    // =====================
    // ویرایش
    // =====================

    if (id) {

      const updateData = {

        title,
        author,
        category,
        description,
        rating

      };


      if (coverUrl) {
        updateData.cover_url =
          coverUrl;
      }


      if (pdfUrl) {
        updateData.pdf_url =
          pdfUrl;
      }


      const {
        error
      } = await db
        .from("books")
        .update(updateData)
        .eq("id", id);


      if (error) {
        throw error;
      }


      showMsg(
        "کتاب با موفقیت ویرایش شد."
      );

    }


    // =====================
    // کتاب جدید
    // =====================

    else {

      const {
        error
      } = await db
        .from("books")
        .insert({

          title,
          author,
          category,
          description,
          rating,
          cover_url: coverUrl,
          pdf_url: pdfUrl

        });


      if (error) {
        throw error;
      }


      showMsg(
        "کتاب با موفقیت اضافه شد."
      );
    }


    resetForm();

    await loadAdminBooks();

    await loadViewStats();

    await loadWeeklyViews();


  } catch (error) {

    console.error(error);

    showMsg(
      error.message ||
      "خطایی رخ داد.",
      "error"
    );

  } finally {

    saveBtn.disabled =
      false;

    if ($("bookId").value) {

      saveBtn.textContent =
        "ذخیره تغییرات";

    } else {

      saveBtn.textContent =
        "ذخیره کتاب";
    }

  }
}


// =========================
// حذف کتاب
// =========================

async function deleteBook(id) {

  const confirmed =
    confirm(
      "آیا از حذف این کتاب مطمئن هستید؟"
    );


  if (!confirmed) return;


  const {
    error
  } = await db
    .from("books")
    .delete()
    .eq("id", id);


  if (error) {

    console.error(error);

    showMsg(
      "خطا در حذف کتاب: " +
      error.message,
      "error"
    );

    return;
  }


  showMsg(
    "کتاب با موفقیت حذف شد."
  );


  await loadAdminBooks();

  await loadViewStats();

  await loadWeeklyViews();
}


// =========================
// آمار بازدید
// =========================

async function loadViewStats() {

  const todayElement =
    $("todayViews");

  const totalElement =
    $("totalViews");


  // =====================
  // کل بازدیدها
  // =====================

  const {
    count: totalCount,
    error: totalError
  } = await db
    .from("page_views")
    .select(
      "*",
      {
        count: "exact",
        head: true
      }
    );


  if (totalError) {

    console.error(
      "Total views error:",
      totalError
    );

  } else if (totalElement) {

    totalElement.textContent =
      totalCount || 0;
  }


  // =====================
  // شروع امروز
  // =====================

  const start =
    new Date();

  start.setHours(
    0,
    0,
    0,
    0
  );


  // =====================
  // بازدیدهای امروز
  // =====================

  const {
    data: todayData,
    error: todayError
  } = await db
    .from("page_views")
    .select(
      "book_id,page,created_at"
    )
    .gte(
      "created_at",
      start.toISOString()
    );


  if (todayError) {

    console.error(
      "Today views error:",
      todayError
    );

    return;
  }


  const today =
    todayData || [];


  // =====================
  // تعداد کل امروز
  // =====================

  if (todayElement) {

    todayElement.textContent =
      today.length;
  }


  // =====================
  // صفحه اصلی
  // =====================

  const homeCount =
    today.filter(
      view =>
        view.page === "home"
    ).length;


  if ($("homeViews")) {

    $("homeViews").textContent =
      homeCount;
  }


  // =====================
  // صفحات کتاب
  // =====================

  const bookCount =
    today.filter(
      view =>
        view.page === "book"
    ).length;


  if ($("bookViews")) {

    $("bookViews").textContent =
      bookCount;
  }


  // =====================
  // پربازدیدترین کتاب‌ها
  // =====================

  const bookViews =
    today.filter(
      view =>
        view.page === "book" &&
        view.book_id
    );


  const counts = {};


  bookViews.forEach(
    view => {

      if (!counts[view.book_id]) {
        counts[view.book_id] = 0;
      }

      counts[view.book_id]++;
    }
  );


  const ids =
    Object.keys(counts);


  const popularElement =
    $("popularViews");


  if (!popularElement) return;


  if (!ids.length) {

    popularElement.innerHTML =
      `
        <div class="chart-empty">
          امروز هنوز بازدیدی برای کتاب‌ها ثبت نشده است.
        </div>
      `;

    return;
  }


  // =====================
  // دریافت عنوان کتاب‌ها
  // =====================

  const {
    data: booksData,
    error: booksError
  } = await db
    .from("books")
    .select(
      "id,title,cover_url"
    )
    .in(
      "id",
      ids
    );


  if (booksError) {

    console.error(
      booksError
    );

    return;
  }


  const booksMap = {};


  (booksData || []).forEach(
    book => {

      booksMap[book.id] =
        book;
    }
  );


  const sorted =
    ids.sort(
      (a, b) =>
        counts[b] -
        counts[a]
    );


  popularElement.innerHTML =
    sorted
      .slice(0, 10)
      .map(
        (id, index) => {

          const book =
            booksMap[id];


          if (!book) {
            return "";
          }


          return `
            <div class="view-row">

              <strong>
                #${index + 1}
              </strong>

              <span>
                ${esc(book.title)}
              </span>

              <b>
                ${counts[id]} بازدید
              </b>

            </div>
          `;

        }
      )
      .join("");
}


// =========================
// نمودار ۷ روز اخیر
// =========================

async function loadWeeklyViews() {

  const chart =
    $("viewsChart");


  if (!chart) return;


  const start =
    new Date();


  start.setHours(
    0,
    0,
    0,
    0
  );


  start.setDate(
    start.getDate() - 6
  );


  const {
    data,
    error
  } = await db
    .from("page_views")
    .select(
      "created_at"
    )
    .gte(
      "created_at",
      start.toISOString()
    );


  if (error) {

    console.error(
      "Weekly views error:",
      error
    );


    chart.innerHTML =
      `
        <div class="chart-empty">
          خطا در دریافت نمودار
        </div>
      `;

    return;
  }


  const days = [];


  for (
    let i = 0;
    i < 7;
    i++
  ) {

    const date =
      new Date(start);


    date.setDate(
      start.getDate() + i
    );


    days.push({
      date,
      count: 0
    });

  }


  (data || []).forEach(
    view => {

      const date =
        new Date(
          view.created_at
        );


      date.setHours(
        0,
        0,
        0,
        0
      );


      const item =
        days.find(
          x =>
            x.date.getTime() ===
            date.getTime()
        );


      if (item) {
        item.count++;
      }

    }
  );


  const max =
    Math.max(
      ...days.map(
        x => x.count
      ),
      1
    );


  chart.innerHTML =
    days.map(
      item => {

        const label =
          item.date.toLocaleDateString(
            "fa-IR",
            {
              month: "numeric",
              day: "numeric"
            }
          );


        const width =
          Math.max(
            3,
            (
              item.count /
              max
            ) * 100
          );


        return `
          <div class="chart-row">

            <span>
              ${label}
            </span>

            <div>
              <div
                class="chart-bar"
                style="width:${width}%"
              ></div>
            </div>

            <b>
              ${item.count}
            </b>

          </div>
        `;

      }
    ).join("");
}


// =========================
// شروع پنل
// =========================

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    const user =
      await requireLogin();


    if (!user) return;


    // خروج
    const logoutBtn =
      $("logoutBtn");


    if (logoutBtn) {

      logoutBtn.addEventListener(
        "click",
        logout
      );

    }


    // فرم کتاب
    const form =
      $("bookForm");


    if (form) {

      form.addEventListener(
        "submit",
        saveBook
      );

    }


    // لغو ویرایش
    const cancelEdit =
      $("cancelEdit");


    if (cancelEdit) {

      cancelEdit.addEventListener(
        "click",
        resetForm
      );

    }


    // دریافت اطلاعات
    await loadAdminBooks();

    await loadViewStats();

    await loadWeeklyViews();

  }
);
