
import React, { useState } from 'react';
import '../../index.css';
import { useDispatch } from 'react-redux';
import {
  setParsedClaims,
  setParseError,
  validateClaimsApi,
  setValidationResults,
} from '../../redux/slices/claimSlice';
import {
  parseCSV,
  validateClaims,
} from '../../utils/parseHelper';
import api from '../../utils/api';

const FileUpload = () => {
  const [dragActive, setDragActive] =
    useState(false);
  const [isUploading, setIsUploading] =
    useState(false);
  const [fileName, setFileName] = useState('');
  const dispatch = useDispatch();

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (
      e.type === 'dragenter' ||
      e.type === 'dragover'
    ) {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (
      e.dataTransfer.files &&
      e.dataTransfer.files[0]
    ) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };


  const transformToApiFormat = (claims) => {
    return claims.map((claim) => ({
      claim_id: claim.claimId,
      codes: claim.procedureCodes,
       patient: {
            reference: claim?.patient?.reference
        },
      modifier:
        claim.modifiers &&
        claim.modifiers.length > 0
          ? typeof claim.modifiers === 'string'
            ? claim.modifiers
            : claim.modifiers[0]
          : '0',
    }));
  };

  const handleFile = (file) => {
    const fileType = file.type;
    const reader = new FileReader();
    setIsUploading(true);
    setFileName(file.name);

    reader.onload = async (e) => {
      try {
        let data;
        if (fileType === 'application/json') {
          data = JSON.parse(e.target.result);
        } else if (fileType === 'text/csv') {
          data = await parseCSV(file);
        } else {
          throw new Error(
            'Unsupported file type. Please upload a JSON or CSV file.'
          );
        }


        const validatedData =
          validateClaims(data);


        dispatch(setParsedClaims(validatedData));


        const apiFormattedData =
          transformToApiFormat(validatedData);
        console.log(
          'Sending to API:',
          apiFormattedData
        );

        try {

          const response =
            await api.validateClaims(
              apiFormattedData
            );
          console.log('API Response:', response);


          dispatch(
            setValidationResults(response)
          );
        } catch (apiError) {
          console.error('API Error:', apiError);
          dispatch(
            setParseError(
              `API Error: ${apiError.message}`
            )
          );
        }

        setIsUploading(false);
      } catch (error) {
        console.error(
          'File processing error:',
          error
        );
        setIsUploading(false);
        dispatch(
          setParseError(
            `Error processing file: ${error.message}`
          )
        );
      }
    };

    reader.readAsText(file);
  };

  return (
    <div
      className={`upload-zone ${dragActive ? 'active' : isUploading ? 'processing' : fileName ? 'success' : ''}`}
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
    >
      {isUploading ? (
        <div>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mb-3"></div>
          <p className="text-blue-600 font-medium">
            Processing {fileName}...
          </p>
        </div>
      ) : fileName ? (
        <div>
          <div className="mb-3 text-green-600"></div>
          <p className="text-green-600 font-medium">
            File processed successfully!
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {fileName}
          </p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setFileName('');
            }}
            style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
          >
            Upload another file
          </button>
        </div>
      ) : (
        <>
          <div className="mb-3 text-blue-500"></div>
          <p className="text-gray-600 mb-2 text-center">
            Drag & drop
            or
            <br />
            click to browse
          </p>
          <input
            type="file"
            id="file-upload"
            style={{ display: 'none' }}
            accept=".json,.csv"
            onChange={handleChange}
          />
          <label
            htmlFor="file-upload"
            className="btn btn-primary"
            style={{ cursor: 'pointer', marginTop: '0.5rem' }}
          >
            Browse Files
          </label>
        </>
      )}
    </div>
  );
};

export default FileUpload;
