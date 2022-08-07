/* esempio_hash.c: 
   uso delle operazioni in hash.h per un dizionario
   Roberto Grossi, Universita' di Pisa, grossi@di.unipi.it, 2014
*/

#include "hash.h"

int main(){
  tabellahash * miahash = hashCrea();
  tabellahash * tuahash = hashCrea();
  punt p;
  elemento k;

  hashINS(miahash, 5);
  hashINS(miahash, 9);
  hashINS(miahash, 2);

  hashINS(tuahash, 15);
  hashINS(tuahash, 19);
  hashINS(tuahash, 12);

  printf( "mia hash (%d):\n", hashSIZE(miahash) );
  hashPRT( miahash );

  printf( "tua hash (%d):\n", hashSIZE(tuahash) );
  hashPRT( tuahash );

  hashDEL(miahash, 9);
  hashDEL(tuahash, 12);

  printf( "mia hash (%d):\n", hashSIZE(miahash) );
  hashPRT( miahash );

  printf( "tua hash (%d):\n", hashSIZE(tuahash) );
  hashPRT( tuahash );

  hashINS(miahash, 7);

  printf( "mia hash (%d):\n", hashSIZE(miahash) );
  hashPRT( miahash );
    
  k = 18;
  p = hashSRC(miahash, k);
  if (p != NULL) 
    printf( "chiave %d trovata\n", p->chiave);
  else
    printf( "chiave %d NON trovata\n", k);

  k = 2;
  p = hashSRC(miahash, k);
  if (p != NULL) 
    printf( "chiave %d trovata\n", p->chiave);
  else
    printf( "chiave %d NON trovata\n", k);


  return 0;
}
