/* liste.c: 
   descrive la realizzazione delle operazioni in liste.h 
   sono ammessi elementi ripetuti (con molteplicita' maggiore di 1)
   Roberto Grossi, Universita' di Pisa, grossi@di.unipi.it, 2014
*/

#include "liste.h"

lista * listaCrea( ){ 
  lista *L = (lista*) malloc (sizeof(lista) );
  L->testa = NULL;
  L->lung = 0;
  return L;
}

punt listaINS(lista *L, elemento x) {
  punt p = (punt) malloc(sizeof(struct nodo));
  p->chiave = x;    
  p->succ = L->testa;
  L->testa = p;
  L->lung++;
  return p;
}

punt listaDEL(lista *L, elemento x) {
  punt p = L->testa;
  punt pp = NULL;

  while( (p != NULL) && (p->chiave != x) ) {
    pp = p;
    p = p->succ;
  }

  if (p != NULL) {
    if (pp == NULL)  /* primo elemento nella lista */
      L->testa = p->succ;
    else
      pp->succ = p->succ;
    p->succ = NULL; /* facoltativo */
    L->lung--;
  }
  return p;  /* nodo p va eventualmente deallocato con free */
}

punt listaSRC(lista *L, elemento x) {
  punt p = L->testa;
  while( p != NULL && p->chiave != x )
    p = p->succ;
  return p;
}

punt listaSRC_moveToFront(lista *L, elemento x) {
  punt p = L->testa;
  punt pp = NULL;

  while( p != NULL && p->chiave != x ) {
    pp = p;
    p = p->succ;
  }
  if (p != NULL && pp != NULL) { /* elemento trovato non appare come primo della lista */
    pp->succ = p->succ;
    p->succ = L->testa;
    L->testa = p;
  }
  return p;  
}

void listaPRT(lista *L){
  punt p = L->testa;

  while( p != NULL ){
    printf(" %d", (int) p->chiave);
    p = p->succ;
  }
  printf( "\n");
}

int listaSIZE(lista *L){
  return L->lung;
}

