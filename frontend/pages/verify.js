import { useState } from "react";
import api from "../lib/api";

export default function VerifyPage() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const { data } = await api.post("/verify", formData);
      setResult(data);
    } catch (err) {
      setResult({ status: "ERROR — Could not reach backend or file invalid" });
    } finally {
      setLoading(false);
    }
  };

  const isValid = result?.status?.includes("VALID");

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
      <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-lg">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">🔍 Verify Receipt</h1>

        <input
          type="file"
          accept=".pdf,image/*"
          className="w-full mb-4 text-sm"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <button
          onClick={handleVerify}
          disabled={loading || !file}
          className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Verifying..." : "Verify Against Blockchain"}
        </button>

        {result && (
          <div className={`mt-6 rounded-lg p-5 text-sm border shadow-sm ${
            isValid
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}>
            <p className="font-bold text-lg mb-2">{result.status}</p>
            {isValid && (
              <div className="space-y-1 mt-3 pt-3 border-t border-green-200/50">
                <p><span className="font-semibold">Receipt ID:</span> {result.receipt_id}</p>
                <p><span className="font-semibold">Uploaded by:</span> {result.uploader}</p>
              </div>
            )}
            {!isValid && (
              <p className="text-xs text-red-600 mt-2">The file hash did not match any records on the blockchain, indicating it may have been tampered with or not uploaded.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
