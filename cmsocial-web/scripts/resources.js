/* Contest Management System
 * Copyright © 2013 Luca Wehrstedt <luca.wehrstedt@gmail.com>
 * Copyright © 2013 Luca Versari <veluca93@gmail.com>
 * Copyright © 2013 William Di Luigi <williamdiluigi@gmail.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */
'use strict';

/* Resources page */

angular.module('cmsocial')
  .factory('ytFixer', function($sce) {
    return {
      'fix': function(lezioni) {
        for (var i in lezioni) {
          lezioni[i].youtube = $sce.trustAsResourceUrl('//www.youtube.com/embed/' + lezioni[i].youtube);
          for (var j in lezioni[i].files) {
            lezioni[i].files[j] = {'title': lezioni[i].files[j]};
            lezioni[i].files[j].url = $sce.trustAsUrl('resources/' + lezioni[i].files[j].title);
          }
        }
        return lezioni;
      }
    };
  })
  .controller('ResourcesCtrl', function($scope, taskbarManager) {
    taskbarManager.setActiveTab(0);
  })
  .controller('VideoPas', function($scope, taskbarManager, ytFixer) {
    taskbarManager.setActiveTab(0);
    $scope.title = 'Videolezioni Pascal';
    $scope.videolezioni = [
      {
        title: '1. Introduzione all\'ambiente di programmazione Web e scrittura del primo programma in Pascal',
        youtube: 'DYy2IbteC2U',
        files: ['lez1.pas']
      },
      {
        title: '2. Utilizzo di variabili',
        youtube: 'YZKX5n3Qz-g',
        files: ['somma.pas']
      },
      {
        title: '3. Generazione di numeri casuali',
        youtube: '2-xkcCs7-3M',
        files: ['dado.pas']
      },
      {
        title: '4. Introduzione alle istruzioni di controllo condizionate',
        youtube: 'S9RjxdKbWF0',
        files: ['moneta.pas']
      },
      {
        title: '5. Introduzione ai cicli definiti',
        youtube: 'wxf2tOPLZxo',
        files: []
      },
      {
        title: '6. Cicli a conteggio',
        youtube: 'xCpl-Er4gEU',
        files: ['stream_di_int.pas']
      },
      {
        title: '7. Introduzione ai vettori di variabili (array)',
        youtube: 'O4PNXMLpiBE',
        files: []
      },
      {
        title: '8. Esercitazione sull\'uso di vettori di variabili',
        youtube: '41nWMbLKmAE',
        files: ['verifyCoin.pas']
      },
      {
        title: 'Lezione 09',
        youtube: '4eccGbRKavQ',
        files: []
      },
      {
        title: 'Lezione 10',
        youtube: 'xHWo9mC5Qac',
        files: []
      },
      {
        title: 'Lezione 11',
        youtube: 'viXj9zyMAlk',
        files: []
      },
      {
        title: 'Lezione 12',
        youtube: 'vxa6eyV2oBs',
        files: ['functionDado.pas', 'repeat_throw_until.pas']
      },
      {
        title: 'Lezione 13',
        youtube: 'CgCKVC_tDMM',
        files: []
      },
      {
        title: 'Lezione 14',
        youtube: 'fmQwZl-7jBA',
        files: []
      },
      {
        title: 'Come inviare correttamente un file sorgente Pascal alla piattaforma',
        youtube: 'S954uarh-z0',
        files: []
      },
    ];
    $scope.videolezioni = ytFixer.fix($scope.videolezioni);
  })
  .controller('VideoDario', function($scope, taskbarManager, ytFixer) {
    taskbarManager.setActiveTab(0);
    $scope.title = 'Videolezioni Programmazione Competitiva';
    $scope.videolezioni = [
      {
        title: '01 - Introduzione',
        youtube: 'lU0Axxor6JU',
        files: []
      },
      {
        title: '02 - Ricorsione',
        youtube: '4tJHJSibcv0',
        files: []
      },
      {
        title: '03 - Complessità Computazionale',
        youtube: 'bWb18FVbtxU',
        files: []
      },
      {
        title: '04 - Programmazione Dinamica (parte 1)',
        youtube: 'dT5wMqCzp9I',
        files: []
      },
      {
        title: '05 - Programmazione Dinamica (parte 2)',
        youtube: 'Ubb-SwvMAq4',
        files: []
      },
      {
        title: '06 - Programmazione Dinamica (parte 3)',
        youtube: '30joNrPY7MA',
        files: []
      },
      {
        title: '07 - Programmazione Dinamica (parte 4)',
        youtube: 'BCxaH6B5wgg',
        files: []
      },
      {
        title: '08 - Algoritmi di ordinamento comparativi',
        youtube: 'iG9M_lBOOew',
        files: []
      },
      {
        title: '09 - Aritmetica modulare',
        youtube: 'eroJMT_ODQ0',
        files: []
      },
      {
        title: '10 - Ricerca binaria',
        youtube: '8H9UC0KwTQU',
        files: []
      },
      {
        title: '11 - Strutture dati 1',
        youtube: 'iHGCXrqnFO8',
        files: []
      },
      {
        title: '12 - Strutture dati 2',
        youtube: 'VvgN2o8T-98',
        files: []
      },
      {
        title: '13 - Grafi 1',
        youtube: 'mIxwWL3oQV8',
        files: []
      },
      {
        title: '14 - Grafi 2',
        youtube: '_adGyh_FfFI',
        files: []
      },
      {
        title: '15 - DFS e BFS',
        youtube: 'c3Xb9CztqYE',
        files: []
      },
      {
        title: '16 - Algoritmo di Dijkstra',
        youtube: 'WQiAluRS2nw',
        files: []
      },
      {
        title: '17 - Algoritmo di Prim e Ordinamento Topologico',
        youtube: 'Cr9y7Px9oek',
        files: []
      },
      {
        title: '18 - Esercitazione 1: Selezioni Territoriali 2019',
        youtube: 'jjDqWKyFq5w',
        files: []
      },
      {
        title: '19 - Esercitazione 2: Selezioni Territoriali 2018',
        youtube: 'Rlq5yRxlN3Y',
        files: []
      },
      {
        title: '20 - Esempio di gara in diretta: Quaranterry (pre-Territoriali 2020)',
        youtube: '6CuRIHuqLLs',
        files: []
      },
    ];
    $scope.videolezioni = ytFixer.fix($scope.videolezioni);
  })
  .controller('VideoCpp', function($scope, taskbarManager, ytFixer) {
    taskbarManager.setActiveTab(0);
    $scope.title = 'Videolezioni C';
    $scope.videolezioni = [
      {
        title: 'Corso di programmazione in C - Lezione 1 - Prof. Romeo Rizzi - UNIVR',
        youtube: 'QW7A7efKzoY',
        files: []
      },
      {
        title: 'Corso di programmazione in C - Lezione 2 - Prof. Romeo Rizzi - UNIVR',
        youtube: 'XrIYg7Er3OM',
        files: []
      },
      {
        title: 'Corso di programmazione in C - Lezione 3 - Prof. Romeo Rizzi - UNIVR',
        youtube: 'VRdS2z5eso0',
        files: []
      },
      {
        title: 'Corso di programmazione in C - Lezione 4 - Prof. Romeo Rizzi - UNIVR',
        youtube: 'ZQwIQLmxcfc',
        files: []
      },
      {
        title: 'Corso di programmazione in C - Lezione 5 - Prof. Romeo Rizzi - UNIVR',
        youtube: 'UbpQ0rEqNcM',
        files: []
      },
      {
        title: 'Corso di programmazione in C - Lezione 6 - Prof. Romeo Rizzi - UNIVR',
        youtube: '_C9vsqgOpCM',
        files: []
      },
      {
        title: 'Corso di programmazione in C - Lezione 7 - Prof. Romeo Rizzi - UNIVR',
        youtube: 'hBJrzlx-qU8',
        files: []
      },
      {
        title: 'Corso di programmazione in C - Lezione 8 - Prof. Romeo Rizzi - UNIVR',
        youtube: 'e77J9NOD01k',
        files: []
      },
      {
        title: 'Corso di programmazione in C - Lezione 9 - Prof. Romeo Rizzi - UNIVR',
        youtube: 'rfpf09WAanY',
        files: []
      },
      {
        title: 'Corso di programmazione in C - Lezione 10 - Prof. Romeo Rizzi - UNIVR',
        youtube: 'jRyLcwgAw2o',
        files: []
      },
      {
        title: 'Corso di programmazione in C - Lezione 11 - Prof. Romeo Rizzi - UNIVR',
        youtube: 'iNrwwlQR174',
        files: []
      },
      {
        title: 'Corso di programmazione in C - Lezione 12 - Prof. Romeo Rizzi - UNIVR',
        youtube: '56E3Pc5UT8I',
        files: []
      },
      {
        title: 'Corso di programmazione in C - Lezione 13 - Prof. Romeo Rizzi - UNIVR',
        youtube: 'nA8AtYh92hk',
        files: []
      },
      {
        title: 'Corso di programmazione in C - Lezione 14 - Prof. Romeo Rizzi - UNIVR',
        youtube: 'X8HH8OkmWRg',
        files: []
      },
      {
        title: 'Come inviare correttamente un file sorgente C alla piattaforma',
        youtube: 'YAmpEiGJFVs',
        files: []
      },
    ];
    $scope.videolezioni = ytFixer.fix($scope.videolezioni);
  })
  .controller('VideoDos', function($scope, taskbarManager, ytFixer) {
    taskbarManager.setActiveTab(0);
    $scope.title = 'Videolezioni prompt dei comandi';
    $scope.videolezioni = [
      {
        title: 'Lezione 1',
        youtube: '0ZiZZKuOAYw',
        files: []
      },
      {
        title: 'Lezione 2',
        youtube: 'ObP826EJcG4',
        files: []
      },
      {
        title: 'Lezione 3',
        youtube: 'GdWviy-0BjY',
        files: []
      },
      {
        title: 'Lezione 4',
        youtube: 'lgygmdZ0Zxo',
        files: []
      },
      {
        title: 'Lezione 5',
        youtube: 'L_Fgi0uLRYY',
        files: []
      },
      {
        title: 'Lezione 6',
        youtube: 'inlXwdMp8Ic',
        files: []
      },
      {
        title: 'Lezione 7',
        youtube: 'LgOAyxN5j8Q',
        files: []
      },
      {
        title: 'Lezione 8',
        youtube: 'aen2V5Y14vk',
        files: []
      },
    ];
    $scope.videolezioni = ytFixer.fix($scope.videolezioni);
  })
  .controller('VideoAlg', function($scope, taskbarManager, ytFixer) {
    taskbarManager.setActiveTab(0);
    $scope.title = 'Videolezioni Algoritmi e Strutture Dati';
    $scope.videolezioni = [
      {
        title: '00 Introduzione ai dizionari',
        youtube: 'eB_AREwL4dI',
        files: []
      },
      {
        title: '01 Dizionario mediante Liste 1: definizione',
        youtube: 'fb-JsPB2CYA',
        files: []
      },
      {
        title: '01 Dizionario mediante Liste 2: inserimento',
        youtube: 'j4eZAp6a63k',
        files: []
      },
      {
        title: '01 Dizionario mediante Liste 3: cancellazione',
        youtube: 'pCvG_hX958g',
        files: []
      },
      {
        title: '01 Dizionario mediante Liste 4: ricerca (1/2)',
        youtube: 'PneFLXrTrMM',
        files: []
      },
      {
        title: '01 Dizionario mediante Liste 4: ricerca (2/2)',
        youtube: 'lUobj-OfnaM',
        files: ['liste.h', 'liste.c', 'esempio_liste.c']
      },
      {
        title: '02 Dizionario mediante Array Dinamici 1: dimensione fissa',
        youtube: 'rFE8x7naGOw',
        files: []
      },
      {
        title: '02 Dizionario mediante Array Dinamici 2: dimensione variabile',
        youtube: '_4rASmNwVho',
        files: ['vettori.h', 'vettori.c', 'esempio_vettori.c']
      },
      {
        title: '03 Dizionario mediante Array Ordinati: ricerca binaria',
        youtube: 'MPiE3OIeJN8',
        files: ['ricerca_binaria.c']
      },
      {
        title: '04 Tabella riassuntiva 1',
        youtube: '-Pil1cE0APY',
        files: []
      },
      {
        title: '05 Dizionario mediante Tabelle Hash 1: liste concatenate',
        youtube: '0O8O6Rt8Kes',
        files: ['hash.h', 'hash.c', 'liste.h', 'liste.c', 'esempio_hash.c']
      },
      {
        title: '05 Dizionario mediante Tabelle Hash 2: indirizzamento aperto',
        youtube: 'hadAU6vw1xQ',
        files: []
      },
      {
        title: '06 Dizionario mediante Alberi Binari di Ricerca 1: definizione',
        youtube: 'o_H-2N1E6EI',
        files: []
      },
      {
        title: '06 Dizionario mediante Alberi Binari di Ricerca 2: ricerca e inserimento',
        youtube: 'dLWeE0cGoCM',
        files: []
      },
      {
        title: '06 Dizionario mediante Alberi Binari di Ricerca 3: cancellazione',
        youtube: 'xsDdLepnIqw',
        files: ['abr.h', 'abr.c', 'esempio_abr.c']
      },
      {
        title: '07 Tabella riassuntiva 2',
        youtube: 'VsUVndAQii4',
        files: []
      },
    ];
    $scope.videolezioni = ytFixer.fix($scope.videolezioni);
  })
  .controller('VideoSel', function($scope, taskbarManager, ytFixer) {
    taskbarManager.setActiveTab(0);
    $scope.title = 'Soluzioni commentate a esercizi di selezioni scolastiche';
    $scope.videolezioni = [
      {
        title: 'Soluzione commentata esercizio 2 Selezioni Scolastiche 2012',
        youtube: 'hMzcSlgdDUU',
        files: []
      },
      {
        title: 'Soluzione commentata esercizio 6 Selezioni Scolastiche 2012 - Pascal',
        youtube: '7pLgkIyV0pI',
        files: []
      },
      {
        title: 'Soluzione commentata esercizio 11 Selezioni Scolastiche 2012 - Pascal',
        youtube: 'ASUfHRo6w4I',
        files: []
      },
      {
        title: 'Soluzione commentata esercizio 16 Selezioni Scolastiche 2012',
        youtube: 'Zy3ZHlKRvdc',
        files: []
      },
      {
        title: 'Soluzione commentata esercizio 18 Selezioni Scolastiche 2012',
        youtube: 'jxx_GGp7vAA',
        files: []
      },
    ];
    $scope.videolezioni = ytFixer.fix($scope.videolezioni);
  })
  .controller('FAQCtrl', function($scope, taskbarManager) {
    taskbarManager.setActiveTab(0);
    $scope.title = "Domande frequenti";
    $scope.faqs = [
    	{
    		question: "Come si ottiene l’attestato?",
    		answer: "L'unico obbligo è di totalizzare durante la miniolimpiade un punteggio positivo ad almeno 3 dei 7 problemi proposti. La quantità di problemi da svolgere durante il corso va in relazione alla dimestichezza del singolo e non determina il diritto al certificato."
    	},
		{
			question: "Quando comincia e quando finisce la miniolimpiade?",
			answer: "La nona edizione della miniolimpiade comincerà il 27 aprile 2020 alle ore 15:00 e terminerà il 7 maggio 2020 alle ore 15:00."
		},
		{
			question: "Come funziona la miniolimpiade?",
			answer: "Nel giorno e l'ora d'inizio della miniolimpiade, saranno inseriti nella piattaforma i 7 problemi della miniolimpiade. Una volta usciti, avrete a disposizione una settimana per svolgerli. Il punteggio minimo da ottenere è un punteggio strettamente positivo su 3 dei 7 problemi."
		},
		{
			question: "Esistono delle prove intermedie?",
			answer: "No, durante il corso vi è la possibilità di autovalutarsi cimentandosi con i problemi di programmazione presenti sulla piattaforma. Il forum è un utile strumento per lo scambio di opinioni sia tra i corsisti che con i membri dello staff, sempre pronti a dispensare consigli."
			},
		{
			question: "Come funziona il corso?",
			answer: "Questo corso si struttura nel seguente modo: una volta scelto il linguaggio, si possono seguire principalmente due strade, in base anche a quanto ci si sente pronti. Si può iniziare seguendo le videolezioni, che permettono di iniziare in maniera soft, oppure si può iniziare direttamente a programmare. Nella sezione \"Problemi di programmazione\" della barra di navigazione in alto si apre al click una tendina. Cliccando su \"Tutti i problemi\" si apre una pagina con tutti i problemi di programmazione disponibili (ognuno può essere risolto in qualsiasi linguaggio), tra i quali è possibile effettuare una ricerca per pattern matching del nome, mediante il bottone a forma di lente di ingrandimento. Si suggerisce comunque di iniziare con \"easy1\", \"easy2\", \"easy3\", che sono i più basilari e permettono di autovalutarsi, anche con lo scopo di capire se può essere necessaria la visione delle videolezioni oppure se ci si può concentrare su problemi più \"difficili\"."
			},
		{
			question: "Come deve essere inviata la soluzione?",
			answer: "La soluzione può essere scritta direttamente nell'editor fornito dalla piattaforma e può essere compilata ed inviata direttamente cliccando sul bottone \"sottometti\". Naturalmente, è perfettamente legittimo sviluppare il codice in un qualsiasi editor per poi incollarlo nell'apposito spazio per poi inviare la sottoposizione. Quando il codice viene compilato, l'eseguibile viene fatto girare su un server e vengono mostrati i risultati (il numero di testcase superati ed il tempo impiegato per l'esecuzione) nella pagina web."
			},
		{
			question: "È possibile avere un corso per le competenze digitali avanzato?",
			answer: "Al momento non è stato predisposto un \"sequel\" per il corso delle competenze digitali, ma vi comunicheremo a breve un elenco di problemi \"difficili\", la cui risoluzione indica un livello di dimestichezza piuttosto elevato."
			},
		{
			question: "È necessario postare le proprie soluzioni?",
			answer: "Lo scambio reciproco di idee è fortemente incoraggiato, poiché costituisce un'ottima occasione per apprendere in modo più dinamico; resta inteso che è fortemente scoraggiato e deleterio in fase di valutazione (miniolimpiade)."
			},
		{
			question: "I tempi di esecuzione mostrati dalla piattaforma al termine di una valutazione sono attendibili?",
			answer: "Il tempo di esecuzione che viene visualizzato è il peggior tempo fatto dal programma sui test case. Indicativamente è attendibile, ma possono esserci delle variazioni dovute ad esempio allo stato di sovraccarico della macchina sulla quale vengono fatti girare gli eseguibili, ma di solito l'errore non supera i 4ms."
			},
		{
			question: "È possibile scegliere il linguaggio di programmazione da usare?",
			answer: "Certamente! È possibile scegliere il linguaggio con il quale ci si trova meglio tra le varie proposte (i linguaggi ufficiali delle IOI) e potenziare le proprie competenze esclusivamente su quello. La piattaforma permette comunque di cambiare linguaggio in qualsiasi momento, nel caso ci si accorgesse in corso d'opera di preferire un altro tra i linguaggi di programmazione supportati."
			},
		{
			question: "Come deve essere fatta una soluzione?",
			answer: "In fase di scrittura del codice è necessario leggere attentamente le specifiche nel testo. Infatti uno degli errori più comuni in fase iniziale è la mancata lettura/scrittura da/su file, che è richiesta in molti problemi. Inoltre, sono da evitare le stampe da \"interfaccia testuale\", ossia la scrittura di qualunque cosa che non sia strettamente il risultato del problema, poichè tali stampe fanno totalizzare 0 punti."
			},
		{
			question: "Come mai il mio programma Pascal va in execution time out?",
			answer: "Un problema molto comune in Pascal è l’utilizzo degli integer, al posto dei longint. Infatti i primi sono interi a 16 bit, mentre i secondi a 32 bit. In generale, è buona norma usare sempre e comunque i longint, che corrispondono agli int del C."
		}
    ];
  });
