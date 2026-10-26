'use strict';
const element=(name,className='',text='')=>{const el=document.createElement(name);if(className)el.className=className;if(text)el.textContent=text;return el;};
const link=(label,url)=>{const a=element('a','secondary',label);a.href=url;return a;};
const $=id=>document.getElementById(id);
async function getJson(path){const r=await fetch(path);if(!r.ok)throw new Error(`${path}: ${r.status}`);return r.json();}
function categoryCard(cat){
 const card=element('article','category-card');
 const small=element('div','category-count',`${cat.words.length}-WORD SKILL`);
 card.append(small,element('h3','',cat.name),element('p','category-desc',cat.description));
 const evidence=element('div','category-evidence');
 evidence.append(element('strong','','From your Jack notes: '),element('span','',cat.observed.length?cat.observed.join(' · '):'Related spelling features'));
 card.append(evidence);
 const actions=element('div','actions');
 actions.append(link('🧩 Learn',`learning.html?group=B&source=patterns&category=${encodeURIComponent(cat.id)}`),link('✍️ Test',`practice.html?bank=pattern-${encodeURIComponent(cat.id)}`),link('🏆 Exam',`index.html?group=B&source=patterns&category=${encodeURIComponent(cat.id)}`));
 card.append(actions);
 const more=element('details','word-preview');
 more.append(element('summary','','See all 25 words'));
 const words=element('div','word-cloud');
 for(const w of cat.words)words.append(element('span','word-chip',w.word));
 more.append(words);card.append(more);
 return card;
}
function jackCard(number,words){
 const card=element('article','jack-card');
 card.append(element('h3','',`Jack ${number} · ${words.length} likely words`));
 const ol=element('ol','jack-words');
 for(const word of words){
  const li=element('li');li.value=word.round_position;li.textContent=word.word;ol.append(li);
 }
 card.append(ol);
 const buttons=element('div','actions');
 buttons.append(link('Learn these words',`learning.html?group=B&source=jack${number}`),link('Take a test',`practice.html?bank=jack${number}`),link('Audio exam',`index.html?group=B&source=jack${number}`));card.append(buttons);
 return card;
}
function uncertaintyTable(entries){
 const box=element('div','review');const table=element('table');
 const thead=element('thead');const head=element('tr');for(const text of ['List & number','Your note','Possible interpretations (unconfirmed)'])head.append(element('th','',text));thead.append(head);table.append(thead);
 const body=element('tbody');
 for(const e of entries){const row=element('tr');for(const value of [`Jack ${e.jack}, #${e.number}`,e.heard,e.possibilities.join(' / ')])row.append(element('td','',value));body.append(row);}
 table.append(body);box.append(table);return box;
}
async function load(){
 try{
  const [cats,j1,j2,uncertain]=await Promise.all([getJson('data/spelling-categories.json'),getJson('data/jack-1.json'),getJson('data/jack-2.json'),getJson('data/needs-audio-verification.json')]);
  $('categoryGrid').replaceChildren(...cats.map(categoryCard));
  $('jackLists').replaceChildren(jackCard(1,j1),jackCard(2,j2));
  $('unconfirmed').replaceChildren(uncertaintyTable(uncertain));
 }catch(e){$('categoryGrid').textContent=`Could not load word lists (${e.message}). Use a web server or GitHub Pages, not file://.`;$('jackLists').textContent='';}
}
load();
