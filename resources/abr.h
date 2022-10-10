/* abr.h: 
   definisce i tipi e le operazioni supportate dagli alberi binari di ricerca 
   sono ammessi elementi distinti (con molteplicita' uguale a 1)
   Roberto Grossi, Universita' di Pisa, grossi@di.unipi.it, 2014
*/

#include <stdlib.h>
#include <stdio.h>

#ifndef ABRH
#define ABRH

typedef int elemento;

typedef struct nodoabr *pos;
struct nodoabr{
  elemento chiave;
  pos sx;
  pos dx;
};

typedef struct headabr alberobinarioricerca;

struct headabr {
  pos radice;
  int lung;
};

alberobinarioricerca * abrCrea( );
pos abrSRC( alberobinarioricerca *, elemento ); 
void abrINS( alberobinarioricerca *, elemento );
void abrDEL( alberobinarioricerca *, elemento );
void abrPRT( alberobinarioricerca * );
int abrSIZE( alberobinarioricerca * );

#endif
