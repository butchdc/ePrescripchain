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
        if (response.data.error.includes('Setting not found')) {
          return '';
        }
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
      if (!apiBaseURL) return;

      try {
        const accountsCsv = await fetchSetting('accounts'); // Fetch the accounts setting

        // Decrypt the fetched CSV data
        const decryptedAccountsCsv = decryptValue(accountsCsv);

        // Parse the decrypted CSV data
        const parsedAccounts = decryptedAccountsCsv
          .split('\n') // Split by newline
          .map(line => line.trim()) // Trim whitespace
          .filter(line => line.length > 0) // Filter out empty lines
          .map(line => line.replace("'", '').replace("'", '').replace(",", ''));

        setAccounts(parsedAccounts);
      } catch (error) {
        console.error('Error fetching or processing accounts:', error);
      }
    };

    fetchAccounts();
  }, [fetchSetting, apiBaseURL]);

  const getAccount = (index) => {
    return accounts[index] || 'N/A';
  };

  const formatDate = (dateString) => {
    const [year, month, day] = dateString.split('-');
    return `${year}-${month}-${day}`;
  };

  const copyToClipboard = (rowData) => {
    const csv = rowData.join(';') + '\n';
    navigator.clipboard.writeText(csv).then(() => {
      setCopiedData(csv);
    }, (err) => {
      console.error('Error copying text: ', err);
    });
  };

  return (
    <div className="container mt-2" style={{ backgroundColor: '#FCFFF6', color: '#00558C' }}>
      <h4 className="mb-2 text-center">Sample Accounts</h4>
      
      {/* Error Display */}
      {error && <div className="alert alert-danger">{error}</div>}

      <h5 className="mb-1">Regulatory Authority</h5>
      <table className="table table-striped table-bordered table-sm text-center">
        <thead>
          <tr>
            <th>Account</th>
            <th>Name</th>
            <th>Contact Number</th>
            <th>Contact Email</th>
            <th>Organization</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{getAccount(0)}</td>
            <td>Butch Dela Cruz</td>
            <td>(04) 1234 5678</td>
            <td>butch.delacruz@healthnewzealand.govt.nz</td>
            <td>Health New Zealand</td>
            <td>
              <button className='btn btn-sm m-0' onClick={() => copyToClipboard([
                getAccount(0),
                'Butch Dela Cruz',
                '(04) 1234 5678',
                'butch.delacruz@healthnewzealand.govt.nz',
                'Health New Zealand'
              ])}>Copy</button>
            </td>
          </tr>
        </tbody>
      </table>

      <h5 className="mb-1">Physicians</h5>
      <table className="table table-striped table-bordered table-sm text-center">
        <thead>
          <tr>
            <th>Account</th>
            <th>Name</th>
            <th>Speciality</th>
            <th>Contact Number</th>
            <th>NZMC No</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{getAccount(1)}</td>
            <td>Dr. Emily Smith</td>
            <td>Cardiologist</td>
            <td>(09) 9876 5432</td>
            <td>NZMC123456</td>
            <td>
              <button className='btn btn-sm m-0' onClick={() => copyToClipboard([
                getAccount(1),
                'Dr. Emily Smith',
                'Cardiologist',
                '(09) 9876 5432',
                'NZMC123456'
              ])}>Copy</button>
            </td>
          </tr>
          <tr>
            <td>{getAccount(2)}</td>
            <td>Dr. John Doe</td>
            <td>General Practitioner</td>
            <td>(03) 2345 6789</td>
            <td>NZMC654321</td>
            <td>
              <button className='btn btn-sm m-0' onClick={() => copyToClipboard([
                getAccount(2),
                'Dr. John Doe',
                'General Practitioner',
                '(03) 2345 6789',
                'NZMC654321'
              ])}>Copy</button>
            </td>
          </tr>
        </tbody>
      </table>

      <h5 className="mb-1">Patients</h5>
      <table className="table table-striped table-bordered table-sm text-center">
        <thead>
          <tr>
            <th>Account</th>
            <th>Name</th>
            <th>Address</th>
            <th>Contact Number</th> {/* Added Contact Number column */}
            <th>Gender</th>
            <th>Date of Birth</th>
            <th>NHI No</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{getAccount(3)}</td>
            <td>Jane Doe</td>
            <td>101 Victoria Street West, Auckland 1010</td>
            <td>(09) 1234 5678</td> 
            <td>Female</td>
            <td>{formatDate('1985-03-12')}</td>
            <td>NHI123456</td>
            <td>
              <button className='btn btn-sm m-0' onClick={() => copyToClipboard([
                getAccount(3),
                'Jane Doe',
                '101 Victoria Street West, Auckland 1010',
                '(09) 1234 5678', 
                'Female',
                formatDate('1985-03-12'),
                'NHI123456'
              ])}>Copy</button>
            </td>
          </tr>
          <tr>
            <td>{getAccount(4)}</td>
            <td>Robert Brown</td>
            <td>202 Ponsonby Road, Ponsonby, Auckland 1011</td>
            <td>(03) 2345 6789</td> 
            <td>Male</td>
            <td>{formatDate('1978-07-22')}</td>
            <td>NHI654321</td>
            <td>
              <button className='btn btn-sm m-0' onClick={() => copyToClipboard([
                getAccount(4),
                'Robert Brown',
                '202 Ponsonby Road, Ponsonby, Auckland 1011',
                '(03) 2345 6789', 
                'Male',
                formatDate('1978-07-22'),
                'NHI654321'
              ])}>Copy</button>
            </td>
          </tr>
        </tbody>
      </table>

      <h5 className="mb-1">Pharmacies</h5>
      <table className="table table-striped table-bordered table-sm text-center">
        <thead>
          <tr>
            <th>Account</th>
            <th>Pharmacy Name</th>
            <th>Address</th>
            <th>Contact Person</th>
            <th>Contact Number</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{getAccount(5)}</td>
            <td>Wellington Pharmacy</td>
            <td>303 Great North Road, Auckland</td>
            <td>Sarah Lee</td>
            <td>(04) 5678 1234</td>
            <td>
              <button className='btn btn-sm m-0' onClick={() => copyToClipboard([
                getAccount(5),
                'Wellington Pharmacy',
                '303 Great North Road, Auckland',
                'Sarah Lee',
                '(04) 5678 1234'
              ])}>Copy</button>
            </td>
          </tr>
          <tr>
            <td>{getAccount(6)}</td>
            <td>Auckland Meds</td>
            <td>404 Queen Street, Auckland</td>
            <td>John Smith</td>
            <td>(09) 8765 4321</td>
            <td>
              <button className='btn btn-sm m-0' onClick={() => copyToClipboard([
                getAccount(6),
                'Auckland Meds',
                '404 Queen Street, Auckland',
                'John Smith',
                '(09) 8765 4321'
              ])}>Copy</button>
            </td>
          </tr>
          <tr>
            <td>{getAccount(7)}</td>
            <td>Christchurch Chemists</td>
            <td>505 Victoria Street West, Auckland</td>
            <td>Emily Clark</td>
            <td>(03) 3456 7890</td>
            <td>
              <button className='btn btn-sm m-0' onClick={() => copyToClipboard([
                getAccount(7),
                'Christchurch Chemists',
                '505 Victoria Street West, Auckland',
                'Emily Clark',
                '(03) 3456 7890'
              ])}>Copy</button>
            </td>
          </tr>
          <tr>
            <td>{getAccount(8)}</td>
            <td>Hamilton Pharmacy</td>
            <td>606 Dominion Road, Auckland</td>
            <td>Michael Johnson</td>
            <td>(07) 1234 5678</td>
            <td>
              <button className='btn btn-sm m-0' onClick={() => copyToClipboard([
                getAccount(8),
                'Hamilton Pharmacy',
                '606 Dominion Road, Auckland',
                'Michael Johnson',
                '(07) 1234 5678'
              ])}>Copy</button>
            </td>
          </tr>
        </tbody>
      </table>

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
            <tr>
                <td>Amoxicillin</td>
                <td>Take 500 mg every 8 hours</td>
                <td>30 capsules</td>
                <td>3</td>
            </tr>
            <tr>
                <td>Lisinopril</td>
                <td>Take 10 mg once daily</td>
                <td>30 tablets</td>
                <td>2</td>
            </tr>
            <tr>
                <td>Metformin</td>
                <td>Take 500 mg twice daily</td>
                <td>60 tablets</td>
                <td>2</td>
            </tr>
            <tr>
                <td>Simvastatin</td>
                <td>Take 20 mg at bedtime</td>
                <td>30 tablets</td>
                <td>1</td>
            </tr>
            <tr>
                <td>Sertraline</td>
                <td>Take 50 mg once daily</td>
                <td>30 tablets</td>
                <td>1</td>
            </tr>
            <tr>
                <td>Omeprazole</td>
                <td>Take 20 mg before meals</td>
                <td>30 capsules</td>
                <td>2</td>
            </tr>
            <tr>
                <td>Hydrochlorothiazide</td>
                <td>Take 25 mg once daily</td>
                <td>30 tablets</td>
                <td>1</td>
            </tr>
            <tr>
                <td>Atorvastatin</td>
                <td>Take 40 mg at bedtime</td>
                <td>30 tablets</td>
                <td>1</td>
            </tr>
            <tr>
                <td>Fluoxetine</td>
                <td>Take 20 mg once daily</td>
                <td>30 capsules</td>
                <td>1</td>
            </tr>
            <tr>
                <td>Gabapentin</td>
                <td>Take 300 mg three times daily</td>
                <td>90 capsules</td>
                <td>1</td>
            </tr>
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
