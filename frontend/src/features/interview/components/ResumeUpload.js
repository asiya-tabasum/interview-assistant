import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useDispatch } from 'react-redux';
import { setResumeData, setCurrentCandidate } from '../interviewSlice';

function ResumeUpload({ onStart }) {
  const dispatch = useDispatch();
  const [error, setError] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [missingFields, setMissingFields] = useState([]);

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      if (file.type === 'application/pdf' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        setUploadedFile(file);
        // Here we would normally send the file to the backend for processing
        // For now, let's simulate missing fields
        setMissingFields(['phone']);
        setFormData({
          name: 'John Doe', // This would come from backend
          email: 'john@example.com', // This would come from backend
          phone: '',
        });
      } else {
        setError('Please upload a PDF or DOCX file');
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    multiple: false,
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate all required fields are filled
    const newMissingFields = Object.entries(formData)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (newMissingFields.length > 0) {
      setError('Please fill in all required fields');
      return;
    }

    // Store the candidate data
    dispatch(setCurrentCandidate(formData));
    dispatch(setResumeData({
      fileName: uploadedFile.name,
      fileType: uploadedFile.type,
      // Add any other relevant data
    }));

    // Start the interview process
    onStart();
  };

  return (
    <div className="max-w-xl mx-auto mt-10">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Upload Your Resume</h2>
        <p className="mt-1 text-gray-600">
          Please upload your resume in PDF or DOCX format to begin the interview
        </p>
      </div>

      {!uploadedFile ? (
        <div
          {...getRootProps()}
          className={`mt-4 border-2 border-dashed rounded-lg p-10 text-center cursor-pointer
            ${isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-500'}`}
        >
          <input {...getInputProps()} />
          <div className="space-y-2">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="text-gray-600">
              Drag and drop your resume here, or click to select a file
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <p className="text-sm text-gray-500 mb-4">
              Resume uploaded: {uploadedFile.name}
            </p>
            {Object.keys(formData).map((field) => (
              <div key={field} className="mt-4">
                <label htmlFor={field} className="block text-sm font-medium text-gray-700 capitalize">
                  {field}
                </label>
                <input
                  type={field === 'email' ? 'email' : 'text'}
                  name={field}
                  id={field}
                  value={formData[field]}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm
                    ${missingFields.includes(field) ? 'border-red-300' : ''}`}
                  placeholder={`Enter your ${field}`}
                  required
                />
              </div>
            ))}
          </div>

          {error && (
            <div className="text-red-500 text-sm mt-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Start Interview
          </button>
        </form>
      )}
    </div>
  );
}

export default ResumeUpload;