"use client";

import Image from "next/image";
import styles from "./page.module.css";
import { useState, useEffect } from "react";
import { Bar } from 'react-chartjs-2';
import jsPDF from "jspdf";
import "chart.js/auto";

export default function Home() {
    const [numProcesses, setNumProcesses] = useState(3);
    const [processes, setProcesses] = useState([]);
    const [selectedAlgorithm, setSelectedAlgorithm] = useState("FIFO");
    const [results, setResults] = useState([]);
    const [allResults, setAllResults] = useState({});
    const [animatedResults, setAnimatedResults] = useState([]);
    const [currentStep, setCurrentStep] = useState(0);

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
        animateExecution(output);
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
    }

    function animateExecution(schedule) {
        setAnimatedResults([]);
        setCurrentStep(0);
        schedule.forEach((entry, index) => {
            setTimeout(() => {
                setAnimatedResults((prev) => [...prev, entry]);
                setCurrentStep(index + 1);
            }, index * 1000);
        });
    }

    const chartData = {
        labels: animatedResults.map(entry => entry.process),
        datasets: [
            {
                label: "Execution Time",
                data: animatedResults.map(entry => entry.endTime - entry.startTime),
                backgroundColor: "rgba(75,192,192,0.6)",
                borderColor: "rgba(75,192,192,1)",
                borderWidth: 2,
                barThickness: 30
            }
        ]
    };

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

            <h2>Execution Progress:</h2>
            <progress value={currentStep} max={results.length} style={{ width: "100%" }}></progress>

            <h2>Gantt Chart (Animated)</h2>
            <div style={{ width: "80%", height: "300px" }}>
                <Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>

            <h2>Comparison of All Algorithms:</h2>
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
                </div>
            ))}
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
    let sortedProcesses = [...processes].sort((a, b) => a.burstTime - b.burstTime);
    let currentTime = 0;
    let ganttChart = [];

    for (let process of sortedProcesses) {
        let startTime = currentTime;
        let endTime = startTime + process.burstTime;

        ganttChart.push({ process: process.id, startTime, endTime });

        currentTime = endTime;
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
    let queue = processes.map(p => ({ ...p, remainingTime: p.burstTime })); 

    while (queue.length > 0) {
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
