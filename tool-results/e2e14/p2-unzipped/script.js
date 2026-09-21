// SIVAR — سلوك الموقع الثابت (بدون أي مكتبات)
(function () {
  'use strict'

  // قائمة الهاتف
  document.querySelectorAll('[data-nav-toggle]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var nav = document.getElementById('site-nav')
      if (!nav) return
      var open = nav.classList.toggle('open')
      btn.setAttribute('aria-expanded', open ? 'true' : 'false')
    })
  })

  // النماذج: نجاح أو إعادة توجيه (الدخول إلى لوحة التحكم)
  document.querySelectorAll('form.pt-form').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault()
      var redirect = form.getAttribute('data-redirect')
      if (redirect) {
        window.location.href = redirect
        return
      }
      var success = form.getAttribute('data-success') || 'تم الإرسال بنجاح'
      var alertEl = document.createElement('div')
      alertEl.className = 'pt-alert pt-alert--success'
      alertEl.setAttribute('role', 'status')
      alertEl.textContent = '✓ ' + success
      form.replaceWith(alertEl)
    })
  })

  // ===== الجداول: بحث الجدول + بحث التروستة (دمج AND) + ترقيم الصفحات =====
  var topbarSearch = document.querySelector('[data-topbar-search]')
  var allTables = Array.prototype.slice.call(document.querySelectorAll('.pt-table'))

  function refreshTable(table) {
    if (!table || !table.id) return
    var own = document.querySelector('[data-table-search="' + table.id + '"]')
    var q1 = own ? own.value.trim().toLowerCase() : ''
    var q2 = topbarSearch ? topbarSearch.value.trim().toLowerCase() : ''
    var rows = Array.prototype.slice.call(table.querySelectorAll('tbody tr'))
    var matched = []
    rows.forEach(function (row) {
      var text = row.textContent.toLowerCase()
      var ok = (!q1 || text.indexOf(q1) !== -1) && (!q2 || text.indexOf(q2) !== -1)
      row.setAttribute('data-match', ok ? '1' : '0')
      if (ok) matched.push(row)
    })
    var counter = document.getElementById(table.id + '-count')
    if (counter) counter.textContent = 'عرض ' + matched.length + ' من ' + rows.length + ' صف'
    var card = table.closest('.blk-table')
    var pager = card ? card.querySelector('[data-pager]') : null
    if (!pager) {
      rows.forEach(function (row) {
        row.style.display = row.getAttribute('data-match') === '1' ? '' : 'none'
      })
      return
    }
    var pageSize = parseInt(pager.getAttribute('data-page-size') || '5', 10) || 5
    var pages = Math.max(1, Math.ceil(matched.length / pageSize))
    var current = parseInt(pager.getAttribute('data-current') || '1', 10) || 1
    if (current > pages) current = pages
    if (current < 1) current = 1
    pager.setAttribute('data-current', String(current))
    if (matched.length <= pageSize) {
      pager.hidden = true
      rows.forEach(function (row) {
        row.style.display = row.getAttribute('data-match') === '1' ? '' : 'none'
      })
      return
    }
    pager.hidden = false
    matched.forEach(function (row, i) {
      row.style.display = Math.floor(i / pageSize) + 1 === current ? '' : 'none'
    })
    var pageCount = pager.querySelector('.blk-table__pager-count')
    if (pageCount) pageCount.textContent = 'صفحة ' + current + ' من ' + pages
    var prevBtn = pager.querySelector('[data-page="prev"]')
    var nextBtn = pager.querySelector('[data-page="next"]')
    if (prevBtn) prevBtn.disabled = current <= 1
    if (nextBtn) nextBtn.disabled = current >= pages
  }

  if (topbarSearch) {
    topbarSearch.addEventListener('input', function () {
      allTables.forEach(refreshTable)
    })
  }
  document.querySelectorAll('[data-table-search]').forEach(function (input) {
    input.addEventListener('input', function () {
      refreshTable(document.getElementById(input.getAttribute('data-table-search')))
    })
  })
  document.querySelectorAll('[data-pager]').forEach(function (pager) {
    pager.querySelectorAll('[data-page]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var dir = btn.getAttribute('data-page') === 'next' ? 1 : -1
        var current = parseInt(pager.getAttribute('data-current') || '1', 10) || 1
        pager.setAttribute('data-current', String(current + dir))
        refreshTable(document.getElementById(pager.getAttribute('data-pager')))
      })
    })
  })
  // الحالة الأولى: طبّق البحث والترقيم على كل الجداول
  allTables.forEach(refreshTable)

  // مفاتيح الإعدادات
  document.querySelectorAll('[data-switch]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var on = btn.classList.toggle('on')
      btn.setAttribute('aria-checked', on ? 'true' : 'false')
    })
  })

  // نموذج جمع البريد في البطل
  document.querySelectorAll('form.pt-lead-form').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault()
      var alertEl = document.createElement('div')
      alertEl.className = 'pt-alert pt-alert--success'
      alertEl.setAttribute('role', 'status')
      alertEl.textContent = 'تم تسجيل بريدك بنجاح ✓ شكراً لاهتمامك!'
      form.replaceWith(alertEl)
    })
  })

  // زر تشغيل الفيديو: يتبدّل تشغيل/إيقاف + موجة صوت متحركة
  document.querySelectorAll('.pt-play').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var playing = btn.classList.toggle('playing')
      btn.setAttribute('aria-pressed', playing ? 'true' : 'false')
      btn.setAttribute('aria-label', playing ? 'إيقاف الفيديو' : 'تشغيل الفيديو')
      var stage = btn.closest('.pt-video')
      if (stage) stage.classList.toggle('playing', playing)
    })
  })

  // ===== قوائم التروستة المنسدلة (الإشعارات + قائمة المستخدم) =====
  function closeMenu(menu) {
    menu.classList.remove('open')
    var btn = document.querySelector('[data-menu-toggle="' + menu.id + '"]')
    if (btn) btn.setAttribute('aria-expanded', 'false')
  }
  document.querySelectorAll('[data-menu-toggle]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation()
      var menu = document.getElementById(btn.getAttribute('data-menu-toggle'))
      if (!menu) return
      var willOpen = !menu.classList.contains('open')
      document.querySelectorAll('.pt-dropdown.open').forEach(function (other) {
        if (other !== menu) closeMenu(other)
      })
      menu.classList.toggle('open', willOpen)
      btn.setAttribute('aria-expanded', willOpen ? 'true' : 'false')
    })
  })
  document.addEventListener('click', function (e) {
    document.querySelectorAll('.pt-dropdown.open').forEach(function (menu) {
      if (menu.contains(e.target)) return
      var btn = document.querySelector('[data-menu-toggle="' + menu.id + '"]')
      if (btn && btn.contains(e.target)) return
      closeMenu(menu)
    })
  })
  document.querySelectorAll('[data-read-all]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation()
      var dot = document.getElementById(btn.getAttribute('data-read-all'))
      if (dot) dot.hidden = true
    })
  })

  // ===== المهام: تبديل الإنجاز + تحديث التقدّم والعداد داخل نفس البطاقة =====
  document.querySelectorAll('[data-task]').forEach(function (box) {
    box.addEventListener('click', function () {
      var on = box.classList.toggle('on')
      box.setAttribute('aria-checked', on ? 'true' : 'false')
      var item = box.closest('.blk-tasks__item')
      if (item) item.classList.toggle('done', on)
      var card = box.closest('.blk-tasks')
      if (!card) return
      var boxes = card.querySelectorAll('[data-task]')
      var done = 0
      boxes.forEach(function (b) {
        if (b.classList.contains('on')) done++
      })
      var pct = boxes.length ? Math.round((done / boxes.length) * 100) : 0
      var fill = card.querySelector('[data-tasks-progress]')
      if (fill) fill.style.width = pct + '%'
      var count = card.querySelector('[data-tasks-count]')
      if (count) count.textContent = done + ' من ' + boxes.length + ' منجزة'
      var bar = card.querySelector('[data-tasks-bar]')
      if (bar) bar.setAttribute('aria-valuenow', String(pct))
    })
  })

  // ===== زر العودة للخلف (الصفحات غير الرئيسية) =====
  document.querySelectorAll('[data-back]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var home = btn.getAttribute('data-home')
      if (history.length > 1 && document.referrer && document.referrer.indexOf(location.origin) === 0) {
        history.back()
      } else if (home) {
        window.location.href = home
      }
    })
  })

  // ظهور الأقسام عند التمرير
  var revealEls = document.querySelectorAll('.pt-reveal')
  if ('IntersectionObserver' in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('pt-in')
          io.unobserve(entry.target)
        }
      })
    }, { threshold: 0.12, rootMargin: '0px 0px -40px' })
    revealEls.forEach(function (el) { io.observe(el) })
  } else {
    revealEls.forEach(function (el) { el.classList.add('pt-in') })
  }

  // ===== تلميحات الرسوم البيانية (data-tip) — معالج مفوَّض واحد =====
  var tipEl = null
  function ensureTip() {
    if (!tipEl) {
      tipEl = document.createElement('div')
      tipEl.className = 'pt-tip'
      tipEl.setAttribute('role', 'tooltip')
      document.body.appendChild(tipEl)
    }
    return tipEl
  }
  function hideTip() {
    if (tipEl) tipEl.classList.remove('show')
  }
  function placeTip(x, y) {
    var t = ensureTip()
    var w = t.offsetWidth
    var h = t.offsetHeight
    var vw = window.innerWidth
    var vh = window.innerHeight
    var left = x + 14
    if (left + w > vw - 8) left = x - w - 14
    if (left < 8) left = Math.max(8, Math.min(x + 14, vw - w - 8))
    var top = y - h - 12
    if (top < 8) top = y + 20
    if (top + h > vh - 8) top = Math.max(8, vh - h - 8)
    t.style.left = left + 'px'
    t.style.top = top + 'px'
  }
  function showTipFor(el, x, y) {
    var text = el.getAttribute('data-tip')
    if (!text) { hideTip(); return }
    var t = ensureTip()
    t.textContent = text
    t.classList.add('show')
    placeTip(x, y)
  }
  document.addEventListener('mousemove', function (e) {
    var el = e.target && e.target.closest ? e.target.closest('[data-tip]') : null
    if (el) showTipFor(el, e.clientX, e.clientY)
    else hideTip()
  })
  document.addEventListener('mouseleave', hideTip)
  document.addEventListener('focusin', function (e) {
    var el = e.target && e.target.closest ? e.target.closest('[data-tip]') : null
    if (!el) return
    var r = el.getBoundingClientRect()
    showTipFor(el, r.left + r.width / 2, r.top)
  })
  document.addEventListener('focusout', hideTip)

  // زر العودة إلى الأعلى (صفحات الموقع فقط)
  var topBtn = document.querySelector('.pt-top')
  if (topBtn) {
    var syncTop = function () {
      var y = window.scrollY || document.documentElement.scrollTop || 0
      topBtn.classList.toggle('pt-top--show', y > 400)
    }
    window.addEventListener('scroll', syncTop, { passive: true })
    syncTop()
    topBtn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    })
  }
})()
