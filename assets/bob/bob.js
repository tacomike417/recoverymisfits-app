/* HIGH FIVE BOB, approved art (v238, 14 Oct 2026). The ChatGPT handoff component (bob.js), changed
   only where Mike decided on 14 Oct:
   - asset paths point at /assets/bob/
   - v241 (Mike): the gold box just says "You high-fived Bob today." The count sentence lives
     under Bob on the Porch; screen readers hear it here too. NO ZEROS: number only at 2 or more.
   - after your high five, tapping the gold panel plays the slap again (still counts once a day)
   - somebody whose high five can't count (not a confirmed member) gets the slap, then Bob goes
     back to waiting; the Porch shows them a note.
   getStatus() and onHighFive() return {highFived, others}: others = people besides you today.
   onHighFive() can return null: nothing changed, Bob goes back to how he was. */
window.HighFiveBob={mount:async function(root,api){
  if(!root||!api?.getStatus||!api?.onHighFive)throw Error('HighFiveBob requires getStatus and onHighFive callbacks');
  const A='/assets/bob/';
  root.innerHTML='<div class="bob" aria-label="High Five Bob"><img alt="Bob sitting on the porch drinking coffee" src="'+A+'bob-idle.webp"><button class="bob-action" aria-label="High five Bob" type="button">High Five Bob</button><div class="bob-count" hidden aria-live="polite"></div><i class="bob-btm" hidden></i></div>';
  [A+'bob-slap.webp',A+'bob-done.webp'].forEach(s=>{const i=new Image();i.src=s});
  const box=root.querySelector('.bob'),img=box.querySelector('img'),btn=box.querySelector('button'),count=box.querySelector('.bob-count'),btm=box.querySelector('.bob-btm');
  let done=false;
  const set=(s)=>{done=!!(s&&s.highFived);
    img.src=A+'bob-'+(done?'done':'idle')+'.webp';
    img.alt=done?'Bob smiling, giving a thumbs-up and saying Keep coming back':'Bob sitting on the porch drinking coffee';
    btn.setAttribute('aria-label',done?'High five Bob again':'High five Bob');
    count.hidden=!done;btm.hidden=!done;
    if(done){const n=Math.max(0,Number(s.others)||0),nn=n.toLocaleString('en-US');
      count.innerHTML='<span>You high-fived</span><span>Bob today</span>';
      count.setAttribute('aria-label',n>=2?'You and '+nn+' other Misfits high-fived Bob today.':'You high-fived Bob today.')}};
  const slap=(ms)=>new Promise(r=>{img.src=A+'bob-slap.webp';count.hidden=true;btm.hidden=true;setTimeout(r,ms)});
  let last={highFived:false,others:0};
  const paint=(s)=>{if(s)last=s;set(last)};
  paint(await api.getStatus().catch(()=>null));
  btn.addEventListener('click',async()=>{
    if(box.getAttribute('aria-busy')==='true')return;
    box.setAttribute('aria-busy','true');btn.disabled=true;
    try{
      if(done){await slap(600);paint()}                       /* already counted today: just the slap again */
      else{img.src=A+'bob-slap.webp';const result=await api.onHighFive();await new Promise(r=>setTimeout(r,380));paint(result)}
    }catch(e){paint(await api.getStatus().catch(()=>null));console.error(e)}
    finally{btn.disabled=false;box.removeAttribute('aria-busy')}});
  return {refresh:async()=>paint(await api.getStatus().catch(()=>null))};
}};
