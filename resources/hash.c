/* hash.c: 
   descrive la realizzazione delle operazioni in hash.h
   Roberto Grossi, Universita' di Pisa, grossi@di.unipi.it, 2014
*/

#include "hash.h"

tabellahash * hashCrea( ){
  int i;
  tabellahash *T = (tabellahash*) malloc( sizeof(tabellahash) );
  for (i=0; i < TABLE_SIZE; i++)
    T->trabocco[i] = listaCrea( );
  T->lung = 0;
  return T;
}

lista * listadi(tabellahash *T, elemento x) {
  int hashval = (int)x % TABLE_SIZE;  /* semplice funzione hash */

  if ( hashval < 0 )
    hashval += TABLE_SIZE;
  return T->trabocco[hashval];
}

punt hashSRC(tabellahash *T, elemento x){
  lista * pL = listadi( T, x );
  return listaSRC( pL, x );
}

punt hashINS(tabellahash *T, elemento x){
  lista * pL = listadi( T, x );
  punt p = listaSRC( pL, x );

  if ( p == NULL ) {
    p = listaINS( pL, x );
    T->lung++;
  }
  return p;
}

punt hashDEL(tabellahash *T, elemento x){
  lista * pL = listadi( T, x );
  punt p = listaSRC( pL, x );

  if ( p != NULL ) {
    p = listaDEL( pL, x ); // Il nodo p va eventualmente deallocato con free
    T->lung--;
  }
  return p;
}

void hashPRT(tabellahash *T){
  int i;

  for (i=0; i < TABLE_SIZE; i++) {
    printf("%3d:", i);
    listaPRT( T->trabocco[i] );
  }
}

int hashSIZE(tabellahash *T){
  return T->lung;
}
