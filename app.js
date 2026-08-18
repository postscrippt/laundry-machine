const locations = [
  { id: 'dorm-a', name: 'University Dorm A', distance: '120 m', available: 0, total: 9, queue: 3, wait: 18, open: true },
  { id: 'campus', name: 'Campus Residence', distance: '450 m', available: 3, total: 12, queue: 1, wait: 8, open: true },
  { id: 'easywash', name: 'EasyWash Student Laundry', distance: '900 m', available: 0, total: 16, queue: 4, wait: 24, open: true }
];

const machines = [
  { id: 1, name: 'Washer 1', type: 'washer', status: 'occupied', detail: '12 min remaining · next at 7:20 PM' },
  { id: 2, name: 'Washer 2', type: 'washer', status: 'occupied', detail: '18 min remaining · next at 7:26 PM' },
  { id: 3, name: 'Washer 3', type: 'washer', status: 'reserved', detail: 'Reserved until 7:05 PM' },
  { id: 4, name: 'Washer 4', type: 'washer', status: 'occupied', detail: '31 min remaining · next at 7:39 PM' },
  { id: 5, name: 'Washer 5', type: 'washer', status: 'maintenance', detail: 'Under maintenance' },
  { id: 6, name: 'Washer 6', type: 'washer', status: 'occupied', detail: '8 min remaining · next at 7:16 PM' },
  { id: 7, name: 'Dryer 1', type: 'dryer', status: 'available', detail: 'Ready now' },
  { id: 8, name: 'Dryer 2', type: 'dryer', status: 'occupied', detail: '21 min remaining' },
  { id: 9, name: 'Dryer 3', type: 'dryer', status: 'reserved', detail: 'Reserved until 7:30 PM' }
];

const state = {
  route: 'welcome', previous: 'home', machineTab: 'washer', joinedQueue: false, claimReady: false,
  selectedMachine: 'Washer 4', selectedSlot: '8:15 PM – 9:00 PM', booking: null,
  sessionSeconds: 38 * 60 + 42, sessionStarted: false, warnings: 1, adminTab: 'machines'
};

const app = document.querySelector('#app');
const topbar = document.querySelector('#topbar');
const bottomNav = document.querySelector('#bottomNav');
const backButton = document.querySelector('#backButton');
const esc = value => String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

function statusLabel(status) {
  return { available: 'Available', occupied: 'In use', reserved: 'Reserved', maintenance: 'Maintenance' }[status] || status;
}

function locationCard(loc) {
  const available = loc.available > 0;
  return `<article class="location-card" data-location="${loc.id}">
    <div class="card-top"><div><h3>${esc(loc.name)}</h3><span class="subtle">⌖ ${loc.distance} away</span></div>
      <span class="status ${available ? 'available' : 'occupied'}">${available ? `${loc.available} available` : 'All occupied'}</span></div>
    <div class="location-meta"><span><strong>${loc.total}</strong> machines</span><span><strong>${loc.queue}</strong> waiting</span><span><strong>${loc.wait} min</strong> estimated</span></div>
  </article>`;
}

const screens = {
  welcome: () => `<section class="login-screen">
    <div class="brand"><span class="brand-mark">sQ</span><span>sPinnyQ</span></div>
    <div><div class="login-visual"><div class="bubble"><strong>No waiting.</strong></div></div>
      <div class="login-copy"><p class="eyebrow">Know before you go</p><h1>Make laundry fit your day.</h1><p>See what’s free, join the queue, and get notified when it’s your turn.</p></div></div>
    <button class="btn btn-lime btn-block" data-action="enter">Get started <span>→</span></button>
  </section>`,

  home: () => `<section class="screen">
    <div class="hero-card"><p class="eyebrow">Tuesday · 6:58 PM</p><h1>Good evening, Ploy.</h1><p>Your closest laundry room is busy. Join the queue now and save the walk.</p>
      <div class="quick-stats"><div class="quick-stat"><strong>18 min</strong><span>shortest nearby wait</span></div><div class="quick-stat"><strong>3 free</strong><span>across nearby rooms</span></div></div>
    </div>
    <div class="section-head"><h2>Near you</h2><button class="text-button" data-route="nearby">View map</button></div>
    <div class="location-list">${locations.map(locationCard).join('')}</div>
  </section>`,

  nearby: () => `<section class="screen"><p class="eyebrow">Within 1 kilometre</p><h1>Nearby laundry</h1><p class="subtle">Live availability from three locations.</p>
    <div class="map"><div class="pin one" data-location="dorm-a"><span>A</span></div><div class="pin two" data-location="campus"><span>B</span></div><div class="pin three" data-location="easywash"><span>E</span></div></div>
    <div class="location-list">${locations.map(locationCard).join('')}</div></section>`,

  room: () => `<section class="screen"><p class="eyebrow">Open until 11:00 PM</p><h1>University Dorm A</h1><p class="subtle">Building A, ground floor · 120 m away</p>
    <div class="room-hero"><span class="subtle">Current wait</span><div class="big-number">~18 min</div><div class="room-stats"><div class="room-stat"><strong>0 / 6</strong><span>Washers free</span></div><div class="room-stat"><strong>1 / 3</strong><span>Dryers free</span></div><div class="room-stat"><strong>3</strong><span>In queue</span></div></div></div>
    <button class="btn btn-primary btn-block" data-action="join-queue">${state.joinedQueue ? 'View your queue' : 'Join washer queue · 18 min'}</button>
    <div class="tabs"><button class="tab ${state.machineTab==='washer'?'active':''}" data-tab="washer">Washers</button><button class="tab ${state.machineTab==='dryer'?'active':''}" data-tab="dryer">Dryers</button></div>
    <div class="machine-list">${machines.filter(m=>m.type===state.machineTab).map(machineCard).join('')}</div>
    <div class="section-head"><h2>Plan ahead</h2></div><button class="btn btn-soft btn-block" ${state.warnings >= 3 ? 'disabled' : 'data-route="book"'}>${state.warnings >= 3 ? 'Booking suspended for 7 days' : 'Book a future slot'}</button>
  </section>`,

  queue: () => state.claimReady ? claimScreen() : `<section class="screen"><p class="eyebrow">University Dorm A</p><h1>You’re in the queue</h1><p class="subtle">We’ll notify you when a washer is ready.</p>
    <div class="plain-card center"><div class="queue-position"><div><small>Position</small><strong>#3</strong></div></div><h2>About 24 minutes</h2><p class="subtle">Feel free to leave. We’ll keep your place.</p></div>
    <div class="section-head"><h2>Queue progress</h2><span class="subtle">3 people</span></div><div class="plain-card"><div class="queue-line"><span class="queue-num">1</span><span>Next person</span><span class="subtle">~8 min</span></div><div class="queue-line"><span class="queue-num">2</span><span>Waiting</span><span class="subtle">~16 min</span></div><div class="queue-line you"><span class="queue-num">3</span><span>You</span><span>~24 min</span></div></div>
    <button class="btn btn-lime btn-block" style="margin-top:16px" data-action="simulate-ready">Simulate machine available</button><button class="btn btn-danger btn-block" style="margin-top:9px" data-action="leave-queue">Leave queue</button></section>`,

  book: () => `<section class="screen"><p class="eyebrow">University Dorm A</p><h1>Book a washer</h1><p class="subtle">Choose an available future slot.</p>
    <label class="form-label" for="machineSelect">Machine</label><select class="select" id="machineSelect"><option>Washer 2</option><option>Washer 3</option><option selected>Washer 4</option><option>Washer 6</option></select>
    <label class="form-label">Today, August 18</label><div class="slots">${['6:00 PM – 6:45 PM','6:45 PM – 7:30 PM','7:30 PM – 8:15 PM','8:15 PM – 9:00 PM','9:00 PM – 9:45 PM'].map(s=>`<button class="slot ${state.selectedSlot===s?'selected':''}" data-slot="${s}">${s}</button>`).join('')}</div>
    <div class="notice">You’ll have 5 minutes from your booking time to scan the QR code on the washer.</div><button class="btn btn-primary btn-block" data-action="confirm-booking">Confirm booking</button></section>`,

  confirmation: () => `<section class="screen center"><div class="success-mark">✓</div><p class="eyebrow">Booking confirmed</p><h1>You’re all set.</h1><p class="subtle">We’ll remind you 10 minutes before your slot.</p>
    <div class="plain-card" style="text-align:left;margin:25px 0"><div class="row"><span class="subtle">Location</span><strong>University Dorm A</strong></div><div class="row" style="margin-top:14px"><span class="subtle">Machine</span><strong>${esc(state.booking?.machine || 'Washer 4')}</strong></div><div class="row" style="margin-top:14px"><span class="subtle">Time</span><strong>${esc(state.booking?.slot || state.selectedSlot)}</strong></div></div>
    <div class="notice" style="text-align:left"><strong>Check in at the washer.</strong><br>You must scan its QR code within 5 minutes of your booking time.</div>
    <button class="btn btn-green btn-block" data-action="scan-qr">Simulate QR check-in</button><button class="text-button" style="margin-top:12px" data-route="my-laundry">Go to My Laundry</button></section>`,

  checkin: () => `<section class="screen center"><div class="success-mark">✓</div><p class="eyebrow">Check-in successful</p><h1>${esc(state.booking?.machine || 'Washer 2')} is yours.</h1><p class="subtle">The machine QR matched your reservation. Load your clothes and start when ready.</p>
    <div class="washer-art"><div class="washer-door"></div></div><button class="btn btn-green btn-block" data-action="start-laundry">Start laundry · 39 min</button></section>`,

  session: () => `<section class="screen center"><p class="eyebrow">Laundry in progress</p><h1>${esc(state.booking?.machine || 'Washer 2')}</h1><p class="subtle">University Dorm A</p><div class="washer-art"><div class="washer-door"></div></div>
    <div class="timer" id="sessionTimer">${formatTime(state.sessionSeconds)}</div><p class="subtle">Estimated finish · 7:48 PM</p><div class="progress"><i id="sessionProgress" style="width:${Math.max(4,100-state.sessionSeconds/(39*60)*100)}%"></i></div>
    <button class="btn btn-soft btn-block" style="margin-top:28px" data-action="finish-session">Finish early</button></section>`,

  'my-laundry': () => `<section class="screen"><p class="eyebrow">Your activity</p><h1>My Laundry</h1>
    ${state.sessionStarted ? `<div class="section-head"><h2>Active laundry</h2></div><div class="plain-card"><div class="row"><div><h3>${esc(state.booking?.machine || 'Washer 2')}</h3><span class="subtle">University Dorm A</span></div><span class="status occupied">In progress</span></div><button class="btn btn-primary btn-block" style="margin-top:15px" data-route="session">View timer</button></div>` : ''}
    <div class="section-head"><h2>Upcoming</h2></div>${state.booking ? `<div class="plain-card"><div class="row"><div><h3>${esc(state.booking.machine)}</h3><span class="subtle">Today · ${esc(state.booking.slot)}</span></div><span class="status reserved">Booked</span></div><div class="row" style="margin-top:14px"><button class="btn btn-soft" data-route="confirmation">View booking</button><button class="text-button" data-action="cancel-booking">Cancel</button></div></div>` : `<div class="plain-card center subtle">No upcoming bookings yet.</div>`}
    <div class="section-head"><h2>History</h2></div><div class="plain-card"><div class="history-row"><strong>Aug 18</strong><span>Washer 2</span><span class="status available">Done</span></div><div class="history-row"><strong>Aug 16</strong><span>Washer 4</span><span class="status available">Done</span></div><div class="history-row"><strong>Aug 13</strong><span>Washer 1</span><span class="status occupied">No-show</span></div><div class="history-row"><strong>Aug 10</strong><span>Washer 3</span><span class="subtle">Cancelled</span></div></div></section>`,

  notifications: () => `<section class="screen"><div class="row"><div><p class="eyebrow">Stay in the loop</p><h1>Updates</h1></div><button class="text-button" data-action="read-all">Read all</button></div>
    <div class="notification-list"><article class="notification-card unread"><span class="notif-icon">⏱</span><div><h3>Machine available</h3><p>Washer 2 is ready. You have 5 minutes to claim it.</p><time>2 min ago</time></div></article><article class="notification-card unread"><span class="notif-icon">◫</span><div><h3>Booking reminder</h3><p>Your Washer 4 reservation begins in 10 minutes.</p><time>Today, 8:05 PM</time></div></article><article class="notification-card"><span class="notif-icon">✓</span><div><h3>Laundry complete</h3><p>Your clothes from Washer 2 were ready.</p><time>August 16</time></div></article><article class="notification-card"><span class="notif-icon" style="background:var(--yellow-soft)">!</span><div><h3>Warning 1 of 3</h3><p>You missed a reservation. Repeated no-shows may restrict booking.</p><time>August 13</time></div></article></div></section>`,

  profile: () => `<section class="screen"><div class="profile-head"><div class="profile-avatar">PK</div><h1>Ploy K.</h1><p class="subtle">Student resident · Dorm A</p></div>
    <div class="plain-card"><div class="row"><div><h3>Booking status</h3><span class="subtle">${state.warnings >= 3 ? 'Suspension ends August 25, 2026' : 'Your account is in good standing'}</span></div><span class="status ${state.warnings >= 3 ? 'occupied' : 'available'}">${state.warnings >= 3 ? 'Suspended' : 'Active'}</span></div><div style="margin-top:20px"><div class="row"><strong>No-show warnings</strong><strong>${state.warnings} / 3</strong></div><div class="warning-bar"><i class="hit"></i><i class="${state.warnings>1?'hit':''}"></i><i class="${state.warnings>2?'hit':''}"></i></div></div>${state.warnings >= 3 ? '<div class="notice"><strong>Booking suspended for 7 days.</strong><br>You can still view locations and live availability.</div>' : ''}</div>
    <div class="menu-list"><button class="menu-row"><span>Booking history</span><span>›</span></button><button class="menu-row"><span>Notification settings</span><span>›</span></button><button class="menu-row" data-action="simulate-noshow"><span>Simulate a no-show</span><span>›</span></button><button class="menu-row" data-action="logout"><span>Log out</span><span>›</span></button></div></section>`,

  admin: () => adminScreen()
};

function machineCard(m) {
  return `<article class="machine-card"><div class="machine-top"><div><h3>${m.name}</h3><span class="status ${m.status}">${statusLabel(m.status)}</span></div>${m.status==='available'?`<button class="btn btn-primary" data-route="book">Book</button>`:''}</div><div class="machine-detail">${m.detail}</div></article>`;
}

function claimScreen() {
  return `<section class="screen"><div class="claim-banner"><p class="eyebrow" style="color:var(--lime)">You’re next</p><h1>Washer 2 is ready!</h1><p>You have five minutes to claim it.</p><div class="countdown-big" id="claimTimer">05:00</div><button class="btn btn-lime btn-block" data-action="claim-machine">Claim Washer 2</button></div><button class="btn btn-danger btn-block" style="margin-top:12px" data-action="leave-queue">Leave queue</button></section>`;
}

function adminScreen() {
  return `<section class="admin-shell"><div class="row"><div><p class="eyebrow">Operations</p><h1>Admin dashboard</h1></div><button class="btn btn-soft" data-action="exit-admin">Exit</button></div>
    <div class="summary-grid"><div class="summary-card"><strong>24</strong><span>Total machines</span></div><div class="summary-card"><strong>14</strong><span>People waiting</span></div><div class="summary-card"><strong>86</strong><span>Bookings today</span></div><div class="summary-card"><strong>4</strong><span>No-shows today</span></div></div>
    <div class="section-head"><h2>Manage</h2></div><div class="admin-toggle"><button class="btn ${state.adminTab==='machines'?'btn-primary':'btn-soft'}" data-admin-tab="machines">Machines</button><button class="btn ${state.adminTab==='users'?'btn-primary':'btn-soft'}" data-admin-tab="users">Violations</button></div>
    ${state.adminTab==='machines' ? `<div class="admin-table"><table><thead><tr><th>Machine</th><th>Status</th><th>User</th><th>Time</th></tr></thead><tbody>${machines.slice(0,6).map((m,i)=>`<tr><td>${m.name}</td><td><select data-machine-status="${i}">${['available','occupied','reserved','maintenance'].map(s=>`<option value="${s}" ${m.status===s?'selected':''}>${statusLabel(s)}</option>`).join('')}</select></td><td>${m.status==='occupied'?'User '+(204+i):m.status==='reserved'?'User 107':'—'}</td><td>${m.status==='occupied'?(8+i*4)+' min':'—'}</td></tr>`).join('')}</tbody></table></div>` : `<div class="admin-table"><table><thead><tr><th>User</th><th>No-shows</th><th>Status</th><th>Action</th></tr></thead><tbody><tr><td>User 1042</td><td>1</td><td>Warning</td><td><button class="text-button">View</button></td></tr><tr><td>User 2098</td><td>2</td><td>Final warning</td><td><button class="text-button">View</button></td></tr><tr><td>User 3011</td><td>3</td><td>Suspended</td><td><button class="text-button" data-action="remove-suspension">Remove</button></td></tr></tbody></table></div>`}
  </section>`;
}

function navigate(route) {
  if (state.route !== route) state.previous = state.route === 'welcome' ? 'home' : state.route;
  state.route = route;
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function render() {
  const isWelcome = state.route === 'welcome';
  const isAdmin = state.route === 'admin';
  topbar.classList.toggle('hidden', isWelcome);
  bottomNav.classList.toggle('hidden', isWelcome || isAdmin || ['queue','book','confirmation','checkin','session','room'].includes(state.route));
  backButton.classList.toggle('hidden', !['room','queue','book','confirmation','checkin','session'].includes(state.route));
  document.querySelectorAll('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.route === state.route));
  app.innerHTML = (screens[state.route] || screens.home)();
  if (state.route === 'session' && state.sessionStarted) startSessionTimer();
}

function showToast(message) {
  const toast = document.querySelector('#toast'); toast.textContent = message; toast.classList.add('show');
  clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.classList.remove('show'), 2600);
}

function formatTime(seconds) { const m = Math.floor(seconds/60); const s = seconds%60; return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`; }
let sessionInterval;
function startSessionTimer() { clearInterval(sessionInterval); sessionInterval = setInterval(()=>{ if(state.route!=='session') return clearInterval(sessionInterval); state.sessionSeconds=Math.max(0,state.sessionSeconds-1); const el=document.querySelector('#sessionTimer'); if(el) el.textContent=formatTime(state.sessionSeconds); const bar=document.querySelector('#sessionProgress'); if(bar) bar.style.width=`${Math.max(4,100-state.sessionSeconds/(39*60)*100)}%`; if(!state.sessionSeconds){clearInterval(sessionInterval); showToast('Laundry complete — your clothes are ready!');}},1000); }

document.addEventListener('click', e => {
  const route = e.target.closest('[data-route]')?.dataset.route; if (route) { e.preventDefault(); navigate(route); return; }
  const location = e.target.closest('[data-location]'); if(location){ navigate('room'); return; }
  const tab = e.target.closest('[data-tab]')?.dataset.tab; if(tab){ state.machineTab=tab; render(); return; }
  const slot = e.target.closest('[data-slot]')?.dataset.slot; if(slot){ state.selectedSlot=slot; render(); return; }
  const adminTab = e.target.closest('[data-admin-tab]')?.dataset.adminTab; if(adminTab){state.adminTab=adminTab;render();return;}
  const action = e.target.closest('[data-action]')?.dataset.action; if(!action) return;
  const actions = {
    enter:()=>navigate('home'),
    'join-queue':()=>{state.joinedQueue=true;navigate('queue');},
    'leave-queue':()=>{state.joinedQueue=false;state.claimReady=false;showToast('You left the queue');navigate('room');},
    'simulate-ready':()=>{state.claimReady=true;render();showToast('Washer 2 is ready — you’re next!');},
    'claim-machine':()=>{state.booking={machine:'Washer 2',slot:'Now · claim by 7:13 PM'};state.joinedQueue=false;navigate('confirmation');},
    'confirm-booking':()=>{state.selectedMachine=document.querySelector('#machineSelect')?.value||'Washer 4';state.booking={machine:state.selectedMachine,slot:state.selectedSlot};navigate('confirmation');},
    'scan-qr':()=>navigate('checkin'),
    'start-laundry':()=>{state.sessionStarted=true;navigate('session');},
    'finish-session':()=>{state.sessionStarted=false;state.booking=null;state.sessionSeconds=38*60+42;clearInterval(sessionInterval);showToast('Session finished. Washer is available again.');navigate('my-laundry');},
    'cancel-booking':()=>{state.booking=null;showToast('Booking cancelled');render();},
    'read-all':()=>{document.querySelectorAll('.notification-card').forEach(n=>n.classList.remove('unread'));document.querySelector('.nav-dot')?.classList.add('hidden');showToast('All updates marked as read');},
    'simulate-noshow':()=>{state.warnings=Math.min(3,state.warnings+1);showToast(state.warnings===3?'Booking suspended for 7 days':'No-show warning added');render();},
    logout:()=>navigate('welcome'),
    'exit-admin':()=>navigate('home'),
    'remove-suspension':()=>showToast('Suspension removed for User 3011')
  }; actions[action]?.();
});

document.addEventListener('change', e => { if(e.target.matches('[data-machine-status]')){const i=Number(e.target.dataset.machineStatus);machines[i].status=e.target.value;machines[i].detail=`Status changed by admin`;showToast(`${machines[i].name} set to ${statusLabel(e.target.value)}`);}});
backButton.addEventListener('click',()=>navigate(state.previous === 'welcome' ? 'home' : state.previous));
document.querySelector('#adminButton').addEventListener('click',()=>navigate('admin'));
render();
