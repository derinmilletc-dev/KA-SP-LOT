import os
from playwright.sync_api import sync_playwright
URL='file://'+os.path.abspath(os.path.join(os.path.dirname(__file__),'..','index.html'))
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':760,'height':800}); er=[]
    pg.on('pageerror',lambda e:er.append(str(e))); pg.add_init_script('window.supabase={createClient:()=>({})}')
    pg.goto(URL); pg.wait_for_timeout(800)
    pg.evaluate("""()=>{const d=document.createElement('div');d.id='t';d.innerHTML='<div class="seg" style="width:300px">'+Array.from({length:10},(_,i)=>'<button aria-pressed="'+(i==0)+'">Sekme '+i+' uzun</button>').join('')+'</div>';document.body.appendChild(d);segFix()}""")
    r=pg.evaluate("""async()=>{const s=document.querySelector('#t .seg');const o={s0:s.scrollWidth>s.clientWidth,hs:!!s.__hs};
      s.dispatchEvent(new WheelEvent('wheel',{deltaY:200,bubbles:true,cancelable:true}));await new Promise(r=>setTimeout(r,500));o.wheel=s.scrollLeft;
      const pe=(t,x,el)=>el.dispatchEvent(new PointerEvent(t,{pointerType:'mouse',button:0,clientX:x,bubbles:true}));
      const l=s.scrollLeft;pe('pointerdown',200,s);pe('pointermove',120,window);pe('pointerup',120,window);await new Promise(r=>setTimeout(r,500));o.drag=s.scrollLeft-l;return o}""")
    print(r, 'OK' if r['wheel']>50 and r['drag']>40 else 'FAIL')
    print('FAIL sayfa hatasi' if er else 'Sayfa hatasi yok')
