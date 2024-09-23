import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { decryptValue } from '../utils/apiutils';

const Sample = () => {
  const [accounts, setAccounts] = useState([]);
  const [copiedData, setCopiedData] = useState('');
  const [error, setError] = useState('');

  const apiBaseURL = process.env.REACT_APP_API_BASE_URL;

  const fetchSetting = useCallback(async (key) => {
    if (!apiBaseURL) {
      setError('API base URL is not configured.');
      return '';
    }

    try {
      const response = await axios.get(`${apiBaseURL}settings/${key}`);
      if (response.data.error) {
        setError(`Error: ${response.data.error}`);
        return '';
      }
      return response.data.value || '';
    } catch (error) {
      const message = error.response?.status === 404
        ? `The setting '${key}' was not found.`
        : `Error fetching ${key}: ${error.message}`;
      setError(message);
      return '';
    }
  }, [apiBaseURL]);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const accountsCsv = await fetchSetting('accounts');
        const decryptedAccountsCsv = decryptValue(accountsCsv);
        const parsedAccounts = decryptedAccountsCsv
          .split('\n')
          .map(line => line.trim().replace("'", '').replace("'", '').replace(",", ''))
          .filter(line => line.length > 0);

        setAccounts(parsedAccounts);
      } catch (error) {
        console.error('Error fetching or processing accounts:', error);
      }
    };

    fetchAccounts();
  }, [fetchSetting]);

  const getAccount = (index) => accounts[index] || 'N/A';

  const formatDate = (dateString) => dateString.split('-').join('-');

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedData(text);
    }).catch(err => {
      console.error('Error copying text: ', err);
    });
  };

  const renderTable = (headers, rows) => (
    <table className="table table-striped table-bordered table-sm text-center">
      <thead>
        <tr>
          {headers.map(header => <th key={header}>{header}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={index}>
            {row.map((cell, i) => (
              <td key={i}>
                {cell}
                <button className='btn btn-sm m-0 ms-2' onClick={() => copyToClipboard(cell)}><i class="bi bi-clipboard"></i></button>
              </td>
            ))}
            <td>
              <button className='btn btn-sm m-0' onClick={() => copyToClipboard(row.join(';'))}><i class="bi bi-clipboard"></i></button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const regulatoryAuthorityRows = [
    [getAccount(0), 'Butch Dela Cruz', '(04) 1234 5678', 'butch.delacruz@healthnewzealand.govt.nz', 'Health New Zealand'],
  ];

  const physicianRows = [
    [getAccount(1), 'Dr. Emily Smith', 'Cardiologist', '(09) 9876 5432', 'NZMC123456'],
    [getAccount(2), 'Dr. John Doe', 'General Practitioner', '(09) 8765 4321', 'NZMC654321'],
  ];

  const patientRows = [
    [getAccount(3), 'Jane Doe', '101 Victoria Street, Auckland', '(09) 1234 5678', 'Female', formatDate('1985-03-12'), 'NHI123456'],
    [getAccount(4), 'Robert Brown', '202 Ponsonby Road, Auckland', '(09) 2345 6789', 'Male', formatDate('1978-07-22'), 'NHI654321'],
    [getAccount(5), 'Alice Johnson', '303 Great North Road, Auckland', '(09) 9876 5432', 'Female', formatDate('1990-01-15'), 'NHI789012'],
    [getAccount(6), 'Michael Smith', '404 Queen Street, Auckland', '(09) 8765 4321', 'Male', formatDate('1982-11-30'), 'NHI345678'],
  ];

  const pharmacyRows = [
    [getAccount(7), 'City Pharmacy', '1 Main Street, Auckland', 'Alice White', '(09) 1234 7890'],
    [getAccount(8), 'Greenwoods Pharmacy', '2 River Road, Auckland', 'Bob Green', '(04) 9876 5432'],
  ];

  const drugRows = [
    ['Amoxicillin', 'Take 500 mg every 8 hours', '30 capsules', '3'],
    ['Lisinopril', 'Take 10 mg once daily', '30 tablets', '2'],
    ['Metformin', 'Take 500 mg twice daily', '60 tablets', '2'],
    ['Simvastatin', 'Take 20 mg at bedtime', '30 tablets', '1'],
    ['Sertraline', 'Take 50 mg once daily', '30 tablets', '1'],
    ['Omeprazole', 'Take 20 mg before meals', '30 capsules', '2'],
    ['Hydrochlorothiazide', 'Take 25 mg once daily', '30 tablets', '1'],
    ['Atorvastatin', 'Take 40 mg at bedtime', '30 tablets', '1'],
    ['Fluoxetine', 'Take 20 mg once daily', '30 capsules', '1'],
    ['Gabapentin', 'Take 300 mg three times daily', '90 capsules', '1'],
  ];

  return (
    <div className="container mt-2" style={{ backgroundColor: '#FCFFF6', color: '#00558C' }}>
      <h4 className="mb-2 text-center">Sample Accounts</h4>
      {error && <div className="alert alert-danger">{error}</div>}

      <h5 className="mb-1">Regulatory Authority</h5>
      {renderTable(['Account', 'Name', 'Contact Number', 'Contact Email', 'Organization', 'Action'], regulatoryAuthorityRows)}

      <h5 className="mb-1">Physicians</h5>
      {renderTable(['Account', 'Name', 'Speciality', 'Contact Number', 'NZMC No', 'Action'], physicianRows)}

      <h5 className="mb-1">Patients</h5>
      {renderTable(['Account', 'Name', 'Address', 'Contact Number', 'Gender', 'Date of Birth', 'NHI No', 'Action'], patientRows)}

      <h5 className="mb-1">Pharmacies</h5>
      {renderTable(['Account', 'Pharmacy Name', 'Pharmacy Address', 'Contact Person', 'Contact Number', 'Action'], pharmacyRows)}

      <h5 className="mb-1">Sample Drugs</h5>
      <table className='table table-sm table-striped table-bordered'>
        <thead>
          <tr>
            <th>Drug Name</th>
            <th>Sig</th>
            <th>Mitte</th>
            <th>Repeat</th>
          </tr>
        </thead>
        <tbody>
          {drugRows.map((row, index) => (
            <tr key={index}>
              {row.map((cell, i) => (
                <td key={i}>
                  {cell}
                  <button className='btn btn-sm m-0 ms-2' onClick={() => copyToClipboard(cell)}><i class="bi bi-clipboard"></i></button>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-3">
        <h5>Copied Data</h5>
        <pre>{copiedData}</pre>
      </div>
    </div>
  );
};

export default Sample;
