/* sfx.js — one-file, self-healing SFX for Ore
 * - Gain: sounds/diem.mp3  (Z to test)
 * - Boom: sounds/no.wav     (X to test)
 * Works even if game functions are redefined later.
 */
(function () {
  // ===== Config: đổi đường dẫn nếu khác =====
  var PATHS = {
    explode: 'sounds/no.wav',
    gain:    'sounds/diem.mp3'
  };

  // ===== Base =====
  window.Game = window.Game || {};
  var Game = window.Game;
  Game.sfxEnabled = (Game.sfxEnabled ?? true);

  // ===== Utilities =====
  function safeInt(x){ x = (x||'').toString().replace(/[^\d-]/g,''); var n = parseInt(x,10); return isNaN(n)?0:n; }

  function playSfxEl(el){
    if (!el) return;
    try{
      // clone để không cắt tiếng khi phát chồng
      var c = el.cloneNode(true);
      c.volume = el.volume;
      var p = c.play();
      if (p && p.catch) p.catch(function(){
        try{ el.currentTime = 0; el.play().catch(()=>{}); }catch(e){}
      });
    }catch(e){}
  }

  // ===== Init audio elements sau khi DOM sẵn sàng =====
  var gainEl, boomEl;
  function ensureAudios(){
    if (!document.body) return false;
    if (!gainEl){
      gainEl = document.createElement('audio');
      gainEl.src = PATHS.gain; gainEl.preload = 'auto'; gainEl.volume = 0.9; gainEl.style.display='none';
      gainEl.setAttribute('playsinline',''); gainEl.addEventListener('error', ()=>console.error('[SFX] Không tải được', gainEl.src));
      document.body.appendChild(gainEl);
    }
    if (!boomEl){
      boomEl = document.createElement('audio');
      boomEl.src = PATHS.explode; boomEl.preload = 'auto'; boomEl.volume = 1.0; boomEl.style.display='none';
      boomEl.setAttribute('playsinline',''); boomEl.addEventListener('error', ()=>console.error('[SFX] Không tải được', boomEl.src));
      document.body.appendChild(boomEl);
    }
    return true;
  }

  // ===== Unlock audio một lần (iOS/Safari, Chrome policy…) =====
  function attachUnlock(){
    if (Game._audioUnlockAttached) return;
    Game._audioUnlockAttached = true;
    var unlocked = false;
    var unlock = function(){
      if (unlocked) return; unlocked = true;
      ensureAudios();
      [gainEl, boomEl].forEach(function(a){
        if (!a) return;
        a.play().then(()=>{ a.pause(); a.currentTime = 0; }).catch(()=>{});
      });
      window.removeEventListener('pointerdown', unlock, true);
      window.removeEventListener('keydown', unlock, true);
      console.log('[SFX] audio unlocked');
    };
    window.addEventListener('pointerdown', unlock, true);
    window.addEventListener('keydown', unlock, true);
  }

  // ===== Hook: phát nổ khi click bomb (không đụng Bomb.js) =====
  function attachBombClick(){
    if (Game._bombClickHooked) return;
    Game._bombClickHooked = true;
    document.addEventListener('click', function(e){
      var el = e.target && e.target.closest ? e.target.closest('.bomb') : null;
      if (el){ playSfxEl(boomEl); }
    }, true); // capture để chắc chắn nhận trước
  }

  // ===== Hook: phát điểm khi score tăng (không đụng score.js) =====
  var prevScore = 0;
  function startScoreWatcher(){
    if (Game._scoreWatchStarted) return;
    Game._scoreWatchStarted = true;
    // Lấy giá trị ban đầu sau khi UI dựng
    setTimeout(function(){
      var el = document.getElementById('current_score');
      prevScore = safeInt(el ? el.textContent : '0');
    }, 0);

    setInterval(function(){
      var el = document.getElementById('current_score');
      if (!el) return;
      var now = safeInt(el.textContent);
      if (now > prevScore){
        playSfxEl(gainEl);
      }
      prevScore = now;
    }, 120);
  }

  // ===== Public helper cho code khác cũng có thể gọi =====
  Game.playSfx = function(name){
    if (!Game.sfxEnabled) return;
    if (name === 'gain') return playSfxEl(gainEl);
    if (name === 'explode') return playSfxEl(boomEl);
  };

  // ===== Key test nhanh =====
  function attachKeyTest(){
    if (Game._sfxKeyTestUnified) return;
    Game._sfxKeyTestUnified = true;
    window.addEventListener('keydown', function(e){
      if (e.key==='z'||e.key==='Z') Game.playSfx('gain');     // test điểm
      if (e.key==='x'||e.key==='X') Game.playSfx('explode');  // test nổ
    });
  }

  // ===== Boot =====
  function boot(){
    ensureAudios();
    attachUnlock();
    attachBombClick();
    startScoreWatcher();
    attachKeyTest();
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
