(() => {
  const storageKey = 'loveJourney.dashboardCasal';
  const forumKey = 'loveJourney.forumCasal';
  const today = new Intl.DateTimeFormat('sv-SE').format(new Date());
  const icons = {
    Feliz: 'fa-face-smile', Tranquila: 'fa-face-smile', Tranquilo: 'fa-face-smile',
    Neutra: 'fa-face-meh', Neutro: 'fa-face-meh', Preocupada: 'fa-face-frown',
    Preocupado: 'fa-face-frown', Triste: 'fa-face-sad-tear'
  };
  const read = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  };

  document.addEventListener('DOMContentLoaded', () => {
    const selected = new Map();
    const current = read(storageKey, { emotions: [], connected: true, reservations: [] });
    const dialog = document.createElement('dialog');
    dialog.className = 'couple-dialog';
    document.body.append(dialog);

    const styles = document.createElement('style');
    styles.textContent = `
      .couple-dialog{position:fixed;inset:50% auto auto 50%;transform:translate(-50%,-50%);margin:0;border:0;border-radius:18px;padding:0;width:min(560px,calc(100% - 28px));max-height:88vh;max-height:88dvh;color:#333;box-shadow:0 22px 70px #28163244}
      .couple-dialog::backdrop{background:#21142c88;backdrop-filter:blur(3px)}
      .couple-dialog .dialog-content{padding:24px;max-height:88vh;overflow:auto;font-family:Poppins,sans-serif}
      .couple-dialog header{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:16px}
      .couple-dialog h2{font-size:1.2rem;line-height:1.35;margin:0;color:#49344f}
      .couple-dialog p{margin:8px 0;color:#666;line-height:1.6}
      .couple-dialog .dialog-close{border:0;background:transparent;font-size:26px;line-height:1;cursor:pointer;color:#725c78}
      .couple-dialog label{display:grid;gap:6px;margin:12px 0;font-size:.9rem;font-weight:600}
      .couple-dialog input,.couple-dialog textarea,.couple-dialog select{box-sizing:border-box;width:100%;padding:11px;border:1px solid #dfd5e3;border-radius:10px;font:inherit}
      .couple-dialog textarea{min-height:88px;resize:vertical}
      .couple-dialog .dialog-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:16px}
      .couple-dialog .dialog-actions button,.couple-dialog .topic-open{border:0;border-radius:10px;padding:10px 15px;cursor:pointer;font:inherit}
      .couple-dialog .dialog-primary{background:#48a982;color:#fff}.couple-dialog .dialog-secondary{background:#f1edf3;color:#45384a}
      .couple-dialog .topic-open{display:block;width:100%;text-align:left;background:#fff5f8;margin:8px 0;color:#48364c}
      .couple-dialog .topic-open small{display:block;color:#777;margin-top:4px}
      .couple-dialog .thread-message{padding:10px 12px;background:#f7f4f8;border-radius:10px;margin:8px 0}
      .couple-dialog .thread-message strong{display:block;font-size:.84rem;color:#69447b}
      .couple-dialog .thread-message p{margin:4px 0 0}
      .emotion-status{margin-top:8px;font-size:.8rem;color:#55715f}.connect-disconnected{background:#888!important}
    `;
    document.head.append(styles);

    const openDialog = (title, body, onReady) => {
      dialog.innerHTML = `<div class="dialog-content"><header><h2>${title}</h2><button type="button" class="dialog-close" aria-label="Fechar">&times;</button></header><div class="dialog-body">${body}</div></div>`;
      dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
      dialog.onclick = event => { if (event.target === dialog) dialog.close(); };
      if (onReady) onReady(dialog.querySelector('.dialog-body'));
      dialog.showModal();
    };

    const persist = () => localStorage.setItem(storageKey, JSON.stringify(current));
    const updateMood = (person, emotion) => {
      const personIndex = person === 'Ana' ? 0 : 1;
      const mood = document.querySelectorAll('.mood-person')[personIndex];
      if (!mood) return;
      mood.querySelector('small').textContent = emotion;
      const face = mood.querySelector('.mood-face i');
      face.className = `fa-regular ${icons[emotion] || 'fa-face-smile'}`;
      const selection = document.querySelectorAll('.person')[personIndex];
      if (selection) {
        const status = selection.querySelector('.emotion-status') || document.createElement('small');
        status.className = 'emotion-status';
        status.textContent = `Registrada hoje: ${emotion}`;
        if (!status.isConnected) selection.append(status);
      }
    };

    // Restaura as emoções registradas hoje e conecta cada seleção à pessoa correspondente.
    document.querySelectorAll('.person').forEach(personElement => {
      const personName = personElement.querySelector('.person-name').textContent.trim();
      const todayRecord = current.emotions.find(item => item.date === today && item.person === personName);
      if (todayRecord) updateMood(personName, todayRecord.emotion);
      personElement.querySelectorAll('.emotion-item').forEach(button => {
        const emotion = button.querySelector('.label').textContent.trim();
        if (todayRecord?.emotion === emotion) {
          button.classList.add('selected'); button.setAttribute('aria-pressed', 'true');
          selected.set(personName, emotion);
        }
        button.addEventListener('click', () => {
          personElement.querySelectorAll('.emotion-item').forEach(option => {
            option.classList.remove('selected'); option.setAttribute('aria-pressed', 'false');
          });
          button.classList.add('selected'); button.setAttribute('aria-pressed', 'true');
          selected.set(personName, emotion);
        });
      });
    });

    const registerButton = document.querySelector('.checklist-card > .btn-block');
    registerButton?.addEventListener('click', () => {
      if (!selected.size) {
        openDialog('Escolham como estão se sentindo', '<p>Selecione ao menos uma emoção para Ana ou Lucas antes de registrar.</p><div class="dialog-actions"><button class="dialog-primary" type="button">Entendi</button></div>', body => body.querySelector('button').onclick = () => dialog.close());
        return;
      }
      for (const [person, emotion] of selected) {
        const existing = current.emotions.findIndex(item => item.date === today && item.person === person);
        const record = { date: today, person, emotion, savedAt: new Date().toISOString() };
        if (existing >= 0) current.emotions[existing] = record;
        else current.emotions.unshift(record);
        updateMood(person, emotion);
      }
      persist();
      const saved = [...selected.entries()].map(([person, emotion]) => `${person}: ${emotion}`).join(' · ');
      openDialog('Registro salvo', `<p>As emoções de hoje foram atualizadas.</p><p><strong>${saved}</strong></p><p>O registro ficará salvo neste dispositivo.</p><div class="dialog-actions"><button class="dialog-primary" type="button">Fechar</button></div>`, body => body.querySelector('button').onclick = () => dialog.close());
    });

    // O cartão de conexão agora abre controles para revisar ou alterar o estado do vínculo.
    const connectButton = document.querySelector('.profile-card > .btn-block');
    const renderConnection = () => {
      if (!connectButton) return;
      connectButton.classList.toggle('connect-disconnected', !current.connected);
      connectButton.innerHTML = current.connected
        ? '<i aria-hidden="true" class="fa-solid fa-check"></i> Conectados'
        : '<i aria-hidden="true" class="fa-solid fa-link"></i> Conexão pausada';
      document.querySelector('.connect-icon i').className = `fa-solid ${current.connected ? 'fa-link' : 'fa-link-slash'}`;
    };
    renderConnection();
    connectButton?.addEventListener('click', () => openDialog('Conexão do casal', `<p>${current.connected ? 'Ana e Lucas estão conectados. Os registros compartilhados deste painel ficam associados a este vínculo.' : 'A conexão está pausada. Reative-a para continuar usando os recursos compartilhados.'}</p><div class="dialog-actions"><button type="button" class="dialog-secondary">Fechar</button><button type="button" class="dialog-primary">${current.connected ? 'Pausar conexão' : 'Reativar conexão'}</button></div>`, body => {
      body.querySelector('.dialog-secondary').onclick = () => dialog.close();
      body.querySelector('.dialog-primary').onclick = () => { current.connected = !current.connected; persist(); renderConnection(); dialog.close(); };
    }));

    // Perfis de mentores oferecem detalhes e permitem registrar um pedido de conversa local.
    document.querySelectorAll('.mentors-card .mentor').forEach(mentor => {
      const name = mentor.querySelector('.mentor-name').textContent.trim();
      const role = mentor.querySelector('.mentor-role').textContent.trim();
      const rating = mentor.querySelector('.mentor-rating').textContent.trim();
      mentor.querySelector('button').addEventListener('click', () => openDialog(`Perfil de ${name}`, `<p><strong>${role}</strong></p><p>${rating}</p><p>Solicite uma conversa para receber orientação sobre relacionamento e bem-estar emocional.</p><form><label>Melhor período<select name="periodo"><option>Manhã</option><option>Tarde</option><option>Noite</option></select></label><label>Mensagem<textarea name="mensagem" placeholder="Conte brevemente o que gostaria de conversar"></textarea></label><div class="dialog-actions"><button type="button" class="dialog-secondary">Cancelar</button><button type="submit" class="dialog-primary">Solicitar conversa</button></div></form>`, body => {
        const form = body.querySelector('form');
        body.querySelector('.dialog-secondary').onclick = () => dialog.close();
        form.addEventListener('submit', event => {
          event.preventDefault();
          const formData = new FormData(form);
          current.reservations.push({ mentor: name, period: formData.get('periodo'), message: formData.get('mensagem'), date: new Date().toISOString() });
          persist();
          dialog.close();
          openDialog('Pedido registrado', `<p>Seu pedido de conversa com <strong>${name}</strong> foi salvo neste dispositivo.</p><p>Período indicado: ${formData.get('periodo')}.</p><div class="dialog-actions"><button type="button" class="dialog-primary">Fechar</button></div>`, content => content.querySelector('button').onclick = () => dialog.close());
        });
      }));
    });
    document.querySelector('.mentors-card > .btn-block')?.addEventListener('click', () => { window.location.href = './apoio.html'; });

    // Abre uma conversa local por tópico, mantendo as respostas no navegador.
    const forumButton = document.querySelector('.forum-card > .btn-block');
    const openThread = (topic) => {
      const all = read(forumKey, {});
      const replies = all[topic] || [];
      openDialog(topic, `<div class="thread-list">${replies.length ? replies.map(item => `<div class="thread-message"><strong>${escapeHtml(item.name)} · ${escapeHtml(item.date)}</strong><p>${escapeHtml(item.text)}</p></div>`).join('') : '<p>Ainda não há comentários neste tópico. Inicie a conversa.</p>'}</div><form><label>Seu comentário<textarea name="comment" required maxlength="500" placeholder="Escreva um comentário respeitoso..."></textarea></label><div class="dialog-actions"><button type="button" class="dialog-secondary">Fechar</button><button type="submit" class="dialog-primary">Comentar</button></div></form>`, body => {
        const form = body.querySelector('form');
        body.querySelector('.dialog-secondary').onclick = () => dialog.close();
        form.addEventListener('submit', event => {
          event.preventDefault(); const text = new FormData(form).get('comment').trim(); if (!text) return;
          const comments = read(forumKey, {}); comments[topic] ||= [];
          comments[topic].push({ name: 'Ana e Lucas', date: new Intl.DateTimeFormat('pt-BR').format(new Date()), text });
          localStorage.setItem(forumKey, JSON.stringify(comments)); dialog.close(); openThread(topic);
        });
      });
    };
    forumButton?.addEventListener('click', () => openDialog('Conversas da comunidade', '<p>Escolha um tópico para ler e adicionar comentários.</p><div class="topic-picker"></div>', body => {
      document.querySelectorAll('.forum-card .topic').forEach(topic => {
        const title = topic.querySelector('p').textContent.trim();
        const button = document.createElement('button'); button.type = 'button'; button.className = 'topic-open';
        const label = document.createElement('span'); label.textContent = title;
        const count = document.createElement('small'); count.textContent = `${read(forumKey, {})[title]?.length || 0} comentário(s) neste dispositivo`;
        button.append(label, count); button.onclick = () => openThread(title); body.querySelector('.topic-picker').append(button);
      });
    }));
  });

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  }
})();
