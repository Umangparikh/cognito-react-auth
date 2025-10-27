// FileUpload.js
import React, { useState } from "react";
import { Storage, Amplify } from "aws-amplify";
import awsmobile from "./aws-exports";

Amplify.configure(awsmobile);

const FileUpload = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [fileUrl, setFileUrl] = useState("");

  // Handle file selection
  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setMessage("");
      setFileUrl("");
    }
  };

  // Upload file to S3
  const handleUpload = async () => {
    if (!file) {
      setMessage("Please select a file first");
      return;
    }

    setUploading(true);
    setMessage("");

    try {
      const result = await Storage.put(file.name, file, {
        contentType: file.type,
      });

      // Get the file URL
      const url = await Storage.get(result.key);

      setFileUrl(url);
      setMessage("File uploaded successfully!");
    } catch (err) {
      console.error("Upload error:", err);
      setMessage("File upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "20px auto", textAlign: "center" }}>
      <h2>Upload File to S3</h2>
      <input type="file" onChange={handleFileChange} />
      <br />
      <button onClick={handleUpload} disabled={uploading} style={{ marginTop: "10px" }}>
        {uploading ? "Uploading..." : "Upload"}
      </button>

      {message && <p style={{ marginTop: "10px" }}>{message}</p>}

      {fileUrl && (
        <div>
          <p>File URL:</p>
          <a href={fileUrl} target="_blank" rel="noopener noreferrer">
            {fileUrl}
          </a>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
