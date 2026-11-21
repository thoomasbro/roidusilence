import test from "node:test";
import assert from "node:assert/strict";
import { QuietOcean, rms, thresholdFor, rareAnimalsFor, MAX_ANIMALS } from "./sound.js";

test("le silence fait arriver un animal en moins d'une seconde", () => {
  const ocean = new QuietOcean();
  assert.equal(ocean.update(0, 0.05, 0.89), 0);
  assert.equal(ocean.update(0, 0.05, 0.02), 1);
  assert.equal(ocean.update(0, 0.05, 1.8), 3);
  assert.equal(ocean.update(0, 0.05, 100), MAX_ANIMALS);
});

test("le bruit provoque un départ immédiat puis vide l'océan sans nombre négatif", () => {
  const ocean = new QuietOcean();
  ocean.update(0, 0.05, 100);
  assert.equal(ocean.update(0.051, 0.05, 0), MAX_ANIMALS - 1);
  assert.equal(ocean.update(0.051, 0.05, 0.15), MAX_ANIMALS - 2);
  assert.equal(ocean.update(0.1, 0.05, 20), 0);
});

test("un bruit fort vide une population complète en moins de 0,7 seconde", () => {
  const ocean = new QuietOcean();
  ocean.update(0, 0.05, 100);
  assert.equal(ocean.update(0.2, 0.05, 0.65), 0);
});

test("un bruit interrompt la durée de silence et le calme doit se réinstaller", () => {
  const ocean = new QuietOcean();
  ocean.update(0, 0.05, 0.89);
  ocean.update(0.1, 0.05, 0.1);
  assert.equal(ocean.update(0, 0.05, 0.2), 0);
  assert.equal(ocean.update(0, 0.05, 0.71), 1);
});

test("l'hystérésis stabilise l'état autour du seuil", () => {
  const ocean = new QuietOcean();
  ocean.update(0.051, 0.05, 0.1);
  ocean.update(0.045, 0.05, 0.1);
  assert.equal(ocean.quiet, false);
  ocean.update(0.039, 0.05, 0.1);
  assert.equal(ocean.quiet, true);
  ocean.update(0.049, 0.05, 0.1);
  assert.equal(ocean.quiet, true);
});

test("le volume prend en compte les deux signes et la sensibilité abaisse le seuil", () => {
  assert.equal(rms(new Float32Array([0.5, -0.5])), 0.5);
  assert.equal(rms(new Float32Array([0, 0])), 0);
  assert.ok(thresholdFor(0) > thresholdFor(50));
  assert.ok(thresholdFor(50) > thresholdFor(100));
  assert.ok(thresholdFor(100) > 0);
});

test("les animaux rares arrivent par paliers de silence continu", () => {
  assert.deepEqual(rareAnimalsFor(14.9), []);
  assert.deepEqual(rareAnimalsFor(15), ["tortue de mer"]);
  assert.deepEqual(rareAnimalsFor(30), ["tortue de mer", "hippocampe"]);
  assert.equal(rareAnimalsFor(1000).length, 5);
});

test("le bruit remet à zéro la durée de silence continu", () => {
  const ocean = new QuietOcean();
  ocean.update(0, 0.05, 20);
  assert.equal(ocean.silence, 20);
  ocean.update(0.1, 0.05, 0.1);
  assert.equal(ocean.silence, 0);
  ocean.update(0, 0.05, 5);
  assert.equal(ocean.silence, 5);
});
