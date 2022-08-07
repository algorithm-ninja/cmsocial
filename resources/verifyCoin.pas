program ideone;
const NUM_FACCE = 2;
      NUM_LANCI = 10000;
var a, i, numT, numC : integer;
begin
    Randomize();
    for i := 1 to NUM_LANCI do
    begin
       a := Random(NUM_FACCE);
       if a = 0 then
          numT := numT + 1
       else
          numC := numC + 1
    end;
    WriteLn('NUM_LANCI = ', NUM_LANCI);
    WriteLn('numT = ', numT);
    WriteLn('numC = ', numC);
end.

(* OBIETTIVO:
    sperimentere l'uso di vettori di variabili (array)
   TASK: verificare il bilanciamento di un dado a piu' facce
 *)
