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
  .controller('ResourcesCtrl', function($scope, navbarManager) {
    navbarManager.setActiveTab(0);
  })
  .controller('VideoPas', function($scope, navbarManager, ytFixer) {
    navbarManager.setActiveTab(0);
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
  .controller('VideoCpp', function($scope, navbarManager, ytFixer) {
    navbarManager.setActiveTab(0);
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
  .controller('VideoDos', function($scope, navbarManager, ytFixer) {
    navbarManager.setActiveTab(0);
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
  .controller('VideoAlg', function($scope, navbarManager, ytFixer) {
    navbarManager.setActiveTab(0);
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
        files: []
      },
      {
        title: '02 Dizionario mediante Array Dinamici 1: dimensione fissa',
        youtube: 'rFE8x7naGOw',
        files: []
      },
      {
        title: '02 Dizionario mediante Array Dinamici 2: dimensione variabile',
        youtube: '_4rASmNwVho',
        files: []
      },
      {
        title: '03 Dizionario mediante Array Ordinati: ricerca binaria',
        youtube: 'MPiE3OIeJN8',
        files: []
      },
      {
        title: '04 Tabella riassuntiva 1',
        youtube: '-Pil1cE0APY',
        files: []
      },
      {
        title: '05 Dizionario mediante Tabelle Hash 1: liste concatenate',
        youtube: '0O8O6Rt8Kes',
        files: []
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
        files: []
      },
      {
        title: '07 Tabella riassuntiva 2',
        youtube: 'VsUVndAQii4',
        files: []
      },
    ];
    $scope.videolezioni = ytFixer.fix($scope.videolezioni);
  })
  .controller('VideoSel', function($scope, navbarManager, ytFixer) {
    navbarManager.setActiveTab(0);
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
  });
