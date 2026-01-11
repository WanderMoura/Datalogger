
import React, { useState, useRef, useEffect } from 'react';
import { ReportParams, CoolingResult } from './types';
import { calculateCooling, formatDecimal } from './services/coolingLogic';
import { generatePDF } from './services/pdfGenerator';
import ReportChart from './components/ReportChart';
import html2canvas from 'html2canvas';

const LOGO_EMPTY_PLACEHOLDER = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
const STORAGE_KEY_LOGO = 'pcc2b_v25_persistent_logo';

// Função auxiliar para recuperar o logo salvo antes da renderização inicial
const getInitialLogo = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY_LOGO);
    if (saved && saved.startsWith('data:image')) return saved;
  }
  return LOGO_EMPTY_PLACEHOLDER;
};

const App: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [params, setParams] = useState<ReportParams>({
    nome: "MONITORAMENTO PCC 2B INTRATURNO CÂMARA 0 ºC IQF",
    objetivo: "Verificação 4 ºC em 4 horas",
    data: new Date().toLocaleDateString('pt-BR'),
    inicio: "16:03",
    fim: "16:53",
    produto: "Sassami",
    Ti: 5.5,
    Tf: 3.9, // Valor padrão alterado para 3.9 conforme solicitado
    UR_ini: 73.8,
    UR_fim: 89.5,
    timestamp: new Date().toLocaleString('pt-BR'),
    logoBase64: getInitialLogo() // Carrega o logo salvo instantaneamente
  });

  const [result, setResult] = useState<CoolingResult | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setParams(prev => ({
      ...prev,
      [name]: (name === 'Ti' || name === 'Tf' || name === 'UR_ini' || name === 'UR_fim') 
        ? parseFloat(value) || 0 
        : value
    }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setParams(prev => ({ ...prev, logoBase64: base64 }));
        localStorage.setItem(STORAGE_KEY_LOGO, base64); // Salva permanentemente
        if (result) {
          setResult(prev => prev ? { ...prev, params: { ...prev.params, logoBase64: base64 } } : null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const resetLogo = () => {
    if (confirm("Deseja realmente remover o logo salvo?")) {
      setParams(prev => ({ ...prev, logoBase64: LOGO_EMPTY_PLACEHOLDER }));
      localStorage.removeItem(STORAGE_KEY_LOGO);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (result) {
        setResult(prev => prev ? { ...prev, params: { ...prev.params, logoBase64: LOGO_EMPTY_PLACEHOLDER } } : null);
      }
    }
  };

  const handleCalculate = () => {
    const res = calculateCooling({ ...params });
    setResult(res);
  };

  const refreshTimestamp = () => {
    const now = new Date().toLocaleString('pt-BR');
    setParams(prev => ({ ...prev, timestamp: now }));
    if (result) {
      setResult(prev => prev ? { ...prev, params: { ...prev.params, timestamp: now } } : null);
    }
  };

  const handleExportPDF = async () => {
    if (!result) return;
    setIsExporting(true);
    try {
      const chartElement = document.getElementById('report-chart-container');
      if (chartElement) {
        const canvas = await html2canvas(chartElement, { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' });
        const chartBase64 = canvas.toDataURL('image/png');
        await generatePDF(result, chartBase64);
      }
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 font-sans">
      <header className="bg-[#5415FE] border-b border-[#4310cc] px-8 py-5 flex justify-between items-center sticky top-0 z-20 shadow-xl shadow-[#5415FE]/10">
        <div className="flex items-center gap-4">
          <div className="bg-[#BFFE15] w-12 h-12 rounded-xl flex items-center justify-center text-[#5415FE] shadow-lg shadow-black/20">
            <i className="fa-solid fa-snowflake text-2xl"></i>
          </div>
          <div>
            <h1 className="text-white text-lg font-black tracking-tight leading-tight uppercase">
              GERADOR DE RELATÓRIOS INTRATURNO
            </h1>
            <p className="text-[#BFFE15] text-[10px] font-black uppercase tracking-[0.2em]">Câmara 0 ºC IQF</p>
          </div>
        </div>
        <div className="hidden sm:block text-right">
          <div className="text-[10px] text-white/50 font-mono uppercase tracking-widest">SISTEMA OFICIAL DE MONITORAMENTO</div>
          <div className="text-[9px] text-[#BFFE15] font-black mt-0.5 tracking-tighter">LOGOTIPO PERSISTENTE ATIVADO</div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Painel de Controle */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#5415FE]/5 -mr-16 -mt-16 rounded-full blur-3xl"></div>
            
            <h2 className="text-sm font-black mb-6 flex items-center gap-2 text-[#5415FE] uppercase tracking-tighter border-b border-slate-100 pb-4">
              <i className="fa-solid fa-gears text-[#BFFE15] bg-[#5415FE] p-1.5 rounded-md text-[10px]"></i> Parâmetros de Entrada
            </h2>
            
            <div className="space-y-5 relative z-10">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 group transition-all hover:border-[#5415FE]/30">
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Logo da Empresa</label>
                  <span className="text-[9px] bg-[#BFFE15] text-[#5415FE] px-2 py-0.5 rounded-full font-black">MEMÓRIA ATIVA</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-12 bg-white border border-slate-200 rounded-lg flex items-center justify-center overflow-hidden shadow-inner group-hover:border-[#5415FE]">
                    {params.logoBase64 && params.logoBase64 !== LOGO_EMPTY_PLACEHOLDER ? (
                      <img src={params.logoBase64} alt="Empresa" className="max-w-full max-h-full object-contain p-1" />
                    ) : (
                      <i className="fa-solid fa-image text-slate-200 text-xl"></i>
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <button onClick={() => fileInputRef.current?.click()} className="w-full text-[10px] bg-white border border-slate-300 hover:border-[#5415FE] hover:text-[#5415FE] px-3 py-2 rounded-lg font-black transition-all shadow-sm">
                      ALTERAR LOGO
                    </button>
                    {params.logoBase64 !== LOGO_EMPTY_PLACEHOLDER && (
                      <button onClick={resetLogo} className="w-full text-[9px] text-red-500 hover:text-red-700 font-bold uppercase tracking-tighter">REMOVER MEMÓRIA</button>
                    )}
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Título do Relatório</label>
                <textarea name="nome" value={params.nome} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#5415FE] focus:border-[#5415FE] outline-none transition-all h-20 resize-none font-medium text-slate-700" />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Objetivo do Monitoramento</label>
                <textarea name="objetivo" value={params.objetivo} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#5415FE] focus:border-[#5415FE] outline-none transition-all h-16 resize-none font-medium text-slate-700" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Data</label>
                  <input type="text" name="data" value={params.data} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm font-medium" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Produto</label>
                  <input type="text" name="produto" value={params.produto} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm font-medium" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#5415FE]/5 p-3 rounded-xl border border-[#5415FE]/10">
                  <label className="block text-[10px] font-black text-[#5415FE] uppercase tracking-widest mb-1">Início (HH:MM)</label>
                  <input type="time" name="inicio" value={params.inicio} onChange={handleInputChange} className="w-full bg-white border border-[#5415FE]/20 rounded-lg p-2 text-sm font-bold" />
                </div>
                <div className="bg-[#5415FE]/5 p-3 rounded-xl border border-[#5415FE]/10">
                  <label className="block text-[10px] font-black text-[#5415FE] uppercase tracking-widest mb-1">Fim (HH:MM)</label>
                  <input type="time" name="fim" value={params.fim} onChange={handleInputChange} className="w-full bg-white border border-[#5415FE]/20 rounded-lg p-2 text-sm font-bold" />
                </div>
              </div>

              <div className="p-3 rounded-xl border border-[#5415FE]/10 bg-[#5415FE]/5">
                <label className="block text-[10px] font-black text-[#5415FE] uppercase tracking-widest mb-1.5 ml-1">Emissão (Timestamp)</label>
                <div className="flex gap-2">
                  <input 
                    type="text" name="timestamp" value={params.timestamp} onChange={handleInputChange} 
                    className="w-full bg-white border border-[#5415FE]/20 rounded-lg p-2.5 text-sm font-mono text-slate-600 focus:ring-1 focus:ring-[#5415FE] outline-none"
                  />
                  <button onClick={refreshTimestamp} className="bg-white border border-[#5415FE]/20 hover:bg-[#5415FE] hover:text-white text-[#5415FE] p-2.5 rounded-lg transition-all shadow-sm active:scale-95">
                    <i className="fa-solid fa-clock-rotate-left"></i>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#BFFE15]/10 p-3 rounded-xl border border-[#BFFE15]/30">
                  <label className="block text-[10px] font-black text-[#5415FE] uppercase tracking-widest mb-1">Temp. I (ºC)</label>
                  <input type="number" step="0.1" name="Ti" value={params.Ti} onChange={handleInputChange} className="w-full bg-white border border-[#BFFE15]/50 rounded-lg p-2 text-sm font-black text-[#5415FE]" />
                </div>
                <div className="bg-[#BFFE15]/10 p-3 rounded-xl border border-[#BFFE15]/30">
                  <label className="block text-[10px] font-black text-[#5415FE] uppercase tracking-widest mb-1">Temp. F (ºC)</label>
                  <input type="number" step="0.1" name="Tf" value={params.Tf} onChange={handleInputChange} className="w-full bg-white border border-[#BFFE15]/50 rounded-lg p-2 text-sm font-black text-[#5415FE]" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">UR Inicial (%)</label>
                  <input type="number" step="0.1" name="UR_ini" value={params.UR_ini} onChange={handleInputChange} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm font-bold text-slate-700" />
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">UR Final (%)</label>
                  <input type="number" step="0.1" name="UR_fim" value={params.UR_fim} onChange={handleInputChange} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm font-bold text-slate-700" />
                </div>
              </div>

              <button 
                onClick={handleCalculate}
                className="w-full bg-[#5415FE] hover:bg-[#4310cc] text-white font-black py-4 rounded-xl transition-all shadow-xl shadow-[#5415FE]/30 mt-4 uppercase tracking-widest text-xs flex items-center justify-center gap-3 active:scale-95"
              >
                <i className="fa-solid fa-chart-line text-[#BFFE15]"></i> Calcular Evolução
              </button>
            </div>
          </div>
        </div>

        {/* Visualização */}
        <div className="lg:col-span-8 space-y-8">
          {!result ? (
            <div className="bg-white rounded-3xl border-2 border-dashed border-[#5415FE]/20 h-[600px] flex flex-col items-center justify-center text-[#5415FE]/30 animate-pulse">
              <i className="fa-solid fa-microscope text-6xl mb-6 opacity-20"></i>
              <p className="font-black uppercase tracking-widest text-xs">Aguardando dados de monitoramento...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: "Tempo Total", val: `${result.totalMinutes} min`, icon: "fa-clock", color: "#5415FE" },
                  { label: "Taxa Média", val: `${formatDecimal(result.taxaMedia, 3)} ºC/m`, icon: "fa-bolt", color: "#BFFE15" },
                  { label: "K Global", val: formatDecimal(result.kGlobal, 4), icon: "fa-code-branch", color: "#5415FE" }
                ].map((item, idx) => (
                  <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-slate-200 hover:border-[#5415FE] transition-all">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: item.color }}>
                        <i className={`fa-solid ${item.icon} text-[10px]`}></i>
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
                    </div>
                    <div className="text-2xl font-black text-slate-800">{item.val}</div>
                  </div>
                ))}
              </div>

              <div className="relative">
                <ReportChart data={result.dataPoints} kGlobal={result.kGlobal} reportDate={result.params.data} targetTemp={4.0} />
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-5 bg-[#5415FE] border-b flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#BFFE15] rounded-lg flex items-center justify-center text-[#5415FE]">
                      <i className="fa-solid fa-table-list"></i>
                    </div>
                    <div>
                      <h3 className="font-black text-white uppercase tracking-tighter leading-tight">Registros Intraturno</h3>
                      <p className="text-[9px] text-[#BFFE15] uppercase font-black tracking-widest">Amostragem via sensor NTC</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleExportPDF}
                    disabled={isExporting}
                    className="w-full sm:w-auto bg-[#BFFE15] hover:bg-[#a9e012] text-[#5415FE] px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg"
                  >
                    {isExporting ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-file-pdf"></i>}
                    {isExporting ? 'Processando...' : 'Exportar Relatório'}
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                        <th className="px-6 py-4">ID</th>
                        <th className="px-6 py-4">TimeStamp</th>
                        <th className="px-6 py-4">Temp. (ºC)</th>
                        <th className="px-6 py-4">UR (%)</th>
                        <th className="px-6 py-4 text-right">k Newton</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {result.dataPoints.slice(0, 10).map((p) => (
                        <tr key={p.id} className="hover:bg-[#5415FE]/5 transition-colors">
                          <td className="px-6 py-4 font-mono text-xs text-slate-400">{p.id.toString().padStart(3, '0')}</td>
                          <td className="px-6 py-4 text-slate-600 font-medium">{p.timestamp.split(' ')[1]}</td>
                          <td className="px-6 py-4 font-black text-[#5415FE]">{formatDecimal(p.tempLinear)}</td>
                          <td className="px-6 py-4 text-slate-500">{formatDecimal(p.ur)}</td>
                          <td className="px-6 py-4 text-right font-mono text-[10px] text-slate-400">{formatDecimal(p.k, 4)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="p-4 bg-slate-50 border-t text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    Fim da visualização prévia • {result.dataPoints.length} pontos no arquivo final
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
