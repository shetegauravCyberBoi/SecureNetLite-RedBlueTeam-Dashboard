// frontend/src/pages/ScanHistoryPage.js

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const ScanHistoryPage = () => {
  const [scanHistory, setScanHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      const response = await axios.get("/api/history");
      setScanHistory(response.data);
    } catch (error) {
      console.error("Error fetching scan history:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (scanId) => {
    if (!window.confirm("Are you sure you want to delete this scan?")) return;

    try {
      await axios.delete(`/api/history/${scanId}`);
      fetchHistory(); // refresh
    } catch (error) {
      alert("Failed to delete scan.");
    }
  };

  const downloadPDF = async (scanId) => {
    try {
      const response = await axios.get(`/api/history/${scanId}/pdf`, {
        responseType: "blob",
      });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `ScanReport-${scanId}.pdf`);
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      alert("PDF not available for this scan.");
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  if (loading) return <p className="text-center">Loading...</p>;

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Scan History</h2>
      {scanHistory.length === 0 ? (
        <p>No previous scans found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {scanHistory.map((scan) => (
            <Card key={scan._id} className="shadow-md">
              <CardContent className="space-y-2">
                <h3 className="font-semibold text-lg">{scan.scan_type}</h3>
                <p className="text-sm">Target: {scan.target}</p>
                <p className="text-xs text-gray-500">
                  Date: {new Date(scan.timestamp).toLocaleString()}
                </p>

                <div className="flex gap-2 mt-2">
                  <Button
                    variant="default"
                    onClick={() => downloadPDF(scan._id)}
                  >
                    Download PDF
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleDelete(scan._id)}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ScanHistoryPage;
