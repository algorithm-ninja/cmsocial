/* esempio_vettori.c: 
   uso delle operazioni in vettori.h per un dizionario
   Roberto Grossi, Universita' di Pisa, grossi@di.unipi.it, 2014
*/

#include "vettori.h"

int main(){
  vettore * miovettore = vettoreCrea();
  vettore * tuovettore = vettoreCrea();
  int i;
  elemento k;

  vettoreINS(miovettore, 5);
  vettoreINS(miovettore, 9);
  vettoreINS(miovettore, 2);

     printf( "mio vettore (%d,%d):\t", vettoreSIZE(miovettore), miovettore->dimensione );

     vettorePRT( miovettore );

     printf( "tuo vettore (%d,%d):\t", vettoreSIZE(tuovettore), tuovettore->dimensione );
     vettorePRT( tuovettore );

  vettoreINS(tuovettore, 15);
  vettoreINS(tuovettore, 19);
  vettoreINS(tuovettore, 12);
  vettoreINS(tuovettore, 7);

     printf( "tuo vettore (%d,%d):\t", vettoreSIZE(tuovettore), tuovettore->dimensione );
     vettorePRT( tuovettore );

  vettoreINS(tuovettore, 4); /* raddoppio con MIN_SIZE = 4 */

     printf( "tuo vettore (%d,%d):\t", vettoreSIZE(tuovettore), tuovettore->dimensione );
     vettorePRT( tuovettore );

  vettoreINS(tuovettore, 37);
  vettoreINS(tuovettore, 24);
  vettoreINS(tuovettore, 44);

     printf( "tuo vettore (%d,%d):\t", vettoreSIZE(tuovettore), tuovettore->dimensione );
     vettorePRT( tuovettore );

  vettoreINS(tuovettore, 29);  /* raddoppio con MIN_SIZE = 4 */

     printf( "tuo vettore (%d,%d):\t", vettoreSIZE(tuovettore), tuovettore->dimensione );
     vettorePRT( tuovettore );

  vettoreDEL(tuovettore, 7); 

     printf( "tuo vettore (%d,%d):\t", vettoreSIZE(tuovettore), tuovettore->dimensione );
     vettorePRT( tuovettore );

  vettoreDEL(tuovettore, 15); 

     printf( "tuo vettore (%d,%d):\t", vettoreSIZE(tuovettore), tuovettore->dimensione );
     vettorePRT( tuovettore );

  vettoreDEL(tuovettore, 4); 

     printf( "tuo vettore (%d,%d):\t", vettoreSIZE(tuovettore), tuovettore->dimensione );
     vettorePRT( tuovettore );

  vettoreDEL(tuovettore, 19); 

     printf( "tuo vettore (%d,%d):\t", vettoreSIZE(tuovettore), tuovettore->dimensione );
     vettorePRT( tuovettore );

  vettoreDEL(tuovettore, 37); 

     printf( "tuo vettore (%d,%d):\t", vettoreSIZE(tuovettore), tuovettore->dimensione );
     vettorePRT( tuovettore );

  vettoreDEL(tuovettore, 12);  /* dimezzamento con MIN_SIZE = 4 */

     printf( "tuo vettore (%d,%d):\t", vettoreSIZE(tuovettore), tuovettore->dimensione );
     vettorePRT( tuovettore );

  vettoreDEL(tuovettore, 24); 

     printf( "tuo vettore (%d,%d):\t", vettoreSIZE(tuovettore), tuovettore->dimensione );
     vettorePRT( tuovettore );

  vettoreDEL(tuovettore, 44);  /* dimezzamento con MIN_SIZE = 4 */

     printf( "tuo vettore (%d,%d):\t", vettoreSIZE(tuovettore), tuovettore->dimensione );
     vettorePRT( tuovettore );


  vettoreDEL(tuovettore, 29); 

     printf( "tuo vettore (%d,%d):\t", vettoreSIZE(tuovettore), tuovettore->dimensione );
     vettorePRT( tuovettore );


  return 0;
}
