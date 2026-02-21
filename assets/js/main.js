
(function(){
  const btn = document.querySelector('[data-menu-open]');
  const overlay = document.getElementById('menuOverlay');
  if(!btn || !overlay) return;

  // ⭐️ 햄버거 = 열기 + 닫기 동시에 처리
  btn.addEventListener('click', ()=>{
    const isOpen = overlay.classList.toggle('open');
    document.body.classList.toggle('menu-open', isOpen);
  });

  // ⭐️ 오버레이 배경 클릭하면 닫기
  overlay.addEventListener('click', (e)=>{
    if(e.target === overlay){
      overlay.classList.remove('open');
      document.body.classList.remove('menu-open');
    }
  });

  // ⭐️ ESC 키 닫기
  document.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape'){
      overlay.classList.remove('open');
      document.body.classList.remove('menu-open');
    }
  });
})();
