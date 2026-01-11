
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { CoolingResult } from '../types';
import { formatDecimal } from '../services/coolingLogic';

interface AnalysisAIProps {
  result: CoolingResult;
}

const AnalysisAI: React.FC<AnalysisAIProps> = ({ result }) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);

  const getAIAnalysis = async () => {
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const prompt = `
        Aja como um especialista em segurança alimentar e processos térmicos. 
        Analise os seguintes dados de resfriamento industrial para o produto ${result.params.produto}:
        - Temperatura Inicial: ${formatDecimal(result.params.Ti)} °C
        - Temperatura Final: ${formatDecimal(result.params.Tf)} °C
        - Tempo total: ${result.totalMinutes} minutos
        - Taxa média de resfriamento: ${formatDecimal(result.taxaMedia, 4)} °C/min
        - Constante de resfriamento de Newton (k global): ${formatDecimal(result.kGlobal, 4)} min-¹
        - Objetivo de monitoramento: ${result.params.objetivo}
        
        Forneça um breve resumo técnico (máximo 3 parágrafos curtos) avaliando a eficiência do processo. 
        Mencione se a queda de temperatura parece adequada para evitar proliferação bacteriana e se o processo está sob controle.
        Use um tom profissional e direto ao ponto.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      setAnalysis(response.text);
    } catch (error) {
      console.error("AI Analysis Error:", error);
      setAnalysis("Não foi possível gerar a análise técnica no momento. Verifique as configurações da API.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 bg-indigo-50 p-6 rounded-2xl border border-indigo-100 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
          <i className="fa-solid fa-wand-magic-sparkles"></i>
          Parecer Técnico (IA)
        </h3>
        <button 
          onClick={getAIAnalysis}
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 disabled:opacity-50 shadow-md shadow-indigo-200"
        >
          {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-bolt"></i>}
          {analysis ? 'Recalcular Parecer' : 'Gerar Parecer'}
        </button>
      </div>
      
      {analysis && (
        <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap animate-in fade-in slide-in-from-bottom-2 duration-500">
          {analysis}
        </div>
      )}
      
      {!analysis && !loading && (
        <p className="text-slate-500 text-sm italic">
          Clique no botão para que a inteligência artificial analise os parâmetros de resfriamento com base em padrões de segurança alimentar.
        </p>
      )}
    </div>
  );
};

export default AnalysisAI;
