/* Earth-path navigation for the work page. */
(() => {
  const experience = document.querySelector('#workExperience');
  const route = document.querySelector('#earthRoutePath');
  const earth = document.querySelector('#routeEarthMarker');
  const display = document.querySelector('.work-display');
  const title = document.querySelector('#panelTitle');
  const note = document.querySelector('#panelNote');
  const reset = document.querySelector('#resetWorkView');
  const labels = [...document.querySelectorAll('.route-label')];
  const resumeDownload = document.querySelector('#resumeDownload');
  const resumeUpload = document.querySelector('#resumeUpload');
  const resumeStatus = document.querySelector('#resumeStatus');
  const myWorkContent = document.querySelector('#myWorkContent');
  const workFilters = [...document.querySelectorAll('[data-work-filter]')];
  const workProjectCards = [...document.querySelectorAll('[data-work-project]')];
  const workDetails = [...document.querySelectorAll('[data-work-detail]')];
  const workDetailBack = document.querySelector('#workDetailBackGlobal');
  const workStackViewports = [...document.querySelectorAll('[data-stack-viewport]')];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  if (!experience || !route || !earth || !display || !title || !note || !reset || !labels.length) return;

  const routeLength = route.getTotalLength();
  let progress = 0;
  let frame = 0;
  let pointerLockUntil = 0;
  let uploadedResumeUrl = '';
  let currentResumeName = '白桦-简历.pdf';
  let workIndexScrollTop = 0;
  let activeWorkCard = null;

  function openResumeDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('lynn-portfolio-assets', 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains('resume')) {
          request.result.createObjectStore('resume');
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function readStoredResume() {
    const database = await openResumeDatabase();
    return new Promise((resolve, reject) => {
      const request = database.transaction('resume', 'readonly').objectStore('resume').get('current');
      request.onsuccess = () => {
        database.close();
        resolve(request.result);
      };
      request.onerror = () => {
        database.close();
        reject(request.error);
      };
    });
  }

  async function storeResume(file) {
    const database = await openResumeDatabase();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction('resume', 'readwrite');
      transaction.objectStore('resume').put({
        blob: file.slice(0, file.size, 'application/pdf'),
        name: file.name,
        updatedAt: Date.now()
      }, 'current');
      transaction.oncomplete = () => {
        database.close();
        resolve();
      };
      transaction.onerror = () => {
        database.close();
        reject(transaction.error);
      };
    });
  }

  function useUploadedResume(blob, name, restored = false) {
    if (uploadedResumeUrl) URL.revokeObjectURL(uploadedResumeUrl);
    uploadedResumeUrl = URL.createObjectURL(blob);
    resumeDownload.href = uploadedResumeUrl;
    currentResumeName = name || currentResumeName;
    resumeDownload.classList.remove('is-open');
    resumeStatus.textContent = `${restored ? 'LOCAL VERSION RESTORED' : 'LOCAL VERSION READY'} / ${currentResumeName}`;
  }

  async function restoreUploadedResume() {
    if (!resumeDownload || !resumeStatus || !('indexedDB' in window)) return;
    try {
      const storedResume = await readStoredResume();
      if (storedResume?.blob) useUploadedResume(storedResume.blob, storedResume.name, true);
    } catch {
      resumeStatus.textContent = 'DEFAULT VERSION / READY TO DOWNLOAD';
    }
  }

  function showWorkIndex({ restoreScroll = true, focusCard = true } = {}) {
    if (!myWorkContent) return;
    myWorkContent.classList.remove('is-detail');
    workDetails.forEach(detail => { detail.hidden = true; });
    if (workDetailBack) {
      workDetailBack.classList.remove('is-visible');
      workDetailBack.setAttribute('aria-hidden', 'true');
      workDetailBack.tabIndex = -1;
    }
    if (restoreScroll) {
      requestAnimationFrame(() => {
        display.scrollTop = workIndexScrollTop;
        if (focusCard && activeWorkCard) activeWorkCard.focus({ preventScroll: true });
      });
    }
  }

  function openWorkDetail(card) {
    if (!myWorkContent) return;
    const detail = workDetails.find(item => item.dataset.workDetail === card.dataset.workProject);
    if (!detail) return;
    workIndexScrollTop = display.scrollTop;
    activeWorkCard = card;
    workDetails.forEach(item => { item.hidden = item !== detail; });
    myWorkContent.classList.add('is-detail');
    if (workDetailBack) {
      workDetailBack.classList.add('is-visible');
      workDetailBack.setAttribute('aria-hidden', 'false');
      workDetailBack.tabIndex = 0;
    }
    requestAnimationFrame(() => {
      detail.querySelectorAll('[data-stack-viewport]').forEach(viewport => { viewport.scrollLeft = 0; });
      display.scrollTop = Math.max(0, myWorkContent.offsetTop - 20);
      workDetailBack?.focus({ preventScroll: true });
    });
  }

  function setWorkFilter(filter) {
    workFilters.forEach(button => {
      const isActive = button.dataset.workFilter === filter;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    });
    workProjectCards.forEach(card => {
      card.hidden = filter !== 'all' && card.dataset.workCategory !== filter;
    });
  }

  function placeEarth(value) {
    const point = route.getPointAtLength(routeLength * value);
    earth.setAttribute('transform', `translate(${point.x.toFixed(2)} ${point.y.toFixed(2)})`);
    progress = value;
  }

  function moveEarth(target) {
    cancelAnimationFrame(frame);
    if (reducedMotion.matches) {
      placeEarth(target);
      return;
    }

    const start = progress;
    const distance = Math.abs(target - start);
    const duration = 540 + distance * 360;
    const started = performance.now();

    function tick(now) {
      const elapsed = Math.min(1, (now - started) / duration);
      const eased = elapsed < .5
        ? 4 * elapsed ** 3
        : 1 - ((-2 * elapsed + 2) ** 3) / 2;
      placeEarth(start + (target - start) * eased);
      if (elapsed < 1) frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
  }

  function activate(label) {
    if (label.getAttribute('aria-pressed') === 'true') return;
    const target = Number(label.dataset.progress);
    const isEntering = !experience.classList.contains('is-exploring');
    if (isEntering) pointerLockUntil = performance.now() + 1000;
    labels.forEach(item => item.setAttribute('aria-pressed', String(item === label)));
    experience.classList.add('is-exploring');
    document.body.classList.add('is-work-exploring');
    experience.dataset.section = label.dataset.section;
    display.setAttribute('aria-hidden', 'false');
    reset.setAttribute('aria-hidden', 'false');
    reset.tabIndex = 0;
    title.textContent = label.dataset.title;
    note.textContent = label.dataset.note;
    if (label.dataset.section !== 'work') {
      showWorkIndex({ restoreScroll: false, focusCard: false });
    }
    display.scrollTop = 0;
    moveEarth(target);
  }

  function returnToInitialView() {
    labels.forEach(item => item.setAttribute('aria-pressed', 'false'));
    experience.classList.remove('is-exploring');
    document.body.classList.remove('is-work-exploring');
    delete experience.dataset.section;
    display.setAttribute('aria-hidden', 'true');
    reset.setAttribute('aria-hidden', 'true');
    reset.tabIndex = -1;
    reset.blur();
    showWorkIndex({ restoreScroll: false, focusCard: false });
    moveEarth(0);
  }

  labels.forEach(label => {
    label.addEventListener('pointerenter', event => {
      if (
        !experience.classList.contains('is-exploring') &&
        event.pointerType !== 'touch'
      ) moveEarth(Number(label.dataset.progress));
    });
    label.addEventListener('pointermove', () => {
      if (
        experience.classList.contains('is-exploring') &&
        performance.now() >= pointerLockUntil
      ) activate(label);
    });
    label.addEventListener('focus', () => {
      if (experience.classList.contains('is-exploring')) {
        activate(label);
      } else {
        moveEarth(Number(label.dataset.progress));
      }
    });
    label.addEventListener('click', () => activate(label));
  });
  reset.addEventListener('click', returnToInitialView);

  workFilters.forEach(button => {
    button.addEventListener('click', () => setWorkFilter(button.dataset.workFilter));
  });

  workProjectCards.forEach(card => {
    card.addEventListener('click', () => openWorkDetail(card));
  });

  workStackViewports.forEach(viewport => {
    let pointerId = null;
    let pointerStartX = 0;
    let scrollStartX = 0;
    let dragged = false;
    let lastDragEndedAt = 0;

    viewport.addEventListener('dragstart', event => event.preventDefault());
    viewport.addEventListener('pointerdown', event => {
      if (event.pointerType !== 'mouse' || event.button !== 0) return;
      if (event.target.closest('a')) return;
      pointerId = event.pointerId;
      pointerStartX = event.clientX;
      scrollStartX = viewport.scrollLeft;
      dragged = false;
      viewport.setPointerCapture(pointerId);
      viewport.classList.add('is-dragging');
    });

    viewport.addEventListener('pointermove', event => {
      if (event.pointerId !== pointerId) return;
      const delta = event.clientX - pointerStartX;
      if (Math.abs(delta) > 5) dragged = true;
      viewport.scrollLeft = scrollStartX - delta;
      if (dragged) event.preventDefault();
    });

    const endDrag = event => {
      if (event.pointerId !== pointerId) return;
      if (viewport.hasPointerCapture(pointerId)) viewport.releasePointerCapture(pointerId);
      if (dragged) lastDragEndedAt = performance.now();
      pointerId = null;
      viewport.classList.remove('is-dragging');
    };

    viewport.addEventListener('pointerup', endDrag);
    viewport.addEventListener('pointercancel', endDrag);
    viewport.addEventListener('click', event => {
      if (performance.now() - lastDragEndedAt < 240) {
        event.preventDefault();
        event.stopPropagation();
      }
    }, true);
    viewport.addEventListener('keydown', event => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      viewport.scrollBy({
        left: (event.key === 'ArrowRight' ? 1 : -1) * viewport.clientWidth * .72,
        behavior: reducedMotion.matches ? 'auto' : 'smooth'
      });
    });
  });

  workDetailBack?.addEventListener('click', () => showWorkIndex());

  addEventListener('keydown', event => {
    if (
      event.key === 'Escape' &&
      myWorkContent?.classList.contains('is-detail') &&
      experience.dataset.section === 'work'
    ) {
      showWorkIndex();
    }
  });

  if (resumeDownload && resumeUpload && resumeStatus) {
    resumeDownload.addEventListener('click', () => {
      // Keep the native, synchronous navigation; Safari and Edge can block
      // programmatic downloads after an asynchronous fetch loses user activation.
      resumeDownload.classList.add('is-open');
      resumeStatus.textContent = `OPENING RESUME / ${currentResumeName}`;
    });

    resumeUpload.addEventListener('change', async () => {
      const [file] = resumeUpload.files;
      if (!file) return;
      const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
      if (!isPdf) {
        resumeStatus.textContent = 'UPLOAD FAILED / PDF FILES ONLY';
        resumeUpload.value = '';
        return;
      }
      if (file.size > 25 * 1024 * 1024) {
        resumeStatus.textContent = 'UPLOAD FAILED / PDF MUST BE UNDER 25 MB';
        resumeUpload.value = '';
        return;
      }

      useUploadedResume(file, file.name);
      try {
        await storeResume(file);
      } catch {
        resumeStatus.textContent = `SESSION VERSION READY / ${file.name}`;
      }
      resumeUpload.value = '';
    });

    restoreUploadedResume();
  }

  placeEarth(0);
})();
