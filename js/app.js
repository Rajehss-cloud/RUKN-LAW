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
      accessCode: "رمز الدخول",
      welcome: "مرحبًا",
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
      accessCode: "Access Code",
      welcome: "Welcome",
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
      .select("role")
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
})();