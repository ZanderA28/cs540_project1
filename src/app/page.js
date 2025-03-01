"use client";

import Image from "next/image";
import styles from "./page.module.css";
import { useState } from "react";
import { Bar } from 'react-chartjs-2';
import jsPDF from "jspdf";
import "chart.js/auto";

export default function Home() {
    const [processes, setProcesses] = useState([
        { id: "P1", arrivalTime: 0, burstTime: 10 },
        { id: "P2", arrivalTime: 2, burstTime: 5 },
        { id: "P3", arrivalTime: 4, burstTime: 8 },
    ]);
    const [results, setResults] = useState([]);

    function runFIFO() {
        const output = fifo([...processes]); // Run FIFO
        setResults(output);
    }

    return (
        <div style={{ padding: "20px" }}>
            <h1>First-In, First-Out (FIFO) Scheduler</h1>

            <button onClick={runFIFO} style={{ marginTop: "10px", padding: "10px", cursor: "pointer" }}>
                Run FCFS
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

// FIFO Scheduling Algorithm
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
