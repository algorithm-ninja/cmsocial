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
    'Close': {
      it: 'Chiudi'
    },
    'Submit': {
      it: 'Invia'
    },
    'Run': {
      it: 'Esegui'
    },
    'Load file': {
      it: 'Carica file'
    },
    'Reset': {
      it: 'Resetta'
    },
    'Apply': {
      it: 'Applica'
    },
    'Update': {
      it: 'Aggiorna'
    },
    'Browse...': {
      it: 'Sfoglia...'
    },
    'Changes recorded': {
      it: 'Modifiche registrate'
    },
    'No changes recorded': {
      it: 'Nessuna modifica registrata'
    },
    'Leave empty if you don\'t want to change your password': {
      it: 'Lascia questo campo vuoto se non vuoi cambiare la password'
    },
    'MiB': // mebibyte
    {},
    'sec': // abbreviation of: seconds
    {},

    // Overview page
    'Italian Olympiads in Informatics training website': {
      it: 'Portale di allenamento delle Olimpiadi Italiane di Informatica'
    },
    'Welcome to the official training website for OII! Here you will be able to try and solve programming tasks by coding a solution in a programming language of your choice.': {
      it: 'Benvenuto nella piattaforma ufficiale di allenamento per le OII! Qui avrai accesso a numerosi problemi ai quali potrai inviare delle soluzioni scritte in un linguaggio di programmazione a tua scelta.'
    },
    'Learn progressively': {
      it: 'Impara gradualmente'
    },
    'Tasks archive': {
      it: 'Archivio dei problemi'
    },
    'Challenge yourself': {
      it: 'Mettiti alla prova'
    },
    'Solve more problems': {
      it: 'Risolvi tutti i problemi'
    },
    'Tasks from regionals': {
      it: 'Problemi delle territoriali'
    },
    'Get to know others': {
      it: 'Entra nella community'
    },
    'Go to the forum': {
      it: 'Visita il forum'
    },
    'Browse the wiki': {
      it: 'Leggi la wiki'
    },
    'Read the stats': {
      it: 'Accedi alle statistiche'
    },
    'With algobadge you will be guided through a curated selection of tasks to solve, ordered by increasing difficulty, while being able to explore new algorithmic techniques in a gradual and effective way.': {
      it: 'Con algobadge ti guideremo attraverso una selezione accurata di task da risolvere, ordinati per difficoltà crescente, che ti permetteranno di esplorare nuove tecniche algoritmiche in modo graduale ed efficace.'
    },
    'The wide range of tasks available on this website will allow you to start from the easiest going to the toughest one: in this way you\'ll improve your programming abilities and your attitude to analyze and deal with hard computational problems!': {
      it: 'La vasta scelta di problemi presenti nel sito ti permette di partire da quelli più facili fino ad arrivare a quelli più difficili: in questo modo migliorerai sempre più le tue abilità di programmazione e la tua capacità di analizzare ed affrontare problemi computazionali!'
    },
    'Challenge yourself by solving problems that appeared at the regional stage of the Italian Olympiads in Informatics. This is a good way to test your knowledge!': {
      it: 'Sfidati a risolvere i problemi che sono stati dati alle selezioni territoriali delle Olimpiadi Italiane di Informatica. Questo è un ottimo modo per testare le tue conoscenze!'
    },
    'In the official wiki you will find detailed explanations and solutions of past problems, as well as thorough writeups of algorithmic techniques.': {
      it: 'Nella wiki ufficiale troverai spiegazioni dettagliate e soluzioni di problemi passati, oltre che a tutorial approfonditi su tecniche algoritmiche avanzate.'
    },
    'In the stats portal you will find information about past editions, like the ranking of students that participated before you, as well as which of them went on to compete at the international level.': {
      it: 'Nel portale delle statistiche troverai informazioni sulle edizioni passate, tra cui come gli studenti che hanno partecipato prima di te si sono classificati, e quali di loro hanno gareggiato a livello internazionale.'
    },
    'Introduce yourself to other students, discuss the tasks, clear up your doubts on: basic constructs of you programming language, algorithms and data structures, libraries, algorithm techniques, and much more!': {
      it: 'Presentati agli altri aspiranti olimpici nel forum della piattaforma, discuti dei problemi, risolvi tutti i tuoi dubbi su: costrutti di base del tuo linguaggio di programmazione, algoritmi e strutture dati di libreria, tecniche algoritmiche, e tanto altro!'
    },

    // Task page
    'Statement': {
      it: 'Testo'
    },
    'Attachments': {
      it: 'Allegati'
    },
    'Download everything as zip': {
      it: 'Scarica tutto come zip'
    },
    'Stats': {
      it: 'Statistiche'
    },
    'Submissions': {
      it: 'Sottoposizioni'
    },
    'Memory limit': {
      it: 'Limite di memoria'
    },
    'Time limit': {
      it: 'Limite di tempo'
    },
    'Tags': {
      it: 'Tag'
    },
    'Tags list': {
      it: 'Elenco dei tag'
    },
    'Memory available for the execution of one testcase, measured in MiB.': {
      it: 'La quantità di memoria, in MiB, disponibile per l\'esecuzione di un testcase.'
    },
    'Time available for the execution of one testcase, measured in seconds.': {
      it: 'La quantità di tempo, in secondi, disponibile per l\'esecuzione di un testcase.'
    },
    'Tags are useful to classify tasks by a common characteristic or technique, such as: <i>greedy</i>, <i>graphs</i>, and so on.': {
      it: 'I tag servono per classificare e raggruppare i problemi in base ad una caratteristica comune, ad esempio: <i>greedy</i>, <i>grafi</i>, e così via.'
    },
    'Tag already exists': {
      it: 'Il tag esiste già'
    },
    'Tag does not exist': {
      it: 'Tag inesistente'
    },
    'Task does not exist': {
      it: 'Problema inesistente'
    },
    'The task already has this tag': {
      it: 'Il problema ha già questo tag'
    },
    'Task does not have tag': {
      it: 'Il problema non ha tag'
    },
    'Task correctly tagged': {
      it: 'Tag aggiunto correttamente al problema'
    },
    'Task correctly untagged': {
      it: 'Tag rimosso correttamente dal problema'
    },
    'Maximum score': {
      it: 'Punteggio massimo'
    },

    // Submissions page
    'Submit a solution': {
      it: 'Invia una sottoposizione'
    },
    'Language:': {
      it: 'Linguaggio:'
    },
    'Write your code here': {
      it: 'Scrivi qui il tuo codice'
    },
    'Previous submissions': {
      it: 'Sottoposizioni precedenti'
    },
    'ID': {},
    'Time and date': {
      it: 'Data e ora'
    },
    'Status': {
      it: 'Stato'
    },
    'File(s)': {
      it: 'File'
    },
    'Submission details': {
      it: 'Dettagli della sottoposizione'
    },
    'Compilation output': {
      it: 'Output della compilazione'
    },
    'Compilation outcome:': {
      it: 'Esito della compilazione:'
    },
    'Compilation time:': {
      it: 'Tempo di compilazione:'
    },
    'Used memory:': {
      it: 'Memoria utilizzata:'
    },
    'Standard output': {},
    'Standard error': {},
    'Subtask': {},
    'Testcase': {},
    'Result': {
      it: 'Risultato'
    },
    'Details': {
      it: 'Dettagli'
    },
    'Time': {
      it: 'Tempo'
    },
    'Memory': {
      it: 'Memoria'
    },
    'Too frequent submissions!': {
      it: 'Sottoposizioni troppo frequenti!'
    },
    'You have a pending submission': {
      it: 'Hai una sottoposizione in sospeso'
    },
    'Some files are missing!': {
      it: 'Mancano alcuni file!'
    },
    'The files you sent are too big!': {
      it: 'I file inviati sono troppo grandi!'
    },
    'The language of the files you sent is not recognized!': {
      it: 'Linguaggio dei file inviati non riconosciuto!'
    },
    'The files you sent are in different languages!': {
      it: 'I file inviati sono in linguaggi diversi!'
    },
    'Invalid archive!': {
      it: 'Archivio non valido!'
    },

    // Stats page
    'Number of people who solved it:': {
      it: 'Numero di persone che l\'hanno risolto:'
    },
    'Number of people who tried it:': {
      it: 'Numero di persone che l\'hanno provato:'
    },
    'Number of correct submissions:': {
      it: 'Numero di soluzioni corrette:'
    },
    'Number of solutions submitted:': {
      it: 'Numero di soluzioni inviate:'
    },
    'Users with the best solutions': {
      it: 'Utenti con le soluzioni migliori'
    },

    // Navbar buttons
    'Task & quiz archive': {
      it: 'Archivio problemi e quiz'
    },
    'All tasks': {
      it: 'Tutti i problemi'
    },
    'Tasks by technique': {
      it: 'Problemi per tecnica'
    },
    'Tasks by event': {
      it: 'Problemi per evento'
    },
    'Lessons': {
      it: 'Lezioni'
    },
    'Material': {
      it: 'Materiale'
    },
    'Task categories': {
      it: 'Problemi per categoria'
    },
    'Quizzes': {
      it: 'Selezioni scolastiche'
    },
    'Ranking': {
      it: 'Classifica'
    },
    'Forum': {},

    // User related
    'Sign up': {
      it: 'Registrati'
    },
    'Log in': {
      it: 'Entra'
    },
    'Log out': {
      it: 'Esci'
    },
    'Stay signed in': {
      it: 'Resta connesso'
    },
    'Forgot account?':
    {it: 'Hai dimenticato le credenziali?'},
    'No such user':
    {it: 'Utente inesistente'},
    'A code was sent, check your inbox':
    {it: 'Il codice è stato spedito, controlla la casella di posta'},
    'You should already have received an email, if not, try tomorrow':
    {it: 'Dovresti aver già ricevuto una mail, altrimenti riprova domani'},
    'Your new password was mailed to you':
    {it: 'La nuova password ti è stata mandata per mail'},
    'Wrong code':
    {it: 'Codice errato'},
    'Recover data':
    {it: 'Recupera credenziali'},
    'Confirm code':
    {it: 'Conferma codice'},
    'Code':
    {it: 'Codice'},
    'My user profile': {
      it: 'Il mio profilo utente'
    },
    'Login data': {
      it: 'Dati di accesso al sito'
    },
    'Username': {},
    'Password': {},
    'Confirm password': {
      it: 'Ripeti password'
    },
    'Personal data': {
      it: 'Dati personali'
    },
    'First name': {
      it: 'Nome'
    },
    'Last name': {
      it: 'Cognome'
    },
    'E-mail address': {
      it: 'Indirizzo e-mail'
    },
    'Confirm e-mail': {
      it: 'Ripeti e-mail'
    },
    'Anti-spam check': {
      it: 'Controllo anti-spam'
    },
    'Institute data': {
      it: 'Dati della scuola di provenienza'
    },
    'Region': {
      it: 'Regione'
    },
    'Province': {
      it: 'Provincia'
    },
    'City': {
      it: 'Città'
    },
    'Institute': {
      it: 'Istituto'
    },
    'User profile preview': {
      it: 'Anteprima del profilo utente'
    },
    'Profile': {
      it: 'Profilo'
    },
    'Edit your data': {
      it: 'Modifica i tuoi dati'
    },
    'Old password': {
      it: 'Vecchia password'
    },
    'New password': {
      it: 'Nuova password'
    },
    'Confirm new password': {
      it: 'Ripeti nuova password'
    },
    'New e-mail address': {
      it: 'Nuovo indirizzo email'
    },
    'Change your avatar at gravatar.com': {
      it: 'Cambia la tua foto di profilo su gravatar.com'
    },
    'Submitted tasks': {
      it: 'Problemi sottomessi'
    },
    'no submissions': {
      it: 'nessuna sottoposizione'
    },

    // Tasklist page
    'search': {
      it: 'cerca'
    },
    'Search by name': {
      it: 'Ricerca per nome'
    },
    'no tasks found': {
      it: 'nessun problema trovato'
    },
    'Exercise': {
      it: 'Esercizio'
    },
    'Easiest first': {
      it: 'Più facili'
    },
    'Hardest first': {
      it: 'Più difficili'
    },
    'Newest first': {
      it: 'Più recenti'
    },

    // Errors
    'Username is too short': {
      it: 'Username troppo corto'
    },
    'Username is invalid': {
      it: 'Username non valido'
    },
    'This username is not available': {
      it: 'Questo username non è disponibile'
    },
    'You must specify your password': {
      it: 'Devi speficicare la tua password'
    },
    'Password\'s too short': {
      it: 'Password troppo corta'
    },
    'Passwords don\'t match': {
      it: 'Le password non combaciano'
    },
    'Wrong password': {
      it: 'Password errata'
    },
    'Invalid e-mail': {
      it: 'E-mail non valida'
    },
    'E-mail already used': {
      it: 'E-mail già utilizzata'
    },
    'E-mails don\'t match': {
      it: 'Gli indirizzi non combaciano'
    },
    'You must specify a region': {
      it: 'Devi specificare una regione'
    },
    'You must specify a province': {
      it: 'Devi specificare una provincia'
    },
    'You must specify a city': {
      it: 'Devi specificare una città'
    },
    'You must specify an institute': {
      it: 'Devi specificare un istituto'
    },
    'Title is too short': {
      it: 'Titolo troppo corto'
    },
    'Description is too short': {
      it: 'Descrizione troppo corta'
    },
    'Text is too short': {
      it: 'Testo troppo corto'
    },
    'User already exists': {
      it: 'Utente già esistente'
    },

    // Notifications
    'Welcome back': {
      it: 'Bentornato'
    },
    'Login error': {
      it: 'Login errato'
    },
    'Make sure your internet connection is working and, if this error occurs again, contact an administrator.': {
      it: 'Assicurati che la tua connessione a internet sia funzionante e, se l\'errore dovesse ripetersi, contatta un amministratore.'
    },
    'Goodbye': {
      it: 'Arrivederci'
    },
    'User doesn\'t exist': {
      it: 'Utente non esistente'
    },
    'Internal error. Make sure your internet connection is working well and, if this error occurs again, contact an administrator.': {
      it: 'Errore interno. Assicurati che la tua connessione a internet sia funzionante e, se l\'errore dovesse ripetersi, contatta un amministratore.'
    },
    'Internal error': {
      it: 'Errore interno'
    },
    'Topic created': {
      it: 'Argomento creato'
    },
    'Reply sent': {
      it: 'Risposta inviata'
    },
    'Edit saved': {
      it: 'Modifica salvata'
    },
    'Delete completed': {
      it: 'Eliminazione completata'
    },
    'Connection error': {
      it: 'Errore di connessione'
    },
    'Unauthorized': {
      it: 'Non autorizzato'
    },
    'Not found': {
      it: 'Non trovato'
    },

    // Forum
    'Forums': {
      it: 'Forum'
    }
  })
  .factory('l10n', function(words) {
    if (localStorage.getItem("language") == undefined) {
      // Detect browser language (ISO 639) and save it in localStorage
      var language = navigator.userLanguage || navigator.language;
      if (language.length > 2)
        language = language.substring(0, 2);
      localStorage.setItem("language", language);
    }
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
      getLanguage: function() {
        return localStorage.getItem("language") || "en";
      },
      setLanguage: function(language) {
        localStorage.setItem("language", language);
      }
    };
  })
  .filter('l10n', function(l10n) {
    return l10n.get;
  });
