const locations = [
  { id: 'dorm-a', name: 'University Dorm A', shortName: 'Dorm A', address: 'Building A, ground floor', distance: '120 m', available: 1, total: 9, queue: 3, wait: 18, hours: 'Open until 11:00 PM', open: true },
  { id: 'campus', name: 'Campus Residence Laundry', shortName: 'Campus Residence', address: 'Residence Hall, level 1', distance: '450 m', available: 3, total: 12, queue: 1, wait: 8, hours: 'Open 24 hours', open: true },
  { id: 'easywash', name: 'EasyWash Student Laundry', shortName: 'EasyWash', address: '18 University Road', distance: '900 m', available: 0, total: 16, queue: 4, wait: 24, hours: 'Open until midnight', open: true }
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

const locationMachines = {
  'dorm-a': machines,
  campus: [
    { id: 101, name: 'Washer 1', type: 'washer', status: 'available', detail: 'Ready now' },
    { id: 102, name: 'Washer 2', type: 'washer', status: 'occupied', detail: '9 min remaining · next at 7:17 PM' },
    { id: 103, name: 'Washer 3', type: 'washer', status: 'available', detail: 'Ready now' },
    { id: 104, name: 'Washer 4', type: 'washer', status: 'reserved', detail: 'Reserved until 7:30 PM' },
    { id: 105, name: 'Washer 5', type: 'washer', status: 'occupied', detail: '26 min remaining · next at 7:34 PM' },
    { id: 106, name: 'Washer 6', type: 'washer', status: 'occupied', detail: '14 min remaining · next at 7:22 PM' },
    { id: 107, name: 'Washer 7', type: 'washer', status: 'maintenance', detail: 'Service expected tomorrow' },
    { id: 108, name: 'Washer 8', type: 'washer', status: 'occupied', detail: '33 min remaining · next at 7:41 PM' },
    { id: 109, name: 'Dryer 1', type: 'dryer', status: 'available', detail: 'Ready now' },
    { id: 110, name: 'Dryer 2', type: 'dryer', status: 'occupied', detail: '11 min remaining' },
    { id: 111, name: 'Dryer 3', type: 'dryer', status: 'reserved', detail: 'Reserved until 7:25 PM' },
    { id: 112, name: 'Dryer 4', type: 'dryer', status: 'occupied', detail: '19 min remaining' }
  ],
  easywash: [
    ...Array.from({ length: 10 }, (_, i) => ({ id: 201 + i, name: `Washer ${i + 1}`, type: 'washer', status: i === 7 ? 'maintenance' : i === 3 || i === 8 ? 'reserved' : 'occupied', detail: i === 7 ? 'Temporarily out of service' : i === 3 || i === 8 ? `Reserved until ${i === 3 ? '7:30' : '8:15'} PM` : `${12 + i * 3} min remaining` })),
    ...Array.from({ length: 6 }, (_, i) => ({ id: 211 + i, name: `Dryer ${i + 1}`, type: 'dryer', status: i === 4 ? 'maintenance' : i === 2 ? 'reserved' : 'occupied', detail: i === 4 ? 'Maintenance in progress' : i === 2 ? 'Reserved until 7:45 PM' : `${8 + i * 4} min remaining` }))
  ]
};

const state = {
  route: 'welcome', history: [], selectedLocationId: 'dorm-a', queueLocationId: null, machineTab: 'washer', selectedMachineId: 1, joinedQueue: false, claimReady: false,
  selectedMachine: 'Washer 4', selectedSlot: '8:15 PM – 9:00 PM', booking: null,
  paymentMethod: null, reservedMachineIds: new Set(), readyPopup: null, cancelTarget: null, editingBooking: false, sessionSeconds: 38 * 60 + 42, sessionStarted: false, warnings: 1, adminTab: 'machines',
  profile: { name: 'Ploy K.', email: 'ploy.k@example.com', phone: '081 234 5678', role: 'Student resident', residence: 'Dorm A' }
};

const app = document.querySelector('#app');
const topbar = document.querySelector('#topbar');
const bottomNav = document.querySelector('#bottomNav');
const backButton = document.querySelector('#backButton');
const esc = value => String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const selectedLocation = () => locations.find(location => location.id === state.selectedLocationId) || locations[0];
const selectedMachines = () => locationMachines[state.selectedLocationId] || machines;
const reservationKey = (machineId, locationId = state.selectedLocationId) => `${locationId}:${machineId}`;
const profileInitials = () => state.profile.name.split(/\s+/).filter(Boolean).slice(0,2).map(part=>part[0]).join('').toUpperCase() || 'U';

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
    <div class="brand"><img class="brand-logo" src="spinnyq-logo.svg" alt="" /><span>sPinnyQ</span></div>
    <div><div class="login-visual"><div class="bubble"><strong>No waiting.</strong></div></div>
      <div class="login-copy"><p class="eyebrow">Know before you go</p><h1>Make laundry fit your day.</h1><p>See what’s free, join the queue, and get notified when it’s your turn.</p></div></div>
    <button class="btn btn-lime btn-block" data-action="enter">Get started <span>→</span></button>
  </section>`,

  home: () => `<section class="screen">
    <div class="hero-card"><p class="eyebrow">Tuesday · 6:58 PM</p><h1>Good evening, ${esc(state.profile.name.split(/\s+/)[0])}.</h1><p>Your closest laundry room is busy. Join the queue now and save the walk.</p>
      <div class="quick-stats"><div class="quick-stat"><strong>18 min</strong><span>shortest nearby wait</span></div><div class="quick-stat"><strong>3 free</strong><span>across nearby rooms</span></div></div>
    </div>
    ${homeLaundryStatus()}
    <div class="section-head"><h2>Near you</h2><button class="text-button" data-route="nearby">View map</button></div>
    <div class="location-list">${locations.map(locationCard).join('')}</div>
  </section>`,

  nearby: () => `<section class="screen"><p class="eyebrow">Within 1 kilometre</p><h1>Nearby laundry</h1><p class="subtle">Live availability from three locations.</p>
    <div class="map"><div class="pin one" data-location="dorm-a"><span>A</span></div><div class="pin two" data-location="campus"><span>B</span></div><div class="pin three" data-location="easywash"><span>E</span></div></div>
    <div class="location-list">${locations.map(locationCard).join('')}</div></section>`,

  room: () => { const location=selectedLocation(), roomMachines=selectedMachines(), washers=roomMachines.filter(m=>m.type==='washer'), dryers=roomMachines.filter(m=>m.type==='dryer'), queueHere=state.joinedQueue&&state.queueLocationId===location.id; return `<section class="screen"><p class="eyebrow">${location.hours}</p><h1>${location.name}</h1><p class="subtle">${location.address} · ${location.distance} away</p>
    <div class="room-hero"><span class="subtle">Current wait</span><div class="big-number">~${location.wait} min</div><div class="room-stats"><div class="room-stat"><strong>${washers.filter(m=>m.status==='available').length} / ${washers.length}</strong><span>Washers free</span></div><div class="room-stat"><strong>${dryers.filter(m=>m.status==='available').length} / ${dryers.length}</strong><span>Dryers free</span></div><div class="room-stat"><strong>${location.queue}</strong><span>In queue</span></div></div></div>
    <button class="btn btn-primary btn-block" data-action="join-queue">${queueHere ? 'View your queue' : `Join washer queue · ${location.wait} min`}</button>
    <div class="tabs"><button class="tab ${state.machineTab==='washer'?'active':''}" data-tab="washer">Washers</button><button class="tab ${state.machineTab==='dryer'?'active':''}" data-tab="dryer">Dryers</button></div>
    <div class="machine-list">${roomMachines.filter(m=>m.type===state.machineTab).map(machineCard).join('')}</div>
    <div class="section-head"><h2>Plan ahead</h2></div><button class="btn btn-soft btn-block" ${state.warnings >= 3 ? 'disabled' : 'data-route="book"'}>${state.warnings >= 3 ? 'Booking suspended for 7 days' : 'Book a future slot'}</button>
  </section>`; },

  machine: () => machineDetailScreen(),

  queue: () => state.claimReady ? claimScreen() : `<section class="screen"><p class="eyebrow">${selectedLocation().name}</p><h1>You’re in the queue</h1><p class="subtle">We’ll notify you when a washer is ready.</p>
    <div class="plain-card center"><div class="queue-position"><div><small>Position</small><strong>#3</strong></div></div><h2>About 24 minutes</h2><p class="subtle">Feel free to leave. We’ll keep your place.</p></div>
    <div class="section-head"><h2>Queue progress</h2><span class="subtle">3 people</span></div><div class="plain-card"><div class="queue-line"><span class="queue-num">1</span><span>Next person</span><span class="subtle">~8 min</span></div><div class="queue-line"><span class="queue-num">2</span><span>Waiting</span><span class="subtle">~16 min</span></div><div class="queue-line you"><span class="queue-num">3</span><span>You</span><span>~24 min</span></div></div>
    <div class="action-stack queue-actions"><button class="btn btn-lime btn-block" data-action="simulate-ready">Simulate machine available</button><button class="btn btn-danger btn-block" data-action="leave-queue">Leave queue</button></div></section>`,

  book: () => `<section class="screen"><p class="eyebrow">${state.editingBooking ? 'Edit reservation' : selectedLocation().name}</p><h1>${state.editingBooking ? 'Edit your booking' : 'Book a washer'}</h1><p class="subtle">${state.editingBooking ? `Update your existing reservation at ${selectedLocation().name}.` : 'Choose an available future slot.'}</p>
    <label class="form-label" for="machineSelect">Machine</label><select class="select" id="machineSelect">${selectedMachines().filter(m=>m.type==='washer').map(m=>`<option ${state.selectedMachine===m.name?'selected':''}>${m.name}</option>`).join('')}</select>
    <label class="form-label">Today, August 18</label><div class="slots">${['6:00 PM – 6:45 PM','6:45 PM – 7:30 PM','7:30 PM – 8:15 PM','8:15 PM – 9:00 PM','9:00 PM – 9:45 PM'].map(s=>`<button class="slot ${state.selectedSlot===s?'selected':''}" data-slot="${s}">${s}</button>`).join('')}</div>
    <div class="notice">${state.editingBooking ? '<strong>Editing existing reservation.</strong><br>Your current booking stays active until you save these changes.' : 'You’ll have 5 minutes from your booking time to scan the QR code on the washer.'}</div><button class="btn btn-primary btn-block" data-action="confirm-booking">${state.editingBooking ? 'Save reservation changes' : 'Confirm booking'}</button></section>`,

  confirmation: () => `<section class="screen center"><div class="success-mark">✓</div><p class="eyebrow">Booking confirmed</p><h1>You’re all set.</h1><p class="subtle">We’ll remind you 10 minutes before your slot.</p>
    <div class="plain-card" style="text-align:left;margin:25px 0"><div class="row"><span class="subtle">Location</span><strong>${esc(state.booking?.location || selectedLocation().name)}</strong></div><div class="row" style="margin-top:14px"><span class="subtle">Machine</span><strong>${esc(state.booking?.machine || 'Washer 4')}</strong></div><div class="row" style="margin-top:14px"><span class="subtle">Time</span><strong>${esc(state.booking?.slot || state.selectedSlot)}</strong></div></div>
    <div class="notice" style="text-align:left"><strong>Check in at the washer.</strong><br>You must scan its QR code within 5 minutes of your booking time.</div>
    <div class="action-stack"><button class="btn btn-green btn-block" data-action="scan-qr">Simulate QR check-in</button><button class="btn btn-soft btn-block" data-route="my-laundry">Go to My Laundry</button></div></section>`,

  checkin: () => `<section class="screen center"><div class="success-mark">✓</div><p class="eyebrow">Check-in successful</p><h1>${esc(state.booking?.machine || 'Washer 2')} is yours.</h1><p class="subtle">The machine QR matched your reservation. Load your clothes and start when ready.</p>
    <div class="washer-art"><div class="washer-door"></div></div><button class="btn btn-green btn-block" data-route="payment">Continue to payment</button></section>`,

  payment: () => paymentScreen(),

  session: () => `<section class="screen center"><p class="eyebrow">Laundry in progress</p><h1>${esc(state.booking?.machine || 'Washer 2')}</h1><p class="subtle">${esc(state.booking?.location || selectedLocation().name)}</p><div class="washer-art"><div class="washer-door"></div></div>
    <div class="timer" id="sessionTimer">${formatTime(state.sessionSeconds)}</div><p class="subtle">Estimated finish · 7:48 PM</p><div class="progress"><i id="sessionProgress" style="width:${Math.max(4,100-state.sessionSeconds/(39*60)*100)}%"></i></div>
    <button class="btn btn-soft btn-block" style="margin-top:28px" data-action="finish-session">Finish early</button></section>`,

  'my-laundry': () => `<section class="screen"><p class="eyebrow">Your activity</p><h1>My Laundry</h1>
    ${state.sessionStarted ? `<div class="section-head"><h2>Active laundry</h2></div><div class="plain-card"><div class="row"><div><h3>${esc(state.booking?.machine || 'Washer 2')}</h3><span class="subtle">${esc(state.booking?.location || selectedLocation().name)}</span></div><span class="status occupied">In progress</span></div><button class="btn btn-primary btn-block" style="margin-top:15px" data-route="session">View timer</button></div>` : ''}
    <div class="section-head"><h2>Upcoming</h2></div>${state.booking ? `<div class="plain-card"><div class="row"><div><h3>${esc(state.booking.machine)}</h3><span class="subtle">Today · ${esc(state.booking.slot)}</span></div><span class="status reserved">Booked</span></div><div class="booking-card-actions"><button class="btn btn-soft" data-route="confirmation">View booking</button>${state.booking.source==='future'?'<button class="text-button" data-edit-reservation>Edit</button>':''}<button class="text-button cancel-text" data-cancel-reservation>Cancel</button></div></div>` : `<div class="plain-card center subtle">No upcoming bookings yet.</div>`}
    <div class="section-head"><h2>History</h2></div><div class="plain-card"><div class="history-row"><strong>Aug 18</strong><span>Washer 2</span><span class="status available">Done</span></div><div class="history-row"><strong>Aug 16</strong><span>Washer 4</span><span class="status available">Done</span></div><div class="history-row"><strong>Aug 13</strong><span>Washer 1</span><span class="status occupied">No-show</span></div><div class="history-row"><strong>Aug 10</strong><span>Washer 3</span><span class="subtle">Cancelled</span></div></div></section>`,

  notifications: () => notificationsScreen(),

  profile: () => `<section class="screen"><div class="profile-head"><div class="profile-avatar">${profileInitials()}</div><h1>${esc(state.profile.name)}</h1><p class="subtle">${esc(state.profile.role)} · ${esc(state.profile.residence)}</p></div>
    <div class="plain-card"><div class="row"><div><h3>Booking status</h3><span class="subtle">${state.warnings >= 3 ? 'Suspension ends August 25, 2026' : 'Your account is in good standing'}</span></div><span class="status ${state.warnings >= 3 ? 'occupied' : 'available'}">${state.warnings >= 3 ? 'Suspended' : 'Active'}</span></div><div style="margin-top:20px"><div class="row"><strong>No-show warnings</strong><strong>${state.warnings} / 3</strong></div><div class="warning-bar"><i class="hit"></i><i class="${state.warnings>1?'hit':''}"></i><i class="${state.warnings>2?'hit':''}"></i></div></div>${state.warnings >= 3 ? '<div class="notice"><strong>Booking suspended for 7 days.</strong><br>You can still view locations and live availability.</div>' : ''}</div>
    <div class="menu-list"><button class="menu-row" data-route="edit-profile"><span>Edit profile details</span><span>›</span></button><button class="menu-row"><span>Booking history</span><span>›</span></button><button class="menu-row"><span>Notification settings</span><span>›</span></button><button class="menu-row" data-action="simulate-noshow"><span>Simulate a no-show</span><span>›</span></button><button class="menu-row" data-action="logout"><span>Log out</span><span>›</span></button></div></section>`,

  'edit-profile': () => `<section class="screen profile-form-screen"><p class="eyebrow">Account settings</p><h1>Edit profile</h1><p class="subtle">Update the details shown on your sPinnyQ account.</p>
    <form id="profileForm" class="profile-form"><label class="form-label" for="profileName">Full name</label><input class="input" id="profileName" name="name" value="${esc(state.profile.name)}" required maxlength="60" />
    <label class="form-label" for="profileEmail">Email address</label><input class="input" id="profileEmail" name="email" type="email" value="${esc(state.profile.email)}" required />
    <label class="form-label" for="profilePhone">Phone number</label><input class="input" id="profilePhone" name="phone" type="tel" value="${esc(state.profile.phone)}" />
    <label class="form-label" for="profileRole">Resident type</label><select class="select" id="profileRole" name="role"><option ${state.profile.role==='Student resident'?'selected':''}>Student resident</option><option ${state.profile.role==='Resident'?'selected':''}>Resident</option><option ${state.profile.role==='Staff'?'selected':''}>Staff</option></select>
    <label class="form-label" for="profileResidence">Residence</label><input class="input" id="profileResidence" name="residence" value="${esc(state.profile.residence)}" maxlength="80" />
    <div class="action-stack profile-form-actions"><button class="btn btn-green btn-block" type="submit">Save profile</button><button class="btn btn-soft btn-block" type="button" data-action="cancel-profile-edit">Cancel</button></div></form></section>`,

  admin: () => adminScreen()
};

function machineCard(m) {
  const reservedForUser = state.reservedMachineIds.has(reservationKey(m.id));
  const visibleStatus = reservedForUser ? 'Reserved for you' : statusLabel(m.status);
  const badge = reservedForUser ? '<span class="status reserved-for-you">Reserved for you</span>' : `<span class="status ${m.status}">${statusLabel(m.status)}</span>`;
  return `<article class="machine-card" data-machine-id="${m.id}" role="button" tabindex="0" aria-label="View ${m.name}, ${visibleStatus}"><div class="machine-top"><div><h3>${m.name}</h3>${badge}</div><span class="machine-arrow">→</span></div><div class="machine-detail">${m.detail}</div>${reservedForUser?'<button class="cancel-link" data-cancel-reservation>Cancel reservation</button>':''}</article>`;
}

function homeLaundryStatus() {
  if (state.sessionStarted) {
    return `<div class="section-head home-status-heading"><h2>Your laundry status</h2></div><article class="home-status-card active-status" data-route="session" role="button" tabindex="0"><div><span class="home-status-type active-type">● Active laundry</span><h3>${esc(state.booking?.machine || 'Washer')}</h3><p>${esc(state.booking?.location || selectedLocation().name)} · ${formatTime(state.sessionSeconds)} remaining</p></div><span class="machine-arrow">→</span></article>`;
  }
  if (state.joinedQueue) {
    const location = locations.find(item => item.id === state.queueLocationId) || selectedLocation();
    return `<div class="section-head home-status-heading"><h2>Your laundry status</h2></div><article class="home-status-card queue-status ${state.claimReady?'ready-status':''}" data-action="open-queue" role="button" tabindex="0"><div><span class="home-status-type queue-type">${state.claimReady?'Machine ready':'Virtual queue'}</span><h3>${state.claimReady?'Washer 2 is ready for you':`You’re waiting at ${location.name}`}</h3><p>${state.claimReady?'Confirm now to secure the machine.':`Position #${location.queue} · approximately ${location.wait} minutes`}</p></div><div class="home-status-side"><span class="machine-arrow">→</span><div class="home-status-actions">${state.claimReady?'<button class="status-confirm-button" data-action="confirm-queue-ready">Confirm</button>':''}<button class="cancel-link" data-cancel-reservation>Leave queue</button></div></div></article>`;
  }
  if (!state.booking) return '';
  const source = state.booking.source || 'future';
  const labels = {
    future: { badge: 'Future booking', title: `${state.booking.machine} is booked`, route: 'confirmation', className: 'booking-status' },
    queue: { badge: 'Claimed from queue', title: `${state.booking.machine} is reserved for you`, route: 'confirmation', className: 'queue-claim-status' },
    immediate: { badge: 'Reserved now', title: `${state.booking.machine} is reserved for you`, route: 'checkin', className: 'immediate-status' }
  };
  const status = labels[source] || labels.future;
  return `<div class="section-head home-status-heading"><h2>Your laundry status</h2></div><article class="home-status-card ${status.className}" data-route="${status.route}" role="button" tabindex="0"><div><span class="home-status-type">${status.badge}</span><h3>${esc(status.title)}</h3><p>${esc(state.booking.location)} · ${esc(state.booking.slot)}</p></div><div class="home-status-side"><span class="machine-arrow">→</span><div class="home-status-actions"><button class="status-confirm-button" data-route="confirmation">Confirm</button>${source==='future'?'<button class="text-button" data-edit-reservation>Edit</button>':''}<button class="cancel-link" data-cancel-reservation>Cancel</button></div></div></article>`;
}

function notificationsScreen() {
  const active = [];
  if (state.claimReady) active.push(`<article class="notification-card unread"><span class="notif-icon">⏱</span><div><h3>Machine available</h3><p>Washer 2 is ready. You have 5 minutes to claim it.</p><time>Just now</time></div></article>`);
  else if (state.joinedQueue) active.push(`<article class="notification-card unread"><span class="notif-icon">⌛</span><div><h3>Queue joined</h3><p>You’re waiting at ${(locations.find(item=>item.id===state.queueLocationId)||selectedLocation()).name}.</p><time>Just now</time></div></article>`);
  if (state.booking && !state.sessionStarted) active.push(`<article class="notification-card unread"><span class="notif-icon">◫</span><div><h3>${state.booking.source==='future'?'Booking confirmed':'Machine reserved'}</h3><p>${esc(state.booking.machine)} at ${esc(state.booking.location)} · ${esc(state.booking.slot)}</p><time>Just now</time></div></article>`);
  if (state.sessionStarted) active.push(`<article class="notification-card unread"><span class="notif-icon">◉</span><div><h3>Laundry in progress</h3><p>${esc(state.booking?.machine||'Your machine')} has ${formatTime(state.sessionSeconds)} remaining.</p><time>Now</time></div></article>`);
  return `<section class="screen"><div class="row"><div><p class="eyebrow">Stay in the loop</p><h1>Updates</h1></div><button class="text-button" data-action="read-all">Read all</button></div><div class="notification-list">${active.join('')}<article class="notification-card"><span class="notif-icon">✓</span><div><h3>Laundry complete</h3><p>Your clothes from Washer 2 were ready.</p><time>August 16</time></div></article><article class="notification-card"><span class="notif-icon" style="background:var(--yellow-soft)">!</span><div><h3>Warning 1 of 3</h3><p>You missed a reservation. Repeated no-shows may restrict booking.</p><time>August 13</time></div></article></div></section>`;
}

function machineDetailScreen() {
  const location = selectedLocation();
  const roomMachines = selectedMachines();
  const machine = roomMachines.find(m => m.id === state.selectedMachineId) || roomMachines[0];
  const isWasher = machine.type === 'washer';
  const action = machine.status === 'available'
    ? `<button class="btn btn-green btn-block" data-action="use-now">Use ${machine.name} now</button>`
    : machine.status === 'occupied'
      ? `<button class="btn btn-primary btn-block" data-action="join-queue">Join queue for a washer</button>`
      : machine.status === 'reserved'
        ? `<button class="btn btn-soft btn-block" disabled>Reserved for another resident</button>`
        : `<button class="btn btn-soft btn-block" disabled>Currently unavailable</button>`;
  return `<section class="screen center"><p class="eyebrow">${location.name} · ${isWasher ? 'Washing machine' : 'Dryer'}</p><h1>${machine.name}</h1><span class="status ${machine.status}">${statusLabel(machine.status)}</span>
    <div class="washer-art ${isWasher ? '' : 'dryer-art'}"><div class="washer-door"></div></div>
    <div class="plain-card machine-summary"><div class="row"><span class="subtle">Current status</span><strong>${statusLabel(machine.status)}</strong></div><div class="row"><span class="subtle">Timing</span><strong>${machine.detail}</strong></div><div class="row"><span class="subtle">Location</span><strong>${location.address}</strong></div></div>
    <div class="action-stack">${action}<button class="btn btn-soft btn-block" data-action="back-to-room">View all machines</button></div></section>`;
}

function paymentScreen() {
  const machine = selectedMachines().find(m => m.name === state.booking?.machine);
  const price = machine?.type === 'dryer' ? 50 : 40;
  const methods = [
    { id: 'promptpay', icon: '◉', title: 'PromptPay', detail: 'Scan a QR code to pay' },
    { id: 'card', icon: '▣', title: 'Credit or debit card', detail: 'Visa, Mastercard or JCB' },
    { id: 'wallet', icon: '◫', title: 'Campus wallet', detail: 'Balance ฿125.00' }
  ];
  return `<section class="screen payment-screen"><p class="eyebrow">Secure checkout</p><h1>Select payment method</h1><p class="subtle">Choose how you want to pay before starting the machine.</p>
    <div class="plain-card payment-summary"><div><span class="subtle">${esc(state.booking?.location || selectedLocation().name)}</span><h3>${esc(state.booking?.machine || 'Washer')}</h3></div><strong>฿${price}.00</strong></div>
    <div class="payment-methods">${methods.map(method=>`<button class="payment-method ${state.paymentMethod===method.id?'selected':''}" data-payment="${method.id}"><span class="payment-icon">${method.icon}</span><span><strong>${method.title}</strong><small>${method.detail}</small></span><i>${state.paymentMethod===method.id?'✓':''}</i></button>`).join('')}</div>
    <div class="notice">This is a prototype payment. No real charge will be made.</div>
    <button class="btn btn-green btn-block payment-submit" data-action="confirm-payment" ${state.paymentMethod?'':'disabled'}>${state.paymentMethod ? `Pay ฿${price}.00 and start laundry` : 'Select a payment method'}</button></section>`;
}

function readyMachinePopup() {
  if (!state.readyPopup) return '';
  return `<div class="modal-backdrop" role="presentation"><section class="ready-popup" role="dialog" aria-modal="true" aria-labelledby="readyPopupTitle"><button class="modal-close" data-action="dismiss-ready" aria-label="Close notification">×</button><div class="ready-popup-icon">✓</div><p class="eyebrow">Machine ready</p><h2 id="readyPopupTitle">${esc(state.readyPopup.machine)} is ready for you</h2><p class="subtle">Your machine at ${esc(state.readyPopup.location)} is reserved and waiting for your check-in.</p><div class="action-stack"><button class="btn btn-green btn-block" data-action="checkin-ready">Check in at machine</button><button class="btn btn-soft btn-block" data-action="dismiss-ready">Not now</button></div></section></div>`;
}

function cancelReservationPopup() {
  if (!state.cancelTarget) return '';
  return `<div class="modal-backdrop cancel-backdrop" role="presentation"><section class="cancel-popup" role="dialog" aria-modal="true" aria-labelledby="cancelPopupTitle"><h2 id="cancelPopupTitle">Cancel this reservation?</h2><div class="cancel-confirm-actions"><button class="btn btn-danger" data-action="confirm-cancel">Yes</button><button class="btn btn-soft" data-action="dismiss-cancel">No</button></div></section></div>`;
}

function setCancelTarget(machineId = state.selectedMachineId) {
  if (state.joinedQueue && !state.booking) {
    state.cancelTarget = { kind: 'queue', locationId: state.queueLocationId };
    return;
  }
  if (!state.booking) return;
  const location = locations.find(item => item.name === state.booking.location);
  const roomMachines = location ? locationMachines[location.id] : selectedMachines();
  const machine = roomMachines.find(item => item.id === machineId) || roomMachines.find(item => item.name === state.booking.machine);
  state.cancelTarget = { kind: state.booking.source || 'future', machine: state.booking.machine, machineId: machine?.id, locationId: location?.id || state.selectedLocationId };
}

function beginBookingEdit() {
  if (!state.booking || state.booking.source !== 'future') return;
  const location = locations.find(item => item.name === state.booking.location);
  if (location) state.selectedLocationId = location.id;
  state.selectedMachine = state.booking.machine;
  state.selectedSlot = state.booking.slot;
  state.editingBooking = true;
  navigate('book');
}

function clearUserActivity() {
  state.joinedQueue = false;
  state.queueLocationId = null;
  state.claimReady = false;
  state.booking = null;
  state.paymentMethod = null;
  state.reservedMachineIds.clear();
  state.readyPopup = null;
  state.cancelTarget = null;
  state.editingBooking = false;
  state.sessionStarted = false;
  state.sessionSeconds = 38 * 60 + 42;
  clearInterval(sessionInterval);
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

function navigate(route, options = {}) {
  if (state.route === route) { render(); return; }
  if (options.reset) state.history = [];
  else if (!options.replace && state.route !== 'welcome') state.history.push(state.route);
  state.route = route;
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goBack(fallback = 'home') {
  if (state.route === 'book' && state.editingBooking) {
    state.editingBooking = false;
    if (state.booking) {
      state.selectedMachine = state.booking.machine;
      state.selectedSlot = state.booking.slot;
    }
  }
  const target = state.history.pop() || fallback;
  state.route = target;
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function render() {
  const isWelcome = state.route === 'welcome';
  const isAdmin = state.route === 'admin';
  topbar.classList.toggle('hidden', isWelcome);
  bottomNav.classList.toggle('hidden', isWelcome || isAdmin || ['queue','book','confirmation','checkin','payment','session','room','machine','edit-profile'].includes(state.route));
  backButton.classList.toggle('hidden', !['room','machine','queue','book','confirmation','checkin','payment','session','edit-profile'].includes(state.route));
  document.querySelectorAll('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.route === state.route));
  document.querySelector('.avatar').textContent = profileInitials();
  document.querySelector('.nav-dot')?.classList.toggle('hidden', !(state.booking || state.joinedQueue || state.claimReady || state.sessionStarted));
  app.innerHTML = (screens[state.route] || screens.home)();
  if (state.route === 'room' && state.readyPopup) app.insertAdjacentHTML('beforeend', readyMachinePopup());
  if (state.cancelTarget) app.insertAdjacentHTML('beforeend', cancelReservationPopup());
  if (state.route === 'session' && state.sessionStarted) startSessionTimer();
}

function showToast(message, duration = 2600) {
  const toast = document.querySelector('#toast'); toast.textContent = message; toast.classList.add('show');
  clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.classList.remove('show'), duration);
}

function formatTime(seconds) { const m = Math.floor(seconds/60); const s = seconds%60; return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`; }
let sessionInterval;
function startSessionTimer() { clearInterval(sessionInterval); sessionInterval = setInterval(()=>{ if(state.route!=='session') return clearInterval(sessionInterval); state.sessionSeconds=Math.max(0,state.sessionSeconds-1); const el=document.querySelector('#sessionTimer'); if(el) el.textContent=formatTime(state.sessionSeconds); const bar=document.querySelector('#sessionProgress'); if(bar) bar.style.width=`${Math.max(4,100-state.sessionSeconds/(39*60)*100)}%`; if(!state.sessionSeconds){clearInterval(sessionInterval); showToast('Laundry complete — your clothes are ready!');}},1000); }

document.addEventListener('click', e => {
  const cancelControl = e.target.closest('[data-cancel-reservation]');
  if (cancelControl) {
    e.preventDefault(); e.stopPropagation();
    const cardMachineId = Number(cancelControl.closest('[data-machine-id]')?.dataset.machineId);
    setCancelTarget(Number.isFinite(cardMachineId) && cardMachineId > 0 ? cardMachineId : state.selectedMachineId);
    render(); return;
  }
  const editControl = e.target.closest('[data-edit-reservation]');
  if (editControl) { e.preventDefault(); e.stopPropagation(); beginBookingEdit(); return; }
  const route = e.target.closest('[data-route]')?.dataset.route; if (route) { e.preventDefault(); navigate(route); return; }
  const location = e.target.closest('[data-location]'); if(location){state.selectedLocationId=location.dataset.location;const chosenLocation=selectedLocation();const firstMachine=selectedMachines()[0];state.selectedMachineId=firstMachine.id;state.selectedMachine=firstMachine.name;state.machineTab='washer';const readyBooking=state.booking&&state.booking.location===chosenLocation.name&&state.booking.source!=='future';state.readyPopup=readyBooking?{machine:state.booking.machine,location:state.booking.location}:null;navigate('room');return;}
  const machine = e.target.closest('[data-machine-id]'); if(machine){state.selectedMachineId=Number(machine.dataset.machineId);const chosenMachine=selectedMachines().find(m=>m.id===state.selectedMachineId)||selectedMachines()[0];state.selectedMachine=chosenMachine.name;const key=reservationKey(chosenMachine.id);if(chosenMachine.status==='available'&&!state.reservedMachineIds.has(key)){state.paymentMethod=null;state.booking={machine:chosenMachine.name,location:selectedLocation().name,slot:'Available now',source:'immediate'};state.reservedMachineIds.add(key);render();showToast(`${chosenMachine.name} reserved for you`,2000);}else if(state.reservedMachineIds.has(key)){navigate('checkin');}else{navigate('machine');}return;}
  const tab = e.target.closest('[data-tab]')?.dataset.tab; if(tab){ state.machineTab=tab; render(); return; }
  const slot = e.target.closest('[data-slot]')?.dataset.slot; if(slot){ state.selectedSlot=slot; render(); return; }
  const payment = e.target.closest('[data-payment]')?.dataset.payment; if(payment){state.paymentMethod=payment;render();return;}
  const adminTab = e.target.closest('[data-admin-tab]')?.dataset.adminTab; if(adminTab){state.adminTab=adminTab;render();return;}
  const action = e.target.closest('[data-action]')?.dataset.action; if(!action) return;
  const actions = {
    enter:()=>{clearUserActivity();navigate('home',{reset:true});},
    'join-queue':()=>{state.joinedQueue=true;state.queueLocationId=state.selectedLocationId;navigate('queue');},
    'open-queue':()=>{state.selectedLocationId=state.queueLocationId||state.selectedLocationId;navigate('queue');},
    'confirm-queue-ready':()=>{const queueLocation=locations.find(item=>item.id===state.queueLocationId)||selectedLocation();state.selectedLocationId=queueLocation.id;state.paymentMethod=null;state.booking={machine:'Washer 2',location:queueLocation.name,slot:'Ready now · confirm within 5 minutes',source:'queue'};state.joinedQueue=false;state.queueLocationId=null;state.claimReady=false;navigate('confirmation');},
    'dismiss-ready':()=>{state.readyPopup=null;render();},
    'checkin-ready':()=>{state.readyPopup=null;navigate('checkin');},
    'dismiss-cancel':()=>{state.cancelTarget=null;render();},
    'confirm-cancel':()=>{const target=state.cancelTarget;if(!target)return;if(target.kind==='queue'){state.joinedQueue=false;state.queueLocationId=null;state.claimReady=false;}else{if(target.machineId)state.reservedMachineIds.delete(reservationKey(target.machineId,target.locationId));state.booking=null;state.readyPopup=null;}state.cancelTarget=null;state.editingBooking=false;render();showToast(target.kind==='queue'?'You left the queue':`${target.machine} released and available`,2000);},
    'leave-queue':()=>{state.joinedQueue=false;state.queueLocationId=null;state.claimReady=false;showToast('You left the queue');navigate('room');},
    'simulate-ready':()=>{state.claimReady=true;render();showToast('Washer 2 is ready — you’re next!');},
    'claim-machine':()=>{state.paymentMethod=null;state.booking={machine:'Washer 2',location:selectedLocation().name,slot:'Now · claim by 7:13 PM',source:'queue'};state.joinedQueue=false;state.queueLocationId=null;navigate('confirmation');},
    'use-now':()=>{const chosenMachine=selectedMachines().find(m=>m.id===state.selectedMachineId)||selectedMachines()[0];state.paymentMethod=null;state.booking={machine:chosenMachine.name,location:selectedLocation().name,slot:'Available now',source:'immediate'};navigate('checkin');},
    'back-to-room':()=>goBack('room'),
    'confirm-booking':()=>{const wasEditing=state.editingBooking;state.paymentMethod=null;state.selectedMachine=document.querySelector('#machineSelect')?.value||'Washer 4';state.booking={machine:state.selectedMachine,location:selectedLocation().name,slot:state.selectedSlot,source:'future'};state.editingBooking=false;navigate('confirmation');if(wasEditing)showToast('Reservation changes saved',2000);},
    'scan-qr':()=>navigate('checkin'),
    'start-laundry':()=>{state.sessionStarted=true;navigate('session');},
    'confirm-payment':()=>{if(!state.paymentMethod)return;state.sessionStarted=true;showToast('Payment approved — laundry started');navigate('session');},
    'finish-session':()=>{state.reservedMachineIds.delete(reservationKey(state.selectedMachineId));state.sessionStarted=false;state.booking=null;state.paymentMethod=null;state.sessionSeconds=38*60+42;clearInterval(sessionInterval);showToast('Session finished. Washer is available again.');navigate('my-laundry');},
    'cancel-booking':()=>{setCancelTarget();render();},
    'cancel-profile-edit':()=>goBack('profile'),
    'read-all':()=>{document.querySelectorAll('.notification-card').forEach(n=>n.classList.remove('unread'));document.querySelector('.nav-dot')?.classList.add('hidden');showToast('All updates marked as read');},
    'simulate-noshow':()=>{state.warnings=Math.min(3,state.warnings+1);showToast(state.warnings===3?'Booking suspended for 7 days':'No-show warning added');render();},
    logout:()=>{clearUserActivity();navigate('welcome',{reset:true});},
    'exit-admin':()=>navigate('home'),
    'remove-suspension':()=>showToast('Suspension removed for User 3011')
  }; actions[action]?.();
});

document.addEventListener('change', e => { if(e.target.matches('[data-machine-status]')){const i=Number(e.target.dataset.machineStatus);machines[i].status=e.target.value;machines[i].detail=`Status changed by admin`;showToast(`${machines[i].name} set to ${statusLabel(e.target.value)}`);}});
document.addEventListener('submit', e => {
  if (!e.target.matches('#profileForm')) return;
  e.preventDefault();
  const form = new FormData(e.target);
  state.profile = {
    name: String(form.get('name') || '').trim(),
    email: String(form.get('email') || '').trim(),
    phone: String(form.get('phone') || '').trim(),
    role: String(form.get('role') || 'Resident'),
    residence: String(form.get('residence') || '').trim()
  };
  navigate('profile', { replace: true });
  showToast('Profile details updated', 2000);
});
document.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role="button"][tabindex="0"]')) { e.preventDefault(); e.target.click(); } });
backButton.addEventListener('click',()=>goBack());
document.querySelector('#adminButton').addEventListener('click',()=>navigate('admin'));
render();
