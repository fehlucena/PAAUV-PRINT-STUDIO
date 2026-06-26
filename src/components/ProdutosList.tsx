import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Search, Package, X, Edit2, Check, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';

export default function ProdutosList() {
  const [produtos, setProdutos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduto, setSelectedProduto] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'produtos'), orderBy('dataCadastro', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prods = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProdutos(prods);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const [showFilters, setShowFilters] = useState(false);
  const [filterMarca, setFilterMarca] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('');
  const [filterCondicao, setFilterCondicao] = useState('');
  const [sortBy, setSortBy] = useState('data-desc');

  const uniqueMarcas = Array.from(new Set(produtos.map(p => p.marca).filter(Boolean))).sort();
  const uniqueCategorias = Array.from(new Set(produtos.map(p => p.categoria).filter(Boolean))).sort();
  const uniqueCondicoes = Array.from(new Set(produtos.map(p => p.condicao).filter(Boolean))).sort();
  
  const filteredProdutos = produtos.filter(p => {
    const searchLower = searchTerm.toLowerCase();
    const matchSearch = p.nome?.toLowerCase().includes(searchLower) ||
    p.marca?.toLowerCase().includes(searchLower) ||
    p.categoria?.toLowerCase().includes(searchLower) ||
    p.codigo?.toLowerCase().includes(searchLower) ||
    p.tamanho?.toLowerCase().includes(searchLower) ||
    p.cor?.toLowerCase().includes(searchLower);
    
    const matchMarca = filterMarca ? p.marca === filterMarca : true;
    const matchCategoria = filterCategoria ? p.categoria === filterCategoria : true;
    const matchCondicao = filterCondicao ? p.condicao === filterCondicao : true;
    
    return matchSearch && matchMarca && matchCategoria && matchCondicao;
  }).sort((a, b) => {
    if (sortBy === 'preco-asc') return (a.preco || 0) - (b.preco || 0);
    if (sortBy === 'preco-desc') return (b.preco || 0) - (a.preco || 0);
    if (sortBy === 'nome-asc') return (a.nome || '').localeCompare(b.nome || '');
    if (sortBy === 'nome-desc') return (b.nome || '').localeCompare(a.nome || '');
    // data-desc is default since they are ordered by dataCadastro in the query, but we can enforce it:
    if (sortBy === 'data-asc') return (a.dataCadastro?.seconds || 0) - (b.dataCadastro?.seconds || 0);
    return (b.dataCadastro?.seconds || 0) - (a.dataCadastro?.seconds || 0); // data-desc
  });

  const startEdit = () => {
    setEditForm({ ...selectedProduto });
    setIsEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'produtos', selectedProduto.id), {
        nome: editForm.nome,
        codigo: editForm.codigo,
        preco: Number(editForm.preco),
        marca: editForm.marca,
        categoria: editForm.categoria,
        tamanho: editForm.tamanho,
        cor: editForm.cor,
        condicao: editForm.condicao,
        nivel: editForm.nivel,
      });
      setSelectedProduto({ ...editForm, preco: Number(editForm.preco) });
      setIsEditing(false);
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar produto');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      try {
        await deleteDoc(doc(db, 'produtos', selectedProduto.id));
        setSelectedProduto(null);
        setIsEditing(false);
      } catch (error) {
        console.error(error);
        alert('Erro ao excluir produto');
      }
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-wero-pink border-2 border-wero-black shadow-wero-sm">
            <Search className="w-8 h-8 text-wero-black" />
          </div>
          <h1 className="impact-headline text-4xl">Estoque de Produtos</h1>
        </div>

        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-wero-white border-2 border-wero-black font-impact text-sm uppercase hover:bg-wero-grey transition-colors whitespace-nowrap"
          >
            Filtros
          </button>
          <div className="relative w-full md:w-72">
            <input
              type="text"
              placeholder="Buscar produtos, código, cor..."
              value={searchTerm}
              onChange={(e: any) => setSearchTerm(e.target.value)}
              className="w-full border-2 border-wero-black bg-wero-white pl-10 pr-4 py-2 font-classic text-sm focus:outline-none focus:ring-0 focus:border-wero-pink transition-colors"
            />
            <Search className="w-4 h-4 absolute left-3 top-3 text-wero-black/50" />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: 'auto', opacity: 1 }} 
            exit={{ height: 0, opacity: 0 }}
            className="mb-8 overflow-hidden bg-wero-white border-2 border-wero-black p-4 flex flex-col md:flex-row flex-wrap gap-4"
          >
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-bold uppercase opacity-70 block mb-1">Marca</label>
              <select value={filterMarca} onChange={(e: any)=>setFilterMarca(e.target.value)} className="w-full border-2 border-wero-black p-2 text-sm outline-none focus:bg-wero-yellow/20 bg-white">
                <option value="">Todas as Marcas</option>
                {uniqueMarcas.map(m => <option key={m as string} value={m as string}>{m as string}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-bold uppercase opacity-70 block mb-1">Categoria</label>
              <select value={filterCategoria} onChange={(e: any)=>setFilterCategoria(e.target.value)} className="w-full border-2 border-wero-black p-2 text-sm outline-none focus:bg-wero-yellow/20 bg-white">
                <option value="">Todas as Categorias</option>
                {uniqueCategorias.map(c => <option key={c as string} value={c as string}>{c as string}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-bold uppercase opacity-70 block mb-1">Condição</label>
              <select value={filterCondicao} onChange={(e: any)=>setFilterCondicao(e.target.value)} className="w-full border-2 border-wero-black p-2 text-sm outline-none focus:bg-wero-yellow/20 bg-white">
                <option value="">Todas as Condições</option>
                {uniqueCondicoes.map(c => <option key={c as string} value={c as string}>{c as string}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-bold uppercase opacity-70 block mb-1">Ordenar por</label>
              <select value={sortBy} onChange={(e: any)=>setSortBy(e.target.value)} className="w-full border-2 border-wero-black p-2 text-sm outline-none focus:bg-wero-yellow/20 bg-white">
                <option value="data-desc">Data (Mais recentes primeiro)</option>
                <option value="data-asc">Data (Mais antigos primeiro)</option>
                <option value="preco-asc">Preço (Menor para Maior)</option>
                <option value="preco-desc">Preço (Maior para Menor)</option>
                <option value="nome-asc">Nome (A-Z)</option>
                <option value="nome-desc">Nome (Z-A)</option>
              </select>
            </div>
            <div className="w-full flex justify-end mt-2">
               <button onClick={() => { setFilterMarca(''); setFilterCategoria(''); setFilterCondicao(''); setSortBy('data-desc'); setSearchTerm(''); }} className="text-xs uppercase font-bold text-wero-carrot hover:text-wero-black transition-colors">Limpar Filtros</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-wero-white border-2 border-wero-black shadow-wero overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse cursor-pointer">
            <thead>
              <tr className="bg-wero-grey border-b-2 border-wero-black font-impact font-bold uppercase text-xs tracking-wider">
                <th className="p-4">Código</th>
                <th className="p-4">Produto</th>
                <th className="p-4">Marca</th>
                <th className="p-4">Categoria</th>
                <th className="p-4">Setor</th>
                <th className="p-4">Condição</th>
                <th className="p-4 hidden md:table-cell">Preço</th>
                <th className="p-4 hidden md:table-cell">Data</th>
              </tr>
            </thead>
            <tbody className="font-classic text-sm">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-wero-black/60">
                    Carregando produtos...
                  </td>
                </tr>
              ) : filteredProdutos.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-wero-black/60">
                    Nenhum produto encontrado.
                  </td>
                </tr>
              ) : (
                filteredProdutos.map((produto) => (
                  <tr key={produto.id} className="border-b border-wero-black/10 hover:bg-wero-yellow/20 transition-colors" onClick={() => setSelectedProduto(produto)}>
                    <td className="p-4 font-mono text-xs">{produto.codigo || 'N/A'}</td>
                    <td className="p-4 font-semibold">
                      {produto.subcategoria || produto.nome?.split(' ')[0]} {produto.marca !== 'Sem Marca' ? produto.marca : ''} {produto.cor}
                    </td>
                    <td className="p-4">{produto.marca || '-'}</td>
                    <td className="p-4">
                      {produto.categoria?.match(/CAT\s*(\d+)/i) ? produto.categoria : (produto.categoria ? `CAT - ${produto.categoria}` : '-')}
                    </td>
                    <td className="p-4 capitalize">{produto.genero || '-'}</td>
                    <td className="p-4 uppercase text-xs font-bold">{produto.condicao}</td>
                    <td className="p-4 font-semibold text-wero-carrot hidden md:table-cell">
                      R$ {produto.preco?.toFixed(2).replace('.', ',')}
                    </td>
                    <td className="p-4 text-wero-black/70 text-xs hidden md:table-cell">
                      {produto.dataCadastro ? format(produto.dataCadastro.toDate(), "dd/MM/yyyy", { locale: ptBR }) : '...'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedProduto && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.95, y: 20 }} 
              className="bg-wero-white border-2 border-wero-black shadow-wero p-6 md:p-8 w-full max-w-2xl relative max-h-[90vh] overflow-y-auto organic-card"
            >
              <button 
                onClick={() => setSelectedProduto(null)}
                className="absolute top-4 right-4 p-2 bg-wero-black text-wero-white hover:bg-wero-carrot transition-colors rounded-md"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 mb-6 pr-10">
                <h2 className="font-impact text-2xl uppercase">Detalhes do Produto</h2>
                {!isEditing && (
                  <button onClick={startEdit} className="ml-2 p-2 bg-wero-grey hover:bg-wero-yellow border-2 border-wero-black transition-colors organic-blob-btn">
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex flex-col md:flex-row gap-6">
                {selectedProduto.imagem ? (
                  <div className="w-full md:w-1/3 border-2 border-wero-black rounded-md overflow-hidden bg-wero-grey flex-shrink-0 h-48 md:h-auto">
                    <img src={selectedProduto.imagem} alt={selectedProduto.nome} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-full md:w-1/3 border-2 border-dashed border-wero-black rounded-md bg-wero-grey flex flex-col items-center justify-center opacity-70 p-6">
                    <Package className="w-12 h-12 mb-2" />
                    <span className="font-impact text-sm uppercase">Sem Foto</span>
                  </div>
                )}

                <div className="flex-1 grid grid-cols-2 gap-4">
                  {isEditing ? (
                    <>
                      <div className="col-span-2">
                        <label className="text-xs font-bold uppercase opacity-60">Nome / Peça</label>
                        <input type="text" className="w-full border-2 border-wero-black p-2 mt-1 bg-wero-white font-classic focus:bg-wero-yellow/20 outline-none" value={editForm.nome} onChange={(e: any) => setEditForm({...editForm, nome: e.target.value})} />
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase opacity-60">Código (SKU)</label>
                        <input type="text" className="w-full border-2 border-wero-black p-2 mt-1 bg-wero-white font-mono focus:bg-wero-yellow/20 outline-none" value={editForm.codigo} onChange={(e: any) => setEditForm({...editForm, codigo: e.target.value})} />
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase opacity-60">Preço (R$)</label>
                        <input type="number" className="w-full border-2 border-wero-black p-2 mt-1 bg-wero-white font-impact focus:bg-wero-yellow/20 outline-none" value={editForm.preco} onChange={(e: any) => setEditForm({...editForm, preco: e.target.value})} />
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase opacity-60">Marca</label>
                        <input type="text" className="w-full border-2 border-wero-black p-2 mt-1 bg-wero-white font-classic focus:bg-wero-yellow/20 outline-none" value={editForm.marca} onChange={(e: any) => setEditForm({...editForm, marca: e.target.value})} />
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase opacity-60">Categoria</label>
                        <input type="text" className="w-full border-2 border-wero-black p-2 mt-1 bg-wero-white font-classic focus:bg-wero-yellow/20 outline-none" value={editForm.categoria} onChange={(e: any) => setEditForm({...editForm, categoria: e.target.value})} />
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase opacity-60">Tamanho</label>
                        <input type="text" className="w-full border-2 border-wero-black p-2 mt-1 bg-wero-white font-mono uppercase focus:bg-wero-yellow/20 outline-none" value={editForm.tamanho} onChange={(e: any) => setEditForm({...editForm, tamanho: e.target.value})} />
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase opacity-60">Cor</label>
                        <input type="text" className="w-full border-2 border-wero-black p-2 mt-1 bg-wero-white font-mono uppercase focus:bg-wero-yellow/20 outline-none" value={editForm.cor} onChange={(e: any) => setEditForm({...editForm, cor: e.target.value})} />
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase opacity-60">Condição</label>
                        <input type="text" className="w-full border-2 border-wero-black p-2 mt-1 bg-wero-white font-classic focus:bg-wero-yellow/20 outline-none" value={editForm.condicao} onChange={(e: any) => setEditForm({...editForm, condicao: e.target.value})} />
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase opacity-60">Nível</label>
                        <input type="text" className="w-full border-2 border-wero-black p-2 mt-1 bg-wero-white font-mono uppercase focus:bg-wero-yellow/20 outline-none" value={editForm.nivel} onChange={(e: any) => setEditForm({...editForm, nivel: e.target.value})} />
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase opacity-60">Setor</label>
                        <select className="w-full border-2 border-wero-black p-2 mt-1 bg-wero-white font-mono uppercase focus:bg-wero-yellow/20 outline-none" value={editForm.genero} onChange={(e: any) => setEditForm({...editForm, genero: e.target.value})}>
                           <option value="">Selecione...</option>
                           <option value="Feminino">Feminino</option>
                           <option value="Masculino">Masculino</option>
                           <option value="Unissex">Unissex</option>
                        </select>
                      </div>
                      
                      <div className="col-span-2 flex justify-end gap-3 mt-4">
                        <button onClick={handleDelete} className="px-4 py-2 bg-wero-pink text-wero-black border-2 border-wero-black font-impact uppercase hover:bg-wero-carrot transition-colors flex items-center gap-2">
                          <Trash2 className="w-4 h-4"/> Excluir
                        </button>
                        <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-wero-grey text-wero-black border-2 border-wero-black font-impact uppercase hover:bg-wero-white transition-colors">Cancelar</button>
                        <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-wero-black text-wero-yellow border-2 border-wero-black font-impact uppercase hover:bg-wero-carrot hover:text-black transition-colors flex items-center gap-2">
                          {saving ? 'Salvando...' : <><Check className="w-4 h-4"/> Salvar</>}
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="col-span-2">
                        <div className="text-xs font-bold uppercase opacity-60">Nome / Peça</div>
                        <div className="font-classic font-bold text-lg">{selectedProduto.nome}</div>
                      </div>
                      
                      <div>
                        <div className="text-xs font-bold uppercase opacity-60">Código (SKU)</div>
                        <div className="font-mono">{selectedProduto.codigo || 'N/A'}</div>
                      </div>

                      <div>
                        <div className="text-xs font-bold uppercase opacity-60">Nível / Preço</div>
                        <div className="font-impact text-xl text-wero-carrot">R$ {selectedProduto.preco?.toFixed(2).replace('.', ',')}</div>
                        <div className="text-xs font-bold uppercase">{selectedProduto.nivel} · {selectedProduto.tipoBazar === 'mega' ? 'Megabazar' : 'Fixo'}</div>
                      </div>

                      <div>
                        <div className="text-xs font-bold uppercase opacity-60">Marca</div>
                        <div className="font-classic font-bold">{selectedProduto.marca || 'Sem Marca'}</div>
                      </div>

                      <div>
                        <div className="text-xs font-bold uppercase opacity-60">Categoria</div>
                        <div className="font-classic font-bold">{selectedProduto.categoria}</div>
                      </div>

                      <div>
                        <div className="text-xs font-bold uppercase opacity-60">Tamanho</div>
                        <div className="font-mono uppercase font-bold">{selectedProduto.tamanho || 'N/A'}</div>
                      </div>

                      <div>
                        <div className="text-xs font-bold uppercase opacity-60">Cor</div>
                        <div className="font-mono uppercase font-bold">{selectedProduto.cor || 'N/A'}</div>
                      </div>

                      <div>
                        <div className="text-xs font-bold uppercase opacity-60">Setor</div>
                        <div className="font-mono uppercase font-bold">{selectedProduto.genero || 'N/A'}</div>
                      </div>
                      
                      <div>
                        <div className="text-xs font-bold uppercase opacity-60">Condição</div>
                        <div className="font-classic font-bold">{selectedProduto.condicao}</div>
                      </div>

                      <div>
                        <div className="text-xs font-bold uppercase opacity-60">Cadastrado Por</div>
                        <div className="font-classic">{selectedProduto.cadastradoPor}</div>
                      </div>
                      
                      <div className="col-span-2">
                        <div className="text-xs font-bold uppercase opacity-60">Data de Cadastro</div>
                        <div className="font-classic">
                          {selectedProduto.dataCadastro ? format(selectedProduto.dataCadastro.toDate(), "dd 'de' MMMM 'de' yyyy, 'às' HH:mm", { locale: ptBR }) : 'N/A'}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
