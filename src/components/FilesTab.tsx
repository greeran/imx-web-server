import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Table, Form, Alert } from 'react-bootstrap';
import { TabConfig, FileInfo } from '../types';
import { apiService } from '../services/apiService';

interface FilesTabProps {
  config: TabConfig;
}

const FilesTab: React.FC<FilesTabProps> = ({ config }) => {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

  const loadFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const fileList = await apiService.listFiles();
      setFiles(fileList);
    } catch (err) {
      setError('Failed to load files');
      console.error('Error loading files:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(event.target.files);
  };

  const handleUpload = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedFiles || selectedFiles.length === 0) {
      setError('Please select files to upload');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setSuccess(null);

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        await apiService.uploadFile(file);
      }

      setSuccess(`Successfully uploaded ${selectedFiles.length} file(s)`);
      setSelectedFiles(null);
      loadFiles(); // Refresh file list
    } catch (err) {
      setError('Failed to upload files');
      console.error('Error uploading files:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (filename: string) => {
    try {
      await apiService.downloadFile(filename);
    } catch (err) {
      setError(`Failed to download ${filename}`);
      console.error('Error downloading file:', err);
    }
  };

  const handleDelete = async (filename: string) => {
    if (window.confirm(`Are you sure you want to delete ${filename}?`)) {
      try {
        await apiService.deleteFile(filename);
        setSuccess(`Successfully deleted ${filename}`);
        loadFiles(); // Refresh file list
      } catch (err) {
        setError(`Failed to delete ${filename}`);
        console.error('Error deleting file:', err);
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div>
      <Card>
        <Card.Header>
          <h5>
            <i className="fas fa-folder me-2"></i>
            File Management
          </h5>
        </Card.Header>
        <Card.Body>
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError(null)}>
              <i className="fas fa-exclamation-triangle me-2"></i>
              {error}
            </Alert>
          )}

          {success && (
            <Alert variant="success" dismissible onClose={() => setSuccess(null)}>
              <i className="fas fa-check-circle me-2"></i>
              {success}
            </Alert>
          )}

          <Row className="mb-4">
            <Col md={6}>
              <h6>Upload Files</h6>
              <Form onSubmit={handleUpload}>
                <Form.Group className="mb-3">
                  <Form.Control
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    disabled={uploading}
                  />
                </Form.Group>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={!selectedFiles || uploading}
                >
                  {uploading ? (
                    <>
                      <i className="fas fa-spinner fa-spin me-2"></i>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-upload me-2"></i>
                      Upload Files
                    </>
                  )}
                </Button>
              </Form>
            </Col>
            <Col md={6}>
              <h6>File Operations</h6>
              <div className="d-grid gap-2">
                <Button variant="info" onClick={loadFiles} disabled={loading}>
                  <i className="fas fa-list me-2"></i>
                  List Files
                </Button>
                <Button variant="warning" onClick={loadFiles} disabled={loading}>
                  <i className="fas fa-sync-alt me-2"></i>
                  Refresh List
                </Button>
              </div>
            </Col>
          </Row>

          <div className="mt-4">
            <h6>Available Files</h6>
            {loading ? (
              <div className="text-center p-3">
                <i className="fas fa-spinner fa-spin me-2"></i>
                Loading files...
              </div>
            ) : (
              <Table responsive>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Size</th>
                    <th>Modified</th>
                    <th>Type</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((file, index) => (
                    <tr key={index}>
                      <td>{file.name}</td>
                      <td>{formatFileSize(file.size)}</td>
                      <td>{formatDate(file.modified)}</td>
                      <td>{file.type}</td>
                      <td>
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleDownload(file.name)}
                          className="me-2"
                        >
                          <i className="fas fa-download"></i>
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(file.name)}
                        >
                          <i className="fas fa-trash"></i>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default FilesTab; 