import { useState } from 'react';
import { downloadFromIPFS } from '../utils/apiutils'; 

const DownloadFromIPFS = () => {
    const [cid, setCid] = useState('');
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setData(null);

        try {
            const decryptedData = await downloadFromIPFS(cid);
            setData(decryptedData);
        } catch (err) {
            console.error('Error:', err);
            setError('Failed to retrieve or decrypt data from IPFS');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mt-3 bgcolor2">
            <h4 className="">Query IPFS</h4>
            <form onSubmit={handleSubmit} className="form-inline">
                <div className="form-floating mb-3">
                    <input
                        type="text"
                        className="form-control"
                        id="cid"
                        value={cid}
                        onChange={(e) => setCid(e.target.value)}
                        placeholder="IPFS Hash"
                        autoComplete='off'
                        required
                    />
                    <label htmlFor="cid">IPFS Hash</label>
                </div>
                <button type="submit" className="btn btn-sm btn-success ml-2" disabled={loading}>
                    {loading ? 'Loading...' : 'Fetch Details'}
                </button>
            </form>

            {error && <div className="alert alert-danger mt-3" role="alert">{error}</div>}
            {data && (
                <div className="mt-3">
                    <h4>Data:</h4>
                    <pre>{JSON.stringify(data, null, 2)}</pre>
                </div>
            )}
        </div>
    );
};

export default DownloadFromIPFS;
