import { useState } from "react";
import api from "../lib/api";

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [uploader, setUploader] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("uploader", uploader || "anonymous");

    try {
      const { data } = await api.post("/upload", formData);
      setResult(data);
    } catch (err) {
      setResult({ error: "Upload failed. Is the backend running?" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
      <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-lg">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">📄 Upload Receipt</h1>

        <input
          type="text"
          placeholder="Your name"
          className="w-full border rounded-lg p-3 mb-4 text-sm"
          value={uploader}
          onChange={(e) => setUploader(e.target.value)}
        />
        <input
          type="file"
          accept=".pdf,image/*"
          className="w-full mb-4 text-sm"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <button
          onClick={handleUpload}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Uploading..." : "Upload & Store on Blockchain"}
        </button>

        {result && !result.error && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4 text-sm break-all">
            <p className="font-semibold text-green-700 mb-1">✅ Stored on Blockchain</p>
            <p><span className="font-medium">Receipt ID:</span> {result.receipt_id}</p>
            <p><span className="font-medium">Hash:</span> {result.file_hash}</p>
            <img
              src={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/qr/${result.receipt_id}`}
              alt="QR Code"
              className="mt-4 w-36 h-36 mx-auto bg-white p-2 rounded shadow-sm border border-gray-100"
            />
            <p className="text-center text-xs text-gray-400 mt-2">Scan to verify</p>
          </div>
        )}
        {result?.error && (
          <p className="mt-4 text-white bg-red-500 rounded p-3 text-sm">{result.error}</p>
        )}
      </div>
    </div>
  );
}
