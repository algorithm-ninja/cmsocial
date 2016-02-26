/* Contest Management System
 * Copyright © 2013 William Di Luigi <williamdiluigi@gmail.com>
 * Copyright © 2014 Luca Chiodini <luca@chiodini.org>
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

angular.module('cmsocial')
  .constant('words', {
    // User interface
    'Close':
    {it: 'Chiudi'},
    'Submit':
    {it: 'Invia'},
    'Run':
    {it: 'Esegui'},
    'Load file':
    {it: 'Carica file'},
    'Reset':
    {it: 'Resetta'},
    'Apply':
    {it: 'Applica'},
    'Update':
    {it: 'Aggiorna'},
    'Browse...':
    {it: 'Sfoglia...'},
    'Changes recorded':
    {it: 'Modifiche registrate'},
    'No changes recorded':
    {it: 'Nessuna modifica registrata'},
    'Leave empty if you don\'t want to change your password':
    {it: 'Lascia questo campo vuoto se non vuoi cambiare la password'},
    'MiB': // mebibyte
    {},
    'sec': // abbreviation of: seconds
    {},

    // Overview page
    'Italian Olympiads in Informatics training website':
    {it: 'Portale di allenamento delle Olimpiadi Italiane di Informatica'},
    'Welcome to the official training website for OII! here you will be able to try and solve programming tasks by coding a solution in either C, C++ or Pascal.':
    {it: 'Benvenuto nella piattaforma ufficiale di allenamento per le OII! Qui avrai accesso a numerosi problemi ai quali potrai inviare delle soluzioni scritte in C, C++ o Pascal.'},
    'Learn to code':
    {it: 'Impara a programmare'},
    'Tasks archive':
    {it: 'Archivio dei problemi'},
    'Advance your ranking':
    {it: 'Scala la classifica'},
    'See the rankings':
    {it: 'Guarda la classifica'},
    'Get to know other coders':
    {it: 'Partecipa alla community'},
    'Go to the forum':
    {it: 'Visita il forum'},
    'The wide range of tasks available on this website will allow you to start from the easiest going to the toughest one: in this way you\'ll improve your programming abilities and your attitude to analyze and deal with hard computational problems!':
    {it: 'La vasta scelta di problemi presenti nel sito ti permette di partire da quelli più facili fino ad arrivare a quelli più difficili: in questo modo migliorerai sempre più le tue abilità di programmazione e la tua capacità di analizzare ed affrontare problemi computazionali!'},
    'By solving tasks on this website you\'ll earn points that will sum up to your total ranking. Compete with other italian students for the first place of the rankings page!':
    {it: 'Man mano che risolverai i problemi presenti sulla piattaforma guadagnerai dei punti che si sommeranno al tuo punteggio totale. Competi con tutti gli altri studenti e studentesse italiani per il traguardo del primo posto della classifica!'},
    'Introduce yourself to other students, discuss the tasks, clear up your doubts on: basic constructs of you programming language, algorithms and data structures, libraries, algorithm techniques, and much more!':
    {it: 'Presentati agli altri aspiranti olimpici nel forum della piattaforma, discuti dei problemi, risolvi tutti i tuoi dubbi su: costrutti di base del tuo linguaggio di programmazione, algoritmi e strutture dati di libreria, tecniche algoritmiche, e tanto altro!'},

    // Task page
    'Statement':
    {it: 'Testo'},
    'Attachments':
    {it: 'Allegati'},
    'Stats':
    {it: 'Statistiche'},
    'Submissions':
    {it: 'Sottoposizioni'},
    'Memory limit':
    {it: 'Limite di memoria'},
    'Time limit':
    {it: 'Limite di tempo'},
    'Tags':
    {it: 'Tag'},
    'Tags list':
    {it: 'Elenco dei tag'},
    'Memory available for the execution of one testcase, measured in MiB.':
    {it: 'La quantità di memoria, in MiB, disponibile per l\'esecuzione di un testcase.'},
    'Time available for the execution of one testcase, measured in seconds.':
    {it: 'La quantità di tempo, in secondi, disponibile per l\'esecuzione di un testcase.'},
    'Tags are useful to classify tasks by a common characteristic or technique, such as: <i>greedy</i>, <i>graphs</i>, and so on.':
    {it: 'I tag servono per classificare e raggruppare i problemi in base ad una caratteristica comune, ad esempio: <i>greedy</i>, <i>grafi</i>, e così via.'},

    // Submissions page
    'Submit a solution':
    {it: 'Invia una sottoposizione'},
    'Language:':
    {it: 'Linguaggio:'},
    'Write your code here':
    {it: 'Scrivi qui il tuo codice'},
    'Previous submissions':
    {it: 'Sottoposizioni precedenti'},
    'ID':
    {},
    'Time and date':
    {it: 'Data e ora'},
    'Status':
    {it: 'Stato'},
    'File(s)':
    {it: 'File'},
    'Submission details':
    {it: 'Dettagli della sottoposizione'},
    'Compilation output':
    {it: 'Output della compilazione'},
    'Compilation outcome:':
    {it: 'Esito della compilazione:'},
    'Compilation time:':
    {it: 'Tempo di compilazione:'},
    'Used memory:':
    {it: 'Memoria utilizzata:'},
    'Standard output':
    {},
    'Standard error':
    {},
    'Subtask':
    {},
    'Testcase':
    {},
    'Result':
    {it: 'Risultato'},
    'Details':
    {it: 'Dettagli'},
    'Time':
    {it: 'Tempo'},
    'Memory':
    {it: 'Memoria'},
    'Too frequent submissions!':
    {it: 'Sottoposizioni troppo frequenti!'},
    'You have a pending submission':
    {it: 'Hai una sottoposizione in sospeso'},
    'Some files are missing!':
    {it: 'Mancano alcuni file!'},
    'The files you sent are too big!':
    {it: 'I file inviati sono troppo grandi!'},
    'The language of the files you sent is not recognized!':
    {it: 'Linguaggio dei file inviati non riconosciuto!'},
    'The files you sent are in different languages!':
    {it: 'I file inviati sono in linguaggi diversi!'},

    // Stats page
    'Number of people who solved it:':
    {it: 'Numero di persone che l\'hanno risolto:'},
    'Number of people who tried it:':
    {it: 'Numero di persone che l\'hanno provato:'},
    'Number of correct submissions:':
    {it: 'Numero di soluzioni corrette:'},
    'Number of solutions submitted:':
    {it: 'Numero di soluzioni inviate:'},
    'Users with the best solutions':
    {it: 'Utenti con le soluzioni migliori'},

    // Navbar buttons
    'Task & quiz archive':
    {it: 'Archivio problemi e quiz'},
    'All tasks':
    {it: 'Tutti i problemi'},
    'Task categories':
    {it: 'Problemi per categoria'},
    'Quizzes':
    {it: 'Selezioni scolastiche'},
    'Ranking':
    {it: 'Classifica'},
    'Forum':
    {},

    // User related
    'Sign up':
    {it: 'Registrati'},
    'Sign in':
    {it: 'Entra'},
    'Sign out':
    {it: 'Esci'},
    'My user profile':
    {it: 'Il mio profilo utente'},
    'Login data':
    {it: 'Dati di accesso al sito'},
    'Username':
    {},
    'Password':
    {},
    'Confirm password':
    {it: 'Ripeti password'},
    'Personal data':
    {it: 'Dati personali'},
    'First name':
    {it: 'Nome'},
    'Last name':
    {it: 'Cognome'},
    'E-mail address':
    {it: 'Indirizzo e-mail'},
    'Confirm e-mail':
    {it: 'Ripeti e-mail'},
    'Institute data':
    {it: 'Dati della scuola di provenienza'},
    'Region':
    {it: 'Regione'},
    'Province':
    {it: 'Provincia'},
    'City':
    {it: 'Città'},
    'Institute':
    {it: 'Istituto'},
    'User profile preview':
    {it: 'Anteprima del profilo utente'},
    'Profile':
    {it: 'Profilo'},
    'Edit your data':
    {it: 'Modifica i tuoi dati'},
    'Old password':
    {it: 'Vecchia password'},
    'New password':
    {it: 'Nuova password'},
    'Confirm new password':
    {it: 'Ripeti nuova password'},
    'New e-mail address':
    {it: 'Nuovo indirizzo email'},
    'Change your avatar at gravatar.com':
    {it: 'Cambia la tua foto di profilo su gravatar.com'},
    'Submitted tasks':
    {it: 'Problemi sottomessi'},
    'no submissions':
    {it: 'nessuna sottoposizione'},

    // Tasklist page
    'search':
    {it: 'cerca'},
    'Search by name':
    {it: 'Ricerca per nome'},
    'no tasks found':
    {it: 'nessun problema trovato'},

    // Errors
    'Username is too short':
    {it: 'Username troppo corto'},
    'Username is invalid':
    {it: 'Username non valido'},
    'This username is not available':
    {it: 'Questo username non è disponibile'},
    'You must specify your password':
    {it: 'Devi speficicare la tua password'},
    'Password\'s too short':
    {it: 'Password troppo corta'},
    'Passwords don\'t match':
    {it: 'Le password non combaciano'},
    'Wrong password':
    {it: 'Password errata'},
    'Invalid e-mail':
    {it: 'E-mail non valida'},
    'E-mail already used':
    {it: 'E-mail già utilizzata'},
    'E-mails don\'t match':
    {it: 'Gli indirizzi non combaciano'},
    'You must specify a region':
    {it: 'Devi specificare una regione'},
    'You must specify a province':
    {it: 'Devi specificare una provincia'},
    'You must specify a city':
    {it: 'Devi specificare una città'},
    'You must specify an institute':
    {it: 'Devi specificare un istituto'},
    'Title is too short':
    {it: 'Titolo troppo corto'},
    'Description is too short':
    {it: 'Descrizione troppo corta'},
    'Text is too short':
    {it: 'Testo troppo corto'},

    // Notifications
    'Welcome back':
    {it: 'Bentornato'},
    'Sign in error':
    {it: 'Login errato'},
    'Make sure your internet connection is working and, if this error occurs again, contact an administrator.':
    {it: 'Assicurati che la tua connessione a internet sia funzionante e, se l\'errore dovesse ripetersi, contatta un amministratore.'},
    'Goodbye':
    {it: 'Arrivederci'},
    'User doesn\'t exist':
    {it: 'Utente non esistente'},
    'Internal error. Make sure your internet connection is working well and, if this error occurs again, contact an administrator.':
    {it: 'Errore interno. Assicurati che la tua connessione a internet sia funzionante e, se l\'errore dovesse ripetersi, contatta un amministratore.'},
    'Internal error':
    {it: 'Errore interno'},
    'Topic created':
    {it: 'Argomento creato'},
    'Reply sent':
    {it: 'Risposta inviata'},
    'Edit saved':
    {it: 'Modifica salvata'},
    'Delete completed':
    {it: 'Eliminazione completata'},
    'Connection error':
    {it: 'Errore di connessione'},

    // Forum
    'Forums':
    {it: 'Forum'}
  })
  .factory('l10n', function(words) {
    // Detect browser language (ISO 639) and save it in localStorage
    var language = navigator.userLanguage || navigator.language;
    if (language.length > 2)
      language = language.substring(0,2);
    localStorage.setItem("language", language);
    return {
      get: function(input) {
        if (input === undefined)
          return input;
        if (!words.hasOwnProperty(input)) {
          return input; // no matching found, return input string
        }
        var lang = localStorage.getItem("language") || "en";
        if (lang == "en")
          return input; // input is already in english, so just return it
        if (words[input].hasOwnProperty(lang))
          return words[input][lang];
        else
          return input;
      },
    };
  })
  .filter('l10n', function(l10n) {
    return l10n.get;
  });
