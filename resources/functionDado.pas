program Dado;
const NUM_FACCE = 6;
var esito : integer;


function LancioDado(nFacce : integer) : integer;
begin
    LancioDado := 1 + Random(nFacce);
end;

begin
    Randomize();
    esito := LancioDado(NUM_FACCE);
    WriteLn('esito del lancio = ', esito);
end.

(* OBIETTIVO DELLA LEZIONE: introdurre alle funzioni
   TASK: migliorare il programma di lancio di un dado.
 *)
