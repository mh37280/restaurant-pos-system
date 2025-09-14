import React, { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import ReceiptPrintView from "../components/ReceiptPrintView";

export default function PrintReceiptPage() {
    const { state } = useLocation();
    const navigate = useNavigate();
    const printRef = useRef();

    const handlePrint = useReactToPrint({
        contentRef: printRef, // Changed from 'content' to 'contentRef'
        onAfterPrint: () => {
            navigate("/"); // Go back to home after print
        },
    });

    useEffect(() => {
        if (state?.order) {
            setTimeout(() => {
                if (printRef.current) {
                    handlePrint();
                } else {
                    console.warn("printRef is not ready yet");
                }
            }, 100);
        }
    }, [state?.order, handlePrint]);

    if (!state?.order) {
        return <p>No order to print.</p>;
    }

    return (
        <div style={{ position: "absolute", left: "-9999px", top: "-9999px" }}>
            <ReceiptPrintView ref={printRef} order={state.order} />
        </div>
    );
}