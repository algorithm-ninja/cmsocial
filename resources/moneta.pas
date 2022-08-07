program ideone;
const NUM_FACCE = 2;
var a : integer;
begin
    Randomize();
    a := Random(NUM_FACCE);
    if a = 0 then
    begin
       WriteLn('esito del lancio: TESTA');
       WriteLn('evviva!!!');
    end
    else
    begin
       WriteLn('esito del lancio: CROCE');
       WriteLn('riprova sarai piu'' fortunato');
    end;
       
end.

(* OBIETTIVO DELLA LEZIONE:
     introdurre alle istruzioni di controllo condizionale (if)
 *)
