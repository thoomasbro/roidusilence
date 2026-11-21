# Le Roi du silence

Une application web pour inviter les enfants au calme : dans un fond marin animé qui occupe tout l'écran, les animaux arrivent avec le silence et repartent lorsque le bruit augmente.

## Démarrer

Avec Node.js 18 ou plus récent, sans dépendance à installer :

```sh
npm start
```

Ouvrir http://localhost:3000. Pour changer le port : `PORT=3001 npm start`.

## Explorer

- **Commencer l'exploration** demande l'autorisation du microphone. Le navigateur doit être sur localhost ou HTTPS.
- Un animal arrive toutes les 0,9 seconde de calme, jusqu'à 18 animaux : poissons, méduses, bancs de crevettes, étoiles de mer, murènes et requins. Les espèces alternent pour garantir leur diversité ; les étoiles apparaissent sur le fond et les autres animaux nagent ou flottent.
- Le bruit déclenche immédiatement un premier départ, puis un départ toutes les 0,15 seconde au maximum. Plus le bruit dépasse le seuil, plus les départs accélèrent (jusqu'à quatre fois plus vite). Un bruit fort déclenche le départ des 18 animaux en moins de 0,7 seconde ; chaque animation de sortie dure au maximum 0,45 seconde.
- Les **visiteurs rares** récompensent un silence continu : une tortue de mer après 15 secondes, un hippocampe après 30, un poulpe après 45, une raie manta après 60, un plongeur après 75, une baleine après 90, un sous-marin après 105 et une sirène après 2 minutes. Un message annonce chaque arrivée. Au moindre bruit, les visiteurs rares s'enfuient et le compteur de silence repart de zéro ; la pause conserve ce compteur.
- Le décor remplit la fenêtre. Ouvrir **Réglages de l'exploration** pour accéder au volume, à la sensibilité, à la pause et au bruit simulé ; replier le panneau pour profiter du décor.
- Régler la **sensibilité** selon le microphone et le bruit ambiant. Une sensibilité élevée exige davantage de silence ; elle est réglée par défaut sur « Élevée » (80/100). La baisser si les animaux fuient au moindre bruit de fond. Le volume affiché est relatif, pas une mesure en décibels.
- **Pause** éteint le microphone et conserve les animaux. **Reprendre** réactive le microphone.
- **Essayer sans microphone** permet de tester le comportement avec un curseur de bruit simulé.
- Les variations autour du seuil sont amorties pour éviter une alternance trop rapide entre calme et bruit.
- Aucun son n'est enregistré ou envoyé. Le traitement du volume se fait sur l'appareil. Les polices sont chargées depuis Google Fonts ; en leur absence, des polices locales prennent le relais.

Le prototype contient uniquement le fond marin. Il ne nécessite ni compte ni service distant pour fonctionner.

## Vérifier

```sh
npm test
```

Les tests couvrent l'arrivée et le départ des animaux, le départ immédiat et l'accélération en cas de bruit fort, les limites de population, l'interruption du silence, les paliers des animaux rares, la stabilité du seuil et le calcul du volume.

## Publier sur GitHub Pages

Le dépôt contient un workflow GitHub Actions qui lance les tests, construit le dossier `dist/` et publie le site lors d'un push sur `master` ou `main`.

Dans les réglages du dépôt GitHub, ouvre **Pages**, puis sélectionne **GitHub Actions** comme source. Chaque push sur la branche principale déclenchera ensuite un nouveau déploiement.
