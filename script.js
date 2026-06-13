(function () {
  function ensureErrorContainer(fieldEl) {
    // Create an error element directly below the field if not present
    const existing = fieldEl.parentElement && fieldEl.parentElement.querySelector('.field-error');
    if (existing) return existing;

    const error = document.createElement('div');
    error.className = 'field-error';
    error.setAttribute('role', 'alert');
    error.style.display = 'none';

    // Insert right after the field wrapper/element
    const parent = fieldEl.closest('.field') || fieldEl.parentElement;
    if (!parent) return null;

    parent.appendChild(error);
    return error;
  }

  function setFieldError(fieldEl, message) {
    if (!fieldEl) return;
    const input = fieldEl;
    input.classList.add('input--invalid');
    const errorEl = ensureErrorContainer(input);
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.style.display = 'block';
    }
  }

  function clearFieldError(fieldEl) {
    if (!fieldEl) return;
    fieldEl.classList.remove('input--invalid');
    const errorEl = fieldEl.closest('.field')?.querySelector('.field-error');
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.style.display = 'none';
    }
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
  }

  function isValidFullName(name) {
    const v = String(name || '').trim();
    if (v.length < 3) return false;
    // Letters and spaces only; disallow digits/special chars
    // Also prevent leading/trailing multiple spaces by normalizing in the check
    const normalized = v.replace(/\s+/g, ' ');
    return /^[A-Za-z ]+$/.test(normalized);
  }

  function getDigitsOnly(v) {
    return String(v || '').replace(/\D/g, '');
  }

  // Mobile: allow digits only, and must be exactly 10 digits.
  // If user types any non-digit characters, it will fail.
  function isValidMobile10(value) {
    const raw = String(value || '');
    if (!/^[0-9]*$/.test(raw.trim())) return false;
    const digits = getDigitsOnly(raw);
    return digits.length === 10;
  }


  function parseExperienceToNonNegativeNumber(exp) {
    const v = String(exp || '').trim();
    if (!v) return { ok: true, value: null };
    if (!/^\d+(\.\d+)?$/.test(v)) return { ok: false, value: null };
    const num = Number(v);
    if (Number.isNaN(num) || num < 0) return { ok: false, value: null };
    return { ok: true, value: num };
  }

  function validateFileUpload(fileInput) {
    const file = fileInput?.files?.[0];
    if (!file) {
      return { ok: false, message: 'Please upload a valid resume (PDF, DOC, DOCX, max 5MB).' };
    }

    const maxBytes = 5 * 1024 * 1024;
    const sizeOk = file.size <= maxBytes;

    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    const ext = (file.name || '').split('.').pop()?.toLowerCase();
    const extOk = ['pdf', 'doc', 'docx'].includes(ext);

    const typeOk = allowed.includes(file.type) || extOk;

    if (!sizeOk || !typeOk) {
      return { ok: false, message: 'Please upload a valid resume (PDF, DOC, DOCX, max 5MB).' };
    }

    return { ok: true, message: '' };
  }

  function initFormValidation() {
    const forms = document.querySelectorAll('form');
    if (!forms || !forms.length) return;

    forms.forEach((form) => {
      form.addEventListener('submit', (e) => {
        // only validate the careers forms we built (avoid touching navbar/contact etc.)
        const isCareerApply = form.id && (form.id === 'apply-internship' || form.id === 'apply-job');
        if (!isCareerApply) return;

        let ok = true;

        // clear existing errors
        form.querySelectorAll('.input--invalid').forEach((el) => el.classList.remove('input--invalid'));
        form.querySelectorAll('.field-error').forEach((el) => {
          el.textContent = '';
          el.style.display = 'none';
        });

        const fullName = form.querySelector('input[name*="full_name" i]');
        const email = form.querySelector('input[name*="email" i]');
        const mobile = form.querySelector('input[type="tel"][name*="mobile" i]');
        const college = form.querySelector('input[name*="college" i]');
        const degreeSelect = form.querySelector('select[name*="degree" i]');
        const roleOrCourseSelect = form.querySelector('select[name*="preferred" i]');
        const resume = form.querySelector('input[type="file"][name*="resume" i]');
        const experience = form.querySelector('input[name*="experience" i]');

        // Full Name
        if (!fullName || !isValidFullName(fullName.value)) {
          ok = false;
          setFieldError(fullName, 'Please enter a valid full name.');
        }

        // Email
        if (!email || !isValidEmail(email.value)) {
          ok = false;
          setFieldError(email, 'Please enter a valid email address.');
        }

        // Mobile (exactly 10 digits)
        if (!mobile || !isValidMobile10(mobile.value)) {
          ok = false;
          setFieldError(mobile, 'Please enter a valid 10-digit mobile number.');
        }

        // College
        if (!college || String(college.value || '').trim().length < 3) {
          ok = false;
          setFieldError(college, 'Please enter your college name.');
        }

        // Degree placeholder not accepted
        if (!degreeSelect || !degreeSelect.value) {
          ok = false;
          setFieldError(degreeSelect, 'Please select your degree.');
        }

        // Preferred role/course placeholder not accepted
        if (!roleOrCourseSelect || !roleOrCourseSelect.value) {
          ok = false;
          setFieldError(roleOrCourseSelect, 'Please select your preferred role.');
        }

        // Resume upload validation
        const fileValidation = validateFileUpload(resume);
        if (!fileValidation.ok) {
          ok = false;
          setFieldError(resume, fileValidation.message);
        }

        // Experience (optional)
        if (experience) {
          const parsed = parseExperienceToNonNegativeNumber(experience.value);
          if (!parsed.ok) {
            ok = false;
            setFieldError(experience, 'Experience must be a non-negative number.');
          }
        }

        if (!ok) {
          e.preventDefault();
          e.stopPropagation();

          // Smoothly focus first invalid field
          const firstInvalid = form.querySelector('.input--invalid');
          if (firstInvalid && typeof firstInvalid.focus === 'function') firstInvalid.focus({ preventScroll: true });
          return;
        }

        // Success message
        const successMsgId = form.id ? `${form.id}-success` : 'career-success';
        let successEl = document.getElementById(successMsgId);
        if (!successEl) {
          successEl = document.createElement('div');
          successEl.id = successMsgId;
          successEl.className = 'form-success-message';
          successEl.setAttribute('role', 'status');
          form.appendChild(successEl);
        }

        successEl.textContent = 'Application submitted successfully. Our team will review your profile and contact you if a suitable opportunity is available.';
        successEl.style.display = 'block';
      });

      // Remove error automatically when user edits valid data
      form.addEventListener('input', (e) => {
        const t = e.target;
        if (!t) return;
        if (t.classList.contains('input--invalid')) {
          // Re-run minimal checks for the edited field
          // Clear if the field becomes valid.
          const name = (t.name || '').toLowerCase();
          let valid = false;

          if (t.type === 'text' && name.includes('full_name')) valid = isValidFullName(t.value);
          else if (t.type === 'email') valid = isValidEmail(t.value);
          else if (t.type === 'tel') valid = isValidMobile10(t.value);
          else if (t.type === 'text' && name.includes('college')) valid = String(t.value || '').trim().length >= 3;
          else if (t.tagName === 'SELECT') valid = !!t.value;
          else if (t.type === 'file') valid = t.files && t.files.length > 0;
          else if (t.type === 'text' && name.includes('experience')) valid = parseExperienceToNonNegativeNumber(t.value).ok;
          else valid = true;

          if (valid) clearFieldError(t);
        }
      });
    });
  }


  async function includeComponents() {

    const navbarHost = document.querySelector('[data-include="navbar"]');
    const footerHost = document.querySelector('[data-include="footer"]');

    const tasks = [];
    if (navbarHost) {
      tasks.push(
        fetch('./navbar.html')
          .then((r) => (r.ok ? r.text() : Promise.reject(new Error('Failed to load navbar.html'))))
          .then((html) => {
            navbarHost.innerHTML = html;
          })
      );
    }

    if (footerHost) {
      tasks.push(
        fetch('./footer.html')
          .then((r) => (r.ok ? r.text() : Promise.reject(new Error('Failed to load footer.html'))))
          .then((html) => {
            footerHost.innerHTML = html;
          })
      );
    }

    if (tasks.length) await Promise.all(tasks);
  }

  function initMobileNav() {
    const navToggle = document.querySelector('.nav-toggle');
    const nav = document.querySelector('.nav');

    if (navToggle && nav) {
      navToggle.addEventListener('click', () => {
        const isOpen = nav.classList.toggle('open');
        navToggle.setAttribute('aria-expanded', String(isOpen));
      });

      // Close on link click (mobile)
      document.querySelectorAll('.nav-links a').forEach((a) => {
        a.addEventListener('click', () => {
          if (nav.classList.contains('open')) {
            nav.classList.remove('open');
            navToggle.setAttribute('aria-expanded', 'false');
          }
        });
      });
    }
  }

  function initFooterYear() {
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  }

  function initFadeInOnScroll() {
    const els = document.querySelectorAll('[data-animate-on-scroll]');
    if (!els.length) return;

    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      els.forEach((el) => el.classList.add('in-view'));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
          }
        });
      },
      { threshold: 0.15 }
    );

    els.forEach((el) => io.observe(el));
  }

  function initApplyModal() {
    const modal = document.getElementById('apply-modal');
    if (!modal) return;

    const openBtns = document.querySelectorAll('[data-open-apply]');
    const closeBtns = modal.querySelectorAll('[data-close-apply]');
    const backdrop = modal.querySelector('[data-close-apply]');
    const panes = modal.querySelectorAll('[data-apply-pane]');

    function closeModal() {
      modal.setAttribute('aria-hidden', 'true');
      modal.dataset.openPane = '';
      panes.forEach((p) => p.classList.remove('is-active'));
    }

    function openModal(pane) {
      if (!pane) return;
      modal.setAttribute('aria-hidden', 'false');
      modal.dataset.openPane = pane;
      panes.forEach((p) => p.classList.toggle('is-active', p.getAttribute('data-apply-pane') === pane));

      const activePane = modal.querySelector(`[data-apply-pane="${pane}"]`);
      if (activePane) {
        const firstInput = activePane.querySelector('input, select, textarea, button');
        if (firstInput && typeof firstInput.focus === 'function') {
          firstInput.focus({ preventScroll: true });
        }
      }
    }

    openBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const pane = btn.getAttribute('data-open-apply');
        openModal(pane);
      });
    });

    closeBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        closeModal();
      });
    });

    // Click outside panel closes (backdrop handles this, but keep defensive)
    if (backdrop) {
      backdrop.addEventListener('click', (e) => {
        e.preventDefault();
        closeModal();
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') {
        closeModal();
      }
    });

    // Start closed
    closeModal();
  }

  function updateNavUnderlineImmediate() {
    const underline = document.querySelector('.nav-underline');
    if (!underline) return;

    const activeLink =
      document.querySelector('.nav-links a.nav-link[data-active="true"]') ||
      document.querySelector('.nav-links a.nav-link[data-nav="home"]');
    if (!activeLink) return;

    const navLinks = underline.closest('.nav-links-wrap');
    const wrap = navLinks || underline.parentElement;
    const containerRect = wrap.getBoundingClientRect();
    const linkRect = activeLink.getBoundingClientRect();

    const left = linkRect.left - containerRect.left;
    underline.style.width = `${linkRect.width}px`;
    underline.style.transform = `translateX(${left}px)`;
  }


  function setActiveNavByUrl() {
    const pathname = window.location.pathname;

    const links = document.querySelectorAll('.nav-links a.nav-link');
    if (!links.length) return;

    let activeData = 'home';
    links.forEach((a) => {
      const href = a.getAttribute('href') || '';
      if (href.includes('index.html') && pathname.endsWith('index.html')) activeData = 'home';
      else if (href.includes('services.html') && pathname.endsWith('services.html')) activeData = 'services';
      else if (href.includes('career.html') && pathname.endsWith('career.html')) activeData = 'career';
      else if (href.includes('projects.html') && pathname.endsWith('projects.html')) activeData = 'projects';
      else if (href.includes('about-us.html') && pathname.endsWith('about-us.html')) activeData = 'about';
      else if (href.includes('contact.html') && pathname.endsWith('contact.html')) activeData = 'contact';
      else if (pathname.endsWith('') && a.getAttribute('data-nav') === 'home') activeData = 'home';
    });

    links.forEach((a) => {
      a.dataset.active = a.dataset.nav === activeData ? 'true' : 'false';
    });
  }

  function initSmoothScroll() {
    // Only smooth-scroll same-page anchors (href starts with #)
    // Skip if the hash target doesn't exist on this page.
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener('click', (e) => {
        const href = a.getAttribute('href');
        if (!href || href === '#') return;
        const target = document.querySelector(href);
        if (!target) return;
        e.preventDefault();
        const y = target.getBoundingClientRect().top + window.pageYOffset - 78;
        window.scrollTo({ top: y, behavior: 'smooth' });
      });
    });
  }

  function initNavUnderline() {
    const links = document.querySelectorAll('.nav-links a.nav-link');
    const underline = document.querySelector('.nav-underline');
    if (!underline || !links.length) return;

    setActiveNavByUrl();
    updateNavUnderlineImmediate();

    links.forEach((a) => {
      a.addEventListener('mouseenter', () => {
        // Only preview underline on hover if it's not the active page
        // (keep glide for real navigation only)
        // We’ll still animate on click/page load via setActiveNavByUrl.
      });

      a.addEventListener('click', () => {
        links.forEach((x) => (x.dataset.active = 'false'));
        a.dataset.active = 'true';
        // animate underline before navigation, so it glides from old -> new
        updateNavUnderlineImmediate();
      });

    });

    window.addEventListener('resize', () => {
      updateNavUnderlineImmediate();
    });
  }

  // Boot
  includeComponents()

    .catch(() => {
      // If running from an environment that blocks fetch for file://,
      // the page will still render without the shared components.
    })
    .finally(() => {
      initMobileNav();
      initFooterYear();
      initSmoothScroll();
      initNavUnderline();
      initFadeInOnScroll();
      initApplyModal();
    });



})();


