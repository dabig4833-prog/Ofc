(function (g) {
  'use strict';
  const NL = (g.NL = g.NL || {});

  NL.VERSAO = 'Beta 0.1';

  NL.ATRIBUTOS = [
    { k: 'saude', n: 'Saúde', cor: '#ef4444', ic: '❤️' },
    { k: 'intel', n: 'Inteligência', cor: '#3b82f6', ic: '🧠' },
    { k: 'forca', n: 'Força', cor: '#f97316', ic: '💪' },
    { k: 'vel', n: 'Velocidade', cor: '#eab308', ic: '⚡' },
    { k: 'res', n: 'Resistência', cor: '#22c55e', ic: '🛡️' },
    { k: 'disc', n: 'Disciplina', cor: '#a855f7', ic: '🎯' },
  ];

  NL.ELEMENTOS = {
    fogo: { n: 'Fogo', ic: '🔥' },
    vento: { n: 'Vento', ic: '🌪️' },
    raio: { n: 'Raio', ic: '⚡' },
    terra: { n: 'Terra', ic: '🪨' },
    agua: { n: 'Água', ic: '💧' },
  };

  NL.KG = {
    sharingan: { n: 'Sharingan', ic: '👁️' },
    byakugan: { n: 'Byakugan', ic: '🤍' },
    hyoton: { n: 'Hyōton (Gelo)', ic: '❄️' },
    shoton: { n: 'Shōton (Cristal)', ic: '💎' },
    ranton: { n: 'Ranton (Tempestade)', ic: '⛈️' },
    futton: { n: 'Futton (Vapor)', ic: '♨️' },
  };
  NL.KG_RARO = ['shoton', 'ranton', 'futton'];
  NL.KG_IDADE = {
    sharingan: [8, 13], byakugan: [4, 7], hyoton: [5, 9],
    shoton: [6, 11], ranton: [6, 11], futton: [6, 11],
  };

  NL.RIQUEZA = [
    { n: 'Pobre', mesada: 200 },
    { n: 'Humilde', mesada: 600 },
    { n: 'Classe média', mesada: 1500 },
    { n: 'Confortável', mesada: 4000 },
    { n: 'Rica', mesada: 12000 },
  ];

  NL.VILAS = {
    konoha: { n: 'Konohagakure', pais: 'País do Fogo', ic: '🍃', pesos: { fogo: 4, vento: 2, raio: 2, terra: 1, agua: 1 }, clas: ['uchiha', 'hyuga', 'nara', 'akimichi', 'yamanaka', 'inuzuka', 'aburame'] },
    suna: { n: 'Sunagakure', pais: 'País do Vento', ic: '🏜️', pesos: { vento: 4, fogo: 2, raio: 2, terra: 2, agua: 0.5 }, clas: ['akasuna'] },
    kiri: { n: 'Kirigakure', pais: 'País da Água', ic: '🌫️', pesos: { agua: 4, raio: 1, fogo: 1, terra: 1, vento: 1 }, clas: ['yuki', 'hozuki'] },
    kumo: { n: 'Kumogakure', pais: 'País do Raio', ic: '⛈️', pesos: { raio: 4, fogo: 2, vento: 1, terra: 1, agua: 2 }, clas: ['yotsuki'] },
    iwa: { n: 'Iwagakure', pais: 'País da Terra', ic: '⛰️', pesos: { terra: 4, fogo: 2, vento: 1, raio: 1, agua: 1 }, clas: ['kamizuru'] },
    ame: { n: 'Amegakure', pais: 'País da Chuva', ic: '🌧️', pesos: { agua: 3, fogo: 1, vento: 1, raio: 2, terra: 1 }, clas: [] },
  };

  NL.CLAS = {
    uchiha: { n: 'Uchiha', sobrenome: 'Uchiha', kg: 'sharingan', bonus: { intel: 4, vel: 3 }, ninja: true, desc: 'Prodígios do fogo, com o olho Sharingan.' },
    hyuga: { n: 'Hyūga', sobrenome: 'Hyūga', kg: 'byakugan', bonus: { disc: 6, intel: 2 }, ninja: true, desc: 'Guardam o Byakugan e o Punho Gentil.' },
    nara: { n: 'Nara', sobrenome: 'Nara', kg: null, bonus: { intel: 10 }, ninja: true, desc: 'Estrategistas brilhantes.' },
    akimichi: { n: 'Akimichi', sobrenome: 'Akimichi', kg: null, bonus: { forca: 6, res: 6 }, ninja: true, desc: 'Força e resistência fora do comum.' },
    yamanaka: { n: 'Yamanaka', sobrenome: 'Yamanaka', kg: null, bonus: { intel: 4, disc: 2 }, ninja: true, desc: 'Mestres em técnicas da mente.' },
    inuzuka: { n: 'Inuzuka', sobrenome: 'Inuzuka', kg: null, bonus: { vel: 4, res: 3 }, ninja: true, desc: 'Lutam ao lado de cães ninja.' },
    aburame: { n: 'Aburame', sobrenome: 'Aburame', kg: null, bonus: { disc: 5, intel: 2 }, ninja: true, desc: 'Convivem com insetos.' },
    akasuna: { n: 'Akasuna', sobrenome: 'Akasuna', kg: null, bonus: { intel: 3, disc: 3 }, ninja: true, desc: 'Artesãos de marionetes.' },
    yuki: { n: 'Yuki', sobrenome: 'Yuki', kg: 'hyoton', bonus: { intel: 2, vel: 2 }, ninja: true, desc: 'Dominam o gelo.' },
    hozuki: { n: 'Hozuki', sobrenome: 'Hozuki', kg: null, bonus: { res: 4, forca: 3 }, ninja: true, desc: 'Ninjas aquáticos.' },
    yotsuki: { n: 'Yotsuki', sobrenome: 'Yotsuki', kg: null, bonus: { forca: 4, vel: 3 }, ninja: true, desc: 'Guerreiros velozes da nuvem.' },
    kamizuru: { n: 'Kamizuru', sobrenome: 'Kamizuru', kg: null, bonus: { vel: 3, disc: 2 }, ninja: true, desc: 'Ninjas ligados às vespas.' },
  };

  NL.EMPREGOS = [
    { id: 'trab', n: 'Trabalhador comum', sal: 12000, min: 12, desc: 'Serviços gerais pela vila.' },
    { id: 'mens', n: 'Mensageiro', sal: 16000, min: 12, desc: 'Entrega cartas e encomendas.' },
    { id: 'agri', n: 'Agricultor', sal: 17000, min: 12, desc: 'Cuida da terra e da colheita.' },
    { id: 'garc', n: 'Garçom', sal: 15000, min: 13, desc: 'Serve mesas em restaurantes.' },
    { id: 'vend', n: 'Vendedor', sal: 20000, min: 14, desc: 'Vende produtos no comércio.' },
    { id: 'coz', n: 'Cozinheiro', sal: 22000, min: 14, desc: 'Prepara pratos na cozinha.' },
    { id: 'carp', n: 'Carpinteiro', sal: 24000, min: 15, desc: 'Constrói e conserta casas.' },
  ];

  NL.PATENTES = ['Estudante', 'Genin', 'Chunin', 'Jounin'];

  NL.MISSOES = {
    D: { dif: 15, pay: [3000, 6000], dano: [0, 8], mortal: 0, exp: 1, nomes: ['Capturar o gato fugitivo de uma senhora', 'Capinar o jardim de um aldeão', 'Entregar encomendas pela vila', 'Ajudar na colheita de uma fazenda', 'Pintar a cerca de um comerciante', 'Procurar um objeto perdido'] },
    C: { dif: 30, pay: [9000, 16000], dano: [3, 15], mortal: 0.01, exp: 2, nomes: ['Escoltar um comerciante até a próxima cidade', 'Proteger a construção de uma ponte', 'Patrulhar a fronteira', 'Caçar bandidos de estrada'] },
    B: { dif: 45, pay: [25000, 45000], dano: [8, 25], mortal: 0.04, exp: 4, nomes: ['Infiltrar-se em um acampamento de bandidos', 'Escoltar um nobre até outro país', 'Interceptar ninjas renegados'] },
    A: { dif: 60, pay: [70000, 120000], dano: [15, 40], mortal: 0.1, exp: 8, nomes: ['Defender a vila de um ataque', 'Resgatar um refém em território inimigo', 'Enfrentar um ninja procurado'] },
  };
  NL.MISSOES_POR_PATENTE = { Genin: ['D', 'C'], Chunin: ['C', 'B'], Jounin: ['B', 'A'] };

  NL.NOMES_M = ['Haruto', 'Ren', 'Kaito', 'Daichi', 'Ryota', 'Shun', 'Takeshi', 'Akira', 'Kenta', 'Hiroshi', 'Souta', 'Yuto', 'Masaru', 'Taro', 'Jiro', 'Kenji', 'Satoru', 'Daisuke', 'Naoki', 'Riku'];
  NL.NOMES_F = ['Aiko', 'Yui', 'Haruka', 'Mio', 'Emi', 'Kaori', 'Nana', 'Misaki', 'Rika', 'Sayuri', 'Natsumi', 'Hikari', 'Mai', 'Kanna', 'Ayumi', 'Reina', 'Tsubaki', 'Noriko', 'Chiharu', 'Momo'];
  NL.SOBRENOMES = ['Sato', 'Suzuki', 'Takahashi', 'Tanaka', 'Watanabe', 'Ito', 'Yamamoto', 'Nakamura', 'Kobayashi', 'Kato', 'Yoshida', 'Sasaki', 'Matsumoto', 'Inoue', 'Kimura', 'Hayashi', 'Shimizu', 'Mori', 'Ogawa', 'Fujita'];

  NL.NOTICIAS = [
    { idade: 1, texto: 'A vila ainda se reconstrói depois dos anos de guerra.' },
    { idade: 5, texto: 'Crianças da sua geração começam a sonhar com a vida ninja.' },
    { idade: 12, texto: 'Jovens da sua geração se formam nas academias de todas as vilas.' },
    { idade: 13, texto: 'O Exame Chunin reúne ninjas de várias vilas e termina em caos.' },
    { idade: 15, texto: 'Rumores sobre uma organização misteriosa de ninjas renegados.' },
    { idade: 17, texto: 'A tensão entre as nações ninja não para de crescer.' },
  ];
})(typeof window !== 'undefined' ? window : globalThis);
