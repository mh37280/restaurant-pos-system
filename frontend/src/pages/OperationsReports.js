import React, { useState, useEffect } from "react";
import BackButton from "../components/BackButton";
import { useRef } from "react";
import { useReactToPrint } from "react-to-print";

function OperationReports() {
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [reportData, setReportData] = useState({});
    const [orderDetails, setOrderDetails] = useState([]);
    const [loading, setLoading] = useState(false);
    const printRef = useRef();

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Operations_Report_${startDate}_to_${endDate}`,
        onBeforeGetContent: () => {
            if (!printRef.current) {
                console.error("Print ref is not attached");
                return Promise.reject("No content to print");
            }
            console.log("Print ref content:", printRef.current);
            return Promise.resolve();
        }
    });

    // Set default dates on component mount
    useEffect(() => {
        const today = new Date();
        // const sevenDaysAgo = new Date(today);
        // sevenDaysAgo.setDate(today.getDate() - 7);

        setEndDate(today.toISOString().split('T')[0]);
        setStartDate(today.toISOString().split('T')[0]);
    }, []);
    const shiftDates = (days) => {
        const newStart = new Date(startDate);
        const newEnd = new Date(endDate);

        newStart.setDate(newStart.getDate() + days);
        newEnd.setDate(newEnd.getDate() + days);

        setStartDate(newStart.toISOString().split("T")[0]);
        setEndDate(newEnd.toISOString().split("T")[0]);
    };

    const setQuickFilter = (days) => {
        const today = new Date();
        const startDate = new Date(today);

        if (days === 1) {
            // For yesterday, set both start and end to yesterday
            startDate.setDate(today.getDate() - 1);
            setStartDate(startDate.toISOString().split('T')[0]);
            setEndDate(startDate.toISOString().split('T')[0]);
        } else if (days === 0) {
            // For today, set both start and end to today
            setStartDate(today.toISOString().split('T')[0]);
            setEndDate(today.toISOString().split('T')[0]);
        } else {
            // For multi-day ranges, keep original logic
            startDate.setDate(today.getDate() - days);
            setStartDate(startDate.toISOString().split('T')[0]);
            setEndDate(today.toISOString().split('T')[0]);
        }
    };

    const fetchReports = () => {
        if (!startDate || !endDate) return;

        setLoading(true);

        // Fetch both settlement data and detailed order data
        Promise.all([
            fetch(`/api/settlements?start=${startDate}&end=${endDate}`).then(res => res.json()),
            fetch(`/api/orders?start=${startDate}&end=${endDate}`).then(res => res.json())
        ])
            .then(([settlementData, ordersData]) => {
                setReportData(settlementData);
                setOrderDetails(ordersData);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Failed to fetch reports:", err);
                setLoading(false);
            });
    };

    // Auto-fetch when dates change
    useEffect(() => {
        if (startDate && endDate) {
            fetchReports();
        }
    }, [startDate, endDate]);

    // Calculate summary metrics
    const calculateSummary = () => {
        let totalRevenue = 0;
        const paymentMethods = { cash: 0, card: 0 };

        Object.entries(reportData).forEach(([date, methods]) => {
            const cash = parseFloat(methods.cash || 0);
            const card = parseFloat(methods.card || 0);
            paymentMethods.cash += cash;
            paymentMethods.card += card;
            totalRevenue += cash + card;
        });

        const totalOrders = orderDetails.length;
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        const ordersByType = orderDetails.reduce((acc, order) => {
            acc[order.order_type] = (acc[order.order_type] || 0) + 1;
            return acc;
        }, {});

        const revenueByType = orderDetails.reduce((acc, order) => {
            const type = order.order_type;
            acc[type] = (acc[type] || 0) + Number(order.total || 0);
            return acc;
        }, {});

        return {
            totalRevenue,
            totalOrders,
            avgOrderValue,
            ordersByType,
            revenueByType,
            paymentMethods,
            dateRange: Object.keys(reportData).length
        };
    };


    // Find peak day
    const getPeakDay = () => {
        let peakDay = null;
        let peakAmount = 0;

        Object.entries(reportData).forEach(([date, methods]) => {
            const dayTotal = Object.values(methods).reduce((sum, amount) => sum + Number(amount || 0), 0);
            if (dayTotal > peakAmount) {
                peakAmount = dayTotal;
                peakDay = date;
            }
        });

        return { peakDay, peakAmount };
    };

    const summary = calculateSummary();
    const { peakDay, peakAmount } = getPeakDay();

    return (
        <div style={{ padding: 24, fontFamily: "Arial", backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
            <h1 style={{ color: "#333", marginBottom: 8 }}>📊 Operation Reports</h1>
            <BackButton />

            {/* Quick Filter Buttons */}
            <div style={{ margin: "20px 0", display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <button onClick={() => setQuickFilter(0)} style={quickFilterBtn}>Today</button>
                <button onClick={() => setQuickFilter(1)} style={quickFilterBtn}>Yesterday</button>
                <button onClick={() => setQuickFilter(7)} style={quickFilterBtn}>Last 7 Days</button>
                <button onClick={() => setQuickFilter(30)} style={quickFilterBtn}>Last 30 Days</button>
                <button onClick={() => setQuickFilter(90)} style={quickFilterBtn}>Last 90 Days</button>
            </div>

            {/* Date Picker Section */}
            <div style={{
                backgroundColor: "white",
                padding: 20,
                borderRadius: 8,
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                marginBottom: 20,
                display: "flex",
                alignItems: "center",
                gap: "16px",
                flexWrap: "wrap"
            }}>
                <div>
                    <label style={{ display: "block", marginBottom: 4, fontWeight: "bold", color: "#555" }}>
                        Start Date:
                    </label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        style={dateInput}
                    />
                </div>

                <div>
                    <label style={{ display: "block", marginBottom: 4, fontWeight: "bold", color: "#555" }}>
                        End Date:
                    </label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        style={dateInput}
                    />
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                    <button
                        onClick={() => shiftDates(-1)}
                        style={{ ...baseButtonStyle, backgroundColor: "#6c757d" }}
                    >
                        ⬅️ Previous Day
                    </button>
                    <button
                        onClick={() => shiftDates(1)}
                        style={{ ...baseButtonStyle, backgroundColor: "#6c757d" }}
                    >
                        Next Day ➡️
                    </button>
                    <button
                        onClick={fetchReports}
                        style={{ ...baseButtonStyle, backgroundColor: "#28a745" }}
                    >
                        🔄 Refresh Report
                    </button>
                    <button
                        onClick={handlePrint}
                        style={{
                            ...baseButtonStyle, backgroundColor: "#ffc107",

                        }}
                    >
                        🖨️ Print Report
                    </button>
                </div>


            </div>

            {loading && <p style={{ textAlign: "center", fontSize: 18 }}>Loading report...</p>}

            {!loading && Object.keys(reportData).length === 0 && (
                <p style={{ fontStyle: "italic", textAlign: "center", fontSize: 16 }}>
                    Select a date range to generate your report.
                </p>
            )}

            {!loading && Object.keys(reportData).length > 0 && (
                <div>
                    {/* Summary Cards */}
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                        gap: "16px",
                        marginBottom: 30
                    }}>
                        <div style={summaryCard}>
                            <h3 style={cardTitle}>💰 Total Revenue</h3>
                            <p style={cardValue}>${summary.totalRevenue.toFixed(2)}</p>
                        </div>

                        <div style={summaryCard}>
                            <h3 style={cardTitle}>📦 Total Orders</h3>
                            <p style={cardValue}>{summary.totalOrders}</p>
                        </div>

                        <div style={summaryCard}>
                            <h3 style={cardTitle}>📊 Avg Order Value</h3>
                            <p style={cardValue}>${summary.avgOrderValue.toFixed(2)}</p>
                        </div>

                        <div style={summaryCard}>
                            <h3 style={cardTitle}>📅 Days Analyzed</h3>
                            <p style={cardValue}>{summary.dateRange}</p>
                        </div>
                    </div>

                    {/* Peak Day Highlight */}
                    {peakDay && (
                        <div style={{
                            ...summaryCard,
                            backgroundColor: "#fff3cd",
                            borderLeft: "4px solid #ffc107",
                            marginBottom: 20
                        }}>
                            <h3 style={cardTitle}>🏆 Peak Day</h3>
                            <p style={{ margin: 0, fontSize: 16 }}>
                                <strong>{new Date(peakDay).toLocaleDateString()}</strong> - ${peakAmount.toFixed(2)}
                            </p>
                        </div>
                    )}
                    <div ref={printRef}>

                        {/* Order Type Breakdown */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: 30 }}>
                            <div style={summaryCard}>
                                <h3 style={cardTitle}>🚗 Orders by Type</h3>
                                {Object.entries(summary.ordersByType).map(([type, count]) => (
                                    <div key={type} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                        <span style={{ textTransform: "capitalize" }}>
                                            {type.replace("_", " ")}:
                                        </span>
                                        <strong>{count}</strong>
                                    </div>
                                ))}
                            </div>

                            <div style={summaryCard}>
                                <h3 style={cardTitle}>💳 Revenue by Payment</h3>
                                {Object.entries(summary.paymentMethods).map(([method, amount]) => (
                                    <div key={method} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                        <span style={{ textTransform: "capitalize" }}>{method}:</span>
                                        <strong>${Number(amount).toFixed(2)}</strong>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Revenue by Order Type */}
                        <div style={{ ...summaryCard, marginBottom: 30 }}>
                            <h3 style={cardTitle}>💰 Revenue by Order Type</h3>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                                {Object.entries(summary.revenueByType).map(([type, revenue]) => (
                                    <div key={type} style={{ textAlign: "center", padding: 16, backgroundColor: "#f8f9fa", borderRadius: 8 }}>
                                        <div style={{ fontSize: 14, color: "#666", textTransform: "capitalize", marginBottom: 4 }}>
                                            {type.replace("_", " ")}
                                        </div>
                                        <div style={{ fontSize: 24, fontWeight: "bold", color: "#28a745" }}>
                                            ${Number(revenue).toFixed(2)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    {/* Daily Breakdown */}
                    <div style={summaryCard}>
                        <h3 style={cardTitle}>📅 Daily Breakdown</h3>
                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead>
                                    <tr>
                                        <th style={tableHeader}>Date</th>
                                        {Object.keys(summary.paymentMethods).map(method => (
                                            <th key={method} style={tableHeader}>
                                                {method.charAt(0).toUpperCase() + method.slice(1)}
                                            </th>
                                        ))}
                                        <th style={tableHeader}>Daily Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(reportData)
                                        .sort(([a], [b]) => new Date(b) - new Date(a))
                                        .map(([date, methods]) => {
                                            const dailyTotal = (parseFloat(methods.cash || 0) + parseFloat(methods.card || 0));
                                            return (
                                                <tr key={date} style={{ backgroundColor: date === peakDay ? "#fff3cd" : "transparent" }}>
                                                    <td style={tableCell}>
                                                        {new Date(date).toLocaleDateString()}
                                                        {date === peakDay && <span style={{ marginLeft: 8, fontSize: 12 }}>🏆</span>}
                                                    </td>
                                                    {Object.keys(summary.paymentMethods).map(method => (
                                                        <td key={method} style={tableCell}>
                                                            ${Number(methods[method] || 0).toFixed(2)}
                                                        </td>
                                                    ))}
                                                    <td style={{ ...tableCell, fontWeight: "bold", backgroundColor: "#e8f5e8" }}>
                                                        ${dailyTotal.toFixed(2)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const quickFilterBtn = {
    padding: "8px 16px",
    backgroundColor: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500"
};

const dateInput = {
    padding: "8px 12px",
    border: "2px solid #dee2e6",
    borderRadius: "4px",
    fontSize: "14px",
    width: "150px"
};

const summaryCard = {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 8,
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
};

const cardTitle = {
    margin: "0 0 12px 0",
    fontSize: 16,
    color: "#666",
    fontWeight: "600"
};

const cardValue = {
    margin: 0,
    fontSize: 28,
    fontWeight: "bold",
    color: "#333"
};
const baseButtonStyle = {
    padding: "12px 24px",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
    marginTop: "20px"
};

const tableHeader = {
    borderBottom: "2px solid #dee2e6",
    padding: "12px 8px",
    textAlign: "left",
    backgroundColor: "#f8f9fa",
    fontWeight: "600"
};

const tableCell = {
    borderBottom: "1px solid #dee2e6",
    padding: "10px 8px"
};

export default OperationReports;