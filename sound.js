export const MAX_ANIMALS = 18;
export const ARRIVAL_SECONDS = 0.9;
export const DEPARTURE_SECONDS = 0.15;
export const RARE_ANIMALS = [
  { seconds: 15, kind: "tortue de mer" },
  { seconds: 30, kind: "hippocampe" },
  { seconds: 45, kind: "poulpe" },
  { seconds: 60, kind: "raie manta" },
  { seconds: 75, kind: "plongeur" },
  { seconds: 90, kind: "baleine" },
  { seconds: 105, kind: "sous-marin" },
  { seconds: 120, kind: "sirène" },
];
export const DESERT_RARE_ANIMALS = [
  "dromadaire", "gazelle", "tortue du désert", "suricate",
  "oryx", "autruche", "chouette du désert", "phénix",
].map((kind, index) => ({ seconds: RARE_ANIMALS[index].seconds, kind }));

export function rareAnimalsFor(silenceSeconds, animals = RARE_ANIMALS) {
  return animals.filter((animal) => silenceSeconds >= animal.seconds).map((animal) => animal.kind);
}

const BOOST_FROM = 80;
const MIN_THRESHOLD = 0.003;

export function thresholdFor(sensitivity) {
  const linear = (value) => 0.11 - (value / 100) * 0.095;
  if (sensitivity <= BOOST_FROM) return linear(sensitivity);
  // Au-delà de 80 %, le seuil décroît exponentiellement pour les micros faibles (mobiles sans gain automatique).
  const start = linear(BOOST_FROM);
  const progress = (sensitivity - BOOST_FROM) / (100 - BOOST_FROM);
  return start * (MIN_THRESHOLD / start) ** progress;
}

export function rms(samples) {
  if (samples.length === 0) return 0;
  return Math.sqrt(samples.reduce((sum, sample) => sum + sample * sample, 0) / samples.length);
}

export class QuietOcean {
  constructor() {
    this.count = 0;
    this.quiet = true;
    this.elapsed = 0;
    this.silence = 0;
  }

  update(level, threshold, seconds) {
    // L'hystérésis évite les allers-retours lorsque le volume frôle le seuil.
    const quiet = this.quiet ? level <= threshold : level < threshold * 0.8;
    if (quiet !== this.quiet) {
      this.elapsed = 0;
      if (!quiet) this.count = Math.max(0, this.count - 1);
    }
    this.quiet = quiet;
    this.silence = quiet ? this.silence + seconds : 0;
    this.elapsed += seconds;
    const intensity = Math.max(1, Math.min(4, level / threshold));
    const interval = quiet ? ARRIVAL_SECONDS : DEPARTURE_SECONDS / intensity;
    const steps = Math.floor(this.elapsed / interval);
    this.elapsed %= interval;
    this.count = Math.max(0, Math.min(MAX_ANIMALS, this.count + (quiet ? steps : -steps)));
    return this.count;
  }
}
