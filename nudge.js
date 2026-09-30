export const DEFAULT_PROMPTS = [
  { id: 'p1', text: 'Are you having fun?' },
  { id: 'p2', text: 'Sales is the transfer of emotion.' },
  { id: 'p3', text: 'Where focus goes energy flows.' },
  { id: 'p4', text: 'Attitude and work ethic. You control both.' },
  { id: 'p5', text: 'Keep your focus on the board.' },
  { id: 'p6', text: 'Smile. If you are not having fun neither are they.' }
];

const MAX_NUDGES_PER_DAY = 5;
const DOORS_WITHOUT_PRESENTATION_THRESHOLD = 15;
const IDLE_TIME_MS = 15 * 60 * 1000;
const MAX_IMAGE_B64_LENGTH = 160000;

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function initNudgeState(api) {
  api.commit(draft => {
    if (!draft.nudge) {
      draft.nudge = {
        enabled: true,
        frequency: 'normal',
        whyText: '',
        whyImage: null,
        prompts: DEFAULT_PROMPTS.map(p => ({ ...p, enabled: true })),
        stats: {
          lastNudgeTime: 0,
          nudgeCountToday: 0,
          lastPromptId: null,
          doorsSincePresentation: 0,
          lastTapTime: Date.now(),
          firstLogDone: false,
          date: getTodayStr()
        },
        activeNudge: null,
        errorText: ''
      };
    }
  });
}

export function maybeNudge(state, api, event) {
  if (!state.nudge) {
    initNudgeState(api);
    return;
  }

  const nState = state.nudge;
  if (!nState.enabled) return;
  if (nState.activeNudge) return;

  const today = getTodayStr();
  let needsReset = false;
  if (nState.stats.date !== today) {
    needsReset = true;
  }

  if (needsReset) {
    api.commit(draft => {
      draft.nudge.stats.date = today;
      draft.nudge.stats.nudgeCountToday = 0;
      draft.nudge.stats.firstLogDone = false;
      draft.nudge.stats.doorsSincePresentation = 0;
    });
    nState.stats.date = today;
    nState.stats.nudgeCountToday = 0;
    nState.stats.firstLogDone = false;
    nState.stats.doorsSincePresentation = 0;
  }

  let trigger = null;
  const now = Date.now();

  if (event.type === 'tap') {
    let doors = nState.stats.doorsSincePresentation;
    let firstLog = nState.stats.firstLogDone;
    
    if (event.counter === 'D') {
      doors += 1;
    } else if (event.counter === 'P' || event.counter === 'C') {
      doors = 0;
    } else if (event.counter === 'Sale') {
      trigger = 'sale';
      doors = 0;
    }

    if (!firstLog && event.counter) {
      trigger = 'first_log';
      firstLog = true;
    }

    if (doors >= DOORS_WITHOUT_PRESENTATION_THRESHOLD && !trigger) {
      trigger = 'run_of_doors';
      doors = 0; 
    }

    api.commit(draft => {
      draft.nudge.stats.doorsSincePresentation = doors;
      draft.nudge.stats.firstLogDone = firstLog;
      draft.nudge.stats.lastTapTime = now;
    });

  } else if (event.type === 'idle_check') {
    /* Idle nudges only while a rep is actually out working: on the My day
       screen, after their first tap today, between 8am and 9pm. Before this
       they fired on the manager screen and at midnight on a phone left open. */
    const hr = new Date().getHours();
    const working = state.view === 'rep' && state.activeRep && nState.stats.firstLogDone && hr >= 8 && hr < 21;
    if (working && now - nState.stats.lastTapTime >= IDLE_TIME_MS) {
      trigger = 'idle';
      api.commit(draft => {
        draft.nudge.stats.lastTapTime = now; 
      });
    }
  }

  if (trigger) {
    const stats = state.nudge.stats;
    const currentCount = stats.nudgeCountToday;
    const maxNudges = state.nudge.frequency === 'high' ? 8 : (state.nudge.frequency === 'low' ? 2 : MAX_NUDGES_PER_DAY);
    if (currentCount >= maxNudges) return;

    const availablePrompts = nState.prompts.filter(p => p.enabled && p.id !== stats.lastPromptId);
    let promptText = '';
    let promptId = null;
    let isFace = false;

    if (trigger === 'sale') {
      promptText = 'That is a sale. Same energy on the next door.';
      promptId = 'sale';
    } else if (availablePrompts.length > 0) {
      const p = availablePrompts[Math.floor(Math.random() * availablePrompts.length)];
      promptText = p.text;
      promptId = p.id;
      if (p.text.toLowerCase().includes('fun') || p.text.toLowerCase().includes('smile')) {
        isFace = true;
      }
    } else {
      promptText = 'Keep going';
      promptId = 'fallback';
    }

    api.commit(draft => {
      draft.nudge.activeNudge = {
        id: Date.now().toString(),
        text: promptText,
        whyText: draft.nudge.whyText || '',
        whyImage: draft.nudge.whyImage || null,
        type: isFace ? 'face' : 'text'
      };
      draft.nudge.stats.lastPromptId = promptId;
      draft.nudge.stats.nudgeCountToday = currentCount + 1;
      draft.nudge.stats.lastNudgeTime = now;
    });
  }
}

export function dismissNudge(state, api, id) {
  if (state.nudge && state.nudge.activeNudge && state.nudge.activeNudge.id === id) {
    api.commit(draft => {
      draft.nudge.activeNudge = null;
    });
  }
}

export function nudgeHtml(state) {
  if (!state.nudge || !state.nudge.activeNudge) return '';

  const n = state.nudge.activeNudge;
  let mediaHtml = '';

  if (n.type === 'face') {
    mediaHtml = `
      <div class="nudge-face">
        <svg viewBox="0 0 100 100" class="nudge-svg-face" aria-hidden="true">
          <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" stroke-width="5" />
          <circle cx="35" cy="40" r="5" fill="currentColor" />
          <circle cx="65" cy="40" r="5" fill="currentColor" />
          <path d="M 30 65 Q 50 85 70 65" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" />
        </svg>
      </div>`;
  } else if (n.whyImage) {
    mediaHtml = `<div class="nudge-media"><img src="${n.whyImage}" alt="Your reason why" class="nudge-why-img"></div>`;
  }

  let whyTextHtml = '';
  if (n.whyText) {
    whyTextHtml = `<div class="nudge-why-text">${escapeHtml(n.whyText)}</div>`;
  }

  return `
    <div class="nudge-overlay" role="status" aria-live="polite">
      <div class="nudge-card">
        <button class="nudge-close" data-nudge-action="dismiss" data-nudge-id="${n.id}" aria-label="Dismiss message">
          <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
            <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
        <div class="nudge-content">
          ${mediaHtml}
          ${whyTextHtml}
          <div class="nudge-text">${escapeHtml(n.text)}</div>
        </div>
      </div>
    </div>
  `;
}

function processImage(file, callback) {
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX = 640;
      let width = img.width;
      let height = img.height;
      
      if (width > height) {
        if (width > MAX) {
          height = Math.floor(height * (MAX / width));
          width = MAX;
        }
      } else {
        if (height > MAX) {
          width = Math.floor(width * (MAX / height));
          height = MAX;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      
      if (dataUrl.length > MAX_IMAGE_B64_LENGTH) {
        callback(null, 'Image is too large after compression. Please try a smaller file.');
      } else {
        callback(dataUrl, null);
      }
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

export function renderNudgeSettings(el, state, api) {
  if (!state.nudge) {
    initNudgeState(api);
    return;
  }

  const n = state.nudge;
  
  let promptsHtml = n.prompts.map(p => `
    <div class="nudge-prompt-item">
      <label class="nudge-toggle">
        <input type="checkbox" data-nudge-action="toggle-prompt" data-nudge-id="${p.id}" ${p.enabled ? 'checked' : ''} aria-label="Toggle prompt">
        <span class="nudge-toggle-slider"></span>
      </label>
      <div class="nudge-prompt-text">${escapeHtml(p.text)}</div>
    </div>
  `).join('');

  el.innerHTML = `
    <div class="nudge-settings">
      <h2>Motivation Settings</h2>
      
      <div class="nudge-setting-row">
        <span class="nudge-setting-label">Enable Reminders</span>
        <label class="nudge-toggle">
          <input type="checkbox" data-nudge-action="toggle-master" ${n.enabled ? 'checked' : ''} aria-label="Enable Reminders">
          <span class="nudge-toggle-slider"></span>
        </label>
      </div>

      <div class="nudge-setting-row">
        <span class="nudge-setting-label">Frequency</span>
        <select class="nudge-select" data-nudge-action="change-frequency" aria-label="Reminder Frequency">
          <option value="low" ${n.frequency === 'low' ? 'selected' : ''}>Low</option>
          <option value="normal" ${n.frequency === 'normal' || !n.frequency ? 'selected' : ''}>Normal</option>
          <option value="high" ${n.frequency === 'high' ? 'selected' : ''}>High</option>
        </select>
      </div>

      <div class="nudge-setting-group">
        <div class="nudge-setting-label">Your Reason Why</div>
        <input type="text" class="nudge-input-text" data-nudge-action="update-why-text" value="${escapeHtml(n.whyText)}" placeholder="Enter a short reminder">
      </div>

      <div class="nudge-setting-group">
        <div class="nudge-setting-label">Your Motivation Image</div>
        <input type="file" accept="image/*" class="nudge-input-file" data-nudge-action="update-why-image">
        ${n.errorText ? `<span class="nudge-error">${escapeHtml(n.errorText)}</span>` : ''}
        ${n.whyImage ? `<img src="${n.whyImage}" class="nudge-why-preview" alt="Motivation preview">` : ''}
      </div>

      <div class="nudge-prompts-list">
        <div class="nudge-setting-label" style="margin-bottom: 12px;">Active Prompts</div>
        ${promptsHtml}
        
        <div class="nudge-setting-group">
          <input type="text" class="nudge-input-text" id="nudge-new-prompt" placeholder="Add your own prompt">
          <button class="nudge-btn" data-nudge-action="add-prompt">Add Prompt</button>
        </div>
      </div>
    </div>
  `;

  if (!el._nudgeAttached) {
    el.addEventListener('change', e => {
      const action = e.target.getAttribute('data-nudge-action');
      if (action === 'toggle-master') {
        api.commit(draft => { draft.nudge.enabled = e.target.checked; });
      } else if (action === 'change-frequency') {
        api.commit(draft => { draft.nudge.frequency = e.target.value; });
      } else if (action === 'toggle-prompt') {
        const id = e.target.getAttribute('data-nudge-id');
        api.commit(draft => {
          const p = draft.nudge.prompts.find(x => x.id === id);
          if (p) p.enabled = e.target.checked;
        });
      } else if (action === 'update-why-image') {
        const file = e.target.files[0];
        if (!file) return;
        processImage(file, (dataUrl, error) => {
          api.commit(draft => {
            if (error) {
              draft.nudge.errorText = error;
            } else {
              draft.nudge.errorText = '';
              draft.nudge.whyImage = dataUrl;
            }
          });
        });
      }
    });

    el.addEventListener('input', e => {
      if (e.target.getAttribute('data-nudge-action') === 'update-why-text') {
        api.commit(draft => {
          draft.nudge.whyText = e.target.value;
        });
      }
    });

    el.addEventListener('click', e => {
      const action = e.target.getAttribute('data-nudge-action');
      if (action === 'add-prompt') {
        const input = el.querySelector('#nudge-new-prompt');
        const text = input.value.trim();
        if (text) {
          api.commit(draft => {
            draft.nudge.prompts.push({
              id: Date.now().toString(),
              text,
              enabled: true
            });
          });
          input.value = '';
        }
      }
    });

    el._nudgeAttached = true;
  }
}
