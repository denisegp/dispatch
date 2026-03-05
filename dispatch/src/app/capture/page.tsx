"use client";
import { supabase } from "@/lib/supabase";
import { useState } from "react";
import { QUESTIONS, CAT_COLORS, BRAND, CHANNELS, CH_STATUS, TOPICS, TONES, AUDIENCE, FOLLOWERS, CONNECTIONS, INTENTS, BARRIERS, CONTENT_TYPES, WORKING } from "@/lib/questions";

function isOk(q: any, ans: any): boolean {
  const a = ans[q.id];
  if (q.type === "channels") return !!(a?.active?.length > 0);
  if (q.type === "textarea") return typeof a === "string" && a.trim().length >= 80;
  if (q.type === "multi") return Array.isArray(a) && a.length > 0;
  if (q.type === "tone") return !!a;
  if (q.type === "audience") return !!(a?.primary);
  if (q.type === "rank") return Array.isArray(a) && a.length > 0;
  if (q.type === "linkedin_exp") return true;
  return false;
}

export default function CapturePage() {
  const [cur, setCur] = useState(0);
  const [ans, setAns] = useState<any>({});
  const [refs, setRefs] = useState("");
  const [vis, setVis] = useState(true);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  const q = QUESTIONS[cur];
  const ac = CAT_COLORS[q.cat] || BRAND;
  const sa = (v: any) => setAns((p: any) => ({ ...p, [q.id]: v }));
  const gt = (i: number) => { setVis(false); setTimeout(() => { setCur(i); setVis(true); }, 160); };

  const liStatus = ans[1]?.status?.linkedin || null;
  const liActive = liStatus === "active";
  const liSelected = !!(ans[1]?.active?.includes("linkedin"));
  const visibleQS = QUESTIONS.filter(item => !item.dynamic_q || liSelected);
  const next = async () => { console.log('next called, cur:', cur, 'total:', QUESTIONS.length); let n = cur + 1; if (n < QUESTIONS.length && QUESTIONS[n].dynamic_q && !liSelected) n++; if (n < QUESTIONS.length) gt(n); else {
    console.log('REACHED SAVE BLOCK');
    setSaving(true);
    try {
      const { error } = await supabase.from('voice_profiles').insert({
        channels: ans[1],
        role: ans[2],
        topics: ans[3],
        expertise: ans[4],
        style: ans[5],
        audience: ans[6],
        intent: ans[7],
        linkedin_exp: ans[8],
        writing_refs: refs,
      });
      if (error) console.error('Supabase error:', error);
    } catch(e) { console.error('Save failed:', e); }
    console.log('setting done true');
    setSaving(false);
    setDone(true);
  } };
  const answered = isOk(q, ans);
  const pct = Math.round((visibleQS.filter(x => isOk(x, ans)).length / visibleQS.length) * 100);
  const barrierQ = liActive ? "What is working well for you on LinkedIn?" : "What gets in the way most?";
  const barrierHint = liActive ? "What would you want to preserve and build on?" : "No wrong answers — this tells us which friction to remove first.";

  if (done) {
    return (
      <div style={{ minHeight: "100vh", background: BRAND, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "DM Sans, sans-serif", padding: "40px 80px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", left: "6%", top: 0, bottom: 0, width: 1, background: "rgba(255,255,255,0.3)" }} />
        <div style={{ position: "absolute", right: "6%", top: 0, bottom: 0, width: 1, background: "rgba(255,255,255,0.3)" }} />
        <div style={{ maxWidth: 560, width: "100%", position: "relative" }}>
          <div style={{ marginBottom: 48 }}>
            <div style={{ background: "#fff", borderRadius: 6, padding: "6px 14px", display: "inline-flex", alignItems: "center" }}><span style={{ color: BRAND, fontWeight: 400, fontSize: 20, fontStyle: "italic", letterSpacing: "-0.01em" }}>di</span><span style={{ color: BRAND, fontWeight: 800, fontSize: 20, letterSpacing: "-0.01em" }}>Spatch</span></div>
          </div>
          <h2 style={{ color: "#fff", fontSize: 80, fontWeight: 800, lineHeight: 1.0, marginBottom: 24, letterSpacing: "-0.03em" }}>Your voice<br/>is captured.</h2>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 17, lineHeight: 1.65, marginBottom: 48, maxWidth: 420 }}>
            {liActive ? "We know how you think, who you write for, and what is already working. Dispatch will build on it." : "We know how you think, who you write for, and what has held you back. Dispatch is built to remove exactly that."}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button style={{ background: "#fff", border: "none", borderRadius: 10, padding: "14px 32px", color: BRAND, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>Generate your first draft →</button>
            <button onClick={() => { setDone(false); setCur(0); setAns({}); setRefs(""); }} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.45)", fontSize: 13, cursor: "pointer" }}>Start over</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans text-sm text-gray-900">
      {/* Sidebar */}
      <div className="w-62 bg-white border-r border-gray-100 p-7 flex flex-col flex-shrink-0" style={{ width: 248 }}>
        <div className="mb-7">
          <div className="inline-flex rounded-md px-3 py-1 mb-2" style={{ background: BRAND }}>
            <span className="text-white font-extrabold text-base tracking-tight">diSpatch</span>
          </div>
          <p className="text-xs text-gray-400 font-semibold tracking-widest">CAPTURE</p>
        </div>
        <div className="mb-5">
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: pct + "%", background: BRAND }} />
          </div>
          <p className="text-xs text-gray-400 mt-1">{pct}% complete</p>
        </div>
        <div className="flex-1">
          {visibleQS.map((item) => {
            const d = isOk(item, ans);
            const active = item.id === q.id;
            const ic = CAT_COLORS[item.cat];
            return (
              <button key={item.id} onClick={() => gt(QUESTIONS.indexOf(item))} className="w-full rounded-lg px-3 py-2 cursor-pointer text-left mb-0.5 flex items-center gap-3 transition-all" style={{ background: active ? ic + "0F" : "transparent", border: "1px solid " + (active ? ic + "33" : "transparent") }}>
                <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-xs text-white font-bold" style={{ border: "1.5px solid " + (d ? ic : "#D1D5DB"), background: d ? ic : "transparent" }}>{d ? "✓" : ""}</div>
                <div>
                  <p className="text-xs font-bold tracking-widest mb-0.5" style={{ color: active ? ic : "#9CA3AF" }}>{item.cat}</p>
                  <p className="text-xs" style={{ color: active ? "#111827" : "#6B7280", fontWeight: active ? 500 : 400 }}>
                    {item.dynamic_q ? (liStatus ? (liActive ? "What is working" : "What gets in the way") : "LinkedIn experience") : item.label}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Centre */}
      <div className="flex-1 px-12 py-14 overflow-y-auto" style={{ opacity: vis ? 1 : 0, transition: "opacity 0.16s" }}>
        <div style={{ maxWidth: 620 }}>
          <div className="inline-block rounded-md px-3 py-1 mb-4" style={{ background: ac + "15" }}>
            <p className="text-xs font-bold tracking-widest m-0" style={{ color: ac }}>{q.cat}</p>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2 leading-snug">{q.dynamic_q ? barrierQ : q.q}</h2>
          {q.hint && <p className="text-sm text-gray-500 mb-7 leading-relaxed">{q.dynamic_q ? barrierHint : q.hint}</p>}

          {q.type === "channels" && <ChannelInput value={ans[q.id]} onChange={sa} />}
          {q.type === "textarea" && <TextareaInput q={q} ans={ans} onChange={sa} />}
          {q.type === "multi" && <MultiInput val={ans[q.id]} onChange={sa} />}
          {q.type === "tone" && <ToneInput val={ans[q.id]} onChange={sa} />}
          {q.type === "audience" && <AudienceInput val={ans[q.id]} onChange={sa} />}
          {q.type === "rank" && <RankInput val={ans[q.id]} onChange={sa} />}
          {q.type === "linkedin_exp" && (liActive
            ? <ActivePath val={ans[q.id]} onChange={sa} refVal={refs} onRef={setRefs} />
            : <FrictionPath val={ans[q.id]} onChange={sa} refVal={refs} onRef={setRefs} />
          )}

          <div className="mt-9 flex items-center gap-4">
            {cur > 0 && <button onClick={() => { let p = cur - 1; if (p >= 0 && QUESTIONS[p].dynamic_q && !liSelected) p--; gt(p); }} className="text-sm text-gray-400 bg-transparent border-none cursor-pointer">← Back</button>}
            
            <button onClick={next} disabled={!answered} className="rounded-lg px-8 py-3 text-sm font-semibold transition-all" style={{ background: answered ? ac : "#E5E7EB", color: answered ? "#fff" : "#9CA3AF", cursor: answered ? "pointer" : "default", border: "none" }}>
              {cur === QUESTIONS.length - 1 || (!liSelected && cur === QUESTIONS.length - 2) ? "Complete setup" : "Continue →"}
            </button>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="bg-white border-l border-gray-100 p-10 flex-shrink-0 overflow-y-auto" style={{ width: 236, opacity: vis ? 1 : 0, transition: "opacity 0.16s" }}>
        <p className="text-xs font-bold tracking-widest text-gray-400 mb-2">WHY WE ASK THIS</p>
        <p className="text-sm text-gray-500 leading-relaxed">{q.why}</p>
      </div>
    </div>
  );
}

// ── Components ──

function cs(sel: boolean, ac?: string) {
  return {
    background: sel ? (ac || BRAND) + "0F" : "#fff",
    border: "1.5px solid " + (sel ? (ac || BRAND) : "#E5E7EB"),
    borderRadius: 8, padding: "8px 14px", cursor: "pointer",
    color: sel ? (ac || BRAND) : "#374151", fontSize: 13,
    transition: "all 0.12s", fontWeight: sel ? 600 : 400,
  } as React.CSSProperties;
}

function radioStyle(sel: boolean) {
  return {
    width: "100%", background: sel ? BRAND + "0D" : "#fff",
    border: "1.5px solid " + (sel ? BRAND : "#E5E7EB"),
    borderRadius: 8, padding: "10px 14px", cursor: "pointer",
    textAlign: "left" as const, display: "flex", alignItems: "center", gap: 12, transition: "all 0.12s",
  } as React.CSSProperties;
}

function RadioDot({ sel }: { sel: boolean }) {
  return (
    <div style={{ width: 16, height: 16, borderRadius: "50%", flexShrink: 0, border: "2px solid " + (sel ? BRAND : "#D1D5DB"), background: sel ? BRAND : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
      {sel && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "white" }} />}
    </div>
  );
}

function RefField({ val, onChange }: { val: string; onChange: (v: string) => void }) {
  return (
    <div style={{ borderTop: "1px solid #F3F4F6", paddingTop: 24, marginTop: 4 }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 4 }}>Who does this kind of content really well?</p>
      <p style={{ fontSize: 12, color: "#6B7280", marginBottom: 12 }}>Optional — anyone on LinkedIn, Substack, newsletters, or press whose writing you admire.</p>
      <textarea value={val || ""} onChange={e => onChange(e.target.value)} rows={3} placeholder="e.g. @howardmarks, Collaborative Fund blog, Morgan Housel..." style={{ width: "100%", background: "#fff", border: "1.5px solid #D1D5DB", borderRadius: 8, padding: "12px 14px", color: "#111827", fontSize: 13, lineHeight: 1.7, outline: "none", resize: "none", boxSizing: "border-box" }} />
    </div>
  );
}

function FrictionPath({ val, onChange, refVal, onRef }: any) {
  val = Array.isArray(val) ? val : [];
  const tog = (id: string) => {
    if (val.includes(id)) onChange(val.filter((x: string) => x !== id));
    else if (val.length < 3) onChange([...val, id]);
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <p style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 4 }}>Select up to 3.</p>
      {BARRIERS.map(o => {
        const s = val.includes(o.id);
        const disabled = !s && val.length >= 3;
        return (
          <button key={o.id} onClick={() => tog(o.id)} style={{ ...radioStyle(s), opacity: disabled ? 0.4 : 1 }}>
            <RadioDot sel={s} />
            <span style={{ color: s ? BRAND : "#374151", fontSize: 14, fontWeight: s ? 600 : 400 }}>{o.label}</span>
            {s && <span style={{ marginLeft: "auto", fontSize: 11, color: BRAND, fontWeight: 700 }}>#{val.indexOf(o.id) + 1}</span>}
          </button>
        );
      })}
      <RefField val={refVal} onChange={onRef} />
    </div>
  );
}

function ActivePath({ val, onChange, refVal, onRef }: any) {
  val = val || {};
  const togCT = (id: string) => { const t = val.contentTypes || []; onChange({ ...val, contentTypes: t.includes(id) ? t.filter((x: string) => x !== id) : [...t, id] }); };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <div>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 4 }}>What type of content gets the best response?</p>
        <p style={{ fontSize: 12, color: "#6B7280", marginBottom: 12 }}>Pick as many as apply.</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {CONTENT_TYPES.map(o => { const s = (val.contentTypes || []).includes(o.id); return <button key={o.id} onClick={() => togCT(o.id)} style={cs(s)}>{o.label}</button>; })}
        </div>
      </div>
      <div>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 4 }}>What does your current posting rhythm look like?</p>
        <p style={{ fontSize: 12, color: "#6B7280", marginBottom: 12 }}>How often you actually post, not how often you intend to.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {WORKING.map(o => { const s = val.rhythm === o.id; return (
            <button key={o.id} onClick={() => onChange({ ...val, rhythm: o.id })} style={radioStyle(s)}>
              <RadioDot sel={s} />
              <span style={{ color: s ? BRAND : "#374151", fontSize: 14, fontWeight: s ? 600 : 400 }}>{o.label}</span>
            </button>
          ); })}
        </div>
      </div>
      <div>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 4 }}>Paste your best performing post</p>
        <p style={{ fontSize: 12, color: "#6B7280", marginBottom: 12 }}>Optional — but this is the fastest way to capture your real voice.</p>
        <textarea value={val.bestPost || ""} onChange={e => onChange({ ...val, bestPost: e.target.value })} rows={5} placeholder="Paste a post that got strong engagement, comments, or inbound messages..." style={{ width: "100%", background: "#fff", border: "1.5px solid #D1D5DB", borderRadius: 8, padding: "12px 14px", color: "#111827", fontSize: 13, lineHeight: 1.7, outline: "none", resize: "none", boxSizing: "border-box" }} />
      </div>
      <RefField val={refVal} onChange={onRef} />
    </div>
  );
}

function ChannelInput({ value, onChange }: any) {
  value = value || { active: [], status: {}, custom: [], showAdd: false, addText: "" };
  const tog = (id: string) => { const active = value.active.includes(id) ? value.active.filter((x: string) => x !== id) : [...value.active, id]; onChange({ ...value, active }); };
  const setSt = (id: string, s: string, e: any) => { e.stopPropagation(); onChange({ ...value, status: { ...value.status, [id]: s } }); };
  const addCustom = () => { const t = (value.addText || "").trim(); if (!t) return; onChange({ ...value, custom: [...(value.custom || []), t], addText: "", showAdd: false, active: [...value.active, "custom_" + t] }); };
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
      {CHANNELS.map(ch => {
        const sel = value.active.includes(ch.id); const st = value.status[ch.id];
        return (
          <div key={ch.id} onClick={() => tog(ch.id)} style={{ background: sel ? BRAND + "0D" : "#fff", border: "1.5px solid " + (sel ? BRAND : "#E5E7EB"), borderRadius: 10, padding: 14, cursor: "pointer", transition: "all 0.15s", boxShadow: sel ? "0 0 0 3px " + BRAND + "18" : "none" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: sel ? 12 : 0 }}>
              <span style={{ fontSize: 20, lineHeight: 1 }}>{ch.icon}</span>
              <p style={{ fontSize: 13, fontWeight: 600, color: sel ? BRAND : "#111827", margin: 0, flex: 1 }}>{ch.label}</p>
              {sel && <div style={{ width: 18, height: 18, borderRadius: "50%", background: BRAND, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "white", flexShrink: 0 }}>✓</div>}
            </div>
            {sel && (
              <div style={{ borderTop: "1px solid " + BRAND + "22", paddingTop: 10 }} onClick={e => e.stopPropagation()}>
                <p style={{ fontSize: 11, color: "#6B7280", marginBottom: 6 }}>Currently using this?</p>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {CH_STATUS.map(s => <button key={s.id} onClick={e => setSt(ch.id, s.id, e)} style={{ ...cs(st === s.id), fontSize: 11, padding: "4px 9px" }}>{s.label}</button>)}
                </div>
              </div>
            )}
          </div>
        );
      })}
      {(value.custom || []).map((t: string) => (
        <div key={t} style={{ background: BRAND + "0D", border: "1.5px solid " + BRAND, borderRadius: 10, padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>📌</span>
            <p style={{ fontSize: 13, fontWeight: 600, color: BRAND, margin: 0, flex: 1 }}>{t}</p>
            <button onClick={e => { e.stopPropagation(); onChange({ ...value, custom: value.custom.filter((x: string) => x !== t), active: value.active.filter((x: string) => x !== "custom_" + t) }); }} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#9CA3AF", fontSize: 18, lineHeight: 1, padding: 0 }}>×</button>
          </div>
        </div>
      ))}
      <div style={{ border: "1.5px dashed " + (value.showAdd ? BRAND : "#D1D5DB"), borderRadius: 10, padding: 14, cursor: "pointer", transition: "all 0.15s", background: value.showAdd ? BRAND + "05" : "#fff" }} onClick={() => onChange({ ...value, showAdd: !value.showAdd })}>
        {!value.showAdd && <div style={{ display: "flex", alignItems: "center", gap: 10 }}><span style={{ fontSize: 20, color: "#9CA3AF" }}>＋</span><p style={{ fontSize: 13, fontWeight: 600, color: "#9CA3AF", margin: 0 }}>Add channel</p></div>}
        {value.showAdd && (
          <div onClick={e => e.stopPropagation()}>
            <p style={{ fontSize: 12, color: BRAND, fontWeight: 600, marginBottom: 8 }}>Add a channel</p>
            <input autoFocus value={value.addText || ""} onChange={e => onChange({ ...value, addText: e.target.value })} onKeyDown={e => { if (e.key === "Enter") addCustom(); if (e.key === "Escape") onChange({ ...value, showAdd: false, addText: "" }); }} placeholder="e.g. Podcast, WhatsApp..." style={{ width: "100%", background: "#fff", border: "1.5px solid " + BRAND, borderRadius: 7, padding: "8px 11px", color: "#111827", fontSize: 13, outline: "none", boxSizing: "border-box", marginBottom: 8 }} />
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={addCustom} style={{ background: BRAND, border: "none", borderRadius: 6, padding: "6px 14px", color: "white", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Add</button>
              <button onClick={() => onChange({ ...value, showAdd: false, addText: "" })} style={{ background: "transparent", border: "1px solid #E5E7EB", borderRadius: 6, padding: "6px 14px", color: "#6B7280", fontSize: 12, cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const ROLE_EX = "I am a senior portfolio manager at a 40B Boston-based asset manager, focused on fixed income for endowments and foundations. I have been in this role for 12 years and lead a team of four. Most of my time goes into client conversations around liability-matching and duration risk. I measure success by AUM retention and the quality of client relationships — not short-term performance numbers.";
const TE: Record<string, string> = { rates: "Clients ask about Fed policy every time rates move. What I keep explaining: the question is not whether rates go up or down but whether the path is already priced in. By the time it is news, the market has usually already moved.", volatility: "Every drawdown, clients ask if they should do something. What I explain over and over: volatility is the price of return, not a signal to exit.", equity: "Every client asks whether equities are overvalued. Valuation is not a timing tool. Expensive markets can stay expensive for years.", inflation: "Clients keep asking whether inflation is really over. Headline numbers are down but the structural drivers have not gone away.", retirement: "The question I hear most: do I have enough to retire? The risk is not running out of money but running out at the wrong time." };
const DE = "I explain the difference between volatility and risk at least twice a week. Clients see a down month and think something is broken.";

function TextareaInput({ q, ans, onChange }: any) {
  const ex = q.dynamic ? (TE[(Array.isArray(ans[3]) && ans[3][0]) || ""] || DE) : ROLE_EX;
  const n = (ans[q.id] || "").trim().length;
  const ok = n >= 80;
  return (
    <div>
      <textarea value={ans[q.id] || ""} onChange={e => onChange(e.target.value)} rows={5} placeholder={ex} style={{ width: "100%", background: "#fff", border: "1.5px solid " + (ok ? BRAND + "66" : "#D1D5DB"), borderRadius: 8, padding: "12px 14px", color: "#111827", fontSize: 14, lineHeight: 1.7, outline: "none", resize: "none", boxSizing: "border-box", transition: "border-color 0.15s" }} />
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 5 }}>
        <span style={{ fontSize: 11, color: ok ? "#9CA3AF" : "#D1D5DB" }}>{ok ? "✓ Looks good" : n === 0 ? "80 characters minimum" : n + " / 80 minimum"}</span>
      </div>
    </div>
  );
}

function MultiInput({ val, onChange }: any) {
  val = val || [];
  const tog = (id: string) => onChange(val.includes(id) ? val.filter((x: string) => x !== id) : [...val, id]);
  const hasOther = val.some((v: string) => typeof v === 'string' && v.startsWith("other:"));
  const togOther = () => { if (hasOther) onChange(val.filter((v: string) => !(typeof v === 'string' && v.startsWith("other:")))); else onChange([...val, "other:"]); };
  const upOther = (t: string) => onChange([...val.filter((v: string) => !(typeof v === 'string' && v.startsWith("other:"))), "other:" + t]);
  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {TOPICS.map(o => { const s = val.includes(o.id); return <button key={o.id} onClick={() => tog(o.id)} style={{ ...cs(s), display: "flex", alignItems: "center", gap: 5 }}><span>{o.icon}</span>{o.label}</button>; })}
        <button onClick={togOther} style={cs(hasOther)}>+ Add</button>
      </div>
      {hasOther && <input autoFocus placeholder="Add your topic..." onChange={e => upOther(e.target.value)} style={{ marginTop: 10, width: "100%", background: "#fff", border: "1.5px solid " + BRAND, borderRadius: 8, padding: "9px 13px", color: "#111827", fontSize: 13, outline: "none", boxSizing: "border-box" }} />}
    </div>
  );
}

function ToneInput({ val, onChange }: any) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
      {TONES.map(o => { const s = val === o.id; return (
        <button key={o.id} onClick={() => onChange(o.id)} style={{ background: s ? BRAND + "0D" : "#fff", border: "1.5px solid " + (s ? BRAND : "#E5E7EB"), borderRadius: 10, padding: 16, cursor: "pointer", textAlign: "left", transition: "all 0.15s", boxShadow: s ? "0 0 0 3px " + BRAND + "18" : "none" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: s ? BRAND : "#111827", margin: 0 }}>{o.label}</p>
            {s && <div style={{ width: 18, height: 18, borderRadius: "50%", background: BRAND, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "white", flexShrink: 0 }}>✓</div>}
          </div>
          <p style={{ fontSize: 12, color: s ? BRAND + "99" : "#9CA3AF", marginBottom: s ? 12 : 0, fontWeight: 500 }}>{o.tag}</p>
          {s && <p style={{ fontSize: 12, color: "#4B5563", lineHeight: 1.65, margin: 0, fontStyle: "italic", borderTop: "1px solid " + BRAND + "22", paddingTop: 10 }}>{o.excerpt}</p>}
        </button>
      ); })}
    </div>
  );
}

function AudienceInput({ val, onChange }: any) {
  val = val || {};
  const { primary: pr = "", otherText: ot = "", followers: fl = null, connections: cn = null } = val;
  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
        {AUDIENCE.map(o => { const s = pr === o.id; return (
          <div key={o.id}>
            <button onClick={() => onChange({ ...val, primary: o.id })} style={radioStyle(s)}>
              <RadioDot sel={s} />
              <span style={{ color: s ? BRAND : "#374151", fontSize: 14, fontWeight: s ? 600 : 400 }}>{o.label}</span>
            </button>
            {o.hasInput && s && <div style={{ marginTop: 6 }}><textarea value={ot} onChange={e => onChange({ ...val, primary: "other", otherText: e.target.value })} rows={2} placeholder="Describe your audience..." style={{ width: "100%", background: "#fff", border: "1.5px solid " + BRAND, borderRadius: 8, padding: "10px 13px", color: "#111827", fontSize: 13, lineHeight: 1.6, outline: "none", resize: "none", boxSizing: "border-box" }} /></div>}
          </div>
        ); })}
      </div>
      <div style={{ borderTop: "1px solid #F3F4F6", paddingTop: 20 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 2 }}>Your reach</p>
        <p style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 14 }}>Optional — helps calibrate content strategy.</p>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", color: "#9CA3AF", marginBottom: 6 }}>FOLLOWERS</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 16 }}>{FOLLOWERS.map(o => <button key={o.id} onClick={() => onChange({ ...val, followers: o.id })} style={cs(fl === o.id)}>{o.label}</button>)}</div>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", color: "#9CA3AF", marginBottom: 6 }}>CONNECTIONS</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>{CONNECTIONS.map(o => <button key={o.id} onClick={() => onChange({ ...val, connections: o.id })} style={cs(cn === o.id)}>{o.label}</button>)}</div>
      </div>
    </div>
  );
}

function RankInput({ val, onChange }: any) {
  const items = val || INTENTS.map(o => o.id);
  const mv = (i: number, d: number) => { const arr = [...items]; const s = i + d; if (s < 0 || s >= arr.length) return; [arr[i], arr[s]] = [arr[s], arr[i]]; onChange(arr); };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map((id: string, i: number) => { const o = INTENTS.find(x => x.id === id); const top = i === 0; return (
        <div key={id} style={{ display: "flex", alignItems: "center", gap: 10, background: top ? BRAND + "0D" : "#fff", border: "1.5px solid " + (top ? BRAND : "#E5E7EB"), borderRadius: 8, padding: "11px 14px", transition: "all 0.15s" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: top ? BRAND : "#9CA3AF", width: 20, textAlign: "center", flexShrink: 0 }}>{i + 1}</span>
          <span style={{ flex: 1, fontSize: 14, color: top ? "#111827" : "#6B7280", fontWeight: top ? 500 : 400 }}>{o?.label || id}</span>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <button onClick={() => mv(i, -1)} disabled={i === 0} style={{ background: "transparent", border: "none", cursor: i === 0 ? "default" : "pointer", color: i === 0 ? "#E5E7EB" : "#9CA3AF", padding: "2px 5px", fontSize: 11 }}>▲</button>
            <button onClick={() => mv(i, 1)} disabled={i === items.length - 1} style={{ background: "transparent", border: "none", cursor: i === items.length - 1 ? "default" : "pointer", color: i === items.length - 1 ? "#E5E7EB" : "#9CA3AF", padding: "2px 5px", fontSize: 11 }}>▼</button>
          </div>
        </div>
      ); })}
    </div>
  );
}
