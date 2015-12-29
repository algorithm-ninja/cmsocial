/* liste.h: 
   definisce i tipi e le operazioni supportate
   sono ammessi elementi ripetuti (con molteplicita' maggiore di 1)
   Roberto Grossi, Universita' di Pisa, grossi@di.unipi.it, 2014
*/

#include <stdlib.h>
#include <stdio.h>

#ifndef LISTEH
#define LISTEH

typedef int elemento;

typedef struct nodo* punt;
struct nodo { 
  elemento chiave;
  punt succ;
};

typedef struct listahead lista;
struct listahead { 
  punt testa;
  int lung;
};

lista * listaCrea( );
punt listaINS(lista *, elemento);
punt listaDEL(lista *, elemento);
punt listaSRC(lista *, elemento); 
punt listaSRC_moveToFront(lista *, elemento);
void listaPRT(lista *);
int listaSIZE(lista *);

#endif
