import type { LessonPlan } from "@/lib/types";

function esc(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function buildLessonHtml(args: {
  lessonPlan: LessonPlan;
  images: Record<string, string>;
  character: string;
  island: string;
}) {
  const { lessonPlan, island } = args;
  const planJson = JSON.stringify(lessonPlan);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(lessonPlan.storyIntro || "Monkey Archipelago Lesson")}</title>
  <style>
    :root{--bg:#101422;--gold:#f4d03f;--accent:#7ee0d4;--danger:#ff7c85}
    *{box-sizing:border-box}
    body{margin:0;font-family:Nunito,Arial,sans-serif;background:#0d1221;color:#fff}
    .game{position:relative;min-height:100vh;background:radial-gradient(circle at 20% 10%,#24345d 0,#101422 60%)}
    .stage-label{position:absolute;top:12px;left:50%;transform:translateX(-50%);padding:8px 14px;border-radius:999px;background:rgba(0,0,0,.45);border:1px solid rgba(255,255,255,.2);font-weight:800;z-index:20}
    .coins{position:absolute;top:12px;right:16px;padding:8px 12px;border-radius:12px;background:rgba(0,0,0,.45);border:1px solid rgba(255,255,255,.2);font-weight:800;z-index:20}
    .player{position:absolute;left:14px;bottom:48px;width:140px;height:190px;border-radius:14px;background:rgba(255,255,255,.08);display:flex;align-items:center;justify-content:center;font-size:72px;border:2px solid rgba(255,255,255,.2)}
    .zone{position:absolute;right:0;top:0;width:55%;height:100%;padding:24px 22px 18px}
    .card{height:100%;background:rgba(7,12,24,.72);border:1px solid rgba(255,255,255,.15);border-radius:16px;padding:16px;display:flex;flex-direction:column;gap:12px}
    .title{font-size:24px;font-weight:900;color:var(--gold)}
    .text{font-size:16px;line-height:1.4}
    .question{font-size:22px;font-weight:900;color:var(--accent);margin:4px 0 2px}
    .opts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
    .btn,.opt{border:none;border-radius:12px;padding:10px 12px;font-weight:800;cursor:pointer}
    .opt{background:rgba(255,255,255,.08);color:#fff;border:1px solid rgba(255,255,255,.18)}
    .opt:hover{transform:translateY(-2px)}
    .btn{background:linear-gradient(135deg,#f7de74,#f4d03f);color:#1a1a2e}
    .input{width:100%;padding:12px;border-radius:10px;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.05);color:#fff;font-size:18px}
    .drop-list{display:flex;flex-wrap:wrap;gap:8px}
    .pill{padding:8px 10px;border-radius:999px;background:rgba(126,224,212,.15);border:1px solid rgba(126,224,212,.6);cursor:pointer}
    .pill.sel{background:rgba(244,208,63,.2);border-color:rgba(244,208,63,.8)}
    .hint{font-size:13px;color:rgba(255,255,255,.7)}
    .msg{min-height:24px;font-weight:800}
    .ok{color:#8af5b2}.bad{color:var(--danger)}
    .overlay{position:fixed;inset:0;background:rgba(0,0,0,.65);display:flex;align-items:center;justify-content:center;z-index:50}
    .ov-card{width:min(780px,92vw);background:#101728;border:1px solid rgba(255,255,255,.18);border-radius:16px;padding:18px}
    .ov-title{font-size:30px;font-weight:900;color:var(--gold);margin-bottom:10px}
    .ov-line{font-size:17px;line-height:1.4}
  </style>
</head>
<body>
  <div class="game">
    <div class="stage-label" id="stageLabel">🏝️ ${esc(island)}</div>
    <div class="coins">🪙 <span id="coinCount">0</span></div>
    <div class="player">🐵</div>
    <div class="zone">
      <div class="card">
        <div class="title" id="title"></div>
        <div class="text" id="instruction"></div>
        <div class="question" id="question"></div>
        <div id="content"></div>
        <div class="msg" id="message"></div>
        <button class="btn" id="nextBtn" style="display:none">Next →</button>
      </div>
    </div>
  </div>

  <div class="overlay" id="introOverlay">
    <div class="ov-card">
      <div class="ov-title">✨ ${esc(lessonPlan.storyIntro || "New Lesson")}</div>
      <div id="loreBox"></div>
      <button class="btn" id="startBtn" style="margin-top:14px">Start Lesson</button>
    </div>
  </div>

  <script>
    const PLAN = ${planJson};
    const G = { idx: 0, coins: 0, selected: new Set() };
    const $ = (id) => document.getElementById(id);

    function setMsg(text, cls){
      const el = $("message");
      el.textContent = text || "";
      el.className = "msg " + (cls || "");
    }

    function addCoins(n){
      G.coins += Number(n || 0);
      $("coinCount").textContent = String(G.coins);
    }

    function normalize(ans){
      if(Array.isArray(ans)) return ans.map(v => String(v).trim());
      return String(ans ?? "").trim();
    }

    function showStage(){
      const s = PLAN.stages[G.idx];
      if(!s){
        $("title").textContent = "🏁 Lesson Completed!";
        $("instruction").textContent = "Great work! You completed all stages.";
        $("question").textContent = "";
        $("content").innerHTML = "";
        setMsg("You earned " + G.coins + " coins!", "ok");
        $("nextBtn").style.display = "none";
        return;
      }

      $("stageLabel").textContent = "🏝️ " + ${JSON.stringify(esc(island))} + " — Stage " + (G.idx + 1) + "/6";
      $("title").textContent = s.title || ("Stage " + (G.idx + 1));
      $("instruction").textContent = s.instruction || "";
      $("question").textContent = s.question || "";
      $("nextBtn").style.display = "none";
      setMsg("", "");

      const content = $("content");
      content.innerHTML = "";
      G.selected.clear();

      if(s.mechanic === "animation"){
        const p = document.createElement("div");
        p.className = "text";
        p.textContent = "Watch the scene and click Continue.";
        content.appendChild(p);
        showNext(s.successMessage, s.coinsReward);
        return;
      }

      if(s.mechanic === "choice"){
        const wrap = document.createElement("div");
        wrap.className = "opts";
        (s.options || []).forEach((opt) => {
          const b = document.createElement("button");
          b.className = "opt";
          b.textContent = opt;
          b.onclick = () => {
            if(String(opt).trim() === normalize(s.correctAnswer)){
              setMsg(s.successMessage || "Correct!", "ok");
              showNext(s.successMessage, s.coinsReward);
            } else {
              setMsg("Try again.", "bad");
            }
          };
          wrap.appendChild(b);
        });
        content.appendChild(wrap);
        return;
      }

      if(s.mechanic === "input"){
        const inp = document.createElement("input");
        inp.className = "input";
        inp.inputMode = "numeric";
        inp.placeholder = "Enter your answer";
        const btn = document.createElement("button");
        btn.className = "btn";
        btn.textContent = "Check";
        btn.onclick = () => {
          if(inp.value.trim() === normalize(s.correctAnswer)){
            setMsg(s.successMessage || "Correct!", "ok");
            showNext(s.successMessage, s.coinsReward);
          } else {
            setMsg("Not correct, try again.", "bad");
          }
        };
        content.appendChild(inp);
        content.appendChild(btn);
        return;
      }

      if(s.mechanic === "drawing"){
        const hint = document.createElement("div");
        hint.className = "hint";
        hint.textContent = "Tutor check: mark as done when the child completes the drawing.";
        const lab = document.createElement("label");
        lab.className = "pill";
        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.style.marginRight = "8px";
        lab.appendChild(cb);
        lab.appendChild(document.createTextNode("Accepted by tutor"));
        cb.onchange = () => {
          if(cb.checked){
            setMsg(s.successMessage || "Accepted!", "ok");
            showNext(s.successMessage, s.coinsReward);
          }
        };
        content.appendChild(hint);
        content.appendChild(lab);
        return;
      }

      const info = document.createElement("div");
      info.className = "hint";
      info.textContent = "Select the correct items and click Check.";
      content.appendChild(info);
      const list = document.createElement("div");
      list.className = "drop-list";
      (s.options || []).forEach((item) => {
        const chip = document.createElement("button");
        chip.className = "pill";
        chip.textContent = item;
        chip.onclick = () => {
          const key = String(item);
          if(G.selected.has(key)){
            G.selected.delete(key);
            chip.classList.remove("sel");
          } else {
            G.selected.add(key);
            chip.classList.add("sel");
          }
        };
        list.appendChild(chip);
      });
      const check = document.createElement("button");
      check.className = "btn";
      check.textContent = "Check";
      check.onclick = () => {
        const got = Array.from(G.selected).sort().join("|");
        const expected = normalize(s.correctAnswer);
        const exp = Array.isArray(expected) ? expected.slice().sort().join("|") : expected;
        if(got === exp){
          setMsg(s.successMessage || "Correct!", "ok");
          showNext(s.successMessage, s.coinsReward);
        } else {
          setMsg("Not yet. Try a different set.", "bad");
        }
      };
      content.appendChild(list);
      content.appendChild(check);
    }

    function showNext(msg, coins){
      addCoins(coins || 0);
      const btn = $("nextBtn");
      btn.style.display = "inline-block";
      btn.onclick = () => {
        G.idx += 1;
        showStage();
      };
    }

    function renderLore(){
      const box = $("loreBox");
      const lines = (PLAN.lore || []).slice(0, 5);
      box.innerHTML = lines.map((line) => '<div class="ov-line">' + line + "</div>").join("");
    }

    $("startBtn").onclick = () => {
      $("introOverlay").style.display = "none";
      showStage();
    };

    renderLore();
  </script>
</body>
</html>`;
}
