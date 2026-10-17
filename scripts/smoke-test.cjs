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
  console,
  Math,
  Date,
  JSON,
  Number,
  String,
  Array,
  Object,
  Map,
  Set,
  RegExp,
  Error,
  localStorage: {
    getItem: key => storage.has(key) ? storage.get(key) : null,
    setItem: (key, value) => storage.set(key, String(value))
  },
  document: {
    getElementById: element,
    querySelectorAll: () => [],
    querySelector: () => null
  },
  window: { addEventListener() {}, scrollTo() {} },
  setTimeout: () => 1,
  clearTimeout() {},
  prompt: () => null
};
vm.createContext(context);
vm.runInContext(fs.readFileSync('www/game.js', 'utf8'), context, { filename: 'www/game.js' });
vm.runInContext('render = () => {}; renderScreen = () => {}; showScreen = () => {}; toast = () => {};', context);

function state() { return vm.runInContext('G', context); }
function call(code) { return vm.runInContext(code, context); }

element('candidateName').value = 'Teste de Regressão';
element('nickname').value = 'QA';
element('manifesto').value = 'finance';
call('startCareer()');
assert.equal(state().squad.length, 11, 'a carreira começa com 11 atletas');
assert.equal(state().table.length, 8, 'a liga tem 8 clubes');

const cashBeforePromise = state().club.cash;
call("boardMeeting('promise')");
assert.equal(state().promises, 1, 'a primeira promessa deve ser registrada');
const cashAfterPromise = state().club.cash;
const dayAfterPromise = state().day;
call("boardMeeting('promise')");
assert.equal(state().promises, 1, 'promessas repetidas não devem acumular');
assert.equal(state().club.cash, cashAfterPromise, 'promessa bloqueada não pode cobrar dinheiro');
assert.equal(state().day, dayAfterPromise, 'promessa bloqueada não deve avançar o dia');
assert.ok(cashAfterPromise < cashBeforePromise, 'a promessa válida tem custo');

const qualityBeforeWeakSigning = state().club.quality;
call('signPlayer(0)');
assert.equal(state().promises, 1, 'contratar jogador fraco não deve cumprir a promessa');
assert.ok(state().club.quality <= qualityBeforeWeakSigning, 'contratar jogador abaixo do nível não pode inflar a força do clube');

call('G.mandate = true');
call('playMatch()');
assert.equal(state().table.find(t => t.name === state().club.name).p, 1, 'o clube deve jogar uma partida por rodada');
assert.ok(state().table.every(t => t.p === 1), 'cada clube deve ter exatamente um jogo na primeira rodada');
call('playMatch()');
call('playMatch()');
assert.equal(state().promises, 1, 'jogar partidas não pode cumprir uma promessa automaticamente');

call('G.day = 20');
call('G.sponsorLastNegotiationDay = 0');
call('negotiateSponsor()');
const sponsorCash = state().club.cash;
const sponsorDay = state().day;
call('negotiateSponsor()');
assert.equal(state().club.cash, sponsorCash, 'renegociar durante o bloqueio não pode gerar bônus');
assert.equal(state().day, sponsorDay, 'renegociação bloqueada não deve avançar o dia');

call('G.mandate = false');
const boardBefore = state().club.board;
call('coachSupport()');
assert.equal(state().club.board, boardBefore, 'ações presidenciais devem ser bloqueadas antes da eleição');

assert.equal(call("escapeHtml('<img src=x onerror=alert(1)>')"), '&lt;img src=x onerror=alert(1)&gt;', 'texto dinâmico deve ser escapado antes de entrar em HTML');
console.log('Presidente FC smoke tests: PASS');
