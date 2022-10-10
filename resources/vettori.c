/* vettori.c: 
   descrive la realizzazione delle operazioni in vettori.h 
   sono ammessi elementi ripetuti (con molteplicita' maggiore di 1)
   Roberto Grossi, Universita' di Pisa, grossi@di.unipi.it, 2014
*/

#include "vettori.h"

#define MIN_SIZE  4

vettore * vettoreCrea( ){
  vettore *V = (vettore *) malloc( sizeof(vettore) );

  V->darray = (elemento *) malloc ( sizeof(elemento) * MIN_SIZE );
  V->dimensione = MIN_SIZE;
  V->n = 0;
  return V;
}

void verificaRaddoppio( vettore *V ){
  elemento *a;
  int i;

  if ( V->n == V->dimensione ) {
    V->dimensione = V->dimensione * 2;
    a = (elemento *) malloc( sizeof(elemento) * V->dimensione );
    for ( i=0; i < V->n; i++ )
      a[i] = V->darray[i];
    free( V->darray );
    V->darray = a;
  }
}

void verificaDimezzamento( vettore *V ){
  elemento *a;
  int i;

  if ( (V->dimensione >= 2*MIN_SIZE) && (V->n == V->dimensione/4) ) {
    V->dimensione = V->dimensione / 2;
    a = (elemento *) malloc( sizeof(elemento) * V->dimensione );
    for ( i=0; i < V->n; i++ )
      a[i] = V->darray[i];
    free( V->darray );
    V -> darray = a;
  }
}

int vettoreINS(vettore *V, elemento x){
  verificaRaddoppio( V );
  V->darray[V->n] = x;
  V->n++;
  return V->n;
}

int vettoreSRC(vettore *V, elemento x){
  int i;
  i = 0;
  while ( i < V->n && V->darray[i] != x )
    i++;
  return (i < V->n) ? i : -1;
}

void vettoreDEL(vettore *V, elemento x){ /* cancella la prima occorrenza di x */
  int i = vettoreSRC( V, x );
  if (i != -1) { /* elemento trovato in posizione i */
    verificaDimezzamento( V );
    V->darray[i] = V->darray[V->n - 1];
    V->n--;
  }
}

void vettorePRT(vettore *V){
  int i;
  for ( i=0; i < V->n; i++)
    printf( " %d", V->darray[i] );
  printf( "\n" );
}

int vettoreSIZE(vettore *V){
  return V->n;
}

