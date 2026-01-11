
import React from 'react';
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Scatter,
  ZAxis,
  ReferenceLine
} from 'recharts';
import { DataPoint } from '../types';

interface ReportChartProps {
  data: DataPoint[];
  kGlobal: number;
  reportDate: string;
  targetTemp: number;
}

const brandPrimary = "#5415FE"; // Nova cor predominante
const orange = "#ff7f0e";
const red = "#ef4444";

const CircleMarker = (props: any) => {
  const { cx, cy, fill } = props;
  if (!cx || !cy) return null;
  return (
    <circle cx={cx} cy={cy} r={3} fill={fill} stroke="none" />
  );
};

const CustomLegend = (props: any) => {
  const { payload } = props;
  return (
    <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-2 mb-4 px-2">
      {payload.map((entry: any, index: number) => {
        const isUR = entry.value.includes("UR");
        const isReal = entry.value.includes("Real");
        const isExp = entry.value.includes("Exponencial");

        return (
          <div key={`item-${index}`} className="flex items-center gap-2">
            <svg width="24" height="12" className="inline-block flex-shrink-0">
              {isExp && (
                <line x1="0" y1="6" x2="24" y2="6" stroke={brandPrimary} strokeWidth="2" />
              )}
              {isUR && (
                <line x1="0" y1="6" x2="24" y2="6" stroke={red} strokeWidth="2" strokeDasharray="2,2" />
              )}
              {isReal && (
                <circle cx="12" cy="6" r="3" fill={orange} />
              )}
            </svg>
            <span className="text-[10px] font-black text-slate-700 uppercase tracking-tighter whitespace-nowrap">{entry.value}</span>
          </div>
        );
      })}
    </div>
  );
};

const ReportChart: React.FC<ReportChartProps> = ({ data, kGlobal, reportDate, targetTemp }) => {
  const formatValue = (val: number) => val.toFixed(1).replace('.', ',');

  return (
    <div className="w-full bg-white p-2 sm:p-4 rounded-2xl shadow-sm border border-slate-200" id="report-chart-container">
      <div className="w-full aspect-[4/3] md:aspect-[2/1] border border-black relative bg-white overflow-hidden">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart 
            data={data} 
            margin={{ top: 15, right: 10, left: 10, bottom: 40 }}
          >
            <CartesianGrid stroke="#eeeeee" strokeWidth={1} vertical={true} horizontal={true} />
            
            <XAxis 
              dataKey="time" 
              tick={{ fontSize: 8, fill: '#333' }}
              tickLine={{ stroke: '#333' }}
              axisLine={{ stroke: '#333' }}
              interval={Math.ceil(data.length / 10)}
              label={{ value: 'Tempo (hh:mm)', position: 'bottom', offset: 20, fontSize: 9, fill: '#000', fontWeight: 'bold' }}
            />
            
            <YAxis 
              yAxisId="left" 
              tick={{ fontSize: 8, fill: '#333' }}
              tickLine={{ stroke: '#333' }}
              axisLine={{ stroke: '#333' }}
              tickFormatter={formatValue}
              width={35}
              label={{ value: 'Temp (°C)', angle: -90, position: 'insideLeft', offset: -5, fontSize: 9, fill: '#000', fontWeight: 'bold' }} 
              domain={['auto', 'auto']}
            />
            
            <YAxis 
              yAxisId="right" 
              orientation="right" 
              tick={{ fontSize: 8, fill: '#333' }}
              tickLine={{ stroke: '#333' }}
              axisLine={{ stroke: '#333' }}
              tickFormatter={formatValue}
              width={35}
              label={{ value: 'UR (%)', angle: 90, position: 'insideRight', offset: -5, fontSize: 9, fill: '#000', fontWeight: 'bold' }} 
              domain={['auto', 'auto']}
            />

            <ZAxis range={[30]} />

            <ReferenceLine 
              yAxisId="left" 
              y={targetTemp} 
              stroke="#94a3b8" 
              strokeDasharray="5 5" 
              label={{ 
                value: `META: ${formatValue(targetTemp)} ºC`, 
                position: 'insideTopRight', 
                fill: '#5415FE', 
                fontSize: 8,
                fontWeight: '900',
                offset: 5
              }} 
            />

            <Tooltip 
               contentStyle={{ fontSize: '10px', border: '1px solid #ddd', borderRadius: '4px', padding: '8px', fontWeight: 'bold' }}
               formatter={(value: any) => formatValue(Number(value))}
            />
            
            <Legend 
              verticalAlign="top" 
              align="center"
              content={<CustomLegend />}
            />
            
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="tempExp"
              stroke={brandPrimary}
              strokeWidth={2.5}
              dot={false}
              name={`Curva Exponencial (k=${kGlobal.toFixed(3)})`}
              isAnimationActive={false}
            />
            
            <Scatter
              yAxisId="left"
              dataKey="tempLinear"
              fill={orange}
              name="Evolução Real (ºC)"
              shape={<CircleMarker fill={orange} />}
              isAnimationActive={false}
            />

            <Line
              yAxisId="right"
              type="monotone"
              dataKey="ur"
              stroke={red}
              strokeDasharray="3 3"
              strokeWidth={1.5}
              dot={false}
              name="UR [%Hr]"
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ReportChart;
