#define FALSE 0
#define TRUE 1

int n;

int ricercaBinaria( elemento *A, elemento x ){
  int sx, cx,dx, posizione, trovato;

  sx = 0;
  dx = n-1;
  posizione = -1;
  trovato = FALSE;
  while ( sx <= dx && !trovato ){
    cx = (sx+dx)/2;
    if ( x < A[cx] ) {
      dx = cx - 1;
    } else if ( x > A[cx] ) {
      sx = cx + 1;
    } else {  /* elemento trovato x == A[cx] */ 
      posizione = cx;
      trovato = TRUE;
    }
  }
  return posizione;
}
