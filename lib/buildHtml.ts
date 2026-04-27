import fs from "fs";
import path from "path";
import type { LessonPlan } from "@/lib/types";

function loadTemplate() {
  const p = path.join(process.cwd(), "lib", "baseTemplate.html");
  return fs.readFileSync(p, "utf-8");
}

function injectLessonRuntime(html: string, lessonPlan: LessonPlan, island: string) {
  const planJson = JSON.stringify(lessonPlan).replaceAll("</script>", "<\\/script>");
  const islandJson = JSON.stringify(island).replaceAll("</script>", "<\\/script>");

  const runtime = `
<script id="dynamic-lesson-runtime">
(function(){
  const LESSON_PLAN = ${planJson};
  const ISLAND_NAME = ${islandJson};

  function $(id){ return document.getElementById(id); }
  function safe(v){ return (v ?? "").toString(); }
  function arrEq(a,b){
    if(!Array.isArray(a) || !Array.isArray(b)) return false;
    if(a.length!==b.length) return false;
    const aa=[...a].map(String).sort();
    const bb=[...b].map(String).sort();
    return aa.every((x,i)=>x===bb[i]);
  }
  function toAnswer(v){ return Array.isArray(v) ? v.map(String) : String(v ?? ""); }

  function setupChrome(){
    try{ if(typeof show==="function") show("game"); }catch(_){}
    const intro = $("intro");
    const character = $("character");
    const profile = $("profile");
    const shop = $("shop");
    [intro, character, profile, shop].forEach(function(el){ if(el) el.classList.remove("active"); });
    const game = $("game");
    if(game) game.classList.add("active");

    const wraps = ["stage1Totem","shellsArea","stage2Wrap","stage3Wrap","stage4Wrap","stage5Wrap","stage6Wrap"];
    wraps.forEach(function(id){ const el=$(id); if(el) el.style.display="none"; });

    const lbl=$("stageLabel");
    if(lbl) lbl.textContent="🏝️ "+ISLAND_NAME+" — Stage 1/6";
    if($("coinCount")) $("coinCount").textContent="0";

    if($("globalBackBtn")) $("globalBackBtn").style.display="none";
    if($("skipBtn")) $("skipBtn").style.display="none";
  }

  function renderLore(container){
    const lore = Array.isArray(LESSON_PLAN.lore) ? LESSON_PLAN.lore : [];
    const title = safe(LESSON_PLAN.storyIntro || "New Island Adventure");
    const lines = lore.slice(0,5).map(function(line){
      return '<div style="font-size:16px;line-height:1.4;margin-bottom:6px;">'+safe(line)+'</div>';
    }).join("");
    container.innerHTML = ''
      + '<div style="font-family:\\'Fredoka One\\',cursive;font-size:30px;color:#f4d03f;margin-bottom:10px;">✨ '+title+'</div>'
      + '<div>'+lines+'</div>'
      + '<button id="dynStartBtn" class="nxt" style="margin-top:14px;">Start Lesson</button>';
  }

  function mountDynamicStageUI(){
    const izone = $("izone");
    if(!izone) return null;

    const root = document.createElement("div");
    root.id = "dynLessonRoot";
    root.style.position = "absolute";
    root.style.inset = "0";
    root.style.display = "flex";
    root.style.alignItems = "stretch";
    root.style.justifyContent = "flex-end";
    root.style.padding = "24px 22px 18px";
    root.style.zIndex = "30";
    root.innerHTML = ''
      + '<div style="width:55%;height:100%;background:rgba(7,12,24,.78);border:1px solid rgba(255,255,255,.16);border-radius:16px;padding:16px;display:flex;flex-direction:column;gap:10px;">'
      + '  <div id="dynTitle" style="font-size:28px;font-family:\\'Fredoka One\\',cursive;color:#f4d03f;"></div>'
      + '  <div id="dynInstruction" style="font-size:16px;color:#fff;"></div>'
      + '  <div id="dynQuestion" style="font-size:30px;font-family:\\'Fredoka One\\',cursive;color:#7ee0d4;line-height:1.1;"></div>'
      + '  <div id="dynContent" style="display:flex;flex-wrap:wrap;gap:8px;align-items:flex-start;"></div>'
      + '  <div id="dynMsg" style="min-height:22px;font-weight:800;"></div>'
      + '  <button id="dynNextBtn" class="nxt" style="display:none;align-self:flex-start;">Next →</button>'
      + '</div>';

    izone.appendChild(root);
    return root;
  }

  function runLesson(root){
    const stages = Array.isArray(LESSON_PLAN.stages) ? LESSON_PLAN.stages.slice(0,6) : [];
    let index = 0;
    let coins = 0;
    let selected = new Set();

    const title = $("dynTitle");
    const instruction = $("dynInstruction");
    const question = $("dynQuestion");
    const content = $("dynContent");
    const msg = $("dynMsg");
    const nextBtn = $("dynNextBtn");
    const stageLabel = $("stageLabel");
    const coinCount = $("coinCount");

    function setMsg(text, ok){
      if(!msg) return;
      msg.textContent = text || "";
      msg.style.color = ok ? "#8af5b2" : "#ff8f97";
    }

    function grant(reward){
      coins += Number(reward || 0);
      if(coinCount) coinCount.textContent = String(coins);
    }

    function unlockNext(successText, reward){
      grant(reward);
      setMsg(successText || "Great!", true);
      if(nextBtn){
        nextBtn.style.display = "inline-block";
        nextBtn.onclick = function(){
          index += 1;
          render();
        };
      }
    }

    function render(){
      if(!title || !instruction || !question || !content || !nextBtn) return;
      selected = new Set();
      nextBtn.style.display = "none";
      content.innerHTML = "";
      setMsg("", true);

      const stage = stages[index];
      if(!stage){
        title.textContent = "🏁 Lesson Completed!";
        instruction.textContent = "Great work! All stages are done.";
        question.textContent = "";
        content.innerHTML = "";
        setMsg("You earned "+coins+" coins!", true);
        return;
      }

      if(stageLabel) stageLabel.textContent = "🏝️ "+ISLAND_NAME+" — Stage "+(index+1)+"/6";
      title.textContent = safe(stage.title || ("Stage "+(index+1)));
      instruction.textContent = safe(stage.instruction || "");
      question.textContent = safe(stage.question || "");

      const mechanic = safe(stage.mechanic);
      const answer = toAnswer(stage.correctAnswer);

      if(mechanic === "animation"){
        const text = document.createElement("div");
        text.textContent = "Watch the scene, then continue.";
        text.style.color = "rgba(255,255,255,.82)";
        content.appendChild(text);
        unlockNext(stage.successMessage, stage.coinsReward);
        return;
      }

      if(mechanic === "choice"){
        (Array.isArray(stage.options) ? stage.options : []).forEach(function(opt){
          const b = document.createElement("button");
          b.className = "q-btn";
          b.textContent = safe(opt);
          b.onclick = function(){
            if(safe(opt).trim() === safe(answer).trim()) unlockNext(stage.successMessage, stage.coinsReward);
            else setMsg("Try again.", false);
          };
          content.appendChild(b);
        });
        return;
      }

      if(mechanic === "input"){
        const inp = document.createElement("input");
        inp.className = "q-input";
        inp.placeholder = "Enter your answer";
        inp.inputMode = "numeric";
        const b = document.createElement("button");
        b.className = "q-btn";
        b.textContent = "Check";
        b.onclick = function(){
          if(inp.value.trim() === safe(answer).trim()) unlockNext(stage.successMessage, stage.coinsReward);
          else setMsg("Not correct, try again.", false);
        };
        content.appendChild(inp);
        content.appendChild(b);
        return;
      }

      if(mechanic === "drawing"){
        const hint = document.createElement("label");
        hint.style.display = "inline-flex";
        hint.style.alignItems = "center";
        hint.style.gap = "8px";
        hint.style.padding = "8px 10px";
        hint.style.borderRadius = "999px";
        hint.style.border = "1px solid rgba(244,208,63,.6)";
        hint.style.background = "rgba(244,208,63,.12)";
        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.onchange = function(){ if(cb.checked) unlockNext(stage.successMessage, stage.coinsReward); };
        hint.appendChild(cb);
        hint.appendChild(document.createTextNode("Accepted by tutor"));
        content.appendChild(hint);
        return;
      }

      // drag_drop represented as selectable chips
      const options = Array.isArray(stage.options) ? stage.options : [];
      options.forEach(function(item){
        const chip = document.createElement("button");
        chip.textContent = safe(item);
        chip.style.padding = "8px 10px";
        chip.style.borderRadius = "999px";
        chip.style.border = "1px solid rgba(126,224,212,.6)";
        chip.style.background = "rgba(126,224,212,.12)";
        chip.style.color = "#fff";
        chip.style.cursor = "pointer";
        chip.onclick = function(){
          const key = safe(item);
          if(selected.has(key)){
            selected.delete(key);
            chip.style.borderColor = "rgba(126,224,212,.6)";
            chip.style.background = "rgba(126,224,212,.12)";
          }else{
            selected.add(key);
            chip.style.borderColor = "rgba(244,208,63,.9)";
            chip.style.background = "rgba(244,208,63,.22)";
          }
        };
        content.appendChild(chip);
      });
      const check = document.createElement("button");
      check.className = "q-btn";
      check.textContent = "Check";
      check.onclick = function(){
        const got = Array.from(selected).map(String);
        if(Array.isArray(answer) ? arrEq(got, answer) : got.join("|")===safe(answer)){
          unlockNext(stage.successMessage, stage.coinsReward);
        } else {
          setMsg("Not yet. Try a different set.", false);
        }
      };
      content.appendChild(check);
    }

    render();
  }

  function start(){
    setupChrome();
    const success = $("successScreen");
    if(success) success.classList.remove("on");

    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.background = "rgba(0,0,0,.62)";
    overlay.style.zIndex = "60";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.innerHTML = '<div style="width:min(780px,92vw);background:#101728;border:1px solid rgba(255,255,255,.18);border-radius:16px;padding:18px;" id="dynLoreCard"></div>';
    document.body.appendChild(overlay);
    renderLore($("dynLoreCard"));

    const startBtn = $("dynStartBtn");
    if(startBtn){
      startBtn.onclick = function(){
        overlay.remove();
        const root = mountDynamicStageUI();
        if(root) runLesson(root);
      };
    }
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
</script>`;

  return html.replace("</body>", `${runtime}\n</body>`);
}

export function buildLessonHtml(args: {
  lessonPlan: LessonPlan;
  images: Record<string, string>;
  character: string;
  island: string;
}) {
  let html = loadTemplate();

  // Keep legacy placeholders valid to avoid template breakage.
  const fallbackSets = [
    {
      rows: [
        { tokens: ["1", "3", "5", "__", "__"], answers: ["7", "9"] },
        { tokens: ["2", "4", "6", "__", "__"], answers: ["8", "10"] },
        { tokens: ["9", "8", "7", "__", "__"], answers: ["6", "5"] },
      ],
    },
  ];

  html = html.replace("{{LORE_JSON}}", JSON.stringify(args.lessonPlan.lore ?? []));
  html = html.replace("{{STAGE3_SETS_JSON}}", JSON.stringify(fallbackSets));
  html = html.replace("{{STAGE5_SIDES_JSON}}", JSON.stringify(["left", "right", "right"]));

  return injectLessonRuntime(html, args.lessonPlan, args.island);
}
