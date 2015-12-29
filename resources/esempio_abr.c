/* esempio_abr.c: 
   uso delle operazioni in abr.h per un dizionario
   Roberto Grossi, Universita' di Pisa, grossi@di.unipi.it, 2014
*/

#include "abr.h"

int main(){
  alberobinarioricerca * mioabr = abrCrea();
  pos p;
  elemento k;

  abrINS(mioabr, 5);
  abrINS(mioabr, 9);
  abrINS(mioabr, 2);
  abrINS(mioabr, 7);
  abrINS(mioabr, 15);
  abrINS(mioabr, 19);
  abrINS(mioabr, 12);
  abrINS(mioabr, 14);

  printf( "mio abr (%d):\n", abrSIZE(mioabr) );
  abrPRT( mioabr );

  abrDEL(mioabr, 9);

  printf( "mio abr (%d):\n", abrSIZE(mioabr) );
  abrPRT( mioabr );
  
  k = 18;
  p = abrSRC(mioabr, k);
  if (p != NULL) 
    printf( "chiave %d trovata\n", p->chiave);
  else
    printf( "chiave %d NON trovata\n", k);

  k = 12;
  p = abrSRC(mioabr, k);
  if (p != NULL) 
    printf( "chiave %d trovata\n", p->chiave);
  else
    printf( "chiave %d NON trovata\n", k);

  return 0;
}
