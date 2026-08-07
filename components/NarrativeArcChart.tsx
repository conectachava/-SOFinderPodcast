"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from "d3";
import type { ScriptLine } from "@/app/api/script-writer/route";
import { SentimentBadge } from "./SentimentBadge";
import { Sparkles, Activity, Info, Zap } from "lucide-react";

interface NarrativeArcChartProps {
  scriptLines: ScriptLine[];
}

export interface ArcDataPoint {
  index: number;
  timeSeconds: number;
  timeFormatted: string;
  speaker: string;
  sentiment: "neutral" | "enthusiastic" | "concerned" | string;
  text: string;
  deltaIntensity: number;
  cumulativeIntensity: number;
}

export function NarrativeArcChart({ scriptLines }: NarrativeArcChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(600);
  const [hoveredPoint, setHoveredPoint] = useState<ArcDataPoint | null>(null);

  // Parse lines into cumulative narrative arc points
  const arcData = useMemo<ArcDataPoint[]>(() => {
    if (!scriptLines || scriptLines.length === 0) return [];

    let currentSeconds = 0;
    let runningCumulative = 0;

    return scriptLines.map((line, idx) => {
      // Estimate line duration from word count
      const wordCount = (line.text || "").split(/\s+/).filter(Boolean).length;
      const duration = Math.max(3, Math.round(wordCount / 2.2));
      currentSeconds += duration;

      const mins = Math.floor(currentSeconds / 60);
      const secs = currentSeconds % 60;
      const timeFormatted = `${mins}:${secs < 10 ? "0" : ""}${secs}`;

      // Determine emotional delta
      let delta = 1.0;
      const sent = (line.sentiment || "neutral").toLowerCase();
      if (sent.includes("enthusiastic") || sent.includes("entusiasta") || sent.includes("eufórico")) {
        delta = 3.5;
      } else if (sent.includes("concerned") || sent.includes("preocupad") || sent.includes("alerta") || sent.includes("urgente")) {
        delta = 2.8;
      } else if (sent.includes("thoughtful") || sent.includes("reflexivo") || sent.includes("analítico")) {
        delta = 1.8;
      } else {
        delta = 0.8;
      }

      runningCumulative += delta;

      return {
        index: idx + 1,
        timeSeconds: currentSeconds,
        timeFormatted: line.timestamp || timeFormatted,
        speaker: line.speaker,
        sentiment: line.sentiment || "neutral",
        text: line.text,
        deltaIntensity: delta,
        cumulativeIntensity: Math.round(runningCumulative * 10) / 10,
      };
    });
  }, [scriptLines]);

  // Calculate high level arc metrics
  const arcMetrics = useMemo(() => {
    if (arcData.length === 0) {
      return { peak: 0, avgDelta: 0, arcType: "Sin Datos" };
    }
    const peak = Math.max(...arcData.map((d) => d.cumulativeIntensity));
    const avgDelta =
      arcData.reduce((acc, d) => acc + d.deltaIntensity, 0) / arcData.length;

    let arcType = "Progreso Armónico";
    if (peak > 30) arcType = "Clímax de Alta Intensidad";
    else if (avgDelta > 2.2) arcType = "Debate Enérgico Continuo";
    else if (avgDelta < 1.2) arcType = "Tono Analítico Moderado";

    return { peak, avgDelta: Math.round(avgDelta * 10) / 10, arcType };
  }, [arcData]);

  // ResizeObserver for container
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(entry.contentRect.width);
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Render D3 chart
  useEffect(() => {
    if (!svgRef.current || arcData.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const height = 240;
    const margin = { top: 25, right: 30, bottom: 35, left: 45 };
    const width = Math.max(300, containerWidth);
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    svg.attr("width", width).attr("height", height);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3
      .scaleLinear()
      .domain([1, arcData.length])
      .range([0, innerWidth]);

    const maxIntensity = d3.max(arcData, (d) => d.cumulativeIntensity) || 10;
    const yScale = d3
      .scaleLinear()
      .domain([0, maxIntensity * 1.1])
      .nice()
      .range([innerHeight, 0]);

    // Gradient definition for area fill
    const defs = svg.append("defs");
    const gradient = defs
      .append("linearGradient")
      .attr("id", "narrative-arc-gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");

    gradient
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#10b981")
      .attr("stop-opacity", 0.45);

    gradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#064e3b")
      .attr("stop-opacity", 0.05);

    // Grid lines
    const yAxisGrid = d3
      .axisLeft(yScale)
      .tickSize(-innerWidth)
      .tickFormat(() => "")
      .ticks(5);

    g.append("g")
      .attr("class", "grid-lines")
      .call(yAxisGrid)
      .selectAll("line")
      .attr("stroke", "#334155")
      .attr("stroke-opacity", 0.4)
      .attr("stroke-dasharray", "3,3");

    // Area generator
    const area = d3
      .area<ArcDataPoint>()
      .x((d) => xScale(d.index))
      .y0(innerHeight)
      .y1((d) => yScale(d.cumulativeIntensity))
      .curve(d3.curveMonotoneX);

    g.append("path")
      .datum(arcData)
      .attr("fill", "url(#narrative-arc-gradient)")
      .attr("d", area);

    // Line generator
    const line = d3
      .line<ArcDataPoint>()
      .x((d) => xScale(d.index))
      .y((d) => yScale(d.cumulativeIntensity))
      .curve(d3.curveMonotoneX);

    g.append("path")
      .datum(arcData)
      .attr("fill", "none")
      .attr("stroke", "#34d399")
      .attr("stroke-width", 3)
      .attr("d", line);

    // X Axis
    const xAxis = d3
      .axisBottom(xScale)
      .ticks(Math.min(arcData.length, 10))
      .tickFormat((d) => `L${d}`);

    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(xAxis)
      .selectAll("text")
      .attr("fill", "#94a3b8")
      .style("font-size", "10px")
      .style("font-weight", "600");

    // Y Axis
    const yAxis = d3.axisLeft(yScale).ticks(5);
    g.append("g")
      .call(yAxis)
      .selectAll("text")
      .attr("fill", "#94a3b8")
      .style("font-size", "10px")
      .style("font-weight", "600");

    // Interactive Data Dots
    g.selectAll(".dot")
      .data(arcData)
      .enter()
      .append("circle")
      .attr("class", "dot")
      .attr("cx", (d) => xScale(d.index))
      .attr("cy", (d) => yScale(d.cumulativeIntensity))
      .attr("r", 4.5)
      .attr("fill", (d) => {
        if (d.sentiment.includes("enthusiastic")) return "#f59e0b";
        if (d.sentiment.includes("concerned")) return "#ef4444";
        return "#10b981";
      })
      .attr("stroke", "#0f172a")
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .on("mouseover", (event, d) => {
        d3.select(event.currentTarget)
          .transition()
          .duration(150)
          .attr("r", 8)
          .attr("stroke", "#ffffff");
        setHoveredPoint(d);
      })
      .on("mouseout", (event) => {
        d3.select(event.currentTarget)
          .transition()
          .duration(150)
          .attr("r", 4.5)
          .attr("stroke", "#0f172a");
      });
  }, [arcData, containerWidth]);

  if (!scriptLines || scriptLines.length === 0) {
    return (
      <div className="p-6 text-center text-slate-400 text-xs bg-slate-900 rounded-xl border border-slate-800">
        No hay líneas cargadas para calcular el Arco Narrativo en D3.
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4.5 h-4.5 text-emerald-400" />
          <div>
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>Arco Narrativo Interactivo (D3 Emotional Intensity)</span>
              <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 text-[10px] font-mono rounded border border-emerald-800">
                Visualización D3.js
              </span>
            </h4>
            <p className="text-xs text-slate-400">
              Mapeo acumulativo de la intensidad emocional de las intervenciones del guion
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="text-slate-400 text-[10px] block">Clímax Máximo:</span>
            <span className="text-amber-400 font-extrabold">{arcMetrics.peak} pts</span>
          </div>
          <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="text-slate-400 text-[10px] block">Ritmo Emocional:</span>
            <span className="text-emerald-400 font-extrabold">{arcMetrics.arcType}</span>
          </div>
        </div>
      </div>

      {/* D3 SVG Canvas Container */}
      <div ref={containerRef} className="w-full relative bg-slate-950 rounded-xl p-2 border border-slate-800/80">
        <svg ref={svgRef} className="w-full overflow-visible" />

        {/* Hovered Data Tooltip Overlay */}
        {hoveredPoint && (
          <div className="mt-2 p-3 bg-slate-900/95 border border-emerald-500/50 rounded-lg text-xs space-y-1 shadow-lg backdrop-blur-xs">
            <div className="flex items-center justify-between font-mono">
              <span className="font-bold text-emerald-400">
                Línea {hoveredPoint.index} • [{hoveredPoint.speaker}] ({hoveredPoint.timeFormatted})
              </span>
              <SentimentBadge sentiment={hoveredPoint.sentiment as any} size="sm" />
            </div>
            <p className="text-slate-200 italic line-clamp-2">&quot;{hoveredPoint.text}&quot;</p>
            <div className="flex items-center gap-4 text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-800">
              <span>Delta de Línea: +{hoveredPoint.deltaIntensity} pts</span>
              <span>Intensidad Acumulada: {hoveredPoint.cumulativeIntensity} pts</span>
            </div>
          </div>
        )}
      </div>

      {/* Legend & Instructions */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-1">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Entusiasta (+3.5)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> Alerta/Preocupado (+2.8)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Neutro/Reflexivo (+0.8 - +1.8)
          </span>
        </div>
        <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
          <Info className="w-3 h-3 text-emerald-400" /> Pasa el cursor sobre los nodos D3 para inspeccionar el punto dramático.
        </span>
      </div>
    </div>
  );
}
