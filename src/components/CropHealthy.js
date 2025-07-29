import React, { useState } from 'react';
import './CropHealthy.css';

const getHealthStatus = (result) => {
  if (!result) return null;
  const { HLT, NOT_HLT } = result;
  if (HLT === undefined || NOT_HLT === undefined) return null;
  if (HLT > NOT_HLT) {
    return { label: 'Unhealthy', icon: '❌', color: '#d32f2f', prob: HLT };
  } else {
    return { label: 'Healthy', icon: '✅', color: '#388e3c', prob: NOT_HLT };
  }
};

const CropHealthy = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
    setResult(null);
    setError(null);
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      const response = await fetch('/api/crophealth', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        throw new Error('Server error: ' + response.status);
      }
      const data = await response.json();
      if (data.error) {
        setError(data.error);
      } else if (data.HLT === undefined && data.NOT_HLT === undefined && data.data) {
        // Some APIs wrap result in data
        setResult(data.data);
      } else {
        setResult(data);
      }
    } catch (err) {
      setError('Failed to get prediction. Please try again or check the server.');
    } finally {
      setLoading(false);
    }
  };

  const healthStatus = getHealthStatus(result);

  return (
    <div className="crop-healthy-container">
      <h2>Crop Health Prediction</h2>
      <p className="instructions">Upload a clear image of your crop leaf or plant to check its health status.</p>
      <form onSubmit={handleSubmit} className="crop-healthy-form">
        <input type="file" accept="image/*" onChange={handleFileChange} />
        {previewUrl && (
          <div className="image-preview">
            <img src={previewUrl} alt="Preview" />
          </div>
        )}
        <button type="submit" disabled={!selectedFile || loading}>
          {loading ? 'Predicting...' : 'Predict Health'}
        </button>
      </form>
      {error && <div className="error">{error}</div>}
      {healthStatus && (
        <div className="result" style={{ borderColor: healthStatus.color }}>
          <div className="status-row">
            <span className="status-icon" style={{ color: healthStatus.color }}>{healthStatus.icon}</span>
            <span className="status-label" style={{ color: healthStatus.color }}>{healthStatus.label}</span>
          </div>
          <div className="prob-row">
            Probability: <b>{(healthStatus.prob * 100).toFixed(2)}%</b>
          </div>
        </div>
      )}
      {result && !healthStatus && (
        <div className="result">
          <h3>Raw Prediction Result</h3>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default CropHealthy; 