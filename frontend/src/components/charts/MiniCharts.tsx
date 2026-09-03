export function LineChart({ data }: { data:{date:string;total:number}[] }) {
  if (!data.length) return <div className="h-32 grid place-items-center text-zinc-400 text-sm">No data</div>;
  const max=Math.max(...data.map(d=>d.total),1); const W=320,H=100,P=12;
  const pts=data.map((d,i)=>{ const x=P + i*(W-2*P)/(Math.max(data.length-1,1)); const y=H-P - (d.total/max)*(H-2*P); return `${x},${y}`; }).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-28">
      <polyline fill="none" stroke="#8B5CF6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={pts} />
      {data.map((d,i)=>{ const x=P + i*(W-2*P)/(Math.max(data.length-1,1)); const y=H-P - (d.total/max)*(H-2*P); return <circle key={i} cx={x} cy={y} r="3" fill="#8B5CF6" />; })}
    </svg>
  );
}
export function Donut({ segments }: { segments:{label:string;value:number;color:string}[] }) {
  const total=segments.reduce((a,b)=>a+b.value,0)||1; let acc=0;
  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 100 100" className="w-28 h-28">
        {segments.map(s=>{ const start=acc/total*360; const len=s.value/total*360; acc+=s.value; const large=len>180?1:0; const a0=(start-90)*Math.PI/180, a1=(start+len-90)*Math.PI/180; const x0=50+40*Math.cos(a0),y0=50+40*Math.sin(a0),x1=50+40*Math.cos(a1),y1=50+40*Math.sin(a1); return <path key={s.label} d={`M ${x0} ${y0} A 40 40 0 ${large} 1 ${x1} ${y1} L 50 50 Z`} fill={s.color} />; })}
        <circle cx="50" cy="50" r="22" fill="white" className="dark:fill-zinc-900" />
      </svg>
      <div className="space-y-2 text-sm">{segments.map(s=> <div key={s.label} className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{background:s.color}}/> {s.label} <span className="font-bold">{Math.round(s.value/total*100)}%</span></div>)}</div>
    </div>
  );
}
