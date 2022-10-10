/* esempio_liste.c: 
   uso delle operazioni in liste.h per un dizionario
   Roberto Grossi, Universita' di Pisa, grossi@di.unipi.it, 2014
*/

#include "liste.h"

int main(){
  lista * mialista = listaCrea();
  lista * tualista = listaCrea();
  punt p;
  elemento k;

  listaINS(mialista, 5);
  listaINS(mialista, 9);
  listaINS(mialista, 2);

  listaINS(tualista, 15);
  listaINS(tualista, 19);
  listaINS(tualista, 12);

  printf( "mia lista (%d):", listaSIZE(mialista) );
  listaPRT( mialista );

  printf( "tua lista (%d):", listaSIZE(tualista) );
  listaPRT( tualista );

  listaDEL(mialista, 9);
  listaDEL(tualista, 12);

  printf( "mia lista (%d):", listaSIZE(mialista) );
  listaPRT( mialista );

  printf( "tua lista (%d):", listaSIZE(tualista) );
  listaPRT( tualista );

  listaINS(mialista, 7);

  printf( "mia lista (%d):", listaSIZE(mialista) );
  listaPRT( mialista );
    
  k = 18;
  p = listaSRC(mialista, k);
  if (p != NULL) 
    printf( "chiave %d trovata\n", p->chiave);
  else
    printf( "chiave %d NON trovata\n", k);

  k = 2;
  p = listaSRC(mialista, k);
  if (p != NULL) 
    printf( "chiave %d trovata\n", p->chiave);
  else
    printf( "chiave %d NON trovata\n", k);

  printf( "mia lista (%d):", listaSIZE(mialista) );
  listaPRT( mialista );

  printf( "\n" );

  k = 2;
  p = listaSRC_moveToFront(mialista, k);
  if (p != NULL) 
    printf( "chiave %d trovata con moveToFront\n", p->chiave);
  else
    printf( "chiave %d NON trovata\n", k);

  printf( "mia lista (%d):", listaSIZE(mialista) );
  listaPRT( mialista );

  k = 5;
  p = listaSRC_moveToFront(mialista, k);
  if (p != NULL) 
    printf( "chiave %d trovata con moveToFront\n", p->chiave);
  else
    printf( "chiave %d NON trovata\n", k);

  printf( "mia lista (%d):", listaSIZE(mialista) );
  listaPRT( mialista );

  k = 2;
  p = listaSRC_moveToFront(mialista, k);
  if (p != NULL) 
    printf( "chiave %d trovata con moveToFront\n", p->chiave);
  else
    printf( "chiave %d NON trovata\n", k);

  printf( "mia lista (%d):", listaSIZE(mialista) );
  listaPRT( mialista );

  return 0;
}
