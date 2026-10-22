'use strict';
const $ = id => document.getElementById(id);
const WORD_COUNT = 25;
const storageKey = 'spellingBee2026ExamHistoryV1';
const pools = {};
let exam = null, timer = null, runId = 0, activeSpeech = null, voices = [];
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clean = value => String(value ?? '').trim().toLocaleLowerCase('en');
const ordinal = n => String(n).padStart(2, '0');
function voiceList() { if ('speechSynthesis' in window) voices = speechSynthesis.getVoices(); }
if ('speechSynthesis' in window) { voiceList(); speechSynthesis.addEventListener?.('voiceschanged', voiceList); }
function voiceFor() {
 const accent = exam?.accent || $('accent').value;
 const exact = voices.filter(v => v.lang.toLowerCase().replace('_','-') === accent.toLowerCase());
 const english = voices.filter(v => /^en/i.test(v.lang));
 return (exact.find(v => v.localService) || exact[0] || english[0] || null);
}
function stopSpeech() {
 if (activeSpeech) { const resolve = activeSpeech; activeSpeech = null; resolve(false); }
 if ('speechSynthesis' in window) speechSynthesis.cancel();
}
function say(text, token) {
 return new Promise(resolve => {
  if (token !== runId || !exam || exam.paused) return resolve(false);
  if (!('speechSynthesis' in window)) { $('audioNote').textContent = 'Speech is not available in this browser. Please use a browser with speech synthesis.'; return resolve(false); }
  let settled = false, watchdog;
  const finish = ok => { if (settled) return; settled = true; clearTimeout(watchdog); if (activeSpeech === cancel) activeSpeech = null; resolve(ok); };
  const cancel = () => finish(false); activeSpeech = cancel;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = exam.accent; u.rate = exam.speed; u.pitch = 1;
  const v = voiceFor(); if (v) u.voice = v;
  u.onend = () => finish(true); u.onerror = () => finish(false);
  // Fail safely rather than trapping the exam forever if a device voice hangs.
  watchdog = setTimeout(() => { speechSynthesis.cancel(); finish(false); }, Math.max(9000, text.length * 165));
  try { speechSynthesis.speak(u); } catch (_) { finish(false); }
 });
}
function clearTimer() { if (timer) { clearInterval(timer); timer = null; } }
function invalidate() { runId++; clearTimer(); stopSpeech(); }
function show(id) { for (const section of ['setup','exam','results']) $(section).hidden = section !== id; }
function shuffle(items) { const a = items.slice(); for(let i=a.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
async function loadBanks() {
 try {
  for (const group of ['B','C']) for (const source of ['2026','combined']) {
   const response = await fetch(`data/group-${group.toLowerCase()}-${source}.json`, {cache:'no-cache'});
   if (!response.ok) throw new Error(`Could not load Group ${group} (${source}).`);
   const data = await response.json();
   if (!Array.isArray(data) || data.length < WORD_COUNT) throw new Error(`Not enough words in Group ${group}.`);
   pools[`${group}-${source}`] = data;
  }
  $('start').disabled = false; updateBankStatus();
 } catch (err) { $('bankStatus').textContent = `Unable to load word lists: ${err.message} Serve this folder through GitHub Pages or a local web server, not file://.`; }
}
function updateBankStatus() { const pool = pools[`${$('group').value}-${$('source').value}`]; $('bankStatus').textContent = pool ? `${pool.length} unique words available. The exam will choose 25 without repeats.` : 'Loading…'; }
$('group').addEventListener('change', updateBankStatus); $('source').addEventListener('change', updateBankStatus);
function renderQuestion() {
 $('counter').textContent = `${ordinal(exam.index+1)} / ${WORD_COUNT}`;
 $('examGroup').textContent = `GROUP ${exam.group} · ${exam.method === 'paper' ? 'PAPER' : 'TYPING'}`;
 $('progress').style.width = `${exam.index / WORD_COUNT * 100}%`;
 $('typingArea').hidden = exam.method !== 'typing';
 $('answer').value = exam.answers[exam.index] || '';
 $('countdown').textContent = '--';
 $('audioNote').textContent = 'Keep this tab active and your device sound on.';
}
async function readQuestion(token, announcement=true) {
 if (!exam || token !== runId || exam.paused) return;
 exam.phase='speaking'; renderQuestion();
 $('phase').textContent='JUDGE IS SPEAKING'; $('headline').textContent='Listen carefully';
 $('detail').textContent='Word → example sentence → word';
 const item=exam.words[exam.index];
 const parts = [...(announcement ? [exam.index===0 ? 'Word number one.' : 'Next word is.'] : []), item.word, item.sentence, item.word];
 let failures=0;
 for (const part of parts) {
  if (token !== runId || exam.paused) return;
  const ok = await say(part,token);
  if (token !== runId || exam.paused) return;
  if (!ok) failures++;
  await sleep(250);
 }
 if (token !== runId || exam.paused) return;
 if (failures) $('audioNote').textContent = 'Some audio did not play. Check your browser voice settings. You can pause and repeat the current word.';
 exam.remaining=exam.seconds;
 startCountdown(token);
}
function startCountdown(token) {
 if (!exam || token !== runId || exam.paused) return;
 exam.phase='countdown';
 $('phase').textContent='SPELLING TIME'; $('headline').textContent='Spell the word now';
 $('detail').textContent=exam.method==='paper' ? 'Write your answer on paper. The next word starts automatically.' : 'Type your answer. It will be saved automatically.';
 $('countdown').textContent=String(exam.remaining).padStart(2,'0');
 if (exam.method==='typing') $('answer').focus();
 clearTimer();
 let target=performance.now()+exam.remaining*1000;
 timer=setInterval(() => {
  if (!exam || token!==runId || exam.paused) { clearTimer(); return; }
  const next=Math.max(0,Math.ceil((target-performance.now())/1000));
  exam.remaining=next; $('countdown').textContent=String(next).padStart(2,'0');
  if (next===0) { clearTimer(); advance(token); }
 },100);
}
async function advance(token) {
 if (!exam || token!==runId || exam.paused) return;
 if (exam.method==='typing') exam.answers[exam.index]=$('answer').value.trim();
 exam.index++;
 if (exam.index>=WORD_COUNT) { finishExam(false); return; }
 // New question begins automatically without another click.
 await readQuestion(token,true);
}
function startExam() {
 invalidate();
 const group=$('group').value, source=$('source').value;
 const pool=pools[`${group}-${source}`]; if (!pool) return;
 exam={group,source,method:$('method').value,seconds:Number($('seconds').value),accent:$('accent').value,speed:Number($('speed').value),words:shuffle(pool).slice(0,WORD_COUNT),answers:Array(WORD_COUNT).fill(''),index:0,phase:'speaking',remaining:0,paused:false,startedAt:new Date().toISOString()};
 show('exam'); $('pause').textContent='Pause exam';
 readQuestion(runId,true);
}
function pauseResume() {
 if (!exam) return;
 if (!exam.paused) {
  const wasSpeaking=exam.phase==='speaking';
  if (exam.method==='typing' && exam.phase==='countdown') exam.answers[exam.index]=$('answer').value;
  exam.paused=true; exam.resumeSpeaking=wasSpeaking;
  invalidate(); $('phase').textContent='EXAM PAUSED'; $('headline').textContent='Take your time';
  $('detail').textContent=wasSpeaking ? 'Resume to replay the current word from the beginning.' : 'Resume to continue the countdown.';
  $('pause').textContent='▶ Resume exam';
 } else {
  exam.paused=false; $('pause').textContent='Pause exam';
  if (exam.resumeSpeaking) readQuestion(runId,false);
  else { if (exam.method==='typing') $('answer').value=exam.answers[exam.index]||''; startCountdown(runId); }
 }
}
function replay() {
 if (!exam) return;
 if (exam.method==='typing') exam.answers[exam.index]=$('answer').value;
 invalidate(); exam.paused=false; $('pause').textContent='Pause exam';
 readQuestion(runId,false);
 if (exam.method==='typing') $('answer').value=exam.answers[exam.index]||'';
}
function finishExam(early) {
 if (!exam) return;
 if (exam.method==='typing' && exam.phase==='countdown' && exam.index<WORD_COUNT) exam.answers[exam.index]=$('answer').value.trim();
 invalidate(); exam.finishedAt=new Date().toISOString(); exam.completed=!early;
 const done=early ? Math.min(WORD_COUNT,exam.index+1) : WORD_COUNT;
 $('resultMeta').textContent=`Group ${exam.group} · ${exam.source==='2026'?'2026 PDF only':'Combined lists'} · ${done} of 25 words · ${exam.method==='paper'?'Paper exam':'Typing exam'}`;
 let correct=0;
 const rows=exam.words.map((item,i)=>{
  const answer=exam.answers[i]||''; const ok=clean(answer)===clean(item.word);
  if (exam.method==='typing' && ok) correct++;
  return `<tr><td>${i+1}</td><td><strong>${escapeHTML(item.word)}</strong></td><td>${escapeHTML(item.sentence)}</td><td>${exam.method==='typing' ? escapeHTML(answer||'—') : '____________'}</td><td>${exam.method==='typing' ? `<span class="${ok?'good':'bad'}">${ok?'✓':'✕'}</span>` : '—'}</td></tr>`;
 });
 $('scoreBlock').textContent=exam.method==='typing' ? `Score: ${correct} / 25 (${Math.round(correct/25*100)}%)` : 'Answer key · Check your written answers';
 $('review').innerHTML=`<table><thead><tr><th>#</th><th>Correct word</th><th>Example sentence</th><th>${exam.method==='typing'?'Your answer':'Paper answer'}</th><th>Result</th></tr></thead><tbody>${rows.join('')}</tbody></table>`;
 try {
  const history=JSON.parse(localStorage.getItem(storageKey)||'[]');
  history.unshift({group:exam.group,source:exam.source,method:exam.method,date:exam.finishedAt,completed:exam.completed,score:exam.method==='typing'?correct:null,words:exam.words.map((w,i)=>({word:w.word,answer:exam.answers[i],correct:clean(exam.answers[i])===clean(w.word)}))});
  localStorage.setItem(storageKey,JSON.stringify(history.slice(0,40)));
 } catch (_) { /* Storage can be disabled by privacy settings. */ }
 $('progress').style.width='100%'; show('results');
}
function csv() {
 const header=['Number','Correct word','Sentence','Your answer','Correct','Source'];
 const lines=[header,...exam.words.map((w,i)=>[i+1,w.word,w.sentence,exam.method==='typing'?exam.answers[i]:'',exam.method==='typing'?clean(exam.answers[i])===clean(w.word):'',w.origin])];
 return '\ufeff'+lines.map(row=>row.map(value=>'"'+String(value??'').replaceAll('"','""')+'"').join(',')).join('\r\n');
}
$('start').addEventListener('click',startExam);
$('pause').addEventListener('click',pauseResume);
$('replay').addEventListener('click',replay);
$('quit').addEventListener('click',()=>{if(confirm('End this exam early and show the answer key?')) finishExam(true);});
$('newExam').addEventListener('click',()=>{invalidate();exam=null;show('setup');});
$('print').addEventListener('click',()=>window.print());
$('export').addEventListener('click',()=>{if(!exam)return;const blob=new Blob([csv()],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`spelling-bee-group-${exam.group}-${Date.now()}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
$('answer').addEventListener('keydown',e=>{if(e.key==='Enter')e.preventDefault();});
window.addEventListener('pagehide',()=>{if(exam)invalidate();});
loadBanks();
