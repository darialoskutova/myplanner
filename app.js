const MONTHS = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
const MONTHS_NOM = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const DAYS = ['воскресенье','понедельник','вторник','среда','четверг','пятница','суббота'];
const DAYS_SHORT = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
const HOURS = Array.from({length:16},(_,i)=>i+8);
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const pad = n => String(n).padStart(2,'0');
const key = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const fromKey = s => { const [y,m,d]=s.split('-').map(Number); return new Date(y,m-1,d); };
const addDays = (d,n) => { const x=new Date(d); x.setDate(x.getDate()+n); return x; };
const startMonday = d => addDays(d,-((d.getDay()+6)%7));
const sameDay = (a,b) => key(a)===key(b);
const uid = () => crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36)+Math.random().toString(36).slice(2);

let selected = new Date(); selected.setHours(12,0,0,0);
let miniMonth = new Date(selected.getFullYear(),selected.getMonth(),1);
let view = 'day';
let tasks = JSON.parse(localStorage.getItem('my-planner-tasks') || '[]');
let notes = JSON.parse(localStorage.getItem('my-planner-notes') || '{}');

function save(){ localStorage.setItem('my-planner-tasks',JSON.stringify(tasks)); }
function tasksFor(date){ const k=key(date); return tasks.filter(t => t.date===k || (t.repeat && t.date<=k)); }
function isDone(task,date){ return task.completedDates?.includes(key(date)); }
function formatRange(){
  if(view==='day') return [`${selected.getDate()} ${MONTHS[selected.getMonth()]}`,`${DAYS[selected.getDay()]}, ${selected.getFullYear()} год`];
  if(view==='week'){
    const start=startMonday(selected), end=addDays(start,6);
    const title=start.getMonth()===end.getMonth()?`${start.getDate()}–${end.getDate()} ${MONTHS[end.getMonth()]}`:`${start.getDate()} ${MONTHS[start.getMonth()]} – ${end.getDate()} ${MONTHS[end.getMonth()]}`;
    return [title,`${start.getFullYear()} год`];
  }
  return [MONTHS_NOM[selected.getMonth()],`${selected.getFullYear()} год`];
}
function render(){
  document.body.dataset.view = view;
  const [title,sub]=formatRange(); $('#dateHeading').textContent=title; $('#dateSubheading').textContent=sub;
  $$('.view-btn,.side-link').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
  if(view==='day') renderDay(); else if(view==='week') renderWeek(); else renderMonth();
  $('#notes').value=notes[key(selected)] || ''; renderMini();
}
function taskHTML(t,date,compact=false){
  const done=isDone(t,date);
  if(compact) return `<div class="${view==='week'?'week-task':'month-task'} ${done?'done':''}" data-task="${t.id}" data-date="${key(date)}">${t.repeat?'↻ ':''}${escapeHTML(t.title)}</div>`;
  return `<div class="task ${done?'done':''}" data-task="${t.id}"><input class="task-check" type="checkbox" ${done?'checked':''} aria-label="Отметить задачу"><span class="task-name">${escapeHTML(t.title)}${t.repeat?'<span class="repeat-icon" title="Повторяется ежедневно"> ↻</span>':''}</span><button class="edit-task" aria-label="Редактировать">⋯</button></div>`;
}
function escapeHTML(s){ const d=document.createElement('div'); d.textContent=s; return d.innerHTML; }
function renderDay(){
  $('#calendarView').innerHTML=`<div class="day-view">${HOURS.map(h=>{const list=tasksFor(selected).filter(t=>+t.time===h);return `<div class="time-row"><div class="time-label">${pad(h)}:00</div><div class="time-slot" data-date="${key(selected)}" data-hour="${h}">${list.map(t=>taskHTML(t,selected)).join('')}<span class="empty-hint">＋ Добавить задачу</span></div></div>`}).join('')}</div>`;
}
function renderWeek(){
  const start=startMonday(selected), dates=Array.from({length:7},(_,i)=>addDays(start,i));
  $('#calendarView').innerHTML=`<div class="week-view"><div class="week-grid"><div class="week-head"><div></div>${dates.map((d,i)=>`<div class="${sameDay(d,new Date())?'is-today':''}"><div class="week-name">${DAYS_SHORT[i]}</div><div class="week-number">${d.getDate()}</div></div>`).join('')}</div>${HOURS.map(h=>`<div class="week-row"><div class="week-time">${pad(h)}:00</div>${dates.map(d=>`<div class="week-cell" data-date="${key(d)}" data-hour="${h}">${tasksFor(d).filter(t=>+t.time===h).map(t=>taskHTML(t,d,true)).join('')}</div>`).join('')}</div>`).join('')}</div></div>`;
}
function renderMonth(){
  const first=new Date(selected.getFullYear(),selected.getMonth(),1), start=startMonday(first);
  const dates=Array.from({length:42},(_,i)=>addDays(start,i));
  $('#calendarView').innerHTML=`<div class="month-view">${DAYS_SHORT.map(d=>`<div class="month-weekday">${d}</div>`).join('')}${dates.map(d=>{const list=tasksFor(d);return `<div class="month-day ${d.getMonth()!==selected.getMonth()?'other':''} ${sameDay(d,new Date())?'is-today':''}" data-date="${key(d)}"><span class="day-number">${d.getDate()}</span>${list.slice(0,3).map(t=>taskHTML(t,d,true)).join('')}${list.length>3?`<div class="more-tasks">ещё ${list.length-3}</div>`:''}</div>`}).join('')}</div>`;
}
function renderMini(){
  $('#miniTitle').textContent=`${MONTHS_NOM[miniMonth.getMonth()]} ${miniMonth.getFullYear()}`;
  const start=startMonday(miniMonth);
  $('#miniGrid').innerHTML=Array.from({length:42},(_,i)=>addDays(start,i)).map(d=>`<button class="mini-day ${d.getMonth()!==miniMonth.getMonth()?'other':''} ${sameDay(d,selected)?'selected':''} ${sameDay(d,new Date())?'today':''}" data-date="${key(d)}">${d.getDate()}</button>`).join('');
}
function openTask(date=selected,hour=9,id=''){
  const t=tasks.find(x=>x.id===id); $('#taskForm').reset(); $('#taskId').value=t?.id||'';
  $('#taskTitle').value=t?.title||''; $('#taskDate').value=t?.date||key(date); $('#taskTime').value=String(t?.time??hour); $('#taskRepeat').checked=!!t?.repeat;
  $('#modalTitle').textContent=t?'Редактировать задачу':'Запланировать'; $('#deleteTask').classList.toggle('visible',!!t); $('#taskDialog').showModal(); setTimeout(()=>$('#taskTitle').focus(),50);
}
$('#taskTime').innerHTML=HOURS.map(h=>`<option value="${h}">${pad(h)}:00</option>`).join('');
$('#taskForm').addEventListener('submit',e=>{
  e.preventDefault(); const id=$('#taskId').value, old=tasks.find(t=>t.id===id);
  const data={id:id||uid(),title:$('#taskTitle').value.trim(),date:$('#taskDate').value,time:+$('#taskTime').value,repeat:$('#taskRepeat').checked,completedDates:old?.completedDates||[]};
  tasks=id?tasks.map(t=>t.id===id?data:t):[...tasks,data]; save(); $('#taskDialog').close(); render();
});
$('#calendarView').addEventListener('click',e=>{
  const taskEl=e.target.closest('[data-task]'); const cell=e.target.closest('[data-date]');
  if(e.target.matches('.task-check')&&taskEl){const t=tasks.find(x=>x.id===taskEl.dataset.task),d=key(selected);t.completedDates=t.completedDates||[];t.completedDates=e.target.checked?[...new Set([...t.completedDates,d])]:t.completedDates.filter(x=>x!==d);save();render();return}
  if(taskEl){openTask(fromKey(taskEl.dataset.date||key(selected)),9,taskEl.dataset.task);return}
  if(cell){const d=fromKey(cell.dataset.date); if(view==='month'){selected=d;view='day';render()}else openTask(d,+(cell.dataset.hour||9));}
});
$('#deleteTask').addEventListener('click',()=>{tasks=tasks.filter(t=>t.id!==$('#taskId').value);save();$('#taskDialog').close();render()});
$('#closeDialog').onclick=$('#cancelDialog').onclick=()=>$('#taskDialog').close(); $('#addTaskBtn').onclick=()=>openTask(selected,9);
$$('[data-view]').forEach(b=>b.addEventListener('click',()=>{view=b.dataset.view;render()}));
$('#prevBtn').onclick=()=>{selected=view==='day'?addDays(selected,-1):view==='week'?addDays(selected,-7):new Date(selected.getFullYear(),selected.getMonth()-1,1);miniMonth=new Date(selected.getFullYear(),selected.getMonth(),1);render()};
$('#nextBtn').onclick=()=>{selected=view==='day'?addDays(selected,1):view==='week'?addDays(selected,7):new Date(selected.getFullYear(),selected.getMonth()+1,1);miniMonth=new Date(selected.getFullYear(),selected.getMonth(),1);render()};
$('#todayBtn').onclick=()=>{selected=new Date();miniMonth=new Date(selected.getFullYear(),selected.getMonth(),1);render()};
$('#miniPrev').onclick=()=>{miniMonth=new Date(miniMonth.getFullYear(),miniMonth.getMonth()-1,1);renderMini()}; $('#miniNext').onclick=()=>{miniMonth=new Date(miniMonth.getFullYear(),miniMonth.getMonth()+1,1);renderMini()};
$('#miniGrid').addEventListener('click',e=>{const b=e.target.closest('[data-date]');if(!b)return;selected=fromKey(b.dataset.date);miniMonth=new Date(selected.getFullYear(),selected.getMonth(),1);view='day';render()});
let noteTimer; $('#notes').addEventListener('input',e=>{notes[key(selected)]=e.target.value;localStorage.setItem('my-planner-notes',JSON.stringify(notes));clearTimeout(noteTimer);$('#noteSaved').classList.add('show');noteTimer=setTimeout(()=>$('#noteSaved').classList.remove('show'),1200)});
const hour=new Date().getHours(); $('#pageTitle').textContent=hour<12?'Доброе утро!':hour<18?'Добрый день!':'Добрый вечер!';
render();
