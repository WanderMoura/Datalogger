
import { ReportParams, DataPoint, CoolingResult } from '../types';

export function calculateCooling(params: ReportParams): CoolingResult {
  const tAmb = 0.0;
  
  // Parse times
  const [hI, mI] = params.inicio.split(':').map(Number);
  const [hF, mF] = params.fim.split(':').map(Number);
  const [day, month, year] = params.data.split('/').map(Number);
  
  const dateI = new Date(year, month - 1, day, hI, mI);
  let dateF = new Date(year, month - 1, day, hF, mF);
  
  if (dateF < dateI) {
    dateF.setDate(dateF.getDate() + 1);
  }
  
  const totalMinutes = Math.max(1, (dateF.getTime() - dateI.getTime()) / 60000);
  const Ti = params.Ti;
  const Tf = params.Tf;
  const URi = params.UR_ini;
  const URf = params.UR_fim;
  
  const taxaMedia = (Ti - Tf) / totalMinutes;
  const kGlobal = -Math.log((Tf - tAmb) / (Ti - tAmb)) / totalMinutes;
  
  const dataPoints: DataPoint[] = [];
  const urValues: number[] = [];
  
  const randomSeconds = Math.floor(Math.random() * 59) + 1;

  for (let i = 0; i <= totalMinutes; i++) {
    const currentTime = new Date(dateI.getTime() + i * 60000);
    currentTime.setSeconds(randomSeconds);
    
    // Linear temperature for display (simulating the Python T_disp)
    const tempLinear = Number((Ti - taxaMedia * i).toFixed(1));
    
    // Exponential temperature for curve
    const tempExp = tAmb + (Ti - tAmb) * Math.exp(-kGlobal * i);
    
    // UR interpolation
    const ur = Number((URi + (URf - URi) * (i / totalMinutes)).toFixed(1));
    urValues.push(ur);
    
    // K calculation per minute
    let k = 0;
    if (i > 0) {
        const prevTLinear = Ti - taxaMedia * (i - 1);
        const currTLinear = Ti - taxaMedia * i;
        const a = prevTLinear - tAmb;
        const b = currTLinear - tAmb;
        k = (a <= 0 || b <= 0) ? 0 : -Math.log(b/a);
    }

    dataPoints.push({
      id: i + 1,
      time: currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      tempLinear: i === totalMinutes ? Tf : tempLinear,
      tempExp,
      ur,
      k,
      timestamp: `${params.data} ${currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
    });
  }

  return {
    params,
    dataPoints,
    kGlobal,
    totalMinutes,
    taxaMedia,
    urMax: Math.max(...urValues),
    urMin: Math.min(...urValues),
    urMean: urValues.reduce((a, b) => a + b, 0) / urValues.length
  };
}

export function formatDecimal(v: number, casas: number = 1): string {
    return v.toFixed(casas).replace('.', ',');
}
