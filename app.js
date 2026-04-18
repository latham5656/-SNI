/* =============================================
   RETRO ARCADE — app.js
   ============================================= */

// ── Stars background ──────────────────────────
(function initStars() {
  const canvas = document.getElementById('stars');
  const ctx    = canvas.getContext('2d');
  let stars    = [];

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  for (let i = 0; i < 160; i++) {
    stars.push({
      x: Math.random(), y: Math.random(),
      r: Math.random() * 1.4 + 0.3,
      speed: Math.random() * 0.0003 + 0.00005,
      opacity: Math.random(),
      delta: (Math.random() - 0.5) * 0.015,
    });
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    stars.forEach(s => {
      s.opacity += s.delta;
      if (s.opacity > 1 || s.opacity < 0) s.delta *= -1;
      s.y += s.speed;
      if (s.y > 1) s.y = 0;
      ctx.beginPath();
      ctx.arc(s.x * canvas.width, s.y * canvas.height, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,229,255,${Math.max(0, s.opacity)})`;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  draw();
})();

// ── IP + Geolocation ─────────────────────────
(function fetchIP() {
  const ipEl      = document.getElementById('playerIP');
  const flagEl    = document.getElementById('playerFlag');
  const flagGeoEl = document.getElementById('playerFlagGeo');
  const geoEl     = document.getElementById('playerGeo');
  const statusEl  = document.getElementById('playerStatus');

  function countryToFlag(code) {
    if (!code || code.length !== 2) return '';
    return [...code.toUpperCase()].map(c =>
      String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65)
    ).join('');
  }

  const ispEl = document.getElementById('playerISP');

  function applyGeoData(ip, country, city, region, org) {
    ipEl.textContent = ip || 'N/A';
    if (country) {
      const flag = countryToFlag(country);
      flagEl.textContent    = flag;
      flagGeoEl.textContent = flag;
      const parts = [city, region, country].filter(Boolean);
      geoEl.textContent = parts.join(', ').toUpperCase();
    } else {
      geoEl.textContent = 'UNKNOWN';
    }
    // org приходит как "AS12389 Rostelecom" — убираем AS-номер
    if (org) {
      ispEl.textContent = org.replace(/^AS\d+\s*/i, '').toUpperCase();
    }
  }

  // Попытка 1: серверный прокси geo.php (обходит блокировки)
  fetch('geo.php')
    .then(r => {
      if (!r.ok) throw new Error('no php');
      return r.json();
    })
    .then(d => {
      if (!d.query) throw new Error('bad response');
      applyGeoData(d.query, d.country, d.city, d.region, d.org);
    })
    .catch(() => {
      // Попытка 2: ipinfo.io напрямую из браузера
      fetch('https://ipinfo.io/json')
        .then(r => r.json())
        .then(d => {
          applyGeoData(d.ip, d.country, d.city, d.region, d.org);
        })
        .catch(() => {
          ipEl.textContent     = 'N/A';
          geoEl.textContent    = 'UNKNOWN';
          statusEl.textContent = 'OFFLINE';
          statusEl.className   = 'card-value red';
        });
    });
})();

// ── HiScores (localStorage) ───────────────────
const GAMES = ['snake', 'pong', 'breakout', 'invaders'];
function getHi(game) { return parseInt(localStorage.getItem('hi_' + game) || '0'); }
function setHi(game, score) {
  if (score > getHi(game)) {
    localStorage.setItem('hi_' + game, score);
    document.getElementById('hi-' + game).textContent = score;
  }
}
GAMES.forEach(g => {
  document.getElementById('hi-' + g).textContent = getHi(g);
});

// ── Touch Controls ────────────────────────────
(function initTouchControls() {
  const btnMap = {
    tcUp:    { key: 'ArrowUp',    code: 'ArrowUp'    },
    tcDown:  { key: 'ArrowDown',  code: 'ArrowDown'  },
    tcLeft:  { key: 'ArrowLeft',  code: 'ArrowLeft'  },
    tcRight: { key: 'ArrowRight', code: 'ArrowRight' },
    tcFire:  { key: ' ',          code: 'Space'       },
  };
  Object.entries(btnMap).forEach(([id, { key, code }]) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    const kd = () => window.dispatchEvent(new KeyboardEvent('keydown', { key, code, bubbles: true }));
    const ku = () => window.dispatchEvent(new KeyboardEvent('keyup',   { key, code, bubbles: true }));
    btn.addEventListener('touchstart', e => { e.preventDefault(); kd(); }, { passive: false });
    btn.addEventListener('touchend',   e => { e.preventDefault(); ku(); }, { passive: false });
    btn.addEventListener('mousedown',  kd);
    btn.addEventListener('mouseup',    ku);
    btn.addEventListener('mouseleave', ku);
  });
})();

function showTouchControls(gameName) {
  const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  if (!isTouch) return;
  document.getElementById('touchControls').classList.remove('hidden');
  const fire = document.getElementById('tcFire');
  gameName === 'invaders' ? fire.classList.remove('hidden') : fire.classList.add('hidden');
}

// ── Fit canvas inside visible area on mobile ──
function fitModal() {
  if (window.innerWidth > 600) return;
  const modal = document.querySelector('.modal-inner');
  const canvas = document.getElementById('gameCanvas');
  const vh = window.innerHeight; // реальная высота без тулбара Safari
  modal.style.height = vh + 'px';
  // Суммируем высоты всего кроме canvas
  const header   = document.querySelector('.modal-header');
  const footer   = document.querySelector('.modal-footer');
  const controls = document.getElementById('touchControls');
  const used = header.offsetHeight + footer.offsetHeight
             + controls.offsetHeight
             + parseInt(getComputedStyle(modal).paddingTop)
             + parseInt(getComputedStyle(modal).paddingBottom)
             + 20; // запас
  canvas.style.maxHeight = Math.max(80, vh - used) + 'px';
}

// ── Game Modal ────────────────────────────────
let activeGame = null;

function launchGame(name) {
  document.getElementById('gameModal').classList.remove('hidden');
  document.getElementById('modalTitle').textContent = name.toUpperCase();
  document.getElementById('modalScore').textContent = '0';

  const canvas = document.getElementById('gameCanvas');
  const ctx    = canvas.getContext('2d');
  canvas.width  = 480;
  canvas.height = 360;

  if (activeGame) { activeGame.stop(); }

  const engines = { snake, pong, breakout, invaders };
  activeGame = engines[name](canvas, ctx, score => {
    document.getElementById('modalScore').textContent = score;
    setHi(name, score);
  });

  showTouchControls(name);
  // Вызываем после того как контролы стали видимы
  requestAnimationFrame(fitModal);
}

window.addEventListener('orientationchange', () => setTimeout(fitModal, 300));

function closeGame() {
  if (activeGame) { activeGame.stop(); activeGame = null; }
  document.getElementById('gameModal').classList.add('hidden');
  document.getElementById('touchControls').classList.add('hidden');
}

document.getElementById('gameModal').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeGame();
});

// Универсальный обработчик: блокирует скролл стрелками и пробелом пока открыта игра
window.addEventListener('keydown', e => {
  if (!document.getElementById('gameModal').classList.contains('hidden')) {
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) {
      e.preventDefault();
    }
  }
}, { capture: true });

// ─────────────────────────────────────────────
// SNAKE
// ─────────────────────────────────────────────
function snake(canvas, ctx, onScore) {
  document.getElementById('modalControls').textContent = '↑ ↓ ← → MOVE';
  const W = 480, H = 360, SZ = 20;
  const cols = W / SZ, rows = H / SZ;
  let snakeBody = [{x:10,y:9},{x:9,y:9},{x:8,y:9}];
  let dir = {x:1,y:0}, nextDir = {x:1,y:0};
  let food = randomFood();
  let score = 0, alive = true, interval;

  function randomFood() {
    let f;
    do { f = {x:Math.floor(Math.random()*cols), y:Math.floor(Math.random()*rows)}; }
    while (snakeBody.some(s => s.x===f.x && s.y===f.y));
    return f;
  }

  function draw() {
    ctx.fillStyle = '#050510';
    ctx.fillRect(0,0,W,H);

    ctx.fillStyle = '#0a0a22';
    for (let x=0; x<cols; x++) for (let y=0; y<rows; y++)
      ctx.fillRect(x*SZ+SZ/2-1, y*SZ+SZ/2-1, 2, 2);

    ctx.fillStyle = '#ff3344';
    ctx.shadowColor = '#ff3344'; ctx.shadowBlur = 10;
    ctx.fillRect(food.x*SZ+2, food.y*SZ+2, SZ-4, SZ-4);
    ctx.shadowBlur = 0;

    snakeBody.forEach((seg, i) => {
      ctx.fillStyle = i===0 ? '#00ff88' : `hsl(${140-i*3},100%,${i===0?60:45}%)`;
      ctx.shadowColor = '#00ff88'; ctx.shadowBlur = i===0 ? 12 : 0;
      ctx.fillRect(seg.x*SZ+1, seg.y*SZ+1, SZ-2, SZ-2);
      ctx.shadowBlur = 0;
    });

    if (!alive) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0,0,W,H);
      ctx.fillStyle = '#ff3344';
      ctx.font = '16px "Press Start 2P"';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', W/2, H/2-16);
      ctx.fillStyle = '#ffee00';
      ctx.font = '10px "Press Start 2P"';
      ctx.fillText(`SCORE: ${score}`, W/2, H/2+10);
      ctx.fillText('PRESS SPACE', W/2, H/2+32);
    }
  }

  function step() {
    if (!alive) return;
    dir = nextDir;
    const head = {x: snakeBody[0].x+dir.x, y: snakeBody[0].y+dir.y};
    if (head.x<0||head.x>=cols||head.y<0||head.y>=rows||snakeBody.some(s=>s.x===head.x&&s.y===head.y)) {
      alive = false; draw(); return;
    }
    snakeBody.unshift(head);
    if (head.x===food.x && head.y===food.y) {
      score += 10; onScore(score); food = randomFood();
    } else { snakeBody.pop(); }
    draw();
  }

  function onKey(e) {
    const map = {ArrowUp:{x:0,y:-1},ArrowDown:{x:0,y:1},ArrowLeft:{x:-1,y:0},ArrowRight:{x:1,y:0}};
    if (map[e.key]) {
      const d = map[e.key];
      if (d.x !== -dir.x || d.y !== -dir.y) nextDir = d;
    }
    if (e.code === 'Space' && !alive) {
      snakeBody = [{x:10,y:9},{x:9,y:9},{x:8,y:9}];
      dir = nextDir = {x:1,y:0}; food = randomFood(); score=0; alive=true; onScore(0);
    }
  }

  // Свайп по канвасу для тач-устройств
  let swipeX = 0, swipeY = 0;
  function onTouchStart(e) { swipeX = e.touches[0].clientX; swipeY = e.touches[0].clientY; }
  function onTouchEnd(e) {
    const dx = e.changedTouches[0].clientX - swipeX;
    const dy = e.changedTouches[0].clientY - swipeY;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) {
      // тап — рестарт если мёртв
      if (!alive) onKey({ key: ' ', code: 'Space' });
      return;
    }
    const key = Math.abs(dx) > Math.abs(dy)
      ? (dx > 0 ? 'ArrowRight' : 'ArrowLeft')
      : (dy > 0 ? 'ArrowDown'  : 'ArrowUp');
    onKey({ key });
  }
  canvas.addEventListener('touchstart', onTouchStart, { passive: true });
  canvas.addEventListener('touchend',   onTouchEnd,   { passive: true });

  window.addEventListener('keydown', onKey);
  draw();
  interval = setInterval(step, 130);

  return {
    stop() {
      clearInterval(interval);
      window.removeEventListener('keydown', onKey);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchend',   onTouchEnd);
    }
  };
}

// ─────────────────────────────────────────────
// PONG
// ─────────────────────────────────────────────
function pong(canvas, ctx, onScore) {
  document.getElementById('modalControls').textContent = '↑ ↓ MOVE PADDLE';
  const W=480, H=360, PW=10, PH=70, BALL=8;
  let py=H/2-PH/2, ay=H/2-PH/2;
  let bx=W/2, by=H/2, vx=3.5, vy=2.5;
  let score=0, running=true, raf;
  let keys={};

  function draw() {
    ctx.fillStyle='#050510'; ctx.fillRect(0,0,W,H);
    ctx.setLineDash([8,8]); ctx.strokeStyle='#1a1a44';
    ctx.beginPath(); ctx.moveTo(W/2,0); ctx.lineTo(W/2,H); ctx.stroke();
    ctx.setLineDash([]);

    ctx.shadowColor='#00e5ff'; ctx.shadowBlur=12;
    ctx.fillStyle='#00e5ff'; ctx.fillRect(20,py,PW,PH);
    ctx.fillStyle='#ff00cc'; ctx.fillRect(W-30,ay,PW,PH);
    ctx.shadowBlur=0;

    ctx.shadowColor='#ffee00'; ctx.shadowBlur=16;
    ctx.fillStyle='#ffee00';
    ctx.fillRect(bx-BALL/2,by-BALL/2,BALL,BALL);
    ctx.shadowBlur=0;

    ctx.fillStyle='#444'; ctx.font='20px "Press Start 2P"'; ctx.textAlign='center';
    ctx.fillText(score, W/2, 28);
  }

  function onKey(e) { keys[e.key] = e.type==='keydown'; }
  window.addEventListener('keydown', onKey);
  window.addEventListener('keyup',   onKey);

  function step() {
    if (!running) return;
    if (keys['ArrowUp']   && py>0)    py-=5;
    if (keys['ArrowDown'] && py<H-PH) py+=5;

    const center = ay+PH/2;
    if (by>center+6 && ay<H-PH) ay+=3.4;
    if (by<center-6 && ay>0)    ay-=3.4;

    bx+=vx; by+=vy;
    if (by<0||by>H) vy*=-1;
    if (bx-BALL/2<30+PW && by>py && by<py+PH) vx=Math.abs(vx)+0.15;
    if (bx+BALL/2>W-30-PW && by>ay && by<ay+PH) vx=-(Math.abs(vx)+0.1);

    if (bx<0) { bx=W/2; by=H/2; vx=3.5; vy=(Math.random()-0.5)*5; }
    if (bx>W) { score++; onScore(score); bx=W/2; by=H/2; vx=-3.5; vy=(Math.random()-0.5)*5; }

    draw();
    raf=requestAnimationFrame(step);
  }

  draw();
  raf=requestAnimationFrame(step);
  return {
    stop() {
      running=false; cancelAnimationFrame(raf);
      window.removeEventListener('keydown',onKey);
      window.removeEventListener('keyup',onKey);
    }
  };
}

// ─────────────────────────────────────────────
// BREAKOUT
// ─────────────────────────────────────────────
function breakout(canvas, ctx, onScore) {
  document.getElementById('modalControls').textContent = '← → MOVE PADDLE';
  const W=480, H=360, PW=80, PH=10, BALL=8;
  const COLS=10, ROWS=5, BW=40, BH=18, PAD=3;
  const COLORS=['#ff3344','#ff7700','#ffee00','#00ff88','#00e5ff'];
  let keys={};

  let bricks=[];
  for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++)
    bricks.push({x:c*(BW+PAD)+PAD, y:r*(BH+PAD)+40, w:BW, h:BH, alive:true, color:COLORS[r]});

  let px=W/2-PW/2, bx=W/2, by=H-60, vx=2.8, vy=-3.2;
  let score=0, running=true, lives=3, raf;

  function draw() {
    ctx.fillStyle='#050510'; ctx.fillRect(0,0,W,H);
    bricks.filter(b=>b.alive).forEach(b=>{
      ctx.shadowColor=b.color; ctx.shadowBlur=6;
      ctx.fillStyle=b.color; ctx.fillRect(b.x,b.y,b.w,b.h);
      ctx.shadowBlur=0;
      ctx.fillStyle='rgba(255,255,255,0.1)'; ctx.fillRect(b.x,b.y,b.w,4);
    });
    ctx.shadowColor='#00e5ff'; ctx.shadowBlur=10;
    ctx.fillStyle='#00e5ff'; ctx.fillRect(px,H-20,PW,PH);
    ctx.shadowBlur=0;
    ctx.shadowColor='#fff'; ctx.shadowBlur=12;
    ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(bx,by,BALL,0,Math.PI*2); ctx.fill();
    ctx.shadowBlur=0;
    ctx.fillStyle='#555'; ctx.font='8px "Press Start 2P"'; ctx.textAlign='left';
    ctx.fillText(`SCORE:${score}  ♥${lives}`, 8, 24);
  }

  function onKey(e) { keys[e.key]=e.type==='keydown'; }
  window.addEventListener('keydown', onKey);
  window.addEventListener('keyup',   onKey);

  function step() {
    if (!running) return;
    if (keys['ArrowLeft']  && px>0)    px-=6;
    if (keys['ArrowRight'] && px<W-PW) px+=6;

    bx+=vx; by+=vy;
    if (bx<BALL||bx>W-BALL) vx*=-1;
    if (by<BALL) vy*=-1;

    if (by>H-20-BALL && bx>px && bx<px+PW) {
      vy=-Math.abs(vy);
      vx+=(bx-(px+PW/2))/20;
    }

    if (by>H) {
      lives--; bx=W/2; by=H-60; vx=2.8; vy=-3.2;
      if (lives<=0) {
        running=false; draw();
        ctx.fillStyle='rgba(0,0,0,.6)'; ctx.fillRect(0,0,W,H);
        ctx.fillStyle='#ff3344'; ctx.font='16px "Press Start 2P"'; ctx.textAlign='center';
        ctx.fillText('GAME OVER',W/2,H/2-16);
        ctx.fillStyle='#ffee00'; ctx.font='9px "Press Start 2P"';
        ctx.fillText(`SCORE: ${score}`,W/2,H/2+10);
        return;
      }
    }

    bricks.filter(b=>b.alive).forEach(b=>{
      if (bx>b.x&&bx<b.x+b.w&&by>b.y&&by<b.y+b.h) {
        b.alive=false; vy*=-1; score+=10; onScore(score);
      }
    });

    if (!bricks.some(b=>b.alive)) {
      running=false;
      ctx.fillStyle='rgba(0,0,0,.6)'; ctx.fillRect(0,0,W,H);
      ctx.fillStyle='#00ff88'; ctx.font='14px "Press Start 2P"'; ctx.textAlign='center';
      ctx.fillText('YOU WIN!',W/2,H/2);
      return;
    }

    draw();
    raf=requestAnimationFrame(step);
  }

  draw();
  raf=requestAnimationFrame(step);
  return {
    stop() {
      running=false; cancelAnimationFrame(raf);
      window.removeEventListener('keydown',onKey);
      window.removeEventListener('keyup',onKey);
    }
  };
}

// ─────────────────────────────────────────────
// SPACE INVADERS
// ─────────────────────────────────────────────
function invaders(canvas, ctx, onScore) {
  document.getElementById('modalControls').textContent = '← → MOVE  SPACE / CLICK SHOOT';
  const W=480, H=360;
  const PW=44, PH=12;
  const AW=32, AH=22;
  const ECOLS=10, EROWS=3;

  let px=W/2-PW/2;
  let bullets=[];       // пули игрока — летят ВВЕРХ (y уменьшается)
  let enemyBullets=[];  // пули врагов  — летят ВНИЗ  (y увеличивается)
  let score=0, lives=3, running=true, raf;
  let shootCooldown=0, enemyShootTimer=0;

  let aliens=[];
  for(let r=0;r<EROWS;r++) for(let c=0;c<ECOLS;c++)
    aliens.push({x:c*44+20, y:r*36+30, alive:true, row:r});

  let alienDir=1, alienTimer=0, alienSpeed=30;

  // Движение — held state
  const keys={left:false, right:false};

  // Стрельба — вызывается сразу при событии, не ждёт игрового цикла
  function tryShoot() {
    if (!running || shootCooldown>0) return;
    bullets.push({x: px+PW/2, y: H-34});
    shootCooldown=18;
  }

  function onKeyDown(e) {
    if (e.code==='ArrowLeft')  { keys.left=true; }
    if (e.code==='ArrowRight') { keys.right=true; }
    if (e.code==='Space')      { tryShoot(); }
  }
  function onKeyUp(e) {
    if (e.code==='ArrowLeft')  keys.left=false;
    if (e.code==='ArrowRight') keys.right=false;
  }
  function onCanvasClick() { tryShoot(); }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup',   onKeyUp);
  canvas.addEventListener('click',   onCanvasClick);

  function drawPlayer() {
    ctx.shadowColor='#00ff88'; ctx.shadowBlur=12; ctx.fillStyle='#00ff88';
    ctx.fillRect(px,        H-16, PW,    6);
    ctx.fillRect(px+8,      H-22, PW-16, 6);
    ctx.fillRect(px+PW/2-3, H-28, 6,     6);
    ctx.shadowBlur=0;
  }

  function drawAlien(a) {
    const colors=['#ff3344','#ff7700','#00e5ff'];
    const col=colors[a.row]||'#ff3344';
    ctx.fillStyle=col; ctx.shadowColor=col; ctx.shadowBlur=6;
    ctx.fillRect(a.x+4, a.y+2,  AW-8, 8);
    ctx.fillRect(a.x,   a.y+6,  AW,   8);
    ctx.fillRect(a.x+4, a.y+14, AW-8, 6);
    const t=Math.floor(Date.now()/300)%2;
    if(t===0){ ctx.fillRect(a.x+2,    a.y+18,4,4); ctx.fillRect(a.x+AW-6,  a.y+18,4,4); }
    else     { ctx.fillRect(a.x+8,    a.y+18,4,4); ctx.fillRect(a.x+AW-12, a.y+18,4,4); }
    ctx.fillStyle='#050510'; ctx.shadowBlur=0;
    ctx.fillRect(a.x+8,    a.y+8,4,4);
    ctx.fillRect(a.x+AW-12,a.y+8,4,4);
  }

  function draw() {
    ctx.fillStyle='#050510'; ctx.fillRect(0,0,W,H);
    ctx.strokeStyle='#1a1a44'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(0,H-4); ctx.lineTo(W,H-4); ctx.stroke();

    drawPlayer();

    // Пули игрока — ЖЁЛТЫЕ, летят ВВЕРХ
    ctx.fillStyle='#ffee00'; ctx.shadowColor='#ffee00'; ctx.shadowBlur=12;
    bullets.forEach(b => ctx.fillRect(b.x-2, b.y, 4, 16));
    ctx.shadowBlur=0;

    // Пули врагов — КРАСНЫЕ, летят ВНИЗ
    ctx.fillStyle='#ff3344'; ctx.shadowColor='#ff3344'; ctx.shadowBlur=8;
    enemyBullets.forEach(b => ctx.fillRect(b.x-2, b.y, 4, 16));
    ctx.shadowBlur=0;

    aliens.filter(a=>a.alive).forEach(drawAlien);

    ctx.fillStyle='#555'; ctx.font='8px "Press Start 2P"'; ctx.textAlign='left';
    ctx.fillText(`SCORE:${score}  ♥${lives}`, 8, 20);
  }

  function step() {
    if (!running) return;

    // Движение игрока
    if (keys.left  && px>0)    px-=5;
    if (keys.right && px<W-PW) px+=5;
    if (shootCooldown>0) shootCooldown--;

    // Пули игрока летят ВВЕРХ — y уменьшается
    for (let i=bullets.length-1; i>=0; i--) {
      bullets[i].y -= 11;
      if (bullets[i].y < -20) bullets.splice(i,1);
    }

    // Движение инопланетян
    alienTimer++;
    const live = aliens.filter(a=>a.alive);
    if (live.length===0) { running=false; winScreen(); return; }

    if (alienTimer >= alienSpeed) {
      alienTimer=0;
      let hitEdge=false;
      live.forEach(a=>{ if(a.x+alienDir*18 < 0 || a.x+alienDir*18+AW > W) hitEdge=true; });
      if (hitEdge) {
        live.forEach(a=>a.y+=16);
        alienDir*=-1;
        alienSpeed=Math.max(6, alienSpeed-1);
      } else {
        live.forEach(a=>a.x+=alienDir*18);
      }
    }

    // Враги стреляют ВНИЗ — y увеличивается
    enemyShootTimer++;
    if (enemyShootTimer>55 && live.length>0) {
      enemyShootTimer=0;
      const maxY=Math.max(...live.map(a=>a.y));
      const front=live.filter(a=>a.y>=maxY-36);
      const s=front[Math.floor(Math.random()*front.length)];
      enemyBullets.push({x:s.x+AW/2, y:s.y+AH+2});
    }
    for (let i=enemyBullets.length-1; i>=0; i--) {
      enemyBullets[i].y += 6;
      if (enemyBullets[i].y > H+20) enemyBullets.splice(i,1);
    }

    // Пуля игрока попадает в инопланетянина (перекрытие прямоугольников)
    outer: for (let bi=bullets.length-1; bi>=0; bi--) {
      const b=bullets[bi];
      for (let ai=0; ai<aliens.length; ai++) {
        const a=aliens[ai];
        if (!a.alive) continue;
        if (b.x+2>a.x && b.x-2<a.x+AW && b.y<a.y+AH && b.y+16>a.y) {
          a.alive=false;
          bullets.splice(bi,1);
          score += 10*(a.row+1);
          onScore(score);
          continue outer;
        }
      }
    }

    // Пуля врага попадает в игрока
    for (let bi=enemyBullets.length-1; bi>=0; bi--) {
      const b=enemyBullets[bi];
      if (b.x+2>px && b.x-2<px+PW && b.y+16>H-32 && b.y<H-4) {
        enemyBullets.splice(bi,1);
        lives--;
        if (lives<=0) { running=false; draw(); gameOverScreen(); return; }
      }
    }

    // Инопланетянин добрался до игрока
    if (live.some(a=>a.y+AH > H-32)) { running=false; draw(); gameOverScreen(); return; }

    draw();
    raf=requestAnimationFrame(step);
  }

  function gameOverScreen() {
    ctx.fillStyle='rgba(0,0,0,.7)'; ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#ff3344'; ctx.font='18px "Press Start 2P"'; ctx.textAlign='center';
    ctx.fillText('GAME OVER',W/2,H/2-20);
    ctx.fillStyle='#ffee00'; ctx.font='10px "Press Start 2P"';
    ctx.fillText(`SCORE: ${score}`,W/2,H/2+10);
  }
  function winScreen() {
    draw();
    ctx.fillStyle='rgba(0,0,0,.7)'; ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#00ff88'; ctx.font='16px "Press Start 2P"'; ctx.textAlign='center';
    ctx.fillText('YOU WIN!',W/2,H/2-10);
    ctx.fillStyle='#ffee00'; ctx.font='10px "Press Start 2P"';
    ctx.fillText(`SCORE: ${score}`,W/2,H/2+16);
  }

  draw();
  raf=requestAnimationFrame(step);
  return {
    stop() {
      running=false; cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup',   onKeyUp);
      canvas.removeEventListener('click',   onCanvasClick);
    }
  };
}
