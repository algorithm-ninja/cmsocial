/* vettori.h: 
   definisce i tipi e le operazioni supportate
   Roberto Grossi, Universita' di Pisa, grossi@di.unipi.it, 2014
*/

#include <stdlib.h>
#include <stdio.h>

#ifndef VETTORIH
#define VETTORIH

typedef int elemento;

typedef struct vettorehead vettore;
struct vettorehead { 
  elemento *darray;
  int dimensione;
  int n; /* numero di elementi <= dimensione */
};

vettore * vettoreCrea( );
int vettoreINS(vettore *, elemento);
void vettoreDEL(vettore *, elemento);
int vettoreSRC(vettore *, elemento); 
void vettorePRT(vettore *);
int vettoreSIZE(vettore *);

#endif
