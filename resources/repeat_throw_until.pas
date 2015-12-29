program Dado;
const NUM_FACCE = 6;
var esito : integer;

function LancioDado(nFacce : integer) : integer;
begin
    LancioDado := 1 + Random(nFacce);
end;

begin
    Randomize();
    repeat
       esito := LancioDado(NUM_FACCE);
       WriteLn('esito del lancio = ', esito);
    until esito = NUM_FACCE;
end.
