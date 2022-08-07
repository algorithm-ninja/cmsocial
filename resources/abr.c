/* abr.h: 
   descrive la realizzazione delle operazioni in abr.h
   Roberto Grossi, Universita' di Pisa, grossi@di.unipi.it, 2014 
*/

#include "abr.h"

alberobinarioricerca * abrCrea( ){
  alberobinarioricerca * A = (alberobinarioricerca *) malloc( sizeof(alberobinarioricerca) );
  A->radice = NULL;
  A->lung = 0;
  return A;
}


pos abrSRC( alberobinarioricerca *A, elemento x){ 
  pos t = A->radice;
  
  while ( t != NULL ) {
    if( x < t->chiave )
      t = t->sx;
    else if( x > t->chiave )
      t = t->dx;
    else  // x == t->chiave
      break;
  }
  return t;
}


/* INSERIMENTO */

int aumenta_lung = 1;

pos recINS( pos u, elemento x ){
  if ( u == NULL ){
    u = (pos) malloc( sizeof(struct nodoabr) );
    u->chiave = x;
    u->sx = u->dx = NULL;
  } else if ( x < u->chiave )
    u->sx = recINS( u->sx, x);
  else if ( x > u->chiave )
    u->dx = recINS( u->dx, x);
  else 
    aumenta_lung = 0;   /* elemento gia' presente */
  return u;
}

void abrINS( alberobinarioricerca *A, elemento x){
  aumenta_lung = 1;
  A->radice = recINS( A->radice, x );
  A->lung += aumenta_lung;
}
  

/* CANCELLAZIONE */

int diminuisci_lung = 1;

pos recDEL( pos u, elemento x ){
  pos w;
  if ( u == NULL )
    diminuisci_lung = 0;
  else {
    if ( x == u->chiave ){
      if ( u->sx == NULL )  /* casi 1 e 2: almeno un figlio uguale a NULL */
	u = u->dx;
      else if ( u->dx == NULL )  /* casi 1 e 2: almeno un figlio uguale a NULL */
	u = u->sx;
      else {  /* caso 3: entrambi i figli sono diversi da NULL  */
	w = u->dx;
	while ( w->sx != NULL )
	  w = w->sx;
	/* w contiene la min chiave del sottoalbero dx di u */
	u->chiave = w->chiave;
	recDEL( u->dx, w->chiave ); /* w->chiave e' adesso un duplicato */
      }
    } else if ( x < u->chiave) 
      u->sx = recDEL( u->sx, x );
    else /* if ( x > u->chiave) */
      u->dx = recDEL( u->dx, x );
  }
  return u;
}

void abrDEL( alberobinarioricerca *A, elemento x){
  diminuisci_lung = 1;
  A->radice = recDEL( A->radice, x );
  A->lung -= diminuisci_lung;
}
  


/* Funzioni ausiliari per abrPRT */
void PTD ( pos u, int ell, char c ) {
  int i;
  
  if ( u->dx != NULL )
    PTD( u->dx, ell + 1, '/' );
  for ( i = 0; i < ell; i++ )
    printf("        ");
  printf( "%c ", c );
  printf("%d\n", u->chiave);
  if (u->sx != NULL)
    PTD(u->sx, ell + 1, '\\');  
}

void abrPRT( alberobinarioricerca *A ) {
 if ( A->radice != NULL )
    PTD( A->radice, 0, ' ' );
}

int abrSIZE( alberobinarioricerca *A ) {
  return A->lung;
}





