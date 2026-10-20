(() => {
  const input = document.getElementById('mensagem-input');
  const sendButton = document.getElementById('btn-submit');
  const messages = document.getElementById('chat-messages');
  const status = document.getElementById('status');
  const maxMessageLength = 2000;
  // No aplicativo Android (Capacitor) não existe /api/chat local: usa a API de produção.
  const isApp = Boolean(window.Capacitor?.isNativePlatform?.());
  const chatUrl = isApp ? 'https://front-end-4cu.pages.dev/api/chat' : '/api/chat';
  let sending = false;

  if (!input || !sendButton || !messages || !status) return;

  const readHistory = () => Array.from(messages.querySelectorAll('.message'))
    .map((row) => ({
      role: row.classList.contains('sent') ? 'user' : 'model',
      text: row.querySelector('.bubble p')?.textContent.trim() || ''
    }))
    .filter((item) => item.text)
    .slice(-12);

  const storageKey = 'loveJourney.diarioIA';
  const readState = () => {
    try { return JSON.parse(localStorage.getItem(storageKey) || '{}'); }
    catch { return {}; }
  };
  const state = readState();
  state.sessions = Array.isArray(state.sessions) ? state.sessions : [];
  state.entries = Array.isArray(state.entries) ? state.entries : [];
  const persist = () => localStorage.setItem(storageKey, JSON.stringify(state));
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

  const seedSession = () => ({
    id: `chat-${Date.now()}`,
    title: 'Conversa inicial',
    updatedAt: new Date().toISOString(),
    messages: readHistory()
  });
  let activeSession = state.sessions.find((session) => session.id === state.activeSessionId);
  if (!activeSession) {
    activeSession = state.sessions[0] || seedSession();
    if (!state.sessions.length) state.sessions.push(activeSession);
    state.activeSessionId = activeSession.id;
  }

  function renderMessages(items) {
    messages.replaceChildren();
    items.forEach((item) => addMessage(item.role, item.text));
  }

  function saveCurrentSession() {
    activeSession.messages = readHistory();
    const firstUserMessage = activeSession.messages.find((message) => message.role === 'user')?.text;
    if (firstUserMessage) activeSession.title = firstUserMessage.replace(/\s+/g, ' ').slice(0, 42) + (firstUserMessage.length > 42 ? '…' : '');
    activeSession.updatedAt = new Date().toISOString();
    state.activeSessionId = activeSession.id;
    persist();
    renderHistory();
  }

  function renderHistory() {
    const list = document.querySelector('.history-list');
    if (!list) return;
    const sessions = [...state.sessions].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    list.innerHTML = sessions.slice(0, 4).map((session) => `<button class="history-item" type="button" data-session-id="${escapeHtml(session.id)}"><span class="history-icon"><i aria-hidden="true" class="fa-solid fa-comment"></i></span><span class="history-date">${new Intl.DateTimeFormat('pt-BR').format(new Date(session.updatedAt))}</span><span class="history-text">${escapeHtml(session.title || 'Nova conversa')}</span><span class="chevron">›</span></button>`).join('') || '<p class="history-empty">Suas conversas salvas aparecerão aqui.</p>';
  }

  function loadSession(session) {
    if (!session) return;
    activeSession = session;
    state.activeSessionId = session.id;
    persist();
    renderMessages(session.messages || []);
    setStatus('Conversa carregada do histórico.');
    window.setTimeout(() => setStatus(''), 2200);
  }

  const addMessage = (role, text) => {
    const row = document.createElement('div');
    row.className = `message ${role === 'user' ? 'sent' : 'received'}`;

    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    const paragraph = document.createElement('p');
    paragraph.textContent = text;
    const time = document.createElement('time');
    time.dateTime = new Date().toISOString();
    time.textContent = new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date());
    bubble.append(paragraph, time);

    const avatar = document.createElement('span');
    avatar.className = `avatar mini ${role === 'user' ? 'me' : 'ia'}`;
    avatar.textContent = role === 'user' ? 'Eu' : 'IA';

    if (role === 'user') row.append(bubble, avatar);
    else row.append(avatar, bubble);
    messages.append(row);
    messages.scrollTop = messages.scrollHeight;
  };

  const setStatus = (text, isError = false) => {
    status.textContent = text;
    status.classList.toggle('status-error', isError);
  };

  if (activeSession.messages?.length) renderMessages(activeSession.messages);
  renderHistory();
  if (state.dailyEmotion) {
    document.querySelectorAll('.emotion-item').forEach((button) => {
      const selected = button.querySelector('.label')?.textContent.trim() === state.dailyEmotion;
      button.setAttribute('aria-pressed', String(selected));
    });
  }
  if (state.dailyReflection) {
    const reflection = document.querySelector('.diary-text');
    if (reflection) reflection.textContent = state.dailyReflection;
  }

  const sendMessage = async () => {
    const text = input.value.trim();
    if (!text || sending) {
      if (!text) input.classList.add('input-error');
      return;
    }
    if (text.length > maxMessageLength) {
      setStatus('Sua mensagem pode ter até 2.000 caracteres.', true);
      return;
    }

    input.classList.remove('input-error');
    input.value = '';
    addMessage('user', text);
    saveCurrentSession();
    sending = true;
    sendButton.disabled = true;
    input.disabled = true;
    setStatus('Estou aqui com você. Vou pensar com carinho...');

    try {
      const response = await fetch(chatUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: readHistory() })
      });
      const data = await response.json().catch(() => null);
      if (!data) {
        if (response.status === 404) {
          throw new Error('O servidor do chat não está ativo neste endereço. Inicie `node server.mjs` e abra o site em http://127.0.0.1:4173.');
        }
        if (response.status === 405) {
          throw new Error('Este endereço está usando um servidor estático que bloqueia o chat. Inicie `node server.mjs` e abra http://127.0.0.1:4173/diario-com-ia.html.');
        }
        throw new Error(`O servidor do chat retornou uma resposta inválida (HTTP ${response.status}).`);
      }
      if (!response.ok) {
        if (response.status === 405) {
          throw new Error('O servidor recebeu um método não permitido. Abra o site pelo endereço http://127.0.0.1:4173/diario-com-ia.html.');
        }
        throw new Error(data.error || `O servidor do chat respondeu com erro HTTP ${response.status}.`);
      }
      if (!data.reply) throw new Error('A resposta veio vazia. Pode tentar enviar de novo?');
      addMessage('model', data.reply);
      saveCurrentSession();
      setStatus('');
    } catch (error) {
      const offlineMessage = isApp
        ? 'Não foi possível conectar ao diário com IA. Confira sua conexão com a internet e tente de novo.'
        : 'Não foi possível conectar ao servidor da IA. Inicie `node server.mjs` e abra http://127.0.0.1:4173.';
      const message = error instanceof TypeError ? offlineMessage : error.message;
      setStatus(message || 'Não foi possível conectar ao diário com IA.', true);
    } finally {
      sending = false;
      sendButton.disabled = false;
      input.disabled = false;
      input.focus();
    }
  };

  window.sendMessage = sendMessage;
  sendButton.addEventListener('click', sendMessage);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  });
  input.addEventListener('input', () => input.classList.remove('input-error'));

  const tools = document.querySelector('.chat-tools');
  const dialog = document.createElement('dialog');
  dialog.className = 'ai-dialog';
  dialog.innerHTML = '<form method="dialog" class="ai-dialog-card"><header><div><p class="ai-dialog-kicker">DIÁRIO COM IA</p><h2></h2></div><button type="button" class="ai-dialog-close" aria-label="Fechar">×</button></header><div class="ai-dialog-content"></div><footer class="ai-dialog-actions"></footer></form>';
  document.body.append(dialog);
  const dialogTitle = dialog.querySelector('h2');
  const dialogContent = dialog.querySelector('.ai-dialog-content');
  const dialogActions = dialog.querySelector('.ai-dialog-actions');
  const openDialog = (title, body, buttons = []) => {
    dialogTitle.textContent = title;
    dialogContent.innerHTML = body;
    dialogActions.innerHTML = buttons.map((button) => `<button type="button" class="${button.primary ? 'ai-primary' : 'ai-secondary'}" data-action="${escapeHtml(button.action || 'close')}">${escapeHtml(button.label)}</button>`).join('');
    dialog.showModal();
  };
  const closeDialog = () => dialog.close();
  dialog.querySelector('.ai-dialog-close').addEventListener('click', closeDialog);
  dialog.addEventListener('click', (event) => { if (event.target === dialog) closeDialog(); });
  dialogContent.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action^="open-session:"]');
    if (!button) return;
    const session = state.sessions.find((item) => item.id === button.dataset.action.slice('open-session:'.length));
    closeDialog(); loadSession(session);
  });
  dialogActions.addEventListener('click', (event) => {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (!action || action === 'close') { closeDialog(); return; }
    if (action === 'save-entry') {
      const form = dialog.querySelector('form');
      const title = form.querySelector('[name="entry-title"]').value.trim();
      const text = form.querySelector('[name="entry-text"]').value.trim();
      if (!title || !text) { form.reportValidity(); return; }
      state.entries.unshift({ id: `entry-${Date.now()}`, title, text, mood: form.querySelector('[name="entry-mood"]').value, createdAt: new Date().toISOString() });
      persist(); closeDialog(); setStatus('Seu registro foi salvo neste dispositivo.'); window.setTimeout(() => setStatus(''), 2500);
      return;
    }
    if (action === 'save-reflection') {
      const text = dialogContent.querySelector('[name="reflection"]').value.trim();
      if (!text) { dialogContent.querySelector('textarea').focus(); return; }
      state.dailyReflection = text; persist();
      const reflection = document.querySelector('.diary-text');
      if (reflection) reflection.textContent = text;
      closeDialog(); return;
    }
    if (action === 'save-emotion') {
      state.dailyEmotion = dialogContent.dataset.selectedEmotion;
      state.dailyEmotionDate = new Date().toISOString(); persist(); closeDialog();
      setStatus(`Emoção de hoje salva: ${state.dailyEmotion}.`); window.setTimeout(() => setStatus(''), 2500);
      return;
    }
    if (action === 'delete-session') {
      state.sessions = state.sessions.filter((session) => session.id !== activeSession.id);
      activeSession = seedSession(); state.sessions.unshift(activeSession); state.activeSessionId = activeSession.id;
      renderMessages([]); persist(); renderHistory(); closeDialog();
      setStatus('Conversa encerrada. Você pode começar uma nova quando quiser.'); window.setTimeout(() => setStatus(''), 2500);
      return;
    }
    if (action === 'export') {
      const contents = JSON.stringify({ conversations: state.sessions, journalEntries: state.entries }, null, 2);
      const url = URL.createObjectURL(new Blob([contents], { type: 'application/json' }));
      const link = Object.assign(document.createElement('a'), { href: url, download: 'love-journey-diario-ia.json' });
      link.click(); URL.revokeObjectURL(url); closeDialog();
      return;
    }
    if (action.startsWith('open-session:')) {
      const session = state.sessions.find((item) => item.id === action.slice('open-session:'.length));
      closeDialog(); loadSession(session);
    }
  });

  const startNewConversation = () => {
    saveCurrentSession();
    activeSession = { id: `chat-${Date.now()}`, title: 'Nova conversa', updatedAt: new Date().toISOString(), messages: [] };
    state.sessions.unshift(activeSession); state.activeSessionId = activeSession.id;
    renderMessages([{ role: 'model', text: 'Estou aqui para ouvir você. O que gostaria de registrar hoje?' }]);
    saveCurrentSession(); input.focus();
  };

  document.getElementById('btn-new-entry')?.addEventListener('click', () => {
    openDialog('Novo registro', '<p>Escreva uma reflexão para guardar no seu diário pessoal. O registro fica salvo apenas neste dispositivo.</p><label class="ai-field">Título<input name="entry-title" required maxlength="90" placeholder="Dê um título para este momento"></label><label class="ai-field">Como foi para você?<textarea name="entry-text" required rows="5" maxlength="2000" placeholder="Escreva no seu ritmo..."></textarea></label><label class="ai-field">Como você se sentiu?<select name="entry-mood"><option>Não quero marcar</option><option>Feliz</option><option>Tranquila</option><option>Neutra</option><option>Preocupada</option><option>Triste</option></select></label>', [{ label: 'Salvar registro', primary: true, action: 'save-entry' }, { label: 'Cancelar' }]);
  });

  document.querySelector('.chat-tools button[aria-label="Buscar na conversa"]')?.addEventListener('click', () => {
    openDialog('Buscar na conversa', '<label class="ai-field">Palavra ou frase<input type="search" name="search" placeholder="Ex.: insegurança"></label><div class="ai-search-results" aria-live="polite"></div>', [{ label: 'Fechar' }]);
    const search = dialogContent.querySelector('[name="search"]');
    const results = dialogContent.querySelector('.ai-search-results');
    search.addEventListener('input', () => {
      const term = search.value.trim().toLocaleLowerCase('pt-BR');
      const found = [...messages.querySelectorAll('.message')].filter((row) => row.textContent.toLocaleLowerCase('pt-BR').includes(term) && term);
      results.innerHTML = term ? (found.length ? found.map((row, index) => `<button type="button" class="ai-search-result" data-result-index="${[...messages.children].indexOf(row)}">${escapeHtml(row.querySelector('.bubble p')?.textContent.trim().slice(0, 150))}</button>`).join('') : '<p>Nenhuma mensagem encontrada nesta conversa.</p>') : '';
    });
    results.addEventListener('click', (event) => {
      const result = event.target.closest('[data-result-index]');
      if (!result) return;
      const row = messages.children[Number(result.dataset.resultIndex)];
      closeDialog(); row?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      row?.classList.add('message-search-match'); window.setTimeout(() => row?.classList.remove('message-search-match'), 1800);
    });
  });

  document.querySelector('.chat-tools button[aria-label="Mais opções"]')?.addEventListener('click', () => {
    openDialog('Opções da conversa', '<p>Gerencie sua conversa e seus registros pessoais.</p>', [{ label: 'Nova conversa', primary: true, action: 'new-session' }, { label: 'Exportar dados', action: 'export' }, { label: 'Encerrar conversa', action: 'delete-session' }, { label: 'Fechar' }]);
    dialogActions.querySelector('[data-action="new-session"]').addEventListener('click', () => { closeDialog(); startNewConversation(); });
  });

  document.querySelector('.diary-edit')?.addEventListener('click', () => {
    const current = state.dailyReflection || document.querySelector('.diary-text')?.textContent.trim() || '';
    openDialog('Editar reflexão', `<label class="ai-field">Sua reflexão<textarea name="reflection" rows="5" required maxlength="2000">${escapeHtml(current)}</textarea></label>`, [{ label: 'Salvar', primary: true, action: 'save-reflection' }, { label: 'Cancelar' }]);
  });

  let selectedEmotion = state.dailyEmotion || '';
  const emotionButtons = [...document.querySelectorAll('.emotion-item')];
  const saveEmotionButton = document.createElement('button');
  saveEmotionButton.type = 'button'; saveEmotionButton.className = 'emotion-save btn btn-primary btn-sm'; saveEmotionButton.textContent = 'Salvar emoção'; saveEmotionButton.hidden = !selectedEmotion;
  document.querySelector('.emotions-row')?.after(saveEmotionButton);
  emotionButtons.forEach((button) => button.addEventListener('click', () => {
    selectedEmotion = button.querySelector('.label')?.textContent.trim() || '';
    emotionButtons.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
    saveEmotionButton.hidden = false;
  }));
  saveEmotionButton.addEventListener('click', () => {
    if (!selectedEmotion) return;
    openDialog('Registrar emoção', `<p>Salvar <strong>${escapeHtml(selectedEmotion)}</strong> como a emoção que você sentiu hoje?</p>`, [{ label: 'Confirmar', primary: true, action: 'save-emotion' }, { label: 'Cancelar' }]);
    dialogContent.dataset.selectedEmotion = selectedEmotion;
  });

  document.querySelector('.diary-card .panel-tab:not(.active)')?.addEventListener('click', () => {
    document.querySelector('.history-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    document.querySelectorAll('.diary-card .panel-tab').forEach((tab) => tab.classList.toggle('active', tab.textContent.includes('Histórico')));
  });
  document.querySelector('.diary-card .panel-tab.active')?.addEventListener('click', () => {
    document.querySelectorAll('.diary-card .panel-tab').forEach((tab) => tab.classList.toggle('active', tab.textContent.includes('Diário do casal')));
    document.querySelector('.diary-entry')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  document.querySelector('.history-card .card-header .btn')?.addEventListener('click', () => {
    const conversations = [...state.sessions].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    const conversationRows = conversations.map((session) => `<button type="button" class="ai-all-history-item" data-action="open-session:${escapeHtml(session.id)}"><span>${escapeHtml(session.title || 'Nova conversa')}</span><small>${new Intl.DateTimeFormat('pt-BR').format(new Date(session.updatedAt))}</small></button>`).join('');
    const entryRows = state.entries.map((entry) => `<article class="ai-saved-entry"><strong>${escapeHtml(entry.title)}</strong><small>${new Intl.DateTimeFormat('pt-BR').format(new Date(entry.createdAt))}${entry.mood && entry.mood !== 'Não quero marcar' ? ` · ${escapeHtml(entry.mood)}` : ''}</small><p>${escapeHtml(entry.text)}</p></article>`).join('');
    openDialog('Histórico completo', `<h3>Conversas com a IA</h3>${conversationRows || '<p>Nenhuma conversa salva.</p>'}<h3>Registros pessoais</h3>${entryRows || '<p>Nenhum registro pessoal salvo.</p>'}`, [{ label: 'Fechar' }]);
  });

  document.querySelector('.history-list')?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-session-id]');
    if (button) loadSession(state.sessions.find((session) => session.id === button.dataset.sessionId));
  });
  saveCurrentSession();
})();
