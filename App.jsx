import { useState } from "react";

const ADMIN_PW = "admin123";
const CONTACT = { whatsapp: "+263 77 123 4567", telegram: "@velvetadmin" };
const TAGS = ["Intimacy","Companionship","Casual","Deep Connection","Adventure","Discreet"];
const COLORS = ["#7a4f2e","#2e6b5e","#5e2e6b","#6b5e2e","#2e4f6b","#6b2e4f"];
const gc = n => COLORS[n.charCodeAt(0) % COLORS.length];
const ini = n => n.split(" ").map(w => w[0]).join("").toUpperCase().slice(0,2);

const SEED = [
  { id:1, name:"Rudo K.", age:24, bio:"Free spirit. I value genuine connections and good energy.", interests:["Intimacy","Companionship"], location:"Harare, Borrowdale", photo:null, sub:false },
  { id:2, name:"Chipo M.", age:27, bio:"Adventurous and open-minded. Here for real experiences.", interests:["Casual","Adventure"], location:"Harare, Avondale", photo:null, sub:false },
  { id:3, name:"Tafara L.", age:30, bio:"Grounded and real. Trust and chemistry are everything.", interests:["Deep Connection","Intimacy"], location:"Bulawayo", photo:null, sub:true },
  { id:4, name:"Nyasha B.", age:25, bio:"Elegant and witty. I appreciate people who know what they want.", interests:["Companionship","Discreet"], location:"Harare, Highlands", photo:null, sub:false },
];

function Avatar({ name, size=52 }) {
  return (
    <div style={{width:size,height:size,borderRadius:"50%",background:gc(name),display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.3,color:"#f0e6d3",fontFamily:"Georgia,serif",flexShrink:0}}>
      {ini(name)}
    </div>
  );
}

export default function App() {
  const [view, setView] = useState("landing");
  const [sel, setSel] = useState(null);
  const [users, setUsers] = useState(SEED);
  const [pending, setPending] = useState([]);
  const [adminIn, setAdminIn] = useState(false);
  const [pw, setPw] = useState("");
  const [pwErr, setPwErr] = useState("");
  const [tag, setTag] = useState("All");
  const [showCt, setShowCt] = useState(false);
  const [form, setForm] = useState({name:"",age:"",bio:"",location:"",interests:[],photo:null});
  const [done, setDone] = useState(false);
  const [adminTab, setAdminTab] = useState("approvals");
  const [msgForm, setMsgForm] = useState({name:"",contact:"",msg:""});
  const [msgSent, setMsgSent] = useState(false);

  const goHome = () => { setView("landing"); setSel(null); setShowCt(false); setMsgSent(false); };

  const openProfile = u => { setSel(u); setView("profile"); setShowCt(false); setMsgSent(false); setMsgForm({name:"",contact:"",msg:""}); };

  const login = () => {
    if (pw === ADMIN_PW) { setAdminIn(true); setPwErr(""); }
    else setPwErr("Wrong password.");
  };

  const approve = id => {
    const u = pending.find(p => p.id === id);
    if (u) { setUsers(p => [...p, {...u, sub:false}]); setPending(p => p.filter(x => x.id !== id)); }
  };

  const reject = id => setPending(p => p.filter(x => x.id !== id));

  const toggleSub = id => setUsers(p => p.map(u => u.id === id ? {...u, sub:!u.sub} : u));

  const onPhoto = e => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = ev => setForm(d => ({...d, photo:ev.target.result}));
    r.readAsDataURL(f);
  };

  const toggleI = t => setForm(d => ({...d, interests: d.interests.includes(t) ? d.interests.filter(x=>x!==t) : [...d.interests,t]}));

  const submit = () => {
    if (!form.name || !form.age) return;
    setPending(p => [...p, {id:Date.now(), ...form, age:parseInt(form.age), sub:false}]);
    setDone(true);
  };

  const filtered = users.filter(u => tag === "All" || u.interests?.includes(tag));

  return (
    <div style={{fontFamily:"'Helvetica Neue',Arial,sans-serif",minHeight:"100vh",background:"#080808",color:"#f0e6d3"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,400&family=Jost:wght@300;400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        .nav{display:flex;justify-content:space-between;align-items:center;padding:1rem 1.5rem;background:#0d0d0d;border-bottom:1px solid #1a1a1a;position:sticky;top:0;z-index:100;}
        .logo{font-family:'Cormorant Garamond',serif;font-size:1.4rem;letter-spacing:5px;color:#c9a96e;text-transform:uppercase;cursor:pointer;}
        .btn{background:none;border:1px solid #2a2a2a;color:#777;padding:.35rem .9rem;font-family:'Jost',sans-serif;font-size:.68rem;letter-spacing:2px;text-transform:uppercase;cursor:pointer;}
        .btn:hover{border-color:#c9a96e;color:#c9a96e;}
        .btn.gold{background:linear-gradient(135deg,#c9a96e,#a07840);color:#080808;border-color:transparent;font-weight:500;}
        .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:1.2rem;}
        .card{background:#0e0e0e;border:1px solid #181818;padding:1.4rem;cursor:pointer;transition:all .3s;}
        .card:hover{border-color:#c9a96e33;transform:translateY(-3px);}
        .tag{background:none;border:1px solid #1e1e1e;color:#555;padding:.25rem .75rem;font-family:'Jost',sans-serif;font-size:.65rem;letter-spacing:1.5px;text-transform:uppercase;cursor:pointer;}
        .tag.on{border-color:#c9a96e;color:#c9a96e;background:#c9a96e0d;}
        .mini{background:#111;color:#666;font-size:.58rem;letter-spacing:1px;text-transform:uppercase;padding:.15rem .4rem;border:1px solid #1a1a1a;}
        .rbtn{background:linear-gradient(135deg,#c9a96e,#a07840);color:#080808;border:none;padding:.8rem 2rem;font-family:'Jost',sans-serif;font-size:.75rem;letter-spacing:3px;text-transform:uppercase;cursor:pointer;font-weight:500;}
        .fi{width:100%;background:#0c0c0c;border:1px solid #1e1e1e;color:#f0e6d3;padding:.65rem .85rem;font-family:'Jost',sans-serif;font-size:.88rem;outline:none;margin-bottom:.9rem;}
        .fl{font-size:.6rem;letter-spacing:2px;text-transform:uppercase;color:#3a3a3a;margin-bottom:.4rem;}
        .at{background:none;border:none;border-bottom:2px solid transparent;color:#444;padding:.5rem 1rem;font-family:'Jost',sans-serif;font-size:.68rem;letter-spacing:2px;text-transform:uppercase;cursor:pointer;}
        .at.on{color:#c9a96e;border-bottom-color:#c9a96e;}
        .sr{display:flex;align-items:center;background:#0e0e0e;border:1px solid #181818;padding:1rem;gap:.9rem;margin-bottom:.75rem;}
        .tog{position:relative;display:inline-block;width:42px;height:23px;flex-shrink:0;}
        .tog input{opacity:0;width:0;height:0;}
        .sldr{position:absolute;cursor:pointer;inset:0;background:#111;border-radius:23px;border:1px solid #1e1e1e;transition:.3s;}
        .sldr::before{content:'';position:absolute;width:17px;height:17px;left:2px;bottom:2px;background:#2a2a2a;border-radius:50%;transition:.3s;}
        input:checked+.sldr{background:#4ade800d;border-color:#4ade80;}
        input:checked+.sldr::before{transform:translateX(19px);background:#4ade80;}
        .ac{background:#0e0e0e;border:1px solid #181818;padding:1.4rem;margin-bottom:.9rem;}
        .apb{background:#c9a96e0d;border:1px solid #c9a96e;color:#c9a96e;padding:.4rem 1rem;font-family:'Jost',sans-serif;font-size:.67rem;letter-spacing:2px;text-transform:uppercase;cursor:pointer;}
        .rjb{background:none;border:1px solid #1e1e1e;color:#444;padding:.4rem 1rem;font-family:'Jost',sans-serif;font-size:.67rem;letter-spacing:2px;text-transform:uppercase;cursor:pointer;}
        .rjb:hover{border-color:#e07070;color:#e07070;}
        .back{background:none;border:none;color:#555;font-family:'Jost',sans-serif;font-size:.68rem;letter-spacing:2px;text-transform:uppercase;cursor:pointer;padding:0;}
        .back:hover{color:#c9a96e;}
        .mi{background:#0c0c0c;border:1px solid #1e1e1e;color:#f0e6d3;padding:.65rem .85rem;font-family:'Jost',sans-serif;font-size:.85rem;outline:none;width:100%;margin-bottom:.75rem;}
        .msb{background:none;border:1px solid #c9a96e;color:#c9a96e;padding:.55rem 1.3rem;font-family:'Jost',sans-serif;font-size:.68rem;letter-spacing:2px;text-transform:uppercase;cursor:pointer;}
        @media(max-width:500px){.grid{grid-template-columns:1fr 1fr;}}
      `}</style>

      {/* NAV */}
      <nav className="nav">
        <span className="logo" onClick={goHome}>Velvet</span>
        <div style={{display:"flex",gap:".6rem"}}>
          <button className="btn gold" onClick={()=>{setView("signup");setDone(false);setForm({name:"",age:"",bio:"",location:"",interests:[],photo:null});}}>Join</button>
          <button className="btn" onClick={()=>{setView("admin");setAdminIn(false);setPw("");}}>Admin</button>
        </div>
      </nav>

      {/* LANDING */}
      {view==="landing" && (
        <div style={{maxWidth:1000,margin:"0 auto",padding:"3rem 1.5rem"}}>
          <div style={{textAlign:"center",marginBottom:"3rem"}}>
            <p style={{fontSize:".62rem",letterSpacing:4,textTransform:"uppercase",color:"#c9a96e",marginBottom:"1rem"}}>Private Network</p>
            <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(2.2rem,5vw,3.8rem)",fontWeight:300,color:"#f0e6d3",marginBottom:"1rem"}}>Find your <em style={{fontStyle:"italic",color:"#c9a96e"}}>connection</em></h1>
            <p style={{color:"#555",fontSize:".85rem",maxWidth:380,margin:"0 auto",lineHeight:1.9}}>A private space for consenting adults. Contact is by request only.</p>
          </div>
          <div style={{display:"flex",gap:".45rem",flexWrap:"wrap",justifyContent:"center",marginBottom:"2.5rem"}}>
            {["All",...TAGS].map(t=><button key={t} className={tag===t?"tag on":"tag"} onClick={()=>setTag(t)}>{t}</button>)}
          </div>
          <div className="grid">
            {filtered.map(u=>(
              <div key={u.id} className="card" onClick={()=>openProfile(u)}>
                <div style={{display:"flex",alignItems:"center",gap:".75rem",marginBottom:".85rem"}}>
                  {u.photo ? <img src={u.photo} style={{width:50,height:50,borderRadius:"50%",objectFit:"cover",flexShrink:0}} alt=""/> : <Avatar name={u.name} size={50}/>}
                  <div>
                    <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.1rem",color:"#f0e6d3"}}>{u.name}, {u.age}</div>
                    <div style={{fontSize:".68rem",color:"#3a3a3a"}}>📍 {u.location}</div>
                  </div>
                </div>
                <p style={{fontSize:".78rem",color:"#666",lineHeight:1.7,marginBottom:".75rem"}}>{u.bio.slice(0,80)}{u.bio.length>80?"…":""}</p>
                <div style={{display:"flex",flexWrap:"wrap",gap:".28rem"}}>{u.interests?.map(t=><span key={t} className="mini">{t}</span>)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PROFILE */}
      {view==="profile" && sel && (
        <div style={{maxWidth:600,margin:"0 auto",padding:"2rem 1.5rem"}}>
          <button className="back" onClick={goHome}>← Back</button>
          <div style={{display:"flex",gap:"1.5rem",alignItems:"flex-start",marginTop:"1.75rem",flexWrap:"wrap"}}>
            {sel.photo ? <img src={sel.photo} style={{width:90,height:90,borderRadius:"50%",objectFit:"cover",flexShrink:0}} alt=""/> : <Avatar name={sel.name} size={90}/>}
            <div style={{flex:1}}>
              <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.8rem",fontWeight:300,color:"#f0e6d3"}}>{sel.name}, {sel.age}</h2>
              <div style={{fontSize:".68rem",color:"#3a3a3a",margin:".3rem 0 .75rem"}}>📍 {sel.location}</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:".32rem"}}>{sel.interests?.map(t=><span key={t} className="mini">{t}</span>)}</div>
            </div>
          </div>
          <div style={{marginTop:"1.75rem"}}>
            <div style={{fontSize:".58rem",letterSpacing:3,textTransform:"uppercase",color:"#333",marginBottom:".55rem"}}>About</div>
            <p style={{lineHeight:1.85,color:"#b0a090",fontSize:".88rem"}}>{sel.bio}</p>
          </div>
          <div style={{background:"#0e0e0e",border:"1px solid #1e1e1e",padding:"1.5rem",marginTop:"2rem"}}>
            <div style={{fontSize:".58rem",letterSpacing:3,textTransform:"uppercase",color:"#333",marginBottom:"1rem"}}>Contact Access</div>
            {sel.sub ? (
              <div style={{color:"#4ade80",fontSize:".82rem"}}>✓ Subscription active</div>
            ) : (
              !showCt
                ? <button className="rbtn" onClick={()=>setShowCt(true)}>Request to Reveal</button>
                : <div>
                    <p style={{color:"#c9a96e",fontSize:".68rem",letterSpacing:1.5,textTransform:"uppercase",marginBottom:".9rem"}}>Reach out to arrange access</p>
                    <div style={{display:"flex",justifyContent:"space-between",padding:".65rem 0",borderBottom:"1px solid #141414",fontSize:".85rem",color:"#c8b89a"}}><span style={{color:"#3a3a3a",fontSize:".62rem",letterSpacing:1.5,textTransform:"uppercase"}}>WhatsApp</span><span>{CONTACT.whatsapp}</span></div>
                    <div style={{display:"flex",justifyContent:"space-between",padding:".65rem 0",fontSize:".85rem",color:"#c8b89a"}}><span style={{color:"#3a3a3a",fontSize:".62rem",letterSpacing:1.5,textTransform:"uppercase"}}>Telegram</span><span>{CONTACT.telegram}</span></div>
                  </div>
            )}
          </div>
          <div style={{background:"#0e0e0e",border:"1px solid #1e1e1e",padding:"1.5rem",marginTop:"1.25rem"}}>
            <div style={{fontSize:".58rem",letterSpacing:3,textTransform:"uppercase",color:"#333",marginBottom:"1rem"}}>Send a Message Request</div>
            {msgSent
              ? <div style={{color:"#4ade80",fontSize:".82rem"}}>✓ Message sent</div>
              : <>
                  <input className="mi" placeholder="Your name" value={msgForm.name} onChange={e=>setMsgForm(d=>({...d,name:e.target.value}))}/>
                  <input className="mi" placeholder="Your WhatsApp or Telegram" value={msgForm.contact} onChange={e=>setMsgForm(d=>({...d,contact:e.target.value}))}/>
                  <textarea className="mi" rows={3} placeholder="Your message…" value={msgForm.msg} onChange={e=>setMsgForm(d=>({...d,msg:e.target.value}))} style={{resize:"vertical"}}/>
                  <button className="msb" onClick={()=>{if(msgForm.name&&msgForm.msg)setMsgSent(true);}}>Send Request</button>
                </>
            }
          </div>
          <div style={{height:"3rem"}}/>
        </div>
      )}

      {/* SIGNUP */}
      {view==="signup" && (
        <div style={{maxWidth:480,margin:"0 auto",padding:"2.5rem 1.5rem"}}>
          <button className="back" onClick={goHome}>← Back</button>
          {done
            ? <div style={{textAlign:"center",marginTop:"4rem"}}>
                <div style={{fontSize:"2.8rem",marginBottom:"1.5rem"}}>🌹</div>
                <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.8rem",fontWeight:300,color:"#f0e6d3"}}>Application Submitted</h2>
                <p style={{color:"#3a3a3a",marginTop:"1rem",lineHeight:1.9,fontSize:".85rem"}}>Your profile is under review. Once approved you'll appear in the network.</p>
                <button className="rbtn" style={{marginTop:"2rem"}} onClick={goHome}>Browse Profiles</button>
              </div>
            : <>
                <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.8rem",fontWeight:300,color:"#f0e6d3",marginTop:"1.75rem",marginBottom:"2rem"}}>Create Profile</h2>
                <div style={{display:"flex",alignItems:"center",gap:"1rem",marginBottom:"1.75rem"}}>
                  {form.photo
                    ? <img src={form.photo} style={{width:70,height:70,borderRadius:"50%",objectFit:"cover"}} alt=""/>
                    : <Avatar name={form.name||"?"} size={70}/>
                  }
                  <label style={{display:"inline-block",border:"1px dashed #2a2a2a",color:"#666",padding:".5rem 1rem",fontSize:".68rem",letterSpacing:2,textTransform:"uppercase",cursor:"pointer"}}>
                    Upload Photo<input type="file" accept="image/*" style={{display:"none"}} onChange={onPhoto}/>
                  </label>
                </div>
                {[["Full Name","name","text"],["Age","age","number"],["Location","location","text"]].map(([l,k,t])=>(
                  <div key={k}><div className="fl">{l}</div><input className="fi" type={t} value={form[k]} onChange={e=>setForm(d=>({...d,[k]:e.target.value}))}/></div>
                ))}
                <div className="fl">About You</div>
                <textarea className="fi" rows={3} value={form.bio} onChange={e=>setForm(d=>({...d,bio:e.target.value}))} placeholder="Tell us about yourself…" style={{resize:"vertical"}}/>
                <div style={{marginBottom:"2rem"}}>
                  <div className="fl" style={{marginBottom:".6rem"}}>I'm looking for</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:".45rem"}}>{TAGS.map(t=><button key={t} className={form.interests.includes(t)?"tag on":"tag"} onClick={()=>toggleI(t)}>{t}</button>)}</div>
                </div>
                <button className="rbtn" style={{width:"100%",opacity:(!form.name||!form.age)?0.5:1}} onClick={submit} disabled={!form.name||!form.age}>Submit Application</button>
              </>
          }
        </div>
      )}

      {/* ADMIN */}
      {view==="admin" && (
        <div style={{maxWidth:800,margin:"0 auto",padding:"2.5rem 1.5rem"}}>
          {!adminIn
            ? <>
                <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.8rem",fontWeight:300,color:"#f0e6d3",marginBottom:"2rem"}}>Admin Access</h2>
                <div style={{maxWidth:320}}>
                  <div className="fl">Password</div>
                  <input className="fi" type="password" value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login()} placeholder="Enter password"/>
                  <button className="rbtn" onClick={login}>Enter</button>
                  {pwErr&&<div style={{color:"#e07070",fontSize:".78rem",marginTop:".75rem"}}>{pwErr}</div>}
                  <div style={{color:"#1a1a1a",fontSize:".6rem",marginTop:"1rem"}}>Default: admin123</div>
                </div>
              </>
            : <>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"2rem"}}>
                  <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.8rem",fontWeight:300,color:"#f0e6d3"}}>Admin Panel</h2>
                  <button className="back" onClick={()=>setAdminIn(false)}>Log Out</button>
                </div>
                <div style={{display:"flex",gap:"1rem",marginBottom:"2rem",flexWrap:"wrap"}}>
                  {[["Profiles",users.length],["Active",users.filter(u=>u.sub).length],["Pending",pending.length]].map(([l,v])=>(
                    <div key={l} style={{background:"#0e0e0e",border:"1px solid #181818",padding:"1rem 1.3rem",flex:1,minWidth:80}}>
                      <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.9rem",color:"#c9a96e"}}>{v}</div>
                      <div style={{fontSize:".56rem",letterSpacing:2,textTransform:"uppercase",color:"#2e2e2e",marginTop:".25rem"}}>{l}</div>
                    </div>
                  ))}
                </div>
                <div style={{display:"flex",borderBottom:"1px solid #151515",marginBottom:"2rem"}}>
                  <button className={adminTab==="approvals"?"at on":"at"} onClick={()=>setAdminTab("approvals")}>Approvals {pending.length>0&&`(${pending.length})`}</button>
                  <button className={adminTab==="subscribers"?"at on":"at"} onClick={()=>setAdminTab("subscribers")}>Subscribers</button>
                </div>
                {adminTab==="approvals" && (
                  pending.length===0
                    ? <div style={{textAlign:"center",padding:"3rem",color:"#222",fontFamily:"'Cormorant Garamond',serif",fontStyle:"italic"}}>No pending applications</div>
                    : pending.map(u=>(
                        <div key={u.id} className="ac">
                          <div style={{display:"flex",gap:"1rem",flexWrap:"wrap"}}>
                            {u.photo ? <img src={u.photo} style={{width:56,height:56,borderRadius:"50%",objectFit:"cover",flexShrink:0}} alt=""/> : <Avatar name={u.name} size={56}/>}
                            <div style={{flex:1}}>
                              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.2rem",color:"#f0e6d3"}}>{u.name}, {u.age}</div>
                              <div style={{color:"#2e2e2e",fontSize:".68rem",margin:".2rem 0 .5rem"}}>📍 {u.location}</div>
                              <p style={{color:"#555",fontSize:".8rem",lineHeight:1.65}}>{u.bio}</p>
                              <div style={{display:"flex",flexWrap:"wrap",gap:".28rem",marginTop:".6rem"}}>{u.interests?.map(t=><span key={t} className="mini">{t}</span>)}</div>
                            </div>
                          </div>
                          <div style={{display:"flex",gap:".75rem",marginTop:"1.2rem"}}>
                            <button className="apb" onClick={()=>approve(u.id)}>✓ Approve</button>
                            <button className="rjb" onClick={()=>reject(u.id)}>✕ Reject</button>
                          </div>
                        </div>
                      ))
                )}
                {adminTab==="subscribers" && (
                  users.map(u=>(
                    <div key={u.id} className="sr">
                      {u.photo ? <img src={u.photo} style={{width:44,height:44,borderRadius:"50%",objectFit:"cover",flexShrink:0}} alt=""/> : <Avatar name={u.name} size={44}/>}
                      <div style={{flex:1}}>
                        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.05rem"}}>{u.name}, {u.age}</div>
                        <div style={{fontSize:".62rem",color:u.sub?"#4ade80":"#252525"}}>{u.sub?"Active":"Locked"}</div>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:".6rem",flexShrink:0}}>
                        <span style={{fontSize:".6rem",letterSpacing:1.5,textTransform:"uppercase",color:u.sub?"#4ade80":"#333",background:u.sub?"#4ade800d":"#111",border:`1px solid ${u.sub?"#4ade8020":"#1a1a1a"}`,padding:".16rem .5rem"}}>{u.sub?"Active":"Locked"}</span>
                        <label className="tog"><input type="checkbox" checked={u.sub} onChange={()=>toggleSub(u.id)}/><span className="sldr"/></label>
                      </div>
                    </div>
                  ))
                )}
              </>
          }
        </div>
      )}
    </div>
  );
}
import { useState } from "react";

const ADMIN_PW = "admin123";
const CONTACT = { whatsapp: "+263 77 123 4567", telegram: "@velvetadmin" };
const TAGS = ["Intimacy","Companionship","Casual","Deep Connection","Adventure","Discreet"];
const COLORS = ["#7a4f2e","#2e6b5e","#5e2e6b","#6b5e2e","#2e4f6b","#6b2e4f"];
const gc = n => COLORS[n.charCodeAt(0) % COLORS.length];
const ini = n => n.split(" ").map(w => w[0]).join("").toUpperCase().slice(0,2);

const SEED = [
  { id:1, name:"Rudo K.", age:24, bio:"Free spirit. I value genuine connections and good energy.", interests:["Intimacy","Companionship"], location:"Harare, Borrowdale", photo:null, sub:false },
  { id:2, name:"Chipo M.", age:27, bio:"Adventurous and open-minded. Here for real experiences.", interests:["Casual","Adventure"], location:"Harare, Avondale", photo:null, sub:false },
  { id:3, name:"Tafara L.", age:30, bio:"Grounded and real. Trust and chemistry are everything.", interests:["Deep Connection","Intimacy"], location:"Bulawayo", photo:null, sub:true },
  { id:4, name:"Nyasha B.", age:25, bio:"Elegant and witty. I appreciate people who know what they want.", interests:["Companionship","Discreet"], location:"Harare, Highlands", photo:null, sub:false },
];

function Avatar({ name, size=52 }) {
  return (
    <div style={{width:size,height:size,borderRadius:"50%",background:gc(name),display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.3,color:"#f0e6d3",fontFamily:"Georgia,serif",flexShrink:0}}>
      {ini(name)}
    </div>
  );
}

export default function App() {
  const [view, setView] = useState("landing");
  const [sel, setSel] = useState(null);
  const [users, setUsers] = useState(SEED);
  const [pending, setPending] = useState([]);
  const [adminIn, setAdminIn] = useState(false);
  const [pw, setPw] = useState("");
  const [pwErr, setPwErr] = useState("");
  const [tag, setTag] = useState("All");
  const [showCt, setShowCt] = useState(false);
  const [form, setForm] = useState({name:"",age:"",bio:"",location:"",interests:[],photo:null});
  const [done, setDone] = useState(false);
  const [adminTab, setAdminTab] = useState("approvals");
  const [msgForm, setMsgForm] = useState({name:"",contact:"",msg:""});
  const [msgSent, setMsgSent] = useState(false);

  const goHome = () => { setView("landing"); setSel(null); setShowCt(false); setMsgSent(false); };

  const openProfile = u => { setSel(u); setView("profile"); setShowCt(false); setMsgSent(false); setMsgForm({name:"",contact:"",msg:""}); };

  const login = () => {
    if (pw === ADMIN_PW) { setAdminIn(true); setPwErr(""); }
    else setPwErr("Wrong password.");
  };

  const approve = id => {
    const u = pending.find(p => p.id === id);
    if (u) { setUsers(p => [...p, {...u, sub:false}]); setPending(p => p.filter(x => x.id !== id)); }
  };

  const reject = id => setPending(p => p.filter(x => x.id !== id));

  const toggleSub = id => setUsers(p => p.map(u => u.id === id ? {...u, sub:!u.sub} : u));

  const onPhoto = e => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = ev => setForm(d => ({...d, photo:ev.target.result}));
    r.readAsDataURL(f);
  };

  const toggleI = t => setForm(d => ({...d, interests: d.interests.includes(t) ? d.interests.filter(x=>x!==t) : [...d.interests,t]}));

  const submit = () => {
    if (!form.name || !form.age) return;
    setPending(p => [...p, {id:Date.now(), ...form, age:parseInt(form.age), sub:false}]);
    setDone(true);
  };

  const filtered = users.filter(u => tag === "All" || u.interests?.includes(tag));

  return (
    <div style={{fontFamily:"'Helvetica Neue',Arial,sans-serif",minHeight:"100vh",background:"#080808",color:"#f0e6d3"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,400&family=Jost:wght@300;400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        .nav{display:flex;justify-content:space-between;align-items:center;padding:1rem 1.5rem;background:#0d0d0d;border-bottom:1px solid #1a1a1a;position:sticky;top:0;z-index:100;}
        .logo{font-family:'Cormorant Garamond',serif;font-size:1.4rem;letter-spacing:5px;color:#c9a96e;text-transform:uppercase;cursor:pointer;}
        .btn{background:none;border:1px solid #2a2a2a;color:#777;padding:.35rem .9rem;font-family:'Jost',sans-serif;font-size:.68rem;letter-spacing:2px;text-transform:uppercase;cursor:pointer;}
        .btn:hover{border-color:#c9a96e;color:#c9a96e;}
        .btn.gold{background:linear-gradient(135deg,#c9a96e,#a07840);color:#080808;border-color:transparent;font-weight:500;}
        .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:1.2rem;}
        .card{background:#0e0e0e;border:1px solid #181818;padding:1.4rem;cursor:pointer;transition:all .3s;}
        .card:hover{border-color:#c9a96e33;transform:translateY(-3px);}
        .tag{background:none;border:1px solid #1e1e1e;color:#555;padding:.25rem .75rem;font-family:'Jost',sans-serif;font-size:.65rem;letter-spacing:1.5px;text-transform:uppercase;cursor:pointer;}
        .tag.on{border-color:#c9a96e;color:#c9a96e;background:#c9a96e0d;}
        .mini{background:#111;color:#666;font-size:.58rem;letter-spacing:1px;text-transform:uppercase;padding:.15rem .4rem;border:1px solid #1a1a1a;}
        .rbtn{background:linear-gradient(135deg,#c9a96e,#a07840);color:#080808;border:none;padding:.8rem 2rem;font-family:'Jost',sans-serif;font-size:.75rem;letter-spacing:3px;text-transform:uppercase;cursor:pointer;font-weight:500;}
        .fi{width:100%;background:#0c0c0c;border:1px solid #1e1e1e;color:#f0e6d3;padding:.65rem .85rem;font-family:'Jost',sans-serif;font-size:.88rem;outline:none;margin-bottom:.9rem;}
        .fl{font-size:.6rem;letter-spacing:2px;text-transform:uppercase;color:#3a3a3a;margin-bottom:.4rem;}
        .at{background:none;border:none;border-bottom:2px solid transparent;color:#444;padding:.5rem 1rem;font-family:'Jost',sans-serif;font-size:.68rem;letter-spacing:2px;text-transform:uppercase;cursor:pointer;}
        .at.on{color:#c9a96e;border-bottom-color:#c9a96e;}
        .sr{display:flex;align-items:center;background:#0e0e0e;border:1px solid #181818;padding:1rem;gap:.9rem;margin-bottom:.75rem;}
        .tog{position:relative;display:inline-block;width:42px;height:23px;flex-shrink:0;}
        .tog input{opacity:0;width:0;height:0;}
        .sldr{position:absolute;cursor:pointer;inset:0;background:#111;border-radius:23px;border:1px solid #1e1e1e;transition:.3s;}
        .sldr::before{content:'';position:absolute;width:17px;height:17px;left:2px;bottom:2px;background:#2a2a2a;border-radius:50%;transition:.3s;}
        input:checked+.sldr{background:#4ade800d;border-color:#4ade80;}
        input:checked+.sldr::before{transform:translateX(19px);background:#4ade80;}
        .ac{background:#0e0e0e;border:1px solid #181818;padding:1.4rem;margin-bottom:.9rem;}
        .apb{background:#c9a96e0d;border:1px solid #c9a96e;color:#c9a96e;padding:.4rem 1rem;font-family:'Jost',sans-serif;font-size:.67rem;letter-spacing:2px;text-transform:uppercase;cursor:pointer;}
        .rjb{background:none;border:1px solid #1e1e1e;color:#444;padding:.4rem 1rem;font-family:'Jost',sans-serif;font-size:.67rem;letter-spacing:2px;text-transform:uppercase;cursor:pointer;}
        .rjb:hover{border-color:#e07070;color:#e07070;}
        .back{background:none;border:none;color:#555;font-family:'Jost',sans-serif;font-size:.68rem;letter-spacing:2px;text-transform:uppercase;cursor:pointer;padding:0;}
        .back:hover{color:#c9a96e;}
        .mi{background:#0c0c0c;border:1px solid #1e1e1e;color:#f0e6d3;padding:.65rem .85rem;font-family:'Jost',sans-serif;font-size:.85rem;outline:none;width:100%;margin-bottom:.75rem;}
        .msb{background:none;border:1px solid #c9a96e;color:#c9a96e;padding:.55rem 1.3rem;font-family:'Jost',sans-serif;font-size:.68rem;letter-spacing:2px;text-transform:uppercase;cursor:pointer;}
        @media(max-width:500px){.grid{grid-template-columns:1fr 1fr;}}
      `}</style>

      {/* NAV */}
      <nav className="nav">
        <span className="logo" onClick={goHome}>Velvet</span>
        <div style={{display:"flex",gap:".6rem"}}>
          <button className="btn gold" onClick={()=>{setView("signup");setDone(false);setForm({name:"",age:"",bio:"",location:"",interests:[],photo:null});}}>Join</button>
          <button className="btn" onClick={()=>{setView("admin");setAdminIn(false);setPw("");}}>Admin</button>
        </div>
      </nav>

      {/* LANDING */}
      {view==="landing" && (
        <div style={{maxWidth:1000,margin:"0 auto",padding:"3rem 1.5rem"}}>
          <div style={{textAlign:"center",marginBottom:"3rem"}}>
            <p style={{fontSize:".62rem",letterSpacing:4,textTransform:"uppercase",color:"#c9a96e",marginBottom:"1rem"}}>Private Network</p>
            <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(2.2rem,5vw,3.8rem)",fontWeight:300,color:"#f0e6d3",marginBottom:"1rem"}}>Find your <em style={{fontStyle:"italic",color:"#c9a96e"}}>connection</em></h1>
            <p style={{color:"#555",fontSize:".85rem",maxWidth:380,margin:"0 auto",lineHeight:1.9}}>A private space for consenting adults. Contact is by request only.</p>
          </div>
          <div style={{display:"flex",gap:".45rem",flexWrap:"wrap",justifyContent:"center",marginBottom:"2.5rem"}}>
            {["All",...TAGS].map(t=><button key={t} className={tag===t?"tag on":"tag"} onClick={()=>setTag(t)}>{t}</button>)}
          </div>
          <div className="grid">
            {filtered.map(u=>(
              <div key={u.id} className="card" onClick={()=>openProfile(u)}>
                <div style={{display:"flex",alignItems:"center",gap:".75rem",marginBottom:".85rem"}}>
                  {u.photo ? <img src={u.photo} style={{width:50,height:50,borderRadius:"50%",objectFit:"cover",flexShrink:0}} alt=""/> : <Avatar name={u.name} size={50}/>}
                  <div>
                    <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.1rem",color:"#f0e6d3"}}>{u.name}, {u.age}</div>
                    <div style={{fontSize:".68rem",color:"#3a3a3a"}}>📍 {u.location}</div>
                  </div>
                </div>
                <p style={{fontSize:".78rem",color:"#666",lineHeight:1.7,marginBottom:".75rem"}}>{u.bio.slice(0,80)}{u.bio.length>80?"…":""}</p>
                <div style={{display:"flex",flexWrap:"wrap",gap:".28rem"}}>{u.interests?.map(t=><span key={t} className="mini">{t}</span>)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PROFILE */}
      {view==="profile" && sel && (
        <div style={{maxWidth:600,margin:"0 auto",padding:"2rem 1.5rem"}}>
          <button className="back" onClick={goHome}>← Back</button>
          <div style={{display:"flex",gap:"1.5rem",alignItems:"flex-start",marginTop:"1.75rem",flexWrap:"wrap"}}>
            {sel.photo ? <img src={sel.photo} style={{width:90,height:90,borderRadius:"50%",objectFit:"cover",flexShrink:0}} alt=""/> : <Avatar name={sel.name} size={90}/>}
            <div style={{flex:1}}>
              <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.8rem",fontWeight:300,color:"#f0e6d3"}}>{sel.name}, {sel.age}</h2>
              <div style={{fontSize:".68rem",color:"#3a3a3a",margin:".3rem 0 .75rem"}}>📍 {sel.location}</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:".32rem"}}>{sel.interests?.map(t=><span key={t} className="mini">{t}</span>)}</div>
            </div>
          </div>
          <div style={{marginTop:"1.75rem"}}>
            <div style={{fontSize:".58rem",letterSpacing:3,textTransform:"uppercase",color:"#333",marginBottom:".55rem"}}>About</div>
            <p style={{lineHeight:1.85,color:"#b0a090",fontSize:".88rem"}}>{sel.bio}</p>
          </div>
          <div style={{background:"#0e0e0e",border:"1px solid #1e1e1e",padding:"1.5rem",marginTop:"2rem"}}>
            <div style={{fontSize:".58rem",letterSpacing:3,textTransform:"uppercase",color:"#333",marginBottom:"1rem"}}>Contact Access</div>
            {sel.sub ? (
              <div style={{color:"#4ade80",fontSize:".82rem"}}>✓ Subscription active</div>
            ) : (
              !showCt
                ? <button className="rbtn" onClick={()=>setShowCt(true)}>Request to Reveal</button>
                : <div>
                    <p style={{color:"#c9a96e",fontSize:".68rem",letterSpacing:1.5,textTransform:"uppercase",marginBottom:".9rem"}}>Reach out to arrange access</p>
                    <div style={{display:"flex",justifyContent:"space-between",padding:".65rem 0",borderBottom:"1px solid #141414",fontSize:".85rem",color:"#c8b89a"}}><span style={{color:"#3a3a3a",fontSize:".62rem",letterSpacing:1.5,textTransform:"uppercase"}}>WhatsApp</span><span>{CONTACT.whatsapp}</span></div>
                    <div style={{display:"flex",justifyContent:"space-between",padding:".65rem 0",fontSize:".85rem",color:"#c8b89a"}}><span style={{color:"#3a3a3a",fontSize:".62rem",letterSpacing:1.5,textTransform:"uppercase"}}>Telegram</span><span>{CONTACT.telegram}</span></div>
                  </div>
            )}
          </div>
          <div style={{background:"#0e0e0e",border:"1px solid #1e1e1e",padding:"1.5rem",marginTop:"1.25rem"}}>
            <div style={{fontSize:".58rem",letterSpacing:3,textTransform:"uppercase",color:"#333",marginBottom:"1rem"}}>Send a Message Request</div>
            {msgSent
              ? <div style={{color:"#4ade80",fontSize:".82rem"}}>✓ Message sent</div>
              : <>
                  <input className="mi" placeholder="Your name" value={msgForm.name} onChange={e=>setMsgForm(d=>({...d,name:e.target.value}))}/>
                  <input className="mi" placeholder="Your WhatsApp or Telegram" value={msgForm.contact} onChange={e=>setMsgForm(d=>({...d,contact:e.target.value}))}/>
                  <textarea className="mi" rows={3} placeholder="Your message…" value={msgForm.msg} onChange={e=>setMsgForm(d=>({...d,msg:e.target.value}))} style={{resize:"vertical"}}/>
                  <button className="msb" onClick={()=>{if(msgForm.name&&msgForm.msg)setMsgSent(true);}}>Send Request</button>
                </>
            }
          </div>
          <div style={{height:"3rem"}}/>
        </div>
      )}

      {/* SIGNUP */}
      {view==="signup" && (
        <div style={{maxWidth:480,margin:"0 auto",padding:"2.5rem 1.5rem"}}>
          <button className="back" onClick={goHome}>← Back</button>
          {done
            ? <div style={{textAlign:"center",marginTop:"4rem"}}>
                <div style={{fontSize:"2.8rem",marginBottom:"1.5rem"}}>🌹</div>
                <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.8rem",fontWeight:300,color:"#f0e6d3"}}>Application Submitted</h2>
                <p style={{color:"#3a3a3a",marginTop:"1rem",lineHeight:1.9,fontSize:".85rem"}}>Your profile is under review. Once approved you'll appear in the network.</p>
                <button className="rbtn" style={{marginTop:"2rem"}} onClick={goHome}>Browse Profiles</button>
              </div>
            : <>
                <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.8rem",fontWeight:300,color:"#f0e6d3",marginTop:"1.75rem",marginBottom:"2rem"}}>Create Profile</h2>
                <div style={{display:"flex",alignItems:"center",gap:"1rem",marginBottom:"1.75rem"}}>
                  {form.photo
                    ? <img src={form.photo} style={{width:70,height:70,borderRadius:"50%",objectFit:"cover"}} alt=""/>
                    : <Avatar name={form.name||"?"} size={70}/>
                  }
                  <label style={{display:"inline-block",border:"1px dashed #2a2a2a",color:"#666",padding:".5rem 1rem",fontSize:".68rem",letterSpacing:2,textTransform:"uppercase",cursor:"pointer"}}>
                    Upload Photo<input type="file" accept="image/*" style={{display:"none"}} onChange={onPhoto}/>
                  </label>
                </div>
                {[["Full Name","name","text"],["Age","age","number"],["Location","location","text"]].map(([l,k,t])=>(
                  <div key={k}><div className="fl">{l}</div><input className="fi" type={t} value={form[k]} onChange={e=>setForm(d=>({...d,[k]:e.target.value}))}/></div>
                ))}
                <div className="fl">About You</div>
                <textarea className="fi" rows={3} value={form.bio} onChange={e=>setForm(d=>({...d,bio:e.target.value}))} placeholder="Tell us about yourself…" style={{resize:"vertical"}}/>
                <div style={{marginBottom:"2rem"}}>
                  <div className="fl" style={{marginBottom:".6rem"}}>I'm looking for</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:".45rem"}}>{TAGS.map(t=><button key={t} className={form.interests.includes(t)?"tag on":"tag"} onClick={()=>toggleI(t)}>{t}</button>)}</div>
                </div>
                <button className="rbtn" style={{width:"100%",opacity:(!form.name||!form.age)?0.5:1}} onClick={submit} disabled={!form.name||!form.age}>Submit Application</button>
              </>
          }
        </div>
      )}

      {/* ADMIN */}
      {view==="admin" && (
        <div style={{maxWidth:800,margin:"0 auto",padding:"2.5rem 1.5rem"}}>
          {!adminIn
            ? <>
                <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.8rem",fontWeight:300,color:"#f0e6d3",marginBottom:"2rem"}}>Admin Access</h2>
                <div style={{maxWidth:320}}>
                  <div className="fl">Password</div>
                  <input className="fi" type="password" value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login()} placeholder="Enter password"/>
                  <button className="rbtn" onClick={login}>Enter</button>
                  {pwErr&&<div style={{color:"#e07070",fontSize:".78rem",marginTop:".75rem"}}>{pwErr}</div>}
                  <div style={{color:"#1a1a1a",fontSize:".6rem",marginTop:"1rem"}}>Default: admin123</div>
                </div>
              </>
            : <>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"2rem"}}>
                  <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.8rem",fontWeight:300,color:"#f0e6d3"}}>Admin Panel</h2>
                  <button className="back" onClick={()=>setAdminIn(false)}>Log Out</button>
                </div>
                <div style={{display:"flex",gap:"1rem",marginBottom:"2rem",flexWrap:"wrap"}}>
                  {[["Profiles",users.length],["Active",users.filter(u=>u.sub).length],["Pending",pending.length]].map(([l,v])=>(
                    <div key={l} style={{background:"#0e0e0e",border:"1px solid #181818",padding:"1rem 1.3rem",flex:1,minWidth:80}}>
                      <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.9rem",color:"#c9a96e"}}>{v}</div>
                      <div style={{fontSize:".56rem",letterSpacing:2,textTransform:"uppercase",color:"#2e2e2e",marginTop:".25rem"}}>{l}</div>
                    </div>
                  ))}
                </div>
                <div style={{display:"flex",borderBottom:"1px solid #151515",marginBottom:"2rem"}}>
                  <button className={adminTab==="approvals"?"at on":"at"} onClick={()=>setAdminTab("approvals")}>Approvals {pending.length>0&&`(${pending.length})`}</button>
                  <button className={adminTab==="subscribers"?"at on":"at"} onClick={()=>setAdminTab("subscribers")}>Subscribers</button>
                </div>
                {adminTab==="approvals" && (
                  pending.length===0
                    ? <div style={{textAlign:"center",padding:"3rem",color:"#222",fontFamily:"'Cormorant Garamond',serif",fontStyle:"italic"}}>No pending applications</div>
                    : pending.map(u=>(
                        <div key={u.id} className="ac">
                          <div style={{display:"flex",gap:"1rem",flexWrap:"wrap"}}>
                            {u.photo ? <img src={u.photo} style={{width:56,height:56,borderRadius:"50%",objectFit:"cover",flexShrink:0}} alt=""/> : <Avatar name={u.name} size={56}/>}
                            <div style={{flex:1}}>
                              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.2rem",color:"#f0e6d3"}}>{u.name}, {u.age}</div>
                              <div style={{color:"#2e2e2e",fontSize:".68rem",margin:".2rem 0 .5rem"}}>📍 {u.location}</div>
                              <p style={{color:"#555",fontSize:".8rem",lineHeight:1.65}}>{u.bio}</p>
                              <div style={{display:"flex",flexWrap:"wrap",gap:".28rem",marginTop:".6rem"}}>{u.interests?.map(t=><span key={t} className="mini">{t}</span>)}</div>
                            </div>
                          </div>
                          <div style={{display:"flex",gap:".75rem",marginTop:"1.2rem"}}>
                            <button className="apb" onClick={()=>approve(u.id)}>✓ Approve</button>
                            <button className="rjb" onClick={()=>reject(u.id)}>✕ Reject</button>
                          </div>
                        </div>
                      ))
                )}
                {adminTab==="subscribers" && (
                  users.map(u=>(
                    <div key={u.id} className="sr">
                      {u.photo ? <img src={u.photo} style={{width:44,height:44,borderRadius:"50%",objectFit:"cover",flexShrink:0}} alt=""/> : <Avatar name={u.name} size={44}/>}
                      <div style={{flex:1}}>
                        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.05rem"}}>{u.name}, {u.age}</div>
                        <div style={{fontSize:".62rem",color:u.sub?"#4ade80":"#252525"}}>{u.sub?"Active":"Locked"}</div>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:".6rem",flexShrink:0}}>
                        <span style={{fontSize:".6rem",letterSpacing:1.5,textTransform:"uppercase",color:u.sub?"#4ade80":"#333",background:u.sub?"#4ade800d":"#111",border:`1px solid ${u.sub?"#4ade8020":"#1a1a1a"}`,padding:".16rem .5rem"}}>{u.sub?"Active":"Locked"}</span>
                        <label className="tog"><input type="checkbox" checked={u.sub} onChange={()=>toggleSub(u.id)}/><span className="sldr"/></label>
                      </div>
                    </div>
                  ))
                )}
              </>
          }
        </div>
      )}
    </div>
  );
}

