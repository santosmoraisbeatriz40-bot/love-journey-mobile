(() => {
  const dialog = document.getElementById('new-entry-dialog');
  const form = document.getElementById('new-entry-form');
  const entriesGrid = document.querySelector('.entries-grid');
  const filterButtons = document.querySelectorAll('.filter-group .tag-button');
  const photoInput = document.getElementById('entry-photo');
  const photoPreview = document.getElementById('entry-photo-preview');
  const formMessage = document.getElementById('entry-form-message');
  const dateInput = document.getElementById('entry-date');
  const modal = document.createElement('dialog');
  modal.className = 'diary-detail-dialog';
  modal.setAttribute('aria-labelledby', 'diary-detail-title');
  modal.innerHTML = '<form method="dialog" class="diary-detail-card"><header><div><p class="diary-detail-kicker">DIÁRIO DO CASAL</p><h2 id="diary-detail-title"></h2></div><button type="button" data-close-detail aria-label="Fechar">×</button></header><div class="diary-detail-content"></div><footer><button type="button" data-close-detail>Fechar</button></footer></form>';
  document.body.append(modal);
  const detailTitle = modal.querySelector('h2');
  const detailContent = modal.querySelector('.diary-detail-content');
  const storageKey = 'love-journey-diary-entries';
  const categoryDetails = {
    'Reflexões': { icon: 'fa-comment-dots', theme: 'theme-purple' },
    'Sonhos': { icon: 'fa-moon', theme: 'theme-teal' },
    'Desabafos': { icon: 'fa-comment', theme: 'theme-yellow' },
    'Gratidão': { icon: 'fa-hands-praying', theme: 'theme-pink' }
  };

  if (!dialog || !form || !entriesGrid) return;

  const normalize = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const localDateKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  const getEntryCategory = (entry) => {
    const title = entry.querySelector('.item-title')?.textContent || '';
    const normalizedTitle = normalize(title);
    return Object.keys(categoryDetails).find((category) => normalizedTitle.includes(normalize(category).slice(0, 5))) || '';
  };

  const applyFilter = (category) => {
    entriesGrid.querySelectorAll('.entry-item').forEach((entry) => {
      entry.hidden = category !== 'Todos' && normalize(getEntryCategory(entry)) !== normalize(category);
    });
    filterButtons.forEach((button) => {
      button.classList.toggle('active', normalize(button.textContent.trim()) === normalize(category));
    });
  };

  let editingEntryId = null;

  const showDetail = (title, content) => {
    detailTitle.textContent = title;
    detailContent.replaceChildren();
    if (typeof content === 'string') detailContent.innerHTML = content;
    else detailContent.append(content);
    modal.showModal();
  };

  const openEntryDialog = (date = new Date()) => {
    const selectedDate = date instanceof Date ? localDateKey(date) : date;
    dialog.showModal();
    if (dateInput) dateInput.value = selectedDate;
    document.getElementById('entry-category').focus();
  };

  const buildEntry = ({ id, category, content, date, dateKey, photo }) => {
    const details = categoryDetails[category] || categoryDetails['Reflexões'];
    const article = document.createElement('article');
    article.className = `entry-item ${details.theme}`;
    article.dataset.userEntry = 'true';
    article.dataset.entryId = id || '';

    const top = document.createElement('div');
    top.className = 'entry-top';
    const heading = document.createElement('h4');
    heading.className = 'item-title';
    const icon = document.createElement('i');
    icon.className = `fa-solid ${details.icon}`;
    icon.setAttribute('aria-hidden', 'true');
    heading.append(icon, document.createTextNode(` ${category}`));
    const heart = document.createElement('span');
    heart.className = 'item-heart';
    heart.innerHTML = '<i class="fa-solid fa-heart" aria-hidden="true"></i>';
    top.append(heading, heart);

    const text = document.createElement('p');
    text.className = 'item-text';
    text.textContent = content;
    const children = [top, text];
    if (photo) {
      const image = document.createElement('img');
      image.src = photo;
      image.alt = `Foto do registro: ${category}`;
      children.push(image);
    }
    const dateLabel = document.createElement('span');
    dateLabel.className = 'item-date';
    dateLabel.textContent = date || (dateKey ? new Intl.DateTimeFormat('pt-BR').format(new Date(`${dateKey}T12:00:00`)) : '');
    article.append(...children, dateLabel);
    if (article.dataset.entryId) {
      const actions = document.createElement('div');
      actions.className = 'entry-actions';
      actions.innerHTML = '<button type="button" data-edit-entry aria-label="Editar registro">Editar</button><button type="button" data-delete-entry aria-label="Excluir registro">Excluir</button>';
      article.append(actions);
    }
    return article;
  };

  const compressPhoto = async (file) => {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.82));
    if (!blob) throw new Error('Não foi possível processar esta foto.');
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Não foi possível ler esta foto.'));
      reader.readAsDataURL(blob);
    });
  };

  const loadSavedEntries = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
      saved.forEach((entry) => {
        if (!entry.id) entry.id = `entry-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        entriesGrid.prepend(buildEntry(entry));
      });
      localStorage.setItem(storageKey, JSON.stringify(saved));
    } catch (error) {
      console.warn('Não foi possível carregar os registros salvos.', error);
    }
  };

  document.getElementById('btn-new-entry')?.addEventListener('click', () => openEntryDialog());

  modal.querySelectorAll('[data-close-detail]').forEach((button) => button.addEventListener('click', () => modal.close()));
  modal.addEventListener('click', (event) => { if (event.target === modal) modal.close(); });

  document.addEventListener('click', (event) => {
    const edit = event.target.closest('[data-edit-entry]');
    if (edit) {
      const article = edit.closest('.entry-item');
      const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
      const entry = saved.find((item) => item.id === article.dataset.entryId);
      if (!entry) return;
      editingEntryId = entry.id;
      form.elements.category.value = entry.category;
      form.elements.content.value = entry.content;
      if (dateInput) dateInput.value = entry.dateKey || localDateKey();
      if (entry.photo) { photoPreview.src = entry.photo; photoPreview.hidden = false; }
      form.querySelector('[type="submit"]').textContent = 'Salvar alterações';
      formMessage.textContent = '';
      openEntryDialog(dateInput?.value || new Date());
      return;
    }
    const remove = event.target.closest('[data-delete-entry]');
    if (remove) {
      const article = remove.closest('.entry-item');
      if (!window.confirm('Excluir este registro do diário?')) return;
      const saved = JSON.parse(localStorage.getItem(storageKey) || '[]').filter((entry) => entry.id !== article.dataset.entryId);
      localStorage.setItem(storageKey, JSON.stringify(saved));
      entriesGrid.querySelector(`[data-entry-id="${CSS.escape(article.dataset.entryId)}"]`)?.remove();
      article.remove();
      renderCalendar();
      return;
    }
    const allMoments = event.target.closest('[data-show-moments]');
    if (allMoments) {
      const cards = [...document.querySelectorAll('.moment-item')];
      const list = document.createElement('div'); list.className = 'diary-detail-list';
      cards.forEach((card) => list.append(card.cloneNode(true)));
      showDetail('Todos os momentos', list); return;
    }
    const allEntries = event.target.closest('[data-show-entries]');
    if (allEntries) {
      const cards = [...entriesGrid.querySelectorAll('.entry-item')];
      const list = document.createElement('div'); list.className = 'diary-detail-list';
      cards.forEach((card) => list.append(card.cloneNode(true)));
      showDetail('Todos os registros', list); return;
    }
    const shortcut = event.target.closest('[data-shortcut]');
    if (shortcut) {
      event.preventDefault();
      if (shortcut.dataset.shortcut === 'moments') document.querySelector('.moments-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (shortcut.dataset.shortcut === 'memories') document.querySelector('[data-show-moments]')?.click();
      if (shortcut.dataset.shortcut === 'calendar') document.querySelector('.calendar-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (shortcut.dataset.shortcut === 'photo') { openEntryDialog(); photoInput.click(); }
      return;
    }
    const day = event.target.closest('[data-calendar-date]');
    if (day) {
      const dateKey = day.dataset.calendarDate;
      const readable = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date(`${dateKey}T12:00:00`));
      const sameDay = JSON.parse(localStorage.getItem(storageKey) || '[]').filter((entry) => entry.dateKey === dateKey);
      const list = document.createElement('div');
      if (sameDay.length) {
        sameDay.forEach((entry) => { const item = document.createElement('p'); item.textContent = `${entry.category}: ${entry.content}`; list.append(item); });
      } else {
        const empty = document.createElement('p'); empty.textContent = 'Ainda não há registros pessoais neste dia.'; list.append(empty);
      }
      const add = document.createElement('button'); add.type = 'button'; add.className = 'calendar-add-entry'; add.textContent = 'Criar registro nesta data'; add.addEventListener('click', () => { modal.close(); openEntryDialog(dateKey); }); list.append(add);
      showDetail(`Registros de ${readable}`, list); return;
    }
    const moment = event.target.closest('.moment-item');
    if (moment) {
      const copy = moment.cloneNode(true); showDetail(moment.querySelector('.item-text')?.textContent.trim() || 'Momento especial', copy);
    }
  });

  document.addEventListener('keydown', (event) => {
    const moment = event.target.closest?.('.moment-item');
    if (moment && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); moment.click(); }
  });

  dialog.querySelectorAll('[data-close-entry]').forEach((button) => {
    button.addEventListener('click', () => dialog.close());
  });

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });

  dialog.addEventListener('close', () => {
    form.reset();
    photoPreview.hidden = true;
    photoPreview.removeAttribute('src');
    formMessage.textContent = '';
    editingEntryId = null;
    form.querySelector('[type="submit"]').textContent = 'Salvar registro';
  });

  photoInput.addEventListener('change', () => {
    formMessage.textContent = '';
    const file = photoInput.files[0];
    if (!file) {
      photoPreview.hidden = true;
      photoPreview.removeAttribute('src');
      return;
    }
    if (!file.type.startsWith('image/')) {
      photoInput.value = '';
      formMessage.textContent = 'Selecione um arquivo de imagem.';
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      photoInput.value = '';
      photoPreview.hidden = true;
      formMessage.textContent = 'A foto deve ter no máximo 10 MB.';
      return;
    }
    photoPreview.src = URL.createObjectURL(file);
    photoPreview.hidden = false;
  });

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => applyFilter(button.textContent.trim()));
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    formMessage.textContent = '';
    const data = new FormData(form);
    const dateKey = data.get('date') || localDateKey();
    const previousEntries = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const previousEntry = previousEntries.find((item) => item.id === editingEntryId);
    const entry = {
      id: editingEntryId || `entry-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      category: data.get('category'),
      content: data.get('content').trim(),
      dateKey,
      date: new Intl.DateTimeFormat('pt-BR').format(new Date(`${dateKey}T12:00:00`)),
      ...(previousEntry?.photo ? { photo: previousEntry.photo } : {})
    };
    if (!entry.content) return;

    const photo = photoInput.files[0];
    try {
      if (photo) entry.photo = await compressPhoto(photo);
    } catch (error) {
      formMessage.textContent = error.message;
      return;
    }

    const saved = editingEntryId
      ? previousEntries.map((item) => item.id === editingEntryId ? entry : item)
      : [entry, ...previousEntries];
    try {
      localStorage.setItem(storageKey, JSON.stringify(saved));
    } catch (error) {
      console.warn('Não foi possível salvar o registro neste dispositivo.', error);
      formMessage.textContent = 'Não foi possível salvar. Tente remover a foto ou usar uma imagem menor.';
      return;
    }
    if (editingEntryId) entriesGrid.querySelector(`[data-entry-id="${CSS.escape(editingEntryId)}"]`)?.replaceWith(buildEntry(entry));
    else entriesGrid.prepend(buildEntry(entry));
    applyFilter('Todos');
    renderCalendar();
    dialog.close();
  });

  loadSavedEntries();
  let calendarMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  renderCalendar();
  function renderCalendar() {
    const label = document.querySelector('[data-calendar-label]');
    const grid = document.querySelector('[data-calendar-days]');
    if (!label || !grid) return;
    label.textContent = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(calendarMonth);
    const firstDay = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1).getDay();
    const daysInMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();
    const todayKey = localDateKey();
    const entryDates = new Set(JSON.parse(localStorage.getItem(storageKey) || '[]').map((entry) => entry.dateKey).filter(Boolean));
    grid.replaceChildren();
    for (let index = 0; index < firstDay; index += 1) {
      const blank = document.createElement('span'); blank.setAttribute('aria-hidden', 'true'); grid.append(blank);
    }
    for (let dayNumber = 1; dayNumber <= daysInMonth; dayNumber += 1) {
      const dateKey = `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
      const button = document.createElement('button'); button.type = 'button'; button.className = 'calendar-day'; button.textContent = String(dayNumber); button.dataset.calendarDate = dateKey;
      if (dateKey === todayKey) button.classList.add('today');
      if (entryDates.has(dateKey)) button.classList.add('has-entry');
      button.setAttribute('aria-label', new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full' }).format(new Date(`${dateKey}T12:00:00`)));
      grid.append(button);
    }
  }
  document.querySelector('[data-calendar-prev]')?.addEventListener('click', () => { calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1); renderCalendar(); });
  document.querySelector('[data-calendar-next]')?.addEventListener('click', () => { calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1); renderCalendar(); });
})();
