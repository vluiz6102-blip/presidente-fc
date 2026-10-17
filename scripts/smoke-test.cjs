const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const elements = new Map();
function element(id) {
  if (!elements.has(id)) {
    elements.set(id, {
      id, value: id === 'clubChoice' ? '21' : '',
      style: {}, textContent: '', innerHTML: '',
      classList: { add() {}, remove() {}, toggle() {} },
      dataset: {}
    });
  }
  return elements.get(id);
}
const storage = new Map();
const context = {
  console, Math, Date, JSON, Number, String, Array, Object, Map, Set, RegExp, Error,
  localStorage: {
    getItem: key => storage.has(key) ? storage.get(key) : null,
    setItem: (key, value) => storage.set(key, String(value))
  },
  document: { getElementById: element, querySelectorAll: () => [], querySelector: () => null },
  window: { addEventListener() {}, scrollTo() {} },
  setTimeout: () => 1, clearTimeout() {}, prompt: () => null
};
vm.createContext(context);
vm.runInContext(fs.readFileSync('www/game.js', 'utf8'), context, { filename: 'www/game.js' });
vm.runInContext('render = () => {}; renderScreen = () => {}; showScreen = () => {}; toast = () => {};', context);

function state() { return vm.runInContext('G', context); }
function call(code) { return vm.runInContext(code, context); }
function start() {
  element('candidateName').value = 'Teste de Regressão';
  element('nickname').value = 'QA';
  element('manifesto').value = 'finance';
  call('startCareer()');
}
function expectedDailyNet() {
  const g = state();
  return Math.round(g.sponsor.value / 30 - g.coach.wage / 30 -
    g.squad.reduce((sum, p) => sum + p.wage, 0) / 30 - g.club.capacity * .12);
}

start();
assert.equal(state().squad.length, 11, 'a carreira começa com 11 atletas');
assert.equal(state().table.length, 8, 'a liga tem 8 clubes');
assert.equal(state().table.filter(t => t.name === state().club.name).length, 1, 'o clube do jogador aparece uma única vez na tabela');

// Promessas: custo real, bloqueio de repetição e cumprimento condicionado ao reforço.
const cashBeforePromise = state().club.cash;
const netBeforePromise = expectedDailyNet();
call("boardMeeting('promise')");
assert.equal(state().promises, 1, 'a primeira promessa deve ser registrada');
assert.equal(state().club.cash, cashBeforePromise - 80000 + netBeforePromise,
  'o custo da promessa deve ser aplicado uma vez, somado ao fluxo diário');
const cashAfterPromise = state().club.cash;
const dayAfterPromise = state().day;
call("boardMeeting('promise')");
assert.equal(state().promises, 1, 'promessas repetidas não devem acumular');
assert.equal(state().club.cash, cashAfterPromise, 'promessa bloqueada não pode cobrar dinheiro');
assert.equal(state().day, dayAfterPromise, 'promessa bloqueada não deve avançar o dia');

const qualityBeforeWeakSigning = state().club.quality;
call('signPlayer(0)');
assert.equal(state().promises, 1, 'contratar jogador fraco não deve cumprir a promessa');
assert.ok(state().club.quality <= qualityBeforeWeakSigning,
  'contratar jogador abaixo do nível não pode inflar a força do clube');

// Entradas inválidas não podem cobrar dinheiro nem consumir um dia.
const cashBeforeInvalid = state().club.cash;
const dayBeforeInvalid = state().day;
call("campaign('invalid-action')");
assert.equal(state().club.cash, cashBeforeInvalid, 'tipo de campanha inválido não pode cobrar dinheiro');
assert.equal(state().day, dayBeforeInvalid, 'tipo de campanha inválido não pode avançar o dia');
call("boardMeeting('invalid-action')");
assert.equal(state().club.cash, cashBeforeInvalid, 'tipo de bastidores inválido não pode cobrar dinheiro');
assert.equal(state().day, dayBeforeInvalid, 'tipo de bastidores inválido não pode avançar o dia');

// Derrota eleitoral deve preservar o calendário e marcar nova votação em cinco dias.
call('G.mandate = false; G.electionResolved = false; G.day = 12; G.electionDay = 12; G.campaignScore = 0; G.rep = 0; G.club.fan = 0; G.club.board = 0; G.promises = 0');
call('holdElection()');
assert.equal(state().mandate, false, 'apoio insuficiente não deve eleger o candidato');
assert.equal(state().day, 12, 'perder a eleição não pode voltar o calendário para o dia 1');
assert.equal(state().electionDay, 17, 'a nova eleição deve ser marcada exatamente cinco dias depois');
assert.equal(state().electionResolved, false, 'uma derrota deve permitir nova campanha');

// Uma temporada incompleta não pode ser apagada pela virada do dia 30.
call('G.mandate = true; G.day = 29; G.round = 2; G.season = 3');
call('advanceDay("teste de calendário", true)');
assert.equal(state().season, 3, 'a temporada não deve reiniciar antes de concluir as sete rodadas');
assert.equal(state().round, 2, 'a virada do dia 30 não pode apagar partidas de uma temporada incompleta');

// Testar a temporada completa: cada clube deve jogar exatamente uma vez por rodada.
call('G.day = 10; G.round = 0; G.wins = 0; G.draws = 0; G.losses = 0; G.goalsFor = 0; G.goalsAgainst = 0; G.table.forEach(t => {t.pts=0;t.p=0;t.w=0;t.d=0;t.l=0;t.gf=0;t.ga=0})');
for (let i = 0; i < 7; i++) {
  call('playMatch()');
  assert.equal(state().round, i + 1, 'cada partida deve avançar exatamente uma rodada');
  assert.ok(state().table.every(t => t.p === i + 1), 'todos os clubes devem ter o mesmo número de jogos');
}
assert.equal(state().wins + state().draws + state().losses, 7, 'o balanço do clube deve totalizar sete partidas');
const completedRound = state().round;
call('playMatch()');
assert.equal(state().round, completedRound, 'não deve existir oitava partida na mesma temporada');
assert.ok(state().table.every(t => t.p === 7), 'tabela completa deve manter sete jogos por clube');

// Patrocínio: renegociação não pode reduzir o contrato e o bloqueio impede bônus repetido.
call('G.day = 20; G.sponsorLastNegotiationDay = 0; G.mandate = true');
const sponsorValueBefore = state().sponsor.value;
call('negotiateSponsor()');
assert.ok(state().sponsor.value >= sponsorValueBefore, 'renegociação não pode reduzir o valor mensal contratado');
const sponsorCash = state().club.cash;
const sponsorDay = state().day;
call('negotiateSponsor()');
assert.equal(state().club.cash, sponsorCash, 'renegociar durante o bloqueio não pode gerar bônus');
assert.equal(state().day, sponsorDay, 'renegociação bloqueada não deve avançar o dia');

// Ações presidenciais são bloqueadas antes da eleição.
call('G.mandate = false');
const boardBefore = state().club.board;
call('coachSupport()');
assert.equal(state().club.board, boardBefore, 'ações presidenciais devem ser bloqueadas antes da eleição');

// Save/load: carreira válida deve sobreviver a um ciclo.
call('G.mandate = true; save()');
const savedDay = state().day;
const savedClub = state().club.name;
call('G = null; load()');
assert.equal(state().day, savedDay, 'load deve recuperar o dia salvo');
assert.equal(state().club.name, savedClub, 'load deve recuperar o clube salvo');
assert.equal(state().table.length, 8, 'load deve manter tabela com oito clubes');
assert.equal(state().version, 3, 'save/load deve normalizar para versão 3');

// Segurança de texto dinâmico.
assert.equal(call("escapeHtml('<img src=x onerror=alert(1)>')"),
  '&lt;img src=x onerror=alert(1)&gt;', 'texto dinâmico deve ser escapado antes de entrar em HTML');

console.log('Presidente FC regression tests: PASS (campaign, election, finances, promises, sponsorship, fixtures, season, save/load, HTML escaping)');
