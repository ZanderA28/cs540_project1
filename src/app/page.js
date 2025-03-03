"use client";

import Image from "next/image";
import styles from "./page.module.css";
import { useState } from "react";
import { Bar } from 'react-chartjs-2';
import jsPDF from "jspdf";
import "chart.js/auto";

export default function Home() {
    const processes = [
        { id: "P1", arrivalTime: 0, burstTime: 10 },
        { id: "P2", arrivalTime: 2, burstTime: 5 },
        { id: "P3", arrivalTime: 4, burstTime: 8 }
    ];

    const [selectedAlgorithm, setSelectedAlgorithm] = useState("FIFO");
    const [results, setResults] = useState([]);

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
        setResults(output);
    }

    return (
        <div style={{ padding: "20px" }}>
            <h1>CPU Scheduling Algorithms</h1>

            <label>Select Algorithm:</label>
            <select value={selectedAlgorithm} onChange={(e) => setSelectedAlgorithm(e.target.value)}>
                <option value="FIFO">First-Come, First-Served (FIFO)</option>
                <option value="SJF">Shortest Job First (SJF)</option>
                <option value="STCF">Shortest Time to Completion (STCF)</option>
            </select>

            <button onClick={runScheduler} style={{ marginTop: "10px", padding: "10px", cursor: "pointer" }}>
                Run {selectedAlgorithm}
            </button>

            <h2>Results:</h2>
            <ul>
                {results.map((entry, index) => (
                    <li key={index}>
                        {entry.process} → {entry.startTime} to {entry.endTime}
                    </li>
                ))}
            </ul>
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



