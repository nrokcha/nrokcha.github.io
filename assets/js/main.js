
(function(){
  const btn = document.querySelector('[data-menu-open]');
  const overlay = document.getElementById('menuOverlay');
  if(!btn || !overlay) return;

  const open = ()=>{
    overlay.classList.add('open');
    document.body.classList.add('menu-open');     // ✅ 추가: 메뉴 열릴 때 X로
  };

  const shut = ()=>{
    overlay.classList.remove('open');
    document.body.classList.remove('menu-open');  // ✅ 추가: 메뉴 닫힐 때 햄버거로
  };

  btn.addEventListener('click', open);
  close.addEventListener('click', shut);

  overlay.addEventListener('click', (e)=>{
    if(e.target === overlay) shut();
  });

  document.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape') shut();
  });
})();
