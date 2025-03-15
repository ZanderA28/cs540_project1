"use client";

import Image from "next/image";
import styles from "./page.module.css";
import { useState, useEffect, useRef } from "react";
import { Bar } from 'react-chartjs-2';
import jsPDF from "jspdf";
import "chart.js/auto";

export default function Home() {
    const [numProcesses, setNumProcesses] = useState(3);
    const [processes, setProcesses] = useState([]);
    const [selectedAlgorithm, setSelectedAlgorithm] = useState("FIFO");
    const [results, setResults] = useState([]);
    const [allResults, setAllResults] = useState({});
    const [showAll, setShowAll] = useState(true);
    const chartRefs = useRef({});

    function generateProcesses() {
        let newProcesses = Array.from({ length: numProcesses }, (_, i) => ({
            id: `P${i + 1}`,
            arrivalTime: Math.floor(Math.random() * 10),
            burstTime: Math.floor(Math.random() * 10) + 1
        }));
        setProcesses(newProcesses);
    }

    function runScheduler() {
        let output = [];
        if (selectedAlgorithm === "FIFO") {
            output = fifo([...processes]);
        }
        else if (selectedAlgorithm === "SJF") {
            output = sjf([...processes]);
        }
        else if (selectedAlgorithm === "STCF") {
            output = stcf([...processes]);
        }
        else if (selectedAlgorithm === "RR") {
            output = rr([...processes], 4);
        }
        else if (selectedAlgorithm === "MLFQ") {
            output = mlfq([...processes], 4, 8);
        }
        setResults(output);
        setShowAll(false);
    }

    function runAllSchedulers() {
        const results = {
            FIFO: fifo([...processes]),
            SJF: sjf([...processes]),
            STCF: stcf([...processes]),
            RR: rr([...processes], 4),
            MLFQ: mlfq([...processes], 4, 8)
        };
        setAllResults(results);
        setShowAll(true);
    }

    function downloadPDF() {
        const doc = new jsPDF();
        doc.text("CPU Scheduling Report", 10, 10);

        doc.text("Generated Processes:", 10, 20);
        processes.forEach((p, i) => {
            doc.text(`${p.id}: Arrival Time = ${p.arrivalTime}, Burst Time = ${p.burstTime}`, 10, 30 + i * 10);
        });

        let yOffset = 70;
        Object.entries(allResults).forEach(([algo, result], index) => {
            if (yOffset > 200) {
                doc.addPage();
                yOffset = 20;
            }
            doc.text(`${algo} Results:`, 10, yOffset);
            result.forEach((r, i) => {
                doc.text(`${r.process} → ${r.startTime} to ${r.endTime}`, 10, yOffset + 10 + i * 10);
            });

            const chartCanvas = chartRefs.current[algo]?.canvas;
            if (chartCanvas) {
                const chartImage = chartCanvas.toDataURL("image/png");
                if (yOffset + 100 > 280) {
                    doc.addPage();
                    yOffset = 20;
                }
                doc.addImage(chartImage, "PNG", 10, yOffset + 20, 180, 80);
                yOffset += 110;
            }
        });
        doc.save("CPU_Scheduling_Report.pdf");
    }

    return (
        <div style={{ padding: "20px" }}>
            <h1>CPU Scheduling Algorithms</h1>

            <label>Number of Processes:</label>
            <input
                type="number"
                value={numProcesses}
                onChange={(e) => setNumProcesses(Number(e.target.value))}
                min="1"
                style={{ marginLeft: "10px", width: "50px" }}
            />
            <button onClick={generateProcesses} style={{ marginLeft: "10px", padding: "5px" }}>
                Generate Processes
            </button>

            <h2>Generated Processes:</h2>
            <ul>
                {processes.map((process) => (
                    <li key={process.id}>
                        {process.id}: Arrival Time = {process.arrivalTime}, Burst Time = {process.burstTime}
                    </li>
                ))}
            </ul>

            <label>Select Algorithm:</label>
            <select value={selectedAlgorithm} onChange={(e) => setSelectedAlgorithm(e.target.value)}>
                <option value="FIFO">First-Come, First-Served (FIFO)</option>
                <option value="SJF">Shortest Job First (SJF)</option>
                <option value="STCF">Shortest Time to Completion (STCF)</option>
                <option value="RR">Round Robin (RR)</option>
                <option value="MLFQ">Multi-Level Feedback Queue</option>
            </select>

            <button onClick={runScheduler} style={{ marginTop: "10px", padding: "10px", cursor: "pointer" }}>
                Run {selectedAlgorithm}
            </button>
            <button onClick={runAllSchedulers} style={{ marginLeft: "10px", padding: "10px", cursor: "pointer" }}>
                Run All Algorithms
            </button>
            <button onClick={downloadPDF} style={{ marginLeft: "10px", padding: "10px", cursor: "pointer" }}>
                Download PDF Report
            </button>

            {!showAll && results.length > 0 && (
                <div>
                    <h2>{selectedAlgorithm} Result</h2>
                    <ul>
                        {results.map((entry, index) => (
                            <li key={index}>
                                {entry.process} → {entry.startTime} to {entry.endTime}
                            </li>
                        ))}
                    </ul>
                    <div style={{ width: "80%", height: "300px" }}>
                        <Bar
                            ref={(el) => (chartRefs.current[selectedAlgorithm] = el)}
                            data={{
                                labels: results.map(entry => entry.process),
                                datasets: [{
                                    label: "Execution Time",
                                    data: results.map(entry => entry.endTime - entry.startTime),
                                    backgroundColor: "rgba(153,102,255,0.6)",
                                    borderColor: "rgba(153,102,255,1)",
                                    borderWidth: 2,
                                    barThickness: 30
                                }]
                            }}
                            options={{ responsive: true, maintainAspectRatio: false }}
                        />
                    </div>
                </div>
            )}

            {showAll && (
                <>
                    <h2>Comparison of All Algorithms</h2>
                    {Object.entries(allResults).map(([algo, result]) => (
                        <div key={algo}>
                            <h3>{algo}</h3>
                            <ul>
                                {result.map((entry, index) => (
                                    <li key={index}>
                                        {entry.process} → {entry.startTime} to {entry.endTime}
                                    </li>
                                ))}
                            </ul>
                            <div style={{ width: "80%", height: "300px" }}>
                                <Bar ref={(el) => (chartRefs.current[algo] = el)} data={{
                                    labels: result.map(entry => entry.process),
                                    datasets: [{
                                        label: "Execution Time",
                                        data: result.map(entry => entry.endTime - entry.startTime),
                                        backgroundColor: "rgba(75,192,192,0.6)",
                                        borderColor: "rgba(75,192,192,1)",
                                        borderWidth: 2,
                                        barThickness: 30
                                    }]
                                }} options={{ responsive: true, maintainAspectRatio: false }} />
                            </div>
                        </div>
                    ))}
                </>
            )}
        </div>
    );
}



// FIFO Algorithm
function fifo(processes) {
    processes.sort((a, b) => a.arrivalTime - b.arrivalTime);
    let time = 0;
    let ganttChart = [];

    processes.forEach((process) => {
        let startTime = Math.max(time, process.arrivalTime);
        let endTime = startTime + process.burstTime;
        ganttChart.push({ process: process.id, startTime, endTime });
        time = endTime;
    });

    return ganttChart;
}

// SJF Algorithm
function sjf(processes) {
    let time = 0;
    let ganttChart = [];
    let remainingProcesses = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime);

    while (remainingProcesses.length > 0) {
        let availableProcesses = remainingProcesses.filter(p => p.arrivalTime <= time);

        if (availableProcesses.length === 0) {
            // If no process is ready, jump to the next process arrival time
            time = remainingProcesses[0].arrivalTime;
            continue;
        }

        // Choose the process with the shortest burst time
        availableProcesses.sort((a, b) => a.burstTime - b.burstTime);
        let process = availableProcesses.shift();

        let startTime = time;
        let endTime = startTime + process.burstTime;
        ganttChart.push({ process: process.id, startTime, endTime });

        remainingProcesses = remainingProcesses.filter(p => p.id !== process.id);

        time = endTime;
    }

    return ganttChart;
}


// STCF Algorithm
function stcf(processes) {
    let time = 0; // Current time
    let ganttChart = [];
    let remainingProcesses = processes.map(p => ({ ...p, remainingTime: p.burstTime })); 
    let currentProcess = null;
    let startTime = 0;

    while (remainingProcesses.some(p => p.remainingTime > 0)) {
        let availableProcesses = remainingProcesses.filter(p => p.arrivalTime <= time && p.remainingTime > 0);

        if (availableProcesses.length === 0) {
            time++; 
            continue;
        }

        // Sort by shortest remaining time 
        availableProcesses.sort((a, b) => a.remainingTime - b.remainingTime || a.arrivalTime - b.arrivalTime);
        let process = availableProcesses[0];

        if (currentProcess !== process.id) {
            
            if (currentProcess !== null) {
                ganttChart.push({ process: currentProcess, startTime, endTime: time });
            }
            
            currentProcess = process.id;
            startTime = time;
        }

        
        time++;
        process.remainingTime--;

        
        if (process.remainingTime === 0) {
            remainingProcesses = remainingProcesses.filter(p => p.id !== process.id);
            ganttChart.push({ process: process.id, startTime, endTime: time }); 
            currentProcess = null;
        }
    }

    return ganttChart;
}

// RR Algorithm
function rr(processes, timeQuantum) {
    let time = 0;
    let ganttChart = [];
    let queue = [];
    let remainingProcesses = processes.map(p => ({ ...p, remainingTime: p.burstTime }));

    // Sort processes by arrival time
    remainingProcesses.sort((a, b) => a.arrivalTime - b.arrivalTime);

    while (remainingProcesses.length > 0 || queue.length > 0) {
        while (remainingProcesses.length > 0 && remainingProcesses[0].arrivalTime <= time) {
            queue.push(remainingProcesses.shift());
        }

        if (queue.length === 0) {
            time = remainingProcesses[0].arrivalTime;
            continue;
        }

        let process = queue.shift();
        let startTime = time;
        let executionTime = Math.min(process.remainingTime, timeQuantum);
        let endTime = startTime + executionTime;

        ganttChart.push({ process: process.id, startTime, endTime });

        time = endTime;
        process.remainingTime -= executionTime;

        if (process.remainingTime > 0) {
            queue.push(process);
        }

        while (remainingProcesses.length > 0 && remainingProcesses[0].arrivalTime <= time) {
            queue.push(remainingProcesses.shift());
        }
    }

    return ganttChart;
}

// MLFQ Algorithm
function mlfq(processes, q1Quantum = 4, q2Quantum = 8) {
    let time = 0;
    let ganttChart = [];

    // Three queues with decreasing priority
    let queue0 = processes.map(p => ({ ...p, remainingTime: p.burstTime }));
    let queue1 = [];
    let queue2 = [];

    while (queue0.length > 0 || queue1.length > 0 || queue2.length > 0) {
        if (queue0.length > 0) {
            let process = queue0.shift();
            let startTime = time;
            let executionTime = Math.min(process.remainingTime, q1Quantum);
            let endTime = startTime + executionTime;

            ganttChart.push({ process: process.id, startTime, endTime });

            time = endTime;
            process.remainingTime -= executionTime;

            if (process.remainingTime > 0) {
                queue1.push(process);
            }
        } else if (queue1.length > 0) {
            let process = queue1.shift();
            let startTime = time;
            let executionTime = Math.min(process.remainingTime, q2Quantum);
            let endTime = startTime + executionTime;

            ganttChart.push({ process: process.id, startTime, endTime });

            time = endTime;
            process.remainingTime -= executionTime;

            if (process.remainingTime > 0) {
                queue2.push(process);
            }
        } else if (queue2.length > 0) {
            let process = queue2.shift();
            let startTime = time;
            let executionTime = process.remainingTime;
            let endTime = startTime + executionTime;

            ganttChart.push({ process: process.id, startTime, endTime });

            time = endTime;
        }
    }

    return ganttChart;
}
