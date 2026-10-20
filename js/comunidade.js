(() => {
  const keys = {
    posts: 'loveJourney.comunidade.posts',
    activity: 'loveJourney.comunidade.activity',
    comments: 'loveJourney.comunidade.comments',
    hidden: 'loveJourney.comunidade.hidden'
  };
  const currentUser = 'Beatriz Prates';
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
  const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };

  document.addEventListener('DOMContentLoaded', () => {
    const feed = document.querySelector('.feed');
    const publishCard = document.querySelector('.publish-card');
    const textarea = publishCard.querySelector('textarea');
    const publishButton = publishCard.querySelector('.publish-button');
    const postButtons = [...publishCard.querySelectorAll('.chip-btn')];
    const filters = [...publishCard.querySelectorAll('.feed-filters .tag-button')];
    const activity = read(keys.activity, { likes: [], saved: [] });
    const comments = read(keys.comments, {});
    let storedPosts = read(keys.posts, []);
    const hiddenPosts = new Set(read(keys.hidden, []));
    let selectedKind = 'Texto'; let attachedUrl = ''; let attachedFile = null; let linkValue = '';

    const style = document.createElement('style');
    style.textContent = `.community-action-dialog{position:fixed;inset:50% auto auto 50%;transform:translate(-50%,-50%);margin:0;border:0;border-radius:18px;padding:0;width:min(500px,calc(100% - 28px));max-height:88vh;max-height:88dvh;color:#333;box-shadow:0 22px 70px #28163244}.community-action-dialog::backdrop{background:#21142c88;backdrop-filter:blur(3px)}.community-action-dialog .content{padding:24px;max-height:88vh;max-height:88dvh;overflow:auto;font-family:Poppins,sans-serif}.community-action-dialog header{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:14px}.community-action-dialog h2{font-size:1.15rem;color:#49344f}.community-action-dialog p{color:#666;line-height:1.55;margin:8px 0}.community-action-dialog .close{border:0;background:transparent;font-size:26px;cursor:pointer}.community-action-dialog .actions{display:flex;justify-content:flex-end;flex-wrap:wrap;gap:8px;margin-top:16px}.community-action-dialog button.action{border:0;border-radius:9px;padding:10px 14px;cursor:pointer;font:inherit}.community-action-dialog .primary{background:#f25287;color:white}.community-action-dialog .secondary{background:#f1edf3;color:#49344f}.community-action-dialog label{display:grid;gap:6px;margin:12px 0}.community-action-dialog textarea,.community-action-dialog select{font:inherit;padding:10px;border:1px solid #dfd5e3;border-radius:10px}.community-action-dialog textarea{min-height:90px}.post-stats button{padding:2px 4px;border:0;background:transparent;color:inherit;font:inherit;cursor:pointer}.post-stats button[aria-pressed="true"]{color:#d82262;font-weight:700}.post-media{display:block;max-width:100%;max-height:360px;margin-top:12px;border-radius:10px}.post-media-link{display:inline-block;margin-top:10px;color:var(--primary-pink);overflow-wrap:anywhere}.publish-attachment{margin-top:8px;font-size:.8rem;color:#5e7c64}.publish-content .link-draft{width:100%;margin-top:8px;padding:8px;border:1px solid #f3d0dc;border-radius:8px;font:inherit}.comment-submit{border:0;background:transparent;color:var(--primary-pink);font-weight:600;cursor:pointer;margin-left:6px}.comment-input-wrap{display:flex;align-items:center;gap:4px}.community-empty{padding:18px;text-align:center;background:#fff7fa;border-radius:12px;color:#777}.content-tab-empty{padding:12px;border-radius:10px;background:#fff7fa;color:#777;font-size:.78rem}`;
    document.head.append(style);

    const modal = document.createElement('dialog'); modal.className = 'community-action-dialog'; document.body.append(modal);
    const showDialog = (title, body, onReady) => {
      modal.innerHTML = `<div class="content"><header><h2>${escapeHtml(title)}</h2><button type="button" class="close" aria-label="Fechar">&times;</button></header><div class="body">${body}</div></div>`;
      modal.querySelector('.close').onclick = () => modal.close();
      modal.onclick = event => { if (event.target === modal) modal.close(); };
      onReady?.(modal.querySelector('.body')); modal.showModal();
    };
    const saveActivity = () => localStorage.setItem(keys.activity, JSON.stringify(activity));

    const fileInput = document.createElement('input'); fileInput.type = 'file'; fileInput.hidden = true; publishCard.append(fileInput);
    const attachmentStatus = document.createElement('p'); attachmentStatus.className = 'publish-attachment'; attachmentStatus.hidden = true; publishCard.querySelector('.publish-content').insertBefore(attachmentStatus, publishCard.querySelector('.feed-filters'));
    const linkInput = document.createElement('input'); linkInput.type = 'url'; linkInput.className = 'link-draft'; linkInput.placeholder = 'Cole o link que deseja compartilhar'; linkInput.hidden = true; publishCard.querySelector('.publish-content').insertBefore(linkInput, publishCard.querySelector('.feed-filters'));

    const assignIds = () => [...feed.querySelectorAll('.post-card')].forEach((post, index) => {
      if (!post.dataset.postId) post.dataset.postId = `sample-${index + 1}`;
    });
    assignIds();

    const postText = post => post.querySelector('.post-text')?.textContent.trim() || '';
    const postAuthor = post => post.querySelector('.post-author strong')?.textContent.trim() || '';
    const updateCounts = post => {
      const like = post.querySelector('.post-like'); const commentButton = post.querySelector('.post-comment');
      // Total exibido no card + comentários salvos neste dispositivo.
      const commentsCount = Number(post.dataset.baseComments || 0) + (comments[post.dataset.postId]?.length || 0);
      if (commentButton) commentButton.innerHTML = `<i aria-hidden="true" class="fa-solid fa-comment"></i> ${commentsCount}`;
      if (like) like.setAttribute('aria-pressed', activity.likes.includes(post.dataset.postId));
    };
    const addActionButtons = post => {
      if (post.querySelector('.post-like')) { updateCounts(post); return; }
      const stats = post.querySelector('.post-stats'); if (!stats) return;
      const spans = [...stats.querySelectorAll('span')];
      const likes = Number(spans[0]?.textContent.match(/\d+/)?.[0] || 0) + (activity.likes.includes(post.dataset.postId) ? 1 : 0);
      const existingComments = Number(spans[1]?.textContent.match(/\d+/)?.[0] || post.querySelectorAll('.comments .comment').length);
      stats.innerHTML = `<button type="button" class="post-like" aria-label="Curtir publicação" aria-pressed="false"><i aria-hidden="true" class="fa-solid fa-heart"></i> <span>${likes}</span></button><button type="button" class="post-comment" aria-label="Ir para comentários"><i aria-hidden="true" class="fa-solid fa-comment"></i> <span>${existingComments}</span></button>`;
      post.dataset.baseComments = String(existingComments);
      updateCounts(post);
    };
    const buildComment = ({ name = currentUser, text, date = 'agora' }) => {
      const row = document.createElement('div'); row.className = 'comment';
      const avatar = document.createElement('span'); avatar.className = 'avatar avatar-sm'; avatar.textContent = name.slice(0,1).toUpperCase(); avatar.setAttribute('aria-hidden','true');
      const body = document.createElement('div'); const author = document.createElement('strong'); author.textContent = name;
      const paragraph = document.createElement('p'); paragraph.textContent = text;
      const timestamp = document.createElement('small'); timestamp.textContent = date;
      body.append(author, paragraph, timestamp); row.append(avatar, body); return row;
    };
    const renderComments = post => {
      const area = post.querySelector('.comments'); if (!area) return;
      (comments[post.dataset.postId] || []).forEach(comment => area.insertBefore(buildComment(comment), area.querySelector('.comment-input-wrap') || area.querySelector('.comment-input')));
      updateCounts(post);
    };

    [...feed.querySelectorAll('.post-card')].forEach(post => {
      addActionButtons(post); renderComments(post);
      if (hiddenPosts.has(post.dataset.postId)) post.hidden = true;
      const input = post.querySelector('.comment-input');
      if (input && !input.parentElement.classList.contains('comment-input-wrap')) {
        const wrap = document.createElement('div'); wrap.className = 'comment-input-wrap'; input.replaceWith(wrap); wrap.append(input);
        const send = document.createElement('button'); send.type = 'button'; send.className = 'comment-submit'; send.textContent = 'Enviar'; wrap.append(send);
        const submit = () => {
          const text = input.value.trim(); if (!text) { input.focus(); return; }
          comments[post.dataset.postId] ||= []; comments[post.dataset.postId].push({ name: currentUser, text, date: new Intl.DateTimeFormat('pt-BR',{hour:'2-digit',minute:'2-digit'}).format(new Date()) });
          localStorage.setItem(keys.comments, JSON.stringify(comments));
          post.querySelector('.comments').insertBefore(buildComment(comments[post.dataset.postId].at(-1)), wrap); input.value=''; updateCounts(post);
        };
        send.addEventListener('click', submit); input.addEventListener('keydown', event => { if(event.key==='Enter'){event.preventDefault();submit();} });
      }
    });

    const updateAttachment = () => {
      if (attachedUrl || attachedFile) {
        attachmentStatus.hidden = false;
        attachmentStatus.textContent = attachedFile ? `Anexo selecionado: ${attachedFile.name}` : `Link selecionado: ${linkValue}`;
      } else { attachmentStatus.hidden = true; attachmentStatus.textContent = ''; }
      linkInput.hidden = selectedKind !== 'Link';
    };
    postButtons.forEach(button => button.addEventListener('click', () => {
      const kind = button.textContent.trim(); selectedKind = kind;
      postButtons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      if (kind === 'Imagem' || kind === 'Vídeo') {
        fileInput.accept = kind === 'Imagem' ? 'image/*' : 'video/*'; fileInput.click();
      } else if (kind === 'Link') { linkInput.hidden = false; linkInput.focus(); }
      else { attachedUrl=''; attachedFile=null; linkValue=''; linkInput.value=''; if (attachedUrl) URL.revokeObjectURL(attachedUrl); updateAttachment(); textarea.focus(); }
    }));
    fileInput.addEventListener('change', () => {
      if (attachedUrl) URL.revokeObjectURL(attachedUrl);
      attachedFile = fileInput.files[0] || null; attachedUrl = attachedFile ? URL.createObjectURL(attachedFile) : ''; updateAttachment();
    });
    linkInput.addEventListener('input', () => { linkValue = linkInput.value.trim(); updateAttachment(); });
    linkInput.addEventListener('change', () => { linkValue = linkInput.value.trim(); updateAttachment(); });
    document.getElementById('btn-publish-top')?.addEventListener('click', () => { publishCard.scrollIntoView({behavior:'smooth',block:'center'}); textarea.focus({preventScroll:true}); });

    const buildPost = (data, id) => {
      const article = document.createElement('article'); article.className = 'card post-card'; article.dataset.postId = id; article.dataset.own = 'true';
      const main = document.createElement('div'); main.className = 'post-main';
      const author = document.createElement('div'); author.className = 'post-author';
      const avatar = document.createElement('span'); avatar.className = 'avatar'; avatar.textContent = currentUser[0];
      const authorInfo = document.createElement('div'); const name = document.createElement('strong'); name.textContent = currentUser;
      const role = document.createElement('small'); role.textContent = `Profissional da comunidade · ${new Intl.DateTimeFormat('pt-BR',{hour:'2-digit',minute:'2-digit'}).format(new Date())}`;
      authorInfo.append(name,role); author.append(avatar,authorInfo);
      const menu = document.createElement('button'); menu.className = 'post-menu'; menu.type = 'button'; menu.setAttribute('aria-label','Mais opções'); menu.textContent='•••';
      const heading = document.createElement('h3'); heading.textContent = data.text.split('\n')[0].slice(0,100) || 'Nova publicação';
      const content = document.createElement('p'); content.className='post-text'; content.textContent=data.text;
      const tags = document.createElement('div'); tags.className='tag-group'; if(data.kind && data.kind!=='Texto'){const tag=document.createElement('span');tag.className='tag pink';tag.textContent=data.kind;tags.append(tag);}
      if(data.link){const a=document.createElement('a');a.className='post-media-link';a.href=data.link;a.target='_blank';a.rel='noopener noreferrer';a.textContent=data.link;content.after(a);}
      if(data.mediaUrl && data.kind==='Imagem'){const img=document.createElement('img');img.className='post-media';img.src=data.mediaUrl;img.alt='Imagem anexada à publicação';}
      if(data.mediaUrl && data.kind==='Vídeo'){const video=document.createElement('video');video.className='post-media';video.src=data.mediaUrl;video.controls=true;video.setAttribute('aria-label','Vídeo anexado à publicação');}
      const stats=document.createElement('div');stats.className='post-stats';stats.innerHTML='<span><i class="fa-solid fa-heart"></i> 0</span><span><i class="fa-solid fa-comment"></i> 0</span>';
      main.append(author,menu,heading,content); if(data.mediaUrl){const media=data.kind==='Imagem'?Object.assign(document.createElement('img'),{className:'post-media',src:data.mediaUrl,alt:'Imagem anexada à publicação'}):Object.assign(document.createElement('video'),{className:'post-media',src:data.mediaUrl,controls:true});main.append(media);} if(data.link){const a=document.createElement('a');a.className='post-media-link';a.href=data.link;a.target='_blank';a.rel='noopener noreferrer';a.textContent=data.link;main.append(a);} main.append(tags,stats);
      const commentArea=document.createElement('div');commentArea.className='comments';const wrap=document.createElement('div');wrap.className='comment-input-wrap';const input=document.createElement('input');input.type='text';input.className='comment-input';input.placeholder='Escreva um comentário...';input.setAttribute('aria-label','Escreva um comentário');const send=document.createElement('button');send.type='button';send.className='comment-submit';send.textContent='Enviar';wrap.append(input,send);commentArea.append(wrap);article.append(main,commentArea);
      addActionButtons(article); return article;
    };

    const publish = () => {
      const text = textarea.value.trim();
      if (!text) { textarea.focus(); textarea.setCustomValidity('Escreva algo antes de publicar.'); textarea.reportValidity(); textarea.addEventListener('input',()=>textarea.setCustomValidity(''),{once:true}); return; }
      if (selectedKind === 'Link') {
        linkValue = linkInput.value.trim();
        try { const url = new URL(linkValue); if (!['http:','https:'].includes(url.protocol)) throw new Error(); linkValue=url.href; }
        catch { linkInput.setCustomValidity('Informe um link válido começando com https://'); linkInput.reportValidity(); return; }
      }
      if ((selectedKind==='Imagem' || selectedKind==='Vídeo') && !attachedFile) { showDialog('Selecione um anexo', '<p>Escolha um arquivo antes de publicar ou selecione Texto para publicar sem anexo.</p>'); return; }
      const id=`post-${Date.now()}`; const record={id,text,kind:selectedKind,link:selectedKind==='Link'?linkValue:'',createdAt:new Date().toISOString()};
      const post=buildPost({...record,mediaUrl:attachedUrl},id); feed.insertBefore(post,publishCard.nextSibling); storedPosts.unshift(record); localStorage.setItem(keys.posts,JSON.stringify(storedPosts));
      textarea.value=''; linkInput.value=''; linkInput.setCustomValidity(''); fileInput.value=''; attachedUrl='';attachedFile=null;linkValue='';selectedKind='Texto';postButtons.forEach(button=>button.setAttribute('aria-pressed',String(button.textContent.trim()==='Texto')));updateAttachment(); applyFeedFilter('Todos');
    };
    publishButton.addEventListener('click',publish);
    textarea.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key==='Enter')publish();});

    storedPosts.slice().reverse().forEach(record => {
      if (feed.querySelector(`[data-post-id="${CSS.escape(record.id)}"]`)) return;
      const post=buildPost({...record,kind:record.kind==='Imagem'||record.kind==='Vídeo'?'Texto':record.kind},record.id); feed.insertBefore(post,publishCard.nextSibling); renderComments(post);
    });

    const activeFilterLabel = () => filters.find(button=>button.classList.contains('active'))?.textContent.trim() || 'Todos';
    function applyFeedFilter(filter = activeFilterLabel()) {
      filters.forEach(button=>{const active=normalize(button.textContent.trim())===normalize(filter);button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});
      const posts=[...feed.querySelectorAll('.post-card')];
      if(normalize(filter).includes('curt')) posts.sort((a,b)=>Number(b.querySelector('.post-like span')?.textContent||0)-Number(a.querySelector('.post-like span')?.textContent||0));
      else if(normalize(filter).includes('recent')) posts.sort((a,b)=>{const da=a.dataset.createdAt||a.dataset.postId;const db=b.dataset.createdAt||b.dataset.postId;return db.localeCompare(da,undefined,{numeric:true});});
      posts.forEach(post=>feed.append(post));
      posts.forEach(post=>{
        let visible=!hiddenPosts.has(post.dataset.postId);
        if(normalize(filter).includes('meus')) visible=visible&&(post.dataset.own==='true'||postAuthor(post)===currentUser);
        post.hidden=!visible;
      });
    }
    filters.forEach(button=>button.addEventListener('click',()=>applyFeedFilter(button.textContent.trim())));
    feed.addEventListener('click',event=>{
      const likeButton=event.target.closest('.post-like');
      if(likeButton){const post=likeButton.closest('.post-card');const id=post.dataset.postId;const count=likeButton.querySelector('span');const liked=activity.likes.includes(id);if(liked){activity.likes=activity.likes.filter(value=>value!==id);count.textContent=String(Math.max(0,Number(count.textContent)-1));}else{activity.likes.push(id);count.textContent=String(Number(count.textContent)+1);}saveActivity();likeButton.setAttribute('aria-pressed',String(!liked));return;}
      const commentButton=event.target.closest('.post-comment');if(commentButton){commentButton.closest('.post-card').querySelector('.comment-input')?.focus();return;}
      const menuButton=event.target.closest('.post-menu');if(menuButton){openPostMenu(menuButton.closest('.post-card'));return;}
      const sendButton=event.target.closest('.comment-submit');if(sendButton){const post=sendButton.closest('.post-card');const input=post.querySelector('.comment-input');const text=input.value.trim();if(!text){input.focus();return;}comments[post.dataset.postId]||=[];const record={name:currentUser,text,date:new Intl.DateTimeFormat('pt-BR',{hour:'2-digit',minute:'2-digit'}).format(new Date())};comments[post.dataset.postId].push(record);localStorage.setItem(keys.comments,JSON.stringify(comments));post.querySelector('.comments').insertBefore(buildComment(record),sendButton.parentElement);input.value='';updateCounts(post);}
    });
    function openPostMenu(post){
      const id=post.dataset.postId;const own=post.dataset.own==='true'||postAuthor(post)===currentUser;const saved=activity.saved.includes(id);
      showDialog('Opções da publicação',`<div class="actions" style="justify-content:flex-start"><button type="button" class="action secondary" data-save>${saved?'Remover dos salvos':'Salvar publicação'}</button>${own?'<button type="button" class="action secondary" data-delete>Excluir publicação</button>':'<button type="button" class="action secondary" data-report>Denunciar publicação</button>'}<button type="button" class="action secondary" data-copy>Copiar link</button></div>`,body=>{
        body.querySelector('[data-save]').onclick=()=>{if(saved)activity.saved=activity.saved.filter(value=>value!==id);else activity.saved.push(id);saveActivity();modal.close();};
        body.querySelector('[data-delete]')?.addEventListener('click',()=>{if(confirm('Excluir esta publicação?')){post.remove();storedPosts=storedPosts.filter(item=>item.id!==id);localStorage.setItem(keys.posts,JSON.stringify(storedPosts));comments[id]&&delete comments[id];localStorage.setItem(keys.comments,JSON.stringify(comments));modal.close();}});
        body.querySelector('[data-report]')?.addEventListener('click',()=>{modal.close();showDialog('Denunciar publicação','<form><label>Motivo<select name="reason"><option>Conteúdo inadequado</option><option>Spam</option><option>Assédio ou discurso de ódio</option><option>Outro</option></select></label><div class="actions"><button class="action primary" type="submit">Enviar denúncia</button></div></form>',content=>content.querySelector('form').addEventListener('submit',event=>{event.preventDefault();const reports=read('loveJourney.comunidade.reports',[]);reports.push({post:id,reason:new FormData(event.currentTarget).get('reason'),date:new Date().toISOString()});localStorage.setItem('loveJourney.comunidade.reports',JSON.stringify(reports));modal.close();showDialog('Denúncia registrada','<p>A denúncia foi salva neste dispositivo para fins de demonstração.</p>');}));});
        body.querySelector('[data-copy]').onclick=async()=>{const url=`${location.origin}${location.pathname}#${id}`;try{await navigator.clipboard.writeText(url);modal.close();showDialog('Link copiado','<p>O link da publicação foi copiado.</p>');}catch{modal.close();showDialog('Link da publicação',`<label>Copie o endereço<input readonly value="${escapeHtml(url)}"></label>`);}};
      });
    }

    // Tipo de feed: recentes e curtidos ordenam; meus posts filtra publicações próprias.
    applyFeedFilter('Todos');

    // Categorias na lateral filtram o feed pelo texto/tags da publicação.
    const categoryTags=[...document.querySelectorAll('.categories-card .tag')];
    categoryTags.forEach(tag=>{tag.setAttribute('role','button');tag.tabIndex=0;const filterCategory=()=>{
      const category=normalize(tag.textContent.trim());filters.forEach(button=>button.classList.remove('active'));
      [...feed.querySelectorAll('.post-card')].forEach(post=>{const haystack=normalize(`${postText(post)} ${[...post.querySelectorAll('.tag-group .tag')].map(t=>t.textContent).join(' ')}`);post.hidden=hiddenPosts.has(post.dataset.postId)||!haystack.includes(category);});
    };tag.addEventListener('click',filterCategory);tag.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();filterCategory();}});});
    const allCategoriesLink=document.querySelector('.categories-card .link-action');
    allCategoriesLink?.addEventListener('click',event=>{event.preventDefault();applyFeedFilter('Todos');document.querySelector('.categories-card').scrollIntoView({behavior:'smooth',block:'center'});});

    // Conteúdo lateral troca entre posts próprios, curtidas e avaliações.
    const contentTabs=[...document.querySelectorAll('.content-tabs button')];const contentItems=[...document.querySelectorAll('.contents-card .content-item')];
    const evaluationCopy=['Acolhimento e escuta que fazem diferença.','Conteúdos claros sobre relações saudáveis.','Uma comunidade respeitosa e inspiradora.'];
    const renderContentTab=button=>{
      contentTabs.forEach(tab=>{const selected=tab===button;tab.classList.toggle('selected',selected);tab.setAttribute('aria-pressed',String(selected));});
      const label=normalize(button.textContent);let selectedItems=contentItems;
      if(label.includes('curt')) selectedItems=contentItems.filter((_,index)=>index<Math.min(activity.likes.length,contentItems.length));
      if(label.includes('avali')) selectedItems=contentItems;
      contentItems.forEach((item,index)=>{item.hidden=!selectedItems.includes(item);if(label.includes('avali')){const title=item.querySelector('strong');const date=item.querySelector('small');const score=item.querySelector('b');title.textContent=evaluationCopy[index]||'Avaliação positiva da comunidade';date.textContent='Avaliação de membro';score.textContent='★★★★★';}else if(!label.includes('avali')){const title=item.querySelector('strong');if(title.dataset.original)title.textContent=title.dataset.original;const date=item.querySelector('small');if(date.dataset.original)date.textContent=date.dataset.original;const score=item.querySelector('b');if(score.dataset.original)score.innerHTML=score.dataset.original;}});
      if(label.includes('curt')&&!selectedItems.length){let empty=document.querySelector('.content-tab-empty');if(!empty){empty=document.createElement('p');empty.className='content-tab-empty';document.querySelector('.contents-card .content-tabs').after(empty);}empty.textContent='Você ainda não curtiu publicações.';}else document.querySelector('.content-tab-empty')?.remove();
    };
    contentItems.forEach(item=>{const title=item.querySelector('strong');const date=item.querySelector('small');const score=item.querySelector('b');if(title)title.dataset.original=title.textContent;if(date)date.dataset.original=date.textContent;if(score)score.dataset.original=score.innerHTML;});
    contentTabs.forEach(button=>button.addEventListener('click',()=>renderContentTab(button)));
    document.querySelectorAll('.post-card .post-like').forEach(button=>{const id=button.closest('.post-card').dataset.postId;button.setAttribute('aria-pressed',String(activity.likes.includes(id)));});
  });
})();
