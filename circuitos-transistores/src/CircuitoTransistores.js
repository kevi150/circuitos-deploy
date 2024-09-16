import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Importamos las imágenes
import emisor from './assets/img/emisor.png';
import fija from './assets/img/fija.png';
import divisor from './assets/img/divisor.png';
import mosfet from './assets/img/mosfet.png';

// Componentes UI simplificados
const Select = ({ children, onValueChange, defaultValue }) => (
  <select onChange={(e) => onValueChange(e.target.value)} defaultValue={defaultValue}>
    {children}
  </select>
);
const SelectItem = ({ value, children }) => <option value={value}>{children}</option>;
const Slider = ({ min, max, step, value, onValueChange, label }) => (
  <div>
    <label>{label}: {value[0]}</label>
    <input type="range" min={min} max={max} step={step} value={value[0]} onChange={(e) => onValueChange([parseFloat(e.target.value)])} />
  </div>
);
const Card = ({ children }) => <div className="card">{children}</div>;
const CardHeader = ({ children }) => <div className="card-header">{children}</div>;
const CardTitle = ({ children }) => <h2>{children}</h2>;
const CardContent = ({ children }) => <div className="card-content">{children}</div>;

// Componente para mostrar la imagen del circuito
const CircuitDiagram = ({ circuito }) => {
  const imagenes = {
    emisor: emisor,
    fija: fija,
    divisor: divisor,
    mosfet: mosfet
  };

  return (
    <div className="circuit-diagram" style={{width: '400px', height: '400px'}}>
      <img src={imagenes[circuito]} alt={`Diagrama de ${circuito}`} style={{width: '100%', height: '100%', objectFit: 'contain'}} />
    </div>
  );
};

const CircuitoTransistores = () => {
  const [circuito, setCircuito] = useState('emisor');
  const [vcc, setVcc] = useState(5);
  const [rb1, setRb1] = useState(100000);
  const [rb2, setRb2] = useState(10000);
  const [rc, setRc] = useState(1000);
  const [re, setRe] = useState(100);
  const [beta, setBeta] = useState(100);
  const [rectaCarga, setRectaCarga] = useState([]);
  const [resultados, setResultados] = useState({});

  useEffect(() => {
    calcularRectaCarga();
    calcularResultados();
  }, [circuito, vcc, rb1, rb2, rc, re, beta]);

  const calcularRectaCarga = () => {
    const puntos = [];
    const pasos = 20;
    const iMax = vcc / rc;

    for (let i = 0; i <= pasos; i++) {
      const vce = (i / pasos) * vcc;
      const ic = iMax - (vce / rc);
      puntos.push({ vce, ic: ic > 0 ? ic : 0 });
    }

    setRectaCarga(puntos);
  };

  const calcularResultados = () => {
    let res = {};
    switch (circuito) {
      case 'emisor':
        res = calcularPolarizacionEmisior();
        break;
      case 'fija':
        res = calcularPolarizacionFija();
        break;
      case 'divisor':
        res = calcularDivisorVoltaje();
        break;
      case 'mosfet':
        res = calcularMosfet();
        break;
      default:
        res = {};
    }
    setResultados(res);
  };

  const calcularPolarizacionEmisior = () => {
    const ib = (vcc - 0.7) / (rb1 + re * beta);
    const ic = beta * ib;
    const ie = ic;
    const vce = vcc - ic * rc - ie * re;
    const icMax = vcc / rc;
    const vRb = ib * rb1;
    const vRc = ic * rc;
    const vRe = ie * re;
    return { ie, ib, ic, vce, icMax, vRb, vRc, vRe };
  };

  const calcularPolarizacionFija = () => {
    const ib = (vcc - 0.7) / rb1;
    const ic = beta * ib;
    const ie = ib + ic;
    const vce = vcc - ic * rc;
    const icMax = vcc / rc;
    const vRb = ib * rb1;
    const vRc = ic * rc;
    return { ib, ic, ie, vce, icMax, vRb, vRc };
  };

  const calcularDivisorVoltaje = () => {
    const vb = (vcc * rb2) / (rb1 + rb2);
    const rbb = (rb1 * rb2) / (rb1 + rb2);
    const ib = -1 * ((vb - 0.7) / (rbb + (beta + 1) * re));
    const ic = beta * ib;
    const ie = (beta + 1) * ib;
    const vce = (vcc - ic * rc - ie * re)*-1;
    const icMax = vcc / (rc + re);
    const vRb1 = (vcc - vb) * (rb1 / (rb1 + rb2));
    const vRb2 = vb * (rb2 / (rb1 + rb2));
    const vRc = ic * rc;
    const vRe = ie * re;
    return { vb, ib, ic, ie, icMax, vRb1, vRb2, vRc, vRe, rbb };
  };

  const calcularMosfet = () => {
    const id = (vcc - 2) / rb1; // Asumiendo una tensión umbral de 2V
    const vgs = vcc - id * rc;
    const vds = vcc - id * rc;
    const idMax = vcc / rc;
    const vRd = id * rc;
    return { vgs, id, vds, idMax, vRd };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calculadora de Circuitos de Transistores</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Select onValueChange={setCircuito} defaultValue={circuito}>
            <SelectItem value="emisor">Polarización por Emisor</SelectItem>
            <SelectItem value="fija">Polarización Fija</SelectItem>
            <SelectItem value="divisor">Divisor de Voltaje</SelectItem>
            <SelectItem value="mosfet">MOSFET (Canal N)</SelectItem>
          </Select>

          <div className="flex justify-between items-start">
            <div className="w-1/2">
              <CircuitDiagram circuito={circuito} />
            </div>
            <div className="w-1/2">
              <Slider min={1} max={12} step={0.1} value={[vcc]} onValueChange={setVcc} 
                      label={circuito === 'mosfet' ? 'Vdd (V)' : 'Vcc (V)'} />

              {circuito !== 'mosfet' && (
                <>
                  <Slider min={1000} max={1000000} step={1000} value={[rb1]} onValueChange={setRb1} 
                          label={circuito === 'divisor' ? 'Rb1 (Ω)' : 'Rb (Ω)'} />
                  {circuito === 'divisor' && (
                    <Slider min={1000} max={1000000} step={1000} value={[rb2]} onValueChange={setRb2} 
                            label="Rb2 (Ω)" />
                  )}
                </>
              )}

              {circuito === 'mosfet' ? (
                <>
                  <Slider min={1000} max={1000000} step={1000} value={[rb1]} onValueChange={setRb1} label="Rg (Ω)" />
                  <Slider min={100} max={10000} step={100} value={[rc]} onValueChange={setRc} label="Rd (Ω)" />
                </>
              ) : (
                <Slider min={100} max={10000} step={100} value={[rc]} onValueChange={setRc} label="Rc (Ω)" />
              )}

              {(circuito === 'emisor' || circuito === 'divisor') && (
                <Slider min={10} max={1000} step={10} value={[re]} onValueChange={setRe} label="Re (Ω)" />
              )}

              {circuito !== 'mosfet' && (
                <Slider min={50} max={300} step={1} value={[beta]} onValueChange={setBeta} label="Beta" />
              )}
            </div>
          </div>

          <div className="mt-4 p-4 bg-gray-100 rounded-md">
            <h3 className="font-bold mb-2">Resultados:</h3>
            <pre>{JSON.stringify(resultados, null, 2)}</pre>
          </div>

          <div className="mt-4">
            <h3 className="font-bold mb-2">Gráfica de Recta de Carga:</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={rectaCarga}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="vce" 
                       label={{ value: circuito === 'mosfet' ? 'Vds (V)' : 'Vce (V)', position: 'insideBottom', offset: -5 }} />
                <YAxis label={{ value: circuito === 'mosfet' ? 'Id (A)' : 'Ic (A)', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="ic" stroke="#8884d8" name="Recta de carga" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CircuitoTransistores;