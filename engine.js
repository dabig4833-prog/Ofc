(function (g) {
  'use strict';
  const NL = (g.NL = g.NL || {});

  // ---------- utilidades ----------
  const R = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const chance = (p) => Math.random() < p;
  const clamp = (v, a = 0, b = 100) => Math.max(a, Math.min(b, v));
  const fmt = (n) => Math.round(n).toLocaleString('pt-BR');
  NL.util = { R, pick, chance, clamp, fmt };

  let _id = 0;
  const uid = () => 'p' + Date.now().toString(36) + (_id++);

  function pickPeso(obj, excluir) {
    const ex = excluir || [];
    const ent = Object.entries(obj).filter(([k]) => !ex.includes(k));
    const total = ent.reduce((a, [, w]) => a + w, 0);
    let r = Math.random() * total;
    for (const [k, w] of ent) { r -= w; if (r <= 0) return k; }
    return ent[ent.length - 1][0];
  }

  const nomeAleatorio = (sexo) => pick(sexo === 'F' ? NL.NOMES_F : NL.NOMES_M);
  NL.nomeAleatorio = nomeAleatorio;

  // ---------- log ----------
  function novaSecao(s) { s.log.push({ idade: s.idade, itens: [] }); }
  function L(s, texto, tipo) { s.log[s.log.length - 1].itens.push({ t: texto, k: tipo || 'info' }); }

  // ---------- helpers de estado ----------
  const mod = (s, k, n) => { s[k] = clamp((s[k] || 0) + n); return s[k]; };
  const pais = (s) => s.pessoas.filter((p) => (p.tipo === 'pai' || p.tipo === 'mae') && p.vivo);
  const irmaos = (s) => s.pessoas.filter((p) => (p.tipo === 'irmao' || p.tipo === 'irma') && p.vivo);
  const amigos = (s) => s.pessoas.filter((p) => p.tipo === 'amigo' && p.vivo);
  const relMod = (p, n) => { p.rel = clamp(p.rel + n); };
  const poder = (s) => s.forca * 0.2 + s.vel * 0.2 + s.res * 0.2 + s.disc * 0.15 + s.intel * 0.1 + s.chakra * 0.15;
  const mediaNotas = (s) => (s.notas.length ? s.notas.reduce((a, b) => a + b, 0) / s.notas.length : 40);
  NL.poder = poder;
  NL.mediaNotas = mediaNotas;
  NL.pais = pais;

  function novaPessoa(tipo, nome, idade, rel) {
    return { id: uid(), tipo, nome, idade, vivo: true, rel, ult: -1, ocup: null };
  }
  function novoAmigo(s) {
    const sexo = pick(['M', 'F']);
    const p = novaPessoa('amigo', nomeAleatorio(sexo) + ' ' + pick(NL.SOBRENOMES), Math.max(0, s.idade + R(-1, 1)), R(30, 55));
    s.pessoas.push(p);
    return p;
  }

  function letra(n) { return n >= 85 ? 'A' : n >= 70 ? 'B' : n >= 55 ? 'C' : n >= 40 ? 'D' : 'F'; }

  // ---------- morte ----------
  function chanceMorte(idade, saude) {
    let p = idade <= 1 ? 0.02 : 0.0015;
    p += Math.max(0, 50 - saude) / 900;
    if (idade > 50) p += (idade - 50) * 0.004;
    if (idade > 70) p += (idade - 70) * 0.02;
    return Math.min(p, 0.9);
  }
  function causaNatural(s) {
    if (s.idade < 6) return 'Uma doença infantil.';
    if (s.idade < 45) return pick(['Uma doença súbita.', 'Complicações de uma infecção.', 'Um acidente doméstico.']);
    return 'Causas naturais.';
  }
  function morrer(s, causa) {
    s.vivo = false;
    s.causa = causa;
    L(s, '💀 ' + s.nome + ' ' + s.sobrenome + ' morreu aos ' + s.idade + ' anos. ' + causa, 'ruim');
  }
  function matarPessoa(s, p, motivo) {
    p.vivo = false;
    const rotulo = { pai: 'Seu pai', mae: 'Sua mãe', irmao: 'Seu irmão', irma: 'Sua irmã' }[p.tipo] || p.nome;
    L(s, '🕯️ ' + rotulo + ' (' + p.nome + ') faleceu. ' + (motivo || ''), 'ruim');
    if (p.tipo === 'pai' || p.tipo === 'mae') {
      if (chance(0.5)) s.riqueza = Math.max(0, s.riqueza - 1);
      if (pais(s).length === 0 && s.idade < 14) {
        s.riqueza = 0;
        L(s, 'Você ficou órfão(ã) e passou a depender da ajuda da vila.', 'ruim');
      }
    }
  }

  // ---------- criação de vida ----------
  NL.cfgAleatoria = function () {
    const vila = pick(Object.keys(NL.VILAS));
    const clas = NL.VILAS[vila].clas;
    const cla = clas.length && chance(0.35) ? pick(clas) : 'comum';
    const sexo = pick(['M', 'F']);
    return {
      modo: 'aleatorio', nome: '', sobrenome: '', sexo, vila, cla,
      riqueza: -1, elementos: [], kgModo: 'auto',
      irmaos: pick([0, 0, 1, 1, 2, 3]),
      estrutura: chance(0.88) ? 'ambos' : pick(['mae', 'pai', 'orfao']),
    };
  };

  NL.criarVida = function (cfg) {
    const vila = NL.VILAS[cfg.vila];
    const cla = cfg.cla !== 'comum' ? NL.CLAS[cfg.cla] : null;
    const sexo = cfg.sexo || 'M';
    const sobrenome = (cfg.sobrenome || '').trim() || (cla ? cla.sobrenome : pick(NL.SOBRENOMES));
    const nome = (cfg.nome || '').trim() || nomeAleatorio(sexo);
    const estrutura = cfg.estrutura || 'ambos';
    let riqueza = cfg.riqueza >= 0 ? cfg.riqueza : Number(pickPeso({ 0: 20, 1: 35, 2: 25, 3: 15, 4: 5 }));
    if (estrutura === 'orfao') riqueza = 0;

    let el = (cfg.elementos || []).slice(0, 3);
    if (!el.length) {
      const n = chance(0.65) ? 1 : chance(0.85) ? 2 : 3;
      while (el.length < n) el.push(pickPeso(vila.pesos, el));
    }

    let kg = null;
    if (cfg.kgModo === 'raro') kg = pick(NL.KG_RARO);
    else if (cfg.kgModo !== 'nenhum') {
      if (cla && cla.kg) kg = cla.kg;
      else if (chance(0.04)) kg = pick(NL.KG_RARO);
    }

    const b = cla ? cla.bonus : {};
    const s = {
      v: 1, modo: cfg.modo || 'config',
      nome, sobrenome, sexo, vila: cfg.vila, cla: cfg.cla,
      kg, kgDesperto: false, kgConhecido: cfg.modo === 'config' && !!kg,
      elementos: el, elementosConhecidos: cfg.modo === 'config',
      riqueza, idade: 0, vivo: true, causa: null,
      dinheiro: 0,
      saude: clamp(R(70, 95) + (riqueza - 2) * 2),
      intel: clamp(R(8, 14) + (b.intel || 0)),
      forca: clamp(R(5, 10) + (b.forca || 0)),
      vel: clamp(R(5, 10) + (b.vel || 0)),
      res: clamp(R(5, 10) + (b.res || 0)),
      disc: clamp(R(5, 10) + (b.disc || 0)),
      chakra: 0, chakraLiberado: false,
      caminho: null, notas: [], ninja: null, missoes: 0, equipe: null,
      emprego: null, independente: false, acoes: 3,
      pessoas: [], log: [], feitos: {}, flags: { reprovou: 0, desistiu: false, cand: {} },
    };

    // família
    const sirs = [];
    for (let i = 0; i < (cfg.irmaos || 0); i++) {
      const sx = pick(['M', 'F']);
      const ir = novaPessoa(sx === 'F' ? 'irma' : 'irmao', nomeAleatorio(sx) + ' ' + sobrenome, R(1, 8) + i, R(40, 80));
      sirs.push(ir);
    }
    const maxIr = sirs.reduce((a, p) => Math.max(a, p.idade), 0);
    const ocupPai = cla && cla.ninja && chance(0.7) ? 'Shinobi' : pick(NL.EMPREGOS).n;
    const ocupMae = cla && cla.ninja && chance(0.5) ? 'Shinobi' : pick(NL.EMPREGOS).n;
    const pai = novaPessoa('pai', nomeAleatorio('M') + ' ' + sobrenome, Math.min(58, R(24, 36) + maxIr), R(55, 90));
    const mae = novaPessoa('mae', nomeAleatorio('F') + ' ' + sobrenome, Math.min(55, R(22, 34) + maxIr), R(60, 92));
    pai.ocup = ocupPai; mae.ocup = ocupMae;
    if (estrutura === 'mae' || estrutura === 'orfao') pai.vivo = false;
    if (estrutura === 'pai' || estrutura === 'orfao') mae.vivo = false;
    s.pessoas.push(pai, mae, ...sirs);

    novaSecao(s);
    const filho = sexo === 'F' ? 'filha' : 'filho';
    const vv = NL.VILAS[s.vila];
    let intro = 'Você nasceu em ' + vv.n + ' (' + vv.pais + '), ' + filho + ' de ' + pai.nome + ' e ' + mae.nome + '.';
    if (estrutura === 'mae') intro = 'Você nasceu em ' + vv.n + ' (' + vv.pais + '), ' + filho + ' de ' + mae.nome + '. Seu pai (' + pai.nome + ') já havia falecido.';
    if (estrutura === 'pai') intro = 'Você nasceu em ' + vv.n + ' (' + vv.pais + '), ' + filho + ' de ' + pai.nome + '. Sua mãe (' + mae.nome + ') morreu no parto.';
    if (estrutura === 'orfao') intro = 'Você nasceu em ' + vv.n + ' (' + vv.pais + ') e ficou órfão(ã) logo cedo. Seus pais eram ' + pai.nome + ' e ' + mae.nome + '.';
    L(s, '👶 ' + intro, 'bom');
    L(s, '💴 Sua família é ' + NL.RIQUEZA[riqueza].n.toLowerCase() + '.');
    if (cla) L(s, '🏯 Você pertence ao clã ' + cla.n + '. ' + cla.desc);
    else L(s, '🏠 Sua família é comum, sem clã.');
    if (sirs.length) L(s, '👨‍👩‍👧 Você tem ' + sirs.length + ' irmão(s) mais velho(s): ' + sirs.map((p) => p.nome.split(' ')[0]).join(', ') + '.');
    L(s, '📰 Neste mesmo ano nasceu Naruto Uzumaki. Você é da mesma geração dele.', 'noticia');
    if (s.vila === 'konoha') {
      L(s, '🌕 Na noite de 10 de outubro, a Kyuubi atacou Konoha. O Quarto Hokage deu a vida para selar a fera.', 'noticia');
      const pv = pais(s);
      if (pv.length && chance(0.2)) matarPessoa(s, pick(pv), 'Morreu durante o ataque da Kyuubi.');
    } else {
      L(s, '📰 O mundo ninja vive uma paz frágil depois da Terceira Guerra.', 'noticia');
    }
    return s;
  };

  // ---------- passagem de ano ----------
  function anoFamiliaEAmigos(s) {
    for (const p of s.pessoas.slice()) {
      if (!p.vivo) continue;
      p.idade++;
      const parente = ['pai', 'mae', 'irmao', 'irma'].includes(p.tipo);
      if (parente) {
        let pm = chanceMorte(p.idade, 75);
        if (p.ocup === 'Shinobi') pm *= 2;
        if (p.tipo === 'irmao' || p.tipo === 'irma') pm *= 0.6;
        if (chance(pm)) { matarPessoa(s, p, p.idade > 55 ? 'Causas naturais.' : pick(['Uma doença.', 'Um acidente.', 'Uma missão que não deu certo.'])); continue; }
      }
      if (p.ult !== s.idade - 1) relMod(p, -R(0, 3));
      if (p.tipo === 'amigo' && p.rel < 12 && chance(0.25)) {
        p.afastado = true; p.vivo = false;
        L(s, '👋 Você e ' + p.nome.split(' ')[0] + ' se afastaram e perderam o contato.');
      }
      if (p.tipo === 'amigo' && p.rel >= 12 && chance(0.04)) {
        p.afastado = true; p.vivo = false;
        L(s, '🧳 ' + p.nome.split(' ')[0] + ' se mudou para outra cidade.');
      }
    }
    s.pessoas = s.pessoas.filter((p) => !p.afastado);
  }

  function anoCrescimento(s) {
    const i = s.idade;
    if (i <= 20) { ['forca', 'vel', 'res'].forEach((k) => mod(s, k, R(1, 3))); }
    else if (i <= 35) { ['forca', 'vel', 'res'].forEach((k) => mod(s, k, R(0, 1))); }
    else if (i >= 45) {
      ['forca', 'vel', 'res'].forEach((k) => { if (chance(s.ninja ? 0.35 : 0.55)) mod(s, k, -R(1, 2)); });
    }
    if (s.ninja && i > 20) ['forca', 'vel', 'res', 'disc'].forEach((k) => { if (chance(0.3)) mod(s, k, 1); });
    let d = R(-2, 2) + (s.res >= 50 ? 1 : 0);
    if (i >= 40) d -= R(0, 2);
    if (i >= 60) d -= R(1, 3);
    mod(s, 'saude', d);
    if (chance(0.07)) {
      const dano = R(5, 20);
      mod(s, 'saude', -dano);
      L(s, '🤒 Você ficou doente (Saúde -' + dano + ').', 'ruim');
    }
  }

  function anoEducacao(s) {
    const i = s.idade;
    const nota = () => {
      const n = clamp(Math.round(20 + s.intel * 0.5 + s.disc * 0.25 + R(0, 25)));
      s.notas.push(n);
      return n;
    };
    if (s.caminho === 'academia' && !s.ninja) {
      if (i > 17) {
        s.caminho = 'civil';
        L(s, '🚪 Você deixou a Academia Ninja de vez.');
        return;
      }
      mod(s, 'intel', R(2, 4)); mod(s, 'disc', R(1, 3));
      if (i >= 8) {
        if (!s.chakraLiberado) {
          s.chakraLiberado = true;
          L(s, '🌀 Na Academia você aprendeu a sentir e moldar seu chakra.', 'bom');
        }
        mod(s, 'chakra', R(3, 6));
      }
      const n = nota();
      L(s, '🏫 Academia Ninja: sua nota neste ano foi ' + n + ' (' + letra(n) + ').');
      if (i === 11 && !s.elementosConhecidos) {
        s.elementosConhecidos = true;
        L(s, '📄 Teste do papel de chakra: afinidade com ' + s.elementos.map((e) => NL.ELEMENTOS[e].ic + ' ' + NL.ELEMENTOS[e].n).join(' e ') + '!', 'bom');
      }
    } else if (s.caminho === 'escola') {
      mod(s, 'intel', R(1, 3));
      const n = nota();
      L(s, '🏫 Escola: sua nota neste ano foi ' + n + ' (' + letra(n) + ').');
      if (i >= 12) {
        s.caminho = 'civil';
        L(s, '🎓 Você concluiu os estudos básicos e já pode procurar trabalho.', 'bom');
      }
    } else if (s.caminho === 'trabalho') {
      mod(s, 'intel', R(0, 1));
      if (i >= 12) s.caminho = 'civil';
    } else if (i > 0 && i < 6) {
      mod(s, 'intel', R(1, 2));
      const marcos = { 1: 'Você deu seus primeiros passos.', 2: 'Você falou suas primeiras palavras.', 3: 'Você começou a explorar a vila com curiosidade.', 4: 'Você adora ouvir histórias de ninjas.', 5: 'Você já sabe correr mais rápido que os vizinhos.' };
      if (marcos[i]) L(s, '🍼 ' + marcos[i]);
    }
  }

  function anoDinheiro(s) {
    if (s.emprego) {
      s.dinheiro += s.emprego.sal;
      L(s, '💼 Salário de ' + s.emprego.n + ': +' + fmt(s.emprego.sal) + ' ryō.', 'bom');
      if (s.disc < 20 && chance(0.1)) {
        L(s, '📉 Você foi demitido por falta de comprometimento.', 'ruim');
        s.emprego = null;
      } else if (chance(0.25)) {
        s.emprego.sal = Math.round((s.emprego.sal * 1.05) / 100) * 100;
        L(s, '📈 Você recebeu um pequeno aumento.', 'bom');
      }
    }
    if (s.independente) {
      const custo = 9000;
      s.dinheiro -= custo;
      L(s, '🏠 Custos de vida: -' + fmt(custo) + ' ryō.');
      if (s.dinheiro < 0) {
        mod(s, 'saude', -2);
        L(s, '⚠️ Você está endividado (' + fmt(s.dinheiro) + ' ryō).', 'ruim');
      }
    }
  }

  function virarGenin(s) {
    s.ninja = 'Genin'; s.caminho = 'ninja';
    s.chakraLiberado = true; s.chakra = Math.max(s.chakra, 8);
    const nTime = R(1, 30);
    const sexoS = pick(['M', 'F']);
    const sensei = novaPessoa('sensei', nomeAleatorio(sexoS) + ' ' + pick(NL.SOBRENOMES), R(26, 40), R(25, 45));
    sensei.ocup = 'Jounin';
    const c1 = novaPessoa('colega', nomeAleatorio(pick(['M', 'F'])) + ' ' + pick(NL.SOBRENOMES), s.idade + R(-1, 1), R(25, 50));
    const c2 = novaPessoa('colega', nomeAleatorio(pick(['M', 'F'])) + ' ' + pick(NL.SOBRENOMES), s.idade + R(-1, 1), R(25, 50));
    s.pessoas.push(sensei, c1, c2);
    s.equipe = nTime;
    return { t: '🥷 Você se formou e virou Genin! Time ' + nTime + ', sob o comando de ' + sensei.nome + ', com ' + c1.nome.split(' ')[0] + ' e ' + c2.nome.split(' ')[0] + '.', k: 'bom' };
  }

  NL.avancar = function (s) {
    const r = { morreu: false, eventos: [] };
    if (!s.vivo) { r.morreu = true; return r; }
    s.idade++;
    s.acoes = 3;
    novaSecao(s);
    anoFamiliaEAmigos(s);
    anoCrescimento(s);
    anoEducacao(s);
    anoDinheiro(s);

    if (s.saude <= 0) morrer(s, 'Complicações de saúde.');
    else if (chance(chanceMorte(s.idade, s.saude))) morrer(s, causaNatural(s));
    else if (s.idade >= 95) morrer(s, 'Velhice.');
    if (!s.vivo) { r.morreu = true; return r; }

    NL.NOTICIAS.filter((n) => n.idade === s.idade).forEach((n) => L(s, '📰 ' + n.texto, 'noticia'));

    for (const ev of NL.EVENTOS) {
      if (!ev.prio) continue;
      if (ev.uma && s.feitos[ev.id]) continue;
      if (!ev.cond(s)) continue;
      if (ev.opcoes) r.eventos.push(ev.id);
      else aplicarAuto(s, ev);
    }
    if (chance(0.78)) {
      const lst = NL.EVENTOS.filter((e) => !e.prio && (!e.uma || !s.feitos[e.id]) && s.idade >= (e.min == null ? 0 : e.min) && s.idade <= (e.max == null ? 200 : e.max) && (!e.cond || e.cond(s)));
      if (lst.length) {
        const total = lst.reduce((a, e) => a + (e.peso || 1), 0);
        let x = Math.random() * total;
        let ev = lst[lst.length - 1];
        for (const e of lst) { x -= e.peso || 1; if (x <= 0) { ev = e; break; } }
        if (ev.opcoes) r.eventos.push(ev.id);
        else aplicarAuto(s, ev);
      }
    }
    if (!s.vivo) r.morreu = true;
    if (s.vivo && !r.eventos.length && !s.log[s.log.length - 1].itens.length) {
      L(s, pick(['🌤️ Foi um ano tranquilo.', '🍃 Os dias passaram sem grandes novidades.', '🌙 Mais um ano na vila, sem sobressaltos.', '🏮 Um ano comum, com pequenos momentos felizes.']));
    }
    return r;
  };

  function aplicarAuto(s, ev) {
    const out = ev.auto(s);
    if (ev.uma) s.feitos[ev.id] = true;
    const o = typeof out === 'string' ? { t: out, k: 'info' } : out;
    if (o && o.t) L(s, ev.emoji + ' ' + o.t, o.k);
  }

  const evPorId = (id) => NL.EVENTOS.find((e) => e.id === id);

  NL.prepararEvento = function (s, id) {
    const ev = evPorId(id);
    return {
      id: ev.id, emoji: ev.emoji, titulo: ev.titulo,
      texto: typeof ev.texto === 'function' ? ev.texto(s) : ev.texto,
      opcoes: ev.opcoes.map((o, i) => ({ i, rotulo: o.rotulo, ok: !o.cond || o.cond(s) })),
    };
  };

  NL.escolher = function (s, id, i) {
    const ev = evPorId(id);
    const out = ev.opcoes[i].fn(s);
    if (ev.uma || ev.prio) s.feitos[ev.id] = true;
    const o = typeof out === 'string' ? { t: out, k: 'info' } : out;
    L(s, ev.emoji + ' ' + ev.titulo + ' — ' + o.t, o.k);
    return o;
  };

  // ---------- eventos ----------
  const e = (def) => def;
  NL.EVENTOS = [
    e({
      id: 'nasc_irmao', emoji: '🍼', min: 2, max: 10, uma: true, peso: 1,
      cond: (s) => pais(s).length === 2 && !s.pessoas.some((p) => p.tipo === 'mae' && p.idade > 42),
      auto: (s) => {
        const sx = pick(['M', 'F']);
        const p = novaPessoa(sx === 'F' ? 'irma' : 'irmao', nomeAleatorio(sx) + ' ' + s.sobrenome, 0, R(50, 80));
        s.pessoas.push(p);
        return { t: 'Nasceu ' + (sx === 'F' ? 'sua irmãzinha ' : 'seu irmãozinho ') + p.nome.split(' ')[0] + '!', k: 'bom' };
      },
    }),
    e({
      id: 'brinca', emoji: '🌳', titulo: 'Brincadeira de criança', min: 3, max: 6, peso: 2,
      texto: () => 'Os outros pequenos estão brincando perto de uma árvore enorme.',
      opcoes: [
        { rotulo: 'Subir na árvore', fn: (s) => { mod(s, 'forca', 1); if (chance(0.3)) { mod(s, 'saude', -R(3, 7)); return { t: 'Você caiu do galho e se machucou.', k: 'ruim' }; } return { t: 'Você chegou ao topo! Força +1.', k: 'bom' }; } },
        { rotulo: 'Brincar com as crianças', fn: (s) => { const a = novoAmigo(s); return { t: 'Você fez amizade com ' + a.nome.split(' ')[0] + '.', k: 'bom' }; } },
        { rotulo: 'Ficar em casa observando', fn: (s) => { mod(s, 'intel', 2); return 'Você aprendeu muito só observando. Inteligência +2.'; } },
      ],
    }),
    e({
      id: 'emprego_pai', emoji: '💼', titulo: 'Proposta de emprego', min: 3, max: 16, uma: true, peso: 1,
      cond: (s) => pais(s).some((p) => p.tipo === 'pai'),
      texto: () => 'Seu pai recebeu uma proposta de emprego em outra região, com salário maior.',
      opcoes: [
        { rotulo: 'Torcer para ele aceitar', fn: (s) => { const p = s.pessoas.find((x) => x.tipo === 'pai'); s.riqueza = Math.min(4, s.riqueza + 1); relMod(p, -R(2, 8)); return { t: 'Ele aceitou. A família melhorou de vida, mas ele passa menos tempo em casa.', k: 'info' }; } },
        { rotulo: 'Pedir para ele ficar', fn: (s) => { const p = s.pessoas.find((x) => x.tipo === 'pai'); relMod(p, R(5, 10)); return { t: 'Ele recusou para ficar perto de você. O relacionamento melhorou.', k: 'bom' }; } },
      ],
    }),
    e({
      id: 'crianca', emoji: '🧒', titulo: 'Uma criança da sua idade', min: 4, max: 14, peso: 2.5,
      texto: () => 'Você conheceu uma criança da sua idade na rua.',
      opcoes: [
        { rotulo: 'Fazer amizade', fn: (s) => { const a = novoAmigo(s); return { t: 'Você e ' + a.nome.split(' ')[0] + ' ficaram amigos.', k: 'bom' }; } },
        { rotulo: 'Desafiar para uma corrida', fn: (s) => { if (chance(clamp(0.35 + s.vel / 120, 0.2, 0.85))) { mod(s, 'vel', 1); const a = novoAmigo(s); a.rel += 10; return { t: 'Você venceu e ganhou o respeito de ' + a.nome.split(' ')[0] + '. Velocidade +1.', k: 'bom' }; } mod(s, 'disc', 1); return 'Você perdeu, mas prometeu treinar mais. Disciplina +1.'; } },
        { rotulo: 'Ignorar', fn: () => 'Você seguiu seu caminho.' },
      ],
    }),
    e({
      id: 'dificuldade', emoji: '🪙', titulo: 'Dificuldades financeiras', min: 3, max: 17, peso: 1.2,
      cond: (s) => pais(s).length > 0 && s.riqueza <= 2,
      texto: () => 'Sua família está enfrentando dificuldades financeiras neste ano.',
      opcoes: [
        { rotulo: 'Ajudar com pequenos trabalhos', fn: (s) => { const v = R(300, 900); s.dinheiro += v; mod(s, 'disc', 2); return { t: 'Você ajudou e ganhou ' + fmt(v) + ' ryō. Disciplina +2.', k: 'bom' }; } },
        { rotulo: 'Consolar seus pais', fn: (s) => { pais(s).forEach((p) => relMod(p, R(3, 6))); return 'Seus pais agradeceram o apoio.'; } },
        { rotulo: 'Reclamar da situação', fn: (s) => { pais(s).forEach((p) => relMod(p, -R(3, 8))); return { t: 'Seus pais ficaram magoados.', k: 'ruim' }; } },
      ],
    }),
    e({
      id: 'professor', emoji: '👨‍🏫', titulo: 'Professor notou seu talento', min: 6, max: 12, uma: true, peso: 2,
      cond: (s) => (s.caminho === 'academia' || s.caminho === 'escola') && (s.intel >= 18 || s.disc >= 18),
      texto: () => 'Um professor percebeu seu talento e quer investir em você.',
      opcoes: [
        { rotulo: 'Aceitar aulas extras', fn: (s) => { mod(s, 'intel', 4); mod(s, 'disc', 2); mod(s, 'saude', -2); return { t: 'Você aprendeu muito. Inteligência +4, Disciplina +2.', k: 'bom' }; } },
        { rotulo: 'Agradecer e recusar', fn: () => 'Você preferiu brincar com os colegas.' },
      ],
    }),
    e({
      id: 'treino_oport', emoji: '🥋', titulo: 'Oportunidade de treinamento', min: 7, max: 15, peso: 2,
      cond: (s) => s.caminho === 'academia' || s.ninja,
      texto: () => 'Um veterano da vila ofereceu treinar você por uma semana.',
      opcoes: [
        { rotulo: 'Treino intenso', fn: (s) => { const k = pick(['forca', 'vel', 'res', 'disc']); mod(s, k, 4); if (chance(0.2)) { mod(s, 'saude', -R(4, 9)); return { t: 'Foi puxado e você se machucou, mas evoluiu bastante.', k: 'info' }; } return { t: 'Você evoluiu bastante.', k: 'bom' }; } },
        { rotulo: 'Treino leve', fn: (s) => { mod(s, 'forca', 1); mod(s, 'vel', 1); mod(s, 'res', 1); return 'Você ganhou +1 em força, velocidade e resistência.'; } },
        { rotulo: 'Recusar', fn: () => 'Você deixou a oportunidade passar.' },
      ],
    }),
    e({
      id: 'treino_cla', emoji: '🏯', min: 6, max: 14, peso: 1.5,
      cond: (s) => s.cla !== 'comum',
      auto: (s) => { const b = NL.CLAS[s.cla].bonus; const k = pick(Object.keys(b)); mod(s, k, 3); return { t: 'Seu clã ensinou um treino tradicional. ' + NL.ATRIBUTOS.find((a) => a.k === k).n + ' +3.', k: 'bom' }; },
    }),
    e({
      id: 'briga_irmao', emoji: '🥊', titulo: 'Briga entre irmãos', min: 4, max: 17, peso: 1.5,
      cond: (s) => irmaos(s).length > 0,
      texto: (s) => 'Você discutiu feio com ' + irmaos(s)[0].nome.split(' ')[0] + '.',
      opcoes: [
        { rotulo: 'Pedir desculpas', fn: (s) => { relMod(irmaos(s)[0], R(5, 12)); return { t: 'Vocês fizeram as pazes.', k: 'bom' }; } },
        { rotulo: 'Revidar', fn: (s) => { relMod(irmaos(s)[0], -R(8, 15)); mod(s, 'forca', 1); if (chance(0.2)) mod(s, 'saude', -5); return { t: 'A briga virou pancadaria. O clima ficou ruim.', k: 'ruim' }; } },
        { rotulo: 'Ignorar', fn: (s) => { relMod(irmaos(s)[0], -R(1, 4)); return 'Vocês passaram dias sem se falar.'; } },
      ],
    }),
    e({
      id: 'festival', emoji: '🏮', titulo: 'Festival da vila', min: 5, max: 70, peso: 0.7,
      texto: () => 'A vila está em festa, com barracas, jogos e fogos de artifício.',
      opcoes: [
        { rotulo: 'Participar dos jogos', fn: (s) => { if (chance(0.5)) { const v = R(300, 1500); s.dinheiro += v; return { t: 'Você ganhou um prêmio de ' + fmt(v) + ' ryō!', k: 'bom' }; } mod(s, 'vel', 1); return 'Você perdeu, mas se divertiu. Velocidade +1.'; } },
        { rotulo: 'Passar a noite com a família', fn: (s) => { pais(s).concat(irmaos(s)).forEach((p) => relMod(p, R(3, 7))); return { t: 'Uma noite inesquecível em família.', k: 'bom' }; } },
        { rotulo: 'Comer doces (300 ryō)', cond: (s) => s.idade < 16 || s.dinheiro >= 300, fn: (s) => { if (s.idade >= 16) s.dinheiro -= 300; mod(s, 'saude', 1); return 'Você se esbaldou nos doces.'; } },
      ],
    }),
    e({
      id: 'valentao', emoji: '😠', titulo: 'O valentão', min: 6, max: 14, peso: 1.5,
      texto: () => 'Um valentão da sua idade desafiou você na frente de todo mundo.',
      opcoes: [
        { rotulo: 'Enfrentar', fn: (s) => { if (chance(clamp(0.3 + (s.forca + s.vel) / 200, 0.15, 0.85))) { mod(s, 'forca', 2); mod(s, 'disc', 1); return { t: 'Você venceu! Respeito conquistado. Força +2.', k: 'bom' }; } mod(s, 'saude', -R(4, 9)); return { t: 'Você apanhou, mas não desistiu.', k: 'ruim' }; } },
        { rotulo: 'Fugir', fn: (s) => { mod(s, 'vel', 1); return 'Você correu o mais rápido que pôde. Velocidade +1.'; } },
        { rotulo: 'Chamar um adulto', fn: (s) => { mod(s, 'disc', 1); return 'O valentão foi repreendido. Disciplina +1.'; } },
      ],
    }),
    e({
      id: 'ladrao', emoji: '🦹', titulo: 'Ladrão na vila', min: 10, max: 45, peso: 0.6,
      texto: () => 'Você viu um ladrão fugindo com a bolsa de uma senhora.',
      opcoes: [
        { rotulo: 'Perseguir', fn: (s) => { if (chance(clamp(0.3 + s.vel / 120, 0.2, 0.9))) { const v = R(500, 2500); s.dinheiro += v; mod(s, 'vel', 1); return { t: 'Você o alcançou! A senhora recompensou você com ' + fmt(v) + ' ryō.', k: 'bom' }; } mod(s, 'saude', -R(2, 6)); return { t: 'Ele escapou e você tropeçou.', k: 'ruim' }; } },
        { rotulo: 'Avisar os guardas', fn: (s) => { s.dinheiro += 300; return 'Os guardas o capturaram. Você ganhou 300 ryō.'; } },
        { rotulo: 'Ignorar', fn: () => 'Não era problema seu.' },
      ],
    }),
    e({
      id: 'ramen', emoji: '🍜', min: 3, max: 50, peso: 1,
      cond: (s) => pais(s).length > 0,
      auto: (s) => { const p = pick(pais(s)); relMod(p, R(3, 6)); mod(s, 'saude', 1); return { t: p.nome.split(' ')[0] + ' levou você para comer ramen. Foi um ótimo dia.', k: 'bom' }; },
    }),
    e({
      id: 'kg_desperta', emoji: '✨', prio: true, uma: true,
      cond: (s) => {
        if (!s.kg || s.kgDesperto) return false;
        const [a, b] = NL.KG_IDADE[s.kg];
        return s.idade >= a && (s.idade >= b || chance(0.35));
      },
      auto: (s) => { s.kgDesperto = true; s.kgConhecido = true; mod(s, 'chakra', 5); return { t: 'Seu Kekkei Genkai despertou: ' + NL.KG[s.kg].ic + ' ' + NL.KG[s.kg].n + '!', k: 'bom' }; },
    }),
    e({
      id: 'chakra_cla', emoji: '🌀', prio: true, uma: true,
      cond: (s) => s.idade === 9 && s.caminho !== 'academia' && !s.chakraLiberado && s.cla !== 'comum',
      auto: (s) => { s.chakraLiberado = true; mod(s, 'chakra', R(5, 10)); return { t: 'Sua família ensinou você a moldar o chakra.', k: 'bom' }; },
    }),
    e({
      id: 'escolha6', emoji: '🎒', titulo: 'Hora de escolher o caminho', prio: true, uma: true,
      cond: (s) => s.idade === 6 && !s.caminho,
      texto: (s) => 'Você completou 6 anos. Seus pais perguntam qual caminho você quer seguir' + (s.cla !== 'comum' ? ', e o clã ' + NL.CLAS[s.cla].n + ' espera algo de você' : '') + '.',
      opcoes: [
        { rotulo: '🥷 Academia Ninja', fn: (s) => { s.caminho = 'academia'; return { t: 'Você entrou na Academia Ninja.', k: 'bom' }; } },
        { rotulo: '📚 Escola comum', fn: (s) => { s.caminho = 'escola'; return 'Você começou a estudar na escola comum.'; } },
        { rotulo: '🌾 Ajudar a família no trabalho', fn: (s) => { s.caminho = 'trabalho'; mod(s, 'disc', 2); return 'Você preferiu trabalhar ao lado dos seus pais. Disciplina +2.'; } },
      ],
    }),
    e({
      id: 'formatura', emoji: '🎓', titulo: 'Exame de Graduação', prio: true,
      cond: (s) => s.caminho === 'academia' && !s.ninja && s.idade >= 12 && s.idade <= 17 && !s.flags.desistiu,
      texto: (s) => s.flags.reprovou ? 'Chegou a hora de tentar o exame de novo. Você já foi reprovado ' + s.flags.reprovou + ' vez(es).' : 'Chegou o dia do Exame de Graduação da Academia Ninja.',
      opcoes: [
        { rotulo: 'Prestar o exame', fn: (s) => {
          const sc = s.intel * 0.25 + s.disc * 0.2 + s.chakra * 0.25 + mediaNotas(s) * 0.3;
          if (sc + R(-8, 8) >= 26) return virarGenin(s);
          s.flags.reprovou++;
          return { t: 'Você foi reprovado no exame. Treine mais e tente de novo no ano que vem.', k: 'ruim' };
        } },
        { rotulo: 'Desistir da carreira ninja', fn: (s) => { s.flags.desistiu = true; s.caminho = 'civil'; return 'Você decidiu seguir uma vida civil.'; } },
      ],
    }),
    e({
      id: 'sonho_ninja', emoji: '💭', titulo: 'Ainda dá tempo?', min: 12, max: 16, uma: true, peso: 3,
      cond: (s) => !s.ninja && s.caminho !== 'academia' && !s.flags.desistiu,
      texto: () => 'O sonho de ser ninja ainda não saiu da sua cabeça. Você pode treinar por conta própria e tentar o exame.',
      opcoes: [
        { rotulo: 'Tentar o exame por conta própria', fn: (s) => {
          const p = clamp(0.1 + poder(s) / 150 + (s.chakraLiberado ? 0.15 : 0), 0.08, 0.7);
          if (chance(p)) return virarGenin(s);
          mod(s, 'saude', -R(1, 4));
          return { t: 'Você não passou. Talvez a vida civil seja seu caminho.', k: 'ruim' };
        } },
        { rotulo: 'Seguir a vida civil', fn: () => 'Você decidiu deixar o sonho de lado.' },
      ],
    }),
    e({
      id: 'independencia', emoji: '🏠', titulo: 'Independência', prio: true, uma: true,
      cond: (s) => s.idade === 16,
      texto: (s) => pais(s).length ? 'Você fez 16 anos. Pode sair da casa dos seus pais, mas vai ter que pagar suas contas (9.000 ryō/ano).' : 'Sem seus pais, você precisa se virar sozinho. As contas custam 9.000 ryō/ano.',
      opcoes: [
        { rotulo: 'Sair de casa', fn: (s) => { s.independente = true; mod(s, 'disc', 1); return 'Você alugou um quartinho e começou a viver por conta própria.'; } },
        { rotulo: 'Continuar com a família', cond: (s) => pais(s).length > 0, fn: (s) => { pais(s).forEach((p) => relMod(p, 3)); return 'Você ficou em casa, sem pagar contas por enquanto.'; } },
      ],
    }),
    e({
      id: 'exame_chunin', emoji: '🎖️', titulo: 'Exame Chunin', min: 13, peso: 4,
      cond: (s) => s.ninja === 'Genin' && s.missoes >= 4,
      texto: () => 'Seu desempenho nas missões chamou a atenção. Você foi indicado ao Exame Chunin.',
      opcoes: [
        { rotulo: 'Participar do exame', fn: (s) => {
          if (chance(clamp(0.3 + (poder(s) - 30) / 50, 0.1, 0.9))) { s.ninja = 'Chunin'; mod(s, 'disc', 2); return { t: 'Você foi promovido a Chunin!', k: 'bom' }; }
          mod(s, 'saude', -R(3, 10)); return { t: 'Você foi eliminado durante as provas.', k: 'ruim' };
        } },
        { rotulo: 'Esperar a próxima edição', fn: () => 'Você preferiu treinar mais antes de se arriscar.' },
      ],
    }),
    e({
      id: 'exame_jounin', emoji: '🏅', titulo: 'Indicação a Jounin', min: 17, peso: 4,
      cond: (s) => s.ninja === 'Chunin' && s.missoes >= 12 && poder(s) >= 38,
      texto: () => 'Seus superiores querem avaliar você para a patente de Jounin.',
      opcoes: [
        { rotulo: 'Aceitar a avaliação', fn: (s) => {
          if (chance(clamp(0.25 + (poder(s) - 40) / 60, 0.1, 0.85))) { s.ninja = 'Jounin'; mod(s, 'disc', 2); return { t: 'Você é um Jounin! Respeito de toda a vila.', k: 'bom' }; }
          mod(s, 'saude', -R(2, 8)); return { t: 'Você não alcançou o nível esperado desta vez.', k: 'ruim' };
        } },
        { rotulo: 'Adiar', fn: () => 'Você pediu mais tempo para se preparar.' },
      ],
    }),
    e({
      id: 'elogio', emoji: '👏', titulo: 'Elogio do chefe', min: 12, peso: 0.5,
      cond: (s) => !!s.emprego,
      texto: (s) => 'Seu chefe elogiou seu trabalho como ' + s.emprego.n.toLowerCase() + '.',
      opcoes: [
        { rotulo: 'Pedir aumento', fn: (s) => {
          if (chance(0.55)) { s.emprego.sal = Math.round((s.emprego.sal * 1.12) / 100) * 100; return { t: 'Ele aceitou. Novo salário: ' + fmt(s.emprego.sal) + ' ryō/ano.', k: 'bom' }; }
          if (chance(0.25)) { s.emprego = null; return { t: 'Ele se irritou e demitiu você.', k: 'ruim' }; }
          return { t: 'Ele negou, mas disse que vai pensar.', k: 'info' };
        } },
        { rotulo: 'Só agradecer', fn: (s) => { mod(s, 'disc', 1); return 'Você agradeceu com humildade. Disciplina +1.'; } },
      ],
    }),
    e({
      id: 'proposta_emprego', emoji: '🤝', titulo: 'Proposta de outro emprego', min: 14, peso: 0.4,
      cond: (s) => !!s.emprego,
      texto: () => 'Um comerciante ofereceu um emprego com salário um pouco maior.',
      opcoes: [
        { rotulo: 'Aceitar', fn: (s) => { const j = pick(NL.EMPREGOS.filter((x) => x.min <= s.idade && x.id !== s.emprego.id)); if (!j) return 'A proposta não deu em nada.'; const sal = Math.round((s.emprego.sal * 1.15) / 100) * 100; s.emprego = { id: j.id, n: j.n, sal }; return { t: 'Você virou ' + j.n.toLowerCase() + ' por ' + fmt(sal) + ' ryō/ano.', k: 'bom' }; } },
        { rotulo: 'Recusar', fn: () => 'Você preferiu ficar onde está.' },
      ],
    }),
  ];

  // ---------- atividades ----------
  const ganho = (s) => R(1, 3) + (s.disc >= 50 ? 1 : 0);
  NL.ATIVIDADES = [
    { id: 'forca', ic: '🥋', n: 'Treinar força', min: 4, fn: (s) => { const g = ganho(s); mod(s, 'forca', g); return 'Você treinou pesado. Força +' + g + '.'; } },
    { id: 'vel', ic: '💨', n: 'Treinar velocidade', min: 4, fn: (s) => { const g = ganho(s); mod(s, 'vel', g); return 'Você correu até cansar. Velocidade +' + g + '.'; } },
    { id: 'res', ic: '🛡️', n: 'Treinar resistência', min: 4, fn: (s) => { const g = ganho(s); mod(s, 'res', g); return 'Você aguentou o treino até o fim. Resistência +' + g + '.'; } },
    { id: 'disc', ic: '🧘', n: 'Meditar', min: 5, fn: (s) => { const g = ganho(s); mod(s, 'disc', g); mod(s, 'saude', 1); return 'Você meditou em silêncio. Disciplina +' + g + '.'; } },
    { id: 'estudo', ic: '📚', n: 'Estudar', min: 5, fn: (s) => { const g = ganho(s); mod(s, 'intel', g); return 'Você passou horas com os livros. Inteligência +' + g + '.'; } },
    { id: 'chakra', ic: '🌀', n: 'Treinar controle de chakra', min: 6, cond: (s) => s.chakraLiberado, fn: (s) => { const g = R(3, 6); mod(s, 'chakra', g); mod(s, 'disc', 1); return 'Seu controle de chakra melhorou (+' + g + ').'; } },
    { id: 'medico', ic: '🏥', n: 'Consultar o curandeiro', custo: 1000, min: 0, fn: (s) => { const g = R(8, 15); mod(s, 'saude', g); return 'Você se tratou. Saúde +' + g + '.'; } },
    { id: 'ramen', ic: '🍜', n: 'Comer ramen', custo: 300, min: 3, fn: (s) => { mod(s, 'saude', 1); const al = s.pessoas.filter((p) => p.vivo && p.tipo !== 'sensei'); if (al.length) relMod(pick(al), R(3, 6)); return 'Uma tigela de ramen quente. Que delícia!'; } },
    { id: 'amigos', ic: '🧑‍🤝‍🧑', n: 'Fazer amigos', min: 5, fn: (s) => { if (chance(0.75)) { const a = novoAmigo(s); return { t: 'Você fez amizade com ' + a.nome + '.', k: 'bom' }; } return 'Ninguém quis conversar hoje.'; } },
    { id: 'descanso', ic: '😴', n: 'Descansar', min: 0, fn: (s) => { const g = R(3, 6); mod(s, 'saude', g); return 'Você descansou. Saúde +' + g + '.'; } },
  ];
  const custoReal = (s, a) => ((s.idade < 16 && !s.independente) ? 0 : (a.custo || 0));
  NL.custoReal = custoReal;
  NL.atividadesDisponiveis = (s) => NL.ATIVIDADES.filter((a) => s.idade >= a.min && (!a.cond || a.cond(s)));

  NL.fazerAtividade = function (s, id) {
    const a = NL.ATIVIDADES.find((x) => x.id === id);
    if (!s.vivo) return { ok: false, t: 'Você não está mais vivo.' };
    if (s.acoes <= 0) return { ok: false, t: 'Sem ações restantes neste ano. Avance a idade.' };
    const c = custoReal(s, a);
    if (c > 0 && c > s.dinheiro) return { ok: false, t: 'Dinheiro insuficiente (' + fmt(c) + ' ryō).' };
    s.acoes--;
    s.dinheiro -= c;
    const out = a.fn(s);
    const o = typeof out === 'string' ? { t: out, k: 'info' } : out;
    L(s, a.ic + ' ' + o.t, o.k);
    return { ok: true, t: o.t, k: o.k };
  };

  // ---------- carreira ----------
  NL.missao = function (s, rank) {
    if (!s.vivo) return { ok: false, t: 'Você não está mais vivo.' };
    if (!s.ninja || !(NL.MISSOES_POR_PATENTE[s.ninja] || []).includes(rank)) return { ok: false, t: 'Você não pode aceitar essa missão.' };
    if (s.acoes <= 0) return { ok: false, t: 'Sem ações restantes neste ano.' };
    s.acoes--;
    const m = NL.MISSOES[rank];
    const nome = pick(m.nomes);
    const p = clamp(0.55 + (poder(s) - m.dif) / 60, 0.15, 0.97);
    const equipe = s.pessoas.filter((x) => x.vivo && (x.tipo === 'colega' || x.tipo === 'sensei'));
    let r;
    if (chance(p)) {
      const pay = R(m.pay[0], m.pay[1]);
      s.dinheiro += pay;
      s.missoes++;
      mod(s, pick(['forca', 'vel', 'res', 'disc']), 1);
      mod(s, 'chakra', 1);
      equipe.forEach((x) => relMod(x, R(1, 3)));
      r = { ok: true, k: 'bom', t: '✅ Missão rank ' + rank + ': ' + nome + '. Recompensa: ' + fmt(pay) + ' ryō.' };
    } else {
      const dano = R(m.dano[0], m.dano[1]);
      mod(s, 'saude', -dano);
      r = { ok: true, k: 'ruim', t: '❌ Missão rank ' + rank + ' falhou: ' + nome + '. Você se feriu (Saúde -' + dano + ').' };
      if (m.mortal && chance(Math.max(0, m.mortal * (1.2 - poder(s) / 100)))) {
        L(s, r.t, 'ruim');
        morrer(s, 'Morreu em missão rank ' + rank + ': ' + nome + '.');
        r.t += ' Você morreu.';
        return r;
      }
      if (s.saude <= 0) { L(s, r.t, 'ruim'); morrer(s, 'Ferimentos graves em missão.'); return r; }
    }
    L(s, r.t, r.k);
    return r;
  };

  NL.largarNinja = function (s) {
    s.ninja = null; s.caminho = 'civil'; s.flags.desistiu = true;
    L(s, '🚪 Você abandonou a carreira ninja e voltou à vida civil.');
  };

  NL.empregosDisponiveis = (s) => NL.EMPREGOS.filter((j) => s.idade >= j.min);
  NL.podeTrabalhar = (s) => s.vivo && !s.ninja && s.caminho !== 'academia' && s.idade >= 12 && (s.caminho === 'civil' || s.caminho === 'trabalho' || s.caminho === 'escola');

  NL.candidatar = function (s, id) {
    const j = NL.EMPREGOS.find((x) => x.id === id);
    if (s.flags.cand[id] === s.idade) return { ok: false, t: 'Você já tentou esta vaga neste ano.' };
    s.flags.cand[id] = s.idade;
    const p = clamp(0.45 + s.intel / 200 + s.disc / 200, 0.35, 0.95);
    if (chance(p)) {
      s.emprego = { id: j.id, n: j.n, sal: j.sal };
      L(s, '💼 Você foi contratado como ' + j.n.toLowerCase() + ' (' + fmt(j.sal) + ' ryō/ano).', 'bom');
      return { ok: true, t: 'Contratado como ' + j.n + '!' };
    }
    L(s, '📄 Você não foi contratado como ' + j.n.toLowerCase() + ' desta vez.', 'ruim');
    return { ok: true, t: 'Não foi dessa vez.' };
  };
  NL.demitir = function (s) {
    if (!s.emprego) return;
    L(s, '🚪 Você pediu demissão do cargo de ' + s.emprego.n.toLowerCase() + '.');
    s.emprego = null;
  };

  // ---------- relações ----------
  NL.interagir = function (s, pid, acao) {
    const p = s.pessoas.find((x) => x.id === pid);
    if (!p || !p.vivo || !s.vivo) return { ok: false, t: 'Pessoa indisponível.' };
    if (acao !== 'pedir' && p.ult === s.idade) return { ok: false, t: 'Você já interagiu com ' + p.nome.split(' ')[0] + ' neste ano.' };
    const n1 = p.nome.split(' ')[0];
    let t;
    if (acao === 'conversar') { relMod(p, R(3, 8)); t = 'Você conversou com ' + n1 + '.'; }
    else if (acao === 'tempo') { relMod(p, R(5, 10)); t = 'Você passou um tempo de qualidade com ' + n1 + '.'; }
    else if (acao === 'presente') {
      if (s.dinheiro < 300) return { ok: false, t: 'Dinheiro insuficiente (300 ryō).' };
      s.dinheiro -= 300; relMod(p, R(8, 15)); t = 'Você presenteou ' + n1 + '. Ficou encantado(a)!';
    } else if (acao === 'treinar') {
      const k = pick(['forca', 'vel', 'res']); mod(s, k, R(1, 2)); relMod(p, R(3, 6));
      t = 'Você treinou com ' + n1 + ' e evoluiu ' + NL.ATRIBUTOS.find((a) => a.k === k).n.toLowerCase() + '.';
    } else if (acao === 'pedir') {
      if (p.ult === s.idade) return { ok: false, t: 'Você já pediu algo a ' + n1 + ' neste ano.' };
      if (p.rel < 30) { relMod(p, -5); p.ult = s.idade; return { ok: false, t: n1 + ' recusou. Vocês não estão tão próximos.' }; }
      const v = Math.round(NL.RIQUEZA[s.riqueza].mesada * (0.6 + Math.random() * 0.8));
      s.dinheiro += v; relMod(p, -2); t = n1 + ' deu a você ' + fmt(v) + ' ryō.';
    }
    p.ult = s.idade;
    L(s, '💬 ' + t, 'info');
    return { ok: true, t };
  };

  NL.acoesPessoa = function (s, p) {
    const a = [['conversar', '💬 Conversar'], ['tempo', '⏳ Passar tempo juntos'], ['presente', '🎁 Presentear (300 ryō)']];
    if (s.idade >= 6 && ['amigo', 'irmao', 'irma', 'sensei', 'colega'].includes(p.tipo)) a.push(['treinar', '🥋 Treinar juntos']);
    if ((p.tipo === 'pai' || p.tipo === 'mae') && s.idade < 18) a.push(['pedir', '💴 Pedir dinheiro']);
    return a;
  };

  // ---------- resumo / persistência ----------
  NL.resumo = function (s) {
    return {
      nome: s.nome + ' ' + s.sobrenome, idade: s.idade, causa: s.causa,
      patente: s.ninja || (s.caminho === 'academia' ? 'Estudante da Academia' : s.emprego ? s.emprego.n : 'Civil'),
      dinheiro: s.dinheiro, missoes: s.missoes, amigos: s.pessoas.filter((p) => p.tipo === 'amigo' && p.vivo).length,
    };
  };

  const CHAVE = 'naruto_life_save_v1';
  NL.salvar = (s) => { try { localStorage.setItem(CHAVE, JSON.stringify(s)); } catch (err) { /* sem espaço ou bloqueado */ } };
  NL.carregar = () => { try { const j = localStorage.getItem(CHAVE); return j ? JSON.parse(j) : null; } catch (err) { return null; } };
  NL.apagar = () => { try { localStorage.removeItem(CHAVE); } catch (err) { /* ignore */ } };
})(typeof window !== 'undefined' ? window : globalThis);
