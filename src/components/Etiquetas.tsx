import { useState, useEffect, useRef } from "react";
import { db } from "../lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { Search, Package, Printer, ArrowLeft } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { LabelPreview } from "./LabelPreview";
import { defaultConfig, LabelConfig } from "../types";

const LabelPreviewGroup = ({ config, items, isPrint = false }: any) => {
  const columns = config.columns || 1;
  const chunks = [];
  for (let i = 0; i < items.length; i += columns) {
    chunks.push(items.slice(i, i + columns));
  }

  return (
    <>
      {chunks.map((chunk: any[], idx: number) => (
        <div key={idx} style={isPrint ? { pageBreakAfter: 'always' } : { marginBottom: '20px', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' }}>
          <LabelPreview config={config} configs={chunk} />
        </div>
      ))}
    </>
  );
};

export default function Etiquetas() {
  const [produtos, setProdutos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProdutos, setSelectedProdutos] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  const [config, setConfig] = useState<LabelConfig>(defaultConfig);
  const [zoom, setZoom] = useState(1.2);

  useEffect(() => {
    const q = query(
      collection(db, "produtos"),
      orderBy("dataCadastro", "desc"),
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prods = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProdutos(prods);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredProdutos = produtos.filter(
    (p) =>
      p.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.marca?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.categoria?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.subcategoria?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.tamanho?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.cor?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const toggleSelect = (produto: any) => {
    if (selectedProdutos.find(p => p.id === produto.id)) {
      setSelectedProdutos(selectedProdutos.filter(p => p.id !== produto.id));
    } else {
      setSelectedProdutos([...selectedProdutos, produto]);
    }
  };

  const handleEditLabels = () => {
    if (selectedProdutos.length === 0) return;
    const newConfig: LabelConfig = {
      ...config,
      labelType: "retail",
      marca: "PAAUV",
      showMarca: true,
      cat: "BAZAR",
    };
    setConfig(newConfig);
    setIsEditing(true);
  };

  const handlePrint = () => {
    setTimeout(() => {
      window.print();
    }, 100);
  };

  if (isEditing) {
    const configsToPrint = selectedProdutos.map((produto) => {
      let subcatOuCat = produto.subcategoria || produto.categoria || "";
      const marca = produto.marca && produto.marca !== 'Sem Marca' ? produto.marca : "";
      
      let nomeProduto = `${subcatOuCat} ${marca}`.trim() || "Produto";
      if (nomeProduto.length > 25) {
        nomeProduto = `${subcatOuCat.substring(0, 25 - marca.length - 1)} ${marca}`.trim();
      }
      
      const catMatch = produto.categoria?.match(/CAT\s*(\d+)/i);
      const catShort = catMatch ? catMatch[1] : (produto.categoria || "-");
      
      return {
        ...config,
        produto: nomeProduto,
        codeValue: produto.codigo || "",
        barcodeTextValue: produto.codigo || "",
        preco: produto.preco ? produto.preco.toFixed(2).replace(".", ",") : "0,00",
        details: [
          { id: "1", label: "CAT:", value: catShort, show: true },
          { id: "2", label: "TAM:", value: produto.tamanho || "-", show: !!produto.tamanho },
          { id: "3", label: "COR:", value: produto.cor || "-", show: !!produto.cor },
          { id: "4", label: "SETOR:", value: produto.genero || "-", show: !!produto.genero },
        ],
      };
    });

    return (
      <div className="-mx-4 sm:-mx-6 lg:-mx-8 -my-8 md:-my-12 min-h-[calc(100vh-4rem)] flex flex-col bg-slate-100 overflow-hidden text-slate-800 font-sans print:m-0 print:h-auto print:bg-white print:overflow-visible relative z-50">
        <style type="text/css" media="print">
          {`
            @page {
              size: ${config.width}mm ${config.height}mm;
              margin: 0;
            }
          `}
        </style>

        {/* Back to list button */}
        <div className="bg-wero-black text-white px-4 py-2 flex items-center gap-4 print:hidden shrink-0 h-14">
          <button
            onClick={() => setIsEditing(false)}
            className="flex items-center gap-2 text-sm font-bold uppercase hover:text-wero-yellow transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Estoque
          </button>
          <div className="h-4 w-px bg-white/20"></div>
          <span className="font-classic text-sm truncate opacity-80">
            Editando {selectedProdutos.length} etiqueta(s)
          </span>
        </div>

        <div className="print:hidden">
          <TopBar
            zoom={zoom}
            setZoom={setZoom}
            config={config}
            setConfig={setConfig}
            onPrint={handlePrint}
          />
        </div>

        <div className="flex flex-1 overflow-hidden print:overflow-visible print:block relative">
          <div className="print:hidden h-full shrink-0">
            <Sidebar config={config} setConfig={setConfig} />
          </div>

          <div
            className="flex-grow bg-slate-200 flex justify-center items-start overflow-auto relative print:hidden p-8"
            style={{
              backgroundImage: "radial-gradient(#cbd5e1 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          >
            <div
              className="origin-top flex flex-col gap-8 items-center"
              style={{ transform: `scale(${zoom})` }}
            >
              <div className="text-center text-xs font-bold text-slate-500 uppercase tracking-wider print:hidden">
                Tamanho Real ({config.width}mm x {config.height}mm)
              </div>
              <LabelPreviewGroup config={config} items={configsToPrint} />
            </div>
          </div>

          {/* PRINT ONLY CONTAINER */}
          <div className="hidden print:block w-full h-full m-0 p-0 overflow-visible bg-white z-50">
            <LabelPreviewGroup config={config} items={configsToPrint} isPrint={true} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-wero-yellow border-2 border-wero-black shadow-wero-sm">
            <Printer className="w-8 h-8 text-wero-black" />
          </div>
          <h1 className="impact-headline text-4xl">Impressão de Etiquetas</h1>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          {selectedProdutos.length > 0 && (
            <button
              onClick={handleEditLabels}
              className="px-6 py-2 bg-wero-black text-wero-white font-impact uppercase tracking-wider hover:bg-wero-pink transition-colors flex items-center gap-2 whitespace-nowrap shadow-wero-sm"
            >
              <Printer className="w-4 h-4" />
              Imprimir ({selectedProdutos.length})
            </button>
          )}
          <div className="relative w-full md:w-72">
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e: any) => setSearchTerm(e.target.value)}
              className="w-full border-2 border-wero-black bg-wero-white pl-10 pr-4 py-2 font-classic text-sm focus:outline-none focus:ring-0 focus:border-wero-pink transition-colors"
            />
            <Search className="w-4 h-4 absolute left-3 top-3 text-wero-black/50" />
          </div>
        </div>
      </div>

      <div className="bg-wero-white border-2 border-wero-black shadow-wero overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-wero-grey border-b-2 border-wero-black font-impact font-bold uppercase text-xs tracking-wider">
                <th className="p-4 w-12 text-center">
                  <input 
                    type="checkbox"
                    className="w-4 h-4 border-2 border-wero-black rounded-none checked:bg-wero-black focus:ring-0 cursor-pointer"
                    checked={selectedProdutos.length === filteredProdutos.length && filteredProdutos.length > 0}
                    onChange={(e: any) => {
                      if (e.target.checked) {
                        setSelectedProdutos([...filteredProdutos]);
                      } else {
                        setSelectedProdutos([]);
                      }
                    }}
                  />
                </th>
                <th className="p-4">Código</th>
                <th className="p-4">Produto</th>
                <th className="p-4">Categoria</th>
                <th className="p-4">Preço</th>
              </tr>
            </thead>
            <tbody className="font-classic text-sm">
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-8 text-center text-wero-black/60"
                  >
                    Carregando estoque...
                  </td>
                </tr>
              ) : filteredProdutos.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-8 text-center text-wero-black/60"
                  >
                    Nenhum produto encontrado no estoque.
                  </td>
                </tr>
              ) : (
                filteredProdutos.map((produto) => (
                  <tr
                    key={produto.id}
                    className={`border-b border-wero-black/10 hover:bg-wero-yellow/20 transition-colors cursor-pointer ${selectedProdutos.find(p => p.id === produto.id) ? 'bg-wero-yellow/10' : ''}`}
                    onClick={() => toggleSelect(produto)}
                  >
                    <td className="p-4 text-center">
                      <input 
                        type="checkbox"
                        className="w-4 h-4 border-2 border-wero-black rounded-none checked:bg-wero-black focus:ring-0 cursor-pointer"
                        checked={!!selectedProdutos.find(p => p.id === produto.id)}
                        onChange={() => {}} // handled by row click
                      />
                    </td>
                    <td className="p-4 font-mono text-xs">
                      {produto.codigo || "N/A"}
                    </td>
                    <td className="p-4 font-semibold flex items-center gap-2">
                      <Package className="w-4 h-4 text-wero-black/40 hidden md:block" />
                      <div>
                        {produto.nome}
                        {produto.marca && (
                          <span className="text-xs font-normal text-wero-black/60 block md:inline md:ml-1">
                            ({produto.marca})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      {produto.subcategoria ? `${produto.categoria} > ${produto.subcategoria}` : produto.categoria}
                    </td>
                    <td className="p-4 font-semibold text-wero-carrot">
                      R$ {produto.preco?.toFixed(2).replace(".", ",")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
