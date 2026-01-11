
export interface ReportParams {
  nome: string;
  objetivo: string;
  data: string;
  inicio: string;
  fim: string;
  produto: string;
  Ti: number;
  Tf: number;
  UR_ini: number;
  UR_fim: number;
  timestamp: string;
  logoBase64?: string; // Nova propriedade para o logo customizado
}

export interface DataPoint {
  id: number;
  time: string;
  tempLinear: number;
  tempExp: number;
  ur: number;
  k: number;
  timestamp: string;
}

export interface CoolingResult {
  params: ReportParams;
  dataPoints: DataPoint[];
  kGlobal: number;
  totalMinutes: number;
  taxaMedia: number;
  urMax: number;
  urMin: number;
  urMean: number;
}
