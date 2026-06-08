import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase as db } from './supabase.js';

// ── Config ─────────────────────────────────────────────────
const ADMIN_PW  = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';
const SUB_HOURS = 72;
const TAGS = ['Intimacy','Companionship','Casual','Deep Connection','Adventure','Discreet'];
const PALETTE = ['#7a4f2e','#2e6b5e','#5e2e6b','#6b5e2e','#2e4f6b','#6b2e4f'];
const gc   = n  => PALETTE[n.charCodeAt(0) % PALETTE.length];
const ini  = n  => n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2);
const isNew = j => j && Date.now() - new Date(j) < 3*86400000;
const fmt   = d => d ? new Date(d).toLocaleDateString('en-GB',{day:'numeric',month:'short'}) : '—';

function subInfo(exp) {
  if (!exp) return { active:false, label:'Locked', pct:0 };
  const diff = new Date(exp) - new Date();
  if (diff <= 0) return { active:false, label:'Expired', pct:0 };
  const h = Math.floor(diff/3600000), m = Math.floor((diff%3600000)/60000);
  return { active:true, label:`${h}h ${m}m left`, pct: diff/(SUB_HOURS*3600000)*100 };
}

function profileScore(u) {
  return (u.photo?30:0)+(u.bio?.length>20?30:0)+(u.interests?.length>=2?20:0)+(u.location?10:0)+(u.age?10:0);
}

// ── Session helpers ─────────────────────────────────────────
function getSessionId() {
  try {
    let id = localStorage.getItem('vl-sid');
    if (!id) { id = Math.random().toString(36).slice(2); localStorage.setItem('vl-sid',id); }
    return id;
  } catch { return Math.random().toString(36).slice(2); }
}
function getSparked()  { try { if(typeof localStorage === 'undefined') return new Set(); return new Set(JSON.parse(localStorage.getItem('vl-sp')||'[]')); } catch { return new Set(); } }
function saveSparked(s){ try { localStorage.setItem('vl-sp', JSON.stringify([...s])); } catch {} }
function ageVerified() { try { return typeof localStorage !== 'undefined' && localStorage.getItem('vl-age')==='1'; } catch { return false; } }
function setAgeOk()    { try { if(typeof localStorage !== 'undefined') localStorage.setItem('vl-age','1'); } catch {} }

// ── AI photo check (calls server-side /api/analyze) ─────────
async function checkPhoto(b64) {
  try {
    const mt   = b64.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';
    const data = b64.split(',')[1];
    const res  = await fetch('/api/analyze', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ photo:data, mediaType:mt })
    });
    const json = await res.json();
    return json.result || 'unknown';
  } catch { return 'unknown'; }
}



// ── Components ──────────────────────────────────────────────
function Avatar({ name, photo, size=56, online=false }) {
  return (
    <div style={{position:'relative',flexShrink:0}}>
      {photo
        ? <img src={photo} style={{width:size,height:size,borderRadius:'50%',objectFit:'cover'}} alt="" />
        : <div style={{width:size,height:size,borderRadius:'50%',background:gc(name||'?'),display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*.3,color:'#f0e6d3',fontFamily:"'Cormorant Garamond',serif"}}>{ini(name||'?')}</div>
      }
      {online && <div style={{position:'absolute',bottom:2,right:2,width:Math.max(8,size*.16),height:Math.max(8,size*.16),borderRadius:'50%',background:'#4ade80',border:'2px solid #080808'}}/>}
    </div>
  );
}

function useToast() {
  const [list,setList] = useState([]);
  const add = useCallback((msg,type='info') => {
    const id = Date.now()+Math.random();
    setList(p=>[...p,{id,msg,type}]);
    setTimeout(()=>setList(p=>p.filter(t=>t.id!==id)),3200);
  },[]);
  return {list,add};
}
function Toasts({list}) {
  const C = {success:['#0d2016','#4ade8044','#4ade80'],error:['#200d0d','#e0707044','#e07070'],info:['#141414','#c9a96e22','#c9a96e']};
  return (
    <div style={{position:'fixed',bottom:'1.5rem',right:'1.5rem',zIndex:9999,display:'flex',flexDirection:'column',gap:'.5rem',pointerEvents:'none',maxWidth:260}}>
      {list.map(t=>{const[bg,br,cl]=C[t.type]||C.info; return <div key={t.id} style={{background:bg,border:`1px solid ${br}`,color:cl,padding:'.7rem 1rem',fontSize:'.78rem',fontFamily:"'Jost',sans-serif",lineHeight:1.5,animation:'toastIn .25s ease'}}>{t.msg}</div>;})}
    </div>
  );
}

const CONF = Array.from({length:28},(_,i)=>({l:Math.random()*100,dy:Math.random()*.6,du:1.5+Math.random()*1.5,bg:['#c9a96e','#f0e6d3','#4ade80','#60a5fa','#f472b6'][i%5],r:i%3===0?'50%':'2px',sz:4+Math.random()*5}));
function Confetti({on}) {
  if(!on)return null;
  return <div style={{position:'fixed',inset:0,pointerEvents:'none',zIndex:9998,overflow:'hidden'}}>{CONF.map((p,i)=><div key={i} style={{position:'absolute',left:`${p.l}%`,top:'-16px',width:p.sz,height:p.sz,background:p.bg,borderRadius:p.r,animation:`fall ${p.du}s ${p.dy}s forwards ease-in`}}/>)}</div>;
}

// ── Age Gate ────────────────────────────────────────────────
function AgeGate({ onAccept, siteName }) {
  const [agreed,setAgreed] = useState(false);
  const [showTos,setShowTos] = useState(false);
  return (
    <div style={{position:'fixed',inset:0,background:'#080808',zIndex:10000,display:'flex',alignItems:'center',justifyContent:'center',padding:'1.5rem'}}>
      {showTos ? (
        <div style={{maxWidth:560,background:'#0e0e0e',border:'1px solid #1e1e1e',padding:'2rem',maxHeight:'80vh',overflowY:'auto'}}>
          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'1.6rem',color:'#c9a96e',marginBottom:'1.5rem'}}>Terms of Service</h2>
          {[
            ['1. Eligibility','You must be 18 years of age or older to use this platform. By entering you confirm your age and legal capacity to access adult content in your jurisdiction.'],
            ['2. Consent','All interactions on this platform are between consenting adults. Users agree to treat others with respect and dignity at all times.'],
            ['3. No Paid Services','This platform strictly prohibits solicitation or facilitation of paid sexual services. Any such activity will result in immediate removal.'],
            ['4. Content Policy','Profile photos must show a real human face or body. Fake profiles, impersonation, or misleading content is prohibited.'],
            ['5. Privacy','Contact details are private and only revealed through the subscription system. Do not share or misuse another user\'s personal information.'],
            ['6. Discretion','Users agree to maintain the privacy of other members and not share screenshots, contact details, or any information obtained through the platform.'],
            ['7. Liability','This platform provides a connection service only. We are not responsible for interactions that occur outside the platform.'],
            ['8. Termination','We reserve the right to remove any user or content at our discretion without notice.'],
          ].map(([t,b])=>(
            <div key={t} style={{marginBottom:'1.25rem'}}>
              <div style={{fontSize:'.7rem',letterSpacing:2,textTransform:'uppercase',color:'#c9a96e',marginBottom:'.4rem'}}>{t}</div>
              <p style={{fontSize:'.82rem',color:'#888',lineHeight:1.75}}>{b}</p>
            </div>
          ))}
          <button onClick={()=>setShowTos(false)} style={{background:'none',border:'1px solid #c9a96e',color:'#c9a96e',padding:'.6rem 1.5rem',fontFamily:"'Jost',sans-serif",fontSize:'.72rem',letterSpacing:2,textTransform:'uppercase',cursor:'pointer',marginTop:'.5rem'}}>Close</button>
        </div>
      ) : (
        <div style={{maxWidth:400,textAlign:'center'}}>
          <div style={{fontSize:'2.5rem',marginBottom:'1.5rem'}}>🌹</div>
          <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'2.2rem',fontWeight:300,color:'#c9a96e',marginBottom:'.75rem'}}>Adults Only</h1>
          <p style={{color:'#555',fontSize:'.85rem',lineHeight:1.85,marginBottom:'2rem',maxWidth:320,margin:'0 auto 2rem'}}>
            {siteName} is an adult platform for consenting adults aged 18 and over. By entering you confirm you meet the age requirement in your jurisdiction.
          </p>
          <label style={{display:'flex',alignItems:'flex-start',gap:'.75rem',textAlign:'left',marginBottom:'2rem',cursor:'pointer',maxWidth:340,margin:'0 auto 2rem'}}>
            <input type="checkbox" checked={agreed} onChange={e=>setAgreed(e.target.checked)} style={{marginTop:'.25rem',accentColor:'#c9a96e',width:14,height:14,flexShrink:0}}/>
            <span style={{color:'#777',fontSize:'.8rem',lineHeight:1.75}}>
              I confirm I am <strong style={{color:'#f0e6d3'}}>18 years or older</strong> and I agree to the{' '}
              <span style={{color:'#c9a96e',cursor:'pointer',textDecoration:'underline'}} onClick={e=>{e.preventDefault();setShowTos(true)}}>Terms of Service</span>.
              This platform does not facilitate paid services.
            </span>
          </label>
          <button
            disabled={!agreed}
            onClick={onAccept}
            style={{background:agreed?'linear-gradient(135deg,#c9a96e,#a07840)':'#1a1a1a',color:agreed?'#080808':'#444',border:'none',padding:'1rem 3rem',fontFamily:"'Jost',sans-serif",fontSize:'.78rem',letterSpacing:3,textTransform:'uppercase',cursor:agreed?'pointer':'not-allowed',fontWeight:500,transition:'all .3s',display:'block',width:'100%',maxWidth:300,margin:'0 auto'}}
          >
            Enter Site
          </button>
          <p style={{color:'#1e1e1e',fontSize:'.65rem',marginTop:'1.5rem',lineHeight:1.7,maxWidth:320,margin:'1.5rem auto 0'}}>
            By entering you also confirm you are not accessing this site from a jurisdiction where such content is prohibited.
          </p>
        </div>
      )}
    </div>
  );
}

// ── CSS ──────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,400&family=Jost:wght@300;400;500&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
@keyframes fall{to{transform:translateY(110vh) rotate(520deg);opacity:0}}
@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-16px)}}
@keyframes glow{0%,100%{opacity:.2}50%{opacity:.5}}
@keyframes hb{0%{transform:scale(1)}35%{transform:scale(1.5)}65%{transform:scale(.9)}100%{transform:scale(1)}}
@keyframes toastIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
@keyframes pop{0%{transform:scale(0)}80%{transform:scale(1.1)}100%{transform:scale(1)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes saved{0%{opacity:0}30%{opacity:1}80%{opacity:1}100%{opacity:0}}
@keyframes scan{0%{background-position:-200% 0}100%{background-position:200% 0}}
@keyframes slideIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}

.nav{display:flex;justify-content:space-between;align-items:center;padding:1rem 2rem;background:#0d0d0dcc;border-bottom:1px solid #181818;position:sticky;top:0;z-index:100;backdrop-filter:blur(14px);}
.logo{font-family:'Cormorant Garamond',serif;font-size:1.4rem;font-weight:300;letter-spacing:5px;color:#c9a96e;text-transform:uppercase;cursor:pointer;user-select:none;}
.nb{background:none;border:1px solid #2a2a2a;color:#777;padding:.35rem .9rem;font-family:'Jost',sans-serif;font-size:.68rem;letter-spacing:2px;text-transform:uppercase;cursor:pointer;transition:all .2s;position:relative;}
.nb:hover{border-color:#c9a96e;color:#c9a96e;}
.nb.g{background:linear-gradient(135deg,#c9a96e,#a07840);color:#080808;border-color:transparent;font-weight:500;}
.nb.g:hover{transform:translateY(-1px);box-shadow:0 4px 16px rgba(201,169,110,.3);}
.nbadge{position:absolute;top:-6px;right:-6px;background:#e07070;color:#fff;font-size:.5rem;width:16px;height:16px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid #080808;animation:pop .3s ease;}
.hero{position:relative;text-align:center;padding:5rem 1.5rem 3rem;overflow:hidden;}
.orb{position:absolute;border-radius:50%;filter:blur(70px);pointer-events:none;}
.eyebrow{font-size:.62rem;letter-spacing:4px;text-transform:uppercase;color:#c9a96e;margin-bottom:1rem;animation:fadeUp .5s ease both;}
.ht{font-family:'Cormorant Garamond',serif;font-size:clamp(2.4rem,6vw,4rem);font-weight:300;color:#f0e6d3;line-height:1.1;margin-bottom:1rem;animation:fadeUp .5s .1s ease both;}
.ht em{font-style:italic;color:#c9a96e;}
.hs{color:#555;font-size:.85rem;max-width:380px;line-height:1.9;margin:0 auto 2.5rem;font-weight:300;animation:fadeUp .5s .15s ease both;}
.si{position:relative;max-width:360px;margin:0 auto 2rem;}
.si input{width:100%;background:#0e0e0e;border:1px solid #1e1e1e;color:#f0e6d3;padding:.65rem .9rem .65rem 2.4rem;font-family:'Jost',sans-serif;font-size:.85rem;outline:none;transition:border-color .25s;}
.si input:focus{border-color:#c9a96e55;}
.si .ico{position:absolute;left:.75rem;top:50%;transform:translateY(-50%);color:#333;}
.si .cx{position:absolute;right:.75rem;top:50%;transform:translateY(-50%);background:none;border:none;color:#444;cursor:pointer;}
.si .cx:hover{color:#c9a96e;}
.tags{display:flex;gap:.45rem;flex-wrap:wrap;justify-content:center;margin-bottom:2.5rem;}
.tb{background:none;border:1px solid #1e1e1e;color:#555;padding:.28rem .8rem;font-family:'Jost',sans-serif;font-size:.66rem;letter-spacing:1.5px;text-transform:uppercase;cursor:pointer;transition:all .2s;}
.tb:hover{border-color:#c9a96e44;color:#c9a96e;}
.tb.on{border-color:#c9a96e;color:#c9a96e;background:#c9a96e0d;}
.mini{background:#111;color:#666;font-size:.58rem;letter-spacing:1px;text-transform:uppercase;padding:.15rem .42rem;border:1px solid #1a1a1a;}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:1.2rem;}
.card{background:#0e0e0e;border:1px solid #181818;padding:1.5rem;cursor:pointer;transition:all .3s;position:relative;overflow:hidden;}
.card::after{content:'';position:absolute;inset:0;background:linear-gradient(135deg,#c9a96e0a,transparent);opacity:0;transition:opacity .3s;pointer-events:none;}
.card:hover{border-color:#c9a96e33;transform:translateY(-5px);box-shadow:0 16px 48px rgba(0,0,0,.5);}
.card:hover::after{opacity:1;}
.cn{font-family:'Cormorant Garamond',serif;font-size:1.15rem;color:#f0e6d3;margin-bottom:.2rem;}
.cl{font-size:.68rem;color:#3a3a3a;margin-bottom:.5rem;}
.cb{font-size:.78rem;color:#666;line-height:1.7;}
.cf{display:flex;justify-content:space-between;align-items:center;margin-top:.9rem;padding-top:.7rem;border-top:1px solid #151515;}
.spkb{background:none;border:none;cursor:pointer;padding:.15rem;display:flex;align-items:center;gap:.3rem;color:#444;font-family:'Jost',sans-serif;font-size:.7rem;}
.si2{display:inline-block;transition:transform .2s;font-size:1rem;}
.spkb:hover .si2{transform:scale(1.3);}
.spkb.on .si2{animation:hb .4s ease;}
.spkb.on{color:#f472b6;}
.vc{font-size:.62rem;color:#252525;}
.bnw{position:absolute;top:.65rem;right:.65rem;background:#c9a96e;color:#080808;font-size:.52rem;letter-spacing:1.5px;text-transform:uppercase;padding:.12rem .45rem;font-family:'Jost',sans-serif;font-weight:500;animation:pop .35s ease;}
.back{background:none;border:none;color:#555;font-family:'Jost',sans-serif;font-size:.68rem;letter-spacing:2px;text-transform:uppercase;cursor:pointer;padding:0;}
.back:hover{color:#c9a96e;}
.pn{font-family:'Cormorant Garamond',serif;font-size:1.8rem;font-weight:300;color:#f0e6d3;}
.slbl{font-size:.58rem;letter-spacing:3px;text-transform:uppercase;color:#333;margin-bottom:.55rem;}
.cri{display:flex;justify-content:space-between;padding:.65rem 0;border-bottom:1px solid #141414;font-size:.85rem;color:#c8b89a;}
.crl{color:#3a3a3a;font-size:.62rem;letter-spacing:1.5px;text-transform:uppercase;}
.rbtn{background:linear-gradient(135deg,#c9a96e,#a07840);color:#080808;border:none;padding:.85rem 2rem;font-family:'Jost',sans-serif;font-size:.75rem;letter-spacing:3px;text-transform:uppercase;cursor:pointer;transition:all .25s;font-weight:500;}
.rbtn:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(201,169,110,.25);}
.rbtn:disabled{opacity:.45;cursor:not-allowed;transform:none;box-shadow:none;}
.sbar{height:2px;background:#1a1a1a;border-radius:1px;overflow:hidden;margin-top:.4rem;}
.sbar div{height:100%;background:linear-gradient(90deg,#c9a96e,#f0d090);border-radius:1px;transition:width .8s;}
.onl{display:flex;align-items:center;gap:.35rem;font-size:.62rem;color:#4ade80;letter-spacing:1px;text-transform:uppercase;margin-top:.3rem;}
.dot{width:6px;height:6px;border-radius:50%;background:#4ade80;animation:glow 2s infinite;}
.mf{display:flex;flex-direction:column;gap:.75rem;}
.mi{background:#0c0c0c;border:1px solid #1e1e1e;color:#f0e6d3;padding:.65rem .85rem;font-family:'Jost',sans-serif;font-size:.85rem;outline:none;transition:border-color .2s;width:100%;}
.mi:focus{border-color:#c9a96e44;}
.msb{background:none;border:1px solid #c9a96e;color:#c9a96e;padding:.55rem 1.3rem;font-family:'Jost',sans-serif;font-size:.68rem;letter-spacing:2px;text-transform:uppercase;cursor:pointer;transition:all .2s;align-self:flex-start;}
.msb:hover{background:#c9a96e11;}
.msb:disabled{opacity:.4;cursor:not-allowed;}
.fl{font-size:.6rem;letter-spacing:2px;text-transform:uppercase;color:#3a3a3a;margin-bottom:.4rem;}
.fi{width:100%;background:#0c0c0c;border:1px solid #1e1e1e;color:#f0e6d3;padding:.68rem .85rem;font-family:'Jost',sans-serif;font-size:.88rem;outline:none;margin-bottom:1rem;transition:border-color .2s;}
.fi:focus{border-color:#c9a96e44;}
textarea.fi{resize:vertical;}
.cc{font-size:.62rem;color:#2a2a2a;text-align:right;margin-top:-.75rem;margin-bottom:1rem;}
.ul{display:inline-block;border:1px dashed #2a2a2a;color:#666;padding:.5rem 1.1rem;font-family:'Jost',sans-serif;font-size:.68rem;letter-spacing:2px;text-transform:uppercase;cursor:pointer;transition:all .2s;}
.ul:hover{border-color:#c9a96e;color:#c9a96e;}
.ai-scan{background:linear-gradient(90deg,#0e0e0e 25%,#161208 50%,#0e0e0e 75%);background-size:200% 100%;animation:scan 1.5s infinite;border:1px solid #c9a96e22;padding:.55rem .85rem;font-size:.72rem;color:#c9a96e;display:flex;align-items:center;gap:.5rem;}
.ai-ok{background:#0d2016;border:1px solid #4ade8033;color:#4ade80;padding:.55rem .85rem;font-size:.72rem;display:flex;align-items:center;gap:.5rem;}
.ai-bad{background:#200d0d;border:1px solid #e0707033;color:#e07070;padding:.55rem .85rem;font-size:.72rem;display:flex;align-items:center;gap:.5rem;}
.spn{display:inline-block;width:12px;height:12px;border:2px solid #333;border-top-color:#c9a96e;border-radius:50%;animation:spin .7s linear infinite;flex-shrink:0;}
.at{background:none;border:none;border-bottom:2px solid transparent;color:#3a3a3a;padding:.55rem 1rem;font-family:'Jost',sans-serif;font-size:.68rem;letter-spacing:2px;text-transform:uppercase;cursor:pointer;transition:all .2s;white-space:nowrap;}
.at.on{color:#c9a96e;border-bottom-color:#c9a96e;}
.ac{background:#0e0e0e;border:1px solid #181818;padding:1.4rem;animation:fadeUp .3s ease both;}
.ac:hover{border-color:#252525;}
.apb{background:#c9a96e0d;border:1px solid #c9a96e;color:#c9a96e;padding:.45rem 1.1rem;font-family:'Jost',sans-serif;font-size:.67rem;letter-spacing:2px;text-transform:uppercase;cursor:pointer;transition:all .2s;}
.apb:hover{background:#c9a96e1a;}
.rjb{background:none;border:1px solid #1e1e1e;color:#444;padding:.45rem 1.1rem;font-family:'Jost',sans-serif;font-size:.67rem;letter-spacing:2px;text-transform:uppercase;cursor:pointer;transition:all .2s;}
.rjb:hover{border-color:#e07070;color:#e07070;}
.sr{display:flex;align-items:center;background:#0e0e0e;border:1px solid #181818;padding:1rem 1.2rem;gap:.9rem;}
.sr:hover{border-color:#252525;}
.bon{font-size:.6rem;letter-spacing:1.5px;text-transform:uppercase;color:#4ade80;background:#4ade800d;border:1px solid #4ade8020;padding:.16rem .5rem;white-space:nowrap;}
.boff{font-size:.6rem;letter-spacing:1.5px;text-transform:uppercase;color:#333;background:#111;border:1px solid #1a1a1a;padding:.16rem .5rem;white-space:nowrap;}
.tog{position:relative;display:inline-block;width:42px;height:23px;flex-shrink:0;}
.tog input{opacity:0;width:0;height:0;}
.sldr{position:absolute;cursor:pointer;inset:0;background:#111;border-radius:23px;border:1px solid #1e1e1e;transition:.3s;}
.sldr::before{content:'';position:absolute;width:17px;height:17px;left:2px;bottom:2px;background:#2a2a2a;border-radius:50%;transition:.3s;}
input:checked+.sldr{background:#4ade800d;border-color:#4ade80;}
input:checked+.sldr::before{transform:translateX(19px);background:#4ade80;}
.sc{background:#0e0e0e;border:1px solid #181818;padding:1rem 1.3rem;flex:1;min-width:80px;}
.sc:hover{border-color:#252525;}
.sn{font-family:'Cormorant Garamond',serif;font-size:1.9rem;color:#c9a96e;line-height:1;}
.sl{font-size:.56rem;letter-spacing:2px;text-transform:uppercase;color:#2e2e2e;margin-top:.25rem;}
.es{text-align:center;padding:3rem 1rem;color:#222;font-family:'Cormorant Garamond',serif;font-size:1.1rem;font-style:italic;}
.mc{background:#0e0e0e;border:1px solid #181818;padding:1.2rem;animation:fadeUp .3s ease both;}
.mc.unr{border-color:#c9a96e22;}
.delbtn{background:none;border:none;color:#2a2a2a;cursor:pointer;font-size:.9rem;padding:.2rem;line-height:1;}
.delbtn:hover{color:#e07070;}
.svbtn{background:linear-gradient(135deg,#c9a96e,#a07840);color:#080808;border:none;padding:.7rem 1.8rem;font-family:'Jost',sans-serif;font-size:.72rem;letter-spacing:2px;text-transform:uppercase;cursor:pointer;font-weight:500;transition:all .2s;}
.svbtn:hover{transform:translateY(-1px);}
.dbtn{background:none;border:1px solid #2a2a2a;color:#444;padding:.4rem .9rem;font-family:'Jost',sans-serif;font-size:.62rem;letter-spacing:2px;text-transform:uppercase;cursor:pointer;transition:all .2s;}
.dbtn:hover{border-color:#e07070;color:#e07070;}
.ebtn{background:none;border:1px solid #2a2a2a;color:#666;padding:.4rem .9rem;font-family:'Jost',sans-serif;font-size:.62rem;letter-spacing:2px;text-transform:uppercase;cursor:pointer;transition:all .2s;}
.ebtn:hover{border-color:#c9a96e;color:#c9a96e;}
.aibadge-ok{font-size:.55rem;letter-spacing:1.5px;text-transform:uppercase;background:#4ade800d;border:1px solid #4ade8022;color:#4ade80;padding:.1rem .4rem;}
.aibadge-bad{font-size:.55rem;letter-spacing:1.5px;text-transform:uppercase;background:#e070700d;border:1px solid #e0707022;color:#e07070;padding:.1rem .4rem;}
.aibadge-unk{font-size:.55rem;letter-spacing:1.5px;text-transform:uppercase;background:#c9a96e0d;border:1px solid #c9a96e22;color:#c9a96e;padding:.1rem .4rem;}
.svd{font-size:.6rem;color:#4ade80;letter-spacing:1px;text-transform:uppercase;animation:saved 2s ease forwards;}
.spkp{display:inline-flex;align-items:center;gap:.3rem;background:#f472b611;border:1px solid #f472b622;padding:.18rem .55rem;font-size:.62rem;color:#f472b6;font-family:'Jost',sans-serif;}
.div{width:36px;height:1px;background:#c9a96e22;margin:2rem auto;}
.err{background:#200d0d;border:1px solid #e0707044;color:#e07070;padding:1rem 1.25rem;font-size:.8rem;font-family:'Jost',sans-serif;margin:2rem;line-height:1.6;}
@media(max-width:600px){.nav{padding:.8rem 1rem;} .hero{padding:3.5rem 1rem 2rem;} .grid{grid-template-columns:1fr 1fr;} .sc{padding:.75rem;} .sn{font-size:1.5rem;}}
`;

// ── Main App ─────────────────────────────────────────────────
export default function App() {
  const [verified, setVerified]   = useState(ageVerified);
  const [view,     setView]       = useState('landing');
  const [loading,  setLoading]    = useState(true);
  const [dbError,  setDbError]    = useState(false);
  const [sel,      setSel]        = useState(null);
  const [users,    setUsers]      = useState([]);
  const [pending,  setPending]    = useState([]);
  const [msgs,     setMsgs]       = useState([]);
  const [settings, setSettings]   = useState({ site_name:'Velvet', tagline:'Find your connection', whatsapp:'', telegram:'' });
  const [draft,    setDraft]      = useState(settings);
  const [adminIn,  setAdminIn]    = useState(false);
  const [pw,       setPw]         = useState('');
  const [pwErr,    setPwErr]      = useState('');
  const [tab,      setTab]        = useState('approvals');
  const [tag,      setTag]        = useState('All');
  const [search,   setSearch]     = useState('');
  const [form,     setForm]       = useState({ name:'', age:'', bio:'', interests:[], location:'', photo:null });
  const [done,     setDone]       = useState(false);
  const [autoOk,   setAutoOk]     = useState(false);
  const [checking, setChecking]   = useState(false);
  const [aiRes,    setAiRes]      = useState(null);
  const [showCt,   setShowCt]     = useState(false);
  const [mf,       setMf]         = useState({ name:'', contact:'', msg:'' });
  const [mSent,    setMSent]      = useState(false);
  const [confetti, setConfetti]   = useState(false);
  const [sparked,  setSparked]    = useState(getSparked);
  const [saved,    setSaved]      = useState(false);
  const { list: toasts, add: toast } = useToast();
  const realtime = useRef(null);

  // ── Load data ───────────────────────────────────────────
  useEffect(() => {
    if (!supabase) { setDbError(true); setLoading(false); return; }
    (async () => {
      try {
        const [u, p, m, s] = await Promise.all([db.users(), db.pending(), db.messages(), db.settings()]);
        setUsers(u); setPending(p); setMsgs(m);
        if (s) { setSettings(s); setDraft(s); }
        setLoading(false);
      } catch (e) { console.error(e); setDbError(true); setLoading(false); }
    })();
  }, []);

  // ── Realtime subscriptions ──────────────────────────────
  useEffect(() => {
    if (!supabase || loading) return;
    const ch = supabase.channel('velvet-live')
      .on('postgres_changes', { event:'*', schema:'public', table:'users' },    () => db.users().then(setUsers))
      .on('postgres_changes', { event:'*', schema:'public', table:'pending' },  () => db.pending().then(setPending))
      .on('postgres_changes', { event:'*', schema:'public', table:'messages' }, () => db.messages().then(setMsgs))
      .subscribe();
    realtime.current = ch;
    return () => supabase.removeChannel(ch);
  }, [loading]);

  // ── Persist sparks locally ──────────────────────────────
  useEffect(() => { saveSparked(sparked); }, [sparked]);

  // ── Auto-expire subs (UI side) ──────────────────────────
  useEffect(() => {
    const t = setInterval(() => setUsers(p => p.map(u => u.sub_expiry && new Date(u.sub_expiry) < new Date() ? { ...u, sub_expiry:null } : u)), 30000);
    return () => clearInterval(t);
  }, []);

  // ── Sync sel ────────────────────────────────────────────
  useEffect(() => { if (sel) setSel(users.find(u => u.id === sel.id) || null); }, [users]);

  // ── Actions ─────────────────────────────────────────────
  const goHome = () => { setView('landing'); setSel(null); setShowCt(false); setMSent(false); setMf({ name:'', contact:'', msg:'' }); };

  const openProfile = async u => {
    setSel(u); setView('profile'); setShowCt(false); setMSent(false);
    await db.incrViews(u.id);
    setUsers(p => p.map(x => x.id === u.id ? { ...x, views:(x.views||0)+1 } : x));
  };

  const doSpark = async (e, u) => {
    e.stopPropagation();
    const delta = sparked.has(u.id) ? -1 : 1;
    setSparked(p => { const n = new Set(p); delta > 0 ? n.add(u.id) : n.delete(u.id); return n; });
    setUsers(p => p.map(x => x.id === u.id ? { ...x, sparks: Math.max(0,(x.sparks||0)+delta) } : x));
    await db.updSparks(u.id, delta);
    if (delta > 0) toast(`Spark sent to ${u.name.split(' ')[0]} ✨`, 'success');
  };

  const sendMsg = async () => {
    if (!mf.name || !mf.msg || !sel) return;
    const m = { profile_id:sel.id, profile_name:sel.name, from_name:mf.name, contact:mf.contact, body:mf.msg, date:new Date().toISOString(), read:false };
    await db.addMessage(m);
    setMSent(true); toast('Message sent!', 'success');
  };

  const login = () => {
    if (pw === ADMIN_PW) { setAdminIn(true); setPwErr(''); toast('Welcome back 👋', 'info'); }
    else setPwErr('Incorrect password.');
  };

  const approve = async id => {
    const u = pending.find(p => p.id === id); if (!u) return;
    await db.addUser({ name:u.name, age:u.age, bio:u.bio, interests:u.interests, location:u.location, photo:u.photo, ai_status:u.ai_status, sub_expiry:null, online:false, views:0, sparks:u.sparks||0, joined:new Date().toISOString() });
    await db.deletePending(id);
    toast(`${u.name} is now live ✓`, 'success');
  };

  const reject = async id => {
    const u = pending.find(p => p.id === id);
    await db.deletePending(id);
    if (u) toast(`${u.name} rejected`, 'error');
  };

  const toggleSub = async id => {
    const u = users.find(x => x.id === id); if (!u) return;
    const { active } = subInfo(u.sub_expiry);
    const newExpiry = active ? null : new Date(Date.now()+SUB_HOURS*3600000).toISOString();
    await db.updateUser({ id, sub_expiry: newExpiry });
    setUsers(p => p.map(x => x.id === id ? { ...x, sub_expiry:newExpiry } : x));
    if (active) { toast(`${u.name.split(' ')[0]}'s access revoked`, 'error'); }
    else { toast(`${u.name.split(' ')[0]} granted 72h access 🔓`, 'success'); setConfetti(true); setTimeout(() => setConfetti(false), 2800); }
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const saveSettings = async () => { await db.saveSettings(draft); setSettings(draft); toast('Settings saved ✓', 'success'); };

  const exportCSV = () => {
    const hdr = ['Name','Age','Location','Joined','Status','Views','Sparks'];
    const rows = users.map(u => { const { active, label } = subInfo(u.sub_expiry); return [u.name,u.age,u.location||'',fmt(u.joined),active?`Active (${label})`:'Locked',u.views||0,u.sparks||0]; });
    const csv = [hdr,...rows].map(r => r.map(v => `"${String(v||'').replace(/"/g,'""')}"`).join(',')).join('\n');
    const a = Object.assign(document.createElement('a'), { href:URL.createObjectURL(new Blob([csv],{type:'text/csv'})), download:'subscribers.csv' });
    a.click(); toast('Exported ✓', 'success');
  };

  const onPhoto = e => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = async ev => {
      const photo = ev.target.result;
      setForm(d => ({ ...d, photo })); setAiRes(null); setChecking(true);
      const res = await checkPhoto(photo);
      setAiRes(res); setChecking(false);
    };
    r.readAsDataURL(f);
  };

  const toggleI = t => setForm(d => ({ ...d, interests: d.interests.includes(t) ? d.interests.filter(x => x!==t) : [...d.interests,t] }));

  const submit = async () => {
    if (!form.name || !form.age) return;
    const newU = { name:form.name, age:parseInt(form.age), bio:form.bio, interests:form.interests, location:form.location, photo:form.photo, ai_status:aiRes||'unknown', sparks:0, score:profileScore(form) };
    if (aiRes === 'approved') {
      await db.addUser({ ...newU, sub_expiry:null, online:false, views:0, joined:new Date().toISOString() });
      setAutoOk(true); toast('Photo verified — profile is live! ✓', 'success');
    } else {
      await db.addPending(newU); setAutoOk(false); toast('Application submitted for review', 'info');
    }
    setDone(true);
  };

  // ── Derived ─────────────────────────────────────────────
  const filtered     = users.filter(u => (tag==='All'||u.interests?.includes(tag)) && (!search||u.name.toLowerCase().includes(search.toLowerCase())||u.location?.toLowerCase().includes(search.toLowerCase())));
  const activeCount  = users.filter(u => subInfo(u.sub_expiry).active).length;
  const onlineCount  = users.filter(u => u.online).length;
  const totalSparks  = users.reduce((a,u) => a+(u.sparks||0), 0);
  const unread       = msgs.filter(m => !m.read).length;
  const notifs       = pending.length + unread;
  const tWords       = (settings.tagline||'Find your connection').split(' ');
  const tMain        = tWords.slice(0,-1).join(' ');
  const tLast        = tWords[tWords.length-1];
  const siteName     = settings.site_name || 'Velvet';

  // ── Render guards ────────────────────────────────────────
  if (!verified) return (
    <><style>{CSS}</style><AgeGate siteName={siteName} onAccept={() => { setAgeOk(); setVerified(true); }}/></>
  );

  if (loading) return (
    <div style={{background:'#080808',minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <style>{CSS}</style>
      <div style={{textAlign:'center'}}><div className="spn" style={{width:32,height:32,borderWidth:3}}/><div style={{fontFamily:"'Cormorant Garamond',serif",color:'#c9a96e',marginTop:'1.5rem',fontSize:'1.1rem',letterSpacing:3}}>Loading</div></div>
    </div>
  );

  if (dbError) return (
    <div style={{background:'#080808',minHeight:'100vh',padding:'2rem'}}><style>{CSS}</style>
      <div className="err">
        <strong>Database not configured.</strong><br/>
        Copy <code>.env.example</code> to <code>.env</code> and fill in your Supabase credentials, then restart the dev server.<br/><br/>
        See <strong>DEPLOY.md</strong> for full setup instructions.
      </div>
    </div>
  );

  return (
    <div style={{fontFamily:"'Jost',sans-serif",minHeight:'100vh',background:'#080808',color:'#f0e6d3',overflowX:'hidden'}}>
      <style>{CSS}</style>
      <Toasts list={toasts}/>
      <Confetti on={confetti}/>

      {/* NAV */}
      <nav className="nav">
        <div style={{display:'flex',alignItems:'center',gap:'1rem'}}>
          <span className="logo" onClick={goHome}>{siteName}</span>
          {saved && <span className="svd">✓ saved</span>}
        </div>
        <div style={{display:'flex',gap:'.6rem'}}>
          <button className="nb g" onClick={() => { setView('signup'); setDone(false); setForm({name:'',age:'',bio:'',interests:[],location:'',photo:null}); setAiRes(null); }}>Join</button>
          <button className="nb" onClick={() => { setView('admin'); setAdminIn(false); setPw(''); }}>
            Admin {notifs > 0 && <span className="nbadge">{notifs}</span>}
          </button>
        </div>
      </nav>

      {/* ─── LANDING ─── */}
      {view === 'landing' && (
        <div>
          <div className="hero">
            <div className="orb" style={{width:400,height:400,background:'#c9a96e',opacity:.04,top:-100,left:-80,animation:'glow 5s ease-in-out infinite,float 9s ease-in-out infinite'}}/>
            <div className="orb" style={{width:280,height:280,background:'#5e2e6b',opacity:.05,top:60,right:-50,animation:'glow 6s 1.5s ease-in-out infinite,float 11s 2s ease-in-out infinite'}}/>
            <div className="orb" style={{width:180,height:180,background:'#2e4f6b',opacity:.04,bottom:-40,left:'40%',animation:'glow 7s 0.5s ease-in-out infinite,float 13s 1s ease-in-out infinite'}}/>
            <p className="eyebrow">Private Network</p>
            <h1 className="ht">{tMain} <em>{tLast}</em></h1>
            <p className="hs">A curated space for consenting adults seeking intimacy, companionship, and genuine connection. Contact is by request only.</p>
            <div style={{display:'flex',gap:'2rem',justifyContent:'center',marginBottom:'2.5rem',animation:'fadeUp .5s .25s ease both'}}>
              {[[onlineCount,'online now'],[users.length,'profiles'],[totalSparks,'sparks sent']].map(([n,l]) => (
                <div key={l} style={{textAlign:'center'}}>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'1.6rem',color:'#c9a96e'}}>{n}</div>
                  <div style={{fontSize:'.58rem',letterSpacing:2,textTransform:'uppercase',color:'#2e2e2e',marginTop:'.1rem'}}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{maxWidth:1000,margin:'0 auto',padding:'0 1.5rem'}}>
            <div className="si">
              <span className="ico">🔍</span>
              <input placeholder="Search by name or location…" value={search} onChange={e=>setSearch(e.target.value)}/>
              {search && <button className="cx" onClick={() => setSearch('')}>✕</button>}
            </div>
            <div className="tags">{['All',...TAGS].map(t => <button key={t} className={tag===t?'tb on':'tb'} onClick={() => setTag(t)}>{t}</button>)}</div>
            {(search||tag!=='All') && <div style={{fontSize:'.68rem',color:'#2a2a2a',marginBottom:'1.25rem'}}>{filtered.length} profile{filtered.length!==1?'s':''} found</div>}

            {filtered.length === 0 ? <div className="es">No profiles match your search.</div>
              : <div className="grid">{filtered.map((u,i) => (
                  <div key={u.id} className="card" style={{animation:`fadeUp .4s ${i*.05}s ease both`}} onClick={() => openProfile(u)}>
                    {isNew(u.joined) && <span className="bnw">New</span>}
                    <div style={{display:'flex',alignItems:'center',gap:'.75rem',marginBottom:'.85rem'}}>
                      <Avatar name={u.name} photo={u.photo} size={50} online={u.online}/>
                      <div><div className="cn">{u.name}, {u.age}</div><div className="cl">📍 {u.location}</div></div>
                    </div>
                    <p className="cb">{u.bio?.slice(0,90)}{u.bio?.length>90?'…':''}</p>
                    <div style={{display:'flex',flexWrap:'wrap',gap:'.28rem',margin:'.7rem 0'}}>{u.interests?.map(t => <span key={t} className="mini">{t}</span>)}</div>
                    <div className="cf">
                      <button className={sparked.has(u.id)?'spkb on':'spkb'} onClick={e=>doSpark(e,u)}>
                        <span className="si2">{sparked.has(u.id)?'❤️':'🤍'}</span> {u.sparks||0}
                      </button>
                      <span className="vc">👁 {u.views||0}</span>
                    </div>
                  </div>
                ))}</div>
            }
            <div style={{height:'4rem'}}/>
          </div>
        </div>
      )}

      {/* ─── PROFILE ─── */}
      {view === 'profile' && sel && (() => {
        const cur = users.find(u => u.id === sel.id) || sel;
        const { active, label, pct } = subInfo(cur.sub_expiry);
        return (
          <div style={{maxWidth:620,margin:'0 auto',padding:'2rem 1.5rem',animation:'fadeUp .3s ease'}}>
            <button className="back" onClick={goHome}>← All profiles</button>
            <div style={{display:'flex',gap:'1.5rem',alignItems:'flex-start',marginTop:'1.75rem',flexWrap:'wrap'}}>
              <Avatar name={sel.name} photo={sel.photo} size={96} online={sel.online}/>
              <div style={{flex:1}}>
                <h2 className="pn">{sel.name}, {sel.age}</h2>
                {sel.online && <div className="onl"><span className="dot"/>Active now</div>}
                <div className="cl" style={{marginTop:sel.online?'':'.3rem',marginBottom:'.75rem'}}>📍 {sel.location}</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:'.32rem'}}>{sel.interests?.map(t => <span key={t} className="mini">{t}</span>)}</div>
              </div>
            </div>
            <div style={{display:'flex',gap:'1rem',marginTop:'1.2rem',alignItems:'center',flexWrap:'wrap'}}>
              <button className={sparked.has(sel.id)?'spkb on':'spkb'} onClick={e=>doSpark(e,sel)} style={{fontSize:'.78rem'}}>
                <span className="si2" style={{fontSize:'1.1rem'}}>{sparked.has(sel.id)?'❤️':'🤍'}</span> {cur.sparks||0} sparks
              </button>
              <span style={{fontSize:'.65rem',color:'#2a2a2a'}}>👁 {cur.views||0} views</span>
              {isNew(sel.joined) && <span style={{background:'#c9a96e',color:'#080808',fontSize:'.5rem',letterSpacing:2,textTransform:'uppercase',padding:'.12rem .45rem'}}>New</span>}
            </div>
            <div style={{marginTop:'1.75rem'}}><div className="slbl">About</div><p style={{lineHeight:1.85,color:'#b0a090',fontSize:'.88rem'}}>{sel.bio}</p></div>
            <div style={{marginTop:'1.5rem'}}><div className="slbl">Looking for</div><p style={{color:'#666',fontSize:'.82rem'}}>{sel.interests?.join(' · ')}</p></div>

            <div style={{background:'#0e0e0e',border:'1px solid #1e1e1e',padding:'1.5rem',marginTop:'2rem'}}>
              <div className="slbl" style={{marginBottom:'1rem'}}>Contact Access</div>
              {active ? (
                <div>
                  <div style={{color:'#4ade80',fontSize:'.82rem',display:'flex',alignItems:'center',gap:'.5rem',marginBottom:'.8rem'}}>✓ Subscription active — {label}</div>
                  <div className="sbar"><div style={{width:`${pct}%`}}/></div>
                </div>
              ) : (
                !showCt
                  ? <button className="rbtn" onClick={() => setShowCt(true)}>Request to Reveal</button>
                  : <div style={{animation:'slideIn .25s ease'}}>
                      <p style={{color:'#c9a96e',fontSize:'.68rem',letterSpacing:1.5,textTransform:'uppercase',marginBottom:'.9rem'}}>Reach out to arrange access</p>
                      <div className="cri"><span className="crl">WhatsApp</span><span>{settings.whatsapp}</span></div>
                      <div className="cri" style={{borderBottom:'none'}}><span className="crl">Telegram</span><span>{settings.telegram}</span></div>
                    </div>
              )}
            </div>

            <div style={{background:'#0e0e0e',border:'1px solid #1e1e1e',padding:'1.5rem',marginTop:'1.25rem'}}>
              <div className="slbl" style={{marginBottom:'1rem'}}>Send a Message Request</div>
              {mSent
                ? <div style={{color:'#4ade80',fontSize:'.82rem'}}>✓ Message sent — we'll be in touch soon</div>
                : <div className="mf">
                    <input className="mi" placeholder="Your name" value={mf.name} onChange={e=>setMf(d=>({...d,name:e.target.value}))}/>
                    <input className="mi" placeholder="Your WhatsApp or Telegram" value={mf.contact} onChange={e=>setMf(d=>({...d,contact:e.target.value}))}/>
                    <textarea className="mi" rows={3} placeholder={`Message about ${sel.name.split(' ')[0]}…`} value={mf.msg} onChange={e=>setMf(d=>({...d,msg:e.target.value}))} style={{resize:'vertical'}}/>
                    <button className="msb" onClick={sendMsg} disabled={!mf.name||!mf.msg}>Send Request</button>
                  </div>
              }
            </div>

            {users.filter(u=>u.id!==sel.id&&u.interests?.some(i=>sel.interests?.includes(i))).length>0&&(
              <div style={{marginTop:'1.75rem'}}>
                <div className="slbl" style={{marginBottom:'1rem'}}>Similar Profiles</div>
                <div style={{display:'flex',gap:'.75rem',flexWrap:'wrap'}}>
                  {users.filter(u=>u.id!==sel.id&&u.interests?.some(i=>sel.interests?.includes(i))).slice(0,3).map(u=>(
                    <div key={u.id} onClick={()=>openProfile(u)} style={{display:'flex',alignItems:'center',gap:'.6rem',background:'#0e0e0e',border:'1px solid #181818',padding:'.6rem .9rem',cursor:'pointer',flex:1,minWidth:130,transition:'border-color .2s'}} onMouseEnter={e=>e.currentTarget.style.borderColor='#2a2a2a'} onMouseLeave={e=>e.currentTarget.style.borderColor='#181818'}>
                      <Avatar name={u.name} photo={u.photo} size={32} online={u.online}/>
                      <div><div style={{fontSize:'.85rem',color:'#c8b89a',fontFamily:"'Cormorant Garamond',serif"}}>{u.name}</div><div style={{fontSize:'.6rem',color:'#2e2e2e'}}>{u.age} · {u.location?.split(',')[0]}</div></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div style={{height:'3rem'}}/>
          </div>
        );
      })()}

      {/* ─── SIGNUP ─── */}
      {view === 'signup' && (
        <div style={{maxWidth:500,margin:'0 auto',padding:'2.5rem 1.5rem',animation:'fadeUp .3s ease'}}>
          <button className="back" onClick={goHome}>← Back</button>
          {done ? (
            <div style={{textAlign:'center',marginTop:'4rem'}}>
              <div style={{fontSize:'2.8rem',marginBottom:'1.5rem'}}>{autoOk?'✨':'🌹'}</div>
              <h2 className="pn">{autoOk?'You\'re Live!':'Application Submitted'}</h2>
              <p style={{color:'#3a3a3a',lineHeight:1.9,fontSize:'.85rem',maxWidth:300,margin:'1rem auto 0'}}>
                {autoOk?'Your photo was verified — your profile is now live on the network.':'Your profile is under review. Once approved you\'ll appear in the network.'}
              </p>
              <div className="div"/>
              <button className="rbtn" onClick={goHome}>Browse Profiles</button>
            </div>
          ) : (
            <>
              <h2 className="pn" style={{marginTop:'1.75rem',marginBottom:'.4rem'}}>Create Profile</h2>
              <p style={{color:'#2e2e2e',fontSize:'.72rem',marginBottom:'2rem'}}>Upload a real photo for instant AI approval</p>
              <div style={{marginBottom:'1.75rem'}}>
                <div style={{display:'flex',alignItems:'center',gap:'1.25rem',marginBottom:'.75rem'}}>
                  <div style={{position:'relative'}}>
                    <Avatar name={form.name||'?'} photo={form.photo} size={72}/>
                    {form.photo&&<div style={{position:'absolute',inset:0,borderRadius:'50%',border:`2px solid ${aiRes==='approved'?'#4ade80':aiRes==='rejected'?'#e07070':'#c9a96e'}`}}/>}
                  </div>
                  <label className="ul">{form.photo?'Change Photo':'Upload Photo'}<input type="file" accept="image/*" style={{display:'none'}} onChange={onPhoto}/></label>
                </div>
                {checking   && <div className="ai-scan"><span className="spn"/>Analysing with AI…</div>}
                {!checking && aiRes==='approved' && <div className="ai-ok">✓ Real person detected — you'll be auto-approved</div>}
                {!checking && aiRes==='rejected' && <div className="ai-bad">⚠ Please upload a clear photo of your face or body</div>}
              </div>

              {[['Full Name','name','text'],['Age','age','number'],['Location','location','text']].map(([l,k,t])=>(
                <div key={k}><div className="fl">{l}</div><input className="fi" type={t} value={form[k]} onChange={e=>setForm(d=>({...d,[k]:e.target.value}))}/></div>
              ))}
              <div className="fl">About You</div>
              <textarea className="fi" rows={3} value={form.bio} onChange={e=>setForm(d=>({...d,bio:e.target.value}))} placeholder="Tell us a bit about yourself…" maxLength={200}/>
              <div className="cc">{form.bio.length}/200</div>
              <div style={{marginBottom:'2rem'}}>
                <div className="fl" style={{marginBottom:'.6rem'}}>I'm looking for</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:'.45rem'}}>{TAGS.map(t=><button key={t} className={form.interests.includes(t)?'tb on':'tb'} onClick={()=>toggleI(t)}>{t}</button>)}</div>
              </div>
              {form.name && (
                <div style={{background:'#0e0e0e',border:'1px solid #181818',padding:'1rem',marginBottom:'1.5rem'}}>
                  <div style={{fontSize:'.55rem',letterSpacing:2,textTransform:'uppercase',color:'#2a2a2a',marginBottom:'.75rem'}}>Preview</div>
                  <div style={{display:'flex',gap:'.75rem',alignItems:'center'}}>
                    <Avatar name={form.name} photo={form.photo} size={44}/>
                    <div><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'1.05rem',color:'#f0e6d3'}}>{form.name}{form.age?`, ${form.age}`:''}</div>{form.location&&<div style={{fontSize:'.62rem',color:'#2a2a2a'}}>📍 {form.location}</div>}</div>
                  </div>
                </div>
              )}
              <button className="rbtn" style={{width:'100%',opacity:(!form.name||!form.age||checking)?0.5:1}} onClick={submit} disabled={!form.name||!form.age||checking}>
                {checking?'Checking photo…':'Submit Application'}
              </button>
            </>
          )}
        </div>
      )}

      {/* ─── ADMIN ─── */}
      {view === 'admin' && (
        <div style={{maxWidth:820,margin:'0 auto',padding:'2.5rem 1.5rem',animation:'fadeUp .3s ease'}}>
          {!adminIn ? (
            <>
              <h2 className="pn">Admin Access</h2>
              <p style={{color:'#2e2e2e',fontSize:'.72rem',marginTop:'.4rem',marginBottom:'2rem'}}>Restricted — authorised users only</p>
              <div style={{maxWidth:320}}>
                <div className="fl">Password</div>
                <input className="fi" type="password" value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==='Enter'&&login()} placeholder="Enter password"/>
                <button className="rbtn" style={{marginTop:'.25rem'}} onClick={login}>Enter</button>
                {pwErr&&<div style={{color:'#e07070',fontSize:'.78rem',marginTop:'.75rem'}}>{pwErr}</div>}
              </div>
            </>
          ) : (
            <>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'2rem',flexWrap:'wrap',gap:'1rem'}}>
                <div><h2 className="pn">Admin Panel</h2><p style={{color:'#2e2e2e',fontSize:'.7rem',marginTop:'.3rem'}}>Live data · Supabase</p></div>
                <div style={{display:'flex',gap:'.5rem',flexWrap:'wrap'}}>
                  <button className="ebtn" onClick={exportCSV}>Export CSV</button>
                  <button className="back" onClick={()=>setAdminIn(false)}>Log Out</button>
                </div>
              </div>

              <div style={{display:'flex',gap:'1rem',marginBottom:'2rem',flexWrap:'wrap'}}>
                {[['Total',users.length,'profiles'],['Active',activeCount,'subscribers'],['Online',onlineCount,'now'],['Pending',pending.length,'reviews'],['Messages',msgs.length,'requests']].map(([l,v,s])=>(
                  <div key={l} className="sc"><div className="sn">{v}</div><div className="sl">{s}</div></div>
                ))}
              </div>

              <div style={{display:'flex',borderBottom:'1px solid #151515',marginBottom:'2rem',overflowX:'auto'}}>
                {[['approvals',`Approvals${pending.length?` (${pending.length})`:''}`],['subscribers','Subscribers'],['messages',`Messages${unread?` (${unread})`:''}`],['settings','Settings']].map(([k,l])=>(
                  <button key={k} className={tab===k?'at on':'at'} onClick={()=>setTab(k)}>{l}</button>
                ))}
              </div>

              {tab==='approvals' && (
                pending.length===0 ? <div className="es">No pending applications 🌹</div>
                : <div style={{display:'flex',flexDirection:'column',gap:'.9rem'}}>
                    <p style={{fontSize:'.68rem',color:'#2a2a2a',marginBottom:'.5rem'}}>Profiles with a real photo are auto-approved. These need your review.</p>
                    {pending.map((u,i)=>(
                      <div key={u.id} className="ac" style={{animationDelay:`${i*.07}s`}}>
                        <div style={{display:'flex',gap:'1rem',flexWrap:'wrap'}}>
                          <Avatar name={u.name} photo={u.photo} size={58}/>
                          <div style={{flex:1,minWidth:160}}>
                            <div style={{display:'flex',gap:'.5rem',alignItems:'center',flexWrap:'wrap',marginBottom:'.3rem'}}>
                              <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'1.2rem',color:'#f0e6d3'}}>{u.name}, {u.age}</span>
                              {u.ai_status==='approved'&&<span className="aibadge-ok">✓ AI verified</span>}
                              {u.ai_status==='rejected'&&<span className="aibadge-bad">⚠ AI flagged</span>}
                              {u.ai_status==='unknown'&&<span className="aibadge-unk">No photo</span>}
                            </div>
                            <div style={{color:'#2e2e2e',fontSize:'.68rem',marginBottom:'.5rem'}}>📍 {u.location}</div>
                            <p style={{color:'#555',fontSize:'.8rem',lineHeight:1.65}}>{u.bio}</p>
                            <div style={{display:'flex',flexWrap:'wrap',gap:'.28rem',marginTop:'.6rem'}}>{u.interests?.map(t=><span key={t} className="mini">{t}</span>)}</div>
                            {u.sparks>0&&<div style={{marginTop:'.5rem'}}><span className="spkp">❤️ {u.sparks} pre-spark{u.sparks!==1?'s':''}</span></div>}
                          </div>
                          <div style={{textAlign:'center',minWidth:76}}>
                            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'1.75rem',color:u.score>=70?'#4ade80':u.score>=40?'#fbbf24':'#e07070'}}>{u.score}%</div>
                            <div style={{fontSize:'.55rem',letterSpacing:1,textTransform:'uppercase',color:'#2a2a2a'}}>Score</div>
                            <div style={{fontSize:'.6rem',marginTop:'.3rem',color:u.score>=70?'#4ade80':u.score>=40?'#fbbf24':'#e07070'}}>{u.score>=70?'✓ Approve':u.score>=40?'⚠ Review':'✕ Weak'}</div>
                          </div>
                        </div>
                        <div style={{display:'flex',gap:'.75rem',marginTop:'1.2rem'}}>
                          <button className="apb" onClick={()=>approve(u.id)}>✓ Approve</button>
                          <button className="rjb" onClick={()=>reject(u.id)}>✕ Reject</button>
                        </div>
                      </div>
                    ))}
                  </div>
              )}

              {tab==='subscribers' && (
                <div style={{display:'flex',flexDirection:'column',gap:'.75rem'}}>
                  {users.length===0&&<div className="es">No profiles yet.</div>}
                  {users.map(u=>{ const {active,label,pct}=subInfo(u.sub_expiry); return(
                    <div key={u.id} className="sr">
                      <Avatar name={u.name} photo={u.photo} size={44} online={u.online}/>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:'flex',alignItems:'baseline',gap:'.45rem',flexWrap:'wrap'}}>
                          <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'1.05rem'}}>{u.name}, {u.age}</span>
                          {isNew(u.joined)&&<span style={{background:'#c9a96e',color:'#080808',fontSize:'.48rem',letterSpacing:1.5,textTransform:'uppercase',padding:'.1rem .4rem'}}>new</span>}
                          {u.ai_status==='approved'&&<span className="aibadge-ok">verified</span>}
                        </div>
                        <div style={{fontSize:'.62rem',color:active?'#4ade80':'#252525',marginTop:'.15rem'}}>{active?label:`👁 ${u.views||0} views · ❤️ ${u.sparks||0} sparks`}</div>
                        {active&&<div className="sbar" style={{maxWidth:160,marginTop:'.5rem'}}><div style={{width:`${pct}%`}}/></div>}
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:'.6rem',flexShrink:0}}>
                        <span className={active?'bon':'boff'}>{active?'Active':'Locked'}</span>
                        <label className="tog"><input type="checkbox" checked={active} onChange={()=>toggleSub(u.id)}/><span className="sldr"/></label>
                      </div>
                    </div>
                  );})}
                </div>
              )}

              {tab==='messages' && (
                msgs.length===0 ? <div className="es">No message requests yet 💬</div>
                : <div style={{display:'flex',flexDirection:'column',gap:'.75rem'}}>
                    {msgs.map((m,i)=>(
                      <div key={m.id} className={m.read?'mc':'mc unr'} style={{animationDelay:`${i*.06}s`}} onClick={()=>db.markRead(m.id).then(()=>setMsgs(p=>p.map(x=>x.id===m.id?{...x,read:true}:x)))}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                          <div style={{flex:1}}>
                            <div style={{display:'flex',alignItems:'center',gap:'.6rem',flexWrap:'wrap',marginBottom:'.5rem'}}>
                              <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'1.05rem',color:'#f0e6d3'}}>{m.from_name}</span>
                              {!m.read&&<span style={{background:'#c9a96e',color:'#080808',fontSize:'.48rem',letterSpacing:1.5,textTransform:'uppercase',padding:'.1rem .4rem'}}>new</span>}
                              <span style={{fontSize:'.65rem',color:'#2a2a2a'}}>re: {m.profile_name}</span>
                            </div>
                            {m.contact&&<div style={{fontSize:'.72rem',color:'#555',marginBottom:'.4rem'}}>📱 {m.contact}</div>}
                            <p style={{fontSize:'.82rem',color:'#888',lineHeight:1.65}}>{m.body}</p>
                            <div style={{fontSize:'.62rem',color:'#2a2a2a',marginTop:'.5rem'}}>{fmt(m.date)}</div>
                          </div>
                          <button className="delbtn" onClick={e=>{e.stopPropagation();db.deleteMessage(m.id).then(()=>setMsgs(p=>p.filter(x=>x.id!==m.id)));}}> ✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
              )}

              {tab==='settings' && (
                <div style={{maxWidth:460}}>
                  <p style={{fontSize:'.72rem',color:'#2a2a2a',marginBottom:'2rem'}}>Changes apply immediately after saving.</p>
                  {[['Site Name','site_name'],['Tagline','tagline'],['WhatsApp Number','whatsapp'],['Telegram Handle','telegram']].map(([l,k])=>(
                    <div key={k}><div className="fl">{l}</div><input className="fi" value={draft[k]||''} onChange={e=>setDraft(d=>({...d,[k]:e.target.value}))}/></div>
                  ))}
                  <button className="svbtn" onClick={saveSettings}>Save Settings</button>
                  <div className="div"/>
                  <div className="fl">Admin Password</div>
                  <p style={{fontSize:'.75rem',color:'#333',lineHeight:1.7}}>Set <code style={{color:'#c9a96e'}}>VITE_ADMIN_PASSWORD</code> in your Vercel environment variables.</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
