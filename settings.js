// Settings: language (English / French / Spanish), background music and sound effects.
// Everything is saved on this device (localStorage). All sounds and music are made in code
// with the Web Audio API, so there are no audio files and no licences to worry about.
// Translation works on the page itself: every English text that appears on screen is swapped
// for the chosen language, so the rest of the app can keep writing English.
(function () {
  const LS = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };

  // ================= Languages =================
  // One line per text: English | French | Spanish
  const DICT = `
Play|Jouer|Jugar
⚽ Penalty shootout|⚽ Tirs au but|⚽ Penaltis
⚽ Half-time penalty shootout|⚽ Tirs au but de la mi-temps|⚽ Penaltis del descanso
Take the penalties|Tirer les penalties|Tirar los penaltis
5 kicks against the keeper. Whoever scores more gets ×2 for 5 min at the start of the 2nd half.|5 tirs contre le gardien. Celui qui marque le plus gagne ×2 pendant 5 min au début de la 2e mi-temps.|5 tiros contra el portero. Quien marque más gana ×2 durante 5 min al inicio de la 2ª parte.
Your opponent has played. You have 2 minutes.|Ton adversaire a joué. Tu as 2 minutes.|Tu rival ya ha jugado. Tienes 2 minutos.
Your goals:|Tes buts :|Tus goles:
Waiting for your opponent…|On attend ton adversaire…|Esperando a tu rival…
Draw: no ×2 this time.|Égalité : pas de ×2 cette fois.|Empate: esta vez no hay ×2.
No shootout this time.|Pas de tirs au but cette fois.|Esta vez no hay penaltis.
wins ×2 for 5 min at the start of the 2nd half|gagne ×2 pendant 5 min au début de la 2e mi-temps|gana ×2 durante 5 min al inicio de la 2ª parte
won the penalty shootout: ×2 for 5 min|a gagné les tirs au but : ×2 pendant 5 min|ha ganado los penaltis: ×2 durante 5 min
Beat the computer to get ×2 for 5 min at the start of the 2nd half. If you don't play within 2 minutes, the computer wins.|Bats l’ordi pour gagner ×2 pendant 5 min au début de la 2e mi-temps. Si tu ne joues pas dans les 2 minutes, l’ordi gagne.|Gana a la máquina para tener ×2 durante 5 min al inicio de la 2ª parte. Si no juegas en 2 minutos, gana la máquina.
Both players, on this phone. The winner gets ×2 for 5 min at the start of the 2nd half.|Les deux joueurs, sur ce téléphone. Le gagnant a ×2 pendant 5 min au début de la 2e mi-temps.|Los dos jugadores, en este móvil. El ganador tiene ×2 durante 5 min al inicio de la 2ª parte.
⏱ Too late: the computer wins the penalty shootout|⏱ Trop tard : l’ordi gagne les tirs au but|⏱ Demasiado tarde: la máquina gana los penaltis
⚽ Penalty shootout (×2)|⚽ Tirs au but (×2)|⚽ Penaltis (×2)
Won the half-time shootout: points from 46′ to 50′ count double|Tirs au but gagnés : les points de la 46′ à la 50′ comptent double|Penaltis ganados: los puntos del 46′ al 50′ cuentan doble
⚽ Half-time penalties.|⚽ Tirs au but à la mi-temps.|⚽ Penaltis en el descanso.
At half-time, take a penalty shootout. The winner scores ×2 for 5 minutes at the start of the 2nd half. If you don't play within 2 minutes, your opponent wins.|À la mi-temps, joue les tirs au but. Le gagnant marque ×2 pendant 5 minutes au début de la 2e mi-temps. Si tu ne joues pas dans les 2 minutes, ton adversaire gagne.|En el descanso, juega los penaltis. El ganador suma ×2 durante 5 minutos al inicio de la 2ª parte. Si no juegas en 2 minutos, gana tu rival.
Penalty shootout|Tirs au but|Penaltis
You already took your penalties.|Tu as déjà tiré tes penalties.|Ya has tirado tus penaltis.
Too late: the 2 minutes are over.|Trop tard : les 2 minutes sont passées.|Demasiado tarde: los 2 minutos han pasado.
Friends|Amis|Amigos
Ranking|Classement|Ranking
Profile|Profil|Perfil
Rules|Règles|Reglas
Settings|Réglages|Ajustes
Language|Langue|Idioma
⇄ SWAP|⇄ ÉCHANGE|⇄ CAMBIO
🛡 Shield|🛡 Bouclier|🛡 Escudo
⚡ Double Points|⚡ Points doublés|⚡ Puntos dobles
Power-ups|Bonus|Poderes
Flipping…|Pile ou face…|Lanzando la moneda…
vs|contre|contra
Sound|Son|Sonido
Mute everything|Tout couper|Silenciar todo
Music|Musique|Música
Sound effects|Effets sonores|Efectos de sonido
Vibration|Vibration|Vibración
Background music, like in games|Musique de fond, comme dans les jeux|Música de fondo, como en los juegos
Goals, picks, power-ups and taps|Buts, choix, bonus et clics|Goles, elecciones, poderes y toques
Vibrate on goals and power-ups|Vibrer sur les buts et les bonus|Vibrar con goles y poderes
Turns off music and sound effects|Coupe la musique et les effets sonores|Apaga la música y los efectos
Music starts after your first tap.|La musique démarre après ton premier toucher.|La música empieza tras tu primer toque.
Unknown player|Joueur inconnu|Jugador desconocido
No connection to the app server. Check your internet and try again.|Pas de connexion au serveur. Vérifie ta connexion internet et réessaie.|Sin conexión con el servidor. Revisa tu internet e inténtalo de nuevo.
Live football data is unavailable right now. Practice matches still work.|Les données foot en direct sont indisponibles pour le moment. Les matchs d'entraînement marchent toujours.|Los datos de fútbol en directo no están disponibles ahora. Los partidos de práctica siguen funcionando.
The football data service answered with an error (|Le service de données foot a renvoyé une erreur (|El servicio de datos de fútbol respondió con un error (
World|Monde|Mundo
Postponed|Reporté|Aplazado
Cancelled|Annulé|Cancelado
Abandoned|Abandonné|Suspendido
You|Toi|Tú
Friend|Ami|Amigo
Computer|Ordinateur|Ordenador
your friend|ton ami|tu amigo
Back to matches|Retour aux matchs|Volver a los partidos
Yesterday|Hier|Ayer
Today|Aujourd'hui|Hoy
Tomorrow|Demain|Mañana
⏸ Real matches are taking a short break.|⏸ Les vrais matchs font une petite pause.|⏸ Los partidos reales están en una breve pausa.
Our live football data isn't available right now. Practice matches below still work, so you can play a duel anyway.|Nos données foot en direct ne sont pas disponibles pour le moment. Les matchs d'entraînement ci-dessous marchent toujours, tu peux donc jouer un duel quand même.|Nuestros datos de fútbol en directo no están disponibles ahora. Los partidos de práctica de abajo siguen funcionando, así que puedes jugar un duelo igualmente.
Try again|Réessayer|Reintentar
Couldn't load matches.|Impossible de charger les matchs.|No se pudieron cargar los partidos.
No matches on this day. Try another day, or play a practice match below.|Aucun match ce jour-là. Essaie un autre jour, ou joue un match d'entraînement ci-dessous.|No hay partidos este día. Prueba otro día o juega un partido de práctica abajo.
Hide other matches|Masquer les autres matchs|Ocultar otros partidos
More matches (|Plus de matchs (|Más partidos (
No other top-league matches. Untick "Top leagues only".|Aucun autre match des grands championnats. Décoche « Grands championnats seulement ».|No hay más partidos de las grandes ligas. Desmarca «Solo grandes ligas».
Top leagues only|Grands championnats seulement|Solo grandes ligas
Duel in progress|Duel en cours|Duelo en curso
Open|Ouvrir|Abrir
Your duel|Ton duel|Tu duelo
Online duel|Duel en ligne|Duelo en línea
Tap to open|Touche pour ouvrir|Toca para abrir
🧪 Preview version: these are fake matches, so no API requests are used.|🧪 Version test : ce sont de faux matchs, aucune requête API n'est utilisée.|🧪 Versión de prueba: son partidos falsos, no se usan peticiones a la API.
data requests left today on your API plan|requêtes restantes aujourd'hui sur ton forfait API|peticiones restantes hoy en tu plan de API
1v1 live football duels|Duels de foot en direct 1 contre 1|Duelos de fútbol en directo 1 contra 1
Practice|Entraînement|Práctica
Derby day|Jour de derby|Día de derbi
Cup · Quarter-final|Coupe · Quart de finale|Copa · Cuartos de final
Other|Autres|Otros
⭐ Top matches ·|⭐ Grands matchs ·|⭐ Grandes partidos ·
Tap one to play|Touche un match pour jouer|Toca uno para jugar
Fake match, runs fast|Faux match, en accéléré|Partido falso, va rápido
Day|Jour|Día
How do you want to play?|Comment veux-tu jouer ?|¿Cómo quieres jugar?
Friend online|Ami en ligne|Amigo en línea
You each play on your own phone. Send them a link.|Chacun joue sur son téléphone. Envoie-lui un lien.|Cada uno juega en su móvil. Envíale un enlace.
Only for real matches.|Seulement pour les vrais matchs.|Solo para partidos reales.
Only before or during the match.|Seulement avant ou pendant le match.|Solo antes o durante el partido.
Same phone|Même téléphone|Mismo móvil
Pass the phone to pick players, then watch together.|Passez-vous le téléphone pour choisir les joueurs, puis regardez ensemble.|Pasaos el móvil para elegir jugadores y luego mirad juntos.
Play solo against the computer.|Joue seul contre l'ordinateur.|Juega solo contra el ordenador.
Your name|Ton nom|Tu nombre
Player 1|Joueur 1|Jugador 1
Player 2|Joueur 2|Jugador 2
Player 3|Joueur 3|Jugador 3
Send this link to your friends|Envoie ce lien à tes amis|Envía este enlace a tus amigos
Waiting for players|En attente des joueurs|Esperando a los jugadores
When everyone has joined, the draft order is drawn at random. Then you pick in a snake: 1-2-3-4, then 4-3-2-1.|Quand tout le monde est là, l'ordre de choix est tiré au sort. Puis on choisit en serpent : 1-2-3-4, puis 4-3-2-1.|Cuando todos se hayan unido, el orden se sortea. Luego se elige en serpiente: 1-2-3-4 y después 4-3-2-1.
You pick first!|Tu choisis en premier !|¡Eliges primero!
This game is full.|Cette partie est complète.|Esta partida está completa.
All players have already joined.|Tous les joueurs sont déjà là.|Todos los jugadores ya se han unido.
(you)|(toi)|(tú)
Player 4|Joueur 4|Jugador 4
Players|Joueurs|Jugadores
Draft order|Ordre de choix|Orden de elección
Drawing…|Tirage au sort…|Sorteo…
picks first!|choisit en premier !|¡elige primero!
Order:|Ordre :|Orden:
picks again!|rechoisit tout de suite !|¡vuelve a elegir!
Everyone has 2 players. Forfeits are only for 2-player duels.|Tout le monde a 2 joueurs. Les gages, c'est seulement pour les duels à 2.|Todos tienen 2 jugadores. Las prendas son solo para duelos de 2.
It's a tie|Égalité|Empate
Play again|Rejouer|Jugar otra vez
3 players|3 joueurs|3 jugadores
4 players|4 joueurs|4 jugadores
Create duel & invite|Créer le duel et inviter|Crear duelo e invitar
Start duel|Lancer le duel|Empezar duelo
Close|Fermer|Cerrar
Replay as a duel|Rejouer en duel|Repetir como duelo
Play live now|Jouer en direct|Jugar en directo
Play this match|Jouer ce match|Jugar este partido
No player list is available for this match yet.|Aucune liste de joueurs n'est encore disponible pour ce match.|Aún no hay lista de jugadores para este partido.
Couldn't load players.|Impossible de charger les joueurs.|No se pudieron cargar los jugadores.
Taken by|Pris par|Elegido por
Starting|Titulaire|Titular
Bench|Remplaçant|Suplente
Squad|Effectif|Plantilla
Forwards score more often, defenders pick up more cards. Stars show current form.|Les attaquants marquent plus souvent, les défenseurs prennent plus de cartons. Les étoiles montrent la forme du moment.|Los delanteros marcan más, los defensas ven más tarjetas. Las estrellas muestran la forma actual.
Official lineups are out. Starters are listed first.|Les compos officielles sont sorties. Les titulaires sont en premier.|Ya están las alineaciones oficiales. Los titulares aparecen primero.
Lineups usually appear about an hour before kickoff. Until then you see the whole squad, so a pick might not play.|Les compos sortent en général une heure avant le coup d'envoi. D'ici là tu vois tout l'effectif, donc un joueur choisi peut ne pas jouer.|Las alineaciones suelen salir una hora antes del inicio. Hasta entonces ves toda la plantilla, así que un elegido podría no jugar.
Captain|Capitaine|Capitán
scores ×1.5, good and bad|marque ×1,5, en bien comme en mal|puntúa ×1,5, para bien y para mal
🔒 Propose a forfeit for|🔒 Propose un gage pour|🔒 Propón una prenda para
if they lose|s'il perd|si pierde
has to accept it before kickoff)|doit l'accepter avant le coup d'envoi)|tiene que aceptarla antes del inicio)
(optional. They have to accept it before kickoff)|(facultatif. Il doit l'accepter avant le coup d'envoi)|(opcional. Tiene que aceptarla antes del inicio)
(optional.|(facultatif.|(opcional.
(optional,|(facultatif,|(opcional,
has to accept it)|doit l'accepter)|tiene que aceptarla)
Leave empty to play just for fun|Laisse vide pour jouer juste pour le plaisir|Déjalo vacío para jugar solo por diversión
Pick|Choisir|Elegir
Lock in picks|Valider les choix|Confirmar elección
· Draft|· Draft|· Draft
Pick 2 players|Choisis 2 joueurs|Elige 2 jugadores
Now picking|Au tour de|Ahora elige
Both|Les deux|Ambos
of 2 picked|sur 2 choisis|de 2 elegidos
Filter by team|Filtrer par équipe|Filtrar por equipo
Your friend|Ton ami|Tu amigo
Your pick|Ton choix|Tu elección
Picked by|Choisi par|Elegido por
Draft complete|Draft terminé|Draft completo
is picking…|choisit…|está eligiendo…
Your turn|À toi|Tu turno
· Same phone|· Même téléphone|· Mismo móvil
Coin toss|Pile ou face|Cara o cruz
Start the draft|Lancer le draft|Empezar el draft
won the toss!|a gagné le pile ou face !|¡ha ganado el sorteo!
picks first, then you take turns.|choisit en premier, puis chacun son tour.|elige primero y luego os turnáis.
, start picking|, commence à choisir|, empieza a elegir
, your pick|, à toi de choisir|, te toca elegir
↶ Undo last pick|↶ Annuler le dernier choix|↶ Deshacer la última elección
: forfeit for|: gage pour|: prenda para
Lock in & go to kickoff|Valider et aller au coup d'envoi|Confirmar e ir al inicio
Pick locked|Choix validé|Elección confirmada
Pass the phone to|Passe le téléphone à|Pasa el móvil a
, my turn|, à moi|, me toca
has locked in|a validé|ha confirmado
No peeking. Both lineups are revealed at kickoff.|Pas de triche. Les deux équipes sont révélées au coup d'envoi.|Sin mirar. Las dos alineaciones se revelan al inicio.
, show players|, voir les joueurs|, ver jugadores
Kickoff|Coup d'envoi|Inicio
Swapped|Échangé|Cambiado
Subbed|Remplacé|Sustituido
Captain ×1.5|Capitaine ×1,5|Capitán ×1,5
· sent off|· expulsé|· expulsado
Locked|Bloqué|Bloqueado
Active ·|Actif ·|Activo ·
′ left|′ restantes|′ restantes
Used|Utilisé|Usado
Locked in the final 10′|Bloqué dans les 10 dernières′|Bloqueado en los 10′ finales
Tap to use|Touche pour utiliser|Toca para usar
Wait for play|Attends que le jeu reprenne|Espera a que se juegue
Double the points of which of your players?|Doubler les points de quel joueur ?|¿Doblar los puntos de cuál de tus jugadores?
Flip the points of which of their players?|Inverser les points de quel joueur adverse ?|¿Invertir los puntos de cuál de sus jugadores?
Cancel|Annuler|Cancelar
Each power-up works once per match, and not from the 80th minute. Timing is in match minutes.|Chaque bonus marche une fois par match, et pas à partir de la 80e minute. Le temps est en minutes de match.|Cada poder funciona una vez por partido, y no desde el minuto 80. El tiempo va en minutos de partido.
No players available.|Aucun joueur disponible.|No hay jugadores disponibles.
Take|Sortir|Saca a
out. Points he already earned stay; the new player only scores from now. One swap per match.|. Ses points déjà gagnés restent ; le nouveau joueur marque à partir de maintenant. Un échange par match.|. Sus puntos ya ganados se quedan; el nuevo jugador puntúa desde ahora. Un cambio por partido.
⇄ Swap a player|⇄ Échanger un joueur|⇄ Cambiar un jugador
out. Points already earned stay; the new player only scores from now. One trade per match, and you keep seeing what|. Les points déjà gagnés restent ; le nouveau joueur marque à partir de maintenant. Un seul échange par match, et tu continues de voir ce que|. Los puntos ya ganados se quedan; el nuevo jugador puntúa desde ahora. Un cambio por partido, y sigues viendo lo que
scores after.|marque ensuite.|puntúa después.
⇄ Trade a player|⇄ Échanger un joueur|⇄ Cambiar un jugador
Trade|Échanger|Cambiar
Trade used|Échange utilisé|Cambio usado
Traded|Échangé|Cambiado
⇄ Trade|⇄ Échange|⇄ Cambio
since|depuis|desde
since the trade|depuis l’échange|desde el cambio
Feed|Direct|Directo
Select|Choisir|Elegir
⚡ Power-ups|⚡ Bonus|⚡ Poderes
Buys the next kebab|Paie le prochain kebab|Paga el próximo kebab
Wears my team's shirt tomorrow|Porte le maillot de mon équipe demain|Lleva la camiseta de mi equipo mañana
Posts the result on their story|Poste le résultat en story|Sube el resultado a su historia
Uses a profile photo I choose for 3 days|Met la photo de profil que je choisis pendant 3 jours|Usa la foto de perfil que yo elija durante 3 días
Buys the drinks next match night|Paie les verres au prochain soir de match|Paga las bebidas la próxima noche de partido
Sings the winner's club anthem on video|Chante l'hymne du club du gagnant en vidéo|Canta el himno del club del ganador en vídeo
Double Points|Points doublés|Puntos dobles
One of your players scores ×2 for 10 min|Un de tes joueurs marque ×2 pendant 10 min|Uno de tus jugadores puntúa ×2 durante 10 min
Shield|Bouclier|Escudo
🎯 Pass Master|🎯 Maître passeur|🎯 Maestro del pase
🧱 The Wall|🧱 Le Mur|🧱 El Muro
💥 Sniper|💥 Sniper|💥 Francotirador
Pass Master|Maître passeur|Maestro del pase
The Wall|Le Mur|El Muro
Sniper|Sniper|Francotirador
×3 on passes, key passes and assists for 10 min|×3 sur les passes, passes clés et passes décisives pendant 10 min|×3 en pases, pases clave y asistencias durante 10 min
×3 on tackles, interceptions, blocks, duels won and saves for 10 min|×3 sur les tacles, interceptions, contres, duels gagnés et arrêts pendant 10 min|×3 en entradas, intercepciones, bloqueos, duelos ganados y paradas durante 10 min
×3 on shots and goals for 10 min|×3 sur les tirs et les buts pendant 10 min|×3 en tiros y goles durante 10 min
⚡ Double Points: One of your players scores ×2 for 10 min|⚡ Points doublés : un de tes joueurs marque ×2 pendant 10 min|⚡ Puntos dobles: uno de tus jugadores puntúa ×2 durante 10 min
🛡 Shield: Your players lose no points for 15 min|🛡 Bouclier : tes joueurs ne perdent aucun point pendant 15 min|🛡 Escudo: tus jugadores no pierden puntos durante 15 min
🎯 Pass Master: ×3 on passes, key passes and assists for 10 min|🎯 Maître passeur : ×3 sur les passes, passes clés et passes décisives pendant 10 min|🎯 Maestro del pase: ×3 en pases, pases clave y asistencias durante 10 min
🧱 The Wall: ×3 on tackles, interceptions, blocks, duels won and saves for 10 min|🧱 Le Mur : ×3 sur les tacles, interceptions, contres, duels gagnés et arrêts pendant 10 min|🧱 El Muro: ×3 en entradas, intercepciones, bloqueos, duelos ganados y paradas durante 10 min
💥 Sniper: ×3 on shots and goals for 10 min|💥 Sniper : ×3 sur les tirs et les buts pendant 10 min|💥 Francotirador: ×3 en tiros y goles durante 10 min
Use it on which of your players?|Sur lequel de tes joueurs ?|¿En cuál de tus jugadores?
📋 Points table|📋 Barème des points|📋 Tabla de puntos
Attack|Attaque|Ataque
Passing|Passes|Pases
Defending|Défense|Defensa
Goalkeeper|Gardien|Portero
Mistakes|Erreurs|Errores
Block (shot or pass blocked)|Contre (tir ou passe bloqué)|Bloqueo (tiro o pase bloqueado)
Goal conceded (goalkeeper)|But encaissé (gardien)|Gol encajado (portero)
Failed dribble|Dribble raté|Regate fallido
Offside|Hors-jeu|Fuera de juego
Dribbled past by an opponent|Dribblé par un adversaire|Regateado por un rival
Penalty conceded|Penalty concédé|Penalti cometido
Your players lose no points for 15 min|Tes joueurs ne perdent aucun point pendant 15 min|Tus jugadores no pierden puntos durante 15 min
⚽ +1 ×2 from the penalties: both your players, 46′–50′|⚽ +1 ×2 grâce aux tirs au but : tes deux joueurs, de 46′ à 50′|⚽ +1 ×2 por los penaltis: tus dos jugadores, del 46′ al 50′
Half time|Mi-temps|Descanso
The 90 minutes play out in about a minute and a half. You can speed it up.|Les 90 minutes se jouent en une minute et demie environ. Tu peux accélérer.|Los 90 minutos se juegan en un minuto y medio más o menos. Puedes acelerarlo.
This match has finished, so it replays minute by minute. Passes, tackles and other stats are added at full time.|Ce match est terminé, il est donc rejoué minute par minute. Les passes, tacles et autres stats sont ajoutés à la fin.|Este partido ha terminado, así que se repite minuto a minuto. Pases, entradas y otras estadísticas se suman al final.
Scores update about once a minute while the match is live. You can close the app and come back; the duel is saved on this phone.|Les scores se mettent à jour environ une fois par minute pendant le match. Tu peux fermer l'appli et revenir ; le duel est sauvegardé sur ce téléphone.|Los puntos se actualizan más o menos cada minuto durante el partido. Puedes cerrar la app y volver; el duelo se guarda en este móvil.
✓ Accepted by|✓ Accepté par|✓ Aceptado por
Waiting for|En attente de|Esperando a
to accept or refuse…|pour accepter ou refuser…|para aceptar o rechazar…
: accept|: accepter|: aceptar
Refuse|Refuser|Rechazar
Forfeit from|Gage de|Prenda de
, if they lose:|, s'il perd :|, si pierde:
Only accepted forfeits count. Anything not accepted at kickoff is dropped.|Seuls les gages acceptés comptent. Ce qui n'est pas accepté au coup d'envoi est annulé.|Solo cuentan las prendas aceptadas. Lo no aceptado al inicio se descarta.
Kick off|Coup d'envoi|Empezar
Start replay|Lancer le replay|Empezar repetición
Follow live|Suivre en direct|Seguir en directo
Picks locked|Choix validés|Elecciones confirmadas
Lineups revealed|Équipes révélées|Alineaciones reveladas
No connection. Check your internet and try again.|Pas de connexion. Vérifie ta connexion internet et réessaie.|Sin conexión. Revisa tu internet e inténtalo de nuevo.
Something went wrong.|Un problème est survenu.|Algo ha salido mal.
Creating your duel…|Création de ton duel…|Creando tu duelo…
Player|Joueur|Jugador
· Online duel|· Duel en ligne|· Duelo en línea
You won the toss!|Tu as gagné le pile ou face !|¡Has ganado el sorteo!
You pick first.|Tu choisis en premier.|Eliges primero.
won the toss.|a gagné le pile ou face.|ha ganado el sorteo.
They pick first, you pick second.|Il choisit en premier, toi en second.|Elige primero, tú en segundo lugar.
⚽ Duel me on|⚽ Affronte-moi sur|⚽ Rétame en
! Join here and we draft our players:|! Rejoins ici et on choisit nos joueurs :|! Únete aquí y elegimos nuestros jugadores:
Your picks are locked|Tes choix sont validés|Tus elecciones están confirmadas
Invite your friend|Invite ton ami|Invita a tu amigo
Send this link to your friend|Envoie ce lien à ton ami|Envía este enlace a tu amigo
💬 Send on WhatsApp|💬 Envoyer sur WhatsApp|💬 Enviar por WhatsApp
Other apps|Autres applis|Otras apps
Copy link|Copier le lien|Copiar enlace
When they join, a coin flip decides who picks first. Then you take turns: one player each, twice. No one can pick the same player.|Quand il arrive, un pile ou face décide qui choisit en premier. Puis chacun son tour : un joueur chacun, deux fois. Personne ne peut prendre le même joueur.|Cuando se una, una moneda decide quién elige primero. Luego os turnáis: un jugador cada uno, dos veces. Nadie puede elegir el mismo jugador.
joined and is picking players…|est arrivé et choisit ses joueurs…|se ha unido y está eligiendo jugadores…
Waiting for your friend to join…|En attente de ton ami…|Esperando a que tu amigo se una…
Invite copied. Paste it in WhatsApp|Invitation copiée. Colle-la dans WhatsApp|Invitación copiada. Pégala en WhatsApp
Link copied|Lien copié|Enlace copiado
Can't open this duel.|Impossible d'ouvrir ce duel.|No se puede abrir este duelo.
This duel is full.|Ce duel est complet.|Este duelo está completo.
Two players have already joined.|Deux joueurs ont déjà rejoint.|Ya se han unido dos jugadores.
challenged you to a duel on this match.|t'a défié en duel sur ce match.|te ha retado a un duelo en este partido.
Not now|Pas maintenant|Ahora no
Accept the duel|Accepter le duel|Aceptar el duelo
Go to the app|Aller sur l'appli|Ir a la app
You've been challenged|Tu as été défié|Te han retado
Pick 2 players from a real match and beat your friend on goals, assists, tackles and more.|Choisis 2 joueurs d'un vrai match et bats ton ami sur les buts, passes décisives, tacles et plus.|Elige 2 jugadores de un partido real y gana a tu amigo con goles, asistencias, entradas y más.
Every point ×2 · power-ups locked|Chaque point ×2 · bonus bloqués|Cada punto ×2 · poderes bloqueados
Chat with your friend|Discuter avec ton ami|Chatea con tu amigo
Chat|Chat|Chat
Send|Envoyer|Enviar
Report|Signaler|Denunciar
Report this player|Signaler ce joueur|Denunciar a este jugador
Close chat|Fermer le chat|Cerrar chat
Say something…|Dis quelque chose…|Di algo…
Chat with|Discuter avec|Chatear con
Unmute|Réactiver|Reactivar
Mute|Masquer|Silenciar
You muted|Tu as masqué|Has silenciado a
Talk trash, celebrate goals. Only you and|Chambre, fête les buts. Seuls toi et|Pica, celebra los goles. Solo tú y
see this.|voyez ceci.|veis esto.
Tap to confirm|Touche pour confirmer|Toca para confirmar
Thanks. We got your report and muted|Merci. On a reçu ton signalement et masqué|Gracias. Hemos recibido tu denuncia y silenciado a
Paused|En pause|En pausa
1st half|1re mi-temps|1.ª parte
2nd half|2e mi-temps|2.ª parte
VAR cancel|VAR annulé|VAR anulado
2nd yellow|2e jaune|2.ª amarilla
This match was not found.|Ce match est introuvable.|No se encontró este partido.
red card|carton rouge|tarjeta roja
yellow card|carton jaune|tarjeta amarilla
Did not play|N'a pas joué|No jugó
Replay|Replay|Repetición
Extra time|Prolongations|Prórroga
Penalties|Tirs au but|Penaltis
Full time|Fin du match|Final
Not started|Pas commencé|No empezado
Full-match stats:|Stats du match complet :|Estadísticas del partido:
, assist|, passe décisive|, asistencia
Own goal|But contre son camp|Gol en propia
. No points.|. Pas de points.|. Sin puntos.
Missed penalty,|Penalty raté,|Penalti fallado,
Yellow card,|Carton jaune,|Tarjeta amarilla,
Second yellow|Deuxième jaune|Segunda amarilla
is sent off|est expulsé|es expulsado
Straight red|Rouge direct|Roja directa
VAR: goal ruled out.|VAR : but refusé.|VAR: gol anulado.
's goal at|: son but à|: su gol en el
is cancelled and the points are taken back.|est annulé et les points sont retirés.|se anula y se retiran los puntos.
Substitution|Remplacement|Sustitución
Practice match|Match d'entraînement|Partido de práctica
· preview (fake match)|· test (faux match)|· prueba (partido falso)
Pause|Pause|Pausa
Speed|Vitesse|Velocidad
Refresh now|Actualiser|Actualizar
Simulated|Simulé|Simulado
Live data|Données en direct|Datos en directo
Match feed|Fil du match|Directo del partido
Assist|Passe décisive|Asistencia
Goal|But|Gol
GOAL!|BUT !|¡GOL!
🔥 FINAL 10′|🔥 10 DERNIÈRES′|🔥 10′ FINALES
Penalty missed|Penalty raté|Penalti fallado
Yellow card|Carton jaune|Tarjeta amarilla
Red card|Carton rouge|Tarjeta roja
VAR: goal cancelled|VAR : but annulé|VAR: gol anulado
· blocked 🛡|· bloqué 🛡|· bloqueado 🛡
⇄ Swap|⇄ Échange|⇄ Cambio
🔥 Final 10 minutes: every point counts ×2, power-ups are locked|🔥 10 dernières minutes : chaque point compte ×2, les bonus sont bloqués|🔥 10 minutos finales: cada punto cuenta ×2, los poderes están bloqueados
Update failed.|La mise à jour a échoué.|Falló la actualización.
The score shown is from the last good update.|Le score affiché vient de la dernière mise à jour réussie.|La puntuación mostrada es de la última actualización correcta.
Loading the match…|Chargement du match…|Cargando el partido…
Waiting for kickoff. Your players' actions will show up here.|En attente du coup d'envoi. Les actions de tes joueurs apparaîtront ici.|Esperando el inicio. Las acciones de tus jugadores aparecerán aquí.
Goals, assists and cards will show up here as they happen.|Les buts, passes décisives et cartons apparaîtront ici en direct.|Goles, asistencias y tarjetas aparecerán aquí al momento.
Not updated yet|Pas encore mis à jour|Aún sin actualizar
requests left|requêtes restantes|peticiones restantes
came on|entré|entró
swapped in at|échangé à|cambiado en el
subbed off|remplacé|sustituido
swapped out at|sorti par échange à|sacado por cambio en el
No scoring events|Aucune action qui rapporte des points|Sin acciones con puntos
🔥 Final 10′ (×2)|🔥 10 dernières′ (×2)|🔥 10′ finales (×2)
Points scored from the 80th minute count double|Les points marqués à partir de la 80e minute comptent double|Los puntos desde el minuto 80 cuentan doble
Ⓒ Captain bonus (×1.5)|Ⓒ Bonus capitaine (×1,5)|Ⓒ Bonus de capitán (×1,5)
Half of the captain's points added on top|La moitié des points du capitaine en plus|La mitad de los puntos del capitán, de extra
, blocked by a Shield|, bloqué par un Bouclier|, bloqueado por un Escudo
, changed|, a changé|, cambió
Used at|Utilisé à|Usado en el
It's a draw|Match nul|Es un empate
You win|Tu gagnes|Ganas
🤝 Draw.|🤝 Match nul.|🤝 Empate.
Both forfeits stay locked.|Les deux gages restent verrouillés.|Las dos prendas siguen bloqueadas.
🔓 Forfeit unlocked|🔓 Gage débloqué|🔓 Prenda desbloqueada
Chosen by|Choisi par|Elegida por
must:|doit :|tiene que:
won but didn't set a forfeit.|a gagné mais n'avait pas mis de gage.|ganó pero no puso prenda.
got lucky.|a eu de la chance.|ha tenido suerte.
Final points use the official full-match stats from API-Football.|Les points finaux utilisent les stats officielles du match complet d'API-Football.|Los puntos finales usan las estadísticas oficiales del partido de API-Football.
Full time ·|Fin du match ·|Final ·
📸 Share result card|📸 Partager la carte du résultat|📸 Compartir tarjeta del resultado
Copy result as text|Copier le résultat en texte|Copiar resultado como texto
New match|Nouveau match|Nuevo partido
Rematch|Revanche|Revancha
Draw!|Match nul !|¡Empate!
Forfeit for|Gage pour|Prenda para
Copied|Copié|Copiado
How to play|Comment jouer|Cómo se juega
Pick a real match and choose 2 players. Your friend picks theirs.|Prends un vrai match et choisis 2 joueurs. Ton ami choisit les siens.|Elige un partido real y escoge 2 jugadores. Tu amigo elige los suyos.
Follow the match live. Every pass, shot, tackle and goal scores points.|Suis le match en direct. Chaque passe, tir, tacle et but rapporte des points.|Sigue el partido en directo. Cada pase, tiro, entrada y gol da puntos.
Use power-ups and your swap at the right moment. Highest score wins.|Utilise tes bonus et ton échange au bon moment. Le meilleur score gagne.|Usa tus poderes y tu cambio en el momento justo. Gana la puntuación más alta.
🔥 Final 10′.|🔥 10 dernières′.|🔥 10′ finales.
From the 80th minute every point counts double, and power-ups can no longer be used. Your swap still works.|À partir de la 80e minute chaque point compte double, et les bonus ne sont plus utilisables. Ton échange marche toujours.|Desde el minuto 80 cada punto cuenta doble y ya no se pueden usar poderes. Tu cambio sigue funcionando.
How points work|Comment marchent les points|Cómo funcionan los puntos
Penalty saved (goalkeeper)|Penalty arrêté (gardien)|Penalti parado (portero)
Penalty won|Penalty obtenu|Penalti provocado
Shot on target|Tir cadré|Tiro a puerta
Goalkeeper save|Arrêt du gardien|Parada del portero
Key pass (a pass that leads to a shot)|Passe clé (une passe qui mène à un tir)|Pase clave (un pase que acaba en tiro)
Successful dribble|Dribble réussi|Regate exitoso
Tackle|Tacle|Entrada
Interception|Interception|Intercepción
Shot off target|Tir non cadré|Tiro fuera
Duel won|Duel gagné|Duelo ganado
Foul won|Faute obtenue|Falta recibida
Completed pass|Passe réussie|Pase completado
Missed pass|Passe ratée|Pase fallado
Foul committed|Faute commise|Falta cometida
Red card (second yellow: −25 in total)|Carton rouge (deuxième jaune : −25 au total)|Tarjeta roja (segunda amarilla: −25 en total)
⚡ Double Points: everything your chosen player earns counts double|⚡ Points doublés : tout ce que gagne ton joueur choisi compte double|⚡ Puntos dobles: todo lo que gana tu jugador elegido cuenta doble
🛡 Shield: your players lose no points (fouls, cards, missed passes…)|🛡 Bouclier : tes joueurs ne perdent aucun point (fautes, cartons, passes ratées…)|🛡 Escudo: tus jugadores no pierden puntos (faltas, tarjetas, pases fallados…)
⚽ Half-time penalties: the winner scores ×2 on both players|⚽ Tirs au but de la mi-temps : le gagnant marque ×2 sur ses deux joueurs|⚽ Penaltis del descanso: el ganador puntúa ×2 con sus dos jugadores
Each of you gets one of each per match, plus one ⇄ Swap: take one of your players out and bring in anyone on the pitch. Points already earned stay. If your player is subbed off, the player coming on takes his place automatically. Use them while the ball is in play. Timing is in match minutes.|Chacun en a un de chaque par match, plus un ⇄ Échange : sors un de tes joueurs et fais entrer n'importe qui sur le terrain. Les points déjà gagnés restent. Si ton joueur est remplacé, le joueur qui entre prend sa place automatiquement. Utilise-les quand le ballon est en jeu. Le temps est en minutes de match.|Cada uno tiene uno de cada por partido, más un ⇄ Cambio: saca a uno de tus jugadores y mete a cualquiera del campo. Los puntos ya ganados se quedan. Si sustituyen a tu jugador, el que entra ocupa su lugar automáticamente. Úsalos con el balón en juego. El tiempo va en minutos de partido.
Both of you can pick the same player. Pick before kickoff. Practice matches score goals, assists and cards only. Finished real matches are replayed minute by minute.|Vous pouvez choisir le même joueur tous les deux. Choisis avant le coup d'envoi. Les matchs d'entraînement comptent seulement les buts, passes décisives et cartons. Les vrais matchs terminés sont rejoués minute par minute.|Podéis elegir los dos al mismo jugador. Elige antes del inicio. Los partidos de práctica solo cuentan goles, asistencias y tarjetas. Los partidos reales terminados se repiten minuto a minuto.
Your league|Ta ligue|Tu liga
Top players|Meilleurs joueurs|Mejores jugadores
🏆 Friends league|🏆 Ligue entre amis|🏆 Liga de amigos
Make your player card to add friends, see win streaks and climb the rankings. Only online duels count, so every win is against a real friend.|Crée ta carte de joueur pour ajouter des amis, voir les séries de victoires et grimper au classement. Seuls les duels en ligne comptent, donc chaque victoire est contre un vrai ami.|Crea tu tarjeta de jugador para añadir amigos, ver rachas y subir en el ranking. Solo cuentan los duelos en línea, así que cada victoria es contra un amigo de verdad.
Create|Créer|Crear
Already have an account? Sign in on the Profile tab|Déjà un compte ? Connecte-toi dans l'onglet Profil|¿Ya tienes cuenta? Inicia sesión en la pestaña Perfil
Your player name|Ton nom de joueur|Tu nombre de jugador
in a row|d'affilée|seguidas
Your player card|Ta carte de joueur|Tu tarjeta de jugador
Friend code|Code ami|Código de amigo
Wins|Victoires|Victorias
Streak|Série|Racha
Best|Record|Récord
You:|Toi :|Tú:
wins. Win online duels to enter the top 20.|victoires. Gagne des duels en ligne pour entrer dans le top 20.|victorias. Gana duelos en línea para entrar en el top 20.
No ranked players yet. Win an online duel to be first.|Personne au classement pour l'instant. Gagne un duel en ligne pour être le premier.|Aún no hay nadie en el ranking. Gana un duelo en línea para ser el primero.
Add a friend or play an online duel to start your league.|Ajoute un ami ou joue un duel en ligne pour lancer ta ligue.|Añade un amigo o juega un duelo en línea para empezar tu liga.
Add|Ajouter|Añadir
Invite|Inviter|Invitar
Friends you duel online are added automatically.|Les amis que tu affrontes en ligne sont ajoutés automatiquement.|Los amigos contra los que juegas en línea se añaden automáticamente.
Friends ranking|Classement des amis|Ranking de amigos
Pick a name first|Choisis d'abord un nom|Elige primero un nombre
Could not create your card. Try again.|Impossible de créer ta carte. Réessaie.|No se pudo crear tu tarjeta. Inténtalo de nuevo.
Friend added|Ami ajouté|Amigo añadido
Add me on Football Live Duel and let's duel on the next match ⚽|Ajoute-moi sur Football Live Duel et affrontons-nous sur le prochain match ⚽|Añádeme en Football Live Duel y nos retamos en el próximo partido ⚽
Invite copied|Invitation copiée|Invitación copiada
Friend added to your league|Ami ajouté à ta ligue|Amigo añadido a tu liga
One match. Two players each.|Un match. Deux joueurs chacun.|Un partido. Dos jugadores cada uno.
Pick a real football match and choose 2 players. Your friend does the same, on their own phone.|Prends un vrai match de foot et choisis 2 joueurs. Ton ami fait pareil, sur son téléphone.|Elige un partido de fútbol real y escoge 2 jugadores. Tu amigo hace lo mismo en su móvil.
Every touch counts.|Chaque ballon compte.|Cada toque cuenta.
Passes, shots, tackles, goals and assists score live points. Cards and fouls cost you.|Passes, tirs, tacles, buts et passes décisives rapportent des points en direct. Les cartons et les fautes te coûtent.|Pases, tiros, entradas, goles y asistencias dan puntos en directo. Tarjetas y faltas te restan.
Play your power-ups.|Joue tes bonus.|Usa tus poderes.
Double your player, shield yourself from minus points, or swap a player who's having a bad day.|Double ton joueur, protège-toi des points négatifs, ou échange un joueur qui passe une mauvaise journée.|Dobla a tu jugador, protégete de los puntos negativos, o cambia a un jugador que tiene un mal día.
Pick your player name|Choisis ton nom de joueur|Elige tu nombre de jugador
It's how friends find you and how you show up in the rankings.|C'est comme ça que tes amis te trouvent et que tu apparais au classement.|Así te encuentran tus amigos y así apareces en el ranking.
e.g. Lukas|ex. Lukas|p. ej. Lukas
Skip|Passer|Saltar
Let's play|C'est parti|A jugar
Next|Suivant|Siguiente
Setting up…|Préparation…|Preparando…
pts · top scorer|pts · meilleur marqueur|pts · máximo anotador
Pick 2 players. Watch live. Beat your friends.|Choisis 2 joueurs. Regarde en direct. Bats tes amis.|Elige 2 jugadores. Mira en directo. Gana a tus amigos.
Making your card…|Création de ta carte…|Creando tu tarjeta…
Image saved|Image enregistrée|Imagen guardada
Could not make the image|Impossible de créer l'image|No se pudo crear la imagen
First win|Première victoire|Primera victoria
Win a duel|Gagne un duel|Gana un duelo
Comeback king|Roi de la remontada|Rey de la remontada
Win after trailing at half time|Gagne en étant mené à la mi-temps|Gana yendo por detrás al descanso
Power-up master|Maître des bonus|Maestro de los poderes
Gain 50+ pts from power-ups in one duel|Gagne 50+ pts grâce aux bonus dans un duel|Gana 50+ pts con poderes en un duelo
On fire|En feu|En racha
Win 3 in a row|Gagne 3 fois d'affilée|Gana 3 seguidas
Unstoppable|Inarrêtable|Imparable
Win 5 in a row|Gagne 5 fois d'affilée|Gana 5 seguidas
Clean sweep|Carton plein|Paliza
Win by 100+ pts|Gagne avec 100+ pts d'écart|Gana por 100+ pts
No swap needed|Pas besoin d'échange|Sin cambios
Win a real match without swapping|Gagne un vrai match sans échange|Gana un partido real sin cambiar
Online|En ligne|En línea
Play a duel on two phones|Joue un duel sur deux téléphones|Juega un duelo en dos móviles
Social|Social|Social
Have 3 friends|Aie 3 amis|Ten 3 amigos
Regular|Habitué|Habitual
Play 10 duels|Joue 10 duels|Juega 10 duelos
Badges|Badges|Insignias
with Google|avec Google|con Google
Tap again to delete your account for good|Touche encore pour supprimer ton compte définitivement|Toca otra vez para borrar tu cuenta para siempre
Delete my account|Supprimer mon compte|Borrar mi cuenta
Account|Compte|Cuenta
Signed in|Connecté|Sesión iniciada
. Your stats, friends and badges are saved on every phone where you sign in.|. Tes stats, amis et badges sont sauvegardés sur chaque téléphone où tu te connectes.|. Tus estadísticas, amigos e insignias se guardan en cada móvil donde inicies sesión.
Sign out|Se déconnecter|Cerrar sesión
Preview test code:|Code de test :|Código de prueba:
We sent a 6-digit code to|On a envoyé un code à 6 chiffres à|Hemos enviado un código de 6 cifras a
Sign in|Se connecter|Iniciar sesión
Use another email|Utiliser un autre e-mail|Usar otro correo
Get code|Recevoir le code|Recibir código
Your email|Ton e-mail|Tu correo
Save your profile|Sauvegarde ton profil|Guarda tu perfil
Sign in to keep your stats, friends and badges, and play on any phone. Your duels on this phone come with you.|Connecte-toi pour garder tes stats, amis et badges, et jouer sur n'importe quel téléphone. Tes duels sur ce téléphone te suivent.|Inicia sesión para guardar tus estadísticas, amigos e insignias, y jugar en cualquier móvil. Tus duelos de este móvil vienen contigo.
By signing in you accept the|En te connectant tu acceptes la|Al iniciar sesión aceptas la
privacy policy|politique de confidentialité|política de privacidad
Signed in. Your stats were added to your account|Connecté. Tes stats ont été ajoutées à ton compte|Sesión iniciada. Tus estadísticas se han añadido a tu cuenta
Enter your email|Entre ton e-mail|Escribe tu correo
Enter the 6-digit code|Entre le code à 6 chiffres|Escribe el código de 6 cifras
Signed out|Déconnecté|Sesión cerrada
Your account and data are deleted|Ton compte et tes données sont supprimés|Tu cuenta y tus datos se han borrado
Saved in your account|Sauvegardé dans ton compte|Guardado en tu cuenta
Saved on this phone|Sauvegardé sur ce téléphone|Guardado en este móvil
Real match|Vrai match|Partido real
Won|Gagnés|Ganados
Drawn|Nuls|Empates
Lost|Perdus|Perdidos
Goal sound|Son des buts|Sonido de gol
Change your player name|Changer ton nom de joueur|Cambiar tu nombre de jugador
Recent duels|Duels récents|Duelos recientes
No duels yet. Pick a match on the Play tab to play your first one.|Pas encore de duel. Choisis un match dans l'onglet Jouer pour jouer ton premier.|Aún no hay duelos. Elige un partido en la pestaña Jugar para jugar el primero.
Clear history|Effacer l'historique|Borrar historial
Privacy policy|Politique de confidentialité|Política de privacidad
Tap again to clear all duels|Touche encore pour effacer tous les duels|Toca otra vez para borrar todos los duelos
Main|Principal|Principal
Unlimited online duels. Thank you!|Duels en ligne illimités. Merci !|Duelos en línea ilimitados. ¡Gracias!
Online duels today|Duels en ligne aujourd'hui|Duelos en línea hoy
Online duels this week|Duels en ligne cette semaine|Duelos en línea esta semana
Free plan:|Offre gratuite :|Plan gratis:
online duel a day,|duel en ligne par jour,|duelo en línea al día,
a week. Practice games are always free.|par semaine. Les matchs d'entraînement sont toujours gratuits.|a la semana. Los partidos de práctica siempre son gratis.
Play as many duels as you want.|Joue autant de duels que tu veux.|Juega todos los duelos que quieras.
Go premium|Passer premium|Hazte premium
Turn premium off|Désactiver premium|Desactivar premium
Turn premium on (test)|Activer premium (test)|Activar premium (prueba)
Test only (no payment): you see this because you are a tester.|Test seulement (pas de paiement) : tu vois ceci car tu es testeur.|Solo prueba (sin pago): ves esto porque eres tester.
Unlimited online duels with your friends, every day|Duels en ligne illimités avec tes amis, chaque jour|Duelos en línea ilimitados con tus amigos, cada día
All power-ups, chat, forfeits and badges, like now|Tous les bonus, le chat, les gages et les badges, comme maintenant|Todos los poderes, chat, prendas e insignias, como ahora
Support a small independent app|Soutiens une petite appli indépendante|Apoya una pequeña app independiente
Payments are coming soon. Practice and same-phone games stay free.|Les paiements arrivent bientôt. L'entraînement et les parties sur le même téléphone restent gratuits.|Los pagos llegarán pronto. La práctica y las partidas en el mismo móvil siguen gratis.
Coming soon|Bientôt|Próximamente
⭐ Go premium|⭐ Passer premium|⭐ Hazte premium
Manage premium|Gérer premium|Gestionar premium
Sign in below to keep your plan on every phone.|Connecte-toi ci-dessous pour garder ton offre sur chaque téléphone.|Inicia sesión abajo para mantener tu plan en cada móvil.
Your plan|Ton offre|Tu plan
`;

  // Texts with numbers or names inside: [pattern, French, Spanish]
  const PATTERNS = [
    [/Updated (\d+(?:s| min)) ago/g, 'Mis à jour il y a $1', 'Actualizado hace $1'],
    [/Form (\d) of 3/g, 'Forme $1 sur 3', 'Forma $1 de 3'],
    [/Goal, ([^!]+)!/g, 'But, $1 !', '¡Gol, $1!'],
    [/^Used (.+) on (.+) for (\d+) min$/g, 'A utilisé $1 sur $2 pendant $3 min', 'Usó $1 en $2 durante $3 min'],
    [/ used $/g, ' a utilisé ', ' usó '],
    [/^ on (.+) for (\d+) min$/g, ' sur $1 pendant $2 min', ' en $1 durante $2 min'],
    [/^(.+) · (.+) on (.+)$/g, '$1 · $2 sur $3', '$1 · $2 en $3'],
    [/^⭐ Top matches · (.+)$/g, '⭐ Grands matchs · $1', '⭐ Grandes partidos · $1'],
    [/^FLIP (\d+)′$/g, 'INVERSÉ $1′', 'INVERTIDO $1′'],
    [/^(\d)\/(\d) used$/g, '$1/$2 utilisés', '$1/$2 usados'],
    [/^vs (.+)$/g, 'contre $1', 'contra $1'],
    [/ · \+(\d+) for you$/g, ' · +$1 pour toi', ' · +$1 para ti'],
    [/ · \+(\d+) for (.+)$/g, ' · +$1 pour $2', ' · +$1 para $2'],
    [/ (\d+) of (\d+)$/g, ' $1 sur $2', ' $1 de $2'],
    [/(\d+)W (\d+)D (\d+)L/g, '$1V $2N $3D', '$1G $2E $3P'],
    [/ \(you\)$/g, ' (toi)', ' (tú)'],
    [/^(.+) wins!?$/g, '$1 gagne', '$1 gana'],
    [/^(.+) vs (.+)$/g, '$1 contre $2', '$1 contra $2'],
    [/(\d+)′ (goal|assist|yellow|red|own goal|stats|VAR cancel|2nd yellow) /g, (l, m, w) => ({ fr: { goal: 'but', assist: 'passe déc.', yellow: 'jaune', red: 'rouge', 'own goal': 'csc', stats: 'stats', 'VAR cancel': 'VAR annulé', '2nd yellow': '2e jaune' }, es: { goal: 'gol', assist: 'asist.', yellow: 'amarilla', red: 'roja', 'own goal': 'p. propia', stats: 'stats', 'VAR cancel': 'VAR anulado', '2nd yellow': '2.ª amarilla' } })[l][w]],
    [/ · next in (\S+)/g, ' · suivante dans $1', ' · siguiente en $1'],
    [/^Pick (\d) more$/g, 'Encore $1 à choisir', 'Elige $1 más'],
    [/^(\d+)\/(\d+) unlocked$/g, '$1/$2 débloqués', '$1/$2 desbloqueadas']
  ];

  // Player stat lines ("+2 completed passes, 1 tackle +4")
  const STATW = {"completed pass": ["passe réussie", "pase completado"], "completed passes": ["passes réussies", "pases completados"], "missed pass": ["passe ratée", "pase fallado"], "missed passes": ["passes ratées", "pases fallados"], "key pass": ["passe clé", "pase clave"], "key passes": ["passes clés", "pases clave"], "shot on target": ["tir cadré", "tiro a puerta"], "shots on target": ["tirs cadrés", "tiros a puerta"], "shot off target": ["tir non cadré", "tiro fuera"], "shots off target": ["tirs non cadrés", "tiros fuera"], "successful dribble": ["dribble réussi", "regate exitoso"], "successful dribbles": ["dribbles réussis", "regates exitosos"], "failed dribble": ["dribble raté", "regate fallido"], "failed dribbles": ["dribbles ratés", "regates fallidos"], "tackle": ["tacle", "entrada"], "tackles": ["tacles", "entradas"], "interception": ["interception", "intercepción"], "interceptions": ["interceptions", "intercepciones"], "block": ["contre", "bloqueo"], "blocks": ["contres", "bloqueos"], "duel won": ["duel gagné", "duelo ganado"], "duels won": ["duels gagnés", "duelos ganados"], "time dribbled past": ["fois dribblé", "vez regateado"], "times dribbled past": ["fois dribblé", "veces regateado"], "foul won": ["faute obtenue", "falta recibida"], "fouls won": ["fautes obtenues", "faltas recibidas"], "foul committed": ["faute commise", "falta cometida"], "fouls committed": ["fautes commises", "faltas cometidas"], "offside": ["hors-jeu", "fuera de juego"], "offsides": ["hors-jeu", "fueras de juego"], "save": ["arrêt", "parada"], "saves": ["arrêts", "paradas"], "goal conceded (keeper)": ["but encaissé (gardien)", "gol encajado (portero)"], "goals conceded (keeper)": ["buts encaissés (gardien)", "goles encajados (portero)"], "penalty won": ["penalty obtenu", "penalti provocado"], "penalties won": ["penaltys obtenus", "penaltis provocados"], "penalty conceded": ["penalty concédé", "penalti cometido"], "penalties conceded": ["penaltys concédés", "penaltis cometidos"], "penalty missed": ["penalty raté", "penalti fallado"], "penalties missed": ["penaltys ratés", "penaltis fallados"], "penalty saved": ["penalty arrêté", "penalti parado"], "penalties saved": ["penaltys arrêtés", "penaltis parados"], "goal": ["but", "gol"], "goals": ["buts", "goles"], "assist": ["passe décisive", "asistencia"], "assists": ["passes décisives", "asistencias"], "own goal": ["csc", "gol en propia"], "power-ups": ["bonus", "poderes"]};
  const STATRX = new RegExp('(^|, | · |[+−-]?\\d+ )(' + ["goals conceded (keeper)", "goal conceded (keeper)", "successful dribbles", "times dribbled past", "successful dribble", "time dribbled past", "penalties conceded", "completed passes", "shots off target", "penalty conceded", "penalties missed", "shots on target", "shot off target", "failed dribbles", "fouls committed", "penalties saved", "completed pass", "shot on target", "failed dribble", "foul committed", "penalty missed", "missed passes", "interceptions", "penalties won", "penalty saved", "interception", "missed pass", "penalty won", "key passes", "duels won", "fouls won", "power-ups", "key pass", "duel won", "foul won", "offsides", "own goal", "tackles", "offside", "assists", "tackle", "blocks", "assist", "block", "saves", "goals", "save", "goal"].map(w => w.replace(/[()]/g, '\\$&')).join('|') + ')(?=$|,| [+−]| ·)', 'g');
  const SUP = ['en', 'fr', 'es'];
  const COL = { fr: 1, es: 2 };
  const EXACT = { fr: new Map(), es: new Map() };
  const FRAGS = []; // multi-word texts that can sit inside a longer line, longest first
  const norm = s => s.replace(/\s+/g, ' ').trim();
  DICT.split('\n').forEach(line => {
    if (!line.includes('|')) return;
    const p = line.split('|');
    const en = norm(p[0]);
    if (!en) return;
    EXACT.fr.set(en, p[1]); EXACT.es.set(en, p[2]);
    if (/\s/.test(en) && en.length > 4 && p[1]) FRAGS.push([p[0], p[1], p[2]]);
  });
  FRAGS.sort((a, b) => b[0].length - a[0].length);

  function detect() {
    const l = ((navigator.languages && navigator.languages[0]) || navigator.language || 'en').slice(0, 2).toLowerCase();
    return SUP.includes(l) ? l : 'en';
  }
  let lang = LS.get('fld.lang', null);
  if (!SUP.includes(lang)) lang = detect();

  // Remember translations: the live screen shows the same texts again and again
  const memo = new Map();
  function tr(s) {
    if (lang === 'en' || !s || !/[A-Za-z]/.test(s)) return s;
    const hit = memo.get(s);
    if (hit !== undefined) return hit;
    const out = tr0(s);
    if (memo.size > 3000) memo.clear();
    memo.set(s, out);
    return out;
  }
  function tr0(s) {
    const m = s.match(/^(\s*)([\s\S]*?)(\s*)$/);
    const core = norm(m[2]);
    const map = EXACT[lang], c = COL[lang];
    let out = map.get(core);
    if (out == null) {
      const keep = [];
      const hold = v => '\u0002' + (keep.push(v) - 1) + '\u0003';
      out = m[2];
      PATTERNS.forEach(p => { p[0].lastIndex = 0; if (p[0].test(out)) { p[0].lastIndex = 0; out = out.replace(p[0], (...a) => typeof p[1] === 'function' ? hold(a[0].replace(/(\d+′ )(.+?)( )$/, (_, x, w, y) => x + p[1](lang, a[1], a[2]) + y)) : hold(p[c].replace(/\$(\d)/g, (_, i) => { const g = a[+i]; const x = map.get(norm(g)); return x == null ? g : x; }))); } });
      out = out.replace(STATRX, (x, pre, w) => /\d/.test(pre) ? pre + hold(STATW[w][c - 1]) : x);
      for (const f of FRAGS) if (out.includes(f[0])) out = out.split(f[0]).join(hold(f[c]));
      if (out.includes(' · ')) out = out.split(' · ').map(x => { const y = map.get(norm(x)); return y == null ? x : y; }).join(' · ');
      out = out.replace(/\u0002(\d+)\u0003/g, (_, i) => keep[+i]);
      if (out === m[2]) return s;
    }
    return m[1] + out + m[3];
  }

  // Watch the page and translate every text as it appears
  const seen = new WeakMap(); // text node -> {src, out}
  const SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, NOSCRIPT: 1 };
  const ATTRS = ['placeholder', 'aria-label', 'title'];
  function doText(n) {
    const p = n.parentNode;
    if (!p || SKIP[p.nodeName] || (p.closest && p.closest('[data-noi18n]'))) return;
    const cur = n.data, rec = seen.get(n);
    const src = rec && rec.out === cur ? rec.src : cur;
    const out = tr(src);
    seen.set(n, { src, out });
    if (out !== cur) n.data = out;
  }
  function doAttrs(el) {
    if (!el.getAttribute || (el.closest && el.closest('[data-noi18n]'))) return;
    const store = el.__i18n || (el.__i18n = {});
    ATTRS.forEach(a => {
      const cur = el.getAttribute(a);
      if (cur == null) return;
      const rec = store[a];
      const src = rec && rec.out === cur ? rec.src : cur;
      const out = tr(src);
      store[a] = { src, out };
      if (out !== cur) el.setAttribute(a, out);
    });
  }
  function walk(root) {
    if (root.nodeType === 3) return doText(root);
    if (root.nodeType !== 1 || SKIP[root.nodeName]) return;
    doAttrs(root);
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    let n;
    while ((n = w.nextNode())) { if (n.nodeType === 3) doText(n); else doAttrs(n); }
  }
  const mo = new MutationObserver(list => {
    for (const r of list) {
      if (r.type === 'characterData') doText(r.target);
      else if (r.type === 'attributes') doAttrs(r.target);
      else r.addedNodes.forEach(walk);
    }
  });
  function startI18n() {
    document.documentElement.lang = lang;
    walk(document.body);
    mo.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  }
  if (document.body) startI18n(); else document.addEventListener('DOMContentLoaded', startI18n);

  // Pop-up boxes and the share image are not part of the page, so translate them on the way in
  const _prompt = window.prompt, _confirm = window.confirm, _alert = window.alert;
  window.prompt = (m, d) => _prompt.call(window, tr(String(m == null ? '' : m)), d);
  window.confirm = m => _confirm.call(window, tr(String(m == null ? '' : m)));
  window.alert = m => _alert.call(window, tr(String(m == null ? '' : m)));
  try {
    const _fill = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function (t, ...r) { return _fill.call(this, tr(String(t)), ...r); };
    const _meas = CanvasRenderingContext2D.prototype.measureText;
    CanvasRenderingContext2D.prototype.measureText = function (t) { return _meas.call(this, tr(String(t))); };
  } catch (e) {}

  function setLang(l) {
    if (!SUP.includes(l)) return;
    lang = l; memo.clear(); LS.set('fld.lang', l);
    document.documentElement.lang = l;
    walk(document.body);
  }

  // ================= Sound =================
  const opt = () => ({
    all: LS.get('fld.muteAll', false),
    music: LS.get('fld.music', true),
    sfx: LS.get('fld.sound', true)
  });
  let ctx = null, master, musicBus, sfxBus, delay, unlocked = false;
  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
      musicBus = ctx.createGain(); musicBus.gain.value = 0; musicBus.connect(master);
      sfxBus = ctx.createGain(); sfxBus.connect(master);
      // soft echo for the music melody
      delay = ctx.createDelay(1); delay.delayTime.value = 0.47;
      const fb = ctx.createGain(); fb.gain.value = 0.28;
      const dl = ctx.createGain(); dl.gain.value = 0.35;
      delay.connect(fb).connect(delay); delay.connect(dl).connect(musicBus);
    }
    if (ctx.state === 'suspended' && document.visibilityState === 'visible') ctx.resume().catch(() => {});
    return ctx;
  }
  function applyGains() {
    if (!ctx) return;
    const o = opt(), t = ctx.currentTime;
    musicBus.gain.cancelScheduledValues(t);
    musicBus.gain.setTargetAtTime(!o.all && o.music ? 0.55 : 0, t, 0.15);
    sfxBus.gain.setTargetAtTime(!o.all && o.sfx ? 1 : 0, t, 0.02);
    if (!o.all && o.music) startMusic(); else stopMusic();
  }

  // --- tiny synth helpers ---
  function tone(dest, f, t, dur, { type = 'triangle', vol = 0.2, a = 0.01, f2 = null, q = null } = {}) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let last = o;
    if (q) { const fl = ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = q; o.connect(fl); last = fl; }
    last.connect(g).connect(dest);
    o.start(t); o.stop(t + dur + 0.05);
  }
  let noiseBuf = null;
  function noise(dest, t, dur, { vol = 0.1, type = 'bandpass', freq = 1000, q = 1, a = 0.005 } = {}) {
    if (!noiseBuf) { noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; f.type = type; f.frequency.value = freq; f.Q.value = q;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g).connect(dest); s.start(t, Math.random()); s.stop(t + dur + 0.05);
  }
  const hz = m => 440 * Math.pow(2, (m - 69) / 12); // MIDI note -> frequency

  // --- background music: a calm, upbeat menu loop (original, made here) ---
  // 4 chords, 2 bars each, 100 beats per minute, notes in 8ths
  const BPM = 100, STEP = 60 / BPM / 2;
  const CHORDS = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]; // Am F C G
  const ARP = [0, 1, 2, 1, 2, 3, 2, 1];
  const MEL = [76, -1, 74, 72, -1, 72, 74, -1, 72, -1, 69, -1, 67, -1, -1, -1, 72, -1, 71, 69, -1, 67, 69, -1, 71, -1, 74, -1, 71, -1, -1, -1];
  let mTimer = null, mNext = 0, mStep = 0;
  function musicStep(i, t) {
    const bar = Math.floor(i / 8), ch = CHORDS[Math.floor(bar / 2) % 4], s8 = i % 8, round = Math.floor(i / 64) % 2;
    // soft kick on beats 1 and 3, hat on the off-beats
    if (s8 === 0 || s8 === 4) tone(musicBus, 120, t, 0.25, { type: 'sine', vol: 0.32, f2: 45, a: 0.003 });
    if (s8 % 2 === 1) noise(musicBus, t, 0.05, { vol: 0.05, type: 'highpass', freq: 7000 });
    if (s8 === 4) noise(musicBus, t, 0.14, { vol: 0.06, type: 'bandpass', freq: 1800, q: 0.8 });
    // bass
    if (s8 === 0 || s8 === 3 || s8 === 6) tone(musicBus, hz(ch[0] - 12), t, STEP * 1.8, { type: 'sine', vol: 0.22, a: 0.01 });
    // pad at the start of each bar
    if (s8 === 0) ch.forEach(n => { tone(musicBus, hz(n), t, STEP * 8, { type: 'triangle', vol: 0.035, a: 0.25, q: 1100 }); tone(musicBus, hz(n) * 1.004, t, STEP * 8, { type: 'sawtooth', vol: 0.012, a: 0.3, q: 900 }); });
    // pluck arpeggio
    const n = ARP[s8] === 3 ? ch[0] + 12 : ch[ARP[s8]] + 12;
    tone(musicBus, hz(n), t, 0.22, { type: 'square', vol: 0.022, a: 0.004, q: 2400 });
    // little melody on the second time round, with echo
    if (round === 1) { const mn = MEL[i % 32]; if (mn > 0) { tone(musicBus, hz(mn), t, STEP * 1.6, { type: 'triangle', vol: 0.06, a: 0.01 }); tone(delay, hz(mn), t, STEP * 1.6, { type: 'triangle', vol: 0.05, a: 0.01 }); } }
  }
  function startMusic() {
    if (mTimer || !ctx || !unlocked) return;
    mNext = ctx.currentTime + 0.1;
    mTimer = setInterval(() => {
      if (!ctx || ctx.state !== 'running') return;
      if (mNext < ctx.currentTime) mNext = ctx.currentTime + 0.05;
      while (mNext < ctx.currentTime + 0.25) { musicStep(mStep, mNext); mStep = (mStep + 1) % 128; mNext += STEP; }
    }, 60);
  }
  function stopMusic() { if (mTimer) { clearInterval(mTimer); mTimer = null; } }
  function duck(sec) {
    if (!ctx) return; const o = opt(); if (o.all || !o.music) return;
    const t = ctx.currentTime, g = musicBus.gain;
    g.cancelScheduledValues(t); g.setTargetAtTime(0.15, t, 0.05); g.setTargetAtTime(0.55, t + sec, 0.4);
  }

  // --- sound effects ---
  const SFX = {
    tap(t) { tone(sfxBus, 1250, t, 0.05, { type: 'sine', vol: 0.06, a: 0.002, f2: 900 }); },
    pick(t) { tone(sfxBus, 660, t, 0.12, { type: 'triangle', vol: 0.16 }); tone(sfxBus, 990, t + 0.07, 0.18, { type: 'triangle', vol: 0.16 }); },
    flip(t) { noise(sfxBus, t, 0.5, { vol: 0.12, freq: 1500, q: 0.6, a: 0.2 }); [0, 0.12, 0.22, 0.3].forEach((d, i) => tone(sfxBus, 1800 + i * 300, t + d, 0.06, { type: 'sine', vol: 0.06 })); tone(sfxBus, 1568, t + 0.55, 0.6, { type: 'sine', vol: 0.15 }); },
    power(t) { tone(sfxBus, 180, t, 0.4, { type: 'sawtooth', vol: 0.12, f2: 1400, q: 3000 }); tone(sfxBus, 880, t + 0.28, 0.3, { type: 'triangle', vol: 0.14 }); tone(sfxBus, 1320, t + 0.36, 0.35, { type: 'triangle', vol: 0.12 }); duck(1); },
    whistle(t) {
      [[0, 0.18], [0.26, 0.18], [0.52, 0.7]].forEach(([d, len]) => {
        const o = ctx.createOscillator(), l = ctx.createOscillator(), lg = ctx.createGain(), g = ctx.createGain();
        o.frequency.value = 2900; l.frequency.value = 28; lg.gain.value = 120; l.connect(lg).connect(o.frequency);
        g.gain.setValueAtTime(0.0001, t + d); g.gain.linearRampToValueAtTime(0.09, t + d + 0.02); g.gain.setValueAtTime(0.09, t + d + len - 0.04); g.gain.linearRampToValueAtTime(0.0001, t + d + len);
        o.connect(g).connect(sfxBus); o.start(t + d); l.start(t + d); o.stop(t + d + len + 0.02); l.stop(t + d + len + 0.02);
      });
      duck(1.6);
    },
    goal(t) {
      [523.25, 659.25, 783.99].forEach((f, i) => tone(sfxBus, f, t + i * 0.09, 0.5, { vol: 0.18, a: 0.02 }));
      noise(sfxBus, t + 0.05, 1.6, { vol: 0.1, freq: 900, q: 0.7, a: 0.15 });
      duck(2.4);
    },
    win(t) { [60, 64, 67, 72].forEach((m, i) => tone(sfxBus, hz(m + 12), t + i * 0.12, 0.3, { vol: 0.16 })); [72, 76, 79].forEach(m => tone(sfxBus, hz(m), t + 0.5, 1.2, { vol: 0.1, a: 0.02 })); noise(sfxBus, t + 0.4, 1.8, { vol: 0.08, freq: 900, q: 0.7, a: 0.2 }); duck(3); },
    lose(t) { tone(sfxBus, hz(67), t, 0.35, { vol: 0.14 }); tone(sfxBus, hz(63), t + 0.3, 0.35, { vol: 0.14 }); tone(sfxBus, hz(60), t + 0.6, 0.9, { vol: 0.13, f2: hz(58) }); duck(2); },
    draw(t) { tone(sfxBus, hz(67), t, 0.3, { vol: 0.14 }); tone(sfxBus, hz(67), t + 0.28, 0.5, { vol: 0.14 }); duck(1.5); },
    msg(t) { tone(sfxBus, 880, t, 0.09, { type: 'sine', vol: 0.12 }); tone(sfxBus, 1320, t + 0.06, 0.12, { type: 'sine', vol: 0.1 }); },
    bad(t) { tone(sfxBus, 300, t, 0.35, { type: 'sawtooth', vol: 0.08, f2: 120, q: 1200 }); }
  };
  function sfx(name) {
    const o = opt(); if (o.all || !o.sfx || !SFX[name]) return;
    if (!ensure() || ctx.state !== 'running') return;
    try { SFX[name](ctx.currentTime + 0.01); } catch (e) {}
  }

  // Phones only allow sound after a tap: unlock on the first one
  function unlock() {
    if (!ensure()) return;
    unlocked = true; applyGains();
  }
  ['pointerdown', 'touchend', 'keydown'].forEach(ev => document.addEventListener(ev, unlock, { capture: true, passive: true }));
  // Small click on every button
  document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('button,.btn,[role="button"]'); if (b && !b.disabled && !b.hasAttribute('data-nosfx')) sfx('tap'); }, true);
  // Pause the music when the app is in the background
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.visibilityState === 'hidden') ctx.suspend().catch(() => {});
    else if (unlocked) ctx.resume().then(applyGains).catch(() => {});
  });

  function setOpt(k, v) {
    LS.set({ all: 'fld.muteAll', music: 'fld.music', sfx: 'fld.sound' }[k], !!v);
    if (unlocked) applyGains();
  }

  window.FLDSettings = { t: tr, lang: () => lang, setLang, sfx, opt, setOpt };
})();
