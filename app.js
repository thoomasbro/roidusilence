import { QuietOcean, rareAnimalsFor, rms, thresholdFor } from "./sound.js";

const $ = (id) => document.getElementById(id);
const canvas = $("ocean");
const ctx = canvas.getContext("2d");
const model = new QuietOcean();
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
let width = 1000;
let height = 445;
let mode = "idle";
let paused = false;
let starting = false;
let stream;
let audioContext;
let analyser;
let samples;
let previousTime;
let time = 0;
let level = 0;
const animals = [];
const species = ["poisson", "méduse", "banc de crevettes", "étoile de mer", "poisson", "murène", "requin"];
let nextSpecies = 0;
const palettes = [["#edbf77", "#d58452"], ["#84cdbb", "#469e9d"], ["#aec9e0", "#659bbd"], ["#e8bcab", "#b5767e"]];
const bubbles = Array.from({ length: 23 }, () => ({ x: Math.random(), y: Math.random(), radius: 1 + Math.random() * 2, speed: 0.008 + Math.random() * 0.012 }));
const plants = Array.from({ length: 38 }, (_, i) => ({ x: i / 37, tall: 28 + Math.random() * 83, bend: Math.random() * 20, back: i % 3 === 0 }));

function resize() {
  const bounds = canvas.getBoundingClientRect();
  width = bounds.width;
  height = bounds.height;
  const ratio = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}
new ResizeObserver(resize).observe(canvas);

function notice(message, error = false) {
  $("notice").textContent = message;
  $("notice").classList.toggle("error", error);
  if (error) $("settings").open = true;
}

async function releaseMicro() {
  stream?.getTracks().forEach((track) => track.stop());
  stream = undefined;
  analyser = undefined;
  samples = undefined;
  const context = audioContext;
  audioContext = undefined;
  if (context && context.state !== "closed") await context.close();
}

function activate(nextMode) {
  mode = nextMode;
  paused = false;
  model.elapsed = 0;
  $("welcome").hidden = true;
  $("pause").disabled = false;
  $("pause").innerHTML = "Ⅱ <span>Pause</span>";
  $("mode-badge").textContent = mode === "demo" ? "DÉMONSTRATION" : "MICRO ACTIVÉ";
  $("demo-controls").hidden = mode !== "demo";
  if (mode === "demo") $("settings").open = true;
  notice(mode === "demo" ? "Mode démonstration : déplace le curseur pour simuler le bruit." : "Le micro écoute uniquement le volume. Aucun son n'est enregistré ni envoyé.");
}

async function startMicro() {
  if (starting) return;
  starting = true;
  $("start").disabled = true;
  $("demo").disabled = true;
  $("use-micro").disabled = true;
  $("pause").disabled = true;
  notice("Autorise le microphone dans ton navigateur pour commencer.");
  try {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error("unsupported");
    stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    });
    audioContext = new AudioContext();
    await audioContext.resume();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    samples = new Float32Array(analyser.fftSize);
    audioContext.createMediaStreamSource(stream).connect(analyser);
    for (const track of stream.getAudioTracks()) {
      track.addEventListener("ended", () => {
        if (mode !== "micro") return;
        paused = true;
        $("pause").disabled = true;
        $("mode-badge").textContent = "MICRO DÉCONNECTÉ";
        $("welcome").hidden = false;
        notice("Le microphone a été déconnecté. Recommence l'exploration ou essaie la démonstration.", true);
        releaseMicro().catch((error) => {
          console.error("Impossible de fermer le microphone :", error);
        });
      });
    }
    activate("micro");
  } catch (error) {
    await releaseMicro();
    const messages = {
      NotAllowedError: "L'accès au micro est refusé. Autorise-le dans les réglages du navigateur ou essaie sans microphone.",
      NotFoundError: "Aucun microphone trouvé. Branche un micro ou essaie le mode démonstration.",
      NotReadableError: "Le microphone est indisponible. Vérifie qu'une autre application ne l'utilise pas.",
    };
    notice(messages[error.name] || (error.message === "unsupported" ? "Le micro nécessite localhost ou HTTPS et un navigateur compatible. Tu peux essayer la démonstration." : "Impossible d'activer le microphone. Tu peux réessayer ou utiliser la démonstration."), true);
    console.error("Impossible d'activer le microphone :", error);
  } finally {
    starting = false;
    $("start").disabled = false;
    $("demo").disabled = false;
    $("use-micro").disabled = false;
    $("pause").disabled = mode === "idle" || (mode === "micro" && !paused && !stream);
  }
}
$("start").addEventListener("click", startMicro);
$("use-micro").addEventListener("click", startMicro);
$("demo").addEventListener("click", () => activate("demo"));
$("pause").addEventListener("click", async () => {
  if (mode === "micro" && !paused) {
    paused = true;
    $("pause").disabled = true;
    try {
      await releaseMicro();
    } catch (error) {
      notice("Impossible de fermer correctement le microphone. Recharge la page.", true);
      console.error("Impossible de fermer le microphone :", error);
      return;
    }
    $("pause").disabled = false;
  } else if (mode === "micro") {
    await startMicro();
    return;
  } else {
    paused = !paused;
  }
  $("pause").innerHTML = paused ? "▷ <span>Reprendre</span>" : "Ⅱ <span>Pause</span>";
  $("mode-badge").textContent = paused ? "EN PAUSE" : "DÉMONSTRATION";
  notice(paused ? "Exploration en pause. Le micro est éteint et les animaux t'attendent." : "Mode démonstration : déplace le curseur pour simuler le bruit.");
});

function sensitivity() {
  const value = Number($("sensitivity").value);
  $("sensitivity-label").textContent = value < 34 ? "Faible" : value > 66 ? "Élevée" : "Moyenne";
  $("threshold-marker").style.left = `${Math.min(thresholdFor(value) / 0.15, 1) * 100}%`;
}
$("sensitivity").addEventListener("input", sensitivity);
sensitivity();
window.addEventListener("pagehide", () => {
  stream?.getTracks().forEach((track) => track.stop());
  audioContext?.close().catch((error) => console.error("Impossible de fermer le microphone :", error));
});
document.addEventListener("visibilitychange", () => { previousTime = undefined; });

function addAnimal() {
  const direction = Math.random() > 0.5 ? 1 : -1;
  const kind = species[nextSpecies++ % species.length];
  const seabed = kind === "étoile de mer" || kind === "murène";
  animals.push({
    kind,
    x: kind === "étoile de mer" ? 0.3 + Math.random() * 0.4 : seabed || kind === "méduse" ? 0.1 + Math.random() * 0.8 : direction === 1 ? -0.07 : 1.07,
    y: kind === "étoile de mer" ? 1 - 30 / height : seabed ? 0.82 : 0.18 + Math.random() * 0.5,
    size: kind === "requin" ? 50 + Math.random() * 16 : kind === "murène" ? 42 : kind === "banc de crevettes" ? 34 : 20 + Math.random() * 13,
    speed: 0.022 + Math.random() * 0.025,
    direction,
    phase: Math.random() * Math.PI * 2,
    palette: palettes[Math.floor(Math.random() * palettes.length)],
    leaving: false,
    age: 0,
    exitAge: 0,
  });
}

const rareSettings = {
  "tortue de mer": { y: .35, size: 38, speed: .03 },
  hippocampe: { y: .62, size: 26, speed: 0 },
  poulpe: { y: .86, size: 30, speed: .01 },
  "raie manta": { y: .28, size: 60, speed: .025 },
  baleine: { y: .3, size: 190, speed: .012 },
  plongeur: { y: .45, size: 66, speed: .02 },
  "sous-marin": { y: .22, size: 85, speed: .015 },
  sirène: { y: .55, size: 75, speed: .022 },
};
const rareNames = {
  "tortue de mer": "une tortue de mer",
  hippocampe: "un hippocampe",
  poulpe: "un poulpe",
  "raie manta": "une raie manta",
  plongeur: "un plongeur",
  baleine: "une baleine",
  "sous-marin": "un sous-marin",
  sirène: "une sirène",
};

function addRareAnimal(kind) {
  const direction = Math.random() > 0.5 ? 1 : -1;
  const settings = rareSettings[kind];
  const still = settings.speed === 0 || kind === "poulpe";
  animals.push({
    kind,
    rare: true,
    x: still ? .15 + Math.random() * .7 : direction === 1 ? -.1 : 1.1,
    y: settings.y + (still ? 0 : Math.random() * .1),
    size: settings.size,
    speed: settings.speed,
    direction,
    phase: Math.random() * Math.PI * 2,
    leaving: false,
    age: 0,
    exitAge: 0,
  });
  const banner = $("rare-banner");
  banner.textContent = `✦ Une visite rare : ${rareNames[kind]} !`;
  banner.classList.remove("show");
  void banner.offsetWidth;
  banner.classList.add("show");
}

function drawAnimal(animal) {
  const x = animal.x * width;
  const y = animal.kind === "étoile de mer" ? height - 30 : animal.y * height + Math.sin(time * 1.3 + animal.phase) * (reducedMotion ? 0 : 7);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(animal.direction, 1);
  ctx.globalAlpha = Math.min(animal.age / .25, 1) * (1 - Math.min(animal.exitAge / .45, 1));
  const size = animal.size;
  if (animal.kind !== "poisson") {
    ctx.scale(size, size);
    drawSpecies(animal);
    ctx.restore();
    return;
  }
  ctx.fillStyle = animal.palette[1];
  ctx.beginPath();
  ctx.moveTo(-size * .65, 0);
  ctx.lineTo(-size * 1.25, -size * .55);
  ctx.quadraticCurveTo(-size * .95, 0, -size * 1.25, size * .55);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-size * .2, -size * .35);
  ctx.lineTo(size * .05, -size * .75);
  ctx.lineTo(size * .4, -size * .3);
  ctx.fill();
  ctx.fillStyle = animal.palette[0];
  ctx.beginPath();
  ctx.ellipse(0, 0, size, size * .48, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff30";
  ctx.beginPath();
  ctx.ellipse(-size * .08, -size * .16, size * .6, size * .1, -.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#143e46";
  ctx.beginPath();
  ctx.arc(size * .58, -size * .06, size * .085, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSpecies(animal) {
  if (animal.kind === "étoile de mer") {
    ctx.rotate(animal.phase);
    ctx.fillStyle = "#eeb18a";
    ctx.strokeStyle = "#bb765f";
    ctx.lineWidth = .04;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const angle = i * Math.PI / 5;
      const radius = i % 2 ? .4 : 1;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#fff3ce";
    for (let i = 0; i < 5; i++) {
      const angle = i * Math.PI * 2 / 5;
      for (const radius of [.25, .5, .75]) {
        ctx.beginPath();
        ctx.arc(Math.cos(angle) * radius, Math.sin(angle) * radius, .045, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (animal.kind === "méduse") {
    const pulse = reducedMotion ? 1 : 1 + Math.sin(time * 2 + animal.phase) * .08;
    ctx.scale(pulse, 1 / pulse);
    ctx.strokeStyle = "#efd1edaa";
    ctx.lineWidth = .07;
    for (let i = -2; i <= 2; i++) {
      const sway = reducedMotion ? 0 : Math.sin(time * 2 + i + animal.phase) * .18;
      ctx.beginPath();
      ctx.moveTo(i * .25, .1);
      ctx.bezierCurveTo(i * .25 + sway, .7, i * .25 - sway, 1.1, i * .25 + sway, 1.5);
      ctx.stroke();
    }
    const dome = ctx.createLinearGradient(0, -.9, 0, .2);
    dome.addColorStop(0, "#f5d9eddd");
    dome.addColorStop(1, "#b798d780");
    ctx.fillStyle = dome;
    ctx.beginPath();
    ctx.ellipse(0, .1, 1, 1, 0, Math.PI, Math.PI * 2);
    ctx.quadraticCurveTo(0, .4, -1, .1);
    ctx.fill();
  } else if (animal.kind === "murène") {
    const bend = reducedMotion ? 0 : Math.sin(time * 2 + animal.phase) * .15;
    ctx.strokeStyle = "#899e62";
    ctx.lineWidth = .3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-1.7, bend);
    ctx.bezierCurveTo(-.9, -.5 - bend, -.5, .45 + bend, .6, 0);
    ctx.stroke();
    ctx.fillStyle = "#aeb87c";
    ctx.beginPath();
    ctx.ellipse(.65, 0, .4, .2, -.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#173c38";
    ctx.beginPath();
    ctx.arc(.83, -.07, .045, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#42583f";
    ctx.lineWidth = .025;
    ctx.beginPath();
    ctx.moveTo(1, .05);
    ctx.lineTo(.72, .08);
    ctx.stroke();
  } else if (animal.kind === "requin") {
    ctx.fillStyle = "#8aaebc";
    ctx.beginPath();
    ctx.moveTo(-.6, -.2);
    ctx.lineTo(-.15, -.85);
    ctx.lineTo(.2, -.25);
    ctx.lineTo(.6, .15);
    ctx.lineTo(.1, .65);
    ctx.lineTo(-.2, .2);
    ctx.lineTo(-1, 0);
    ctx.lineTo(-1.5, -.65);
    ctx.lineTo(-1.3, 0);
    ctx.lineTo(-1.5, .5);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-1.1, 0);
    ctx.bezierCurveTo(-.7, -.5, .55, -.45, 1.3, .03);
    ctx.bezierCurveTo(.7, .42, -.7, .4, -1.1, 0);
    ctx.fill();
    ctx.fillStyle = "#cee1df";
    ctx.beginPath();
    ctx.moveTo(-.85, .12);
    ctx.quadraticCurveTo(.3, .2, 1.25, .05);
    ctx.quadraticCurveTo(.5, .45, -.85, .12);
    ctx.fill();
    ctx.fillStyle = "#163947";
    ctx.beginPath();
    ctx.arc(.85, -.06, .04, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#466d7d";
    ctx.lineWidth = .025;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(.3 - i * .1, -.15);
      ctx.lineTo(.26 - i * .1, .1);
      ctx.stroke();
    }
  } else if (animal.kind === "tortue de mer") {
    const paddle = reducedMotion ? 0 : Math.sin(time * 2.4 + animal.phase) * .35;
    ctx.fillStyle = "#9fc08a";
    for (const [fx, fy, side] of [[.35, -.45, -1], [.35, .45, 1], [-.45, -.35, -1], [-.45, .35, 1]]) {
      ctx.save();
      ctx.translate(fx, fy);
      ctx.rotate(side * (.6 + paddle));
      ctx.beginPath();
      ctx.ellipse(.15, 0, .38, .12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.beginPath();
    ctx.ellipse(.85, 0, .24, .18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#173c38";
    ctx.beginPath();
    ctx.arc(.95, -.07, .04, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#7a6a3e";
    ctx.beginPath();
    ctx.ellipse(0, 0, .7, .5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#c4b071";
    ctx.lineWidth = .04;
    ctx.beginPath();
    ctx.moveTo(-.4, 0);
    ctx.lineTo(.4, 0);
    for (const sx of [-.2, .2]) {
      ctx.moveTo(sx, -.45);
      ctx.lineTo(sx, .45);
    }
    ctx.stroke();
  } else if (animal.kind === "hippocampe") {
    ctx.translate(0, reducedMotion ? 0 : Math.sin(time * 1.5 + animal.phase) * .2);
    ctx.strokeStyle = "#f0c35c";
    ctx.lineCap = "round";
    ctx.lineWidth = .32;
    ctx.beginPath();
    ctx.moveTo(.15, -.8);
    ctx.bezierCurveTo(.5, -.4, .35, .3, 0, .5);
    ctx.bezierCurveTo(-.3, .7, -.1, 1.1, .2, 1);
    ctx.stroke();
    ctx.fillStyle = "#f0c35c";
    ctx.beginPath();
    ctx.ellipse(.15, -.95, .25, .18, -.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(.48, -.88, .2, .07, .3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f7dc97";
    ctx.beginPath();
    ctx.ellipse(.32, -.25, .12, .22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#173c38";
    ctx.beginPath();
    ctx.arc(.2, -.98, .045, 0, Math.PI * 2);
    ctx.fill();
  } else if (animal.kind === "poulpe") {
    ctx.strokeStyle = "#d77b8c";
    ctx.lineCap = "round";
    ctx.lineWidth = .14;
    for (let i = 0; i < 6; i++) {
      const base = -.5 + i * .2;
      const wave = reducedMotion ? 0 : Math.sin(time * 2.5 + i + animal.phase) * .2;
      ctx.beginPath();
      ctx.moveTo(base, 0);
      ctx.bezierCurveTo(base - .2, .4, base + wave, .5, base * 1.8 + wave, .55);
      ctx.stroke();
    }
    ctx.fillStyle = "#e58e9c";
    ctx.beginPath();
    ctx.ellipse(0, -.4, .55, .6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    for (const ex of [-.18, .18]) {
      ctx.beginPath();
      ctx.arc(ex, -.25, .1, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#173c38";
    for (const ex of [-.15, .21]) {
      ctx.beginPath();
      ctx.arc(ex, -.25, .05, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (animal.kind === "raie manta") {
    const flap = reducedMotion ? 0 : Math.sin(time * 1.6 + animal.phase) * .25;
    ctx.fillStyle = "#3e5a72";
    ctx.beginPath();
    ctx.moveTo(.6, 0);
    ctx.quadraticCurveTo(.1, -.5 - flap, -.2, -1 - flap);
    ctx.quadraticCurveTo(-.3, -.3, -.6, 0);
    ctx.quadraticCurveTo(-.3, .3, -.2, 1 + flap);
    ctx.quadraticCurveTo(.1, .5 + flap, .6, 0);
    ctx.fill();
    ctx.strokeStyle = "#3e5a72";
    ctx.lineWidth = .04;
    ctx.beginPath();
    ctx.moveTo(-.6, 0);
    ctx.lineTo(-1.4, .05);
    ctx.stroke();
    ctx.fillStyle = "#b9cbd6";
    ctx.beginPath();
    ctx.ellipse(.15, 0, .25, .12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#3e5a72";
    for (const sy of [-.14, .14]) {
      ctx.beginPath();
      ctx.ellipse(.62, sy, .1, .04, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (animal.kind === "baleine") {
    const tail = reducedMotion ? 0 : Math.sin(time * 1.1 + animal.phase) * .12;
    ctx.fillStyle = "#4b6f8f";
    ctx.beginPath();
    ctx.moveTo(-.85, 0);
    ctx.lineTo(-1.25, -.3 + tail);
    ctx.lineTo(-1.15, 0);
    ctx.lineTo(-1.25, .25 + tail);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-.95, 0);
    ctx.bezierCurveTo(-.6, -.45, .6, -.5, .95, -.05);
    ctx.bezierCurveTo(1, .25, .4, .38, -.2, .3);
    ctx.quadraticCurveTo(-.7, .2, -.95, 0);
    ctx.fill();
    ctx.fillStyle = "#c9d8de";
    ctx.beginPath();
    ctx.moveTo(-.2, .3);
    ctx.quadraticCurveTo(.5, .36, .95, .05);
    ctx.quadraticCurveTo(.5, .2, -.2, .3);
    ctx.fill();
    ctx.strokeStyle = "#8fa9bb";
    ctx.lineWidth = .012;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(.1 + i * .15, .25 - i * .03);
      ctx.lineTo(.2 + i * .15, .2 - i * .04);
      ctx.stroke();
    }
    ctx.fillStyle = "#3f617e";
    ctx.beginPath();
    ctx.ellipse(.2, .3, .2, .06, .5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#14334a";
    ctx.beginPath();
    ctx.arc(.65, .02, .025, 0, Math.PI * 2);
    ctx.fill();
  } else if (animal.kind === "banc de crevettes") {
    for (let i = 0; i < 7; i++) {
      const offset = reducedMotion ? 0 : Math.sin(time * 3 + i * 1.7 + animal.phase) * .08;
      ctx.save();
      ctx.translate(((i * 37) % 11) / 11 * 1.6 - .8, ((i * 53) % 7) / 7 * 1.1 - .55 + offset);
      ctx.scale(.28, .28);
      ctx.strokeStyle = "#f6b39a";
      ctx.lineWidth = .25;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(0, 0, .6, Math.PI * .1, Math.PI * 1.1);
      ctx.stroke();
      ctx.fillStyle = "#f08f73";
      ctx.beginPath();
      ctx.moveTo(-.6, -.05);
      ctx.lineTo(-1, -.3);
      ctx.lineTo(-.95, .15);
      ctx.fill();
      ctx.strokeStyle = "#f6c7b7";
      ctx.lineWidth = .06;
      ctx.beginPath();
      ctx.moveTo(.55, .2);
      ctx.quadraticCurveTo(1.1, -.3, 1.4, .1);
      ctx.stroke();
      ctx.fillStyle = "#173c38";
      ctx.beginPath();
      ctx.arc(.45, .12, .08, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  } else if (animal.kind === "plongeur") {
    const kick = reducedMotion ? 0 : Math.sin(time * 3 + animal.phase) * .15;
    ctx.fillStyle = "#f0c35c";
    ctx.beginPath();
    ctx.roundRect(-.45, -.3, .7, .2, .08);
    ctx.fill();
    ctx.strokeStyle = "#1c3b4a";
    ctx.lineCap = "round";
    ctx.lineWidth = .17;
    ctx.beginPath();
    ctx.moveTo(-.3, .05);
    ctx.lineTo(-.85, kick);
    ctx.moveTo(-.3, .05);
    ctx.lineTo(-.85, .15 - kick);
    ctx.stroke();
    ctx.fillStyle = "#e17d5b";
    for (const [fy, sign] of [[kick, 1], [.15 - kick, -1]]) {
      ctx.beginPath();
      ctx.moveTo(-.85, fy - .08);
      ctx.lineTo(-1.2, fy + sign * .05 - .15);
      ctx.lineTo(-1.2, fy + sign * .05 + .1);
      ctx.lineTo(-.85, fy + .08);
      ctx.fill();
    }
    ctx.fillStyle = "#1c3b4a";
    ctx.beginPath();
    ctx.ellipse(0, .02, .45, .15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = .1;
    ctx.beginPath();
    ctx.moveTo(.25, .05);
    ctx.lineTo(.65, .2);
    ctx.stroke();
    ctx.fillStyle = "#f1c4a5";
    ctx.beginPath();
    ctx.arc(.55, -.05, .16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#8fd3e6";
    ctx.strokeStyle = "#e17d5b";
    ctx.lineWidth = .04;
    ctx.beginPath();
    ctx.ellipse(.65, -.07, .08, .1, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "#b6dfdf88";
    ctx.lineWidth = .025;
    for (let i = 0; i < 3; i++) {
      const rise = reducedMotion ? i * .2 : (time * .5 + i * .33 + animal.phase) % 1;
      ctx.beginPath();
      ctx.arc(.6 + Math.sin(rise * 8) * .05, -.3 - rise * .9, .04 + i * .015, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (animal.kind === "sous-marin") {
    ctx.fillStyle = "#e9b949";
    ctx.beginPath();
    ctx.ellipse(0, 0, 1, .38, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(-.2, -.62, .45, .3, .06);
    ctx.fill();
    ctx.strokeStyle = "#e9b949";
    ctx.lineWidth = .05;
    ctx.beginPath();
    ctx.moveTo(.1, -.62);
    ctx.lineTo(.1, -.85);
    ctx.lineTo(.25, -.85);
    ctx.stroke();
    ctx.fillStyle = "#c28f2b";
    ctx.beginPath();
    ctx.moveTo(-.95, -.05);
    ctx.lineTo(-1.25, -.3);
    ctx.lineTo(-1.25, .25);
    ctx.lineTo(-.95, .05);
    ctx.fill();
    const spin = reducedMotion ? .2 : Math.abs(Math.sin(time * 9));
    ctx.fillStyle = "#8f6a25";
    ctx.beginPath();
    ctx.ellipse(-1.3, 0, .04, .22 * spin + .03, 0, 0, Math.PI * 2);
    ctx.fill();
    for (const px of [-.4, 0, .4]) {
      ctx.fillStyle = "#8a6a24";
      ctx.beginPath();
      ctx.arc(px, 0, .14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#a9e4ee";
      ctx.beginPath();
      ctx.arc(px, 0, .1, 0, Math.PI * 2);
      ctx.fill();
    }
    const beam = ctx.createLinearGradient(1, 0, 2.2, 0);
    beam.addColorStop(0, "#fff7c055");
    beam.addColorStop(1, "#fff7c000");
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(.98, 0);
    ctx.lineTo(2.2, -.4);
    ctx.lineTo(2.2, .4);
    ctx.fill();
  } else if (animal.kind === "sirène") {
    const swish = reducedMotion ? 0 : Math.sin(time * 2 + animal.phase) * .18;
    ctx.fillStyle = "#c46a4a";
    ctx.beginPath();
    ctx.moveTo(.55, -.3);
    ctx.quadraticCurveTo(-.1, -.55, -.35, -.25);
    ctx.quadraticCurveTo(-.1, -.3, .3, -.1);
    ctx.fill();
    const tail = ctx.createLinearGradient(-1, 0, .2, 0);
    tail.addColorStop(0, "#5fc4b0");
    tail.addColorStop(1, "#3f93a8");
    ctx.fillStyle = tail;
    ctx.beginPath();
    ctx.moveTo(.15, -.12);
    ctx.quadraticCurveTo(-.4, -.18, -.85, swish);
    ctx.quadraticCurveTo(-.4, .2, .15, .15);
    ctx.fill();
    ctx.fillStyle = "#8ee0cc";
    ctx.beginPath();
    ctx.moveTo(-.8, swish);
    ctx.quadraticCurveTo(-1.1, swish - .4, -1.25, swish - .3);
    ctx.quadraticCurveTo(-1.05, swish, -1.25, swish + .3);
    ctx.quadraticCurveTo(-1.1, swish + .4, -.8, swish);
    ctx.fill();
    ctx.fillStyle = "#f2c9a8";
    ctx.beginPath();
    ctx.ellipse(.3, 0, .2, .13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#f2c9a8";
    ctx.lineWidth = .07;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(.35, -.05);
    ctx.lineTo(.7, -.3 + swish * .3);
    ctx.stroke();
    ctx.fillStyle = "#c870a0";
    for (const sy of [-.05, .06]) {
      ctx.beginPath();
      ctx.arc(.37, sy, .055, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#f2c9a8";
    ctx.beginPath();
    ctx.arc(.58, -.12, .15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#c46a4a";
    ctx.beginPath();
    ctx.arc(.55, -.2, .15, Math.PI * .85, Math.PI * 2.05);
    ctx.fill();
    ctx.fillStyle = "#173c38";
    ctx.beginPath();
    ctx.arc(.66, -.13, .025, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f3d48a";
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(.47 + i * .09, -.33 + (i === 1 ? -.04 : 0), .03, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawScene(seconds) {
  const background = ctx.createLinearGradient(0, 0, 0, height);
  background.addColorStop(0, "#267b80");
  background.addColorStop(.45, "#10505f");
  background.addColorStop(1, "#062d40");
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);
  for (let i = 0; i < 6; i++) {
    const x = width * (.07 + i * .18);
    const sway = reducedMotion ? 0 : Math.sin(time * .15 + i) * 18;
    const ray = ctx.createLinearGradient(x, 0, x + 100, height);
    ray.addColorStop(0, "#b5e7c213");
    ray.addColorStop(1, "#b5e7c200");
    ctx.fillStyle = ray;
    ctx.beginPath();
    ctx.moveTo(x + sway, 0);
    ctx.lineTo(x + 40 + sway, 0);
    ctx.lineTo(x + 230, height);
    ctx.lineTo(x + 70, height);
    ctx.fill();
  }
  for (let layer = 0; layer < 3; layer++) {
    ctx.fillStyle = ["#174954", "#143e47", "#225052"][layer];
    ctx.beginPath();
    ctx.moveTo(0, height);
    for (let x = 0; x <= width + 10; x += 10) {
      const y = height - 40 + layer * 18 + Math.sin(x / (120 + layer * 40) + layer * 2) * 16;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(width, height);
    ctx.fill();
  }
  for (const plant of plants) {
    const x = plant.x * width;
    const sway = reducedMotion ? 0 : Math.sin(time * .6 + plant.x * 10) * 9;
    ctx.strokeStyle = plant.back ? "#2d73736b" : "#4b8c7c88";
    ctx.lineWidth = plant.back ? 5 : 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x, height);
    ctx.bezierCurveTo(x - 15, height - plant.tall * .4, x + plant.bend + sway, height - plant.tall * .7, x + sway, height - plant.tall);
    ctx.stroke();
  }
  for (const bubble of bubbles) {
    if (!reducedMotion) bubble.y = (bubble.y - seconds * bubble.speed + 1) % 1;
    ctx.strokeStyle = "#b6dfdf26";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(bubble.x * width, bubble.y * height, bubble.radius, 0, Math.PI * 2);
    ctx.stroke();
  }
  // La boucle dessine de la fin vers le début : la baleine, placée en dernier, reste à l'arrière-plan.
  animals.sort((a, b) => (a.kind === "baleine") - (b.kind === "baleine"));
  for (let i = animals.length - 1; i >= 0; i--) {
    const animal = animals[i];
    if (!paused) {
      animal.age += seconds;
      if (animal.leaving) animal.exitAge += seconds;
      if (animal.kind !== "étoile de mer" && (animal.speed > 0 || animal.leaving)) {
        const speed = animal.leaving ? 1.8 : animal.age < .6 && !animal.rare && animal.kind !== "méduse" && animal.kind !== "murène" ? .35 : animal.rare && animal.age < 2 && animal.kind !== "poulpe" ? .12 : animal.speed;
        animal.x += seconds * speed * animal.direction;
      }
    }
    if (animal.leaving && animal.exitAge >= .45) {
      animals.splice(i, 1);
      continue;
    }
    if (!animal.leaving && animal.age >= (animal.rare ? 2 : .6)) {
      if (animal.x < .08) animal.direction = 1;
      if (animal.x > .92) animal.direction = -1;
    }
    drawAnimal(animal);
  }
}

function frame(timestamp) {
  const seconds = previousTime === undefined ? 0 : Math.min((timestamp - previousTime) / 1000, .1);
  previousTime = timestamp;
  if (!document.hidden) {
    if (!paused) time += seconds;
    if (mode !== "idle" && !paused) {
      if (mode === "micro" && analyser) {
        analyser.getFloatTimeDomainData(samples);
        level = rms(samples);
      } else if (mode === "demo") {
        level = Number($("demo-noise").value) / 100 * .3;
      }
      const count = model.update(level, thresholdFor(Number($("sensitivity").value)), seconds);
      let staying = animals.filter((animal) => !animal.leaving && !animal.rare).length;
      while (staying < count) { addAnimal(); staying++; }
      const rareKinds = rareAnimalsFor(model.silence);
      for (const animal of animals) {
        const tooMany = !animal.rare && staying > count;
        const rareScared = animal.rare && !rareKinds.includes(animal.kind);
        if (!animal.leaving && (tooMany || rareScared)) {
          animal.leaving = true;
          animal.direction = animal.x < .5 ? -1 : 1;
          if (tooMany) staying--;
        }
      }
      for (const kind of rareKinds) {
        if (!animals.some((animal) => animal.rare && !animal.leaving && animal.kind === kind)) addRareAnimal(kind);
      }
      const present = animals.filter((animal) => !animal.leaving);
      $("animal-count").textContent = present.length;
      $("animal-word").textContent = present.length > 1 ? "animaux" : "animal";
      $("rare-count").textContent = rareKinds.length ? `✦ ${rareKinds.length} rare${rareKinds.length > 1 ? "s" : ""}` : "";
      canvas.setAttribute("aria-label", present.length ? `Fond marin : ${present.length} animaux. Espèces présentes : ${[...new Set(present.map((animal) => animal.kind))].join(", ")}.` : "Fond marin : aucun animal.");
      $("scene-message").textContent = model.quiet ? "Le calme s'installe, la vie revient…" : "Un peu de douceur… les animaux se cachent.";
      $("sound-label").textContent = model.quiet ? "C'est tout calme" : "Les animaux se cachent";
      $("sound-fill").style.width = `${Math.min(level / .15, 1) * 100}%`;
      $("sound-fill").style.background = model.quiet ? "#d5e7b3" : "#e5a17f";
    } else {
      $("sound-label").textContent = paused ? "En pause · micro éteint" : "Micro désactivé";
      $("sound-fill").style.width = "0%";
    }
    drawScene(seconds);
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
