(function () {
  "use strict";

  const translations = {
    ar: {
      home: "الرئيسية",
      courses: "المواد",
      login: "تسجيل الدخول",
      dashboard: "لوحة الطالب",
      admin: "لوحة الإدارة",
      profile: "الملف الشخصي",
      logout: "تسجيل الخروج",
      language: "English",
      heroEyebrow: "كلية الحقوق — جامعة الزقازيق",
      heroTitle: "المحكمة",
      heroSubtitle: "ركن المذاكرة لفرقة أولى حقوق",
      explore: "استكشف المواد",
      loginNow: "ابدأ الدراسة",
      subjects: "مواد الفرقة الأولى",
      announcements: "الإعلانات",
      notifications: "الإشعارات",
      viewAnnouncements: "عرض الإعلانات",
      accessCode: "رمز الدخول",
      welcome: "مرحبًا بك يا",
      approved: "معتمد",
      pending: "بانتظار الموافقة",
      none: "غير مشترك",
      banned: "محظور",
      request: "طلب اشتراك بالمناهج",
      pendingRequest: "طلبك قيد المراجعة",
      summaries: "الملخصات",
      exams: "الأسئلة والامتحانات",
      open: "فتح وقراءة",
      download: "تحميل",
      protected: "المحتوى متاح للطلاب المعتمدين فقط",
      fullName: "الاسم الكامل",
      phone: "رقم الهاتف",
      gmail: "البريد الإلكتروني",
      password: "كلمة المرور",
      save: "حفظ التغييرات",
      copy: "نسخ",
      createAccount: "إنشاء حساب",
      forgotPassword: "نسيت كلمة المرور؟",
      resetPassword: "إرسال رابط الاستعادة",
      sendAnnouncement: "نشر إعلان"
    },
    en: {
      home: "Home",
      courses: "Subjects",
      login: "Login",
      dashboard: "Student Portal",
      admin: "Admin",
      profile: "Profile",
      logout: "Log out",
      language: "العربية",
      heroEyebrow: "Faculty of Law — Zagazig University",
      heroTitle: "Al-Mahkama",
      heroSubtitle: "Study Corner — First-Year Law",
      explore: "Explore Subjects",
      loginNow: "Start Studying",
      subjects: "First-Year Subjects",
      announcements: "Announcements",
      notifications: "Notifications",
      viewAnnouncements: "View announcements",
      accessCode: "Access Code",
      welcome: "Welcome,",
      approved: "Approved",
      pending: "Pending Approval",
      none: "Not Enrolled",
      banned: "Banned",
      request: "Request Course Access",
      pendingRequest: "Your request is under review",
      summaries: "Summaries",
      exams: "Questions & Exams",
      open: "Open & Read",
      download: "Download",
      protected: "Content is available only for approved students",
      fullName: "Full Name",
      phone: "Phone Number",
      gmail: "Email",
      password: "Password",
      save: "Save Changes",
      copy: "Copy",
      createAccount: "Create Account",
      forgotPassword: "Forgot Password?",
      resetPassword: "Send Reset Link",
      sendAnnouncement: "Publish Announcement"
    }
  };

  let lang = localStorage.getItem("language") || "ar";

  function installPageLoader() {
    if (!document.body || document.querySelector(".page-loader")) return;

    const loader = document.createElement("div");
    loader.className = "page-loader";
    loader.setAttribute("role", "status");
    loader.setAttribute("aria-live", "polite");
    loader.setAttribute("aria-label", lang === "ar" ? "جارٍ تحميل الصفحة" : "Loading page");
    loader.innerHTML = `
      <div class="loader-card">
        <span class="loader-card-glow" aria-hidden="true"></span>
        <div class="loader-emblem" aria-hidden="true">
          <span class="loader-emblem-ring loader-emblem-ring-outer"></span>
          <span class="loader-emblem-ring loader-emblem-ring-inner"></span>
          <img src="assets/logo.png" alt="">
        </div>
        <div class="loader-copy">
          <span class="loader-overline">${lang === "ar" ? "ركن المذاكرة" : "STUDY CORNER"}</span>
          <strong class="loader-caption">${lang === "ar" ? "المحكمة" : "AL-MAHKAMA"}</strong>
          <span class="loader-message">${lang === "ar" ? "نجهّز لك تجربة تستحق الانتظار" : "Preparing your experience"}</span>
        </div>
        <div class="loader-progress" aria-hidden="true"><span></span></div>
        <span class="loader-footnote">${lang === "ar" ? "لحظات ونكون معك" : "Just a moment"}</span>
      </div>
    `;
    document.body.appendChild(loader);

    let hidden = false;
    const startedAt = Date.now();
    let fallbackTimer;
    const hideLoader = () => {
      if (hidden) return;
      hidden = true;
      window.clearTimeout(fallbackTimer);
      const minimumDuration = 900;
      const remaining = Math.max(0, minimumDuration - (Date.now() - startedAt));
      window.setTimeout(() => {
        loader.classList.add("page-loader-hidden");
        window.setTimeout(() => loader.remove(), 650);
      }, remaining);
    };
    fallbackTimer = window.setTimeout(hideLoader, 8000);

    if (document.readyState === "complete") {
      hideLoader();
    } else {
      window.addEventListener("load", hideLoader, { once: true });
    }
  }

  installPageLoader();

  function applyLanguage() {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.querySelectorAll("[data-i18n]").forEach((node) => {
      const key = node.dataset.i18n;
      if (translations[lang][key]) node.textContent = translations[lang][key];
    });
  }

  window.setLanguage = function (nextLang) {
    lang = nextLang;
    localStorage.setItem("language", lang);
    applyLanguage();
  };

  window.t = function (key) {
    return translations[lang][key] || key;
  };

  window.addEventListener("DOMContentLoaded", () => {
    applyLanguage();
    updateAdminNavigation();
    installSitewideAnnouncementButton();

    document.querySelectorAll("[data-lang-toggle]").forEach((button) => {
      button.addEventListener("click", () => {
        setLanguage(lang === "ar" ? "en" : "ar");
      });
      button.textContent = translations[lang].language;
    });

    document.querySelectorAll("[data-toast]").forEach((toast) => {
      setTimeout(() => toast.classList.add("visible"), 200);
    });

    document.querySelectorAll("[data-tilt]").forEach((card) => {
      card.addEventListener("mousemove", (event) => {
        if (window.innerWidth < 768) return;
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.transform =
          `perspective(900px) rotateX(${y * -7}deg) ` +
          `rotateY(${x * 7}deg) translateY(-5px)`;
      });
      card.addEventListener("mouseleave", () => {
        card.style.transform = "";
      });
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("revealed");
        });
      },
      { threshold: 0.12 }
    );

    document.querySelectorAll(".reveal").forEach((node) => observer.observe(node));
  });

  window.showToast = function (message, type = "success") {
    let host = document.querySelector(".toast-host");
    if (!host) {
      host = document.createElement("div");
      host.className = "toast-host";
      document.body.appendChild(host);
    }
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    const content = document.createElement("span");
    content.textContent = message;
    toast.appendChild(content);
    host.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("visible"));
    setTimeout(() => toast.classList.remove("visible"), 3800);
  };

  window.copyText = async function (text) {
    try {
      await navigator.clipboard.writeText(text);
      showToast(t("copy") + ": ✓");
    } catch {
      showToast("Clipboard unavailable", "error");
    }
  };

  window.requireAuth = async function (keepHidden = false) {
    if (!window.AppSupabase) {
      window.location.replace("login.html");
      return null;
    }
    const { data, error } = await AppSupabase.auth.getSession();
    if (error) {
      showToast(error.message, "error");
      window.location.replace("login.html");
      return null;
    }
    if (!data.session) {
      window.location.replace("login.html");
      return null;
    }
    if (!keepHidden) document.body.classList.remove("auth-pending");
    return data.session.user;
  };

  window.requireAdmin = async function () {
    const user = await requireAuth(true);
    if (!user) return null;
    const { data: profile, error } = await AppSupabase
      .from("profiles")
      .select("id,role,full_name,gmail")
      .eq("id", user.id)
      .maybeSingle();
    if (error) {
      showToast(error.message, "error");
      window.location.replace("dashboard.html");
      return null;
    }
    if (!profile || !["admin", "super_admin"].includes(profile.role)) {
      window.location.replace("dashboard.html");
      return null;
    }
    document.body.classList.remove("auth-pending");
    return profile;
  };

  window.initNotificationCenter = async function (user, canPublish = false) {
    const center = document.querySelector("[data-notification-center]");
    if (!center || !user || !window.AppSupabase) return;

    const toggle = center.querySelector("[data-notification-toggle]");
    const panel = center.querySelector("[data-notification-panel]");
    const count = center.querySelector("[data-notification-count]");
    const list = center.querySelector("[data-notification-list]");
    const readKey = `notifications-read-${user.id}`;
    let lastReadId = Number(localStorage.getItem(readKey) || 0);
    let isOpen = false;

    const { data, error } = await AppSupabase
      .from("notifications")
      .select("id,title,message,type,created_at")
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) {
      showToast(error.message, "error");
      return;
    }

    let notifications = data || [];
    if (!localStorage.getItem(readKey)) {
      lastReadId = notifications.reduce((maxId, item) => Math.max(maxId, Number(item.id)), 0);
      localStorage.setItem(readKey, String(lastReadId));
    }

    const markAsRead = () => {
      lastReadId = notifications.reduce((maxId, item) => Math.max(maxId, Number(item.id)), lastReadId);
      localStorage.setItem(readKey, String(lastReadId));
      count.hidden = true;
      count.textContent = "0";
    };

    const render = () => {
      list.replaceChildren();
      if (!notifications.length) {
        const empty = document.createElement("p");
        empty.className = "notification-empty";
        empty.textContent = lang === "ar" ? "لا توجد إشعارات حالياً." : "No notifications yet.";
        list.appendChild(empty);
      } else {
        notifications.forEach((item) => {
          const entry = document.createElement(item.type === "announcement" ? "a" : "article");
          entry.className = item.type === "announcement"
            ? "notification-item-link"
            : "notification-item";
          if (item.type === "announcement") entry.href = "index.html#announcements";
          const card = item.type === "announcement"
            ? document.createElement("article")
            : entry;
          if (item.type === "announcement") card.className = "notification-item";
          const heading = document.createElement("strong");
          heading.textContent = item.title;
          const message = document.createElement("p");
          message.textContent = item.message;
          const date = document.createElement("time");
          date.dateTime = item.created_at;
          date.textContent = new Date(item.created_at).toLocaleString(lang === "ar" ? "ar-EG" : "en");
          card.append(heading, message, date);
          if (item.type === "announcement") entry.appendChild(card);
          list.appendChild(entry);
        });
      }

      const unreadCount = notifications.filter((item) => Number(item.id) > lastReadId).length;
      count.textContent = String(unreadCount);
      count.hidden = unreadCount === 0;
    };

    const announcementsLink = document.createElement("a");
    announcementsLink.className = "notification-announcements-link";
    announcementsLink.href = "index.html#announcements";
    announcementsLink.dataset.i18n = "viewAnnouncements";
    announcementsLink.textContent = t("viewAnnouncements");
    panel.querySelector(".notification-panel-head").after(announcementsLink);

    if (canPublish) {
      const publishLink = document.createElement("a");
      publishLink.className = "notification-publish-link";
      publishLink.href = "admin.html#announcementForm";
      publishLink.dataset.i18n = "sendAnnouncement";
      publishLink.textContent = t("sendAnnouncement");
      list.before(publishLink);
    }

    toggle.addEventListener("click", () => {
      isOpen = !isOpen;
      panel.hidden = !isOpen;
      toggle.setAttribute("aria-expanded", String(isOpen));
      if (isOpen) {
        markAsRead();
        render();
      }
    });

    center.querySelector("[data-notification-close]").addEventListener("click", () => {
      isOpen = false;
      panel.hidden = true;
      toggle.setAttribute("aria-expanded", "false");
    });

    document.addEventListener("click", (event) => {
      if (isOpen && !center.contains(event.target)) {
        isOpen = false;
        panel.hidden = true;
        toggle.setAttribute("aria-expanded", "false");
      }
    });

    render();

    AppSupabase
      .channel(`notifications-${user.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notifications"
      }, (payload) => {
        const item = payload.new;
        if (item.user_id && item.user_id !== user.id) return;
        notifications = [item, ...notifications].slice(0, 30);
        if (isOpen) markAsRead();
        render();
        if (!isOpen && item.type === "announcement") {
          showToast(`${lang === "ar" ? "إعلان جديد" : "New announcement"}: ${item.title}`);
        }
      })
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          showToast(lang === "ar" ? "تعذر الاتصال بتحديثات الإشعارات المباشرة" : "Could not connect to live notifications", "error");
        }
      });
  };

  window.initPublicAnnouncementCenter = async function (initialAnnouncements) {
    const center = document.querySelector("[data-public-announcement-center]");
    if (!center || !window.AppSupabase) return;

    const toggle = center.querySelector("[data-public-announcement-toggle]");
    const panel = center.querySelector("[data-public-announcement-panel]");
    const count = center.querySelector("[data-public-announcement-count]");
    const list = center.querySelector("[data-public-announcement-list]");
    const readKey = "public-announcements-read-at";
    let announcements = initialAnnouncements;
    if (!Array.isArray(announcements)) {
      const { data, error } = await AppSupabase
        .from("announcements")
        .select("id,title,message,created_at")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) {
        showToast(error.message, "error");
        return;
      }
      announcements = data || [];
    }
    announcements = announcements.slice(0, 20);
    let isOpen = false;
    const latestTime = announcements.reduce(
      (latest, item) => Math.max(latest, Date.parse(item.created_at)),
      0
    );
    const storedReadTime = localStorage.getItem(readKey);
    let lastReadTime = storedReadTime ? Number(storedReadTime) : latestTime;
    if (!storedReadTime) localStorage.setItem(readKey, String(lastReadTime));

    const markAsRead = () => {
      lastReadTime = announcements.reduce(
        (latest, item) => Math.max(latest, Date.parse(item.created_at)),
        lastReadTime
      );
      localStorage.setItem(readKey, String(lastReadTime));
    };

    const render = () => {
      list.replaceChildren();
      if (!announcements.length) {
        const empty = document.createElement("p");
        empty.className = "notification-empty";
        empty.textContent = lang === "ar" ? "لا توجد إعلانات حاليًا." : "No announcements yet.";
        list.appendChild(empty);
      } else {
        announcements.forEach((item) => {
          const link = document.createElement("a");
          link.className = "notification-item-link";
          link.href = "index.html#announcements";
          const card = document.createElement("article");
          card.className = "notification-item";
          const heading = document.createElement("strong");
          heading.textContent = item.title;
          const message = document.createElement("p");
          message.textContent = item.message;
          const date = document.createElement("time");
          date.dateTime = item.created_at;
          date.textContent = new Date(item.created_at).toLocaleString(lang === "ar" ? "ar-EG" : "en");
          card.append(heading, message, date);
          link.appendChild(card);
          list.appendChild(link);
        });
      }

      const unreadCount = announcements.filter(
        (item) => Date.parse(item.created_at) > lastReadTime
      ).length;
      count.textContent = String(unreadCount);
      count.hidden = unreadCount === 0;
    };

    const announcementsLink = document.createElement("a");
    announcementsLink.className = "notification-announcements-link";
    announcementsLink.href = "index.html#announcements";
    announcementsLink.dataset.i18n = "viewAnnouncements";
    announcementsLink.textContent = t("viewAnnouncements");
    panel.querySelector(".notification-panel-head").after(announcementsLink);

    toggle.addEventListener("click", () => {
      isOpen = !isOpen;
      panel.hidden = !isOpen;
      toggle.setAttribute("aria-expanded", String(isOpen));
      if (isOpen) {
        markAsRead();
        render();
      }
    });

    center.querySelector("[data-public-announcement-close]").addEventListener("click", () => {
      isOpen = false;
      panel.hidden = true;
      toggle.setAttribute("aria-expanded", "false");
    });

    document.addEventListener("click", (event) => {
      if (isOpen && !center.contains(event.target)) {
        isOpen = false;
        panel.hidden = true;
        toggle.setAttribute("aria-expanded", "false");
      }
    });

    render();

    AppSupabase
      .channel("public-announcement-alerts")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "announcements"
      }, (payload) => {
        const item = payload.new;
        if (announcements.some((announcement) => announcement.id === item.id)) return;
        announcements = [item, ...announcements].slice(0, 20);
        if (isOpen) markAsRead();
        render();
        window.dispatchEvent(new CustomEvent("public-announcements-changed", {
          detail: announcements
        }));
        if (!isOpen) {
          showToast(`${lang === "ar" ? "إعلان جديد" : "New announcement"}: ${item.title}`);
        }
      })
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          showToast(lang === "ar" ? "تعذر الاتصال بتحديثات الإعلانات" : "Could not connect to announcement updates", "error");
        }
      });
  };

  function installSitewideAnnouncementButton() {
    const navActions = document.querySelector(".navbar .row-actions");
    if (
      !navActions ||
      navActions.querySelector("[data-notification-center], [data-public-announcement-center]")
    ) return;

    const center = document.createElement("div");
    center.className = "notification-center";
    center.dataset.publicAnnouncementCenter = "";
    center.innerHTML = `
      <button
        class="notification-button"
        type="button"
        data-public-announcement-toggle
        aria-expanded="false"
        aria-controls="publicAnnouncementPanel"
        aria-label="الإشعارات والإعلانات"
      >
        <span aria-hidden="true">🔔</span>
        <span data-i18n="notifications">${t("notifications")}</span>
        <span class="notification-count" data-public-announcement-count hidden>0</span>
      </button>
      <section class="notification-panel" id="publicAnnouncementPanel" data-public-announcement-panel hidden>
        <div class="notification-panel-head">
          <h2 data-i18n="announcements">${t("announcements")}</h2>
          <button class="notification-close" type="button" data-public-announcement-close aria-label="إغلاق">×</button>
        </div>
        <div class="notification-list" data-public-announcement-list></div>
      </section>
    `;

    const languageButton = navActions.querySelector("[data-lang-toggle]");
    navActions.insertBefore(center, languageButton || navActions.firstChild);
    initPublicAnnouncementCenter();
  }

  window.getPostLoginPath = async function (user) {
    if (!user || !window.AppSupabase) return "dashboard.html";
    const { data: profile, error } = await AppSupabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (error) {
      showToast(error.message, "error");
      return "dashboard.html";
    }
    return profile && ["admin", "super_admin"].includes(profile.role)
      ? "admin.html"
      : "dashboard.html";
  };

  async function updateAdminNavigation() {
    const nav = document.getElementById("navLinks");
    const path = window.location.pathname.toLowerCase();
    if (!nav || !window.AppSupabase || path.endsWith("/admin.html") || path === "admin.html") return;
    if (nav.querySelector('a[href="admin.html"]')) return;

    const { data: sessionData, error: sessionError } = await AppSupabase.auth.getSession();
    if (sessionError) {
      showToast(sessionError.message, "error");
      return;
    }
    if (!sessionData.session) return;

    const { data: profile, error } = await AppSupabase
      .from("profiles")
      .select("role")
      .eq("id", sessionData.session.user.id)
      .maybeSingle();
    if (error) {
      showToast(error.message, "error");
      return;
    }
    if (!profile || !["admin", "super_admin"].includes(profile.role)) return;

    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = "admin.html";
    link.dataset.i18n = "admin";
    link.textContent = t("admin");
    item.appendChild(link);
    nav.appendChild(item);
  }
})();