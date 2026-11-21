export const desertSpecies = ["fennec", "lézard", "scarabée", "gerboise", "serpent", "oiseau"];

export const desertRareSettings = {
  dromadaire: { y: .7, size: 54, speed: .018 },
  gazelle: { y: .65, size: 42, speed: .03 },
  "tortue du désert": { y: .82, size: 30, speed: .008 },
  suricate: { y: .76, size: 28, speed: .012 },
  oryx: { y: .68, size: 48, speed: .02 },
  autruche: { y: .73, size: 48, speed: .025 },
  "chouette du désert": { y: .35, size: 35, speed: .025 },
  phénix: { y: .27, size: 65, speed: .025 },
};

export const desertRareNames = {
  dromadaire: "un dromadaire",
  gazelle: "une gazelle",
  "tortue du désert": "une tortue du désert",
  suricate: "un suricate",
  oryx: "un oryx",
  autruche: "une autruche",
  "chouette du désert": "une chouette du désert",
  phénix: "un phénix",
};

export function drawDesertScene(ctx, width, height, time, reducedMotion) {
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, "#614a64");
  sky.addColorStop(.52, "#c67d67");
  sky.addColorStop(1, "#e4ad78");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  const sunX = width * .73;
  const sunY = height * .32;
  const sunRadius = Math.min(width, height) * .105;
  const glow = ctx.createRadialGradient(sunX, sunY, sunRadius * .5, sunX, sunY, sunRadius * 3);
  glow.addColorStop(0, "#ffe9b770");
  glow.addColorStop(1, "#ffe9b700");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#ffe4ae";
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#a36b69";
  ctx.beginPath();
  ctx.moveTo(0, height * .62);
  for (let x = 0; x <= width + 10; x += 10) {
    ctx.lineTo(x, height * (.57 + .025 * Math.sin(x / width * 13) + .018 * Math.sin(x / width * 27)));
  }
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.fill();

  for (const [base, color, amplitude, phase] of [
    [.68, "#c18a72", .09, 0],
    [.78, "#d5a179", .11, 2],
    [.9, "#bc805e", .09, 4],
  ]) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, height);
    for (let x = 0; x <= width + 10; x += 10) {
      ctx.lineTo(x, height * (base + amplitude * Math.sin(x / width * 6 + phase)));
    }
    ctx.lineTo(width, height);
    ctx.fill();
  }

  ctx.strokeStyle = "#f5d0a45c";
  ctx.lineWidth = 2;
  for (let i = 0; i < 7; i++) {
    const x = width * (i + .2) / 7;
    const y = height * (.85 + (i % 3) * .045);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + 25, y - 5, x + 55, y);
    ctx.stroke();
  }
  for (let i = 0; i < 9; i++) {
    const x = width * (i + .3) / 9;
    const y = height * (.91 + (i % 3) * .025);
    const sway = reducedMotion ? 0 : Math.sin(time + i) * 2;
    ctx.strokeStyle = "#795e48";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    for (const offset of [-8, 0, 8]) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + offset * .4 + sway, y - 11, x + offset + sway, y - 18);
      ctx.stroke();
    }
  }
}

function ellipse(ctx, x, y, rx, ry, color, rotation = 0) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rotation, 0, Math.PI * 2);
  ctx.fill();
}

function line(ctx, color, width, points) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  for (const point of points.slice(1)) ctx.lineTo(...point);
  ctx.stroke();
}

export function drawDesertAnimal(ctx, animal, time, reducedMotion) {
  const kind = animal.kind;
  const step = reducedMotion ? 0 : Math.sin(time * 4 + animal.phase) * .13;
  const dark = "#593f38";
  if (kind === "oiseau" || kind === "chouette du désert" || kind === "phénix") {
    const color = kind === "phénix" ? "#e76f46" : kind === "chouette du désert" ? "#e1c49b" : "#805b4c";
    const flap = reducedMotion ? 0 : Math.sin(time * 3 + animal.phase) * .25;
    ellipse(ctx, 0, 0, .7, .23, color);
    ellipse(ctx, .55, -.13, .22, .2, color);
    ctx.fillStyle = kind === "phénix" ? "#f5bc63" : "#d7a85f";
    ctx.beginPath();
    ctx.moveTo(-.15, -.05);
    ctx.quadraticCurveTo(-.45, -.75 - flap, -.8, -.55 - flap);
    ctx.quadraticCurveTo(-.45, .05, -.15, .12);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-.6, .05);
    ctx.lineTo(-1.25, kind === "phénix" ? .55 : .18);
    ctx.lineTo(-.9, -.15);
    ctx.fill();
    ellipse(ctx, .7, -.16, .035, .035, dark);
    ctx.fillStyle = "#e9ae60";
    ctx.beginPath();
    ctx.moveTo(.73, -.08);
    ctx.lineTo(.98, .02);
    ctx.lineTo(.72, .07);
    ctx.fill();
    if (kind === "chouette du désert") {
      ellipse(ctx, .55, -.13, .13, .13, "#fff0d4");
      ellipse(ctx, .62, -.14, .045, .045, dark);
    }
  } else if (kind === "serpent") {
    ctx.strokeStyle = "#c5a15e";
    ctx.lineWidth = .23;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-1.1, .2);
    ctx.bezierCurveTo(-.7, -.4 + step, -.35, .45, .1, .1);
    ctx.quadraticCurveTo(.45, -.3, .7, -.1);
    ctx.stroke();
    ellipse(ctx, .75, -.1, .25, .16, "#d7b574");
    ellipse(ctx, .86, -.15, .035, .035, dark);
  } else if (kind === "lézard") {
    line(ctx, "#8c9a68", .16, [[-1.3, .15], [-.8, .3 + step], [-.4, .05]]);
    for (const side of [-1, 1]) {
      line(ctx, "#8c9a68", .1, [[-.2, side * .1], [-.35, side * .35], [-.55, side * .4]]);
      line(ctx, "#8c9a68", .1, [[.3, side * .1], [.2, side * .35], [0, side * .4]]);
    }
    ellipse(ctx, 0, 0, .58, .22, "#a9b47d");
    ellipse(ctx, .62, 0, .24, .16, "#a9b47d");
    ellipse(ctx, .75, -.06, .035, .035, dark);
  } else if (kind === "scarabée") {
    for (const x of [-.35, 0, .35]) {
      line(ctx, dark, .07, [[x, -.12], [x - .1, -.4], [x - .25, -.45]]);
      line(ctx, dark, .07, [[x, .12], [x - .1, .4], [x - .25, .45]]);
    }
    ellipse(ctx, 0, 0, .6, .42, "#476c69");
    ellipse(ctx, .53, 0, .2, .22, "#3b5958");
    line(ctx, "#8aab91", .025, [[-.5, 0], [.45, 0]]);
  } else if (kind === "tortue du désert") {
    for (const x of [-.35, .35]) {
      line(ctx, "#9d8b63", .18, [[x, .1], [x, .43]]);
    }
    ellipse(ctx, .65, .05, .25, .16, "#b8a678");
    ellipse(ctx, 0, -.05, .62, .4, "#8c7953");
    line(ctx, "#cbb788", .04, [[-.4, -.05], [0, -.3], [.4, -.05], [0, .2], [-.4, -.05]]);
    ellipse(ctx, .78, 0, .035, .035, dark);
  } else if (kind === "autruche") {
    line(ctx, "#b78a70", .1, [[-.25, .1], [-.35 + step, .8]]);
    line(ctx, "#b78a70", .1, [[.15, .1], [.25 - step, .8]]);
    line(ctx, "#b78a70", .13, [[.35, 0], [.65, -.7], [.8, -.85]]);
    ellipse(ctx, 0, 0, .62, .38, "#685350");
    ellipse(ctx, -.1, -.08, .38, .2, "#e4c4ae");
    ellipse(ctx, .82, -.85, .17, .14, "#d8ae95");
    ellipse(ctx, .9, -.88, .03, .03, dark);
  } else {
    const camel = kind === "dromadaire";
    const antelope = kind === "gazelle" || kind === "oryx";
    const meerkat = kind === "suricate";
    const mouse = kind === "gerboise";
    const color = camel ? "#c89466" : antelope ? "#d9b286" : meerkat ? "#bc9365" : mouse ? "#d4ad81" : "#e4b984";
    line(ctx, color, .12, [[-.48, .05], [-.8, -.05 + step], [-1, -.3]]);
    for (const x of [-.35, .3]) {
      line(ctx, color, .14, [[x, .15], [x + step, camel || antelope ? .75 : .48]]);
    }
    if (meerkat) {
      ellipse(ctx, 0, -.15, .25, .55, color);
      ellipse(ctx, .12, -.65, .25, .22, color);
    } else {
      if (camel) ellipse(ctx, -.1, -.35, .3, .4, color);
      ellipse(ctx, 0, 0, .6, .3, color);
      if (camel || antelope) line(ctx, color, .2, [[.35, -.05], [.6, -.55]]);
      ellipse(ctx, .65, camel || antelope ? -.55 : -.15, .28, .2, color);
    }
    const headX = meerkat ? .12 : .65;
    const headY = meerkat ? -.65 : camel || antelope ? -.55 : -.15;
    if (kind === "fennec" || mouse) {
      ellipse(ctx, headX - .12, headY - .25, .1, .3, color, -.25);
      ellipse(ctx, headX + .1, headY - .22, .1, .27, color, .2);
      ellipse(ctx, headX - .12, headY - .25, .045, .2, "#d58e83", -.25);
    }
    if (antelope) {
      line(ctx, dark, .045, [[headX - .1, headY - .15], [headX - .25, headY - (kind === "oryx" ? 1 : .65)]]);
      line(ctx, dark, .045, [[headX + .03, headY - .15], [headX, headY - (kind === "oryx" ? 1.05 : .7)]]);
    }
    ellipse(ctx, headX + .12, headY - .04, .035, .035, dark);
    ellipse(ctx, headX + .27, headY + .07, .045, .035, dark);
  }
}
