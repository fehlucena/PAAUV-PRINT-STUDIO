export function avaliarLocal(params: any) {
  const { cat, estado, marcaFinal, semMarca, apelo, tipoBazar, itemType } = params;
  
  const mLow = semMarca ? "" : (marcaFinal || "").toLowerCase();
  
  if (estado.startsWith("Reprovar")) {
    return {
      tipo_bazar: tipoBazar, categoria_codigo: cat.cod, categoria_nome: cat.nome,
      tipo_peca: cat.nome, nivel: "REPROVADA", preco: 0, regra35: false,
      valor_mercado_pesquisado: null, marca_identificada: semMarca ? null : marcaFinal,
      marca_grupo: null, com_ressalva: false, estado_avaliado: estado,
      justificativa: "Peça descartada devido ao estado (dano sério, mancha, etc.). A regra é não passar para a venda.",
      alertas: [], revisao_necessaria: false, pesquisou_web: false
    };
  }
  
  const isMega = tipoBazar === "mega";
  const tblMega = {N1:5,N2:10,N3:20,N4:30,N5:50,N6:80,N7:100,P1:120,P2:150};
  const tblFixo = {N1:10,N2:20,N3:30,N4:50,N5:80,N6:100,N7:120,N8:150,N9:200,N10:250};
  const tbl = isMega ? tblMega : tblFixo;
  
  let groupC = ["burberry", "hugo boss", "armani", "prada", "gucci", "louis vuitton", "coach", "michael kors", "chanel", "dior", "hermes", "fendi", "versace", "valentino", "balenciaga", "yves saint laurent", "ysl", "givenchy", "carolina herrera", "victor hugo", "dolce & gabbana", "cartier", "bulgari", "bvgari", "louboutin", "off-white"].some(m => mLow.includes(m));
  
  let groupB = ["osklen", "lacoste", "calvin klein", "ralph lauren", "schutz", "dudalina", "richards", "animale", "le lis blanc", "bobô", "bobo", "carmim", "john john", "brooksfield", "cavalera", "forum", "tommy hilfiger", "diesel", "levis", "levi's", "arezzo", "luiza barcelos", "capodarte", "santa lolla", "cantão", "cantao", "farm", "nike", "adidas", "puma", "asics", "mizuno", "vans", "converse", "oakley", "fila", "new balance", "shoulder", "colcci", "melissa", "reserva", "dzarm", "siberian", "aeropostale", "aero", "hollister", "abercrombie", "triton", "ellus", "damyller"].some(m => mLow.includes(m));
  
  let isZara = mLow.includes("zara");
  
  let groupA = ["hering", "renner", "c&a", "cea", "riachuelo", "marisa", "forever 21", "shein", "shopee", "youcom", "cotton on", "gap", "amaro", "zattini", "malwee", "lupo", "polo wear", "tng", "zara", "zatti", "zinzane", "maria filó", "maria filo", "morena rosa", "dress to", "salinas", "billabong", "rip curl", "quiksilver"].some(m => mLow.includes(m));
  
  let tenisEspecial = cat.cod === "CAT8" && ["jordan", "air force", "air max", "990", "2002r", "yeezy", "asics premium"].some(m => mLow.includes(m));
  let isPremiumShoe = cat.cod === "CAT8" && groupB;
  
  let marcaResp = groupC ? "C" : groupB ? "B" : (!semMarca ? "A" : null);
  
  const isNova = estado.startsWith("Nova com etiqueta");
  const isImpecavel = estado.startsWith("Usada impecável");
  const isBoa = estado.startsWith("Boa");
  const isRes = estado.startsWith("Com ressalva");

  // Determine base level points
  let pts = 1; // N1 Base
  if (isBoa) pts = 2; // R$20 Fixo / 10 Mega
  if (isImpecavel) pts = 3; // R$30 Fixo / 20 Mega
  if (isNova) pts = 3; // R$30 Fixo / 20 Mega

  // Category specific base levels
  if (cat.cod === "CAT4") { // Vestidos / Macacões
    // Small boost for dresses, but don't force high numbers
    pts += 1;
    if (isNova && (groupB || isZara)) pts += 1; // boost Zara/GroupB dresses
  } else if (cat.cod === "CAT5") { // Casacos pesados
    if (itemType?.includes("Pesado") || itemType?.includes("Premium") || itemType?.includes("Couro")) {
      pts = Math.max(pts, 4);
    }
  } else if (cat.cod === "CAT6") { // Blazer (piso R$30)
    pts = Math.max(pts, 3); // Starts at N3
  } else if (cat.cod === "CAT7") { // Infantil 
    if (!groupB && !groupC) pts = Math.min(pts, 2); 
  } else if (cat.cod === "CAT8") { // Calçados
    if (isBoa) pts = Math.max(pts, 2);
    if (isImpecavel) pts = Math.max(pts, 3);
    if (isNova) pts = Math.max(pts, 4);
  }

  // Brand modifiers
  if (groupB) {
    pts += 2;
  } else if (groupC) {
    pts += 4;
  } else if (!semMarca) {
    // group A or Unknown brand
    // For standard brands, give slight edge if untouched
    // Note: Do not blindly add pts as fast fashion caps early
    // We remove the "+1" here to avoid inflating basic items
    if (!isNova && !apelo && pts > 4) pts = 4; // Regular items cap at R$50 Fixo / R$30 Mega
    if (isNova && pts > 5) pts = 5; // Basic new items don't exceed N5 (R$80 Fixo)
  } else {
    // Sem marca
    if (!isNova && pts > 3) pts = 3; // Caps at R$30 for sem marca
  }

  // Apelo visual
  if (apelo && !groupC) pts += 1;

  // Ressalva penalty
  if (isRes) pts -= 1;

  // Level Caps and Limits
  if (pts < 1) pts = 1;
  if (!groupC && !tenisEspecial && pts > 7) pts = 7; // Regular items cap
  if (isMega && cat.cod === "CAT7" && pts > 4) pts = 4;

  let nv = `N${pts}`;
  let val = (tbl as any)[nv] || (isMega ? 5 : 10);
  
  let rev = false;
  let regra35 = false;
  let just = "Avaliada conforme regra da arara.";
  let pesquisouWeb = false;
  let valorMercado: number | null = null;
  
  if (cat.cod === "CAT8" && isPremiumShoe && groupB) {
    rev = true;
    regra35 = true;
    nv = isMega ? "N7" : "N8";
    val = (tbl as any)[nv];
    just = "Calçado esportivo ou de marca premium detectado. Aplicado regra dos 35% de novo na web.";
  } else if (groupC) {
    rev = true;
    just = "Marca Premium de Luxo detectada (Grupo C). Precisa de autenticação e pesquisa de regra dos 35%.";
  } else if (pts >= 6) {
    rev = true;
    just += " Preço elevado, requer aprovação do responsável.";
  } else {
    if (isRes) just = "Aplicado redutor de valor devido a pequenas marcas de uso.";
    else if (groupB) just = "Marca Grupo B influencia positivamente o valor.";
    else if (groupA) just = "Marca Grupo A (bom estado) atinge até o limite simples.";
  }
  if (apelo) just += " Apresenta destaque visual perceptível.";

  if (nv.startsWith("N")) {
     if (isMega && pts === 7) nv = "N7";
     if (isMega && pts === 8) { nv="P1"; val=120; }
     if (isMega && pts >= 9) { nv="P2"; val=150; }
  }

  return {
    tipo_bazar: tipoBazar, categoria_codigo: cat.cod, categoria_nome: cat.nome,
    tipo_peca: itemType || cat.nome, nivel: nv, preco: val, regra35,
    valor_mercado_pesquisado: null, marca_identificada: semMarca ? null : marcaFinal,
    marca_grupo: marcaResp, com_ressalva: isRes, estado_avaliado: estado,
    justificativa: just,
    alertas: groupC ? ["Atenção: Verifique a autenticidade antes da venda."] : [], 
    revisao_necessaria: rev, pesquisou_web: false
  };
}
