/* hash.h: 
   definisce i tipi e le operazioni supportate dalle tabelle hash con liste concatenate 
   sono ammessi elementi distinti (con molteplicita' uguale a 1)
   Roberto Grossi, Universita' di Pisa, grossi@di.unipi.it, 2014
*/

#include "liste.h"

#ifndef HASHH
#define HASHH

#define TABLE_SIZE  7 //131   /* numero primo */
typedef struct hashhead tabellahash;
struct hashhead {
  lista * trabocco[TABLE_SIZE];
  int lung;
};

tabellahash * hashCrea( );
punt hashINS( tabellahash *, elemento );
punt hashSRC( tabellahash *, elemento );
punt hashDEL( tabellahash *, elemento );
void hashPRT( tabellahash *);
int hashSIZE( tabellahash *);

#endif
