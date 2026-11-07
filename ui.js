(function () {
  'use strict';
  const NL = window.NL;
  const { R, pick, fmt, clamp } = NL.util;
  const app = document.getElementById('app');

  let S = null;        // vida atual
  let busy = false;    // bloqueia o botão de idade durante eventos
  let sheet = null;    // { titulo, build, pessoaId }
  let toastTimer = null;

  // ---------- helpers de DOM ----------
  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat(Infinity)) {
      if (kid == null || kid === false) continue;
      el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    }
    return el;
  }
  const limpar = (n) => { while (n.firstChild) n.removeChild(n.firstChild); };
  const btn = (txt, fn, cls) => h('button', { class: 'btn ' + (cls || ''), onclick: fn }, txt);
  const vibrar = (ms) => { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { /* ignore */ } };

  function toast(txt, k) {
    const old = app.querySelector('.toast');
    if (old) old.remove();
    clearTimeout(toastTimer);
    const t = h('div', { class: 'toast ' + (k || '') }, txt);
    app.append(t);
    toastTimer = setTimeout(() => t.remove(), 2600);
  }

  // ---------- texto de status ----------
  function status(s) {
    if (!s.vivo) return 'Falecido(a)';
    if (s.ninja) return 'Ninja · ' + s.ninja;
    if (s.caminho === 'academia') return 'Estudante da Academia';
    if (s.caminho === 'escola') return 'Estudante';
    if (s.emprego) return s.emprego.n;
    if (s.idade < 6) return s.idade === 0 ? 'Recém-nascido(a)' : 'Criança';
    if (s.idade < 12) return 'Criança';
    return 'Sem ocupação';
  }

  // =====================================================
  // MENU
  // =====================================================
  function telaMenu() {
    S = null; sheet = null; busy = false;
    limpar(app);
    const salvo = NL.carregar();
    app.append(h('div', { class: 'menu' },
      h('div', { class: 'logo' }, '🍃'),
      h('h1', {}, 'NARUTO LIFE'),
      h('p', { class: 'sub' }, NL.VERSAO + ' · Simulador de vida ninja'),
      h('div', { class: 'menu-btns' },
        salvo && salvo.vivo ? btn('▶ Continuar: ' + salvo.nome + ' (' + salvo.idade + ' anos)', () => { S = salvo; telaJogo(); }, 'sec') : null,
        btn('🎲 Vida aleatória', () => { S = NL.criarVida(NL.cfgAleatoria()); NL.salvar(S); telaJogo(); }),
        btn('⚙️ Configurar vida', () => telaConfig()),
      ),
      h('p', { class: 'aviso' }, 'Projeto de fã, sem fins lucrativos e sem relação oficial com os criadores de Naruto.'),
    ));
  }

  // =====================================================
  // CONFIGURAR VIDA
  // =====================================================
  let CFG = null;
  const cfgPadrao = () => ({ modo: 'config', nome: '', sobrenome: '', sexo: 'M', vila: 'konoha', cla: 'comum', riqueza: -1, elementos: [], kgModo: 'auto', irmaos: 1, estrutura: 'ambos' });

  function telaConfig(manter) {
    if (!manter || !CFG) CFG = cfgPadrao();
    const antes = app.querySelector('.cfg-body');
    const rolagem = antes ? antes.scrollTop : 0;
    limpar(app);

    const sel = (opts, val, fn) => {
      const s = h('select', { onchange: (ev) => fn(ev.target.value) },
        opts.map(([v, t]) => h('option', { value: String(v), selected: String(v) === String(val) }, t)));
      return s;
    };
    const campo = (rotulo, ctrl, dica) => h('div', { class: 'campo' }, h('label', {}, rotulo), ctrl, dica ? h('div', { class: 'dica' }, dica) : null);
    const vila = NL.VILAS[CFG.vila];
    const clasOpts = [['comum', 'Família comum (sem clã)']].concat(vila.clas.map((c) => {
      const cl = NL.CLAS[c];
      return [c, cl.n + (cl.kg ? ' · ' + NL.KG[cl.kg].ic + ' ' + NL.KG[cl.kg].n : '')];
    }));

    const body = h('div', { class: 'cfg-body' },
      campo('Nome', h('div', { class: 'linha' },
        h('input', { type: 'text', maxlength: '18', placeholder: 'Em branco = sorteio', value: CFG.nome, oninput: (ev) => { CFG.nome = ev.target.value; } }),
        h('button', { class: 'btn sec sm', onclick: () => { CFG.nome = NL.nomeAleatorio(CFG.sexo); telaConfig(true); } }, '🎲'),
      )),
      campo('Sobrenome', h('input', { type: 'text', maxlength: '18', placeholder: 'Em branco = do clã ou sorteio', value: CFG.sobrenome, oninput: (ev) => { CFG.sobrenome = ev.target.value; } })),
      campo('Sexo', h('div', { class: 'linha' },
        h('button', { class: 'seg ' + (CFG.sexo === 'M' ? 'on' : ''), onclick: () => { CFG.sexo = 'M'; telaConfig(true); } }, '♂ Masculino'),
        h('button', { class: 'seg ' + (CFG.sexo === 'F' ? 'on' : ''), onclick: () => { CFG.sexo = 'F'; telaConfig(true); } }, '♀ Feminino'),
      )),
      campo('Vila e país', sel(Object.entries(NL.VILAS).map(([k, v]) => [k, v.ic + ' ' + v.n + ' — ' + v.pais]), CFG.vila, (v) => { CFG.vila = v; if (!NL.VILAS[v].clas.includes(CFG.cla)) CFG.cla = 'comum'; telaConfig(true); })),
      campo('Clã ou família comum', sel(clasOpts, CFG.cla, (v) => { CFG.cla = v; telaConfig(true); }),
        CFG.cla !== 'comum' ? NL.CLAS[CFG.cla].desc : 'Famílias comuns têm uma pequena chance de despertar um Kekkei Genkai raro.'),
      campo('Pais', sel([['ambos', 'Pai e mãe vivos'], ['mae', 'Só a mãe'], ['pai', 'Só o pai'], ['orfao', 'Órfão(ã)']], CFG.estrutura, (v) => { CFG.estrutura = v; })),
      campo('Irmãos mais velhos', sel([0, 1, 2, 3, 4].map((n) => [n, n === 0 ? 'Nenhum' : String(n)]), CFG.irmaos, (v) => { CFG.irmaos = Number(v); })),
      campo('Condição financeira da família', sel([[-1, '🎲 Aleatória']].concat(NL.RIQUEZA.map((r, i) => [i, r.n])), CFG.riqueza, (v) => { CFG.riqueza = Number(v); }), 'Órfãos sempre começam pobres.'),
      campo('Elementos de chakra', h('div', { class: 'chips' },
        Object.entries(NL.ELEMENTOS).map(([k, el]) => h('button', {
          class: 'chip ' + (CFG.elementos.includes(k) ? 'on' : ''),
          onclick: () => {
            if (CFG.elementos.includes(k)) CFG.elementos = CFG.elementos.filter((x) => x !== k);
            else if (CFG.elementos.length < 3) CFG.elementos.push(k);
            else toast('No máximo 3 elementos.');
            telaConfig(true);
          },
        }, el.ic + ' ' + el.n))), 'Nenhum marcado = sorteio conforme a vila. Máximo de 3.'),
      campo('Kekkei Genkai', sel([['auto', 'Do clã / pequena chance de um raro'], ['nenhum', 'Nenhum'], ['raro', 'Garantir um Kekkei Genkai raro']], CFG.kgModo, (v) => { CFG.kgModo = v; })),
    );

    app.append(h('div', { class: 'cfg' },
      h('div', { class: 'cfg-top' },
        h('button', { class: 'x', onclick: telaMenu }, '←'),
        h('h2', {}, 'Configurar vida')),
      body,
      h('div', { class: 'cfg-foot' }, btn('🍼 Nascer', () => { S = NL.criarVida(Object.assign({}, CFG, { modo: 'config' })); NL.salvar(S); telaJogo(); }, 'full')),
    ));
    body.scrollTop = rolagem;
  }

  // =====================================================
  // TELA PRINCIPAL
  // =====================================================
  function telaJogo() {
    limpar(app);
    sheet = null; busy = false;
    app.append(
      h('div', { class: 'top', id: 'top' }),
      h('div', { class: 'log', id: 'log' }),
      h('div', { class: 'bars', id: 'bars' }),
      h('nav', { class: 'nav', id: 'nav' }),
    );
    renderTudo(false);
    if (!S.vivo) setTimeout(mostrarMorte, 300);
  }

  function renderTudo(animar) {
    renderTopo(); renderLog(animar); renderBarras(); renderNav();
    if (sheet) renderSheet();
  }

  function renderTopo() {
    const top = document.getElementById('top');
    if (!top) return;
    limpar(top);
    const v = NL.VILAS[S.vila];
    top.append(
      h('div', { class: 'quem' },
        h('div', { class: 'nome' }, S.nome + ' ' + S.sobrenome),
        h('div', { class: 'info' }, v.ic + ' ' + v.n + ' · ' + S.idade + (S.idade === 1 ? ' ano' : ' anos') + ' · ' + status(S))),
      h('div', { class: 'grana' + (S.dinheiro < 0 ? ' neg' : '') }, '💴 ' + fmt(S.dinheiro)),
    );
  }

  function renderLog(animar) {
    const log = document.getElementById('log');
    if (!log) return;
    limpar(log);
    S.log.forEach((sec, idx) => {
      const ultimo = idx === S.log.length - 1;
      log.append(h('div', { class: 'sec-h' }, sec.idade === 0 ? '👶 Nascimento' : 'Idade ' + sec.idade));
      sec.itens.forEach((it) => log.append(h('div', { class: 'item ' + it.k + (animar && ultimo ? ' novo' : '') }, it.t)));
    });
    log.scrollTop = log.scrollHeight;
  }

  function renderBarras() {
    const bars = document.getElementById('bars');
    if (!bars) return;
    limpar(bars);
    NL.ATRIBUTOS.forEach((a) => {
      bars.append(h('div', { class: 'bar' },
        h('div', { class: 'l' }, h('span', {}, a.ic + ' ' + a.n.slice(0, 5) + (a.n.length > 5 ? '.' : '')), h('b', {}, Math.round(S[a.k]))),
        h('div', { class: 'trilho' }, h('i', { style: { width: clamp(S[a.k]) + '%', background: a.cor } }))));
    });
  }

  function renderNav() {
    const nav = document.getElementById('nav');
    if (!nav) return;
    limpar(nav);
    const b = (ic, txt, fn, extra) => h('button', { onclick: fn }, h('span', { class: 'ic' }, ic), txt, extra || null);
    nav.append(
      b('💼', 'Ocupação', () => abrirSheet('💼 Ocupação', sheetOcupacao)),
      b('📋', 'Ficha', () => abrirSheet('📋 Ficha', sheetFicha)),
      h('button', { class: 'idade', onclick: clicarIdade, disabled: busy }, h('span', { class: 'ic' }, S.vivo ? '➕' : '🪦'), S.vivo ? 'IDADE' : 'FIM'),
      b('👪', 'Relações', () => abrirSheet('👪 Relações', sheetRelacoes)),
      b('⚡', 'Atividades', () => abrirSheet('⚡ Atividades', sheetAtividades), S.vivo && S.acoes > 0 ? h('span', { class: 'badge' }, S.acoes) : null),
    );
  }

  // ---------- avançar idade ----------
  function clicarIdade() {
    if (busy) return;
    if (!S.vivo) { mostrarMorte(); return; }
    if (sheet) fecharSheet();
    busy = true;
    const r = NL.avancar(S);
    NL.salvar(S);
    vibrar(25);
    renderTudo(true);
    if (r.morreu) { setTimeout(() => { busy = false; renderNav(); mostrarMorte(); }, 650); return; }
    if (!r.eventos.length) { busy = false; renderNav(); return; }
    renderNav();
    setTimeout(() => mostrarEventos(r.eventos.slice(), () => {
      NL.salvar(S); busy = false; renderTudo(false);
      if (!S.vivo) mostrarMorte();
    }), 350);
  }

  // ---------- eventos (decisões) ----------
  function mostrarEventos(fila, fim) {
    if (!fila.length) { fim(); return; }
    const id = fila.shift();
    const ev = NL.prepararEvento(S, id);
    const ov = h('div', { class: 'overlay centro' });
    const modal = h('div', { class: 'modal' },
      h('div', { class: 'em' }, ev.emoji),
      h('h3', {}, ev.titulo),
      h('p', {}, ev.texto),
      h('div', { class: 'opcoes' }, ev.opcoes.map((o) => h('button', {
        class: 'btn ' + (o.ok ? '' : 'sec'), disabled: !o.ok,
        onclick: () => {
          const res = NL.escolher(S, id, o.i);
          NL.salvar(S); vibrar(15);
          limpar(modal);
          modal.append(
            h('div', { class: 'em' }, ev.emoji),
            h('h3', {}, ev.titulo),
            h('div', { class: 'res ' + (res.k || '') }, res.t),
            btn('Continuar', () => { ov.remove(); renderTudo(true); if (!S.vivo) { fim(); return; } mostrarEventos(fila, fim); }, 'full'),
          );
        },
      }, o.rotulo))),
    );
    ov.append(modal);
    app.append(ov);
  }

  // ---------- morte ----------
  function mostrarMorte() {
    if (app.querySelector('.morte')) return;
    const r = NL.resumo(S);
    NL.salvar(S);
    const ov = h('div', { class: 'overlay centro' });
    ov.append(h('div', { class: 'modal morte' },
      h('div', { class: 'em' }, '🪦'),
      h('h3', {}, r.nome),
      h('p', {}, 'Morreu aos ' + r.idade + ' anos. ' + (r.causa || '')),
      h('div', { class: 'kv' }, h('span', {}, 'Última ocupação'), h('span', {}, r.patente)),
      h('div', { class: 'kv' }, h('span', {}, 'Missões concluídas'), h('span', {}, String(r.missoes))),
      h('div', { class: 'kv' }, h('span', {}, 'Amigos'), h('span', {}, String(r.amigos))),
      h('div', { class: 'kv' }, h('span', {}, 'Dinheiro'), h('span', {}, fmt(r.dinheiro) + ' ryō')),
      h('div', { class: 'opcoes', style: { marginTop: '16px' } },
        btn('🔁 Nova vida', () => { NL.apagar(); telaMenu(); }, 'full'),
        btn('📜 Ver histórico', () => ov.remove(), 'sec full')),
    ));
    app.append(ov);
  }

  // =====================================================
  // SHEETS (abas)
  // =====================================================
  function abrirSheet(titulo, build) {
    sheet = { titulo, build, pessoaId: null };
    renderSheet();
  }
  function fecharSheet() {
    sheet = null;
    const o = app.querySelector('.overlay.sheet');
    if (o) o.remove();
    renderNav();
  }
  function renderSheet() {
    let ov = app.querySelector('.overlay.sheet');
    if (!sheet) { if (ov) ov.remove(); return; }
    let body;
    if (!ov) {
      body = h('div', { class: 'panel-b' });
      ov = h('div', { class: 'overlay sheet', onclick: (ev) => { if (ev.target === ov) fecharSheet(); } },
        h('div', { class: 'panel' },
          h('div', { class: 'panel-h' }, h('span', { id: 'sheet-t' }), h('button', { class: 'x', onclick: fecharSheet }, '✕')),
          body));
      app.append(ov);
    } else body = ov.querySelector('.panel-b');
    const rolagem = body.scrollTop;
    limpar(body);
    ov.querySelector('#sheet-t').textContent = sheet.titulo;
    sheet.build(body);
    body.scrollTop = rolagem;
    renderNav();
  }
  const atualizar = () => { NL.salvar(S); renderTudo(true); };

  const kv = (a, b) => h('div', { class: 'kv' }, h('span', {}, a), h('span', {}, b));

  // ---------- Ocupação ----------
  function sheetOcupacao(body) {
    const s = S;
    if (!s.vivo) { body.append(h('div', { class: 'card' }, h('p', {}, 'Você não está mais entre nós.'))); return; }
    if (s.idade < 6) {
      body.append(h('div', { class: 'card' }, h('h4', {}, '👶 Infância'), h('p', {}, 'Você ainda é pequeno demais para estudar ou trabalhar. Aos 6 anos você escolherá seu caminho: Academia Ninja, escola comum ou trabalho com a família.')));
      return;
    }
    if (s.caminho === 'academia' && !s.ninja) {
      body.append(h('div', { class: 'card' },
        h('h4', {}, '🥷 Academia Ninja'),
        h('p', {}, 'Média das notas: ' + Math.round(NL.mediaNotas(s)) + ' · Controle de chakra: ' + s.chakra),
        s.flags.reprovou ? h('p', {}, 'Reprovações no exame de graduação: ' + s.flags.reprovou) : null,
        h('p', {}, 'O Exame de Graduação acontece a partir dos 12 anos. Estude e treine para passar.')));
    }
    if (s.caminho === 'escola') body.append(h('div', { class: 'card' }, h('h4', {}, '📚 Escola comum'), h('p', {}, 'Média das notas: ' + Math.round(NL.mediaNotas(s)) + '. Aos 12 anos você conclui os estudos básicos.')));
    if (s.caminho === 'trabalho' && !s.emprego) body.append(h('div', { class: 'card' }, h('h4', {}, '🌾 Ajudando a família'), h('p', {}, 'Aos 12 anos você poderá procurar um emprego.')));

    if (s.ninja) {
      const ranks = NL.MISSOES_POR_PATENTE[s.ninja] || [];
      body.append(h('div', { class: 'card' },
        h('h4', {}, '🥷 ' + s.ninja + ' de ' + NL.VILAS[s.vila].n),
        h('p', {}, 'Missões concluídas: ' + s.missoes + (s.equipe ? ' · Time ' + s.equipe : '')),
        h('p', {}, 'Ações restantes neste ano: ' + s.acoes + '/3')));
      body.append(h('div', { class: 'h5' }, 'Missões disponíveis'));
      ranks.forEach((rk) => {
        const m = NL.MISSOES[rk];
        const risco = { D: 'Baixo', C: 'Moderado', B: 'Alto', A: 'Muito alto' }[rk];
        body.append(h('button', {
          class: 'row', disabled: s.acoes <= 0,
          onclick: () => {
            const r = NL.missao(s, rk);
            toast(r.t, r.k);
            atualizar();
            if (!s.vivo) { fecharSheet(); setTimeout(mostrarMorte, 500); }
          },
        },
        h('div', { class: 'av' }, { D: '📜', C: '🗡️', B: '⚔️', A: '🔥' }[rk]),
        h('div', { class: 'mid' }, h('div', { class: 't' }, 'Missão rank ' + rk), h('div', { class: 's' }, fmt(m.pay[0]) + ' a ' + fmt(m.pay[1]) + ' ryō · Risco ' + risco))));
      });
      body.append(h('div', { style: { marginTop: '14px' } }, btn('🚪 Abandonar a vida ninja', () => {
        if (window.confirm('Abandonar a carreira ninja? Você não poderá voltar.')) { NL.largarNinja(s); atualizar(); }
      }, 'sec sm')));
      return;
    }

    if (NL.podeTrabalhar(s)) {
      if (s.emprego) {
        body.append(h('div', { class: 'card' },
          h('h4', {}, '💼 ' + s.emprego.n),
          h('p', {}, 'Salário: ' + fmt(s.emprego.sal) + ' ryō por ano'),
          h('div', { class: 'acoes' }, btn('Pedir demissão', () => { NL.demitir(s); atualizar(); }, 'sec sm'))));
      } else {
        body.append(h('div', { class: 'h5' }, 'Vagas de emprego'));
        NL.empregosDisponiveis(s).forEach((j) => {
          const tentado = s.flags.cand[j.id] === s.idade;
          body.append(h('button', {
            class: 'row', disabled: tentado,
            onclick: () => { const r = NL.candidatar(s, j.id); toast(r.t, r.ok && r.t.startsWith('Contratado') ? 'bom' : 'ruim'); atualizar(); },
          },
          h('div', { class: 'av' }, '💼'),
          h('div', { class: 'mid' }, h('div', { class: 't' }, j.n), h('div', { class: 's' }, j.desc)),
          h('div', { class: 'custo' }, tentado ? 'Tentado' : fmt(j.sal) + '/ano')));
        });
      }
    }
  }

  // ---------- Ficha ----------
  function sheetFicha(body) {
    const s = S;
    const v = NL.VILAS[s.vila];
    const cla = s.cla !== 'comum' ? NL.CLAS[s.cla] : null;
    body.append(h('div', { class: 'card' },
      kv('Nome', s.nome + ' ' + s.sobrenome),
      kv('Sexo', s.sexo === 'F' ? 'Feminino' : 'Masculino'),
      kv('Idade', s.idade + (s.vivo ? '' : ' (falecido)')),
      kv('Vila', v.ic + ' ' + v.n),
      kv('País', v.pais),
      kv('Clã', cla ? cla.n : 'Família comum'),
      kv('Família', NL.RIQUEZA[s.riqueza].n),
      kv('Ocupação', status(s)),
      kv('Dinheiro', fmt(s.dinheiro) + ' ryō'),
      kv('Moradia', s.independente ? 'Mora sozinho(a)' : 'Com a família'),
    ));
    body.append(h('div', { class: 'h5' }, 'Chakra'));
    const kgTxt = s.kg ? (s.kgDesperto || s.kgConhecido ? NL.KG[s.kg].ic + ' ' + NL.KG[s.kg].n + (s.kgDesperto ? '' : ' (adormecido)') : '❓ Ainda desconhecido') : 'Nenhum';
    body.append(h('div', { class: 'card' },
      kv('Chakra liberado', s.chakraLiberado ? 'Sim' : 'Ainda não'),
      kv('Controle de chakra', s.chakra + '/100'),
      kv('Elementos', s.elementosConhecidos ? s.elementos.map((e) => NL.ELEMENTOS[e].ic + ' ' + NL.ELEMENTOS[e].n).join(', ') : '❓ Ainda não descobertos'),
      kv('Kekkei Genkai', kgTxt)));
    body.append(h('div', { class: 'h5' }, 'Atributos'));
    const card = h('div', { class: 'card' });
    NL.ATRIBUTOS.forEach((a) => card.append(h('div', { style: { marginBottom: '10px' } },
      h('div', { class: 'kv', style: { border: 0, padding: '0 0 4px' } }, h('span', {}, a.ic + ' ' + a.n), h('span', {}, Math.round(s[a.k]) + '/100')),
      h('div', { class: 'trilho' }, h('i', { style: { width: clamp(s[a.k]) + '%', background: a.cor } })))));
    body.append(card);
    if (s.notas.length) body.append(h('div', { class: 'card' }, kv('Média das notas', String(Math.round(NL.mediaNotas(s))))));
  }

  // ---------- Relações ----------
  const AV = { pai: '👨', mae: '👩', irmao: '👦', irma: '👧', amigo: '🧑', sensei: '🥷', colega: '🥷' };
  const ROT = { pai: 'Pai', mae: 'Mãe', irmao: 'Irmão', irma: 'Irmã', amigo: 'Amigo(a)', sensei: 'Sensei', colega: 'Colega de equipe' };

  function sheetRelacoes(body) {
    if (sheet.pessoaId) { detalhePessoa(body); return; }
    const vivos = S.pessoas.filter((p) => p.vivo);
    const grupo = (titulo, tipos) => {
      const l = vivos.filter((p) => tipos.includes(p.tipo));
      if (!l.length) return;
      body.append(h('div', { class: 'h5' }, titulo));
      l.forEach((p) => body.append(linhaPessoa(p)));
    };
    grupo('Família', ['pai', 'mae', 'irmao', 'irma']);
    grupo('Equipe ninja', ['sensei', 'colega']);
    grupo('Amigos', ['amigo']);
    const mortos = S.pessoas.filter((p) => !p.vivo);
    if (mortos.length) {
      body.append(h('div', { class: 'h5' }, 'Em memória'));
      mortos.forEach((p) => body.append(h('div', { class: 'row' }, h('div', { class: 'av' }, '🪦'), h('div', { class: 'mid' }, h('div', { class: 't' }, p.nome), h('div', { class: 's' }, ROT[p.tipo])))));
    }
    if (!vivos.length) body.append(h('div', { class: 'card' }, h('p', {}, 'Você está sozinho(a) por enquanto. Use “Fazer amigos” em Atividades.')));
  }

  function linhaPessoa(p) {
    return h('button', { class: 'row', onclick: () => { sheet.pessoaId = p.id; renderSheet(); } },
      h('div', { class: 'av' }, AV[p.tipo] || '🧑'),
      h('div', { class: 'mid' },
        h('div', { class: 't' }, p.nome),
        h('div', { class: 's' }, ROT[p.tipo] + ' · ' + p.idade + ' anos' + (p.ocup ? ' · ' + p.ocup : '')),
        h('div', { class: 'mini' }, h('i', { style: { width: p.rel + '%' } }))),
      h('div', { class: 'custo' }, p.rel + '%'));
  }

  function detalhePessoa(body) {
    const p = S.pessoas.find((x) => x.id === sheet.pessoaId);
    if (!p || !p.vivo) { sheet.pessoaId = null; renderSheet(); return; }
    body.append(btn('← Voltar', () => { sheet.pessoaId = null; renderSheet(); }, 'sec sm'));
    body.append(h('div', { class: 'card', style: { marginTop: '12px', textAlign: 'center' } },
      h('div', { style: { fontSize: '48px' } }, AV[p.tipo] || '🧑'),
      h('h4', {}, p.nome),
      h('p', {}, ROT[p.tipo] + ' · ' + p.idade + ' anos' + (p.ocup ? ' · ' + p.ocup : '')),
      h('div', { class: 'mini', style: { marginTop: '8px' } }, h('i', { style: { width: p.rel + '%' } })),
      h('p', {}, 'Relacionamento: ' + p.rel + '%')));
    NL.acoesPessoa(S, p).forEach(([id, rot]) => {
      body.append(h('button', {
        class: 'row',
        onclick: () => { const r = NL.interagir(S, p.id, id); toast(r.t, r.ok ? 'bom' : 'ruim'); atualizar(); },
      }, h('div', { class: 'mid' }, h('div', { class: 't' }, rot))));
    });
    body.append(h('p', { class: 'dica' }, 'Você pode interagir uma vez por ano com cada pessoa.'));
  }

  // ---------- Atividades ----------
  function sheetAtividades(body) {
    const s = S;
    if (!s.vivo) { body.append(h('div', { class: 'card' }, h('p', {}, 'Você não está mais entre nós.'))); return; }
    body.append(h('div', { class: 'card' }, h('h4', {}, '⚡ Ações restantes: ' + s.acoes + '/3'), h('p', {}, 'Cada atividade ou missão consome uma ação. As ações voltam a cada novo ano.')));
    const lista = NL.atividadesDisponiveis(s);
    lista.forEach((a) => {
      const c = NL.custoReal(s, a);
      const bloqueado = s.acoes <= 0 || (c > 0 && c > s.dinheiro);
      body.append(h('button', {
        class: 'row', disabled: bloqueado,
        onclick: () => { const r = NL.fazerAtividade(s, a.id); toast(r.t, r.k); atualizar(); if (!s.vivo) { fecharSheet(); setTimeout(mostrarMorte, 500); } },
      },
      h('div', { class: 'av' }, a.ic),
      h('div', { class: 'mid' }, h('div', { class: 't' }, a.n)),
      c ? h('div', { class: 'custo' }, fmt(c) + ' ryō') : null));
    });
    if (s.idade < 4) body.append(h('p', { class: 'dica' }, 'Mais atividades ficam disponíveis conforme você cresce.'));
  }

  telaMenu();
})();
